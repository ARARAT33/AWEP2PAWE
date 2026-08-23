(()=>{
'use strict';
const MAX_LINK=18000;
const toast=(m)=>{const e=document.querySelector('#toast');if(!e)return;e.textContent=m;e.classList.add('show');clearTimeout(window.__aweShareToast);window.__aweShareToast=setTimeout(()=>e.classList.remove('show'),2600)};
const b64u=(s)=>btoa(unescape(encodeURIComponent(s))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const ub64u=(s)=>decodeURIComponent(escape(atob(s.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-s.length%4)%4))));
function makeShareButton(){
  const actions=document.querySelector('#signal-dialog .modal-actions');
  if(!actions||document.querySelector('#share-signal'))return;
  const b=document.createElement('button');b.id='share-signal';b.className='ghost';b.type='button';b.textContent='Share link';
  b.addEventListener('click',async()=>{
    const raw=document.querySelector('#signal-code')?.value?.trim();
    if(!raw)return toast('Create a connection code first');
    const link=`${location.origin}${location.pathname}#awe-signal=${b64u(raw)}`;
    if(link.length>MAX_LINK)return toast('Signal is too large for a URL link; use Copy code');
    try{await navigator.clipboard.writeText(link);toast('Secure connection link copied')}catch{prompt('Share link',link)}
  });
  actions.appendChild(b);
}
function consumeSharedSignal(){
  const m=location.hash.match(/^#awe-signal=([A-Za-z0-9_-]+)$/);if(!m)return;
  try{
    const raw=ub64u(m[1]),area=document.querySelector('#signal-code');
    if(area)area.value=raw;
    document.querySelector('#signal-dialog')?.showModal();
    toast('Connection code loaded. Tap “Paste peer code” to authenticate.');
    history.replaceState(null,'',location.pathname+location.search);
  }catch{toast('Invalid connection link')}
}
function bind(){
  makeShareButton();
  const d=document.querySelector('#signal-dialog');if(d)new MutationObserver(makeShareButton).observe(d,{childList:true,subtree:true});
  consumeSharedSignal();addEventListener('hashchange',consumeSharedSignal,{passive:true});
}
addEventListener('DOMContentLoaded',bind,{once:true});
window.AWEStaticConnect={version:1,createSignalLink:(raw)=>`${location.origin}${location.pathname}#awe-signal=${b64u(String(raw))}`};
})();
