(()=>{'use strict';
const ENDPOINT='./api/signal';
const UID=/^AWE-[A-Z0-9]{8,64}$/;
let identity=null,assertion=null,beat=0,poll=0,lastPresence='';
const $=s=>document.querySelector(s);
const valid=v=>UID.test(String(v||'').trim().toUpperCase());
const api=async(body)=>{const r=await fetch(ENDPOINT,{method:'POST',headers:{'content-type':'application/json'},cache:'no-store',body:JSON.stringify(body)});if(!r.ok)throw Error('signal '+r.status);return r.json()};
async function ready(){await window.AWEStateStore?.hydrate();identity=await window.AWEStateStore?.getIdentity();if(!identity?.uid)return false;assertion=await window.AWEStateStore.identityAssertion();return true}
async function announce(){if(!assertion||document.visibilityState==='hidden')return;try{assertion=await window.AWEStateStore.identityAssertion();await api({action:'announce',assertion})}catch{}}
async function presence(uid){uid=String(uid||'').trim().toUpperCase();if(!valid(uid))return null;try{const r=await fetch(`${ENDPOINT}?uid=${encodeURIComponent(uid)}`,{cache:'no-store'});if(!r.ok)return null;const x=await r.json();return !!x.online}catch{return null}}
function ensureBadge(){const search=$('.search');if(!search||$('#uid-presence'))return;const b=document.createElement('span');b.id='uid-presence';b.setAttribute('aria-live','polite');b.style.cssText='display:none;margin-left:6px;padding:2px 7px;border-radius:999px;font:700 10px/1.2 system-ui;white-space:nowrap';search.appendChild(b)}
function showPresence(online){ensureBadge();const b=$('#uid-presence');if(!b)return;b.style.display='inline-block';b.textContent=online?'● online':'● offline';b.style.color=online?'#16a34a':'#64748b';b.style.background=online?'rgba(22,163,74,.10)':'rgba(100,116,139,.10)';}
async function checkSearch(){const q=$('#global-search')?.value?.trim().toUpperCase()||'';if(!valid(q)){const b=$('#uid-presence');if(b)b.style.display='none';return}const online=await presence(q);if(online!==null)showPresence(online)}
async function checkConversation(){const n=$('#conversation-name')?.textContent?.trim().toUpperCase()||'';if(!valid(n))return;const online=await presence(n);if(online===null)return;if($('#p2p-status')?.textContent!=='connected'){$('#p2p-status').textContent=online?'online':'offline';showPresence(online)}}
async function pollSignals(){if(!assertion||document.visibilityState==='hidden')return;try{assertion=await window.AWEStateStore.identityAssertion();const r=await api({action:'poll',assertion});for(const s of r.signals||[])window.dispatchEvent(new CustomEvent('awe:signal',{detail:s}))}catch{}}
async function start(){if(!(await ready()))return;await announce();beat=setInterval(announce,20000);poll=setInterval(pollSignals,3000);ensureBadge();let timer=0;$('#global-search')?.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(checkSearch,220)},{passive:true});new MutationObserver(()=>{checkConversation()}).observe($('#conversation-name')||document.body,{subtree:true,childList:true,characterData:true});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){announce();pollSignals();checkConversation()}},{passive:true});addEventListener('pagehide',()=>{clearInterval(beat);clearInterval(poll)},{once:true});window.AWESignal={version:1,presence,refresh:announce};}
addEventListener('DOMContentLoaded',()=>{setTimeout(start,120)},{once:true});
})();
