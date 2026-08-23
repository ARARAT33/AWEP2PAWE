import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = normalize(join(fileURLToPath(new URL('..', import.meta.url))));
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json'
};

function server() {
  return http.createServer(async (req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
    const file = normalize(join(root, relative));
    if (!file.startsWith(root + sep) && file !== root) { res.writeHead(403); return res.end(); }
    try {
      const stat = await readFile(file);
      res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(stat);
    } catch {
      res.writeHead(404); res.end('Not found');
    }
  });
}

const s = server();
await new Promise(resolve => s.listen(0, '127.0.0.1', resolve));
const { port } = s.address();
console.log(`Static smoke server listening on ${port}`);

try {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ serviceWorkers: 'allow' });
  const errors = [];
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });

  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => /^AWE-[A-Z0-9]{20}$/.test(document.querySelector('#identity-id')?.textContent || ''), null, { timeout: 10000 });
  if (!(await page.evaluate(() => 'serviceWorker' in navigator))) throw new Error('Service Worker API unavailable');
  await page.waitForFunction(() => navigator.serviceWorker?.controller || navigator.serviceWorker?.ready, null, { timeout: 10000 });
  await page.waitForFunction(() => !!window.AWEStaticConnect, null, { timeout: 5000 });
  const uid = await page.locator('#identity-id').textContent();
  if (!/^AWE-[A-Z0-9]{20}$/.test(uid.trim())) throw new Error('Persistent AWE UID format invalid');

  const p2p = await page.evaluate(async () => {
    const a = new RTCPeerConnection({ iceServers: [] });
    const b = new RTCPeerConnection({ iceServers: [] });
    const candidates = [];
    a.onicecandidate = e => e.candidate && b.addIceCandidate(e.candidate).catch(() => {});
    b.onicecandidate = e => e.candidate && a.addIceCandidate(e.candidate).catch(() => {});
    const received = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('WebRTC loopback timed out')), 10000);
      b.ondatachannel = e => {
        e.channel.onmessage = event => { clearTimeout(timer); resolve(event.data); };
      };
    });
    const dc = a.createDataChannel('awe-smoke', { ordered: true });
    await a.setLocalDescription(await a.createOffer());
    await new Promise(r => a.iceGatheringState === 'complete' ? r() : a.addEventListener('icegatheringstatechange', () => a.iceGatheringState === 'complete' && r(), { once: false }));
    await b.setRemoteDescription(a.localDescription);
    await b.setLocalDescription(await b.createAnswer());
    await new Promise(r => b.iceGatheringState === 'complete' ? r() : b.addEventListener('icegatheringstatechange', () => b.iceGatheringState === 'complete' && r(), { once: false }));
    await a.setRemoteDescription(b.localDescription);
    await new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error('DataChannel open timed out')), 10000); dc.onopen = () => { clearTimeout(timer); resolve(); }; });
    dc.send('AWEP2PAWE-P2P-SMOKE');
    const value = await received;
    a.close(); b.close();
    return value;
  });
  if (p2p !== 'AWEP2PAWE-P2P-SMOKE') throw new Error('WebRTC DataChannel loopback failed');

  const signal = await page.evaluate(() => window.AWEStaticConnect.createSignalLink('smoke-signal'));
  if (!signal.includes('#awe-signal=')) throw new Error('Static signaling link generation failed');

  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => /^AWE-[A-Z0-9]{20}$/.test(document.querySelector('#identity-id')?.textContent || ''), null, { timeout: 10000 });
  await context.setOffline(false);

  if (errors.length) throw new Error(errors.join('\n'));
  await browser.close();
  console.log('Browser smoke: PASS — UID, PWA, offline shell, WebRTC DataChannel, static signaling');
} finally {
  await new Promise(resolve => s.close(resolve));
}
