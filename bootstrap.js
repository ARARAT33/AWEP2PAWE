(()=>{'use strict';
const waitForQR=()=>new Promise((resolve,reject)=>{let n=0;const tick=()=>{if(typeof window.qrcode==='function')return resolve();if(++n>120)return reject(Error('QR generator unavailable'));setTimeout(tick,100)};tick()});
const loadRuntime=()=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='./runtime.js';s.onload=resolve;s.onerror=()=>reject(Error('runtime.js unavailable'));document.body.appendChild(s)});
const start=async()=>{if(window.__aweRuntimeStarted)return;window.__aweRuntimeStarted=true;try{await waitForQR();await loadRuntime()}catch(e){const status=document.querySelector('#qr-status');if(status)status.textContent='Startup error — refresh the page';const toast=document.querySelector('#toast');if(toast){toast.textContent='AWEP2PAWE could not start: '+(e?.message||e);toast.classList.add('show')}}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
