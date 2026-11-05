import React,{useState,useRef,useEffect,useId} from 'react';
import {Pencil,Check,X} from 'lucide-react';
import {ImageField} from './community/Forms';
import {categories} from './data';
import './inline-edit.css';
const PageEditContext=React.createContext(null);
const fields={'Title':'name','Description':'description','Cookbook':'about','Recipe prompt':'instructions','Tools and limits':'tools_used','Starting source':'source_url','Experience URL':'url','Category':'category','Cover image':'screenshot','Display':'embed_mode','Camera and microphone access':'permissions'};
export function PageEditor({onSave,children}){
 const [editing,setEditing]=useState(false),[patch,setPatch]=useState({}),[busy,setBusy]=useState(false),[uploads,setUploads]=useState({}),[error,setError]=useState('');
 const root=useRef(),trigger=useRef();
 const dirty=Object.keys(patch).length>0,uploading=Object.values(uploads).some(Boolean);
 useEffect(()=>{if(!dirty)return;const warn=e=>{e.preventDefault();e.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);
 function close(){setEditing(false);setPatch({});setError('');setUploads({});requestAnimationFrame(()=>trigger.current?.focus());}
 async function save(){if(busy||uploading)return;for(const field of root.current.querySelectorAll('.inline-edit input,.inline-edit textarea,.inline-edit select'))if(!field.reportValidity())return;setBusy(true);setError('');try{if(dirty)await onSave(patch);close();}catch(e){setError(e.message);}finally{setBusy(false);}}
 const context={editing:editing&&!!onSave,busy,patch,change:(key,value,original)=>setPatch(p=>{const next={...p};if(JSON.stringify(value)===JSON.stringify(original))delete next[key];else next[key]=value;return next;}),upload:(key,value)=>setUploads(p=>({...p,[key]:value}))};
 return <PageEditContext.Provider value={context}><div ref={root} className={editing?'page-editor editing':'page-editor'}>{onSave&&<div className="page-edit-bar">{editing?<><span>{dirty?'Unsaved changes':'Editing page'}</span><button className="button primary" disabled={busy||uploading} onClick={save}><Check size={16}/>{busy?'Saving…':'Save changes'}</button><button className="button" disabled={busy||uploading} onClick={close}>Cancel</button>{error&&<p role="alert" className="form-error">{error}</p>}</>:<button ref={trigger} className="button" onClick={()=>{setEditing(true);requestAnimationFrame(()=>root.current.querySelector('.inline-edit input')?.focus({preventScroll:true}));}}><Pencil size={16}/>Edit page</button>}</div>}{children}</div></PageEditContext.Provider>;
}
export function InlineEdit({label,value='',onSave,children,multiline=false,maxLength=2048,optional=false,options,upload,type='text'}){
 const context=React.useContext(PageEditContext),id=useId();
 if(!onSave||!context?.editing)return children||null;
 const key=fields[label],original=key==='permissions'?(value?value.split(','):[]):value;
 const raw=Object.hasOwn(context.patch,key)?context.patch[key]:original;
 const draft=key==='permissions'?raw.join(','):(raw??'');
 const change=v=>context.change(key,key==='permissions'?(v?v.split(','):[]):v,original);
 return <div className="inline-edit is-editing"><label htmlFor={id}>{label}</label>{upload?<ImageField label="Cover image" value={draft} onChange={change} upload={upload} onBusyChange={v=>context.upload(key,v)}/>:options?<select id={id} value={draft} disabled={context.busy} onChange={e=>change(e.target.value)}>{options.map(o=><option key={o.value??o} value={o.value??o}>{o.label??o}</option>)}</select>:multiline?<textarea id={id} required={!optional} maxLength={maxLength} rows={Math.min(16,Math.max(4,draft.split('\n').length))} value={draft} disabled={context.busy} onChange={e=>change(e.target.value)}/>:<input id={id} required={!optional} type={type} maxLength={maxLength} value={draft} disabled={context.busy} onChange={e=>change(e.target.value)}/>}</div>;
}
export function ExperienceSettings({app,onSave,upload}){
 const context=React.useContext(PageEditContext);
 if(!onSave||!context?.editing)return null;
 const edit=key=>value=>onSave({[key]:value});
 return <details className="experience-settings" open><summary>Experience settings</summary><div className="experience-settings-grid"><InlineEdit label="Experience URL" type="url" value={app.url} onSave={edit('url')}><p><b>Experience URL</b><br/>{app.url}</p></InlineEdit><InlineEdit label="Category" value={app.category} options={categories.slice(1)} onSave={edit('category')}><p><b>Category</b><br/>{app.category}</p></InlineEdit><InlineEdit label="Cover image" value={app.screenshot} onSave={edit('screenshot')} upload={upload}><img className="editable-cover" src={app.screenshot} alt="Recipe cover"/></InlineEdit><div><InlineEdit label="Display" value={app.embed_mode} options={[{value:'embedded',label:'Inside Music Nerd Lab'},{value:'external',label:'Open in a new tab'}]} onSave={edit('embed_mode')}><p><b>Display</b><br/>{app.embed_mode==='embedded'?'Inside Music Nerd Lab':'Open in a new tab'}</p></InlineEdit>{app.embed_mode==='embedded'&&<InlineEdit label="Camera and microphone access" value={(app.permissions||[]).slice().sort().join(',')} options={[{value:'',label:'Neither'},{value:'camera',label:'Camera'},{value:'microphone',label:'Microphone'},{value:'camera,microphone',label:'Camera and microphone'}]} onSave={value=>onSave({permissions:value?value.split(','):[]})}><p><b>Camera and microphone access</b><br/>{app.permissions?.join(', ')||'Neither'}</p></InlineEdit>}</div></div></details>;
}
