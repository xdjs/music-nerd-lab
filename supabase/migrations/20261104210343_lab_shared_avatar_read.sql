-- Only avatars belonging to active, public Lab creators may be read anonymously.
-- Account metadata stays private. No bucket-wide public flag or write grants.
create function mn_private.is_public_creator_avatar(object_name text) returns boolean
language sql stable security definer set search_path='' as $$
 select exists (
  select 1 from public.mn_profiles p join public.users u on u.id=p.user_id
  where u.is_hidden is not true and (
   object_name=u.id::text||'/avatar.webp'
   or (u.privy_user_id is not null and object_name='identity-'||
    encode(extensions.digest(u.privy_user_id,'sha256'),'hex')||'/avatar.webp')
  )
 )
$$;
revoke all on function mn_private.is_public_creator_avatar(text) from public;
grant execute on function mn_private.is_public_creator_avatar(text) to anon,authenticated;
create policy lab_shared_avatar_read on storage.objects for select to anon,authenticated
using (bucket_id='user-profile-images' and mn_private.is_public_creator_avatar(name));
