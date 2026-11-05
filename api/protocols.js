import {protocolInput} from '../server/protocol.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('Allow','PUT');
 if(req.method!=='PUT')return res.status(405).json({error:'Use PUT /api/protocols. Documentation: /protocol-api.md'});
 const token=req.headers.authorization?.match(/^Bearer (mnl_[a-f0-9]{64})$/)?.[1];
 if(!token)return res.status(401).json({error:'A Music Nerd Lab publishing key is required.'});
 const url=process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL,key=process.env.SUPABASE_PUBLISHABLE_KEY||process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return res.status(503).json({error:'Publishing is not configured.'});
 let input;try{if(Number(req.headers['content-length'])>65536||JSON.stringify(req.body??'').length>65536)return res.status(413).json({error:'Request exceeds 64 KB.'});input=protocolInput(req.body);}catch(e){return res.status(400).json({error:e.message});}
 try{
  const response=await fetch(url+'/rest/v1/rpc/mn_publish_protocol',{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({publishing_key:token,protocol:input}),signal:AbortSignal.timeout(12000)});
  const body=await response.json();if(!response.ok){const status=({'28000':401,'42501':403,'23505':409,'P0002':429,'22023':400,'23514':400})[body.code]||502;return res.status(status).json({error:status===502?'Publishing failed. Retry with the same id.':body.message});}
  return res.status(200).json({...body,url:`https://lab.musicnerd.vercel.app/${body.creator}/${body.id}`});
 }catch{return res.status(503).json({error:'Publishing is temporarily unavailable. Retry with the same id.'});}
}
