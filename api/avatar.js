import postgres from 'postgres';
import {createClient} from '@supabase/supabase-js';
import {serveAvatar} from '../server/serveAvatar.js';
let db,storage;
export default async function handler(req,res){
 return serveAvatar(req,res,{
  async findAccount(creator){
   db??=postgres(process.env.SUPABASE_DB_CONNECTION,{prepare:false,max:1,idle_timeout:20,connect_timeout:10,ssl:'require'});
   const [account]=await db`select u.id,u.privy_user_id,u.is_hidden from public.mn_profiles p join public.users u on u.id=p.user_id where p.id=${creator} and u.is_hidden is not true`;
   return account;
  },
  async download(path){
   storage??=createClient(process.env.VITE_SUPABASE_URL,process.env.VITE_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(url,options)=>fetch(url,{...options,signal:AbortSignal.timeout(10000)})}}).storage;
   const {data,error}=await storage.from('user-profile-images').download(path);
   if(error){if(['404','400'].includes(String(error.statusCode))&&/not found|does not exist/i.test(error.message))return null;throw error;}
   return Buffer.from(await data.arrayBuffer());
  }
 });
}
