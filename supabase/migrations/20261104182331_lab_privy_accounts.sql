-- Lab owners are the same users as Music Nerd Web. No users exist in Supabase Auth.
-- Fail rather than silently remap an existing Lab identity.
do $$begin
 if exists(select 1 from public.mn_profiles where user_id is not null) or exists(select 1 from public.mn_apps where owner_id is not null) or exists(select 1 from public.mn_comments) or exists(select 1 from public.mn_activity) or exists(select 1 from public.mn_follows) or exists(select 1 from public.mn_reports) or exists(select 1 from mn_private.moderators) then raise exception 'Review existing Lab identities before migrating';end if;
end$$;
alter table public.mn_profiles drop constraint mn_profiles_user_id_fkey, add constraint mn_profiles_user_id_fkey foreign key(user_id) references public.users(id);
alter table public.mn_apps drop constraint mn_apps_owner_id_fkey, add constraint mn_apps_owner_id_fkey foreign key(owner_id) references public.users(id);
alter table public.mn_comments drop constraint mn_comments_user_id_fkey, add constraint mn_comments_user_id_fkey foreign key(user_id) references public.users(id);
alter table public.mn_activity drop constraint mn_activity_user_id_fkey, add constraint mn_activity_user_id_fkey foreign key(user_id) references public.users(id);
alter table public.mn_follows drop constraint mn_follows_user_id_fkey, add constraint mn_follows_user_id_fkey foreign key(user_id) references public.users(id);
alter table public.mn_reports drop constraint mn_reports_user_id_fkey, add constraint mn_reports_user_id_fkey foreign key(user_id) references public.users(id);
alter table mn_private.moderators drop constraint moderators_user_id_fkey, add constraint moderators_user_id_fkey foreign key(user_id) references public.users(id);
-- Verified server requests use the existing mnweb role, with transaction-local user claims.
-- No public API can set these claims. Preserve all ownership/review predicates.
do $$declare p record; begin
 for p in select schemaname,tablename,policyname,roles from pg_policies where schemaname='public' and tablename in ('mn_profiles','mn_apps','mn_comments','mn_activity','mn_follows','mn_reports') loop
  if 'authenticated'=any(p.roles) then
   execute format('alter policy %I on %I.%I to %s',p.policyname,p.schemaname,p.tablename,case when 'anon'=any(p.roles) then 'anon,mnweb' else 'mnweb' end);
  end if;
 end loop;
end$$;
revoke insert,update,delete on public.mn_profiles,public.mn_apps,public.mn_comments,public.mn_activity,public.mn_follows,public.mn_reports from authenticated;
grant select,insert,update on public.mn_profiles,public.mn_apps,public.mn_comments to mnweb;
grant select,insert,delete on public.mn_activity,public.mn_follows to mnweb;
grant select,insert,update on public.mn_reports to mnweb;
grant usage on schema mn_private to mnweb;
grant execute on function mn_private.is_moderator() to mnweb;
-- Uploads remain immutable. Small covers are served through the Lab media endpoint.
create table public.mn_media(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.users(id),content_type text not null check(content_type in ('image/png','image/jpeg','image/webp')),data bytea not null check(octet_length(data) between 1 and 3145728),created_at timestamptz not null default now());
alter table public.mn_media enable row level security;
revoke all on public.mn_media from anon,authenticated;
grant select,insert on public.mn_media to mnweb;
create policy media_read on public.mn_media for select to mnweb using(true);
create policy media_upload on public.mn_media for insert to mnweb with check(user_id=(select auth.uid()));
create index mn_media_user_id on public.mn_media(user_id);
