(()=>{'use strict';
const loadPrivacy=()=>new Promise(resolve=>{const p=document.createElement('script');p.src='./privacy-file.js';p.onload=resolve;p.onerror=resolve;document.body.appendChild(p)});
const loadScript=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.body.appendChild(s)});
const waitForQR=()=>new Promise((resolve,reject)=>{let n=0;const tick=()=>{if(typeof window.qrcode==='function'&&typeof window.QrScanner==='function')return resolve();if(++n>60)return reject(Error('QR libraries unavailable'));setTimeout(tick,100)};tick()});
const patchedRuntime=async()=>{
  const r=await fetch('./runtime.js',{cache:'no-store'});
  if(!r.ok)throw Error('runtime.js unavailable');
  let source=await r.text();
  const replacement=`async function scan(){const d=$('#scanner'),v=$('#scan-video');if(!d||!v||typeof QrScanner!=='function')return toast('QR scanner unavailable');stopScanner();try{d.showModal();$('#scanner-status').textContent='Starting camera…';const scanner=new QrScanner(v,result=>{const raw=typeof result==='string'?result:result?.data;if(!raw)return;window.__aweQrScanner?.stop();stopScanner();try{d.close()}catch{}decodeInput(raw).catch(()=>toast('Could not process QR'))},{preferredCamera:'environment',maxScansPerSecond:12,highlightScanRegion:true,highlightCodeOutline:true,onDecodeError:()=>{}});window.__aweQrScanner=scanner;await scanner.start();$('#scanner-status').textContent='Point the camera at the QR code…';}catch(e){stopScanner();try{d.close()}catch{}const m=String(e?.message||e);toast(/permission|denied/i.test(m)?'Camera permission denied':(/secure context|https/i.test(m)?'Camera requires HTTPS': 'Camera could not start'));$('#scanner-status').textContent='Camera unavailable — choose a QR image instead.'}}
async function scanImage(file){if(!file)return;try{if(typeof QrScanner!=='function')throw Error('QR scanner unavailable');$('#scanner-status').textContent='Reading image…';const result=await QrScanner.scanImage(file,{returnDetailedScanResult:true,alsoTryWithoutScanRegion:true});const raw=typeof result==='string'?result:result?.data;if(!raw)throw Error('No QR code found');try{window.__aweQrScanner?.stop()}catch{}stopScanner();try{$('#scanner').close()}catch{}await decodeInput(raw)}catch(e){toast(/No QR/i.test(String(e))?'No QR code found in image':'Could not read QR image');$('#scanner-status').textContent='No readable QR found — try a clearer image.'}}
function send(`;
  const re=/async function scan\(\)\{[\s\S]*?function send\(/;
  if(!re.test(source))throw Error('Runtime scanner section not found');
  source=source.replace(re,replacement);
  const blob=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));
  const s=document.createElement('script');s.src=blob;s.onload=()=>setTimeout(()=>URL.revokeObjectURL(blob),1000);s.onerror=()=>{URL.revokeObjectURL(blob);throw Error('Patched runtime failed')};document.body.appendChild(s);
};
const start=async()=>{if(window.__aweRuntimeStarted)return;window.__aweRuntimeStarted=true;try{await loadPrivacy();await waitForQR();await patchedRuntime()}catch(e){const status=document.querySelector('#qr-status');if(status)status.textContent='Startup error — refresh the page';const toast=document.querySelector('#toast');if(toast){toast.textContent='AWEP2PAWE could not start: '+(e?.message||e);toast.classList.add('show')}}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
