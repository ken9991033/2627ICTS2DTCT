// 開發用：用 Playwright 為各站截圖，檢查版面。
// 先在 repo 根目錄開伺服器：python3 -m http.server 8765
// 用法：
//   node ict-talk/tools/shoot.mjs --out /tmp/shots code:0 code:2 data          （每站最後一步，或指定步驟）
//   node ict-talk/tools/shoot.mjs --out /tmp/shots --all                       （全部站的每一步）
//   node ict-talk/tools/shoot.mjs --out /tmp/shots --anim boot:1 --frames 8 --every 700   （真實播放，連續截圖）
//   node ict-talk/tools/shoot.mjs --out /tmp/shots --flow phone --frames 6 --every 250    （由上一站按 → 進入，拍轉場）
// 加 --python 會先等 Python 載入完成。console 錯誤會寫入 OUT/console.log。
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require('/opt/node22/lib/node_modules/playwright'); }

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
const flag = k => { const i = args.indexOf(k); if (i < 0) return false; args.splice(i, 1); return true; };
const OUT = opt('--out', '/tmp/ict-shots');
const BASE = opt('--base', 'http://localhost:8765/ict-talk/');
const FRAMES = Number(opt('--frames', 6));
const EVERY = Number(opt('--every', 500));
const anim = opt('--anim', null);
const flow = opt('--flow', null);
const all = flag('--all');
const wantPy = flag('--python');
const W = Number(opt('--w', 1920)), H = Number(opt('--h', 1080));
fs.mkdirSync(OUT, { recursive: true });
const log = [];

const browser = await pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: W, height: H } });
page.on('console', m => { if (['error', 'warning'].includes(m.type())) log.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', e => log.push(`[pageerror] ${e.message}`));

async function waitPy() {
  if (!wantPy) return;
  await page.evaluate(() => import('./js/core/python.js').then(m => m.preloadPython()));
}

async function shot(id, step) {
  const q = new URLSearchParams({ shot: '1', station: id });
  if (step != null) q.set('step', String(step));
  if (wantPy) q.set('python', '1');
  await page.goto(BASE + 'index.html?' + q, { waitUntil: 'load' });
  await page.waitForFunction(() => window.ictTalk && window.ictTalk.index >= 0, null, { timeout: 20000 });
  await waitPy();
  await page.waitForTimeout(Number(process.env.SHOT_WAIT || 1800));
  const file = path.join(OUT, `${id}-${step ?? 'end'}.png`);
  await page.screenshot({ path: file });
  console.log(file);
}

if (anim) {
  const [id, st] = anim.split(':');
  await page.goto(BASE + `index.html?station=${id}${wantPy ? '&python=1' : ''}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.ictTalk && window.ictTalk.index >= 0);
  await waitPy();
  await page.waitForTimeout(400);
  for (let k = 0; k < Number(st || 0); k++) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(k < Number(st) - 1 ? 2500 : 0); }
  for (let f = 0; f < FRAMES; f++) {
    await page.waitForTimeout(EVERY);
    const file = path.join(OUT, `${id}-anim${st || 0}-${String(f).padStart(2, '0')}.png`);
    await page.screenshot({ path: file }); console.log(file);
  }
} else if (flow) {
  // 由上一站最後一步按 → 進入本站，拍轉場過程
  const ids = await (async () => { await page.goto(BASE + 'index.html?shot=1'); await page.waitForFunction(() => window.ictTalk); return page.evaluate(() => window.ictTalk.stations.map(s => [s.id, s.steps || 0])); })();
  const i = ids.findIndex(x => x[0] === flow);
  const [pid, psteps] = ids[i - 1];
  await page.goto(BASE + `index.html?station=${pid}&step=${psteps}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.ictTalk && window.ictTalk.index >= 0);
  await page.waitForTimeout(1200);
  await page.keyboard.press('ArrowRight');
  for (let f = 0; f < FRAMES; f++) {
    await page.waitForTimeout(EVERY);
    const file = path.join(OUT, `${flow}-flow-${String(f).padStart(2, '0')}.png`);
    await page.screenshot({ path: file }); console.log(file);
  }
} else {
  let targets = args;
  if (all) {
    await page.goto(BASE + 'index.html?shot=1'); await page.waitForFunction(() => window.ictTalk);
    const ids = await page.evaluate(() => window.ictTalk.stations.map(s => [s.id, s.steps || 0]));
    targets = ids.flatMap(([id, n]) => Array.from({ length: n + 1 }, (_, k) => `${id}:${k}`));
  }
  for (const t of targets) {
    const [id, st] = t.split(':');
    await shot(id, st === undefined ? 99 : Number(st));
  }
}
fs.writeFileSync(path.join(OUT, 'console.log'), log.join('\n'));
if (log.length) console.log(`console: ${log.length} 條訊息，見 ${path.join(OUT, 'console.log')}`);
await browser.close();
