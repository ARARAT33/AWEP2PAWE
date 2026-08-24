// Ephemeral WebRTC signaling only. No message/file storage.
const sessions=new Map(),TTL=5*60*1000,MAX=24000,ID=/^[A-Za-z0-9]{10}$/,TOKEN=/^[A-Za-z0-9_-]{40,100}$/,CLIENT=/^[A-Za-z0-9_-]{24,80}$/,SDP=v=>typeof v==='string'&&v.length>20&&v.length<=18000;
const H={'content-type':'application/json; charset=utf-8','cache-control':'no-store, no-cache, max-age=0, must-revalidate','pragma':'no-cache','expires':'0','x-content-type-options':'nosniff','referrer-policy':'no-referrer','x-frame-options':'DENY'};
const json=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:H});
const key=t=>new Request('https://awep2p-signal.invalid/v6/'+t),idKey=i=>new Request('https://awep2p-signal.invalid/v6/id/'+i);
async function load(token){let s=sessions.get(token);if(s)return s;try{const r=await caches.default.match(key(token));const v=r?await r.json():null;if(v&&Date.now()<v.exp){sessions.set(token,v);return v}}catch{}return null}
async function save(token,s,ctx){sessions.set(token,s);try{ctx.waitUntil(caches.default.put(key(token),new Response(JSON.stringify(s),{headers:{'content-type':'application/json','cache-control':'private, max-age=295'}})));ctx.waitUntil(caches.default.put(idKey(s.id),new Response(JSON.stringify({token}),{headers:{'content-type':'application/json','cache-control':'private, max-age=295'}})))}catch{}}
async function remove(token,id){sessions.delete(token);try{await caches.default.delete(key(token));if(id)await caches.default.delete(idKey(id))}catch{}}
async function findById(id){try{const r=await caches.default.match(idKey(id));if(!r)return null;const v=await r.json();return v?.token||null}catch{return null}}
export async function onRequest({request,waitUntil}){
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:H});
 if(request.method!=='POST')return json({ok:false,error:'method not allowed'},405);
 if((Number(request.headers.get('content-length'))||0)>MAX)return json({ok:false,error:'request too large'},413);
 let b;try{b=await request.json()}catch{return json({ok:false,error:'invalid json'},400)}
 const now=Date.now(),a=b.action;
 if(a==='offer'){
   if(!TOKEN.test(b.token)||!ID.test(b.id)||!CLIENT.test(b.client)||!SDP(b.offer))return json({ok:false,error:'invalid offer'},400);
   if(Number(b.exp)!==b.exp||b.exp<now+10000||b.exp>now+TTL+10000)return json({ok:false,error:'invalid expiry'},400);
   if(await load(b.token))return json({ok:false,error:'token collision'},409);
   const exp=Math.min(b.exp,now+TTL),s={id:b.id,offer:b.offer,owner:b.client,exp,created:now,answer:null,answerClient:null,used:false};
   await save(b.token,s,{waitUntil});return json({ok:true,id:s.id,expires:exp});
 }
 let token=TOKEN.test(b.token)?b.token:null;if(!token&&ID.test(b.id))token=await findById(b.id);
 if(!token)return json({ok:false,error:'invalid or expired connection'},400);
 const s=await load(token);if(!s||now>s.exp){await remove(token,s?.id);return json({ok:false,error:'expired'},410)}
 if(!CLIENT.test(b.client))return json({ok:false,error:'invalid client'},400);
 if(b.id&&b.id!==s.id)return json({ok:false,error:'connection mismatch'},403);
 if(b.client===s.owner)return json({ok:false,error:'same peer'},400);
 if(a==='resolve-id')return json({ok:true,id:s.id,token,offer:s.offer,exp:s.exp});
 if(a==='request'){
   if(s.used||s.answer)return json({ok:false,error:'connection already used'},409);
   if(!SDP(b.answer))return json({ok:false,error:'invalid answer'},400);
   s.answer=b.answer;s.answerClient=b.client;s.used=true;await save(token,s,{waitUntil});
   return json({ok:true,connected:true});
 }
 if(a==='poll'){
   if(b.client!==s.owner)return json({ok:false,error:'not owner'},403);
   return json({ok:true,connected:!!s.answer,answer:s.answer||null,oneTime:s.used});
 }
 return json({ok:false,error:'unsupported action'},400);
}
