-- Shared identity is owned by Music Nerd; Lab-only profile fields remain untouched.
-- These private trigger functions are not RPCs. Definer rights allow synchronization
-- for public readers without granting access to private account columns.
create function mn_private.account_display_name(value text) returns text
language sql immutable set search_path='' as $$
 select case when value is null or trim(value)='' or position('@' in value)>0
 then 'Music Nerd member' else left(trim(value),60) end
$$;
revoke all on function mn_private.account_display_name(text) from public,anon,authenticated;
create function mn_private.use_account_name() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.user_id is not null then
  select mn_private.account_display_name(username) into new.name from public.users where id=new.user_id;
 end if;
 return new;
end $$;
revoke all on function mn_private.use_account_name() from public,anon,authenticated;
create trigger mn_use_account_name before insert or update on public.mn_profiles
for each row execute function mn_private.use_account_name();
create function mn_private.sync_account_name() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 update public.mn_profiles set name=mn_private.account_display_name(new.username) where user_id=new.id;
 return new;
end $$;
revoke all on function mn_private.sync_account_name() from public,anon,authenticated;
create trigger mn_sync_account_name after update of username on public.users
for each row when (old.username is distinct from new.username) execute function mn_private.sync_account_name();
update public.mn_profiles p set name=mn_private.account_display_name(u.username)
from public.users u where p.user_id=u.id;
