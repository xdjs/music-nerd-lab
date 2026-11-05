-- Music Nerd roles are authoritative; no client-supplied role claims.
create or replace function mn_private.is_moderator() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and (exists(select 1 from public.users where id=auth.uid() and not coalesce(is_hidden,false) and (is_admin or is_super_admin)) or exists(select 1 from mn_private.moderators where user_id=auth.uid()));
$$;
create function mn_private.is_publisher() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and (mn_private.is_moderator() or exists(select 1 from public.users where id=auth.uid() and is_white_listed and not coalesce(is_hidden,false)));
$$;
revoke all on function mn_private.is_publisher() from public;
grant execute on function mn_private.is_publisher() to mnweb;
alter policy apps_create on public.mn_apps with check(owner_id=(select auth.uid()) and exists(select 1 from public.mn_profiles where id=creator and user_id=(select auth.uid())) and kind='external' and (status in ('draft','pending') or (status='published' and (select mn_private.is_publisher()))));
create or replace function mn_private.guard_app() returns trigger language plpgsql security invoker set search_path='' as $$begin
 if tg_op='UPDATE' and (new.id<>old.id or (new.owner_id is distinct from old.owner_id and current_user not in ('postgres','supabase_admin')) or new.creator<>old.creator or new.kind<>old.kind) then raise exception 'App identity cannot be changed';end if;
 if not mn_private.is_moderator() and auth.uid() is not null then
  if tg_op='UPDATE' and old.status='archived' and new.status<>'archived' then raise exception 'Ask an admin to restore this protocol';end if;
  if new.status not in ('draft','pending','archived') and not(new.status='published' and mn_private.is_publisher()) then raise exception 'Publishing requires a whitelisted account or admin review';end if;
  if tg_op='INSERT' and new.review_note<>'' then raise exception 'Only moderators can add review notes';end if;
  if tg_op='UPDATE' and new.review_note is distinct from old.review_note then raise exception 'Only moderators can change review notes';end if;
  new.review_note='';
  if new.kind<>'external' then raise exception 'Submissions must link to an external app';end if;
 end if;
 new.updated_at=now();return new;end$$;
