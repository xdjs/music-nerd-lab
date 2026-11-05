import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {PGlite} from '@electric-sql/pglite';
test('storage policy exposes only active Lab creator avatars and grants no writes',async()=>{
 const db=new PGlite();await db.exec(`create role anon;create role authenticated;create schema mn_private;create schema extensions;create schema storage;
 create function extensions.digest(t text,a text) returns bytea language sql immutable as $$select sha256(convert_to(t,'UTF8'))$$;
 create table public.users(id uuid,privy_user_id text,is_hidden boolean);create table public.mn_profiles(id text,user_id uuid);
 create table storage.objects(bucket_id text,name text);alter table storage.objects enable row level security;
 grant usage on schema storage,mn_private to anon,authenticated;grant select on storage.objects to anon,authenticated;
 insert into users values('11111111-1111-4111-8111-111111111111','active',false),('22222222-2222-4222-8222-222222222222','hidden',true),('33333333-3333-4333-8333-333333333333','private',false);
 insert into mn_profiles values('active','11111111-1111-4111-8111-111111111111'),('hidden','22222222-2222-4222-8222-222222222222');
 insert into storage.objects select 'user-profile-images','identity-'||encode(extensions.digest(privy_user_id,'sha256'),'hex')||'/avatar.webp' from users;
 insert into storage.objects values('user-profile-images','11111111-1111-4111-8111-111111111111/private.webp'),('other','11111111-1111-4111-8111-111111111111/avatar.webp');`);
 await db.exec(readFileSync('supabase/migrations/20261104210343_lab_shared_avatar_read.sql','utf8'));
 for(const role of ['anon','authenticated']){await db.exec('set role '+role);assert.equal((await db.query('select * from storage.objects')).rows.length,1);await assert.rejects(db.query('select * from public.users'));await assert.rejects(db.query("insert into storage.objects values('user-profile-images','arbitrary')"));await db.exec('reset role');}
 await db.exec('delete from mn_profiles');await db.exec('set role anon');assert.equal((await db.query('select * from storage.objects')).rows.length,0);await db.close();
});
