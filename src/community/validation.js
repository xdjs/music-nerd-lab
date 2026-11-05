export function safeUrl(value,{image=false}={}){
 if(!value)return '';
 if(image&&/^data:image\/(png|jpeg|webp);base64,/.test(value))return value;
 if(image&&/^\/(?!\/)/.test(value))return value;
 try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password)throw Error();return u.href;}catch{throw new Error('Use a valid https:// URL.');}
}
export function slug(value){return value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60);}
export function validateProfile(p){
 if(!/^[a-z][a-z0-9-]{2,29}$/.test(p.id)||['you','creators','following','saved','review','apps','auth','api'].includes(p.id))throw new Error('Choose a handle with 3–30 lowercase letters, numbers, or hyphens.');
 if(!p.name.trim()||p.name.length>60)throw new Error('Enter a display name up to 60 characters.');
 if(p.bio.length>500)throw new Error('Keep your bio under 500 characters.');
 return {...p,name:p.name.trim(),site:safeUrl(p.site),avatar:safeUrl(p.avatar,{image:true}),banner:safeUrl(p.banner,{image:true})};
}
export function validateApp(a){
 if(!a.name.trim()||a.name.length>60)throw new Error('Enter a recipe name up to 60 characters.');
 if(!a.description.trim()||a.description.length>180)throw new Error('Add a short description, up to 180 characters.');
 if(!a.about.trim()||a.about.length>30000)throw new Error('Share how you made it in the cookbook (up to 30,000 characters).');
 if(!a.url?.trim())throw new Error('Add your experience’s HTTPS URL.');
 if(!a.screenshot)throw new Error('Add a screenshot for your recipe.');
 if(!a.instructions?.trim()||a.instructions.length>30000)throw Error('Add the recipe prompt (up to 30,000 characters).');
 if((a.tools_used||'').length>2000)throw Error('Keep tools under 2,000 characters.');
 return {...a,instructions:a.instructions.trim(),source_url:safeUrl(a.source_url||''),tools_used:a.tools_used||'',url:safeUrl(a.url),screenshot:safeUrl(a.screenshot,{image:true}),name:a.name.trim(),description:a.description.trim()};
}
