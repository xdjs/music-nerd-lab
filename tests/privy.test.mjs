import test from 'node:test';import assert from 'node:assert/strict';import {generateKeyPair,SignJWT} from 'jose';
import {verifyPrivyToken} from '../server/auth/verifyPrivyToken.js';
import {readFileSync} from 'node:fs';import {PGlite} from '@electric-sql/pglite';
test('Privy access tokens require a valid signature, issuer, audience, expiry and DID',async()=>{
 const {privateKey,publicKey}=await generateKeyPair('ES256');const other=await generateKeyPair('ES256');
 const mint=(claims={},key=privateKey)=>new SignJWT({sub:'did:privy:alice',...claims}).setProtectedHeader({alg:'ES256'}).setIssuedAt().setIssuer(claims.iss||'privy.io').setAudience(claims.aud||'music-nerd').setExpirationTime(claims.exp||'1h').sign(key);
 const verify=t=>verifyPrivyToken('Bearer '+t,{appId:'music-nerd',keySet:publicKey});
 assert.equal(await verify(await mint()),'did:privy:alice');
 for(const claims of [{iss:'attacker'},{aud:'another-app'},{exp:1},{sub:'alice'}])await assert.rejects(verify(await mint(claims)));
 await assert.rejects(verify(await mint({},other.privateKey)));await assert.rejects(verify('privyid:did:privy:alice'));
});
test('Music Nerd user IDs retain Lab RLS isolation under the server database role',async()=>{
 const db=new PGlite();await db.exec(`create role anon;create role authenticated;create role mnweb;create schema auth;create table auth.users(id uuid primary key);create table public.users(id uuid primary key,username text,privy_user_id text unique,is_white_listed boolean default false,is_admin boolean default false,is_super_admin boolean default false,is_hidden boolean default false);create function auth.uid() returns uuid language sql stable as $$select (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid$$;`);
 await db.exec(`create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;grant usage on schema auth to anon,authenticated,mnweb;grant execute on function auth.uid(),auth.jwt() to anon,authenticated,mnweb;`);
 await db.exec(readFileSync('supabase/migrations/20261103234810_community.sql','utf8'));
 await db.exec(readFileSync('supabase/migrations/20261104182331_lab_privy_accounts.sql','utf8'));
 await db.exec(readFileSync('supabase/migrations/20261104184128_lab_trusted_publishers.sql','utf8'));
 await db.exec(readFileSync('supabase/migrations/20261104204237_lab_shared_account_identity.sql','utf8'));
 const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';await db.exec(`insert into public.users(id,privy_user_id) values('${a}','did:privy:alice'),('${b}','did:privy:bob');`);
 async function as(id,sql){await db.exec(`reset role;set request.jwt.claims='{"sub":"${id}"}';set role mnweb;`);return db.query(sql);}
 await as(a,`insert into mn_profiles(id,user_id,name)values('alice','${a}','Alice')`);await as(b,`insert into mn_profiles(id,user_id,name)values('bob','${b}','Bob')`);
 await assert.rejects(as(a,`update mn_profiles set user_id='${b}' where id='alice'`));await assert.rejects(as(a,`insert into mn_private.moderators values('${a}')`));
 await as(a,`insert into mn_apps(id,creator,owner_id,name,description,about,url,screenshot,category,status) values('alice-protocol','alice','${a}','Name','Description','About','https://example.com','/cover.jpg','Tools','draft')`);
 assert.equal((await as(b,'select * from mn_apps')).rows.length,0);await assert.rejects(as(a,"update mn_apps set status='published' where id='alice-protocol'"));
 await as(b,"update mn_apps set name='Hacked' where id='alice-protocol'");assert.equal((await as(a,'select name from mn_apps')).rows[0].name,'Name');
 await db.exec(`reset role;update public.users set is_white_listed=true where id='${a}';`);
 await as(a,"update mn_apps set status='published' where id='alice-protocol'");
 assert.equal((await as(b,'select * from mn_apps')).rows.length,1);
 await as(b,"update mn_apps set status='archived' where id='alice-protocol'");
 assert.equal((await as(a,'select status from mn_apps')).rows[0].status,'published');
 await assert.rejects(as(a,`update public.users set is_admin=true where id='${a}'`));
 await db.exec(`reset role;update public.users set is_admin=true where id='${b}';`);
 await as(b,"update mn_apps set status='archived' where id='alice-protocol'");
 await assert.rejects(as(a,"update mn_apps set status='published' where id='alice-protocol'"));
 await as(b,"update mn_apps set status='published' where id='alice-protocol'");
 await db.exec(`reset role;update public.users set is_white_listed=false where id='${a}';`);
 await assert.rejects(as(a,"update mn_apps set name='Changed' where id='alice-protocol'"));
 await db.exec(`reset role;set role authenticated;`);await assert.rejects(db.exec(`insert into mn_profiles(id,user_id,name) values('intruder','${b}','No')`));

 await db.exec(`reset role;update public.users set username='Shared Alice' where id='${a}';`);
 assert.equal((await as(a,"select name from mn_profiles where id='alice'")).rows[0].name,'Shared Alice');
 await as(a,"update mn_profiles set name='Spoof',bio='Lab bio',avatar='https://example.com/custom.png' where id='alice'");
 assert.equal((await as(a,"select name from mn_profiles where id='alice'")).rows[0].name,'Shared Alice');
 await db.exec(`reset role;update public.users set username='New shared name' where id='${a}';`);
 assert.deepEqual((await as(a,"select name,bio,avatar from mn_profiles where id='alice'")).rows[0],{name:'New shared name',bio:'Lab bio',avatar:'https://example.com/custom.png'});
 await db.exec(`reset role;update public.users set username='private@example.com' where id='${a}';set role anon;`);
 assert.equal((await db.query("select name from mn_profiles where id='alice'")).rows[0].name,'Music Nerd member');
 await assert.rejects(db.query('select username from public.users'));
 await assert.rejects(db.query("select mn_private.account_display_name('private@example.com')"));
 await db.close();
});

test('community API rejects anonymous requests before database access',async()=>{const {default:handler}=await import('../api/community.js');const res={setHeader(){},status(code){this.code=code;return this},json(body){this.body=body;return this}};await handler({method:'POST',headers:{},body:{action:'state'}},res);assert.equal(res.code,401);});

test('community publishing uses database roles and lets admins moderate without a creator profile',async()=>{
 const {communityAction}=await import('../server/communityAction.js');
 const protocol={name:'Test protocol',description:'A test experience',about:'About this test',instructions:'Try this',url:'https://example.com',screenshot:'https://example.com/cover.png',category:'Discover',embed_mode:'external',permissions:[]};
 function mock({publisher=false,moderator=false,profile=true}={}){return function tx(strings,...values){if(!Array.isArray(strings))return strings;const q=strings.join('?');if(q.includes('from public.mn_profiles where'))return Promise.resolve(profile?[{id:'alice'}]:[]);if(q.includes('is_moderator()'))return Promise.resolve([{publisher,moderator}]);return Promise.resolve([]);};}
 for(const publisher of [false,true]){const saved=await communityAction(mock({publisher}),{id:'alice-id'},'protocol',{protocol,status:'pending',publisher:true,moderator:true});assert.equal(saved.status,publisher?'published':'pending');const draft=await communityAction(mock({publisher}),{id:'alice-id'},'protocol',{protocol,status:'draft'});assert.equal(draft.status,'draft');}
 assert.deepEqual(await communityAction(mock({moderator:true,profile:false}),{id:'admin-id'},'moderate',{table:'apps',id:'test',values:{status:'archived'}}),{ok:true});
 await assert.rejects(communityAction(mock(),{id:'alice-id'},'moderate',{table:'apps',id:'test',values:{status:'archived'}}),/Moderator access/);
});
