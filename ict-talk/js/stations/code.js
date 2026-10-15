// 05 程式層：D 運算思維與程式編寫（48 小時，全課程最多）— 重點站
// 站內鏡頭：開場（App 背後的三層）→ 運算思維四大技巧 → Python 實驗室（真正可編輯、可執行）
// 步驟：1 運算思維　2 猜數字（二分搜尋，input() 由 stdin 提供）　3 畫螺旋（Canvas）　4 速度挑戰
const gsap = window.gsap;

const PRESETS = [
  {
    key: 'guess', tab: '猜數字', stdin: '73',
    code: `# 電腦用「二分搜尋」猜出你心中的數字（1–100）
secret = int(input("同學心中的數字："))
low, high = 1, 100
for tries in range(1, 8):          # 最多 7 次
    guess = (low + high) // 2      # 每次猜中間
    if guess == secret:
        print(f"第 {tries} 次：{guess} → 猜中了！")
        break
    elif guess < secret:
        print(f"第 {tries} 次：{guess} → 太小")
        low = guess + 1
    else:
        print(f"第 {tries} 次：{guess} → 太大")
        high = guess - 1`,
  },
  {
    key: 'draw', tab: '畫螺旋',
    code: `# 用迴圈畫出彩色螺旋
# 試改 angle：59、89、121、144、170
angle = 59
for i in range(300):
    color(i)            # 顏色（色相 0–360）
    forward(i * 2)      # 向前行
    left(angle)         # 向左轉
print("完成！共畫了", i + 1, "條線")`,
  },
  {
    key: 'speed', tab: '速度挑戰',
    code: `import time
# 電腦有多快？
print(2 ** 100)                  # 2 的 100 次方

start = time.perf_counter()
total = sum(range(1, 1000001))   # 1 加到 100 萬
used = time.perf_counter() - start

print("1 加到 100 萬 =", total)
print(f"只用了 {used:.4f} 秒")`,
  },
];

// 站內鏡頭位置（世界座標，每個場景 1920×1080）
const CAM = { intro: { x: 0, y: 0 }, ct: { x: 1920, y: 0 }, lab: { x: 1920, y: 1080 } };

const CT = [
  { n: '01', t: '拆解', d: '把大問題拆成小問題', ex: '例：出題 → 讀取答案 → 比較 → 給提示' },
  { n: '02', t: '模式識別', d: '找出重複出現的規律', ex: '例：每一輪都是「猜、比較、提示」，可用迴圈' },
  { n: '03', t: '抽象化', d: '抓住重點，略去細節', ex: '例：只需記住範圍的最小值和最大值' },
  { n: '04', t: '演算法', d: '設計清晰、有序的步驟', ex: '例：每次猜範圍中間，最多 7 次必定猜中' },
];

const ICONS = [
  // 拆解：一個大方塊分成四個小方塊
  `<svg viewBox="0 0 240 150" class="ic ic-dec">
     <rect class="big" x="62" y="17" width="116" height="116" rx="16"/>
     <rect class="q q1" x="62" y="17" width="56" height="56" rx="10"/>
     <rect class="q q2" x="122" y="17" width="56" height="56" rx="10"/>
     <rect class="q q3" x="62" y="77" width="56" height="56" rx="10"/>
     <rect class="q q4" x="122" y="77" width="56" height="56" rx="10"/>
   </svg>`,
  // 模式識別：重複的圖形被框出
  `<svg viewBox="0 0 240 150" class="ic ic-pat">
     <g class="shapes">
       <circle cx="28" cy="62" r="15"/><path d="M66 47 L82 77 L50 77 Z"/><rect x="95" y="47" width="30" height="30" rx="4"/>
       <circle cx="146" cy="62" r="15"/><path d="M184 47 L200 77 L168 77 Z"/><rect x="213" y="47" width="30" height="30" rx="4" transform="translate(-6 0)"/>
     </g>
     <rect class="frame f1" x="7" y="36" width="114" height="52" rx="12"/>
     <rect class="frame f2" x="125" y="36" width="112" height="52" rx="12"/>
     <path class="loop" d="M70 118 C70 136, 170 136, 170 118" />
     <path class="loop-head" d="M160 112 L171 118 L162 128" />
   </svg>`,
  // 抽象化：彎曲的路變成簡單的路線圖
  `<svg viewBox="0 0 240 150" class="ic ic-abs">
     <g class="detail">
       <circle cx="48" cy="40" r="6"/><circle cx="96" cy="118" r="5"/><circle cx="150" cy="30" r="7"/><circle cx="196" cy="116" r="5"/>
       <rect x="120" y="96" width="12" height="16" rx="2"/><rect x="60" y="88" width="10" height="14" rx="2"/>
     </g>
     <path class="road" d="M18 92 C40 30, 66 140, 96 78 S140 18, 160 82 S206 140, 222 60"/>
     <g class="stops"><circle cx="18" cy="75" r="11"/><circle cx="120" cy="75" r="11"/><circle cx="222" cy="75" r="11"/></g>
   </svg>`,
  // 演算法：流程圖逐步畫出
  `<svg viewBox="0 0 240 150" class="ic ic-alg">
     <rect class="b b1" x="8" y="54" width="52" height="42" rx="10"/>
     <path class="ar a1" d="M62 75 L88 75 M80 68 L89 75 L80 82"/>
     <rect class="b b2" x="92" y="54" width="52" height="42" rx="10"/>
     <path class="ar a2" d="M146 75 L172 75 M164 68 L173 75 L164 82"/>
     <path class="b b3" d="M205 47 L233 75 L205 103 L177 75 Z"/>
     <path class="tick" d="M193 76 L202 86 L219 64"/>
   </svg>`,
];

const PLAY_SVG = '<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M7 4.5v15l13-7.5z" fill="currentColor"/></svg>';

// ---------- 小工具 ----------
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** 海龜繪圖：由 Python 呼叫 forward()/left()/right()/color()，記錄每一條線段 */
function makeTurtle(limit = 20000) {
  const t = { x: 0, y: 0, h: 0, c: 'hsl(190 90% 62%)', segs: [] };
  const toColor = v => (typeof v === 'string' ? v : `hsl(${(Number(v) || 0) % 360} 92% 62%)`);
  const api = {
    forward(d) {
      if (t.segs.length >= limit) throw new Error('畫得太多了（上限 20000 條線）');
      const r = t.h * Math.PI / 180, n = Number(d) || 0;
      const x2 = t.x + n * Math.cos(r), y2 = t.y - n * Math.sin(r);
      t.segs.push([t.x, t.y, x2, y2, t.c]);
      t.x = x2; t.y = y2;
    },
    left(a) { t.h += Number(a) || 0; },
    right(a) { t.h -= Number(a) || 0; },
    color(v) { t.c = toColor(v); },
  };
  return { t, api };
}

/** 後備：Python 未能使用時，用 JavaScript 模擬三個預設程式的輸出 */
function simulate(key, code, stdinText) {
  const lines = [];
  if (key === 'guess') {
    const v = String(stdinText || '').split(/[\s,，]+/).filter(Boolean)[0] ?? '73';
    lines.push({ k: 'in', p: '同學心中的數字：', v });
    const secret = parseInt(v, 10);
    if (Number.isNaN(secret)) { lines.push({ k: 'err', s: `ValueError: invalid literal for int() with base 10: '${v}'` }); return { lines }; }
    let low = 1, high = 100;
    for (let tries = 1; tries < 8; tries++) {
      const g = Math.floor((low + high) / 2);
      if (g === secret) { lines.push({ k: 'out', s: `第 ${tries} 次：${g} → 猜中了！` }); break; }
      if (g < secret) { lines.push({ k: 'out', s: `第 ${tries} 次：${g} → 太小` }); low = g + 1; }
      else { lines.push({ k: 'out', s: `第 ${tries} 次：${g} → 太大` }); high = g - 1; }
    }
    return { lines };
  }
  if (key === 'draw') {
    const angle = Number((code.match(/angle\s*=\s*(-?[\d.]+)/) || [])[1] ?? 59);
    const turns = Math.min(5000, Number((code.match(/range\((\d+)\)/) || [])[1] ?? 300));
    const k = Number((code.match(/forward\(\s*i\s*\*\s*([\d.]+)\s*\)/) || [])[1] ?? 2);
    const { t, api } = makeTurtle();
    for (let i = 0; i < turns; i++) { api.color(i); api.forward(i * k); api.left(angle); }
    lines.push({ k: 'out', s: `完成！共畫了 ${turns} 條線` });
    return { lines, segs: t.segs };
  }
  lines.push({ k: 'out', s: '1267650600228229401496703205376' });
  lines.push({ k: 'out', s: '1 加到 100 萬 = 500000500000' });
  lines.push({ k: 'out', s: '只用了 0.0500 秒（示意）' });
  return { lines };
}

export default {
  id: 'code',
  title: '程式層：運算思維與程式編寫',
  short: '程式層',
  module: 'D',
  accent: '#a78bfa',
  layer: 'code',
  tint: ['#a78bfa', '#22d3ee'],
  transition: { type: 'zoomIn', focus: '.bp-dive' },
  steps: 4,
  minutes: 2,
  notes: `【程式層 · 單元 D 運算思維與程式編寫 · 約 48 小時，必修部分中課時最多】
進站：「我們穿過了手機的介面，來到程式層。你每天用的每一個 App，背後都是一行行程式。」指着右邊三層：介面是你看到的，程式令它運作，數據是電腦真正處理的 0 和 1。強調 D 有 48 小時，是必修部分最多課時的單元。

按 →（第 1 步）運算思維：寫程式之前，先學會思考。以「猜數字遊戲」為例逐一介紹拆解、模式識別、抽象化、演算法。可以問學生：「如果要你猜 1 至 100 之間的數字，你第一次會猜甚麼？為甚麼？」

按 →（第 2 步）鏡頭移到 Python 編輯器，程式會自動打出並執行。這是真正的 Python（在瀏覽器內執行，不是影片）。電腦每次猜範圍中間，右下方的長條顯示範圍每次減半，最多 7 次必定猜中。
・互動：請一位同學說出 1 至 100 的任何數字，老師在右邊「input() 的答案」格內輸入，按 Enter 或「執行」。

按 →（第 3 步）畫螺旋：只有幾行程式，用迴圈畫出 300 條線。
・互動：把 angle = 59 改成 89、121、144 或 170，再按「執行」（或在編輯器內按 Ctrl + Enter），圖案立即改變。也可改 range(300) 的圈數。

按 →（第 4 步）速度挑戰：2 的 100 次方是一個 31 位數；把 1 加到 100 萬，電腦只需極短時間（畫面顯示真實執行時間）。問學生：「如果你每秒加一個數，要加多久？」答案：約 11.6 日，不眠不休。
・最後指着右上角發光的「1」：「這些數字在電腦內部，其實全都是 0 和 1。」按 → 鏡頭穿過它，進入數據層。

提示：在編輯器內打字時方向鍵不會轉頁，按 Esc 離開編輯器即可繼續。若 Python 未載入，按「執行」仍會顯示預先準備的輸出。`,

  build(root, ctx) {
    this._build = (this._build || 0) + 1;
    this._runId = 0; this._cur = 0; this._camAt = 'intro'; this._stepTl = null; this._quiet = false;
    this._chain = Promise.resolve(); this._lastFallback = null; this._pending = false;

    const ctCards = CT.map((c, i) => `
      <div class="cd-card panel" data-i="${i}">
        <div class="cd-card-n">${c.n}</div>
        <div class="cd-card-ic">${ICONS[i]}</div>
        <div class="cd-card-t">${c.t}</div>
        <div class="cd-card-d">${c.d}</div>
        <div class="cd-card-ex">${c.ex}</div>
      </div>`).join('');

    const tabs = PRESETS.map((p, i) => `<button type="button" class="cd-tab" data-i="${i}"><b>${i + 1}</b>${p.tab}</button>`).join('');

    root.innerHTML = `
      <div class="cd-cam">
        <!-- 場景一：手機 App 的背後 -->
        <section class="cd-scene cd-intro">
          <div class="cd-intro-l">
            <div class="kicker cd-k">單元 D · 運算思維與程式編寫</div>
            <h1 class="h1 cd-title"><span class="ln">手機 App 的背後，</span><span class="ln">是<span class="grad">一行行程式</span>。</span></h1>
            <p class="cd-lead">你每天用的每一個 App，<br>都是由程式員一行一行寫出來的。</p>
            <div class="cd-stat">
              <div class="cd-stat-n"><span class="cd-48">48</span><small>小時</small></div>
              <div class="cd-stat-t">必修部分中<br><b>課時最多</b>的單元</div>
            </div>
            <div class="cd-hbar">
              ${[['A', 37], ['B', 20], ['C', 31], ['D', 48], ['E', 8]].map(([m, h]) => `<div class="seg seg-${m.toLowerCase()}" style="flex:${h}"><span class="l">${m}</span><span class="h">${h}</span></div>`).join('')}
            </div>
            <div class="cd-hbar-cap">必修部分共約 144 小時</div>
            <div class="cd-chips"><span class="chip">拆解問題</span><span class="chip">演算法</span><span class="chip">程式編寫</span><span class="chip">測試與除錯</span></div>
          </div>
          <div class="cd-stack">
            <div class="cd-stack-3d">
              <div class="cd-plane cd-p-data"><div class="bits"></div></div>
              <div class="cd-plane cd-p-code"><pre class="code">${ctx.fx.highlightPython('guess = (low + high) // 2\nif guess == secret:\n    print("猜中了！")\nelif guess < secret:\n    low = guess + 1')}</pre><i class="scan"></i></div>
              <div class="cd-plane cd-p-ui">
                <div class="app-top">猜數字</div>
                <div class="app-num">50</div>
                <div class="app-btns"><span>太大</span><span>太小</span></div>
              </div>
            </div>
            <div class="cd-lbl cd-lbl-ui"><b>介面</b><span>你看到的畫面</span></div>
            <div class="cd-lbl cd-lbl-code"><b>程式</b><span>令它運作的指令</span><em>我們在這裏</em></div>
            <div class="cd-lbl cd-lbl-data"><b>數據</b><span>電腦處理的 0 和 1</span></div>
          </div>
        </section>

        <!-- 場景二：運算思維 -->
        <section class="cd-scene cd-ct">
          <div class="cd-ct-head">
            <div class="kicker cd-k">運算思維 · Computational Thinking</div>
            <h1 class="h1">寫程式之前，先學會這樣思考</h1>
            <p class="cd-ct-sub">例子：怎樣設計一個「猜數字」遊戲？</p>
          </div>
          <div class="cd-cards">${ctCards}</div>
        </section>

        <!-- 場景三：Python 實驗室 -->
        <section class="cd-scene cd-lab">
          <div class="cd-lab-head">
            <div class="kicker cd-k">程式編寫示範 · Python</div>
            <h2 class="h2">改一個數字，按「執行」，看看結果</h2>
          </div>
          <div class="cd-dive-pill">
            <div class="cd-dive-k">下一層 · 數據層</div>
            <div class="cd-dive-t">這些數字在電腦內部，全都是 <span class="bit b0">0</span><span class="bit b1 code-dive">1</span></div>
          </div>
          <div class="cd-editor code-window">
            <div class="bar"><span class="dots"><i></i><i></i><i></i></span><div class="cd-tabs">${tabs}<i class="cd-tab-ink"></i></div></div>
            <div class="cd-ed-body">
              <div class="cd-gutter mono"></div>
              <div class="cd-code-area">
                <pre class="code cd-hl" aria-hidden="true"></pre>
                <textarea class="code-input cd-ta" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="Python 程式編輯器"></textarea>
              </div>
            </div>
            <div class="cd-tools">
              <button type="button" class="btn cd-run">${PLAY_SVG}<span>執行</span></button>
              <button type="button" class="btn ghost cd-reset">還原</button>
              <div class="cd-status"><i class="dot"></i><span class="txt">Python 載入中…</span></div>
            </div>
          </div>
          <div class="cd-out">
            <div class="cd-out-head"><span class="cd-out-title">輸出</span><span class="cd-out-info"></span></div>
            <div class="cd-stdin"><label>input() 的答案</label><input class="cd-stdin-in mono" type="text" value="73" inputmode="numeric" aria-label="input() 的答案"><span class="cd-stdin-hint">可修改</span></div>
            <div class="cd-term terminal-out"></div>
            <div class="cd-viz cd-viz-guess"><div class="cd-viz-cap">搜尋範圍：每次刪去一半</div><div class="rows"></div><div class="cd-viz-ax"><span>1</span><span>50</span><span>100</span></div></div>
            <div class="cd-viz cd-viz-draw"><canvas class="cd-cv" width="1240" height="1220"></canvas><i class="cd-pen"></i><div class="cd-draw-n mono"></div></div>
            <div class="cd-viz cd-viz-speed">
              <div class="sp-big"><span class="sp-sec grad">0.0000</span><small>秒</small></div>
              <div class="sp-cap">Python 把 1 至 1,000,000 全部加起來</div>
              <div class="sp-row"><span class="sp-who">Python</span><div class="sp-track"><i class="sp-bar sp-py"></i></div><span class="sp-v sp-v-py">0.05 秒</span></div>
              <div class="sp-row"><span class="sp-who">人手</span><div class="sp-track"><i class="sp-bar sp-hu"></i></div><span class="sp-v">約 11.6 日</span></div>
              <div class="sp-note">人手：每秒加一個數，不眠不休</div>
              <div class="sp-x">快了約 <b class="sp-ratio">—</b> 倍</div>
            </div>
          </div>
        </section>
      </div>
    `;

    const css = document.createElement('style');
    css.textContent = `
      .st-code .cd-cam { position:absolute; left:0; top:0; width:1920px; height:1080px; transform-origin:0 0; }
      .st-code .cd-scene { position:absolute; width:1920px; height:1080px; }
      .st-code .cd-intro { left:0; top:0; }
      .st-code .cd-ct { left:1920px; top:0; }
      .st-code .cd-lab { left:1920px; top:1080px; }
      .st-code .cd-k { font-size:24px; letter-spacing:.2em; }

      /* ---------- 場景一 ---------- */
      .st-code .cd-intro-l { position:absolute; left:200px; top:84px; width:760px; }
      .st-code .cd-title { margin-top:14px; font-size:76px; line-height:1.18; }
      .st-code .cd-title .ln { display:block; }
      .st-code .cd-lead { margin:22px 0 0; font-size:30px; line-height:1.55; color:var(--ink-2); width:700px; }
      .st-code .cd-stat { display:flex; align-items:center; gap:34px; margin-top:44px; }
      .st-code .cd-stat-n { display:flex; align-items:baseline; gap:10px; }
      .st-code .cd-48 { font:900 168px/0.9 var(--font); letter-spacing:-.04em; color:var(--accent); text-shadow:0 0 50px color-mix(in srgb, var(--accent) 55%, transparent); }
      .st-code .cd-stat-n small { font-size:44px; font-weight:800; color:var(--ink); }
      .st-code .cd-stat-t { font-size:32px; line-height:1.45; color:var(--ink-2); }
      .st-code .cd-stat-t b { color:var(--ink); }
      .st-code .cd-hbar { display:flex; gap:4px; width:720px; height:60px; margin-top:40px; }
      .st-code .cd-hbar .seg { position:relative; border-radius:10px; background:rgba(160,180,255,.14); transform-origin:0 50%; }
      .st-code .cd-hbar .seg .l { position:absolute; inset:0; display:grid; place-items:center; font:800 26px var(--mono); color:var(--ink-2); }
      .st-code .cd-hbar .seg .h { position:absolute; left:0; right:0; top:68px; text-align:center; font:700 24px var(--mono); color:var(--ink-3); }
      .st-code .cd-hbar .seg-d { background:var(--accent); box-shadow:0 0 34px color-mix(in srgb, var(--accent) 60%, transparent); }
      .st-code .cd-hbar .seg-d .l { color:#05060f; }
      .st-code .cd-hbar .seg-d .h { color:var(--accent); font-size:28px; }
      .st-code .cd-hbar-cap { margin-top:52px; font-size:24px; color:var(--ink-3); }
      .st-code .cd-chips { display:flex; gap:14px; margin-top:34px; }
      .st-code .cd-chips .chip { font-size:24px; padding:8px 22px; }

      .st-code .cd-stack { position:absolute; left:960px; top:150px; width:900px; height:860px; perspective:2200px; }
      .st-code .cd-stack-3d { position:absolute; left:300px; top:420px; width:0; height:0; transform-style:preserve-3d; transform:rotateX(58deg) rotateZ(-38deg); }
      .st-code .cd-plane { position:absolute; left:-230px; top:-150px; width:460px; height:300px; border-radius:22px; overflow:hidden;
        border:2px solid rgba(160,180,255,.35); background:rgba(12,16,40,.82); box-shadow:0 0 0 1px rgba(255,255,255,.04), 0 30px 80px rgba(0,0,0,.45); }
      .st-code .cd-p-ui { border-color:rgba(34,211,238,.6); background:linear-gradient(160deg, rgba(20,40,70,.95), rgba(10,16,40,.92)); box-shadow:0 0 40px rgba(34,211,238,.25); }
      .st-code .cd-p-ui .app-top { height:58px; display:flex; align-items:center; padding:0 24px; font-size:28px; font-weight:800; color:#05060f; background:#22d3ee; }
      .st-code .cd-p-ui .app-num { text-align:center; font:900 120px/1.15 var(--mono); color:#fff; }
      .st-code .cd-p-ui .app-btns { display:flex; gap:20px; justify-content:center; }
      .st-code .cd-p-ui .app-btns span { padding:6px 28px; border-radius:12px; font-size:26px; font-weight:800; background:rgba(34,211,238,.18); color:#a5f3fc; border:1px solid rgba(34,211,238,.5); }
      .st-code .cd-p-code { border-color:var(--accent); box-shadow:0 0 0 2px color-mix(in srgb, var(--accent) 40%, transparent), 0 0 80px color-mix(in srgb, var(--accent) 50%, transparent); background:rgba(14,10,36,.92); }
      .st-code .cd-p-code pre { margin:0; padding:22px 24px; font-size:24px; line-height:1.6; }
      .st-code .cd-p-code .scan { position:absolute; left:0; right:0; top:0; height:60px; background:linear-gradient(transparent, color-mix(in srgb, var(--accent) 35%, transparent), transparent); }
      .st-code .cd-p-data { border-color:rgba(52,211,153,.45); }
      .st-code .cd-p-data .bits { padding:16px 22px; font:700 24px/1.55 var(--mono); color:#34d399; letter-spacing:.42em; white-space:pre; opacity:.85; }
      .st-code .cd-lbl { position:absolute; left:640px; width:260px; padding-left:22px; border-left:3px solid var(--line-strong); }
      .st-code .cd-lbl b { display:block; font-size:40px; font-weight:900; line-height:1.15; }
      .st-code .cd-lbl span { display:block; font-size:26px; color:var(--ink-2); margin-top:4px; }
      .st-code .cd-lbl em { display:inline-block; margin-top:10px; font-style:normal; font-size:24px; font-weight:800; padding:4px 16px; border-radius:999px; background:var(--accent); color:#05060f; }
      .st-code .cd-lbl-ui { top:160px; border-color:#22d3ee; } .st-code .cd-lbl-ui b { color:#22d3ee; }
      .st-code .cd-lbl-code { top:370px; border-color:var(--accent); } .st-code .cd-lbl-code b { color:var(--accent); }
      .st-code .cd-lbl-data { top:610px; border-color:#34d399; } .st-code .cd-lbl-data b { color:#34d399; }

      /* ---------- 場景二：運算思維 ---------- */
      .st-code .cd-ct-head { position:absolute; left:200px; top:84px; right:120px; }
      .st-code .cd-ct-head .h1 { margin-top:14px; }
      .st-code .cd-ct-sub { margin:16px 0 0; font-size:32px; color:var(--ink-2); }
      .st-code .cd-cards { position:absolute; left:200px; right:120px; top:350px; display:grid; grid-template-columns:repeat(4, 1fr); gap:32px; }
      .st-code .cd-card { position:relative; height:560px; padding:30px 30px 0; border-radius:28px; }
      .st-code .cd-card-n { font:800 26px var(--mono); color:var(--accent); letter-spacing:.1em; }
      .st-code .cd-card-ic { height:170px; margin:8px -6px 6px; }
      .st-code .cd-card-ic svg { width:100%; height:100%; overflow:visible; }
      .st-code .cd-card-t { font-size:48px; font-weight:900; line-height:1.2; }
      .st-code .cd-card-d { font-size:30px; font-weight:700; color:var(--ink); margin-top:10px; line-height:1.4; }
      .st-code .cd-card-ex { margin-top:22px; padding-top:20px; border-top:1px dashed var(--line-strong); font-size:28px; line-height:1.5; color:var(--ink-2); }
      .st-code .ic rect, .st-code .ic circle, .st-code .ic path { vector-effect:non-scaling-stroke; }
      .st-code .ic-dec .big { fill:color-mix(in srgb, var(--accent) 22%, transparent); stroke:var(--accent); stroke-width:3; }
      .st-code .ic-dec .q { stroke-width:3; opacity:0; }
      .st-code .ic-dec .q1 { fill:rgba(34,211,238,.25); stroke:#22d3ee; } .st-code .ic-dec .q2 { fill:rgba(167,139,250,.25); stroke:#a78bfa; }
      .st-code .ic-dec .q3 { fill:rgba(251,191,36,.25); stroke:#fbbf24; } .st-code .ic-dec .q4 { fill:rgba(52,211,153,.25); stroke:#34d399; }
      .st-code .ic-pat .shapes > * { fill:rgba(180,190,230,.25); stroke:#b4bce0; stroke-width:3; }
      .st-code .ic-pat .frame { fill:none; stroke:var(--accent); stroke-width:3; }
      .st-code .ic-pat .loop, .st-code .ic-pat .loop-head { fill:none; stroke:#fbbf24; stroke-width:4; stroke-linecap:round; stroke-linejoin:round; }
      .st-code .ic-abs .detail > * { fill:rgba(180,190,230,.4); }
      .st-code .ic-abs .road { fill:none; stroke:var(--accent); stroke-width:6; stroke-linecap:round; }
      .st-code .ic-abs .stops circle { fill:#05060f; stroke:#fff; stroke-width:5; opacity:0; }
      .st-code .ic-alg .b { fill:color-mix(in srgb, var(--accent) 20%, transparent); stroke:var(--accent); stroke-width:3; }
      .st-code .ic-alg .ar { fill:none; stroke:#b4bce0; stroke-width:3; stroke-linecap:round; stroke-linejoin:round; }
      .st-code .ic-alg .tick { fill:none; stroke:#34d399; stroke-width:6; stroke-linecap:round; stroke-linejoin:round; }

      /* ---------- 場景三：Python 實驗室 ---------- */
      .st-code .cd-lab-head { position:absolute; left:200px; top:56px; width:960px; }
      .st-code .cd-lab-head .h2 { margin-top:12px; }
      .st-code .cd-dive-pill { position:absolute; left:1180px; top:52px; width:620px; height:112px; padding:12px 24px 0; border-radius:20px;
        border:1px solid color-mix(in srgb, var(--accent) 45%, transparent); background:color-mix(in srgb, var(--accent) 10%, rgba(7,10,24,.85)); opacity:0; }
      .st-code .cd-dive-k { font:700 24px var(--mono); letter-spacing:.14em; color:var(--accent); }
      .st-code .cd-dive-t { margin-top:6px; font-size:28px; font-weight:700; color:var(--ink); display:flex; align-items:center; gap:10px; }
      .st-code .cd-dive-t .bit { display:inline-grid; place-items:center; width:46px; height:46px; border-radius:10px; font:800 30px var(--mono); border:2px solid var(--line-strong); color:var(--ink-2); }
      .st-code .cd-dive-t .b1 { color:#05060f; background:#22d3ee; border-color:#22d3ee; box-shadow:0 0 26px #22d3ee, 0 0 60px rgba(34,211,238,.6); }

      .st-code .cd-editor { position:absolute; left:200px; top:184px; width:950px; height:820px; display:flex; flex-direction:column; }
      .st-code .cd-editor .bar { height:66px; flex:none; gap:22px; }
      .st-code .cd-tabs { position:relative; display:flex; gap:6px; height:100%; }
      .st-code .cd-tab { position:relative; display:flex; align-items:center; gap:10px; height:100%; padding:0 20px; border:0; background:none; cursor:pointer;
        font:700 24px var(--font); color:var(--ink-3); }
      .st-code .cd-tab b { display:inline-grid; place-items:center; width:30px; height:30px; border-radius:8px; font:800 20px var(--mono); background:rgba(255,255,255,.08); color:var(--ink-2); }
      .st-code .cd-tab.on { color:var(--ink); }
      .st-code .cd-tab.on b { background:var(--accent); color:#05060f; }
      .st-code .cd-tab-ink { position:absolute; bottom:-1px; height:4px; border-radius:4px; background:var(--accent); box-shadow:0 0 14px var(--accent); left:0; width:0; }
      .st-code .cd-ed-body { position:relative; flex:1; display:flex; overflow:hidden; }
      .st-code .cd-gutter { flex:none; width:68px; padding:20px 14px 0 0; text-align:right; font-size:24px; line-height:42px; color:#4b557e; white-space:pre; user-select:none; border-right:1px solid rgba(160,180,255,.08); }
      .st-code .cd-code-area { position:relative; flex:1; overflow:hidden; }
      .st-code .cd-hl, .st-code .cd-ta { position:absolute; inset:0; margin:0; padding:20px 24px; font:400 28px/42px var(--mono); letter-spacing:0; tab-size:4; white-space:pre; }
      .st-code .cd-hl { pointer-events:none; overflow:hidden; }
      .st-code .cd-ta { color:transparent; caret-color:#c4b5fd; background:transparent; overflow:auto; z-index:2; }
      .st-code .cd-ta::selection { background:rgba(167,139,250,.35); color:transparent; }
      .st-code .cd-ta:focus { box-shadow:inset 0 0 0 2px color-mix(in srgb, var(--accent) 35%, transparent); }
      .st-code .cd-tools { flex:none; height:98px; display:flex; align-items:center; gap:16px; padding:0 24px; border-top:1px solid var(--line); background:#0a0e22; }
      .st-code .cd-run { font-size:30px; padding:14px 34px 14px 26px; }
      .st-code .cd-reset { font-size:24px; padding:14px 22px; }
      .st-code .cd-status { margin-left:auto; display:flex; align-items:center; gap:12px; font-size:24px; color:var(--ink-2); white-space:nowrap; }
      .st-code .cd-status .dot { width:14px; height:14px; border-radius:50%; background:#fbbf24; box-shadow:0 0 12px #fbbf24; }
      .st-code .cd-status.ready .dot { background:#34d399; box-shadow:0 0 12px #34d399; }
      .st-code .cd-status.error .dot { background:#ff3d7f; box-shadow:0 0 12px #ff3d7f; }

      .st-code .cd-out { position:absolute; left:1180px; top:184px; width:620px; height:820px; border-radius:var(--r-lg); overflow:hidden;
        background:#060915; border:1px solid var(--line); box-shadow:0 30px 90px rgba(0,0,0,.5); }
      .st-code .cd-out-head { height:66px; display:flex; align-items:center; justify-content:space-between; padding:0 26px; background:#0d1126; border-bottom:1px solid var(--line); }
      .st-code .cd-out-title { font:700 24px var(--mono); color:var(--ink-2); letter-spacing:.1em; }
      .st-code .cd-out-info { font:700 24px var(--mono); color:#34d399; }
      .st-code .cd-out-info.fb { color:#fbbf24; font-family:var(--font); }
      .st-code .cd-stdin { display:none; align-items:center; gap:16px; height:90px; padding:0 26px; border-bottom:1px dashed var(--line); }
      .st-code .cd-stdin label { font:700 24px var(--mono); color:var(--ink-2); white-space:nowrap; }
      .st-code .cd-stdin-in { width:120px; height:58px; padding:0 14px; border-radius:12px; border:2px solid var(--accent); background:rgba(167,139,250,.12); color:#fff; font-size:34px; font-weight:800; text-align:center; outline:none; }
      .st-code .cd-stdin-in:focus { box-shadow:0 0 0 4px color-mix(in srgb, var(--accent) 35%, transparent); }
      .st-code .cd-stdin-hint { font-size:24px; color:var(--ink-3); white-space:nowrap; }
      .st-code .cd-term { padding:18px 26px; font-size:28px; line-height:44px; }
      .st-code .cd-term .ln { white-space:pre-wrap; word-break:break-all; }
      .st-code .cd-term .in { color:var(--ink-2); }
      .st-code .cd-term .in b { color:#fcd34d; font-weight:800; }
      .st-code .cd-term .hit { color:#34d399; font-weight:800; text-shadow:0 0 18px rgba(52,211,153,.6); }
      .st-code .cd-term .err { color:#ff8fa3; }
      .st-code .cd-term .big { color:#fcd34d; font-weight:700; }
      .st-code .cd-out.m-draw .cd-term { position:absolute; left:0; right:0; bottom:0; padding:14px 26px 18px; background:linear-gradient(transparent, rgba(6,9,21,.95) 40%); z-index:2; }
      .st-code .cd-viz { display:none; }
      .st-code .cd-out.m-guess .cd-stdin { display:flex; }
      .st-code .cd-out.m-guess .cd-viz-guess, .st-code .cd-out.m-draw .cd-viz-draw, .st-code .cd-out.m-speed .cd-viz-speed { display:block; }
      .st-code .cd-viz-guess { position:absolute; left:26px; right:26px; bottom:26px; }
      .st-code .cd-viz-cap { font-size:24px; font-weight:700; color:var(--ink-2); margin-bottom:12px; }
      .st-code .cd-viz-guess .rows { display:flex; flex-direction:column; gap:10px; }
      .st-code .cd-row { position:relative; height:26px; border-radius:6px; background:rgba(160,180,255,.08); }
      .st-code .cd-row .rg { position:absolute; top:0; bottom:0; border-radius:6px; background:color-mix(in srgb, var(--accent) 45%, transparent); }
      .st-code .cd-row .mk { position:absolute; top:-5px; width:6px; height:36px; margin-left:-3px; border-radius:3px; background:#fff; box-shadow:0 0 10px #fff; }
      .st-code .cd-row .mk.hit { background:#34d399; box-shadow:0 0 16px #34d399; }
      .st-code .cd-row .nm { position:absolute; top:-6px; font:800 24px/36px var(--mono); color:#fff; }
      .st-code .cd-viz-ax { display:flex; justify-content:space-between; margin-top:8px; font:700 24px var(--mono); color:var(--ink-3); }
      .st-code .cd-viz-draw { position:absolute; left:0; right:0; top:66px; bottom:0;
        background:radial-gradient(circle at 50% 46%, rgba(167,139,250,.10), transparent 62%); }
      .st-code .cd-cv { position:absolute; left:0; top:0; width:620px; height:610px; }
      .st-code .cd-pen { position:absolute; left:0; top:0; width:18px; height:18px; margin:-9px 0 0 -9px; border-radius:50%; background:#fff; box-shadow:0 0 18px #fff, 0 0 40px var(--accent); opacity:0; }
      .st-code .cd-draw-n { position:absolute; right:22px; top:16px; font-size:24px; font-weight:700; color:var(--ink-2); }
      .st-code .cd-viz-speed { position:absolute; left:26px; right:26px; top:240px; }
      .st-code .sp-big { display:flex; align-items:baseline; gap:12px; }
      .st-code .sp-sec { font:900 112px/1 var(--mono); letter-spacing:-.03em; }
      .st-code .sp-big small { font-size:40px; font-weight:800; }
      .st-code .sp-cap { font-size:28px; color:var(--ink-2); margin:10px 0 30px; }
      .st-code .sp-row { display:grid; grid-template-columns:110px 1fr 150px; align-items:center; gap:14px; height:58px; }
      .st-code .sp-who { font-size:26px; font-weight:800; }
      .st-code .sp-track { position:relative; height:30px; border-radius:8px; background:rgba(160,180,255,.08); overflow:hidden; }
      .st-code .sp-bar { position:absolute; left:0; top:0; bottom:0; border-radius:8px; transform-origin:0 50%; }
      .st-code .sp-py { width:8px; background:#34d399; box-shadow:0 0 14px #34d399; }
      .st-code .sp-hu { width:100%; background:linear-gradient(90deg, #fbbf24, #ff3d7f); }
      .st-code .sp-v { font:700 24px var(--mono); color:var(--ink-2); text-align:right; }
      .st-code .sp-note { font-size:24px; color:var(--ink-3); margin-top:6px; }
      .st-code .sp-x { margin-top:26px; font-size:36px; font-weight:800; }
      .st-code .sp-x b { color:var(--accent); font-size:48px; }
    `;
    root.appendChild(css);

    // 數據層的位元（裝飾）
    const bits = root.querySelector('.cd-p-data .bits');
    const rnd = () => Array.from({ length: 12 }, () => (Math.random() < 0.5 ? '0' : '1')).join('');
    bits.textContent = Array.from({ length: 6 }, rnd).join('\n');

    // ---------- 編輯器 ----------
    const ta = root.querySelector('.cd-ta');
    const hl = root.querySelector('.cd-hl');
    const stdinIn = root.querySelector('.cd-stdin-in');
    const sync = () => { this._renderCode(root, ctx, ta.value); };
    ctx.listen(ta, 'input', sync);
    ctx.listen(ta, 'scroll', () => { hl.scrollTop = ta.scrollTop; hl.scrollLeft = ta.scrollLeft; });
    ctx.listen(ta, 'keydown', e => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const s = ta.selectionStart, en = ta.selectionEnd;
        ta.value = ta.value.slice(0, s) + '    ' + ta.value.slice(en);
        ta.selectionStart = ta.selectionEnd = s + 4; sync();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || e.shiftKey)) {
        e.preventDefault(); this._runNow(root, ctx);
      }
    });
    ctx.listen(stdinIn, 'keydown', e => { if (e.key === 'Enter') { e.preventDefault(); stdinIn.blur(); this._runNow(root, ctx); } });
    ctx.listen(root.querySelector('.cd-run'), 'click', e => { e.currentTarget.blur(); this._runNow(root, ctx); });
    ctx.listen(root.querySelector('.cd-reset'), 'click', e => {
      e.currentTarget.blur();
      this._setCode(root, ctx, PRESETS[this._cur].code);
      if (PRESETS[this._cur].stdin) stdinIn.value = PRESETS[this._cur].stdin;
      ctx.sfx.play('tick');
    });
    root.querySelectorAll('.cd-tab').forEach(b => ctx.listen(b, 'click', () => {
      b.blur();
      this._finishPrev();
      const i = Number(b.dataset.i);
      this._load(root, ctx, i, { instant: false, typing: false, run: true });
    }));

    // Python 狀態
    const off = ctx.python.onStatus(s => this._status(root, ctx, s));
    ctx.onCleanup(off);
    ctx.onCleanup(() => { this._build++; });
  },

  enter(root, ctx, { instant }) {
    const cam = root.querySelector('.cd-cam');
    gsap.set(cam, { x: 0, y: 0, scale: 1 });
    this._camAt = 'intro';
    this._mode(root, 'guess');
    this._setCode(root, ctx, PRESETS[0].code);
    this._tabInk(root, 0, true);
    ctx.bg.hideParticles(0.4);

    const planes = { ui: root.querySelector('.cd-p-ui'), code: root.querySelector('.cd-p-code'), data: root.querySelector('.cd-p-data') };
    const Z = { ui: 215, code: 0, data: -215 };
    const lbls = root.querySelectorAll('.cd-lbl');
    const segs = root.querySelectorAll('.cd-hbar .seg');
    const n48 = root.querySelector('.cd-48');

    // 持續的小動畫：程式層的掃描光、數據層的位元閃動
    const startLoops = () => {
      ctx.track(gsap.fromTo(root.querySelector('.cd-p-code .scan'), { y: -60 }, { y: 300, duration: 2.4, repeat: -1, ease: 'none' }));
      const bits = root.querySelector('.cd-p-data .bits');
      ctx.every(0.18, () => {
        const a = bits.textContent.split('');
        for (let k = 0; k < 6; k++) { const j = Math.floor(Math.random() * a.length); if (a[j] === '0' || a[j] === '1') a[j] = a[j] === '0' ? '1' : '0'; }
        bits.textContent = a.join('');
      });
      ctx.track(gsap.to(root.querySelector('.cd-lbl-code em'), { scale: 1.08, repeat: -1, yoyo: true, duration: 0.8, ease: 'sine.inOut' }));
    };

    if (instant) {
      Object.entries(planes).forEach(([k, el]) => gsap.set(el, { z: Z[k], opacity: 1 }));
      startLoops();
      return;
    }
    const tl = ctx.tl();
    const k = root.querySelector('.cd-intro .cd-k');
    tl.from(k, { opacity: 0, x: -30, duration: 0.6, ease: 'expo.out' }, 0.1);
    tl.add(ctx.fx.scramble(k, k.textContent, { chars: '01<>{}', duration: 0.9 }), 0.1);
    tl.from(root.querySelectorAll('.cd-title .ln'), { opacity: 0, y: 50, duration: 0.9, stagger: 0.15, ease: 'expo.out' }, 0.2);
    tl.from(root.querySelector('.cd-lead'), { opacity: 0, y: 24, duration: 0.8, ease: 'expo.out' }, 0.6);
    // 三層由合在一起變成分開（「爆炸圖」）
    Object.entries(planes).forEach(([key, el], i) => {
      tl.fromTo(el, { z: 0, opacity: 0 }, { opacity: 1, duration: 0.5 }, 0.3 + i * 0.12);
      tl.to(el, { z: Z[key], duration: 1.4, ease: 'expo.out' }, 1.0);
    });
    tl.call(() => ctx.sfx.play('rise'), null, 0.95);
    tl.from(lbls, { opacity: 0, x: 40, duration: 0.7, stagger: 0.15, ease: 'expo.out' }, 1.5);
    tl.from(root.querySelector('.cd-stat'), { opacity: 0, y: 30, duration: 0.7, ease: 'expo.out' }, 1.2);
    tl.add(ctx.fx.countUp(n48, 48, { duration: 1.6 }), 1.3);
    tl.from(segs, { scaleX: 0, duration: 0.7, stagger: 0.1, ease: 'expo.out' }, 1.6);
    tl.from(root.querySelectorAll('.cd-hbar .seg .h, .cd-hbar-cap'), { opacity: 0, duration: 0.5 }, 2.2);
    tl.fromTo(segs[3], { boxShadow: '0 0 0px rgba(167,139,250,0)' }, { boxShadow: '0 0 60px rgba(167,139,250,.9)', duration: 0.5, yoyo: true, repeat: 1 }, 2.4);
    tl.call(() => ctx.sfx.play('pop'), null, 2.4);
    tl.from(root.querySelectorAll('.cd-chips .chip'), { opacity: 0, y: 20, scale: 0.9, duration: 0.5, stagger: 0.08, ease: 'back.out(2)' }, 2.6);
    tl.call(startLoops, null, 2.4);
  },

  step(root, ctx, n, { instant }) {
    this._finishPrev();
    if (instant) this._quiet = true;
    const tl = ctx.tl();
    this._stepTl = tl;

    if (n === 1) {
      this._camTo(root, ctx, 'ct', tl, instant);
      this._ctAnim(root, ctx, tl, 1.0);
    }
    if (n === 2) {
      this._camTo(root, ctx, 'lab', tl, instant);
      this._load(root, ctx, 0, { instant, typing: true, run: true, tl, at: 1.3 });
    }
    if (n === 3) this._load(root, ctx, 1, { instant, typing: true, run: true, tl, at: 0 });
    if (n === 4) {
      const tRun = this._load(root, ctx, 2, { instant, typing: true, run: true, tl, at: 0 });
      this._revealDive(root, ctx, instant, tl, (tRun || 0) + 3.6);
    }

    if (instant) { tl.progress(1); this._quiet = false; this._stepTl = null; }
  },

  onKey(e, root, ctx) {
    if ((e.key === 'r' || e.key === 'R') && ctx.app.step >= 2) { this._runNow(root, ctx); return true; }
    return false;
  },

  leave() { this._build = (this._build || 0) + 1; },

  // ================= 內部 =================
  _sfx(ctx, name) { if (!this._quiet) ctx.sfx.play(name); },
  _finishPrev() {
    if (this._stepTl) { this._quiet = true; this._stepTl.progress(1); this._quiet = false; this._stepTl = null; }
  },

  _camTo(root, ctx, key, tl, instant) {
    const cam = root.querySelector('.cd-cam');
    const to = CAM[key], from = CAM[this._camAt] || CAM.intro;
    this._camAt = key;
    if (instant) { gsap.set(cam, { x: -to.x, y: -to.y, scale: 1 }); return; }
    const s = 0.56;
    const cx = (from.x + to.x) / 2 + 960, cy = (from.y + to.y) / 2 + 540;
    tl.call(() => this._sfx(ctx, 'whoosh'), null, 0);
    tl.call(() => ctx.bg.warp(1, 1.3, 0.35), null, 0);
    tl.to(cam, { x: 960 - cx * s, y: 540 - cy * s, scale: s, duration: 0.65, ease: 'power2.inOut' }, 0);
    tl.to(cam, { x: -to.x, y: -to.y, scale: 1, duration: 0.85, ease: 'power3.inOut' }, 0.6);
  },

  _ctAnim(root, ctx, tl, at) {
    const cards = root.querySelectorAll('.cd-card');
    const head = root.querySelector('.cd-ct-head');
    tl.from(head.children, { opacity: 0, y: 30, duration: 0.7, stagger: 0.1, ease: 'expo.out' }, at - 0.4);
    cards.forEach((c, i) => {
      const t0 = at + 0.25 + i * 0.55;
      tl.from(c, { opacity: 0, y: 80, rotationX: -25, transformPerspective: 1200, duration: 0.8, ease: 'expo.out' }, t0);
      tl.call(() => this._sfx(ctx, 'pop'), null, t0);
      tl.from(c.querySelectorAll('.cd-card-t, .cd-card-d, .cd-card-ex'), { opacity: 0, y: 16, duration: 0.5, stagger: 0.08 }, t0 + 0.3);
      const ic = c.querySelector('svg');
      if (i === 0) {
        tl.to(ic.querySelector('.big'), { opacity: 0, scale: 0.9, transformOrigin: '50% 50%', duration: 0.4 }, t0 + 0.5);
        tl.to(ic.querySelectorAll('.q'), { opacity: 1, duration: 0.2 }, t0 + 0.5);
        [[-14, -6], [14, -6], [-14, 6], [14, 6]].forEach(([dx, dy], k) => tl.to(ic.querySelector('.q' + (k + 1)), { x: dx, y: dy, duration: 0.7, ease: 'back.out(2.5)' }, t0 + 0.6));
      } else if (i === 1) {
        tl.from(ic.querySelectorAll('.shapes > *'), { opacity: 0, scale: 0, transformOrigin: '50% 50%', duration: 0.3, stagger: 0.06 }, t0 + 0.3);
        tl.fromTo(ic.querySelectorAll('.frame'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.6, stagger: 0.25 }, t0 + 0.7);
        tl.fromTo(ic.querySelectorAll('.loop, .loop-head'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.5 }, t0 + 1.1);
      } else if (i === 2) {
        tl.to(ic.querySelector('.road'), { morphSVG: 'M18 75 L222 75', duration: 0.9, ease: 'power2.inOut' }, t0 + 0.6);
        tl.to(ic.querySelectorAll('.detail > *'), { opacity: 0, scale: 0, transformOrigin: '50% 50%', duration: 0.4, stagger: 0.04 }, t0 + 0.5);
        tl.to(ic.querySelectorAll('.stops circle'), { opacity: 1, duration: 0.3, stagger: 0.12 }, t0 + 1.2);
      } else {
        tl.from(ic.querySelectorAll('.b'), { opacity: 0, scale: 0.5, transformOrigin: '50% 50%', duration: 0.35, stagger: 0.3, ease: 'back.out(2)' }, t0 + 0.4);
        tl.fromTo(ic.querySelectorAll('.ar'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.3, stagger: 0.3 }, t0 + 0.6);
        tl.fromTo(ic.querySelector('.tick'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.4 }, t0 + 1.3);
      }
    });
  },

  _revealDive(root, ctx, instant, tl, at) {
    const pill = root.querySelector('.cd-dive-pill');
    const b1 = root.querySelector('.cd-dive-t .b1');
    if (instant) { gsap.set(pill, { opacity: 1 }); }
    else {
      tl.fromTo(pill, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out' }, at);
      tl.call(() => this._sfx(ctx, 'reveal'), null, at);
    }
    ctx.track(gsap.fromTo(b1, { boxShadow: '0 0 16px #22d3ee, 0 0 30px rgba(34,211,238,.4)' }, { boxShadow: '0 0 30px #22d3ee, 0 0 80px rgba(34,211,238,.9)', repeat: -1, yoyo: true, duration: 0.9, ease: 'sine.inOut' }));
  },

  _status(root, ctx, s) {
    const el = root.querySelector('.cd-status');
    if (!el) return;
    el.classList.toggle('ready', s === 'ready');
    el.classList.toggle('error', s === 'error');
    el.querySelector('.txt').textContent = s === 'ready' ? 'Python 3.14 · 在瀏覽器內真實執行'
      : s === 'error' ? 'Python 未能載入 · 顯示預先準備的輸出' : 'Python 載入中…';
    // 先前因為仍在載入而用了後備輸出：載入好後自動以真正的 Python 再執行一次
    if (s === 'ready' && this._lastFallback === 'loading' && root.querySelector('.cd-ta')) {
      this._lastFallback = null;
      this._run(root, ctx, { instant: true });
    }
  },

  _mode(root, key) {
    const out = root.querySelector('.cd-out');
    out.classList.remove('m-guess', 'm-draw', 'm-speed');
    out.classList.add('m-' + key);
  },

  _tabInk(root, i, instant) {
    const tabs = root.querySelectorAll('.cd-tab');
    tabs.forEach((t, k) => t.classList.toggle('on', k === i));
    const t = tabs[i], ink = root.querySelector('.cd-tab-ink');
    const v = { x: t.offsetLeft + 10, width: t.offsetWidth - 20 };
    if (instant) gsap.set(ink, v); else gsap.to(ink, { ...v, duration: 0.5, ease: 'expo.out' });
  },

  _renderCode(root, ctx, code) {
    const hl = root.querySelector('.cd-hl');
    hl.innerHTML = ctx.fx.highlightPython(code) + '\n';
    const n = code.split('\n').length;
    root.querySelector('.cd-gutter').textContent = Array.from({ length: n }, (_, i) => i + 1).join('\n');
  },
  _setCode(root, ctx, code) {
    const ta = root.querySelector('.cd-ta');
    ta.value = code;
    ta.style.visibility = '';
    this._renderCode(root, ctx, code);
  },

  /** 清空輸出區（切換程式時） */
  _clearOut(root) {
    if (this._outTl) { this._outTl.kill(); this._outTl = null; }
    root.querySelector('.cd-term').innerHTML = '';
    root.querySelector('.cd-viz-guess .rows').innerHTML = '';
    root.querySelector('.cd-out-info').textContent = '';
    root.querySelector('.cd-out-info').classList.remove('fb');
    const cv = root.querySelector('.cd-cv');
    cv.getContext('2d').clearRect(0, 0, cv.width, cv.height);
    root.querySelector('.cd-draw-n').textContent = '';
    gsap.set(root.querySelector('.cd-pen'), { opacity: 0 });
    gsap.set(root.querySelector('.cd-viz-speed'), { opacity: 0 });
  },

  /** 載入第 i 個預設程式（可選打字動畫），然後執行 */
  _load(root, ctx, i, { instant, typing, run, tl, at = 0 }) {
    const p = PRESETS[i];
    this._cur = i;
    this._runId++;
    const ta = root.querySelector('.cd-ta'), hl = root.querySelector('.cd-hl');
    const stdinIn = root.querySelector('.cd-stdin-in');
    if (p.stdin) stdinIn.value = p.stdin;
    this._tabInk(root, i, instant);

    if (instant) {
      this._setCode(root, ctx, p.code);
      this._mode(root, p.key);
      this._clearOut(root);
      if (run) {
        // 即時模式（截圖／返回上一步）：同一輪內只執行最後載入的程式
        this._pending = true;
        Promise.resolve().then(() => { if (this._pending) { this._pending = false; this._run(root, ctx, { instant: true }); } });
      }
      return;
    }
    this._pending = false;
    tl = tl || ctx.tl();
    if (!this._stepTl) this._stepTl = tl;
    const out = root.querySelector('.cd-out');
    const body = root.querySelector('.cd-ed-body');
    // 舊程式淡出、輸出區切換
    tl.to(body, { opacity: 0, x: -30, duration: 0.25, ease: 'power2.in' }, at);
    tl.to(out, { opacity: 0.25, duration: 0.25 }, at);
    tl.call(() => {
      this._mode(root, p.key); this._clearOut(root);
      ta.value = p.code; ta.style.visibility = 'hidden';
      this._renderCode(root, ctx, p.code);
    }, null, at + 0.26);
    tl.to(body, { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' }, at + 0.3);
    tl.to(out, { opacity: 1, duration: 0.4 }, at + 0.3);
    let tEnd = at + 0.6;
    if (typing) {
      const cps = 120;
      const nChars = p.code.replace(/\n/g, '').length;
      const dur = nChars / cps;
      let tw = null;
      let k = 0;
      const sfx = { play: name => { if (!this._quiet && (k++ % 3 === 0)) ctx.sfx.play(name); } };
      tl.call(() => {
        tw = ctx.fx.typeOn(hl, { cps, sfx });
        ctx.track(tw);
      }, null, at + 0.32);
      tl.to({}, { duration: dur }, at + 0.32);
      tEnd = at + 0.4 + dur;
      tl.call(() => {
        if (tw) tw.progress(1);
        const cur = hl.querySelector('.type-cursor');
        if (cur) { gsap.killTweensOf(cur); cur.remove(); }
        this._renderCode(root, ctx, ta.value);
        ta.style.visibility = '';
      }, null, tEnd);
    } else {
      tl.call(() => { ta.style.visibility = ''; }, null, at + 0.3);
    }
    if (run) {
      tl.call(() => this._pressRun(root, ctx), null, tEnd + 0.15);
      tl.call(() => this._run(root, ctx, { instant: false }), null, tEnd + 0.3);
    }
    return tEnd + 0.3;
  },

  _pressRun(root, ctx) {
    const b = root.querySelector('.cd-run');
    gsap.fromTo(b, { scale: 0.92 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' });
    const r = b.getBoundingClientRect(), s = root.getBoundingClientRect();
    const k = ctx.app.scale || 1;
    if (!this._quiet) ctx.fx.pulseAt(root, (r.left + r.width / 2 - s.left) / k, (r.top + r.height / 2 - s.top) / k);
    this._sfx(ctx, 'blip');
  },

  _runNow(root, ctx) {
    this._finishPrev();
    this._pressRun(root, ctx);
    this._run(root, ctx, { instant: false });
  },

  /** 執行編輯器內的程式（真正的 Python；未能使用時用後備輸出） */
  _run(root, ctx, { instant }) {
    const build = this._build;
    const id = ++this._runId;
    const p = PRESETS[this._cur];
    const code = root.querySelector('.cd-ta').value;
    const stdinText = root.querySelector('.cd-stdin-in').value;
    this._clearOut(root);
    const info = root.querySelector('.cd-out-info');
    const status = ctx.python.status;

    if (status !== 'ready') {
      if (status === 'idle') ctx.python.load().catch(() => {});
      this._lastFallback = status === 'error' ? 'error' : 'loading';
      const sim = simulate(p.key, code, stdinText);
      info.textContent = status === 'error' ? '預先準備的輸出' : 'Python 載入中 · 預先準備的輸出';
      info.classList.add('fb');
      this._show(root, ctx, p.key, { ...sim, ms: null }, instant);
      return;
    }
    this._lastFallback = null;
    info.textContent = '執行中…';
    this._chain = this._chain.then(async () => {
      if (build !== this._build || id !== this._runId) return;
      const lines = [];
      const { t, api } = makeTurtle();
      const queue = String(stdinText).split(/[\s,，]+/).filter(Boolean);
      const input = (prompt = '') => {
        if (!queue.length) throw new Error('沒有更多輸入（input）');
        const v = queue.shift();
        lines.push({ k: 'in', p: String(prompt), v });
        return v;
      };
      if (!this._warm) { this._warm = true; await ctx.python.run('pass'); } // 第一次執行較慢，先熱身
      if (build !== this._build || id !== this._runId) return;
      const res = await ctx.python.run(code, {
        onOut: s => lines.push({ k: 'out', s }),
        onErr: s => lines.push({ k: 'err', s }),
        globals: { input, forward: api.forward, left: api.left, right: api.right, color: api.color },
      });
      if (build !== this._build || id !== this._runId) return;
      this._show(root, ctx, p.key, { lines, segs: t.segs, ms: res.ms, ok: res.ok }, instant);
    }).catch(err => console.warn('[code] run', err));
  },

  /** 顯示輸出：終端機文字＋各程式的視覺化 */
  _show(root, ctx, key, { lines, segs, ms, ok = true }, instant) {
    const term = root.querySelector('.cd-term');
    const info = root.querySelector('.cd-out-info');
    if (ms != null) info.textContent = `執行時間 ${ms < 10 ? ms.toFixed(1) : Math.round(ms)} ms`;
    // 錯誤訊息整理成較易明白的樣子
    const errs = lines.filter(l => l.k === 'err').map(l => l.s).join('\n');
    const rows = lines.filter(l => l.k !== 'err').slice(-60);
    if (errs) {
      const m = errs.match(/line (\d+)/g);
      const ln = m ? m[m.length - 1].replace('line ', '') : null;
      const last = errs.trim().split('\n').filter(Boolean).pop();
      rows.push({ k: 'err', s: (ln ? `第 ${ln} 行出錯：` : '出錯：') + last });
    }
    term.innerHTML = rows.map(l => {
      if (l.k === 'in') return `<div class="ln in">${esc(l.p)}<b>${esc(l.v)}</b></div>`;
      if (l.k === 'err') return `<div class="ln err">${esc(l.s)}</div>`;
      const hit = /猜中/.test(l.s), big = /^\d{12,}$/.test(l.s.trim());
      return `<div class="ln${hit ? ' hit' : ''}${big ? ' big' : ''}">${esc(l.s)}</div>`;
    }).join('');
    const lnEls = [...term.querySelectorAll('.ln')];
    const tl = instant ? null : ctx.tl();
    if (tl) this._outTl = tl;
    const quiet = this._quiet;
    if (tl) {
      lnEls.forEach((el, i) => {
        tl.from(el, { opacity: 0, x: -16, duration: 0.25, ease: 'power2.out' }, i * (key === 'guess' ? 0.42 : 0.3));
        if (!quiet) tl.call(() => ctx.sfx.play(el.classList.contains('err') ? 'error' : el.classList.contains('hit') ? 'success' : 'tick'), null, i * (key === 'guess' ? 0.42 : 0.3));
      });
    }

    if (key === 'guess') this._vizGuess(root, ctx, rows, tl);
    if (key === 'draw') this._vizDraw(root, ctx, segs || [], tl);
    if (key === 'speed') this._vizSpeed(root, ctx, rows, tl);
    if (tl && quiet) tl.progress(1);
  },

  _vizGuess(root, ctx, rows, tl) {
    const box = root.querySelector('.cd-viz-guess .rows');
    const W = 568;
    let low = 1, high = 100;
    const pos = v => ((v - 1) / 99) * W;
    const items = [];
    rows.forEach(l => {
      const m = l.k === 'out' && l.s.match(/(\d+)\s*→\s*(太小|太大|猜中)/);
      if (!m) return;
      const g = Number(m[1]);
      items.push({ low, high, g, hit: m[2] === '猜中' });
      if (m[2] === '太小') low = g + 1; else if (m[2] === '太大') high = g - 1;
    });
    box.innerHTML = items.map(it => {
      const left = pos(it.low), w = Math.max(6, pos(it.high) - pos(it.low));
      const nmLeft = pos(it.g) > W - 70 ? pos(it.g) - 62 : pos(it.g) + 12;
      return `<div class="cd-row"><i class="rg" style="left:${left}px;width:${w}px"></i><i class="mk${it.hit ? ' hit' : ''}" style="left:${pos(it.g)}px"></i><span class="nm" style="left:${nmLeft}px">${it.g}</span></div>`;
    }).join('');
    if (tl) {
      [...box.children].forEach((r, i) => {
        const t0 = (i + 1) * 0.42 + 0.05;
        tl.from(r.querySelector('.rg'), { scaleX: 0, transformOrigin: '50% 50%', duration: 0.45, ease: 'expo.out' }, t0);
        tl.from(r.querySelectorAll('.mk, .nm'), { opacity: 0, y: -12, duration: 0.3 }, t0 + 0.15);
      });
    }
  },

  _vizDraw(root, ctx, segs, tl) {
    const cv = root.querySelector('.cd-cv');
    const g = cv.getContext('2d');
    const pen = root.querySelector('.cd-pen');
    const count = root.querySelector('.cd-draw-n');
    const W = cv.width, H = cv.height, pad = 70;
    g.clearRect(0, 0, W, H);
    if (!segs.length) { count.textContent = ''; return; }
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    segs.forEach(s => { x0 = Math.min(x0, s[0], s[2]); x1 = Math.max(x1, s[0], s[2]); y0 = Math.min(y0, s[1], s[3]); y1 = Math.max(y1, s[1], s[3]); });
    const sc = Math.min((W - 2 * pad) / Math.max(1, x1 - x0), (H - 2 * pad) / Math.max(1, y1 - y0), 6);
    const ox = W / 2 - ((x0 + x1) / 2) * sc, oy = H / 2 - ((y0 + y1) / 2) * sc;
    const X = v => ox + v * sc, Y = v => oy + v * sc;
    let drawn = 0;
    g.lineCap = 'round'; g.lineJoin = 'round';
    const drawTo = upto => {
      upto = Math.min(segs.length, Math.floor(upto));
      if (upto <= drawn) return;
      g.globalCompositeOperation = 'lighter';
      for (let i = drawn; i < upto; i++) {
        const s = segs[i];
        g.strokeStyle = s[4]; g.shadowColor = s[4];
        g.shadowBlur = 16; g.lineWidth = 3.2;
        g.beginPath(); g.moveTo(X(s[0]), Y(s[1])); g.lineTo(X(s[2]), Y(s[3])); g.stroke();
      }
      drawn = upto;
      const last = segs[upto - 1];
      gsap.set(pen, { x: X(last[2]) / 2, y: Y(last[3]) / 2 });
      count.textContent = `線條 ${upto} / ${segs.length}`;
    };
    if (!tl) { drawTo(segs.length); return; }
    const o = { v: 0 };
    const dur = Math.min(3.2, 0.8 + segs.length * 0.008);
    tl.set(pen, { opacity: 1 }, 0.1);
    tl.to(o, { v: segs.length, duration: dur, ease: 'power1.inOut', onUpdate: () => drawTo(o.v) }, 0.1);
    tl.call(() => drawTo(segs.length), null, 0.1 + dur);
    tl.to(pen, { opacity: 0, duration: 0.4 }, 0.1 + dur);
    if (!this._quiet) {
      tl.call(() => ctx.sfx.play('rise'), null, 0.1);
      tl.call(() => ctx.sfx.play('success'), null, 0.1 + dur);
    }
  },

  _vizSpeed(root, ctx, rows, tl) {
    const viz = root.querySelector('.cd-viz-speed');
    const txt = rows.map(r => r.s || '').join('\n');
    const m = txt.match(/([\d.]+)\s*秒/);
    const used = m ? Math.max(0.0001, parseFloat(m[1])) : null;
    if (used == null) { gsap.set(viz, { opacity: 0 }); return; }
    const sec = viz.querySelector('.sp-sec');
    const ratio = 1e6 / used;
    const nice = r => {
      if (r >= 1e8) return (r / 1e8).toFixed(1).replace(/\.0$/, '') + ' 億';
      if (r >= 1e4) { const w = r / 1e4; const p = Math.pow(10, Math.max(0, Math.floor(Math.log10(w)) - 1)); return (Math.round(w / p) * p).toLocaleString('en-US') + ' 萬'; }
      return Math.round(r).toLocaleString('en-US');
    };
    viz.querySelector('.sp-v-py').textContent = `${used.toFixed(used < 0.1 ? 3 : 2)} 秒`;
    viz.querySelector('.sp-ratio').textContent = nice(ratio);
    const lines = root.querySelectorAll('.cd-term .ln').length;
    if (!tl) { gsap.set(viz, { opacity: 1 }); sec.textContent = used.toFixed(4); return; }
    const t0 = lines * 0.3 + 0.2;
    tl.set(viz, { opacity: 1 }, t0);
    tl.from(viz.querySelector('.sp-big'), { opacity: 0, scale: 0.7, transformOrigin: '0% 80%', duration: 0.7, ease: 'back.out(2)' }, t0);
    tl.add(ctx.fx.countUp(sec, used, { decimals: 4, duration: 0.9 }), t0);
    tl.from(viz.querySelectorAll('.sp-cap, .sp-row, .sp-note'), { opacity: 0, y: 16, duration: 0.5, stagger: 0.12 }, t0 + 0.5);
    tl.from(viz.querySelector('.sp-hu'), { scaleX: 0, duration: 1.6, ease: 'power2.inOut' }, t0 + 0.9);
    tl.from(viz.querySelector('.sp-py'), { scaleX: 0, duration: 0.2 }, t0 + 0.8);
    tl.from(viz.querySelector('.sp-x'), { opacity: 0, y: 20, duration: 0.6, ease: 'expo.out' }, t0 + 2.2);
    if (!this._quiet) tl.call(() => ctx.sfx.play('reveal'), null, t0 + 2.2);
  },
};
