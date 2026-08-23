const peers = globalThis.__aweSignalPeers || (globalThis.__aweSignalPeers = new Map());
const TTL = 45_000;
const MAX_BODY = 24_000;
const UID = /^AWE-[A-Z0-9]{8,64}$/;
const json = (data,status=200,origin='*') => new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store, max-age=0','access-control-allow-origin':origin,'access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'content-type'}});
const prune = () => { const now=Date.now(); for(const [uid,p] of peers) if(now-p.lastSeen>TTL) peers.delete(uid); };
async function verifyAssertion(assertion){
  if(!assertion?.payload || !Array.isArray(assertion.signature)) return null;
  if(assertion.payload.length>8000 || assertion.signature.length>256) return null;
  let p; try { p=JSON.parse(assertion.payload); } catch { return null; }
  if(p?.v!==1 || !UID.test(p.uid) || !p.publicKey || p.publicKey.kty!=='EC' || p.publicKey.crv!=='P-256') return null;
  const key=await crypto.subtle.importKey('jwk',p.publicKey,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
  const ok=await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},key,new Uint8Array(assertion.signature),new TextEncoder().encode(assertion.payload));
  return ok ? p : null;
}
export async function onRequestOptions(){ return new Response(null,{status:204,headers:{'access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'content-type','access-control-max-age':'600'}}); }
export async function onRequestGet({request}){
  prune(); const u=new URL(request.url), uid=(u.searchParams.get('uid')||'').trim().toUpperCase();
  if(!UID.test(uid)) return json({ok:false,error:'invalid uid'},400);
  const peer=peers.get(uid); return json({ok:true,uid,online:!!peer,lastSeen:peer?Date.now()-peer.lastSeen:null});
}
export async function onRequestPost({request}){
  prune(); if(Number(request.headers.get('content-length')||0)>MAX_BODY) return json({ok:false,error:'body too large'},413);
  let body; try{body=await request.json()}catch{return json({ok:false,error:'invalid json'},400)}
  const action=body?.action;
  if(action==='announce'){
    const p=await verifyAssertion(body.assertion); if(!p)return json({ok:false,error:'invalid identity assertion'},401);
    const existing=peers.get(p.uid); peers.set(p.uid,{publicKey:p.publicKey,lastSeen:Date.now(),inbox:existing?.inbox||[]});
    return json({ok:true,uid:p.uid,ttl:TTL});
  }
  if(action==='signal'){
    const from=await verifyAssertion(body.assertion); const to=String(body.to||'').trim().toUpperCase();
    if(!from||!UID.test(to)||to===from.uid)return json({ok:false,error:'invalid peer'},400);
    if(!body.signal || typeof body.signal!=='string' || body.signal.length>16_000)return json({ok:false,error:'invalid signal'},400);
    const target=peers.get(to); if(!target || Date.now()-target.lastSeen>TTL)return json({ok:true,delivered:false,online:false});
    target.inbox.push({from:from.uid,signal:body.signal,at:Date.now()}); target.inbox=target.inbox.slice(-4); target.lastSeen=Date.now();
    return json({ok:true,delivered:true,online:true});
  }
  if(action==='poll'){
    const p=await verifyAssertion(body.assertion); if(!p)return json({ok:false,error:'invalid identity assertion'},401);
    const me=peers.get(p.uid); if(!me)return json({ok:true,signals:[]});
    const signals=me.inbox.splice(0,4); me.lastSeen=Date.now(); return json({ok:true,signals});
  }
  return json({ok:false,error:'unsupported action'},400);
}
