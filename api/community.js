import {verifyPrivyToken} from '../server/auth/verifyPrivyToken.js';
import {withLabUser} from '../server/auth/withLabUser.js';
import {communityAction} from '../server/communityAction.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'Use POST.'});
 try{
  const did=await verifyPrivyToken(req.headers.authorization);
  if(!req.body||JSON.stringify(req.body).length>100000)throw Object.assign(Error('Invalid request size.'),{status:400});
  const result=await withLabUser(did,(tx,user)=>communityAction(tx,user,req.body.action,req.body.input));return res.status(200).json(result);
 }catch(e){const status=e.status||(['23514','23502','22P02'].includes(e.code)?400:e.code==='23505'?409:e.code==='42501'?403:500);return res.status(status).json({error:e.status?e.message:status===409?'That handle or protocol ID is already taken.':status===400?'Check the fields and try again.':status===403?'You do not have permission to do that.':'Could not save your changes. Please try again.'});}
}
