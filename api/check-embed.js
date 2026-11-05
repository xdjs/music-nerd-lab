import {inspectEmbed} from '../server/embed.js';
import {verifyPrivyToken} from '../server/auth/verifyPrivyToken.js';
import {withLabUser} from '../server/auth/withLabUser.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 try{const did=await verifyPrivyToken(req.headers.authorization);await withLabUser(did,async()=>true);const target=req.body?.url;if(typeof target!=='string'||target.length>2048)return res.status(400).json({error:'Invalid URL'});return res.status(200).json(await inspectEmbed(target,'https://lab.musicnerd.net'));}catch(e){return res.status(e.status||400).json({error:e.status?e.message:'The embed check could not complete.'});}
}
