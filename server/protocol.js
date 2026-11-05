import {safeUrl} from '../src/community/validation.js';
const categories=['Discover','Artifacts','Make music','Sound toys','Tools'];
export function protocolInput(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Send a JSON object.');
 const allowed=['id','name','description','about','instructions','source_url','tools_used','url','screenshot','category','embed_mode','permissions','status'];
 for(const key of Object.keys(input))if(!allowed.includes(key))throw Error(`Unknown field: ${key}`);
 const out={};
 for(const [key,max] of Object.entries({id:80,name:60,description:180,about:30000,instructions:30000,url:2048,screenshot:2048,source_url:2048,tools_used:2000})){
  const value=input[key]??'';if(typeof value!=='string'||value.length>max)throw Error(`${key} must be text, up to ${max} characters.`);out[key]=value.trim();
 }
 for(const key of ['id','name','description','about','instructions','url','screenshot'])if(!out[key])throw Error(`${key} is required.`);
 if(!/^[a-z0-9][a-z0-9-]{2,79}$/.test(out.id))throw Error('id must be 3–80 lowercase letters, numbers, or hyphens.');
 for(const key of ['url','screenshot','source_url'])out[key]=safeUrl(out[key]);
 out.category=input.category??'Discover';if(!categories.includes(out.category))throw Error('Invalid category.');
 out.embed_mode=input.embed_mode??'external';if(!['external','embedded'].includes(out.embed_mode))throw Error('Invalid embed_mode.');
 out.permissions=input.permissions??[];if(!Array.isArray(out.permissions)||out.permissions.length>2||out.permissions.some(p=>!['camera','microphone'].includes(p)))throw Error('permissions may contain camera and microphone only.');
 out.status=input.status??'published';if(!['draft','published'].includes(out.status))throw Error('status must be draft or published.');return out;
}
