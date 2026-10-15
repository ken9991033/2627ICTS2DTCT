// 06 數據層：A 資訊處理（37 小時）
// 站內鏡頭：位元燈泡（二進制、ASCII）→ 像素相片放大（多媒體數碼化）→ 試算表變圖表（數據分析）
// 步驟：1 01001001 → 73 → I（並顯示 ICT 三個字母的位元）　2 相片放大至像素及 RGB 數值　3 試算表 → 圖表，數據存入記憶體
const gsap = window.gsap;

const PLACE = [128, 64, 32, 16, 8, 4, 2, 1];
const WORD = [['I', 73], ['C', 67], ['T', 84]];
const CAM = { bits: { x: 0, y: 0 }, pix: { x: 1920, y: 0 }, sheet: { x: 1920, y: 1080 } };

// 像素相片（以程式繪製的香港維港黃昏，40 × 25 像素）
const PW = 40, PH = 25, PS = 22;            // 每個像素在畫面上 22px → 880 × 550
const ZOOM = 7;                              // 放大倍數
const FOCUS = { x: 10, y: 8 };               // 放大時置中的像素（左上角座標）
const PICK = { x: 10, y: 8 };                // 左邊「混色」顯示的像素

const SURVEY = [['少於 1 小時', 3], ['1–2 小時', 8], ['2–3 小時', 12], ['3–4 小時', 9], ['4 小時以上', 4]];

const ARROW = '<svg viewBox="0 0 60 30" width="60" height="30" aria-hidden="true"><path d="M4 15 H50 M40 5 L52 15 L40 25" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const BULB = `<svg viewBox="0 0 120 162" aria-hidden="true">
  <path class="g" d="M60 6 C29 6 8 29 8 58 C8 80 22 93 33 105 C39 112 42 119 42 125 L78 125 C78 119 81 112 87 105 C98 93 112 80 112 58 C112 29 91 6 60 6 Z"/>
  <path class="fil" d="M48 125 L48 94 L54 78 L60 94 L66 78 L72 94 L72 125"/>
  <rect class="base" x="40" y="130" width="40" height="8" rx="3"/><rect class="base" x="42" y="142" width="36" height="8" rx="3"/><rect class="base" x="49" y="154" width="22" height="6" rx="3"/>
</svg>`;

const toBin = v => v.toString(2).padStart(8, '0');
const chrOf = v => (v >= 33 && v <= 126 ? String.fromCharCode(v) : v === 32 ? '空格' : null);

function mulberry(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

/** 產生像素相片：回傳 [r,g,b] 陣列（PW × PH） */
function makePicture() {
  const R = mulberry(2026);
  const px = Array.from({ length: PH }, () => Array.from({ length: PW }, () => [0, 0, 0]));
  const set = (x, y, c) => { if (x >= 0 && x < PW && y >= 0 && y < PH) px[y][x] = c.slice(); };
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  // 天空：一級一級的色帶（像素畫風格）
  const SKY = ['#1b1446', '#251a5c', '#33206e', '#4a2580', '#66298a', '#87308d', '#a83a86', '#c8487c', '#e35d6f', '#f47b5f', '#fb9a58', '#fdb55c', '#fecb6a', '#fedb7c', '#ffe08a', '#ffe8a3'];
  for (let y = 0; y < 17; y++) for (let x = 0; x < PW; x++) {
    let k = Math.min(SKY.length - 1, Math.floor(y * SKY.length / 17));
    if (R() < 0.18 && k > 0 && y % 2) k -= 1; // 少許混色
    set(x, y, hex(SKY[k]));
  }
  // 星星
  [[3, 1], [14, 2], [22, 0], [35, 1], [27, 3], [6, 4], [38, 4]].forEach(([x, y]) => set(x, y, [235, 230, 255]));
  // 太陽
  for (let y = 9; y < 17; y++) for (let x = 25; x < 36; x++) {
    const d = Math.hypot(x - 30, y - 13.2);
    if (d < 2.6) set(x, y, [255, 246, 196]); else if (d < 3.7) set(x, y, [255, 214, 120]);
  }
  // 遠山（獅子山般的輪廓）
  const ridge = x => 13.2 + Math.sin(x * 0.33) * 0.9 + Math.sin(x * 0.11 + 1) * 1.4 - (x > 27 && x < 34 ? 1.6 : 0);
  for (let x = 0; x < PW; x++) for (let y = Math.round(ridge(x)); y < 18; y++) set(x, y, y < 15 ? [86, 44, 110] : [70, 36, 96]);
  // 大廈
  const B = [[0, 3, 12], [3, 3, 9], [6, 2, 13], [8, 4, 3], [12, 3, 10], [15, 2, 7], [17, 4, 11], [21, 2, 14], [23, 3, 9], [26, 4, 12], [30, 2, 8], [32, 3, 11], [35, 3, 14], [38, 2, 10]];
  B.forEach(([x0, w, top], bi) => {
    const body = bi % 2 ? [22, 28, 64] : [30, 36, 80];
    for (let y = top; y < 19; y++) for (let x = x0; x < x0 + w; x++) {
      const edge = x === x0 + w - 1 ? 0.78 : 1;
      set(x, y, body.map(v => Math.round(v * edge)));
      if (y > top && y < 18 && (x - x0) % 2 === 1 && R() < 0.55) set(x, y, R() < 0.7 ? [255, 209, 102] : [125, 211, 252]);
    }
  });
  // 最高的大樓頂部
  set(9, 3, [40, 46, 96]); set(9, 2, [125, 211, 252]); set(10, 3, [40, 46, 96]);
  // 海港與倒影
  for (let y = 19; y < PH; y++) for (let x = 0; x < PW; x++) {
    const base = y % 2 ? [12, 30, 66] : [16, 38, 82];
    set(x, y, base);
    const above = px[18 - (y - 19)][x];
    const bright = above[0] + above[1] > 380;
    if (bright && R() < 0.75) set(x, y, above.map((v, i) => Math.round(v * 0.62 + base[i] * 0.38)));
    else if (R() < 0.06) set(x, y, [60, 110, 170]);
  }
  for (let y = 19; y < PH; y++) for (let x = 27; x < 34; x++) if (R() < 0.5) set(x, y, [253, 186, 116]); // 太陽倒影
  return px;
}

export default {
  id: 'data',
  title: '數據層：資訊處理',
  short: '數據層',
  module: 'A',
  accent: '#22d3ee',
  layer: 'data',
  tint: ['#22d3ee', '#34d399'],
  transition: { type: 'zoomIn', focus: '.code-dive' },
  steps: 3,
  minutes: 1.25,
  notes: `【數據層 · 單元 A 資訊處理 · 約 37 小時】
進站：「我們穿過了程式，來到數據層。電腦其實只懂兩個狀態：開和關，即 1 和 0。」畫面上的 8 個燈泡就是 8 個位元（bit），合稱 1 個位元組（byte）。

按 →（第 1 步）燈泡亮起 01001001。上面的數字是每個位元的「位值」：64 + 8 + 1 = 73。在 ASCII 編碼中，73 代表英文字母「I」。右邊顯示開場程式中的 I、C、T 三個字母的二進制。
・互動：可以直接點擊燈泡開關，即時看到十進制數值和字元改變。可以問學生：「全部燈泡亮起是多少？」（255）
・補充：中文字也有編碼（例如 Unicode），只是需要更多位元。

按 →（第 2 步）「一張相片，也是一堆數字。」右邊是一張用程式繪製的維港黃昏像素相片，鏡頭會放大 7 倍，每一格就是一個像素，每個像素由紅、綠、藍三個 0 至 255 的數字組成。左下方顯示其中一格的混色。
・可以問學生：「一張 1,200 萬像素的相片，大約有多少個數字？」（約 3,600 萬個）
・聲音、影片亦同樣會被數碼化成數字——這些都是單元 A 的內容。

按 →（第 3 步）試算表與數據分析：問卷數據（虛構）由試算表「飛」成棒形圖，總數由公式 =SUM(B2:B6) 計算。可以點擊 B 欄的數字修改，圖表即時更新。
・最後指着底部發光的位元：「每一個數字，最終都以 0 和 1 儲存在記憶體之中。這些位元究竟存放在哪裏？」按 → 鏡頭穿過這個位元，進入硬件層。`,

  build(root, ctx) {
    this._camAt = 'bits'; this._stepTl = null; this._quiet = false; this._val = 0;
    this._pic = this._pic || makePicture();

    const bulbs = PLACE.map((v, i) => `
      <button type="button" class="dt-bulb" data-i="${i}" aria-label="位元 ${v}">
        <span class="pv mono">${v}</span>
        <span class="glass"><i class="halo"></i>${BULB}</span>
        <span class="bit mono">0</span>
      </button>`).join('');
    const word = WORD.map(([c, v]) => `<div class="byte"><b>${c}</b><span class="cells">${toBin(v).split('').map(b => `<i class="c${b}">${b}</i>`).join('')}</span><span class="dec mono">${v}</span></div>`).join('');
    const sheetRows = SURVEY.map(([k, v], i) => `<div class="r"><span class="rn">${i + 2}</span><span class="ca">${k}</span><span class="cb"><input class="dt-in mono" type="text" inputmode="numeric" value="${v}" data-i="${i}" aria-label="${k}人數"></span></div>`).join('');
    const bars = SURVEY.map(([k], i) => `<div class="bar" data-i="${i}"><span class="val mono">0</span><i class="fill"></i><span class="lab">${k}</span></div>`).join('');

    root.innerHTML = `
      <div class="dt-cam">
        <!-- 場景一：位元 -->
        <section class="dt-scene dt-s-bits">
          <div class="dt-head">
            <div class="kicker dt-k">單元 A · 資訊處理 · 37 小時</div>
            <h1 class="h1">電腦只懂 <span class="grad">0</span> 和 <span class="grad">1</span></h1>
            <p class="dt-sub">每一個位元（bit）只有兩個狀態：開（1）或關（0）。</p>
          </div>
          <div class="dt-bulbs">${bulbs}</div>
          <div class="dt-read">
            <div class="box b-bin"><label>二進制</label><div class="v mono">00000000</div></div>
            <div class="arr">${ARROW}</div>
            <div class="box b-dec"><label>十進制</label><div class="v mono">0</div><div class="calc mono">&nbsp;</div></div>
            <div class="arr">${ARROW}</div>
            <div class="box b-chr"><label>ASCII 字元</label><div class="v">—</div></div>
          </div>
          <div class="dt-word">
            <div class="cap">開場程式的「ICT」，在電腦內是 24 個位元</div>
            ${word}
          </div>
          <div class="dt-note">中文字也有編碼（例如 Unicode），只是需要更多位元。</div>
        </section>

        <!-- 場景二：像素 -->
        <section class="dt-scene dt-s-pix">
          <div class="dt-head">
            <div class="kicker dt-k">多媒體的數碼化</div>
            <h1 class="h1">一張相片，也是<span class="grad">一堆數字</span></h1>
          </div>
          <ul class="dt-pts">
            <li><b>1</b><span>相片由很多細小的「像素」組成</span></li>
            <li><b>2</b><span>每個像素＝紅、綠、藍三個數字（0–255）</span></li>
            <li><b>3</b><span>1,200 萬像素的相片 ≈ 3,600 萬個數字</span></li>
            <li><b>4</b><span>聲音、影片同樣可以數碼化</span></li>
          </ul>
          <div class="dt-mix">
            <div class="mx"><span class="r mono">R <b>0</b></span><span class="op">+</span><span class="g mono">G <b>0</b></span><span class="op">+</span><span class="b mono">B <b>0</b></span><span class="op">=</span><i class="sw"></i></div>
          </div>
          <div class="dt-view">
            <canvas class="dt-pic" width="${PW}" height="${PH}"></canvas>
            <div class="dt-grid"></div>
            <div class="dt-labels"></div>
            <div class="dt-zbox"></div>
          </div>
          <div class="dt-view-cap"><span class="zb mono">×1</span><span class="zt">整張相片：40 × 25 = 1,000 個像素</span></div>
        </section>

        <!-- 場景三：試算表 -->
        <section class="dt-scene dt-s-sheet">
          <div class="dt-head">
            <div class="kicker dt-k">試算表與數據分析</div>
            <h1 class="h1">數據分析：由數字找出<span class="grad">意義</span></h1>
            <p class="dt-sub">中三級問卷：每日使用手機的時間（虛構數據）</p>
          </div>
          <div class="dt-sheet">
            <div class="fx"><b>fx</b><span class="mono f">=SUM(B2:B6)</span></div>
            <div class="grid">
              <div class="r hd"><span class="rn"></span><span class="ca">A</span><span class="cb">B</span></div>
              <div class="r h1r"><span class="rn">1</span><span class="ca">每日使用時間</span><span class="cb">人數</span></div>
              ${sheetRows}
              <div class="r tot"><span class="rn">7</span><span class="ca">總數</span><span class="cb mono"><span class="sum">36</span></span></div>
            </div>
          </div>
          <div class="dt-chart">
            <div class="axis"></div>
            <div class="bars">${bars}</div>
            <div class="callout"><b>最多同學：</b><span class="ct">2–3 小時</span></div>
          </div>
          <div class="dt-mem">
            <span class="ml">總數 <b class="mono mv">36</b> 存放在記憶體中：</span>
            <span class="cells">${toBin(36).split('').map((b, i) => `<i class="c${b}${i === 2 ? ' data-dive' : ''}">${b}</i>`).join('')}</span>
            <span class="nx">下一層：硬件</span>
          </div>
        </section>
      </div>
    `;

    const css = document.createElement('style');
    css.textContent = `
      .st-data .dt-cam { position:absolute; left:0; top:0; width:1920px; height:1080px; transform-origin:0 0; }
      .st-data .dt-scene { position:absolute; width:1920px; height:1080px; }
      .st-data .dt-s-bits { left:0; top:0; }
      .st-data .dt-s-pix { left:1920px; top:0; }
      .st-data .dt-s-sheet { left:1920px; top:1080px; }
      .st-data .dt-head { position:absolute; left:200px; top:84px; right:120px; }
      .st-data .dt-k { font-size:24px; letter-spacing:.2em; }
      .st-data .dt-head .h1 { margin-top:14px; }
      .st-data .dt-sub { margin:14px 0 0; font-size:30px; color:var(--ink-2); }

      /* ---------- 位元燈泡 ---------- */
      .st-data .dt-bulbs { position:absolute; left:274px; top:310px; display:flex; gap:36px; }
      .st-data .dt-bulb { width:150px; padding:0; border:0; background:none; cursor:pointer; display:flex; flex-direction:column; align-items:center; color:var(--ink); font-family:var(--font); }
      .st-data .dt-bulb .pv { font-size:28px; font-weight:700; color:var(--ink-3); height:40px; transition:color .3s; }
      .st-data .dt-bulb .glass { position:relative; width:120px; height:162px; margin-top:6px; }
      .st-data .dt-bulb .glass svg { position:relative; width:120px; height:162px; overflow:visible; }
      .st-data .dt-bulb .halo { position:absolute; left:50%; top:58px; width:240px; height:240px; margin:-120px 0 0 -120px; border-radius:50%;
        background:radial-gradient(circle, rgba(34,211,238,.55), rgba(34,211,238,.12) 45%, transparent 70%); opacity:0; transition:opacity .35s; }
      .st-data .dt-bulb .g { fill:rgba(160,180,255,.06); stroke:rgba(160,180,255,.35); stroke-width:3; transition:fill .3s, stroke .3s; }
      .st-data .dt-bulb .fil { fill:none; stroke:rgba(160,180,255,.35); stroke-width:3; stroke-linejoin:round; transition:stroke .3s; }
      .st-data .dt-bulb .base { fill:rgba(160,180,255,.3); }
      .st-data .dt-bulb .bit { margin-top:14px; font-size:72px; font-weight:800; line-height:1; color:var(--ink-3); transition:color .3s, text-shadow .3s; }
      .st-data .dt-bulb.on .halo { opacity:1; }
      .st-data .dt-bulb.on .g { fill:rgba(165,243,252,.92); stroke:#e0fbff; }
      .st-data .dt-bulb.on .fil { stroke:#fff; }
      .st-data .dt-bulb.on .bit { color:#fff; text-shadow:0 0 24px var(--accent); }
      .st-data .dt-bulb.on .pv { color:var(--accent); }
      .st-data .dt-bulb:hover .g { stroke:var(--accent); }

      .st-data .dt-read { position:absolute; left:220px; top:660px; display:flex; align-items:center; gap:18px; }
      .st-data .dt-read .box { height:190px; padding:20px 30px; border-radius:24px; border:1px solid var(--line); background:rgba(10,14,34,.75); }
      .st-data .dt-read label { display:block; font-size:24px; font-weight:700; color:var(--ink-3); }
      .st-data .dt-read .v { margin-top:8px; font-weight:800; line-height:1.1; }
      .st-data .b-bin { width:390px; } .st-data .b-bin .v { font-size:60px; letter-spacing:.04em; color:#a5f3fc; }
      .st-data .b-dec { width:250px; } .st-data .b-dec .v { font-size:80px; color:#fff; }
      .st-data .b-dec .calc { margin-top:6px; font-size:24px; color:var(--accent); white-space:nowrap; }
      .st-data .b-chr { width:200px; border-color:color-mix(in srgb, var(--accent) 60%, transparent) !important; box-shadow:0 0 50px color-mix(in srgb, var(--accent) 25%, transparent); }
      .st-data .b-chr .v { font:900 104px/1 var(--mono); color:var(--accent); text-shadow:0 0 30px var(--accent); }
      .st-data .b-chr .v.small { font:800 32px/3.2 var(--font); color:var(--ink-2); text-shadow:none; }
      .st-data .dt-read .arr { color:var(--ink-3); }

      .st-data .dt-word { position:absolute; left:1200px; top:640px; width:600px; }
      .st-data .dt-word .cap { font-size:26px; font-weight:700; color:var(--ink-2); margin-bottom:14px; }
      .st-data .dt-word .byte { display:flex; align-items:center; gap:16px; height:66px; }
      .st-data .dt-word .byte b { width:56px; font:900 52px var(--mono); color:var(--accent); text-align:center; }
      .st-data .dt-word .cells { display:flex; gap:5px; }
      .st-data .dt-word .cells i, .st-data .dt-mem .cells i { display:grid; place-items:center; width:42px; height:52px; border-radius:8px; font:800 28px var(--mono); font-style:normal; }
      .st-data .cells i.c1 { background:color-mix(in srgb, var(--accent) 85%, transparent); color:#05060f; }
      .st-data .cells i.c0 { background:rgba(160,180,255,.08); color:var(--ink-3); border:1px solid rgba(160,180,255,.18); }
      .st-data .dt-word .dec { font-size:28px; font-weight:700; color:var(--ink-2); margin-left:6px; }
      .st-data .dt-note { position:absolute; left:220px; top:900px; font-size:28px; color:var(--ink-2); }

      /* ---------- 像素 ---------- */
      .st-data .dt-pts { position:absolute; left:200px; top:300px; width:660px; margin:0; padding:0; list-style:none; }
      .st-data .dt-pts li { display:flex; gap:20px; align-items:flex-start; margin-bottom:26px; font-size:30px; line-height:1.45; color:var(--ink); }
      .st-data .dt-pts li b { flex:none; display:grid; place-items:center; width:46px; height:46px; border-radius:12px; font:800 26px var(--mono); color:#05060f; background:var(--accent); }
      .st-data .dt-mix { position:absolute; left:200px; top:820px; width:680px; }
      .st-data .dt-mix .mx { display:flex; align-items:center; gap:12px; font-size:30px; font-weight:800; }
      .st-data .dt-mix .mx > span:not(.op) { padding:8px 14px; border-radius:12px; background:rgba(255,255,255,.05); }
      .st-data .dt-mix .r { color:#ff6b81; } .st-data .dt-mix .g { color:#4ade80; } .st-data .dt-mix .b { color:#60a5fa; }
      .st-data .dt-mix .op { color:var(--ink-3); }
      .st-data .dt-mix .sw { width:72px; height:72px; border-radius:14px; border:3px solid #fff; box-shadow:0 0 30px rgba(255,255,255,.25); }
      .st-data .dt-view { position:absolute; left:920px; top:250px; width:880px; height:550px; overflow:hidden; border-radius:20px; border:2px solid var(--line-strong); background:#000; }
      .st-data .dt-pic { position:absolute; left:0; top:0; width:880px; height:550px; image-rendering:pixelated; transform-origin:0 0; }
      .st-data .dt-grid { position:absolute; inset:0; opacity:0; pointer-events:none; }
      .st-data .dt-labels { position:absolute; inset:0; pointer-events:none; }
      .st-data .dt-lab { position:absolute; width:118px; margin-left:-59px; padding:6px 0; border-radius:10px; background:rgba(4,6,16,.72); text-align:center; font:700 24px/1.25 var(--mono); }
      .st-data .dt-lab .r { color:#ff8a9a; } .st-data .dt-lab .g { color:#6ee7a0; } .st-data .dt-lab .b { color:#7cb7ff; }
      .st-data .dt-lab.pick { outline:3px solid #fff; box-shadow:0 0 24px rgba(255,255,255,.5); }
      .st-data .dt-zbox { position:absolute; border:3px solid #fff; border-radius:4px; box-shadow:0 0 0 2000px rgba(0,0,0,.35), 0 0 24px #fff; opacity:0; pointer-events:none; }
      .st-data .dt-view-cap { position:absolute; left:920px; top:830px; display:flex; align-items:center; gap:18px; font-size:28px; color:var(--ink-2); }
      .st-data .dt-view-cap .zb { padding:6px 16px; border-radius:10px; font-size:28px; font-weight:800; color:#05060f; background:var(--accent); }

      /* ---------- 試算表 ---------- */
      .st-data .dt-sheet { position:absolute; left:200px; top:330px; width:700px; border-radius:20px; overflow:hidden; border:1px solid var(--line-strong); background:#0a0f22; box-shadow:0 30px 80px rgba(0,0,0,.45); }
      .st-data .dt-sheet .fx { display:flex; align-items:center; gap:18px; height:62px; padding:0 22px; background:#0f1530; border-bottom:1px solid var(--line); }
      .st-data .dt-sheet .fx b { font:italic 800 26px var(--mono); color:#34d399; }
      .st-data .dt-sheet .fx .f { font-size:28px; color:#e5e7ff; }
      .st-data .dt-sheet .r { display:grid; grid-template-columns:60px 1fr 200px; height:62px; border-bottom:1px solid rgba(160,180,255,.1); }
      .st-data .dt-sheet .r > span { display:flex; align-items:center; padding:0 20px; font-size:28px; border-right:1px solid rgba(160,180,255,.1); }
      .st-data .dt-sheet .rn { justify-content:center; padding:0 !important; font:700 24px var(--mono) !important; color:var(--ink-3); background:#0f1530; }
      .st-data .dt-sheet .hd { height:44px; background:#0f1530; }
      .st-data .dt-sheet .hd > span { justify-content:center; font:700 24px var(--mono); color:var(--ink-3); }
      .st-data .dt-sheet .h1r > span { font-weight:800; color:var(--ink-2); }
      .st-data .dt-sheet .cb { justify-content:flex-end; }
      .st-data .dt-in { width:100%; height:48px; border:0; outline:none; background:transparent; color:#fff; font-size:30px; font-weight:800; text-align:right; border-radius:8px; }
      .st-data .dt-in:focus { background:rgba(34,211,238,.15); box-shadow:inset 0 0 0 2px var(--accent); }
      .st-data .dt-sheet .tot > span { font-weight:900; color:#fff; }
      .st-data .dt-sheet .tot .cb { font-size:34px; color:#34d399; box-shadow:inset 0 0 0 3px #34d399; }

      .st-data .dt-chart { position:absolute; left:980px; top:330px; width:820px; height:560px; }
      .st-data .dt-chart .axis { position:absolute; left:0; right:0; bottom:66px; height:3px; background:var(--line-strong); }
      .st-data .dt-chart .bars { position:absolute; left:20px; right:20px; top:0; bottom:66px; display:flex; align-items:flex-end; gap:34px; }
      .st-data .dt-chart .bar { position:relative; flex:1; height:100%; display:flex; flex-direction:column; justify-content:flex-end; align-items:center; }
      .st-data .dt-chart .fill { display:block; width:100%; height:0; border-radius:14px 14px 4px 4px; background:linear-gradient(180deg, #67e8f9, #0e7490); box-shadow:0 0 30px rgba(34,211,238,.25); }
      .st-data .dt-chart .bar.top .fill { background:linear-gradient(180deg, #fde68a, #f59e0b); box-shadow:0 0 40px rgba(251,191,36,.5); }
      .st-data .dt-chart .val { font-size:36px; font-weight:800; margin-bottom:8px; }
      .st-data .dt-chart .lab { position:absolute; top:100%; margin-top:16px; font-size:24px; color:var(--ink-2); white-space:nowrap; }
      .st-data .dt-chart .callout { position:absolute; right:0; top:-6px; padding:10px 22px; border-radius:14px; font-size:28px; background:rgba(251,191,36,.14); border:1px solid rgba(251,191,36,.6); color:#fde68a; }
      .st-data .dt-chart .callout b { color:#fff; }

      .st-data .dt-mem { position:absolute; left:200px; top:938px; width:1600px; display:flex; align-items:center; gap:22px; font-size:28px; color:var(--ink-2); }
      .st-data .dt-mem .ml b { color:#34d399; font-size:32px; }
      .st-data .dt-mem .cells { display:flex; gap:6px; }
      .st-data .dt-mem .data-dive { box-shadow:0 0 0 3px #fff, 0 0 30px var(--accent), 0 0 70px var(--accent); }
      .st-data .dt-mem .nx { margin-left:auto; font:700 24px var(--mono); letter-spacing:.12em; color:#fbbf24; padding:8px 18px; border-radius:999px; border:1px solid rgba(251,191,36,.6); }
    `;
    root.appendChild(css);

    // 像素相片
    const cv = root.querySelector('.dt-pic');
    this._drawPic(cv, PH);

    // 燈泡可以直接點擊
    root.querySelectorAll('.dt-bulb').forEach(b => ctx.listen(b, 'click', () => {
      b.blur();
      const i = Number(b.dataset.i);
      this._setVal(root, ctx, this._val ^ PLACE[i], { pop: i });
      ctx.sfx.play('tick');
    }));
    // 試算表可以修改
    root.querySelectorAll('.dt-in').forEach(inp => {
      ctx.listen(inp, 'input', () => this._sheetUpdate(root, ctx, false));
      ctx.listen(inp, 'keydown', e => { if (e.key === 'Enter') { e.preventDefault(); inp.blur(); } });
      ctx.listen(inp, 'focus', () => inp.select());
    });
  },

  enter(root, ctx, { instant }) {
    gsap.set(root.querySelector('.dt-cam'), { x: 0, y: 0, scale: 1 });
    this._camAt = 'bits';
    ctx.bg.hideParticles(0.4);
    this._setVal(root, ctx, 0, {});
    // 初始狀態：ICT 位元、說明等待第 1 步
    gsap.set(root.querySelectorAll('.dt-word, .dt-note'), { opacity: 0 });
    gsap.set(root.querySelectorAll('.dt-pts li, .dt-mix, .dt-view-cap'), { opacity: 0 });
    gsap.set(root.querySelectorAll('.dt-sheet, .dt-chart .callout, .dt-mem'), { opacity: 0 });
    gsap.set(root.querySelector('.dt-view'), { opacity: 0 });
    gsap.set(root.querySelectorAll('.dt-chart .fill'), { height: 0 });
    if (instant) return;
    const tl = ctx.tl();
    const head = root.querySelector('.dt-s-bits .dt-head');
    tl.from(head.children, { opacity: 0, y: 34, duration: 0.8, stagger: 0.12, ease: 'expo.out' }, 0.1);
    tl.add(ctx.fx.scramble(head.querySelector('.dt-k'), head.querySelector('.dt-k').textContent, { chars: '01', duration: 0.9 }), 0.1);
    tl.from(root.querySelectorAll('.dt-bulb'), { opacity: 0, y: 60, duration: 0.7, stagger: 0.07, ease: 'back.out(1.6)' }, 0.35);
    tl.from(root.querySelectorAll('.dt-read > *'), { opacity: 0, y: 30, duration: 0.6, stagger: 0.08, ease: 'expo.out' }, 0.9);
    // 開場時燈泡隨機閃動，然後全部熄滅
    const flick = [0b10110010, 0b01101101, 0b11010110, 0b00111001, 0];
    flick.forEach((v, i) => tl.call(() => this._setVal(root, ctx, v, {}), null, 1.0 + i * 0.16));
    tl.call(() => ctx.sfx.play('blip'), null, 1.0);
  },

  step(root, ctx, n, { instant }) {
    if (this._stepTl) { this._quiet = true; this._stepTl.progress(1); this._quiet = false; }
    if (instant) this._quiet = true;
    const tl = ctx.tl();
    this._stepTl = tl;
    if (n === 1) this._stepBits(root, ctx, tl);
    if (n === 2) { this._camTo(root, ctx, 'pix', tl, instant); this._stepPix(root, ctx, tl, instant ? 0 : 1.2); }
    if (n === 3) { this._camTo(root, ctx, 'sheet', tl, instant); this._stepSheet(root, ctx, tl, instant ? 0 : 1.2); }
    if (instant) { tl.progress(1); this._quiet = false; this._stepTl = null; }
  },

  leave() {},

  // ================= 內部 =================
  _sfx(ctx, name) { if (!this._quiet) ctx.sfx.play(name); },

  _camTo(root, ctx, key, tl, instant) {
    const cam = root.querySelector('.dt-cam');
    const to = CAM[key], from = CAM[this._camAt] || CAM.bits;
    this._camAt = key;
    if (instant) { gsap.set(cam, { x: -to.x, y: -to.y, scale: 1 }); return; }
    const s = 0.56;
    const cx = (from.x + to.x) / 2 + 960, cy = (from.y + to.y) / 2 + 540;
    tl.call(() => { this._sfx(ctx, 'whoosh'); if (!this._quiet) ctx.bg.warp(1, 1.3, 0.35); }, null, 0);
    tl.to(cam, { x: 960 - cx * s, y: 540 - cy * s, scale: s, duration: 0.65, ease: 'power2.inOut' }, 0);
    tl.to(cam, { x: -to.x, y: -to.y, scale: 1, duration: 0.85, ease: 'power3.inOut' }, 0.6);
  },

  /** 設定 8 個位元的數值並更新讀數 */
  _setVal(root, ctx, v, { pop }) {
    this._val = v;
    const bin = toBin(v);
    root.querySelectorAll('.dt-bulb').forEach((b, i) => {
      const on = bin[i] === '1';
      b.classList.toggle('on', on);
      b.querySelector('.bit').textContent = bin[i];
    });
    root.querySelector('.b-bin .v').textContent = bin;
    root.querySelector('.b-dec .v').textContent = String(v);
    const parts = PLACE.filter((p, i) => bin[i] === '1');
    root.querySelector('.b-dec .calc').innerHTML = parts.length > 1 && parts.length <= 4 ? parts.join(' + ') : '&nbsp;';
    const chV = root.querySelector('.b-chr .v');
    const c = chrOf(v);
    chV.textContent = c ?? (v > 127 ? '超出 ASCII' : '控制字元');
    chV.classList.toggle('small', !c || c.length > 1);
    if (pop != null) {
      const b = root.querySelectorAll('.dt-bulb')[pop];
      gsap.fromTo(b.querySelector('.glass'), { scale: 0.88 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' });
      gsap.fromTo(chV, { scale: 0.7 }, { scale: 1, duration: 0.45, ease: 'back.out(2.5)' });
    }
  },

  _stepBits(root, ctx, tl) {
    const target = 73, bin = toBin(target);
    const order = [1, 4, 7]; // 64、8、1
    order.forEach((i, k) => {
      tl.call(() => {
        const cur = this._val | PLACE[i];
        this._setVal(root, ctx, cur, { pop: i });
        this._sfx(ctx, 'pop');
      }, null, 0.2 + k * 0.45);
    });
    tl.call(() => this._setVal(root, ctx, target, {}), null, 0.2 + order.length * 0.45);
    const chV = root.querySelector('.b-chr .v');
    const chBox = root.querySelector('.b-chr');
    tl.fromTo(chBox, { boxShadow: '0 0 0 rgba(34,211,238,0)' }, { boxShadow: '0 0 90px rgba(34,211,238,.75)', duration: 0.5, yoyo: true, repeat: 1 }, 1.6);
    tl.fromTo(chV, { scale: 1.6 }, { scale: 1, duration: 0.7, ease: 'back.out(2)' }, 1.6);
    tl.call(() => this._sfx(ctx, 'reveal'), null, 1.6);
    // ICT 三個字母
    const word = root.querySelector('.dt-word');
    tl.fromTo(word, { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 0.7, ease: 'expo.out' }, 2.1);
    word.querySelectorAll('.byte').forEach((row, r) => {
      const t0 = 2.3 + r * 0.4;
      tl.from(row.querySelectorAll('.cells i'), { opacity: 0, y: -16, duration: 0.3, stagger: 0.03, ease: 'power2.out' }, t0);
      tl.from(row.querySelectorAll('b, .dec'), { opacity: 0, scale: 0.5, duration: 0.4, ease: 'back.out(2)' }, t0);
      tl.call(() => this._sfx(ctx, 'blip'), null, t0);
    });
    tl.fromTo(root.querySelector('.dt-note'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, 3.6);
    void bin;
  },

  _drawPic(cv, rows) {
    const g = cv.getContext('2d');
    const img = g.createImageData(PW, PH);
    for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
      const k = (y * PW + x) * 4, c = this._pic[y][x];
      img.data[k] = c[0]; img.data[k + 1] = c[1]; img.data[k + 2] = c[2]; img.data[k + 3] = y < rows ? 255 : 0;
    }
    g.putImageData(img, 0, 0);
  },

  _stepPix(root, ctx, tl, at) {
    const view = root.querySelector('.dt-view');
    const cv = root.querySelector('.dt-pic');
    const grid = root.querySelector('.dt-grid');
    const labels = root.querySelector('.dt-labels');
    const zbox = root.querySelector('.dt-zbox');
    const zb = root.querySelector('.dt-view-cap .zb'), zt = root.querySelector('.dt-view-cap .zt');
    const head = root.querySelector('.dt-s-pix .dt-head');
    const VW = 880, VH = 550, cell = PS * ZOOM;
    // 放大後的位置：令 FOCUS 像素的中心位於畫面中心附近
    const cx = (FOCUS.x + 0.5) * PS, cy = (FOCUS.y + 0.5) * PS;
    const tx = VW / 2 - cx * ZOOM, ty = VH / 2 - cy * ZOOM;
    // 標籤（放大後每一格的 RGB）
    let html = '';
    for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
      const lx = tx + (x + 0.5) * cell, ly = ty + (y + 0.5) * cell;
      if (lx < 60 || lx > VW - 60 || ly < 50 || ly > VH - 50) continue;
      const c = this._pic[y][x];
      const pick = x === PICK.x && y === PICK.y;
      html += `<div class="dt-lab${pick ? ' pick' : ''}" style="left:${lx}px;top:${ly - 48}px"><div class="r">R ${c[0]}</div><div class="g">G ${c[1]}</div><div class="b">B ${c[2]}</div></div>`;
    }
    labels.innerHTML = html;
    const offX = ((tx % cell) + cell) % cell, offY = ((ty % cell) + cell) % cell;
    grid.style.backgroundImage = 'linear-gradient(rgba(0,0,0,.55) 3px, transparent 3px), linear-gradient(90deg, rgba(0,0,0,.55) 3px, transparent 3px)';
    grid.style.backgroundSize = `${cell}px ${cell}px`;
    grid.style.backgroundPosition = `${offX - 1.5}px ${offY - 1.5}px`;
    // 放大框（未放大前顯示將放大的範圍）
    const zw = VW / ZOOM, zh = VH / ZOOM;
    gsap.set(zbox, { left: cx - zw / 2, top: cy - zh / 2, width: zw, height: zh });
    // 混色
    const pc = this._pic[PICK.y][PICK.x];
    const mix = root.querySelector('.dt-mix');
    const mixB = mix.querySelectorAll('.mx b');
    const sw = mix.querySelector('.sw');

    tl.from(head.children, { opacity: 0, y: 30, duration: 0.7, stagger: 0.1, ease: 'expo.out' }, at - 0.4);
    tl.to(root.querySelectorAll('.dt-pts li'), { opacity: 1, duration: 0.01 }, at - 0.4);
    tl.from(root.querySelectorAll('.dt-pts li'), { opacity: 0, x: -40, duration: 0.6, stagger: 0.22, ease: 'expo.out' }, at);
    tl.set(view, { opacity: 1 }, at);
    tl.set(root.querySelector('.dt-view-cap'), { opacity: 1 }, at);
    gsap.set(cv, { x: 0, y: 0, scale: 1 });
    // 逐行「載入」相片
    const o = { r: 0 };
    tl.call(() => this._drawPic(cv, 0), null, at);
    tl.to(o, { r: PH, duration: 1.1, ease: 'none', onUpdate: () => this._drawPic(cv, Math.ceil(o.r)) }, at);
    tl.call(() => this._sfx(ctx, 'rise'), null, at);
    tl.fromTo(zbox, { opacity: 0, scale: 2.5 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'expo.out' }, at + 1.3);
    tl.call(() => this._sfx(ctx, 'blip'), null, at + 1.3);
    // 鏡頭放大
    tl.to(zbox, { opacity: 0, duration: 0.3 }, at + 2.1);
    tl.to(cv, { x: tx, y: ty, scale: ZOOM, duration: 1.4, ease: 'power3.inOut' }, at + 2.1);
    tl.call(() => this._sfx(ctx, 'whoosh'), null, at + 2.1);
    const z = { v: 1 };
    tl.to(z, { v: ZOOM, duration: 1.4, ease: 'power3.inOut', onUpdate: () => { zb.textContent = '×' + z.v.toFixed(1).replace(/\.0$/, ''); } }, at + 2.1);
    tl.call(() => { zt.textContent = '放大 7 倍：每一格就是一個像素'; }, null, at + 2.9);
    tl.to(grid, { opacity: 1, duration: 0.4 }, at + 3.4);
    tl.from(labels.children, { opacity: 0, scale: 0.6, duration: 0.35, stagger: { each: 0.03, from: 'center' }, ease: 'back.out(2)' }, at + 3.5);
    tl.call(() => this._sfx(ctx, 'reveal'), null, at + 3.5);
    // 混色示範
    tl.to(mix, { opacity: 1, duration: 0.4 }, at + 4.1);
    tl.from(mix.querySelectorAll('.mx > *'), { opacity: 0, y: 20, duration: 0.4, stagger: 0.08, ease: 'back.out(2)' }, at + 4.1);
    pc.forEach((v, i) => tl.add(ctx.fx.countUp(mixB[i], v, { duration: 0.8, comma: false }), at + 4.3));
    tl.fromTo(sw, { background: '#000' }, { background: `rgb(${pc[0]}, ${pc[1]}, ${pc[2]})`, duration: 0.9 }, at + 4.3);
  },

  _sheetValues(root) {
    return [...root.querySelectorAll('.dt-in')].map(i => Math.max(0, Math.min(999, parseInt(i.value, 10) || 0)));
  },

  /** 依試算表數值更新圖表、總數及記憶體位元 */
  _sheetUpdate(root, ctx, instant) {
    const vals = this._sheetValues(root);
    const max = Math.max(1, ...vals);
    const H = 560 - 66 - 60; // 可用高度（扣除數值標籤）
    const sum = vals.reduce((a, b) => a + b, 0);
    let top = vals.indexOf(max);
    root.querySelectorAll('.dt-chart .bar').forEach((b, i) => {
      const h = vals[i] / max * H * 0.92;
      b.classList.toggle('top', i === top);
      b.querySelector('.val').textContent = vals[i];
      if (instant) gsap.set(b.querySelector('.fill'), { height: h }); else gsap.to(b.querySelector('.fill'), { height: h, duration: 0.6, ease: 'expo.out' });
    });
    root.querySelector('.dt-sheet .sum').textContent = sum;
    root.querySelector('.dt-chart .ct').textContent = SURVEY[top][0];
    root.querySelector('.dt-mem .mv').textContent = sum;
    const bits = toBin(Math.min(255, sum));
    root.querySelectorAll('.dt-mem .cells i').forEach((c, i) => { c.textContent = bits[i]; c.classList.toggle('c1', bits[i] === '1'); c.classList.toggle('c0', bits[i] === '0'); });
  },

  _stepSheet(root, ctx, tl, at) {
    const head = root.querySelector('.dt-s-sheet .dt-head');
    const sheet = root.querySelector('.dt-sheet');
    const chart = root.querySelector('.dt-chart');
    const vals = this._sheetValues(root);
    const max = Math.max(1, ...vals), H = 560 - 66 - 60;
    tl.from(head.children, { opacity: 0, y: 30, duration: 0.7, stagger: 0.1, ease: 'expo.out' }, at - 0.4);
    tl.fromTo(sheet, { opacity: 0, x: -60 }, { opacity: 1, x: 0, duration: 0.7, ease: 'expo.out' }, at);
    tl.from(sheet.querySelectorAll('.r'), { opacity: 0, x: -20, duration: 0.3, stagger: 0.05 }, at + 0.2);
    tl.from(chart.querySelector('.axis'), { scaleX: 0, transformOrigin: '0 50%', duration: 0.6, ease: 'expo.out' }, at + 0.4);
    tl.from(chart.querySelectorAll('.lab'), { opacity: 0, y: 10, duration: 0.3, stagger: 0.06 }, at + 0.6);
    // 數字由試算表「飛」到圖表，然後長成棒
    const inputs = root.querySelectorAll('.dt-in');
    const bars = chart.querySelectorAll('.bar');
    const scene = root.querySelector('.dt-s-sheet');
    bars.forEach((b, i) => {
      const t0 = at + 1.0 + i * 0.3;
      const h = vals[i] / max * H * 0.92;
      b.classList.toggle('top', vals[i] === max && vals.indexOf(max) === i);
      b.querySelector('.val').textContent = vals[i];
      const fill = b.querySelector('.fill');
      // 飛行的數字（只在播放時建立）
      if (!this._quiet) {
        tl.call(() => {
          const sr = scene.getBoundingClientRect(), k = sr.width / 1920;
          const a = inputs[i].getBoundingClientRect(), z = b.getBoundingClientRect();
          const fly = document.createElement('div');
          fly.className = 'mono';
          fly.textContent = vals[i];
          fly.style.cssText = 'position:absolute;z-index:5;font-size:36px;font-weight:800;color:#67e8f9;text-shadow:0 0 18px #22d3ee;pointer-events:none';
          scene.appendChild(fly);
          const x0 = (a.right - sr.left) / k - 50, y0 = (a.top - sr.top) / k;
          const x1 = (z.left + z.width / 2 - sr.left) / k - 12, y1 = (z.bottom - sr.top) / k - h - 60;
          ctx.track(gsap.fromTo(fly, { x: x0, y: y0 }, {
            motionPath: { path: [{ x: x0, y: y0 }, { x: (x0 + x1) / 2, y: Math.min(y0, y1) - 120 }, { x: x1, y: y1 }], curviness: 1.2 },
            duration: 0.6, ease: 'power2.inOut', onComplete: () => fly.remove(),
          }));
          ctx.sfx.play('tick');
        }, null, t0);
      }
      tl.fromTo(fill, { height: 0 }, { height: h, duration: 0.7, ease: 'expo.out' }, t0 + 0.55);
      tl.from(b.querySelector('.val'), { opacity: 0, y: 20, duration: 0.3 }, t0 + 0.6);
    });
    // 總數
    const sum = vals.reduce((a, b) => a + b, 0);
    const sumEl = sheet.querySelector('.sum');
    const tSum = at + 1.0 + bars.length * 0.3 + 0.6;
    tl.fromTo(sheet.querySelector('.tot .cb'), { boxShadow: 'inset 0 0 0 3px rgba(52,211,153,0)' }, { boxShadow: 'inset 0 0 0 3px rgba(52,211,153,1)', duration: 0.4 }, tSum);
    tl.add(ctx.fx.countUp(sumEl, sum, { duration: 0.8 }), tSum);
    tl.fromTo(sheet.querySelector('.fx .f'), { color: '#e5e7ff' }, { color: '#34d399', duration: 0.3, yoyo: true, repeat: 1 }, tSum);
    tl.call(() => this._sfx(ctx, 'success'), null, tSum + 0.4);
    tl.fromTo(chart.querySelector('.callout'), { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'back.out(2)' }, tSum + 0.5);
    // 記憶體位元（下一站的入口）
    const mem = root.querySelector('.dt-mem');
    tl.fromTo(mem, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out' }, tSum + 1.1);
    tl.from(mem.querySelectorAll('.cells i'), { opacity: 0, rotationX: 90, duration: 0.35, stagger: 0.06 }, tSum + 1.3);
    tl.call(() => { this._sheetUpdate(root, ctx, true); this._sfx(ctx, 'reveal'); }, null, tSum + 1.3);
    const dive = mem.querySelector('.data-dive');
    tl.call(() => {
      ctx.track(gsap.fromTo(dive, { boxShadow: '0 0 0 3px #fff, 0 0 18px #22d3ee, 0 0 30px rgba(34,211,238,.5)' }, { boxShadow: '0 0 0 3px #fff, 0 0 40px #22d3ee, 0 0 90px rgba(34,211,238,.9)', duration: 0.9, repeat: -1, yoyo: true, ease: 'sine.inOut' }));
    }, null, tSum + 2.0);
  },
};
