import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = normalize(join(fileURLToPath(new URL('..', import.meta.url))));
const mime = { '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml' };

const server = http.createServer(async (req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  const relative=pathname==='/'?'index.html':pathname.slice(1);
  const file=normalize(join(root,relative));
  if(!file.startsWith(root+sep)&&file!==root){res.writeHead(403);return res.end();}
  try{const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);}
  catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const {port}=server.address();

try{
  const {chromium}=await import('playwright');
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext();
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`);});
  await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>/^AWE-[A-Z0-9]{20}$/.test(document.querySelector('#identity-id')?.textContent||''),null,{timeout:10000});
  const architecture=await page.evaluate(()=>({manifest:!!document.querySelector('link[rel="manifest"]'),sw:'serviceWorker' in navigator}));
  if(architecture.manifest||architecture.sw)throw new Error('PWA runtime detected in pure static build');
  await page.waitForFunction(()=>!!window.AWEStaticConnect,{timeout:5000});
  const uid=await page.locator('#identity-id').textContent();
  if(!/^AWE-[A-Z0-9]{20}$/.test(uid.trim()))throw new Error('Persistent AWE UID format invalid');
  const p2p=await page.evaluate(async()=>{
    const a=new RTCPeerConnection({iceServers:[]}),b=new RTCPeerConnection({iceServers:[]});
    a.onicecandidate=e=>e.candidate&&b.addIceCandidate(e.candidate).catch(()=>{});
    b.onicecandidate=e=>e.candidate&&a.addIceCandidate(e.candidate).catch(()=>{});
    const received=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('WebRTC loopback timed out')),10000);b.ondatachannel=e=>e.channel.onmessage=x=>{clearTimeout(timer);resolve(x.data);};});
    const dc=a.createDataChannel('awe-smoke',{ordered:true});
    await a.setLocalDescription(await a.createOffer());
    await new Promise(r=>a.iceGatheringState==='complete'?r():a.addEventListener('icegatheringstatechange',()=>a.iceGatheringState==='complete'&&r()));
    await b.setRemoteDescription(a.localDescription);await b.setLocalDescription(await b.createAnswer());
    await new Promise(r=>b.iceGatheringState==='complete'?r():b.addEventListener('icegatheringstatechange',()=>b.iceGatheringState==='complete'&&r()));
    await a.setRemoteDescription(b.localDescription);
    await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('DataChannel open timed out')),10000);dc.onopen=()=>{clearTimeout(timer);resolve();};});
    dc.send('AWEP2PAWE-P2P-SMOKE');const value=await received;a.close();b.close();return value;
  });
  if(p2p!=='AWEP2PAWE-P2P-SMOKE')throw new Error('WebRTC DataChannel loopback failed');
  const signal=await page.evaluate(()=>window.AWEStaticConnect.createSignalLink('smoke-signal'));
  if(!signal.includes('#awe-signal='))throw new Error('Static signaling link generation failed');
  if(errors.length)throw new Error(errors.join('\n'));
  await browser.close();
  console.log('Browser smoke: PASS — static shell, UID, WebRTC DataChannel, signaling');
}finally{await new Promise(resolve=>server.close(resolve));}
