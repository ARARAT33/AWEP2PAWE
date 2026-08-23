(()=>{'use strict';
/* Local state durability layer. IndexedDB is the durable store; localStorage remains a tiny bootstrap/cache for the legacy runtime. */
const DB='AWEP2PAWE_DB', STORE='app-state', KEY='root', LEGACY='AWEP2PAWE_STATE_V11', VERSION=2;
let dbPromise;
function db(){if(dbPromise)return dbPromise;dbPromise=new Promise((resolve,reject)=>{const q=indexedDB.open(DB,VERSION);q.onupgradeneeded=()=>{const d=q.result;if(!d.objectStoreNames.contains('blobs'))d.createObjectStore('blobs',{keyPath:'id'});if(!d.objectStoreNames.contains(STORE))d.createObjectStore(STORE,{keyPath:'id'})};q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});return dbPromise}
async function read(){const d=await db();return new Promise((resolve,reject)=>{const t=d.transaction(STORE,'readonly');const r=t.objectStore(STORE).get(KEY);r.onsuccess=()=>resolve(r.result?.value||null);r.onerror=()=>reject(r.error)})}
async function write(value){const d=await db();return new Promise((resolve,reject)=>{const t=d.transaction(STORE,'readwrite');t.objectStore(STORE).put({id:KEY,version:VERSION,value,updatedAt:Date.now()});t.oncomplete=resolve;t.onerror=()=>reject(t.error)})}
async function hydrate(){try{const durable=await read();if(durable&&typeof durable==='string'){const current=localStorage.getItem(LEGACY);if(!current||current==='{}')localStorage.setItem(LEGACY,durable);return}const legacy=localStorage.getItem(LEGACY);if(legacy)await write(legacy)}catch(e){console.warn('Local durable state unavailable:',e)}}
let timer=0;
function mirror(){clearTimeout(timer);timer=setTimeout(()=>{const value=localStorage.getItem(LEGACY);if(value)write(value).catch(()=>{});},250)}
const originalSet=Storage.prototype.setItem;
Storage.prototype.setItem=function(k,v){originalSet.call(this,k,v);if(k===LEGACY)mirror()};
window.AWEStateStore={hydrate,read,write,version:VERSION};
hydrate();
})();
