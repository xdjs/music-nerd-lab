import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {PGlite} from '@electric-sql/pglite';
import {safeUrl,validateProfile,validateApp} from '../src/community/validation.js';import {publicAddress,targetUrl,embeddingPolicy} from '../server/embed.js';
test('reject unsafe URLs and handles',()=>{for(const s of ['javascript:alert(1)','http://example.com','https://user:password@example.com'])assert.throws(()=>safeUrl(s));assert.equal(safeUrl('https://example.com'),'https://example.com/');assert.throws(()=>validateProfile({id:'review',name:'Test',bio:''}));assert.throws(()=>validateApp({name:'App',description:'Description',about:'About',url:'https://example.com',screenshot:''}));});
test('embed inspection blocks private networks and framing restrictions',()=>{for(const ip of ['127.0.0.1','10.1.2.3','169.254.169.254','192.168.1.1','::1','::ffff:127.0.0.1','fc00::1','0.0.0.0'])assert.equal(publicAddress(ip),false,ip);assert.equal(publicAddress('8.8.8.8'),true);assert.throws(()=>targetUrl('https://example.com:8443'));assert.equal(embeddingPolicy({'x-frame-options':'SAMEORIGIN'}),'blocked');assert.equal(embeddingPolicy({'content-security-policy':"frame-ancestors 'none'"}),'blocked');assert.equal(embeddingPolicy({'content-security-policy':'frame-ancestors https://lab.musicnerd.vercel.app'}),'unknown');});
test('database authorization isolates accounts and protects review workflow',async()=>{
 const db=new PGlite();await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`);
 await db.exec(readFileSync('supabase/migrations/20261103234810_community.sql','utf8'));
 await db.exec(readFileSync('supabase/migrations/20261104013101_lab_permanent_accounts.sql','utf8').split('alter policy mn_images_upload')[0]);
 const one='11111111-1111-4111-8111-111111111111',two='22222222-2222-4222-8222-222222222222',mod='33333333-3333-4333-8333-333333333333';await db.exec(`insert into auth.users values('${one}'),('${two}'),('${mod}');insert into mn_private.moderators values('${mod}');`);
 async function as(id,sql){await db.exec(`reset role;set request.jwt.claim.sub='${id||''}';set role ${id?'authenticated':'anon'};`);return db.query(sql);}
 await as(one,`insert into mn_profiles(id,user_id,name)values('alice','${one}','Alice')`);
 await assert.rejects(as(one,`insert into mn_profiles(id,user_id,name)values('bob','${two}','Bob')`));
 await db.exec("set request.jwt.claims='{\"is_anonymous\":true}';");
 await assert.rejects(as(two,`insert into mn_profiles(id,user_id,name)values('bob','${two}','Bob')`));
 await db.exec("set request.jwt.claims='{\"is_anonymous\":false}';");
 await as(two,`insert into mn_profiles(id,user_id,name)values('bob','${two}','Bob')`);
 await assert.rejects(as(one,`update mn_profiles set user_id='${two}' where id='alice'`));
 await assert.rejects(as(one,`insert into mn_private.moderators values('${one}')`));
 const row=`('app-one','alice','${one}','One','Description','About','https://example.com','/lens-preview.webp','Tools','pending')`;
 await as(one,`insert into mn_apps(id,creator,owner_id,name,description,about,url,screenshot,category,status)values${row}`);
 assert.equal((await as(two,`select * from mn_apps`)).rows.length,0);assert.equal((await as(null,`select * from mn_apps`)).rows.length,0);
 await assert.rejects(as(one,`update mn_apps set status='published' where id='app-one'`));
 await assert.rejects(as(one,`update mn_apps set owner_id='${two}' where id='app-one'`));
 await as(mod,`update mn_apps set status='published' where id='app-one'`);assert.equal((await as(null,`select * from mn_apps`)).rows.length,1);
 await as(two,`update mn_apps set name='Hacked' where id='app-one'`);assert.equal((await as(null,`select name from mn_apps`)).rows[0].name,'One');
 await as(one,`insert into mn_activity(user_id,app,kind)values('${one}','app-one','saved')`);assert.equal((await as(two,`select * from mn_activity`)).rows.length,0);
 await assert.rejects(as(two,`insert into mn_activity(user_id,app,kind)values('${one}','app-one','liked')`));
 const c='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';await as(one,`insert into mn_comments(id,app,author,user_id,name,text)values('${c}','app-one','alice','${one}','Spoof','Hello')`);
 assert.equal((await as(null,`select name from mn_comments`)).rows[0].name,'Alice');
 await as(two,`update mn_comments set text='Hacked' where id='${c}'`);assert.equal((await as(null,`select text from mn_comments`)).rows[0].text,'Hello');
 await as(two,`insert into mn_reports(user_id,target_type,target,reason)values('${two}','comment','${c}','Spam')`);assert.equal((await as(one,`select * from mn_reports`)).rows.length,0);assert.equal((await as(mod,`select * from mn_reports`)).rows.length,1);
 await assert.rejects(as(one,`update mn_comments set status='hidden' where id='${c}'`));await as(one,`update mn_comments set status='deleted',text='[Deleted]' where id='${c}'`);
 await assert.rejects(as(two,`insert into mn_comments(app,parent,author,user_id,name,text)values('app-one','${c}','bob','${two}','Bob','Reply')`));
 await as(mod,`update mn_apps set status='changes_requested',review_note='Please update screenshot' where id='app-one'`);await as(one,`update mn_apps set status='pending',description='Updated' where id='app-one'`);
 assert.equal((await as(one,`select review_note from mn_apps`)).rows[0].review_note,'');
 await db.close();
});

test('share HTML escapes user text and serves the built app',async()=>{
 const {metadata}=await import('../server/meta.js');
 const output=metadata({name:'<script>alert(1)</script>',description:'" onload="alert(1)',image:'/lens-preview.webp',path:'/someone/custom-app'});
 assert.ok(!output.includes('<script>'));assert.ok(output.includes('&lt;script&gt;'));assert.ok(output.includes('https://lab.musicnerd.net/lens-preview.webp'));
 const {default:handler}=await import('../api/page.js');let html;const headers={};
 const res={setHeader:(key,value)=>headers[key]=value,status(code){assert.equal(code,200);return this;},send(value){html=value;}};
 await handler({query:{}},res);assert.ok(html.includes('<title>Music Nerd Lab</title>'));assert.ok(html.includes('id="root"'));assert.ok(!html.includes('<!--metadata-start-->'));assert.equal(headers['Content-Type'],'text/html; charset=utf-8');
});


test('known experience share cards override raw screenshots with branded images',async()=>{
 const {metadata}=await import('../server/meta.js');
 for(const [path,card] of [['/','music-nerd-lab-v3'],['/peterango/medellin-metal','medellin-metal-v2'],['/peterango/musicnerd-lens','music-nerd-lens-v2']]){
  const html=metadata({path,image:'https://example.com/raw-photo.jpg'});
  assert.ok(html.includes('/social/'+card+'.png'));
  assert.ok(!html.includes('raw-photo.jpg'));
  assert.ok(html.includes('property="og:image:width" content="1200"'));
  assert.ok(html.includes('name="twitter:image"'));
 }
});
