do $$
declare target_user uuid;
begin
 select user_id into target_user from public.mn_profiles where id = 'peterango';
 if target_user is null then raise exception 'Linked Pete Rango account required'; end if;
 if not exists (select 1 from public.mn_apps where id='medellin-metal' and creator in ('musicnerd','peterango')) then raise exception 'Unexpected Medellin attribution'; end if;
 alter table public.mn_apps disable trigger mn_guard_app;
 update public.mn_apps set creator='peterango',owner_id=target_user where id='medellin-metal';
 alter table public.mn_apps enable trigger mn_guard_app;
end $$;
