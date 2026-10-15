// 入口：載入各站、背景、音效及 Python，然後開始簡報
import { createBackground } from './core/bg.js';
import { createSfx } from './core/sfx.js';
import { python, preloadPython } from './core/python.js';
import { createApp } from './core/app.js';
import * as fx from './core/fx.js';
import { STATION_IDS } from './stations/index.js';

const gsap = window.gsap;
gsap.registerPlugin(CustomEase, DrawSVGPlugin, Flip, MorphSVGPlugin, MotionPathPlugin, Physics2DPlugin, ScrambleTextPlugin, SplitText, TextPlugin);
gsap.config({ nullTargetWarn: false });

const params = new URLSearchParams(location.search);
const bg = createBackground(document.getElementById('bg'), { lite: params.has('lite') });
const sfx = createSfx();

// 每站一個檔案；某一站出錯也不會令整個簡報停止
async function loadStations() {
  const mods = await Promise.all(STATION_IDS.map(id =>
    import(`./stations/${id}.js`).then(m => m.default).catch(err => {
      console.error(`載入站「${id}」失敗`, err);
      return {
        id, title: `（${id} 載入失敗）`, short: id, steps: 0,
        build(root) { root.innerHTML = `<div class="pad"><div class="kicker">ERROR</div><h1 class="h1">此站載入失敗</h1><p class="body mono">${String(err).replace(/</g, '&lt;')}</p></div>`; },
      };
    })));
  return mods;
}

const stations = await loadStations();
const app = createApp(stations, { gsap, bg, sfx, python, fx, three: bg.three });
window.ictTalk = app; // 方便除錯
await document.fonts?.ready?.catch?.(() => {});
app.start();

// 開場後在背景預先載入 Python（不影響動畫）
if (!params.has('shot') || params.has('python')) {
  const later = window.requestIdleCallback || (fn => setTimeout(fn, 1500));
  later(() => preloadPython().catch(() => {}), { timeout: 4000 });
}
