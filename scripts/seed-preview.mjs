import {writeFileSync} from 'node:fs';
import {apps,creators} from '../src/data.js';
const q=v=>"'"+String(v).replaceAll("'","''")+"'";
let sql='-- Preserve the existing preview catalog. Reserved creator handles have no account owner.\n';
for(const c of creators)sql+=`insert into public.mn_profiles(id,name,bio,site) values(${q(c.id)},${q(c.name)},${q(c.bio)},${q(c.site||'')});\n`;
for(const a of apps)sql+=`insert into public.mn_apps(id,creator,name,description,about,url,screenshot,category,kind,status,price,account_required,permissions,embed_mode) values(${[a.id,a.creator,a.name,a.description,a.about,a.url||'',a.kind==='external'?'/lens-preview.webp':`/${a.kind}-preview.webp`,a.category,a.kind,'published',a.kind==='external'?'Unknown':'Free'].map(q).join(',')},${a.kind==='external'?'null':'false'},${a.kind==='external'?"array['camera']":"'{}'"},'embedded');\n`;
writeFileSync('supabase/migrations/20261103235306_preview_catalog.sql',sql);
