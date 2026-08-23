(()=>{'use strict';
/* Durable local state + browser-native cryptographic identity bootstrap. No server, database, or cloud copy. */
const DB='AWEP2PAWE_DB', STORE='app-state', KEY='root', IDENTITY='identity', LEGACY='AWEP2PAWE_STATE_V11', CORE='awep2pawe:v6', VERSION=3;
let dbPromise;
const open=()=>{if(dbPromise)return dbPromise;dbPromise=new Promise((resolve,reject)=>{const q=indexedDB.open(DB,VERSION);q.onupgradeneeded=()=>{const d=q.result;if(!d.objectStoreNames.contains('blobs'))d.createObjectStore('blobs',{keyPath:'id'});if(!d.objectStoreNames.contains(STORE))d.createObjectStore(STORE,{keyPath:'id'});if(!d.objectStoreNames.contains(IDENTITY))d.createObjectStore(IDENTITY,{keyPath:'id'})};q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});return dbPromise};
const tx=(store,mode,fn)=>open().then(d=>new Promise((resolve,reject)=>{const t=d.transaction(store,mode),s=t.objectStore(store);let result;try{result=fn(s)}catch(e){reject(e);return}t.oncomplete=()=>resolve(result);t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error||Error('IndexedDB transaction aborted'))}));
async function read(){const d=await open();return new Promise((resolve,reject)=>{const r=d.transaction(STORE,'readonly').objectStore(STORE).get(KEY);r.onsuccess=()=>resolve(r.result?.value??null);r.onerror=()=>reject(r.error)})}
async function write(value){return tx(STORE,'readwrite',s=>s.put({id:KEY,version:VERSION,value,updatedAt:Date.now()}))}
const randomUid=()=>`AWE-${crypto.randomUUID().replaceAll('-','').slice(0,20).toUpperCase()}`;
async function ensureIdentity(){
  /* Bootstrap UID synchronously so the application and every runtime share one identity. */
  let uid='';try{const state=JSON.parse(localStorage.getItem(CORE)||'{}');uid=state.uid||''}catch{}
  if(!/^AWE-[A-Z0-9]{20}$/.test(uid)){uid=randomUid();try{const state=JSON.parse(localStorage.getItem(CORE)||'{}');state.uid=uid;localStorage.setItem(CORE,JSON.stringify(state))}catch{}}
  try{
    const d=await open();const existing=await new Promise((resolve,reject)=>{const r=d.transaction(IDENTITY,'readonly').objectStore(IDENTITY).get('primary');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
    if(existing?.uid===uid&&existing.publicKey&&existing.privateKey)return existing;
    if(!crypto.subtle)return {uid};
    const pair=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
    const publicKey=await crypto.subtle.exportKey('jwk',pair.publicKey),privateKey=await crypto.subtle.exportKey('jwk',pair.privateKey);
    const identity={id:'primary',uid,algorithm:'ECDSA-P256-SHA256',publicKey,privateKey,createdAt:Date.now(),version:1};
    await tx(IDENTITY,'readwrite',s=>s.put(identity));
    return identity;
  }catch(e){console.warn('Cryptographic identity persistence unavailable:',e);return {uid}}
}
async function getIdentity(){const d=await open();return new Promise((resolve,reject)=>{const r=d.transaction(IDENTITY,'readonly').objectStore(IDENTITY).get('primary');r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error)})}
async function sign(data){const i=await getIdentity();if(!i?.privateKey)throw Error('Identity key unavailable');const key=await crypto.subtle.importKey('jwk',i.privateKey,{name:'ECDSA',namedCurve:'P-256'},false,['sign']);const bytes=typeof data==='string'?new TextEncoder().encode(data):data;return new Uint8Array(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},key,bytes))}
async function hydrate(){try{await ensureIdentity();const durable=await read();if(durable&&typeof durable==='string'){const current=localStorage.getItem(LEGACY);if(!current||current==='{}')localStorage.setItem(LEGACY,durable);return}const legacy=localStorage.getItem(LEGACY);if(legacy)await write(legacy)}catch(e){console.warn('Local durable state unavailable:',e)}}
let timer=0;function mirror(){clearTimeout(timer);timer=setTimeout(()=>{const value=localStorage.getItem(LEGACY);if(value)write(value).catch(()=>{})},250)}
const originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){originalSet.call(this,k,v);if(k===LEGACY)mirror()};
window.AWEStateStore={hydrate,read,write,getIdentity,sign,version:VERSION};
ensureIdentity();hydrate();
})();
