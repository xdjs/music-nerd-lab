-- User profiles remain separate from artist biographies.
alter table public.mn_profiles drop constraint mn_profiles_bio_check;
alter table public.mn_profiles add constraint mn_profiles_bio_check check(length(bio)<=500);
