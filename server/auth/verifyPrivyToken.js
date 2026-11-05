import {createRemoteJWKSet,jwtVerify} from 'jose';
let keys;
export async function verifyPrivyToken(authorization,{appId=process.env.NEXT_PUBLIC_PRIVY_APP_ID,keySet}={}){
 const token=authorization?.match(/^Bearer ([^\s]+)$/)?.[1];
 if(!token||token.length>16000||!appId)throw Object.assign(Error('Sign in with Music Nerd to continue.'),{status:401});
 try{
  keys??=createRemoteJWKSet(new URL(`https://auth.privy.io/api/v1/apps/${encodeURIComponent(appId)}/jwks.json`),{timeoutDuration:5000});
  const {payload}=await jwtVerify(token,keySet||keys,{issuer:'privy.io',audience:appId,algorithms:['ES256'],requiredClaims:['sub','exp','iat']});
  if(typeof payload.sub!=='string'||!/^did:privy:[a-zA-Z0-9]+$/.test(payload.sub))throw Error();
  return payload.sub;
 }catch{throw Object.assign(Error('Your session expired. Sign in again.'),{status:401});}
}
