import recipeListings from './recipe-listings.json';
import lensRecipe from './lens-recipe.txt?raw';
import lensTools from './lens-tools.txt?raw';
export const creators = [
 {id:'peterango',name:'Pete Rango',initials:'pr',color:'pink',bio:'Building new ways to experience music.',tag:'Music Nerd creator'},
 {id:'musicnerd',name:'Music Nerd',initials:'mn',color:'pink',bio:'Little experiments for people who care a lot about music.',tag:'The house playground',site:'https://musicnerd.net'},
];
export const apps = [
 {id:'musicnerd-lens',name:'Music Nerd Lens',creator:'peterango',category:'Discover',kind:'external',url:'https://v0-musicnerd-lens.vercel.app/',description:'Find the stories behind records, posters, and setlists.',about:"Point your camera at a record, poster, setlist, instrument or everyday object to explore its music connections. Lens identifies the subject, shows three initial facts, then asks for four more as you swipe. Open the source links to follow a connection, or save the scan in this browser.\n\nBuilt by Pete Rango with v0 and Gemini. Photos are sent to Google Gemini for analysis. Facts and links are model-generated, not independently verified; saved scans are local and are not connected to your Music Nerd account.",instructions:lensRecipe,tools_used:lensTools,date:4},
 {id:'medellin-metal',name:'Medellín Metal',creator:'peterango',category:'Artifacts',kind:'external',url:'https://medellinmetal-mn.vercel.app/',screenshot:'https://medellinmetal-mn.vercel.app/assets/parabellum-archive.jpg',permissions:[],price:'Free',account_required:false,description:'A listening history of Medellín’s metal scene and its connections to the world.',about:'Explore the bands, records, people, and places behind Medellín’s metal scene through an interactive story, listening room, timeline, and source archive. Available in English and Spanish. Archive photography: Román González / Universo Centro.',date:5},
].map(app=>({...app,...recipeListings.find(row=>row.id===app.id)}));
export const categories = ['All recipes','Discover','Artifacts','Make music','Sound toys','Tools'];
