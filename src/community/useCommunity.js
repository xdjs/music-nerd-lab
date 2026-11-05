import {useState,useEffect,useRef} from 'react';
import {supabase} from './client';
import {useLabAuth} from '../auth/LabAuth';
import {apps as examples,creators as exampleCreators} from '../data';
import {validateApp,validateProfile} from './validation';
const key='mn-apps:community-v1';
const empty={profile:null,drafts:[],comments:[],saved:[],liked:[],followed:[],reports:[]};
const previewApps=examples.map(a=>({...a,status:'published',price:a.price??(a.kind==='external'?'Unknown':'Free'),account_required:a.account_required??(a.kind==='external'?null:false),permissions:a.permissions??(a.id==='musicnerd-lens'?['camera']:[]),embed_mode:'embedded',screenshot:a.screenshot||(a.kind==='external'?'/lens-preview.webp':({sequencer:'/sequencer-preview.webp',chords:'/chords-preview.webp',tempo:'/tempo-preview.webp'})[a.kind]),demo:a.kind!=='external'}));
function initial(){try{return {...empty,...JSON.parse(localStorage.getItem(key)||'null')};}catch{return empty;}}
const fail=error=>{if(error)throw new Error(error.message||String(error));};
export function useCommunity(){
 const auth=useLabAuth();
 const connected=!!supabase;
 const authRef=useRef(auth);authRef.current=auth;
 async function call(action,input={}){const token=await authRef.current.getAccessToken?.();if(!token)throw Error('Sign in with Music Nerd to continue.');const r=await fetch('/api/community',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({action,input})});const result=await r.json();if(!r.ok)throw Error(result.error||'Could not connect to your Music Nerd account.');return result;}
 const [local,setLocal]=useState(initial),[remote,setRemote]=useState({profiles:[],apps:[],comments:[],saved:[],liked:[],followed:[],reports:[],followers:[]}),[user,setUser]=useState(null),[loading,setLoading]=useState(!!supabase),[error,setError]=useState(''),[moderator,setModerator]=useState(false),[canPublish,setCanPublish]=useState(false);
 const localRef=useRef(local);const generation=useRef(0);const currentUser=useRef(null);
 function persist(fn){const next=fn(localRef.current);try{localStorage.setItem(key,JSON.stringify(next));}catch{throw Error('This device is out of preview storage. Try a smaller image.');}localRef.current=next;setLocal(next);}
 async function refresh(uid=currentUser.current){
  if(!supabase)return;const seq=++generation.current;setError('');
  try{
   let profiles=[],appRows=[],commentRows=[],followers=[],activity=[],reports=[],isMod=false;
   if(authRef.current.authenticated){const r=await call('state');({profiles,apps:appRows,comments:commentRows,followers,activity,reports}=r);isMod=r.moderator;if(seq===generation.current){setCanPublish(!!r.publisher);setUser(r.user);currentUser.current=r.user.id;uid=r.user.id;}}
   else {const names=['profiles','apps','comments','follows'];const values=await Promise.all(names.map(n=>supabase.from('mn_'+n).select('*')));values.forEach(r=>fail(r.error));[profiles,appRows,commentRows,followers]=values.map(r=>r.data);}
   if(seq!==generation.current)return;
   setModerator(isMod);setRemote({profiles:profiles.filter(p=>p.user_id||appRows.some(a=>a.creator===p.id&&a.status==='published')).map(p=>({...exampleCreators.find(c=>c.id===p.id),...p,...(p.user_id?{avatar:'/api/avatar?creator='+encodeURIComponent(p.id)}:{})})),apps:appRows.map(a=>({...a,date:Date.parse(a.created_at)||0,demo:a.kind!=='external'})),comments:commentRows.map(c=>({...c,at:c.created_at})),followers,reports,saved:activity.filter(x=>x.kind==='saved').map(x=>x.app),liked:activity.filter(x=>x.kind==='liked').map(x=>x.app),followed:followers.filter(x=>x.user_id===uid).map(x=>x.creator)});
  }catch(e){if(seq===generation.current)setError(e.message);}finally{if(seq===generation.current)setLoading(false);}
 }
 useEffect(()=>{if(!supabase)return;currentUser.current=null;setUser(null);setRemote({profiles:[],apps:[],comments:[],saved:[],liked:[],followed:[],reports:[],followers:[]});setModerator(false);setCanPublish(false);refresh();const focus=()=>refresh();window.addEventListener('focus',focus);return()=>{generation.current++;window.removeEventListener('focus',focus);};},[auth.ready,auth.authenticated,auth.user?.id]);
 const profile=supabase?remote.profiles.find(p=>p.user_id===user?.id)||null:local.profile;
 const profiles=supabase?remote.profiles:[...exampleCreators,...(profile?[profile]:[])];
 const allApps=supabase?remote.apps:[...previewApps,...local.drafts];
 const state=supabase?remote:local;
 function requireUser(){if(supabase&&!user)throw Error('Sign in to continue.');if(!profile)throw Error('Create your profile to continue.');}
 async function saveProfile(p){p=validateProfile(p);if(supabase){await call('profile',p);await refresh();}else{if(exampleCreators.some(c=>c.id===p.id))throw Error('That handle is reserved for an existing creator.');persist(s=>({...s,profile:p}));}}
 async function toggle(kind,id){requireUser();if(supabase){await call('toggle',{kind,id,selected:state[kind].includes(id)});await refresh();}else persist(s=>({...s,[kind]:s[kind].includes(id)?s[kind].filter(x=>x!==id):[...s[kind],id]}));}
 async function submitApp(a,status='draft'){
  requireUser();a=validateApp(a);const row={...a,id:a.id||crypto.randomUUID(),creator:profile.id,owner_id:user?.id||'local',kind:'external',status};
  delete row.demo;delete row.date;delete row.color;delete row.created_at;delete row.updated_at;delete row.review_note;
  if(supabase){const saved=await call('protocol',{protocol:a,status});await refresh();return saved;}else persist(s=>({...s,drafts:[...s.drafts.filter(x=>x.id!==row.id),{...row,updated_at:new Date().toISOString()}]}));return row;
 }
 async function editRecipe(id,patch){
  requireUser();if(supabase){const saved=await call('editRecipe',{id,patch});await refresh();return saved;}
  const existing=allApps.find(a=>a.id===id&&a.owner_id==='local');if(!existing)throw Error('You can only edit your own recipe.');const row=validateApp({...existing,...patch});persist(s=>({...s,drafts:s.drafts.map(a=>a.id===id?row:a)}));return row;
 }
 async function comment(app,text,parent=null){requireUser();if(!text.trim()||text.length>1000)throw Error('Comments must be 1–1,000 characters.');const row={id:crypto.randomUUID(),app,parent,author:profile.id,user_id:user?.id||'local',name:profile.name,text:text.trim(),status:'visible'};if(supabase){await call('comment',{app,text,parent});await refresh();}else persist(s=>({...s,comments:[...s.comments,{...row,at:new Date().toISOString()}]}));}
 async function removeComment(id){requireUser();if(supabase){await call('removeComment',{id});await refresh();}else persist(s=>({...s,comments:s.comments.map(c=>c.id===id&&c.author===profile.id?{...c,text:'[Deleted]',status:'deleted'}:c)}));}
 async function report(targetType,target,reason){requireUser();if(!reason.trim())throw Error('Add a reason for the report.');const row={id:crypto.randomUUID(),user_id:user?.id||'local',target_type:targetType,target,reason:reason.slice(0,1000),status:'open'};if(supabase){await call('report',{targetType,target,reason});await refresh();}else persist(s=>({...s,reports:[...s.reports,row]}));}
 async function moderate(table,id,values){if(!supabase||!moderator)throw Error('Moderator access is required.');await call('moderate',{table,id,values});await refresh();}
 async function upload(file){if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>3*1024*1024)throw Error('Choose a JPG, PNG, or WebP image under 3 MB.');const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Could not read image.'));reader.readAsDataURL(file);});if(!supabase)return data;const token=await auth.getAccessToken();const r=await fetch('/api/media',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({type:file.type,data:data.split(',')[1]})});const result=await r.json();if(!r.ok)throw Error(result.error||'Upload failed.');return result.url;}
 async function signIn(){if(!auth.configured)throw Error('Music Nerd sign-in is not configured.');auth.login();}
 async function signOut(){await auth.logout();}
 return {...state,apps:allApps.filter(a=>a.status==='published'),allApps,profiles,profile,user,loading,error,moderator,canPublish,connected,authReady:auth.ready&&auth.configured,authAuthenticated:auth.authenticated,refresh,saveProfile,toggle,submitApp,editRecipe,comment,removeComment,report,moderate,upload,signIn,signOut,followerCount:id=>supabase?remote.followers.filter(f=>f.creator===id).length:local.followed.includes(id)?1:0};
}
