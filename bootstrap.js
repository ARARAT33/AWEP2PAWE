(()=>{'use strict';
const waitForQR=()=>new Promise((resolve,reject)=>{let n=0;const tick=()=>{if(typeof window.qrcode==='function')return resolve();if(++n>120)return reject(Error('QR generator unavailable'));setTimeout(tick,100)};tick()});
const loadLocal=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(Error(src+' unavailable'));document.body.appendChild(s)});
const loadRuntime=()=>loadLocal('./runtime.js');
const start=async()=>{if(window.__aweRuntimeStarted)return;window.__aweRuntimeStarted=true;try{await waitForQR();await loadLocal('./qr-render.js');await loadRuntime()}catch(e){const status=document.querySelector('#qr-status');if(status)status.textContent='Startup error — refresh the page';const toast=document.querySelector('#toast');if(toast){toast.textContent='AWEP2PAWE could not start: '+(e?.message||e);toast.classList.add('show')}}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();