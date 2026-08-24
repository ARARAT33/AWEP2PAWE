(()=>{'use strict';
const loadPrivacy=()=>new Promise(resolve=>{const p=document.createElement('script');p.src='./privacy-file.js';p.onload=resolve;p.onerror=resolve;document.body.appendChild(p)});
const waitForQR=()=>new Promise((resolve,reject)=>{let n=0;const tick=()=>{if(typeof window.qrcode==='function')return resolve();if(++n>120)return reject(Error('QR generator unavailable'));setTimeout(tick,100)};tick()});
const loadRuntime=()=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='./runtime.js';s.onload=resolve;s.onerror=()=>reject(Error('runtime.js unavailable'));document.body.appendChild(s)});
const wireChooseControls=()=>{for(const id of ['choose-top','choose']){const b=document.getElementById(id);if(b)b.addEventListener('click',()=>{const input=document.getElementById('qr-image');if(input){input.value='';input.click()}},{capture:true})}};
const start=async()=>{if(window.__aweRuntimeStarted)return;window.__aweRuntimeStarted=true;try{await loadPrivacy();await waitForQR();const original=window.qrcode;window.qrcode=(typeNumber='0',level='L')=>original(0,'L');await loadRuntime();wireChooseControls()}catch(e){const status=document.querySelector('#qr-status');if(status)status.textContent='Startup error — refresh the page';const toast=document.querySelector('#toast');if(toast){toast.textContent='AWEP2PAWE could not start: '+(e?.message||e);toast.classList.add('show')}}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
