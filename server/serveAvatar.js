import {createHash} from 'node:crypto';
/** Serve the original account avatar; dependencies keep public access rules testable. */
export async function serveAvatar(req,res,{findAccount,download}){
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET'&&req.method!=='HEAD'){res.setHeader('Allow','GET, HEAD');return res.status(405).end();}
 const creator=req.query.creator;
 if(typeof creator!=='string'||!/^[a-z][a-z0-9-]{2,29}$/.test(creator))return res.status(404).end();
 try{
  const account=await findAccount(creator);
  if(!account||account.is_hidden)return res.status(404).end();
  const folders=account.privy_user_id?[`identity-${createHash('sha256').update(account.privy_user_id).digest('hex')}`,account.id]:[account.id];
  for(const folder of folders){
   const bytes=await download(`${folder}/avatar.webp`);
   if(!bytes)continue;
   if(bytes.length>3145728||bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP')throw Error('Invalid avatar');
   res.setHeader('Content-Type','image/webp');
   res.setHeader('Cache-Control','public, max-age=60, s-maxage=60, must-revalidate');
   return req.method==='HEAD'?res.status(200).end():res.status(200).send(bytes);
  }
  res.setHeader('Cache-Control','public, max-age=60, s-maxage=60, must-revalidate');
  res.setHeader('Location','/default_pfp_pink.png');return res.status(302).end();
 }catch{return res.status(503).end();}
}
