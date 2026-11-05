const fs=require('node:fs');
const path=require('node:path');
const sharp=require('sharp');
const opentype=require('opentype.js');
const root=path.resolve(__dirname,'..');
const assets=path.join(root,'design/share-assets');
const output=path.join(root,'public/social');
const fontBytes=fs.readFileSync(path.join(assets,'Inter-Bold.ttf'));
const font=opentype.parse(fontBytes.buffer.slice(fontBytes.byteOffset,fontBytes.byteOffset+fontBytes.byteLength));
const pink='#fb57c0';
function text(value,x,y,size,color){
 let cursor=x;let paths='';const glyphs=Array.from(value.normalize('NFC'),char=>font.charToGlyph(char));
 glyphs.forEach((glyph,i)=>{const p=glyph.getPath(cursor,y,size);paths+=`<path fill="${color}" d="${p.toPathData(3)}"/>`;cursor+=(glyph.advanceWidth+ (glyphs[i+1]?font.getKerningValue(glyph,glyphs[i+1]):0))*size/font.unitsPerEm-size*.045;});
 if(cursor>1152)throw Error('Text exceeds safe area');return paths;
}
const uri=(bytes,type='png')=>`data:image/${type};base64,${bytes.toString('base64')}`;
async function render(name,{label,kicker,lines,photo=false}){
 const glasses=await sharp(path.join(assets,'glasses-pink.png')).resize(photo?100:484).png().toBuffer();
 let art='';
 if(photo){const portrait=await sharp(path.join(assets,'medellin.jpg')).resize(720,720,{fit:'cover',position:'top'}).png().toBuffer();art=`<image href="${uri(portrait)}" x="480" y="0" width="720" height="720"/><rect width="1200" height="630" fill="url(#shade)"/>`;}
 let type=text(label,54,83,26,'#ffffff');
 type+=text(kicker,53,photo?245:258,photo?81:76,pink);
 for(const [i,line] of lines.entries())type+=text(line,48,(photo?367:394)+i*115,photo?112:113,'#ffffff');
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><linearGradient id="shade"><stop offset="0" stop-color="black" stop-opacity=".98"/><stop offset=".49" stop-color="black" stop-opacity=".94"/><stop offset=".82" stop-color="black" stop-opacity=".25"/><stop offset="1" stop-color="black" stop-opacity="0"/></linearGradient></defs><rect width="1200" height="630" fill="black"/>${art}${type}<image href="${uri(glasses)}" x="${photo?1052:668}" y="${photo?511:137}" width="${photo?100:484}" height="${photo?71:484*1370/1929}"/></svg>`;
 await sharp(Buffer.from(svg)).png().toFile(path.join(output,name+'.png'));
 fs.writeFileSync(path.join(assets,name+'.svg'),svg);
}
(async()=>{fs.mkdirSync(output,{recursive:true});await render('music-nerd-lab-v2',{label:'Music Nerd Lab',kicker:'Go deeper into',lines:['the music.']});await render('medellin-metal-v2',{label:'Music Nerd Lab',kicker:'Nerd out on',lines:['Medellín','Metal'],photo:true});await render('music-nerd-lens-v2',{label:'Music Nerd Lab',kicker:'Nerd out on',lines:['Music Nerd','Lens']});console.log('Generated three 1200 × 630 share cards.');})();
