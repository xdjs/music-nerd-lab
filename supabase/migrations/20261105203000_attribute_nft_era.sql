lock table public.mn_apps in access exclusive mode;
alter table public.mn_apps disable trigger mn_guard_app;
update public.mn_apps a set creator=p.id,owner_id=p.user_id,updated_at=now() from public.mn_profiles p where a.id='music-nft-era' and a.creator='musicnerd' and a.owner_id is null and p.id='peterango' and p.user_id is not null;
alter table public.mn_apps enable trigger mn_guard_app;
