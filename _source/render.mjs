// Deterministic frame capture: node render.mjs [--stills 0.5,2.2,...] [--from F --to F] [--sub N] [--out file.mp4]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? [...a, [v.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]] : a), []));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.ttf': 'font/ttf', '.json': 'application/json', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { console.log('404', req.url); res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
}).listen(0);
const port = server.address().port;

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new',
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-gpu-vsync', '--disable-frame-rate-limit', '--force-color-profile=srgb', '--hide-scrollbars'],
  protocolTimeout: 600000,
});
const page = await browser.newPage();
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.type(), m.text()); });
page.on('pageerror', e => console.log('[pageerror]', e.message));
await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
await page.goto(`http://localhost:${port}/index.html?sub=${args.sub || 6}&reel=${args.reel || ''}`, { waitUntil: 'load' });
await page.waitForFunction('window.__ready || window.__error', { timeout: 120000 });
const err = await page.evaluate('window.__error');
if (err) { console.error(err); process.exit(1); }
const meta = await page.evaluate('window.__meta');
const shot = () => page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1080, height: 1920 }, optimizeForSpeed: true });

if (args.stills) {
  const dir = path.join(ROOT, args.reel ? `stills_${args.reel}` : 'stills'); fs.mkdirSync(dir, { recursive: true });
  for (const s of String(args.stills).split(',')) {
    const f = Math.round(Number(s) * meta.FPS);
    await page.evaluate(f => window.renderFrame(f), f);
    fs.writeFileSync(path.join(dir, `t${Number(s).toFixed(2)}.png`), await shot());
    console.log('still', s);
  }
} else {
  const from = Number(args.from || 0), to = Number(args.to || meta.frames);
  const out = args.out || path.join(ROOT, 'video_noaudio.mp4');
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(meta.FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = from; f < to; f++) {
    await page.evaluate(f => window.renderFrame(f), f);
    const buf = await shot();
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 30 === 0) console.log(`frame ${f}/${to}  ${((Date.now() - t0) / (f - from + 1)).toFixed(0)} ms/f`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  console.log('wrote', out, ((Date.now() - t0) / 1000).toFixed(1) + 's');
}
await browser.close();
server.close();
