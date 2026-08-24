(()=>{'use strict';
const loadPrivacy=()=>new Promise(resolve=>{const p=document.createElement('script');p.src='./privacy-file.js';p.onload=resolve;p.onerror=resolve;document.body.appendChild(p)});
const start=async()=>{if(window.__aweRuntimeStarted)return;window.__aweRuntimeStarted=true;await loadPrivacy();const s=document.createElement('script');s.src='./runtime.js';document.body.appendChild(s)};
const wait=(n=0)=>{if(typeof window.qrcode==='function')return start();if(n>40){const status=document.querySelector('#qr-status');if(status)status.textContent='QR generator unavailable';const toast=document.querySelector('#toast');if(toast){toast.textContent='QR generator could not load';toast.classList.add('show')}return}setTimeout(()=>wait(n+1),100)};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>wait(),{once:true});else wait();
})();
