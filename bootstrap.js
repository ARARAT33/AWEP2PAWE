(()=>{'use strict';
const sources=[
 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js',
 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js'
];
const start=()=>{if(window.__aweRuntimeStarted)return;window.__aweRuntimeStarted=true;const s=document.createElement('script');s.src='./runtime.js';s.defer=true;document.body.appendChild(s)};
const load=(i=0)=>{if(window.qrcode)return start();if(i>=sources.length){const status=document.querySelector('#qr-status');if(status)status.textContent='QR generator unavailable';const toast=document.querySelector('#toast');if(toast){toast.textContent='QR generator could not load';toast.classList.add('show')}return}const s=document.createElement('script');s.src=sources[i];s.async=false;s.onload=()=>window.qrcode?start():load(i+1);s.onerror=()=>load(i+1);document.head.appendChild(s)};
load();
})();
