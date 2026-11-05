alter table public.mn_apps drop constraint mn_apps_about_check;
alter table public.mn_apps add constraint mn_apps_about_check check(length(trim(about)) between 1 and 30000);
