import {defineConfig,loadEnv} from 'vite';
export default defineConfig(({mode})=>({define:{'import.meta.env.NEXT_PUBLIC_PRIVY_APP_ID':JSON.stringify(loadEnv(mode,process.cwd(),'').NEXT_PUBLIC_PRIVY_APP_ID||'')},resolve:{dedupe:['react','react-dom']},server:{host:'127.0.0.1',port:4186,strictPort:true},preview:{host:'127.0.0.1',port:4186,strictPort:true}}));
