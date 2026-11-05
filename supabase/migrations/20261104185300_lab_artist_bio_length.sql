-- Preserve full artist bios imported from an approved Music Nerd claim.
alter table public.mn_profiles drop constraint mn_profiles_bio_check;
alter table public.mn_profiles add constraint mn_profiles_bio_check check(length(bio)<=3000);
