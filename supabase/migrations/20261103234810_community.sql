-- Dedicated Music Nerd Apps tables; no changes to other Music Nerd products.
create schema if not exists mn_private;
revoke all on schema mn_private from public;
create table mn_private.moderators(user_id uuid primary key references auth.users(id));
alter table mn_private.moderators enable row level security;
create function mn_private.is_moderator() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from mn_private.moderators where user_id=auth.uid());
$$;
revoke all on function mn_private.is_moderator() from public;
grant usage on schema mn_private to authenticated,anon;
grant execute on function mn_private.is_moderator() to authenticated,anon;
create function public.mn_is_moderator() returns boolean language sql stable security invoker set search_path='' as $$select mn_private.is_moderator()$$;
revoke all on function public.mn_is_moderator() from public;
grant execute on function public.mn_is_moderator() to authenticated;
create table public.mn_profiles(
 id text primary key check(id ~ '^[a-z][a-z0-9-]{2,29}$' and id not in ('you','creators','following','saved','review','apps','auth','api')),
 user_id uuid unique references auth.users(id), name text not null check(length(trim(name)) between 1 and 60),
 bio text not null default '' check(length(bio)<=500), site text not null default '' check(site='' or site ~ '^https://'),
 avatar text not null default '' check(avatar='' or avatar ~ '^https://'), banner text not null default '' check(banner='' or banner ~ '^https://'),
 created_at timestamptz not null default now()
);
create table public.mn_apps(
 id text primary key, creator text not null references public.mn_profiles(id), owner_id uuid references auth.users(id),
 name text not null check(length(trim(name)) between 1 and 60), description text not null check(length(trim(description)) between 1 and 180),
 about text not null check(length(trim(about)) between 1 and 3000), url text not null default '' check(url='' or url ~ '^https://'),
 screenshot text not null check(screenshot ~ '^https://' or screenshot ~ '^/[^/]'), category text not null check(category in ('Discover','Make music','Sound toys','Tools')),
 kind text not null default 'external' check(kind in ('external','sequencer','chords','tempo')),
 status text not null default 'draft' check(status in ('draft','pending','published','changes_requested','archived')),
 price text not null default 'Unknown' check(price in ('Free','Paid','Freemium','Unknown')),
 account_required boolean default null, permissions text[] not null default '{}' check(permissions <@ array['camera','microphone']),
 embed_mode text not null default 'external' check(embed_mode in ('embedded','external')),
 review_note text not null default '' check(length(review_note)<=1000), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.mn_comments(
 id uuid primary key default gen_random_uuid(),app text not null references public.mn_apps(id),parent uuid references public.mn_comments(id),
 author text not null references public.mn_profiles(id),user_id uuid not null references auth.users(id), name text not null,
 text text not null check(length(trim(text)) between 1 and 1000),status text not null default 'visible' check(status in ('visible','deleted','hidden')),
 created_at timestamptz not null default now()
);
create table public.mn_activity(user_id uuid not null references auth.users(id),app text not null references public.mn_apps(id),kind text not null check(kind in ('saved','liked')),primary key(user_id,app,kind));
create table public.mn_follows(user_id uuid not null references auth.users(id),creator text not null references public.mn_profiles(id),primary key(user_id,creator));
create table public.mn_reports(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id),target_type text not null check(target_type in ('app','comment')),target text not null,reason text not null check(length(trim(reason)) between 1 and 1000),status text not null default 'open' check(status in ('open','resolved')),created_at timestamptz not null default now());
create index on public.mn_apps(creator,status);create index on public.mn_apps(owner_id);create index on public.mn_comments(app,created_at);create index on public.mn_comments(parent);create index on public.mn_comments(user_id);create index on public.mn_follows(creator);create index on public.mn_reports(status);
-- Stable ownership and moderation-only publishing.
create function mn_private.guard_profile() returns trigger language plpgsql security invoker set search_path='' as $$begin
 if new.id<>old.id or (new.user_id is distinct from old.user_id and current_user not in ('postgres','supabase_admin')) then raise exception 'Profile identity cannot be changed';end if;return new;end$$;
create trigger mn_guard_profile before update on public.mn_profiles for each row execute function mn_private.guard_profile();
create function mn_private.guard_app() returns trigger language plpgsql security invoker set search_path='' as $$begin
 if tg_op='UPDATE' and (new.id<>old.id or (new.owner_id is distinct from old.owner_id and current_user not in ('postgres','supabase_admin')) or new.creator<>old.creator or new.kind<>old.kind) then raise exception 'App identity cannot be changed';end if;
 if not mn_private.is_moderator() and auth.uid() is not null then
  if new.status not in ('draft','pending','archived') then raise exception 'Only moderators can publish';end if;
  if tg_op='INSERT' and new.review_note<>'' then raise exception 'Only moderators can add review notes';end if;
  if tg_op='UPDATE' and new.review_note is distinct from old.review_note then raise exception 'Only moderators can change review notes';end if;
  new.review_note='';
  if new.kind<>'external' then raise exception 'Submissions must link to an external app';end if;
 end if;
 new.updated_at=now();return new;end$$;
create trigger mn_guard_app before insert or update on public.mn_apps for each row execute function mn_private.guard_app();
create function mn_private.guard_comment() returns trigger language plpgsql security invoker set search_path='' as $$declare p public.mn_comments;begin
 if tg_op='INSERT' then
  if new.status<>'visible' then raise exception 'Invalid comment status';end if;
  if new.parent is not null then select * into p from public.mn_comments where id=new.parent;
   if p.id is null or p.app<>new.app or p.parent is not null or p.status<>'visible' then raise exception 'Reply must target a visible top-level comment on this app';end if;
  end if;
  if exists(select 1 from public.mn_comments where user_id=auth.uid() and created_at>now()-interval '5 seconds') then raise exception 'Please wait a few seconds before posting again';end if;
  select name into new.name from public.mn_profiles where id=new.author;
 else
  if new.id<>old.id or new.user_id<>old.user_id or new.author<>old.author or new.app<>old.app or new.parent is distinct from old.parent or new.name<>old.name or new.created_at<>old.created_at then raise exception 'Comment identity cannot be changed';end if;
  if not mn_private.is_moderator() and (new.status<>'deleted' or new.text<>'[Deleted]') then raise exception 'You can only delete your own comment';end if;
 end if;return new;end$$;
create trigger mn_guard_comment before insert or update on public.mn_comments for each row execute function mn_private.guard_comment();
-- Revoke default privileges before granting the operations the product needs.
revoke all on public.mn_profiles,public.mn_apps,public.mn_comments,public.mn_activity,public.mn_follows,public.mn_reports from anon,authenticated;
alter table public.mn_profiles enable row level security;alter table public.mn_apps enable row level security;alter table public.mn_comments enable row level security;alter table public.mn_activity enable row level security;alter table public.mn_follows enable row level security;alter table public.mn_reports enable row level security;
grant select on public.mn_profiles,public.mn_apps,public.mn_comments,public.mn_follows to anon,authenticated;
grant insert,update on public.mn_profiles,public.mn_apps,public.mn_comments to authenticated;
grant select,insert,delete on public.mn_activity,public.mn_follows to authenticated;
grant select,insert,update on public.mn_reports to authenticated;
create policy profiles_read on public.mn_profiles for select to anon,authenticated using(true);
create policy profiles_create on public.mn_profiles for insert to authenticated with check(user_id=(select auth.uid()));
create policy profiles_edit on public.mn_profiles for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy apps_read on public.mn_apps for select to anon,authenticated using(status='published' or owner_id=(select auth.uid()) or (select mn_private.is_moderator()));
create policy apps_create on public.mn_apps for insert to authenticated with check(owner_id=(select auth.uid()) and exists(select 1 from public.mn_profiles where id=creator and user_id=(select auth.uid())) and kind='external' and status in ('draft','pending'));
create policy apps_edit on public.mn_apps for update to authenticated using(owner_id=(select auth.uid()) or (select mn_private.is_moderator())) with check((owner_id=(select auth.uid()) and exists(select 1 from public.mn_profiles where id=creator and user_id=(select auth.uid()))) or (select mn_private.is_moderator()));
create policy comments_read on public.mn_comments for select to anon,authenticated using((status in ('visible','deleted') and exists(select 1 from public.mn_apps where id=app and status='published')) or user_id=(select auth.uid()) or (select mn_private.is_moderator()));
create policy comments_create on public.mn_comments for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.mn_profiles where id=author and user_id=(select auth.uid())) and exists(select 1 from public.mn_apps where id=app and status='published'));
create policy comments_edit on public.mn_comments for update to authenticated using(user_id=(select auth.uid()) or (select mn_private.is_moderator())) with check(user_id=(select auth.uid()) or (select mn_private.is_moderator()));
create policy activity_read on public.mn_activity for select to authenticated using(user_id=(select auth.uid()));
create policy activity_create on public.mn_activity for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.mn_apps where id=app and status='published'));
create policy activity_delete on public.mn_activity for delete to authenticated using(user_id=(select auth.uid()));
create policy follows_read on public.mn_follows for select to anon,authenticated using(true);
create policy follows_create on public.mn_follows for insert to authenticated with check(user_id=(select auth.uid()) and not exists(select 1 from public.mn_profiles where id=creator and user_id=(select auth.uid())));
create policy follows_delete on public.mn_follows for delete to authenticated using(user_id=(select auth.uid()));
create policy reports_read on public.mn_reports for select to authenticated using(user_id=(select auth.uid()) or (select mn_private.is_moderator()));
create policy reports_create on public.mn_reports for insert to authenticated with check(user_id=(select auth.uid()) and status='open' and ((target_type='app' and exists(select 1 from public.mn_apps where id=target and status='published')) or (target_type='comment' and exists(select 1 from public.mn_comments where id::text=target and status='visible'))));
create policy reports_edit on public.mn_reports for update to authenticated using((select mn_private.is_moderator())) with check((select mn_private.is_moderator()));
