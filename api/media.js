import postgres from 'postgres';
import {randomUUID} from 'node:crypto';
import {verifyPrivyToken} from '../server/auth/verifyPrivyToken.js';
import {withLabUser} from '../server/auth/withLabUser.js';
let db;
export default async function handler(req,res){
 res.setHeader('X-Content-Type-Options','nosniff');
 try{
  if(req.method==='GET'){
   const id=String(req.query.id||'');if(!/^[0-9a-f-]{36}$/.test(id))return res.status(404).end();
   db??=postgres(process.env.SUPABASE_DB_CONNECTION,{prepare:false,max:1,idle_timeout:20,connect_timeout:10,ssl:'require'});
   const [file]=await db`select content_type,data from public.mn_media where id=${id}`;if(!file)return res.status(404).end();
   res.setHeader('Content-Type',file.content_type);res.setHeader('Cache-Control','public,max-age=31536000,immutable');return res.status(200).send(file.data);
  }
  if(req.method!=='POST')return res.status(405).end();
  res.setHeader('Cache-Control','no-store');const did=await verifyPrivyToken(req.headers.authorization);
  const {type,data}=req.body||{};if(typeof data!=='string'||data.length>4194304||!/^[A-Za-z0-9+/]*={0,2}$/.test(data))return res.status(400).json({error:'Choose an image under 3 MB.'});
  const bytes=Buffer.from(data,'base64');const valid=type==='image/png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):type==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:type==='image/webp'?bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP':false;
  if(!valid||!bytes.length||bytes.length>3145728)return res.status(400).json({error:'Choose a valid PNG, JPG, or WebP under 3 MB.'});
  const id=randomUUID();await withLabUser(did,async(tx,user)=>{const [{count}]=await tx`select count(*)::int as count from public.mn_media where user_id=${user.id} and created_at>now()-interval '1 hour'`;if(count>=20)throw Object.assign(Error('Upload limit reached. Try again in an hour.'),{status:429});await tx`insert into public.mn_media(id,user_id,content_type,data) values(${id},${user.id},${type},${bytes})`;});return res.status(201).json({url:`https://lab.musicnerd.net/api/media?id=${id}`});
 }catch(e){return res.status(e.status||503).json({error:e.status?e.message:'Image service is temporarily unavailable.'});}
}
