(()=>{'use strict';
/* Durable local state + browser-native cryptographic identity. No server, database, or cloud copy. */
const DB='AWEP2PAWE_DB', STORE='app-state', KEY='root', IDENTITY='identity', LEGACY='AWEP2PAWE_STATE_V11', CORE='awep2p:local', VERSION=7;
let dbPromise;
const open=()=>{if(dbPromise)return dbPromise;dbPromise=new Promise((resolve,reject)=>{const q=indexedDB.open(DB,VERSION);q.onupgradeneeded=()=>{const d=q.result;if(!d.objectStoreNames.contains('blobs'))d.createObjectStore('blobs',{keyPath:'id'});if(!d.objectStoreNames.contains(STORE))d.createObjectStore(STORE,{keyPath:'id'});if(!d.objectStoreNames.contains(IDENTITY))d.createObjectStore(IDENTITY,{keyPath:'id'})};q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});return dbPromise};
const tx=(store,mode,fn)=>open().then(d=>new Promise((resolve,reject)=>{const t=d.transaction(store,mode),s=t.objectStore(store);let result;try{result=fn(s)}catch(e){reject(e);return}t.oncomplete=()=>resolve(result);t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error||Error('IndexedDB transaction aborted'))}));
async function read(){const d=await open();return new Promise((resolve,reject)=>{const r=d.transaction(STORE,'readonly').objectStore(STORE).get(KEY);r.onsuccess=()=>resolve(r.result?.value??null);r.onerror=()=>reject(r.error)})}
async function write(value){return tx(STORE,'readwrite',s=>s.put({id:KEY,version:VERSION,value,updatedAt:Date.now()}))}
const validUid=uid=>typeof uid==='string'&&/^AWE-[A-Z0-9]{8,}$/.test(uid);
const randomUid=()=>{const bytes=crypto.getRandomValues(new Uint8Array(8));const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';let id='';for(const b of bytes)id+=alphabet[b%alphabet.length];return `AWE-${id}`};
async function readIdentityRecord(){const d=await open();return new Promise((resolve,reject)=>{const r=d.transaction(IDENTITY,'readonly').objectStore(IDENTITY).get('primary');r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error)})}
async function ensureIdentity(){
  let localUid='';try{const state=JSON.parse(localStorage.getItem(CORE)||'{}');localUid=state.uid||''}catch{}
  if(!globalThis.crypto?.subtle||!globalThis.indexedDB)throw Error('Web Crypto and IndexedDB are required for persistent identity');
  const existing=await readIdentityRecord();
  if(validUid(existing?.uid)&&existing.privateKey instanceof CryptoKey&&existing.publicKey?.kty==='EC'){
    try{const state=JSON.parse(localStorage.getItem(CORE)||'{}');if(state.uid!==existing.uid){state.uid=existing.uid;localStorage.setItem(CORE,JSON.stringify(state))}}catch{}
    return existing;
  }
  const uid=validUid(existing?.uid)?existing.uid:(validUid(localUid)?localUid:randomUid());
  const pair=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},false,['sign','verify']);
  const publicKey=await crypto.subtle.exportKey('jwk',pair.publicKey);
  const identity={id:'primary',uid,algorithm:'ECDSA-P256-SHA256',publicKey,privateKey:pair.privateKey,createdAt:existing?.createdAt||Date.now(),version:5};
  await tx(IDENTITY,'readwrite',s=>s.put(identity));
  try{const state=JSON.parse(localStorage.getItem(CORE)||'{}');state.uid=uid;localStorage.setItem(CORE,JSON.stringify(state))}catch{}
  return identity;
}
async function getIdentity(){const identity=await readIdentityRecord();if(!validUid(identity?.uid)||!(identity.privateKey instanceof CryptoKey))throw Error('Persistent cryptographic identity unavailable');return identity}
const encode=data=>typeof data==='string'?new TextEncoder().encode(data):new Uint8Array(data);
async function sign(data){const i=await getIdentity();return new Uint8Array(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},i.privateKey,encode(data)))}
async function verify(data,signature,publicJwk){if(!publicJwk||publicJwk.kty!=='EC')return false;const key=await crypto.subtle.importKey('jwk',publicJwk,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);return crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},key,signature instanceof Uint8Array?signature:new Uint8Array(signature),encode(data))}
async function identityAssertion(){const i=await getIdentity();const payload=JSON.stringify({v:1,uid:i.uid,publicKey:i.publicKey,issuedAt:Date.now()});return {payload,signature:Array.from(await sign(payload))}}
async function verifyAssertion(assertion){if(!assertion?.payload||!assertion?.signature)return false;let p;try{p=JSON.parse(assertion.payload)}catch{return false}if(!validUid(p.uid)||!p.publicKey)return false;return verify(assertion.payload,new Uint8Array(assertion.signature),p.publicKey)}
async function hydrate(){const identity=await ensureIdentity();const durable=await read();if(durable&&typeof durable==='string'){try{const current=localStorage.getItem(LEGACY);if(!current||current==='{}')localStorage.setItem(LEGACY,durable)}catch{}return identity}const legacy=localStorage.getItem(LEGACY);if(legacy)await write(legacy);return identity}
let timer=0;function mirror(){clearTimeout(timer);timer=setTimeout(()=>{const value=localStorage.getItem(LEGACY);if(value)write(value).catch(()=>{})},250)}
const originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){originalSet.call(this,k,v);if(k===LEGACY)mirror()};
window.AWEStateStore={hydrate,read,write,getIdentity,sign,verify,identityAssertion,verifyAssertion,version:VERSION};
hydrate().catch(e=>{window.AWEStateStore.error=e;console.error('AWEP2PAWE persistent identity initialization failed',e)});
addEventListener('DOMContentLoaded',()=>{const s=document.createElement('script');s.src='./static-connect.js';s.async=false;s.onerror=()=>{};document.head.appendChild(s)},{once:true});
addEventListener('DOMContentLoaded',()=>{const clear=document.querySelector('#clear-data');if(!clear)return;clear.addEventListener('click',async e=>{e.preventDefault();e.stopImmediatePropagation();if(!confirm('Delete all local data and this device identity?'))return;try{localStorage.clear();const d=await indexedDB.databases?.();if(Array.isArray(d)&&d.some(x=>x.name===DB)){await new Promise((resolve,reject)=>{const r=indexedDB.deleteDatabase(DB);r.onsuccess=()=>resolve();r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('Local database is busy'))})}else{await new Promise((resolve,reject)=>{const r=indexedDB.deleteDatabase(DB);r.onsuccess=()=>resolve();r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('Local database is busy'))})}location.reload()}catch(err){console.error(err);alert('Local data could not be fully deleted. Close other AWEP2PAWE tabs and try again.')}},{capture:true})},{once:true});
})();
