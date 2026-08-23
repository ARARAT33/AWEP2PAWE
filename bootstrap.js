(()=>{'use strict';
const load=(src)=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
const start=()=>{const s=document.createElement('script');s.src='./runtime.js';s.defer=true;document.body.appendChild(s)};
if(window.qrcode){start();return}
load('https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js').then(start).catch(()=>load('https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js').then(start).catch(()=>{
const status=document.querySelector('#qr-status');if(status)status.textContent='QR library unavailable — check connection';
const toast=document.querySelector('#toast');if(toast){toast.textContent='QR generator could not load';toast.classList.add('show')}
}));
})();