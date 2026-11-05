import {randomUUID} from 'node:crypto';
import {validateApp,validateProfile} from '../src/community/validation.js';
export async function communityAction(tx,user,action,input={}){
 const [profile]=await tx`select * from public.mn_profiles where user_id=${user.id}`;
 const [{moderator,publisher}]=await tx`select mn_private.is_moderator() as moderator, mn_private.is_publisher() as publisher`;
 if(action==='state'){
  const [apps,profiles,comments,followers,activity,reports]=await Promise.all([
   tx`select * from public.mn_apps`,tx`select id,user_id,name,bio,site,avatar,banner from public.mn_profiles`,tx`select * from public.mn_comments`,tx`select * from public.mn_follows`,tx`select * from public.mn_activity where user_id=${user.id}`,moderator?tx`select * from public.mn_reports order by created_at`:[]
  ]);return {user,apps,profiles:profiles.map(p=>({...p,...(p.user_id?{avatar:'https://lab.musicnerd.net/api/avatar?creator='+encodeURIComponent(p.id)}:{})})),comments,followers,activity,reports,moderator,publisher};
 }
 if(action==='profile'){
  const p=validateProfile({...input,name:user.name||input.name});const values={id:p.id,user_id:user.id,name:p.name,bio:p.bio,site:p.site,avatar:profile?.avatar||'',banner:p.banner};
  if(profile){delete values.id;delete values.user_id;await tx`update public.mn_profiles set ${tx(values)} where user_id=${user.id}`;}
  else await tx`insert into public.mn_profiles ${tx(values)}`;
  return {ok:true};
 }
 if(action==='moderate'){
  if(!moderator)throw Object.assign(Error('Moderator access is required.'),{status:403});
  const allowed={apps:['published','changes_requested','archived'],comments:['hidden'],reports:['resolved']};
  if(!allowed[input.table]?.includes(input.values?.status))throw Object.assign(Error('Invalid review action.'),{status:400});
  const values={status:input.values.status};if(input.table==='apps')values.review_note=String(input.values.review_note||'').slice(0,1000);
  await tx`update ${tx('public.mn_'+input.table)} set ${tx(values)} where id=${input.id}`;return {ok:true};
 }
 if(!profile)throw Object.assign(Error('Create your Lab profile to continue.'),{status:409});
 if(action==='editRecipe'){
  const allowed=['name','description','about','url','screenshot','category','instructions','source_url','tools_used','embed_mode','permissions'];
  const patch=input.patch;
  if(!patch||typeof patch!=='object'||Array.isArray(patch)||!Object.keys(patch).length||Object.keys(patch).some(k=>!allowed.includes(k)))throw Object.assign(Error('Invalid recipe fields.'),{status:400});
  const [existing]=await tx`select * from public.mn_apps where id=${input.id} for update`;
  if(!existing||existing.owner_id!==user.id)throw Object.assign(Error('You can only edit your own recipe.'),{status:403});
  if(existing.status==='archived')throw Object.assign(Error('Restore this recipe before editing it.'),{status:409});
  if(existing.status==='published'&&!publisher)throw Object.assign(Error('Editing a live recipe requires a trusted publisher account. Contact an administrator.'),{status:403});
  const validated=validateApp({...existing,...patch});const updates={};for(const key of Object.keys(patch))updates[key]=validated[key];
  await tx`update public.mn_apps set ${tx(updates)} where id=${existing.id} and owner_id=${user.id}`;
  return {...existing,...updates};
 }
 if(action==='protocol'){
  const a=validateApp(input.protocol);if(!['draft','pending'].includes(input.status))throw Object.assign(Error('Submit for review before publishing.'),{status:400});
  const row={id:a.id||randomUUID(),creator:profile.id,owner_id:user.id,kind:'external',status:input.status==='pending'&&publisher?'published':input.status};
  for(const key of ['name','description','about','url','screenshot','category','instructions','source_url','tools_used','embed_mode','permissions'])row[key]=a[key];
  const [existing]=await tx`select id,owner_id,status from public.mn_apps where id=${row.id}`;
  if(existing){if(existing.status==='archived'&&!moderator)throw Object.assign(Error('Ask an admin to restore this protocol before editing it.'),{status:403});if(existing.owner_id!==user.id)throw Object.assign(Error('You can only edit your own protocol.'),{status:403});const updates={...row};delete updates.id;delete updates.creator;delete updates.owner_id;delete updates.kind;await tx`update public.mn_apps set ${tx(updates)} where id=${row.id} and owner_id=${user.id}`;}
  else await tx`insert into public.mn_apps ${tx(row)}`;
  return row;
 }
 if(action==='toggle'){
  if(input.kind==='followed'){if(input.selected)await tx`delete from public.mn_follows where user_id=${user.id} and creator=${input.id}`;else await tx`insert into public.mn_follows(user_id,creator) values(${user.id},${input.id}) on conflict do nothing`;}
  else if(['saved','liked'].includes(input.kind)){if(input.selected)await tx`delete from public.mn_activity where user_id=${user.id} and app=${input.id} and kind=${input.kind}`;else await tx`insert into public.mn_activity(user_id,app,kind) values(${user.id},${input.id},${input.kind}) on conflict do nothing`;}
  else throw Object.assign(Error('Invalid activity.'),{status:400});return {ok:true};
 }
 if(action==='comment'){
  if(typeof input.text!=='string'||!input.text.trim()||input.text.length>1000)throw Object.assign(Error('Comments must be 1–1,000 characters.'),{status:400});
  await tx`insert into public.mn_comments(app,parent,author,user_id,name,text) values(${input.app},${input.parent||null},${profile.id},${user.id},${profile.name},${input.text.trim()})`;return {ok:true};
 }
 if(action==='removeComment'){await tx`update public.mn_comments set status='deleted',text='[Deleted]' where id=${input.id} and user_id=${user.id}`;return {ok:true};}
 if(action==='report'){
  if(!['app','comment'].includes(input.targetType)||typeof input.reason!=='string'||!input.reason.trim()||input.reason.length>1000)throw Object.assign(Error('Add a report reason, up to 1,000 characters.'),{status:400});
  await tx`insert into public.mn_reports(user_id,target_type,target,reason) values(${user.id},${input.targetType},${input.target},${input.reason.trim()})`;return {ok:true};
 }
 throw Object.assign(Error('Unknown action.'),{status:400});
}
