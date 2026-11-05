// Run locally. The secret is written to a private file, never printed.
import {randomBytes,createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
const [creator,label='Agent publisher']=process.argv.slice(2);
if(!/^[a-z][a-z0-9-]{2,29}$/.test(creator||'')||!label||label.length>100)throw Error('Usage: node scripts/create-publishing-key.mjs <creator> [label]');
const secret='mnl_'+randomBytes(32).toString('hex');const hash=createHash('sha256').update(secret).digest('hex');
const path=`.publishing-key-${creator}-${Date.now()}`;
writeFileSync(path,`MUSIC_NERD_PUBLISHING_KEY=${secret}\n`,{mode:0o600,flag:'wx'});
writeFileSync(path+'.sql',`insert into mn_private.publishing_keys(creator,label,key_hash) values ('${creator}','${label.replaceAll("'","''")}','${hash}');\n`,{mode:0o600,flag:'wx'});
console.log(`Secret saved to ${path}. Register its hash by running ${path}.sql using an authorized database admin. Keep the secret out of source control and chat.`);
