import React,{createContext,useContext,useMemo} from 'react';
import {PrivyProvider,usePrivy} from '@privy-io/react-auth';
const appId=import.meta.env.NEXT_PUBLIC_PRIVY_APP_ID;
const Context=createContext({configured:false,ready:true,authenticated:false,user:null});
function Session({children}){const session=usePrivy();const value=useMemo(()=>({...session,configured:true}),[session.ready,session.authenticated,session.user,session.login,session.logout,session.getAccessToken]);return <Context.Provider value={value}>{children}</Context.Provider>}
export function LabAuth({children}){if(!appId)return children;return <PrivyProvider appId={appId} config={{appearance:{theme:'dark',accentColor:'#E91E8C',logo:'/music-nerd.png'},loginMethods:['email'],embeddedWallets:{ethereum:{createOnLogin:'off'}}}}><Session>{children}</Session></PrivyProvider>}
export const useLabAuth=()=>useContext(Context);
