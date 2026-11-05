insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('mn-images','mn-images',true,4194304,array['image/png','image/jpeg','image/webp']);
create policy mn_images_upload on storage.objects for insert to authenticated with check(bucket_id='mn-images' and (storage.foldername(name))[1]=(select auth.uid())::text);
-- Immutable random upload paths; users cannot replace another creator's images.
create policy mn_images_read on storage.objects for select to anon,authenticated using(bucket_id='mn-images');
