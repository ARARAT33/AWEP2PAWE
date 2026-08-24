import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=normalize(join(fileURLToPath(new URL('..',import.meta.url))));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);const relative=pathname==='/'?'index.html':pathname.slice(1);const file=normalize(join(root,relative));if(!file.startsWith(root+sep)&&file!==root){res.writeHead(403);return res.end()}try{const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data)}catch{res.writeHead(404);res.end('Not found')}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const {port}=server.address();
try{
 const {chromium}=await import('playwright');
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext();
 const page=await context.newPage();
 const errors=[];const apiRequests=[];
 page.on('request',r=>{if(new URL(r.url()).pathname.includes('/api/'))apiRequests.push(r.url())});
 page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
 page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});
 await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'networkidle'});
 await page.waitForFunction(()=>typeof window.qrcode==='function',{timeout:10000});
 await page.locator('#start').click();
 await page.waitForFunction(()=>document.querySelector('#qr svg')&&/^[A-Za-z0-9]{10}$/.test(document.querySelector('#short-id')?.textContent||''),null,{timeout:15000});
 const result=await page.evaluate(()=>({qr:!!document.querySelector('#qr svg'),id:document.querySelector('#short-id')?.textContent||'',downloadDisabled:document.querySelector('#download-qr')?.disabled??true,body:document.body.innerText.includes('No Functions, Workers')}));
 if(!result.qr)throw new Error('QR was not generated');
 if(!/^[A-Za-z0-9]{10}$/.test(result.id))throw new Error('Temporary ID was not generated');
 if(result.downloadDisabled)throw new Error('QR download was not enabled');
 if(apiRequests.length)throw new Error(`Unexpected API/Function request: ${apiRequests.join(', ')}`);
 const p2p=await page.evaluate(async()=>{
   const a=new RTCPeerConnection({iceServers:[]}),b=new RTCPeerConnection({iceServers:[]});
   a.onicecandidate=e=>e.candidate&&b.addIceCandidate(e.candidate).catch(()=>{});
   b.onicecandidate=e=>e.candidate&&a.addIceCandidate(e.candidate).catch(()=>{});
   const received=new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(new Error('WebRTC loopback timed out')),10000);b.ondatachannel=e=>e.channel.onmessage=x=>{clearTimeout(t);resolve(x.data)}});
   const dc=a.createDataChannel('smoke',{ordered:true});await a.setLocalDescription(await a.createOffer());
   await new Promise(r=>a.iceGatheringState==='complete'?r():a.addEventListener('icegatheringstatechange',()=>a.iceGatheringState==='complete'&&r()));
   await b.setRemoteDescription(a.localDescription);await b.setLocalDescription(await b.createAnswer());
   await new Promise(r=>b.iceGatheringState==='complete'?r():b.addEventListener('icegatheringstatechange',()=>b.iceGatheringState==='complete'&&r()));
   await a.setRemoteDescription(b.localDescription);await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(new Error('DataChannel open timed out')),10000);dc.onopen=()=>{clearTimeout(t);resolve()}});dc.send('AWEP2PAWE-STATIC-P2P');const value=await received;a.close();b.close();return value;
 });
 if(p2p!=='AWEP2PAWE-STATIC-P2P')throw new Error('WebRTC DataChannel loopback failed');
 if(errors.length)throw new Error(errors.join('\n'));
 await browser.close();
 console.log('Browser smoke: PASS — static shell, QR/ID generation, zero API/Function requests, WebRTC loopback');
}finally{await new Promise(resolve=>server.close(resolve))}
