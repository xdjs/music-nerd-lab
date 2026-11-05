// Retired: shared avatars are read directly, never imported or copied.
export default function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 return res.status(410).json({error:'Your photo is now shared automatically from Music Nerd. Refresh the Lab.'});
}
