import React,{useEffect,useState} from 'react';
import {ArrowUpRight,RefreshCw} from 'lucide-react';
export function ExternalApp({app}){
 const [attempt,setAttempt]=useState(0),[loaded,setLoaded]=useState(false),[slow,setSlow]=useState(false);
 useEffect(()=>{setLoaded(false);setSlow(false);const t=setTimeout(()=>setSlow(true),12000);return()=>clearTimeout(t);},[attempt,app.id]);
 if(app.embed_mode==='external')return <div className="external-fallback"><img src={app.screenshot} alt=""/><h2>{app.name}</h2><p>This app opens in its own tab. Your place in Music Nerd will stay here.</p><a className="button primary" href={app.url} target="_blank" rel="noreferrer">Open {app.name} <ArrowUpRight size={16}/></a></div>;
 const permissions=[...(app.permissions||[]),'fullscreen'].join('; ');
 return <div className="external-app">{slow&&!loaded&&<div className="embed-status" role="status">Taking longer than expected. You can reload or open the app directly below.</div>}<iframe key={attempt} src={app.url} title={app.name} onLoad={()=>setLoaded(true)} sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads" allow={permissions} referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/><div className="embed-help"><span>App not working here?</span><a href={app.url} target="_blank" rel="noreferrer">Open directly <ArrowUpRight size={13}/></a><button className="icon-button" aria-label="Reload embedded app" onClick={()=>setAttempt(a=>a+1)}><RefreshCw size={14}/></button></div></div>
}
