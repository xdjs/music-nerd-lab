import {useState} from 'react';
export function useStored(key, fallback) {
 const [value,setValue] = useState(()=>{try {return JSON.parse(localStorage.getItem('mn-apps:'+key)) ?? fallback;}catch{return fallback;}});
 function update(next){setValue(prev=>{const val=typeof next==='function'?next(prev):next;try{localStorage.setItem('mn-apps:'+key,JSON.stringify(val));}catch{} return val;});}
 return [value,update];
}
