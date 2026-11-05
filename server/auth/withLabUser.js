import postgres from 'postgres';
let db;
export async function withLabUser(privyId,work){
 if(!process.env.SUPABASE_DB_CONNECTION)throw Object.assign(Error('Account connection is unavailable.'),{status:503});
 db??=postgres(process.env.SUPABASE_DB_CONNECTION,{prepare:false,max:2,idle_timeout:20,connect_timeout:10,ssl:'require'});
 return db.begin(async tx=>{
  const [identity]=await tx`select id,username,is_hidden from public.users where privy_user_id=${privyId}`;
  if(!identity)throw Object.assign(Error('Finish setting up your account at musicnerd.net, then return here and retry.'),{status:409});
  if(identity.is_hidden)throw Object.assign(Error('This account cannot access the Lab.'),{status:403});
  await tx`select set_config('request.jwt.claims',${JSON.stringify({sub:identity.id,is_anonymous:false})},true)`;
  const claims=await tx`select artist_id from public.artist_claims where user_id=${identity.id} and status='approved' order by created_at limit 10`;
  return work(tx,{id:identity.id,name:identity.username?.trim()&&!identity.username.includes('@')?identity.username.trim().slice(0,60):'Music Nerd member',accountUrl:'https://musicnerd.net/profile',artistUrls:claims.map(c=>'https://musicnerd.net/artist/'+c.artist_id)});
 });
}
