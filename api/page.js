import {readFile} from 'node:fs/promises';
import {metadata} from '../server/meta.js';
export default async function handler(req,res){
 let meta={};const creator=String(req.query.creator||''),slug=String(req.query.slug||'');
 const base=process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL,key=process.env.SUPABASE_PUBLISHABLE_KEY||process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
 if(base&&key&&/^[a-z][a-z0-9-]{2,29}$/.test(creator))try{
  const params=new URLSearchParams(slug?{creator:`eq.${creator}`,id:`eq.${slug}`,status:'eq.published',select:'name,description,screenshot',limit:'1'}:{id:`eq.${creator}`,select:'name,bio,banner,avatar,user_id',limit:'1'});
  const r=await fetch(`${base}/rest/v1/mn_${slug?'apps':'profiles'}?${params}`,{headers:{apikey:key},signal:AbortSignal.timeout(4000)});
  if(r.ok){const [item]=await r.json();if(item)meta={name:item.name,description:item.description||item.bio,image:item.screenshot||item.banner||(item.user_id?'https://lab.musicnerd.net/api/avatar?creator='+encodeURIComponent(creator):item.avatar),path:`/${creator}${slug?'/'+encodeURIComponent(slug):''}`};}
 }catch{/* Generic metadata remains available when the database cannot respond. */}
 const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Cache-Control','public, max-age=0, s-maxage=60');res.status(200).send(html.replace(/<!--metadata-start-->[\s\S]*?<!--metadata-end-->/,metadata(meta)));
}
