// node stills.mjs 10,40,90 -> out/s_<frame>.png  (one bundle, many frames)
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'node:path';
const frames = process.argv[2].split(',').map(Number);
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const opts = { serveUrl, id: 'C8801', browserExecutable: 'C:/Program Files/Google/Chrome/Application/chrome.exe' };
const composition = await selectComposition(opts);
for (const frame of frames) {
  await renderStill({ ...opts, composition, frame, output: path.resolve(`out/s_${String(frame).padStart(4, '0')}.png`) });
  console.log('still', frame);
}
