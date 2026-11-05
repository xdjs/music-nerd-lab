import {InlineEdit} from './InlineEdit';
import React,{useState,useRef,useEffect,useId} from 'react';
import {Copy,Check,ArrowUpRight} from 'lucide-react';
import './recipe.css';
export function ProtocolDetails({app,onSave}){
 const [copied,setCopied]=useState(false),[manual,setManual]=useState(false),[expanded,setExpanded]=useState(false);
 const timer=useRef(),field=useRef(),promptId=useId();
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 useEffect(()=>{if(manual){field.current?.focus();field.current?.select();}},[manual]);
 if(!app.instructions)return <Cookbook app={app} onSave={onSave}/>;
 async function copy(){try{await navigator.clipboard.writeText(app.instructions);setCopied(true);setManual(false);clearTimeout(timer.current);timer.current=setTimeout(()=>setCopied(false),2500);}catch{setManual(true);}}
 return <><Cookbook app={app} onSave={onSave}/><section className="experience-recipe" id="recipe">
  <header className="recipe-intro"><span className="recipe-eyebrow">Your starting point</span><h2>The recipe</h2><p>Copy this prompt into your LLM. It will help you shape your own idea, one question at a time.</p></header>
  <div className="recipe-box"><div className="recipe-bar"><h3>Make it your own</h3><button className="button" onClick={copy}>{copied?<Check size={16}/>:<Copy size={16}/>}<span>{copied?'Copied!':'Copy recipe'}</span></button></div>
   <InlineEdit label="Recipe prompt" value={app.instructions} multiline maxLength={30000} onSave={onSave?value=>onSave({instructions:value}):null}><div id={promptId} className={`recipe-prompt ${expanded?'expanded':''}`}><pre>{app.instructions}</pre></div></InlineEdit>
   <div className="recipe-bottom"><button className="text-button" aria-expanded={expanded} aria-controls={promptId} onClick={()=>setExpanded(!expanded)}>{expanded?'Show less':'Read full prompt'}</button><span>Copies only the starter prompt</span></div>
  </div>
  {manual&&<label className="recipe-manual">Select and copy the recipe below.<textarea ref={field} readOnly value={app.instructions} aria-label="Recipe for manual copying"/></label>}
  <span role="status" className="sr-only">{copied?'Full recipe copied to clipboard.':manual?'Automatic copying is unavailable. Select and copy the recipe below.':''}</span>
 </section></>;
}

function Cookbook({app,onSave}){
 const paragraphs=(app.about||'').split(/\n\n+/);
 const render=(raw,i)=>{
 const text=raw.replace(/^#{1,6} /gm,'').replaceAll('**','').replace(/^> ?/gm,'');
 if(/^[-—]{3,}$/.test(text.trim()))return null;
 if(text.startsWith('|')){const rows=text.split('\n').filter(line=>!/^\|[ :|-]+\|$/.test(line));return <div className="cookbook-table" key={i}><table><tbody>{rows.map((line,j)=><tr key={j}>{line.split('|').slice(1,-1).map((cell,k)=>j===0?<th key={k}>{cell.trim()}</th>:<td key={k}>{cell.trim()}</td>)}</tr>)}</tbody></table></div>;}
 if(text.split('\n').every(line=>/^[•-] /.test(line)))return <ul key={i}>{text.split('\n').map((line,j)=><li key={j}>{line.slice(2)}</li>)}</ul>;
 if(text.includes('\n')&&text.split('\n')[0].length<60&&!text.startsWith('•'))return <div key={i}><h3>{text.split('\n')[0]}</h3><p>{text.slice(text.indexOf('\n')+1)}</p></div>;
 return text.length<100&&!text.includes('\n')?<h3 key={i}>{text}</h3>:<p key={i}>{text}</p>;
 };
 return <section className="experience-recipe cookbook" id="cookbook"><header className="recipe-intro"><span className="recipe-eyebrow">Behind the experience</span><h2>The cookbook</h2><p>The idea, the tools, and the decisions that shaped {app.name}.</p></header><InlineEdit label="Cookbook" value={app.about} multiline maxLength={30000} onSave={onSave?value=>onSave({about:value}):null}><div className="cookbook-story">{paragraphs.slice(0,2).map(render)}{paragraphs.length>2&&<details><summary>Read the full cookbook</summary>{paragraphs.slice(2).map(render)}</details>}</div></InlineEdit>{(app.tools_used||onSave)&&<div className="recipe-notes"><details open={onSave?true:undefined}><summary>Tools &amp; current limits</summary><InlineEdit label="Tools and limits" value={app.tools_used} multiline optional maxLength={2000} onSave={onSave?value=>onSave({tools_used:value}):null}><div className="recipe-proposal"><p style={{whiteSpace:'pre-wrap'}}>{app.tools_used}</p></div></InlineEdit></details></div>}<InlineEdit label="Starting source" type="url" optional value={app.source_url} onSave={onSave?value=>onSave({source_url:value}):null}>{app.source_url&&<p><a className="text-button" href={app.source_url} target="_blank" rel="noreferrer">Starting source <ArrowUpRight size={14}/></a></p>}</InlineEdit></section>;
}
