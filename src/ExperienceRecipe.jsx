import React,{useState,useRef,useEffect} from 'react';
import {Copy,Check,ArrowUpRight} from 'lucide-react';
import fallbackRecipe from './medellin-recipe.txt?raw';
import './recipe.css';

const resources=[
 ['Universo Centro: Medellín con M de Metal','Scene history, rehearsal spaces and photographic archives.','https://universocentro.com.co/medellin-con-m-de-metal/'],
 ['MUROCK’s historical exhibition','The earlier rock context.','https://murock.org/exposicion_virtual/historia-del-rock-en-medelllin-lado-a-1964-1990/'],
 ['Centro Nacional de Memoria Histórica','Political and social context.','https://centrodememoriahistorica.gov.co/micrositios/basta-ya-medellin/'],
 ['Masacre interview in Switch','Artist testimony.','https://revistaswitch.com/masacre-35-anos-de-pasion-crudeza-y-brutalidad-entrevista/'],
 ['HateWorks: Total Death','Production credit.','https://www.hateworks.net/shop/masacre-total-death'],
 ['Full source collection','Additional interviews, documentaries, labels and image credits.','https://medellinmetal-mn.vercel.app/#/en/sources'],
];

export function ExperienceRecipe({app}){
 const recipe=app?.instructions?.trim()||fallbackRecipe;
 const [expanded,setExpanded]=useState(false),[copied,setCopied]=useState(false),[fallback,setFallback]=useState(false);
 const timer=useRef(),manual=useRef();
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 useEffect(()=>{if(fallback){manual.current?.focus();manual.current?.select();}},[fallback]);
 async function copy(){try{await navigator.clipboard.writeText(recipe.trim());setCopied(true);setFallback(false);clearTimeout(timer.current);timer.current=setTimeout(()=>setCopied(false),2500);}catch{setFallback(true);}}
 return <section className="experience-recipe" id="recipe" aria-labelledby="recipe-title">
  <header className="recipe-intro"><span className="recipe-eyebrow">Behind the experience</span><h2 id="recipe-title">Medellín Metal — from a reel to an interactive music documentary</h2><p>An experiment in turning a starting source into a researched, bilingual listening experience. Built through iterative research, writing, design and browser review.</p></header>
  <div className="recipe-box"><div className="recipe-bar"><h3>Try the protocol</h3><button className="button" onClick={copy}>{copied?<Check size={16}/>:<Copy size={16}/>}<span>{copied?'Copied!':'Copy protocol'}</span></button></div>
   <div id="recipe-prompt" className={`recipe-prompt ${expanded?'expanded':''}`}><pre>{recipe.trim()}</pre></div>
   <div className="recipe-bottom"><button className="text-button" aria-expanded={expanded} aria-controls="recipe-prompt" onClick={()=>setExpanded(!expanded)}>{expanded?'Show less':'Read full protocol'}</button><span>Copies the complete prompt</span></div>
  </div>
  <span className="sr-only" role="status">{copied?'Full protocol copied to clipboard.':fallback?'Automatic copying is unavailable. Select and copy the protocol below.':''}</span>
  {fallback&&<label className="recipe-manual">Select and copy the protocol below.<textarea ref={manual} readOnly value={recipe.trim()} aria-label="Protocol for manual copying"/></label>}
  {app?.source_url&&<p><a className="text-button" href={app.source_url} target="_blank" rel="noreferrer">Starting source <ArrowUpRight size={14}/></a></p>}
  <div className="recipe-notes">
   <details><summary>What actually powered this version</summary>{app?.tools_used?<div className="recipe-proposal"><p style={{whiteSpace:'pre-wrap'}}>{app.tools_used}</p></div>:<ul>
    <li><strong>Apify API:</strong> <code>apify/instagram-reel-scraper</code>, with <code>includeTranscript: true</code>.</li>
    <li><strong>Research:</strong> web research and source comparison, documented in a research dossier.</li>
    <li><strong>Playback:</strong> Bandcamp and YouTube embeds—not a custom streaming service.</li>
    <li><strong>Application:</strong> HTML, CSS and JavaScript, with structured local content and browser storage for preferences and saved items.</li>
    <li><strong>Hosting:</strong> Vercel.</li>
    <li><strong>Music Nerd:</strong> branding and product direction. This version did not read from or write to the Music Nerd API/database.</li>
   </ul>}</details>
   <details><summary>Core research resources</summary><ul className="recipe-resources">{resources.map(([name,description,url])=><li key={url}><a href={url} target="_blank" rel="noreferrer">{name}<ArrowUpRight size={14}/></a><p>{description}</p></li>)}</ul></details>
   <details><summary>Proposed Music Nerd integration <span className="recipe-status">Simulation</span></summary><div className="recipe-proposal"><p>The reusable workflow would be:</p><p className="recipe-flow">Prompt or source → search Music Nerd → identify research gaps → research with citations → propose structured additions/corrections → review → save → generate the experience.</p><p>For example, researching <em>Total Death</em> could first retrieve Masacre and Erik Rutan from Music Nerd, inspect existing credits, then propose a sourced production relationship if it is missing. If a stored credit conflicts with the evidence, create a reviewable correction with both sources rather than silently overwriting it.</p><p>The documentary would reference persistent entity and source IDs, allowing future experiences to reuse that research. Its chapter order and editorial interpretation would remain separate from the underlying factual records.</p><p>A skill could orchestrate this process. The API would still need supported capabilities for entity matching, research jobs, source storage, relationships and reviewed corrections. Those capabilities should be checked against the actual API before presenting this as a working integration.</p></div></details>
  </div>
 </section>;
}
