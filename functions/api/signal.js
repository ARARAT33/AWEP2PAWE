// Ephemeral WebRTC signaling only. No accounts, names, messages or files are persisted.
const sessions=new Map(),TTL=10*60*1000,MAX=24000;
const H={'content-type':'application/json; charset=utf-8','cache-control':'no-store, no-cache, must-revalidate','access-control-allow-origin':'*','access-control-allow-methods':'POST, OPTIONS','access-control-allow-headers':'content-type'};
const CH={'content-type':'application/json','cache-control':'public, max-age=600'};
const json=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:H});
const okToken=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{20,100}$/.test(v),okId=v=>typeof v==='string'&&/^[A-Za-z0-9]{8,10}$/.test(v),okClient=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{12,80}$/.test(v),okSdp=v=>typeof v==='string'&&v.length>20&&v.length<=18000;
const key=t=>new Request('https://awep2p-signal.invalid/v4/'+t),idKey=i=>new Request('https://awep2p-signal.invalid/v4/id/'+i);
async function load(token){let s=sessions.get(token);if(s)return s;try{const r=await caches.default.match(key(token));s=r?await r.json():null;if(s&&Date.now()<s.exp){sessions.set(token,s);return s}}catch{}return null}
async function save(token,s,ctx){sessions.set(token,s);try{ctx.waitUntil(caches.default.put(key(token),new Response(JSON.stringify(s),{headers:CH})));ctx.waitUntil(caches.default.put(idKey(s.id),new Response(JSON.stringify({token}),{headers:CH})))}catch{}}
async function remove(token,id){sessions.delete(token);try{await caches.default.delete(key(token));if(id)await caches.default.delete(idKey(id))}catch{}}
async function findById(id){try{const r=await caches.default.match(idKey(id));if(!r)return null;const x=await r.json();return x?.token||null}catch{return null}}
export async function onRequest({request,waitUntil}){
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:H});
 if(request.method!=='POST')return json({ok:false,error:'method not allowed'},405);
 if((Number(request.headers.get('content-length'))||0)>MAX)return json({ok:false,error:'request too large'},413);
 let b;try{b=await request.json()}catch{return json({ok:false,error:'invalid json'},400)}
 const now=Date.now(),a=b.action;
 if(a==='offer'){
   if(!okToken(b.token)||!okId(b.id)||!okClient(b.client)||!okSdp(b.offer))return json({ok:false,error:'invalid offer'},400);
   if(await load(b.token))return json({ok:false,error:'session collision'},409);
   const exp=Math.min(Number(b.exp)||now+TTL,now+TTL),s={id:b.id,offer:b.offer,owner:b.client,exp,created:now,last:now,answer:null,answerClient:null,used:false};
   await save(b.token,s,{waitUntil});return json({ok:true,id:s.id,expires:exp});
 }
 let token=b.token;if(!okToken(token)&&okId(b.id))token=await findById(b.id);
 if(!okToken(token))return json({ok:false,error:'invalid connection id'},400);
 const s=await load(token);if(!s||now>s.exp){await remove(token,s?.id);return json({ok:false,error:'expired'},410)}
 if(!okClient(b.client))return json({ok:false,error:'invalid client'},400);
 if(b.client===s.owner)return json({ok:false,error:'same peer'},400);
 s.last=now;
 switch(a){
   case 'request':if(s.used)return json({ok:false,error:'connection already used'},409);if(!okSdp(b.answer))return json({ok:false,error:'invalid answer'},400);s.answer=b.answer;s.answerClient=b.client;s.used=true;await save(token,s,{waitUntil});return json({ok:true,connected:true});
   case 'poll':return json({ok:true,connected:!!s.answer,answer:s.answer||null,oneTime:s.used});
   case 'resolve-id':return json({ok:true,id:s.id,offer:s.offer,exp:s.exp});
   default:return json({ok:false,error:'unsupported action'},400)
 }
}
