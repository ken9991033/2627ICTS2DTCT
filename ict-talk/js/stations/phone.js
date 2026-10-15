// 02 介面層：你每天都在用 ICT
// 視覺主角：一部以 CSS／SVG 繪製的手機。每一步打開兩個 App，App 內播放迷你示範，
// 然後飛出一張「背後的科技」卡（標示相關單元）。最後一步：手機在 3D 中「拆層」，
// 露出介面之下的程式、數據及硬件，點出「由用家變成創造者」。
// 步驟：1 電子支付＋地圖　2 相片＋AI 助理　3 網購＋密碼　4 用家 → 創造者
const gsap = window.gsap;

// ---------- 圖示（Lucide，ISC 授權） ----------
const ICON = {
  'credit-card': '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/><path d="M6 14h2"/>',
  'map-pinned': '<path d="M18 8c0 3.613-3.869 7.429-5.393 8.795a1 1 0 01-1.214 0C9.87 15.429 6 11.613 6 8a6 6 0 0112 0"/><path d="M4.474 15h-.197a1 1 0 00-.969.753l-1.097 4.35a1.5 1.5 0 001.444 1.898L20.344 22a1.5 1.5 0 001.446-1.897l-1.098-4.35a1 1 0 00-.969-.753h-.197"/><circle cx="12" cy="8" r="2"/>',
  image: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  bot: '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
  'shopping-cart': '<path d="m2.05 2.05 1.099-.028a1 1 0 0 1 1.008.815l2.69 14.347A1 1 0 0 0 7.83 18H18"/><path d="M4.563 5h16.435a1 1 0 0 1 .981 1.204l-1.026 6.226A2 2 0 0 1 18.962 14H6.25"/><circle cx="18" cy="20" r="2"/><circle cx="8" cy="20" r="2"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  phone: '<path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/>',
  'message-circle': '<path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/>',
  camera: '<path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z"/><circle cx="12" cy="13" r="3"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  wifi: '<path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  'key-round': '<path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/>',
  headphones: '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
  watch: '<path d="M12 10v2.2l1.6 1"/><path d="m16.13 7.66-.81-4.05a2 2 0 0 0-2-1.61h-2.68a2 2 0 0 0-2 1.61l-.78 4.05"/><path d="m7.88 16.36.8 4a2 2 0 0 0 2 1.61h2.72a2 2 0 0 0 2-1.61l.81-4.05"/><circle cx="12" cy="12" r="6"/>',
  backpack: '<path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M8 10h8"/><path d="M8 18h8"/><path d="M8 22v-6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>',
  'book-open': '<path d="M12 5v16"/><path d="M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z"/>',
};
const ic = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON[name]}</svg>`;

// 單元標籤（顏色與全站一致）
const MOD = {
  A: ['資訊處理', 'var(--mod-a)'], B: ['電腦系統', 'var(--mod-b)'], C: ['互聯網', 'var(--mod-c)'],
  D: ['程式編寫', 'var(--mod-d)'], E: ['社會影響', 'var(--mod-e)'],
  '2A': ['數據庫', 'var(--el-a)'], '2B': ['網頁應用', 'var(--el-b)'], '2C': ['演算法', 'var(--el-c)'],
};

// ---------- 幾何（舞台座標） ----------
const P = { x: 765, y: 150, w: 390, h: 860, inset: 14 };        // 手機外框
const S = { x: P.x + P.inset, y: P.y + P.inset, w: P.w - 2 * P.inset, h: P.h - 2 * P.inset }; // 螢幕
const COLS = [62, 181, 300], ROWS = [292, 452];                  // App 圖示中心（螢幕座標）
const CARD = { w: 480, h: 216, L: 200, R: 1240, tops: [250, 490, 730] };

const APPS = [
  { k: 'pay', name: '電子支付', label: '電子支付', icon: 'credit-card', c1: '#22d3ee', c2: '#0e7490', col: 0, row: 0, side: 'L', slot: 0, step: 1, tech: '數據庫記錄每一筆交易', mods: ['2A', 'C'] },
  { k: 'map', name: '地圖導航', label: '地圖', icon: 'map-pinned', c1: '#34d399', c2: '#0f766e', col: 2, row: 0, side: 'R', slot: 0, step: 1, tech: '演算法計算最短路線', mods: ['D', '2C'] },
  { k: 'photo', name: '相片分享', label: '相片', icon: 'image', c1: '#f472b6', c2: '#9333ea', col: 1, row: 0, side: 'L', slot: 1, step: 2, tech: '數碼化、壓縮，經互聯網傳送', mods: ['A', 'C'] },
  { k: 'ai', name: 'AI 聊天助理', label: 'AI 助理', icon: 'bot', c1: '#a78bfa', c2: '#5b21b6', col: 2, row: 1, side: 'R', slot: 1, step: 2, tech: '人工智能與私隱', mods: ['E', 'D'] },
  { k: 'shop', name: '網上購物', label: '購物', icon: 'shopping-cart', c1: '#fb923c', c2: '#be123c', col: 0, row: 1, side: 'L', slot: 2, step: 3, tech: '網頁應用與數據庫', mods: ['2B', '2A'] },
  { k: 'lock', name: '登入密碼', label: '密碼', icon: 'lock', c1: '#60a5fa', c2: '#1d4ed8', col: 1, row: 1, side: 'R', slot: 2, step: 3, tech: '資訊保安保護你的帳戶', mods: ['C', 'E'] },
];
APPS.forEach(a => {
  a.ix = S.x + COLS[a.col]; a.iy = S.y + ROWS[a.row];
  a.cx = a.side === 'L' ? CARD.L : CARD.R; a.cy = CARD.tops[a.slot];
  a.ax = a.side === 'L' ? CARD.L + CARD.w : CARD.R; a.ay = a.cy + CARD.h / 2;
  const s = a.side === 'L' ? -1 : 1;
  a.wire = `M${a.ix},${a.iy} C${a.ix + s * 230},${a.iy} ${a.ax - s * 170},${a.ay} ${a.ax},${a.ay}`;
});

// 3D 拆層：各層的名稱
const LAYERS = [
  { k: 'ui', name: '介面層', sub: 'App 畫面', c: '#22d3ee' },
  { k: 'code', name: '程式層', sub: '程式碼', c: '#a78bfa' },
  { k: 'data', name: '數據層', sub: '0 與 1', c: '#67e8f9' },
  { k: 'chip', name: '硬件層', sub: '晶片', c: '#fbbf24' },
];
const LZ = [300, 100, -100, -300];
const SHIFT = { x: -400, y: 10, s: 0.58, rx: 58, rz: -38 };      // 拆層時手機的位置及角度

// ---------- 像素相片（15 × 15，程式「畫」出來的日落） ----------
function pixelColor(x, y) {
  const mix = (a, b, t) => '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('');
  const mtn = [9, 8, 7, 7, 8, 9, 9, 10, 10, 9, 8, 8, 9, 10, 10][x];
  const d = Math.hypot(x - 10, y - 6.2);
  if (y >= 11) {
    if (Math.abs(x - 10) <= (y % 2 ? 1 : 2) && y < 14) return y % 2 ? '#ffb347' : '#ff8a5c';
    return mix([28, 64, 120], [10, 26, 60], (y - 11) / 3);
  }
  if (y >= mtn) return y === mtn ? '#3b2463' : '#24163f';
  if (d < 2.2) return '#ffe08a';
  if (d < 3.1) return '#ffc15e';
  return mix([42, 27, 94], [255, 122, 89], Math.min(1, y / 9));
}

function binaryRows(n, len) {
  let seed = 7;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  return Array.from({ length: n }, () => Array.from({ length: len }, () => (rnd() < 0.5 ? '0' : '1')).join(''));
}

export default {
  id: 'phone',
  title: '介面層：你每天都在用 ICT',
  short: '介面層',
  accent: '#22d3ee',
  layer: 'surface',
  tint: ['#22d3ee', '#a78bfa'],
  transition: { type: 'zoomIn', focus: '.boot-portal' },
  steps: 4,
  minutes: 1.25,
  notes: `【介面層：你每天都在用 ICT】（約 75 秒）
開場：鏡頭穿過開場的光環，落在一部手機上。先問同學：「你今天用了手機多久？」（手機小工具顯示「螢幕使用時間」。）再問：「一部手機，藏着多少科技？」兩旁的問號代表答案。
按 →（第 1 步）：打開「電子支付」及「地圖」。說：每次用電子支付，數據庫就記錄一筆交易（2A 數據庫、C 互聯網）；地圖用演算法比較不同路線，找出最短的一條（D 程式編寫、2C 演算法）。
按 →（第 2 步）：「相片」及「AI 助理」。說：相片其實是大量像素，每個像素都是數字；上載前要壓縮，再經互聯網傳送（A、C）。AI 助理很方便，但我們輸入的資料會否被收集？這就是人工智能與私隱的問題（E、D）。
按 →（第 3 步）：「購物」及「密碼」。說：網上商店是網頁應用，背後有數據庫記錄貨品及訂單（2B、2A）；登入密碼牽涉資訊保安（C、E）。卡片上的英文字母就是高中 ICT 的單元，稍後會逐一介紹。
按 →（第 4 步）：手機拆開成幾層：介面、程式、數據、硬件。強調金句：「你每天都是科技的『用家』。讀 ICT，你會成為科技的『創造者』。」稍後我們會一層一層潛入去看清楚。`,

  build(root, ctx) {
    this._ctx = ctx; this._tls = []; this._quiet = false; this._loops = new Set();
    const pix = Array.from({ length: 225 }, (_, i) => `<i style="background:${pixelColor(i % 15, Math.floor(i / 15))}"></i>`).join('');
    const bin = binaryRows(30, 13).map(r => `<div>${r}</div>`).join('');
    const codeBars = [[0, 60, 'kw'], [1, 150, 'fn'], [1, 110, 'str'], [2, 170, 'num'], [2, 90, 'op'], [1, 130, 'fn'], [0, 70, 'kw'], [1, 180, 'str'], [2, 120, 'num'], [2, 150, 'fn'], [1, 60, 'kw'], [0, 140, 'fn'], [1, 100, 'op'], [1, 170, 'str'], [2, 80, 'num'], [0, 120, 'kw'], [1, 160, 'fn'], [1, 90, 'str']]
      .map(([ind, w, c]) => `<i class="cb-${c}" style="margin-left:${40 + ind * 36}px;width:${w}px"></i>`).join('');

    root.innerHTML = `
      <div class="ph-cam">
        <div class="ph-halo"><i class="ph-halo-a"></i><i class="ph-halo-b"></i></div>
        <div class="ph-rings"><i></i><i></i><i></i></div>
        ${APPS.map(a => `<div class="ph-ghost" data-k="${a.k}" style="left:${a.cx}px;top:${a.cy}px"><span>?</span><em>背後的科技</em></div>`).join('')}
        <svg class="ph-wires" viewBox="0 0 1920 1080">
          ${APPS.map(a => `<g class="ph-wire" data-k="${a.k}" style="--c:${a.c1}"><path class="w-glow" d="${a.wire}"/><path class="w-line" d="${a.wire}"/><circle class="w-end" cx="${a.ax}" cy="${a.ay}" r="7"/><circle class="w-start" cx="${a.ix}" cy="${a.iy}" r="6"/><g class="w-pulse"><circle r="14"/><circle r="6"/></g></g>`).join('')}
        </svg>
        <div class="ph-stage3d">
          <div class="ph-probe" aria-hidden="true"><div class="pp-tilt"><div class="pp-dev">${LZ.map(z => `<i style="transform:translateZ(${z}px)"><b></b></i>`).join('')}</div></div></div>
          <div class="ph-move">
            <div class="ph-tilt">
              <div class="ph-device">
                <div class="ph-layer ph-l-chip">
                  <svg viewBox="0 0 390 860" class="ph-pcb">
                    <g class="pcb-traces">
                      ${[120, 200, 280, 360, 500, 580, 660, 740].map((y, i) => `<path d="M40 ${y} H${i % 2 ? 120 : 150} L${i % 2 ? 140 : 130} ${430 + (i - 3.5) * 14} H125"/><path d="M350 ${y} H${i % 2 ? 270 : 240} L${i % 2 ? 250 : 260} ${430 + (i - 3.5) * 14} H265"/>`).join('')}
                      <path d="M195 80 V340"/><path d="M195 520 V780"/>
                    </g>
                    <g class="pcb-nodes">${[120, 200, 280, 360, 500, 580, 660, 740].map(y => `<circle cx="40" cy="${y}" r="7"/><circle cx="350" cy="${y}" r="7"/>`).join('')}<circle cx="195" cy="80" r="8"/><circle cx="195" cy="780" r="8"/></g>
                    <rect class="pcb-chip" x="125" y="360" width="140" height="140" rx="14"/>
                    <rect class="pcb-core" x="155" y="390" width="80" height="80" rx="8"/>
                    <rect class="pcb-ram" x="60" y="560" width="70" height="130" rx="8"/><rect class="pcb-ram" x="260" y="560" width="70" height="130" rx="8"/>
                  </svg>
                </div>
                <div class="ph-layer ph-l-data"><div class="ph-bin mono">${bin}</div></div>
                <div class="ph-layer ph-l-code"><div class="ph-codebars">${codeBars}</div></div>
                <div class="ph-frame">
                  <i class="ph-btn b1"></i><i class="ph-btn b2"></i><i class="ph-btn b3"></i>
                  <div class="ph-screen">
                    <div class="ph-wall"><i class="ph-blob b1"></i><i class="ph-blob b2"></i><i class="ph-blob b3"></i></div>
                    <div class="ph-home">
                      <div class="ph-clock"><div class="ph-clock-t">08:30</div><div class="ph-clock-d">今天　晴　26°C</div></div>
                      ${APPS.map(a => `<div class="ph-icon" data-k="${a.k}" style="left:${COLS[a.col] - 46}px;top:${ROWS[a.row] - 46}px;--c1:${a.c1};--c2:${a.c2}"><b>${ic(a.icon)}</b><span>${a.label}</span></div>`).join('')}
                      <div class="ph-widget">
                        <div><div class="ph-w-k">螢幕使用時間</div><div class="ph-w-v">3 小時 12 分</div></div>
                        <div class="ph-w-bars">${[45, 70, 38, 88, 60, 100, 74].map(h => `<i style="height:${h}%"></i>`).join('')}</div>
                      </div>
                      <div class="ph-dock">
                        <b style="--c1:#4ade80;--c2:#15803d">${ic('phone')}</b><b style="--c1:#38bdf8;--c2:#0369a1">${ic('message-circle')}</b><b style="--c1:#94a3b8;--c2:#334155">${ic('camera')}</b><b style="--c1:#818cf8;--c2:#3730a3">${ic('globe')}</b>
                      </div>
                    </div>
                    ${this._apps()}
                    <div class="ph-status">
                      <span>08:30</span>
                      <span class="ph-sys"><span class="ph-sig"><i></i><i></i><i></i><i></i></span>${ic('wifi', 'ph-wifi')}<span class="ph-bat"><i></i></span></span>
                    </div>
                    <div class="ph-island"><i></i></div>
                    <div class="ph-tap"></div>
                    <div class="ph-glare"></div>
                    <div class="ph-sweep"></div>
                    <div class="ph-off"></div>
                    <div class="ph-homebar"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        ${APPS.map(a => `
          <div class="ph-card panel" data-k="${a.k}" style="left:${a.cx}px;top:${a.cy}px;--c:${a.c1};--c2:${a.c2}">
            <div class="ph-card-top"><b class="ph-card-ic">${ic(a.icon)}</b><span class="ph-card-name">${a.name}</span><span class="ph-card-k">背後的科技</span></div>
            <div class="ph-card-tech">${a.tech}</div>
            <div class="ph-card-mods">${a.mods.map(m => `<span class="ph-mod" style="--m:${MOD[m][1]}"><b>${m}</b>${MOD[m][0]}</span>`).join('')}</div>
          </div>`).join('')}
      </div>
      <div class="station-head">
        <div class="kicker">LAYER 01 · 介面層</div>
        <h1 class="h1">你每天都在用 <span class="grad">ICT</span></h1>
      </div>
      <div class="ph-question">一部手機，藏着多少科技？</div>
      <div class="ph-labels">
        ${LAYERS.map(l => `<div class="ph-lab" data-k="${l.k}" style="--c:${l.c}"><i></i><b>${l.name}</b><span>${l.sub}</span></div>`).join('')}
      </div>
      <div class="ph-final">
        <div class="ph-f-k">由用家到創造者</div>
        <p class="ph-f1">你每天都是科技的<span class="ph-user">「用家」</span>。</p>
        <p class="ph-f2">讀 <b class="grad">ICT</b>，你會成為科技的</p>
        <p class="ph-f3"><span class="grad glow">「創造者」</span></p>
        <p class="ph-f4">介面之下，還有程式、數據和硬件。</p>
      </div>
    `;

    const css = document.createElement('style');
    css.textContent = `
      .st-phone { --ph-x:${P.x}px; }
      .st-phone .ic { width:1em; height:1em; display:inline-block; vertical-align:middle; }
      .st-phone .station-head .kicker { font-size:24px; }
      .st-phone .ph-cam { position:absolute; inset:0; transform-origin:960px 580px; }
      .st-phone .ph-question { position:absolute; left:${CARD.R}px; top:118px; width:600px; font-size:38px; font-weight:800; color:var(--ink); }
      .st-phone .ph-question::before { content:""; display:inline-block; width:14px; height:14px; border-radius:50%; background:var(--accent); box-shadow:0 0 16px var(--accent); margin-right:16px; vertical-align:middle; }

      /* 背景光暈 */
      .st-phone .ph-halo { position:absolute; left:${P.x + P.w / 2 - 520}px; top:${P.y + P.h / 2 - 520}px; width:1040px; height:1040px; pointer-events:none; }
      .st-phone .ph-halo i { position:absolute; inset:0; border-radius:50%; }
      .st-phone .ph-halo-a { will-change:transform; background:radial-gradient(circle at 30% 28%, rgba(34,211,238,.32), transparent 34%), radial-gradient(circle at 74% 70%, rgba(255,61,127,.24), transparent 36%), radial-gradient(circle at 72% 26%, rgba(167,139,250,.22), transparent 32%); }
      .st-phone .ph-halo-b { inset:160px !important; background:radial-gradient(circle, rgba(34,211,238,.26), transparent 68%); }
      .st-phone .ph-rings i { will-change:transform,opacity; position:absolute; left:${P.x + P.w / 2 - 300}px; top:${P.y + P.h / 2 - 300}px; width:600px; height:600px; border-radius:50%; border:2px solid rgba(34,211,238,.35); opacity:0; }

      /* 問號格 */
      .st-phone .ph-ghost { position:absolute; width:${CARD.w}px; height:${CARD.h}px; border-radius:var(--r-lg); border:2px dashed rgba(160,180,255,.22); display:flex; align-items:center; justify-content:center; gap:22px; color:var(--ink-3); }
      .st-phone .ph-ghost span { font:900 72px/1 var(--mono); color:rgba(160,180,255,.32); }
      .st-phone .ph-ghost em { font-style:normal; font-size:28px; letter-spacing:.12em; }

      /* 3D 舞台 */
      .st-phone .ph-stage3d { position:absolute; inset:0; perspective:2200px; perspective-origin:${P.x + P.w / 2}px ${P.y + P.h / 2}px; }
      .st-phone .ph-move, .st-phone .ph-tilt, .st-phone .ph-device { position:absolute; transform-style:preserve-3d; }
      .st-phone .ph-move { left:${P.x}px; top:${P.y}px; width:${P.w}px; height:${P.h}px; }
      .st-phone .ph-tilt, .st-phone .ph-device { inset:0; }
      .st-phone .ph-probe { position:absolute; left:${P.x}px; top:${P.y}px; width:${P.w}px; height:${P.h}px; visibility:hidden; pointer-events:none; transform-style:preserve-3d; transform:translate3d(${SHIFT.x}px, ${SHIFT.y}px, 0) scale(${SHIFT.s}); }
      .st-phone .pp-tilt, .st-phone .pp-dev, .st-phone .ph-probe i { position:absolute; inset:0; transform-style:preserve-3d; }
      .st-phone .pp-tilt { transform:rotateX(${SHIFT.rx}deg); } .st-phone .pp-dev { transform:rotate(${SHIFT.rz}deg); }
      .st-phone .ph-probe b { position:absolute; right:0; bottom:0; width:2px; height:2px; }
      .st-phone .ph-layer { position:absolute; inset:0; border-radius:66px; opacity:0; overflow:hidden; }
      .st-phone .ph-l-chip { background:linear-gradient(160deg, #1a1405, #0b0a04); border:3px solid rgba(251,191,36,.85); box-shadow:0 0 60px rgba(251,191,36,.35), inset 0 0 40px rgba(251,191,36,.15); }
      .st-phone .ph-pcb { width:100%; height:100%; }
      .st-phone .pcb-traces path { fill:none; stroke:rgba(251,191,36,.75); stroke-width:4; stroke-linejoin:round; }
      .st-phone .pcb-nodes circle { fill:#0b0a04; stroke:#fbbf24; stroke-width:3; }
      .st-phone .pcb-chip { fill:#2a2108; stroke:#fbbf24; stroke-width:4; }
      .st-phone .pcb-core { fill:#fbbf24; opacity:.85; }
      .st-phone .pcb-ram { fill:#1f1906; stroke:rgba(251,191,36,.7); stroke-width:3; }
      .st-phone .ph-l-data { background:rgba(8,40,52,.82); border:3px solid rgba(103,232,249,.85); box-shadow:0 0 60px rgba(34,211,238,.35); }
      .st-phone .ph-bin { position:absolute; inset:34px 30px; font-size:24px; line-height:26px; letter-spacing:.2em; color:rgba(103,232,249,.85); text-shadow:0 0 10px rgba(34,211,238,.8); overflow:hidden; }
      .st-phone .ph-l-code { background:rgba(26,16,58,.85); border:3px solid rgba(167,139,250,.9); box-shadow:0 0 60px rgba(167,139,250,.4); }
      .st-phone .ph-codebars { position:absolute; inset:60px 0; display:flex; flex-direction:column; gap:22px; }
      .st-phone .ph-codebars i { display:block; height:16px; border-radius:8px; }
      .st-phone .cb-kw { background:#ff7ab2; } .st-phone .cb-fn { background:#67e8f9; } .st-phone .cb-str { background:#fcd34d; } .st-phone .cb-num { background:#c4b5fd; } .st-phone .cb-op { background:#93c5fd; }

      /* 手機外框 */
      .st-phone .ph-frame { position:absolute; inset:0; border-radius:66px;
        background:linear-gradient(145deg, #4a5378 0%, #161a33 22%, #0a0c1a 55%, #1d2340 80%, #545e86 100%);
        box-shadow:inset 0 0 0 2px rgba(255,255,255,.14), inset 0 0 0 6px #05060e, 0 0 0 1px rgba(0,0,0,.8), 0 50px 120px rgba(0,0,0,.65), 0 0 90px rgba(34,211,238,.28); }
      .st-phone .ph-btn { position:absolute; width:6px; border-radius:3px; background:linear-gradient(90deg,#2b3150,#5a648e); }
      .st-phone .ph-btn.b1 { left:-5px; top:190px; height:70px; } .st-phone .ph-btn.b2 { left:-5px; top:280px; height:70px; } .st-phone .ph-btn.b3 { right:-5px; top:240px; height:110px; }
      .st-phone .ph-screen { position:absolute; inset:${P.inset}px; border-radius:54px; overflow:hidden; background:#05060f; }
      .st-phone .ph-wall { position:absolute; inset:0; overflow:hidden;
        background:radial-gradient(120% 55% at 15% 8%, rgba(34,211,238,.55), transparent 60%), radial-gradient(90% 55% at 95% 42%, rgba(167,139,250,.55), transparent 60%), radial-gradient(110% 60% at 30% 100%, rgba(255,61,127,.42), transparent 62%), linear-gradient(180deg, #0c1236, #070918); }
      .st-phone .ph-blob { position:absolute; width:380px; height:380px; border-radius:50%; opacity:.6; will-change:transform; background:radial-gradient(circle, var(--b) 0%, transparent 68%); }
      .st-phone .ph-blob.b1 { left:-100px; top:80px; --b:#22d3ee; } .st-phone .ph-blob.b2 { right:-130px; top:380px; --b:#a78bfa; } .st-phone .ph-blob.b3 { left:0; bottom:-120px; --b:#ff3d7f; }
      .st-phone .ph-status { position:absolute; left:0; right:0; top:0; height:58px; z-index:20; display:flex; align-items:center; justify-content:space-between; padding:8px 30px 0 40px; font:700 24px var(--font); color:#fff; }
      .st-phone .ph-sys { display:flex; align-items:center; gap:8px; }
      .st-phone .ph-sig { display:flex; align-items:flex-end; gap:2px; height:16px; }
      .st-phone .ph-sig i { width:4px; background:#fff; border-radius:1px; }
      .st-phone .ph-sig i:nth-child(1){height:6px} .st-phone .ph-sig i:nth-child(2){height:9px} .st-phone .ph-sig i:nth-child(3){height:12px} .st-phone .ph-sig i:nth-child(4){height:16px}
      .st-phone .ph-wifi { font-size:22px; }
      .st-phone .ph-bat { position:relative; width:34px; height:17px; border:2px solid rgba(255,255,255,.85); border-radius:5px; }
      .st-phone .ph-bat i { position:absolute; left:2px; top:2px; bottom:2px; width:20px; background:#4ade80; border-radius:2px; }
      .st-phone .ph-island { position:absolute; left:50%; top:13px; width:114px; height:34px; margin-left:-57px; background:#000; border-radius:20px; z-index:21; }
      .st-phone .ph-island i { position:absolute; right:12px; top:10px; width:14px; height:14px; border-radius:50%; background:radial-gradient(circle at 35% 35%, #3b4a7a, #0a0f22 60%); }
      .st-phone .ph-glare { position:absolute; inset:0; z-index:24; pointer-events:none; background:linear-gradient(115deg, rgba(255,255,255,.13) 0%, rgba(255,255,255,.03) 28%, transparent 40%, transparent 70%, rgba(255,255,255,.05) 100%); }
      .st-phone .ph-sweep { position:absolute; top:-10%; bottom:-10%; left:-30%; width:160%; z-index:25; pointer-events:none; transform:translateX(100%); background:linear-gradient(110deg, transparent 38%, rgba(255,255,255,.28) 50%, transparent 62%); }
      .st-phone .ph-off { position:absolute; inset:0; z-index:26; background:#020308; opacity:0; pointer-events:none; }
      .st-phone .ph-homebar { position:absolute; left:50%; bottom:10px; width:130px; height:6px; margin-left:-65px; border-radius:3px; background:rgba(255,255,255,.75); z-index:22; }
      .st-phone .ph-tap { position:absolute; width:110px; height:110px; margin:-55px 0 0 -55px; border-radius:50%; border:4px solid #fff; z-index:23; opacity:0; pointer-events:none; }

      /* 主畫面 */
      .st-phone .ph-home { position:absolute; inset:0; }
      .st-phone .ph-clock { position:absolute; left:0; right:0; top:74px; text-align:center; color:#fff; }
      .st-phone .ph-clock-t { font:200 100px/1 var(--font); letter-spacing:-.02em; text-shadow:0 0 30px rgba(34,211,238,.5); }
      .st-phone .ph-clock-d { font-size:24px; font-weight:600; color:rgba(255,255,255,.85); margin-top:8px; }
      .st-phone .ph-icon { position:absolute; width:92px; height:92px; }
      .st-phone .ph-icon > b { position:absolute; inset:0; display:grid; place-items:center; border-radius:26px; color:#fff; font-size:50px; background:linear-gradient(140deg, var(--c1), var(--c2)); box-shadow:inset 0 2px 0 rgba(255,255,255,.35), 0 10px 24px rgba(0,0,0,.4); transition:box-shadow .4s; }
      .st-phone .ph-icon > b .ic { filter:drop-shadow(0 2px 3px rgba(0,0,0,.3)); }
      .st-phone .ph-icon > span { position:absolute; left:50%; top:100px; transform:translateX(-50%); white-space:nowrap; font-size:24px; font-weight:700; color:#fff; text-shadow:0 2px 6px rgba(0,0,0,.6); }
      .st-phone .ph-icon::after { content:""; position:absolute; inset:-8px; border-radius:32px; border:3px solid var(--c1); box-shadow:0 0 22px var(--c1), inset 0 0 14px var(--c1); opacity:0; transition:opacity .4s; }
      .st-phone .ph-icon.is-lit::after { opacity:1; }
      .st-phone .ph-widget { position:absolute; left:22px; right:22px; top:572px; height:122px; border-radius:30px; padding:18px 20px; display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.18); box-shadow:inset 0 1px 0 rgba(255,255,255,.2); }
      .st-phone .ph-w-k { font-size:24px; font-weight:600; color:rgba(255,255,255,.8); }
      .st-phone .ph-w-v { font-size:30px; font-weight:800; color:#fff; margin-top:4px; white-space:nowrap; }
      .st-phone .ph-w-bars { display:flex; align-items:flex-end; gap:5px; height:64px; margin-left:12px; }
      .st-phone .ph-w-bars i { width:8px; border-radius:5px; background:linear-gradient(180deg, #67e8f9, #a78bfa); transform-origin:50% 100%; }
      .st-phone .ph-dock { position:absolute; left:18px; right:18px; bottom:28px; height:96px; border-radius:36px; display:flex; align-items:center; justify-content:space-around; background:rgba(255,255,255,.14); border:1px solid rgba(255,255,255,.2); }
      .st-phone .ph-dock b { width:66px; height:66px; border-radius:20px; display:grid; place-items:center; font-size:36px; color:#fff; background:linear-gradient(140deg, var(--c1), var(--c2)); box-shadow:inset 0 2px 0 rgba(255,255,255,.3); }

      /* App 共用 */
      .st-phone .ph-app { position:absolute; inset:0; z-index:10; border-radius:54px; overflow:hidden; opacity:0; color:#fff; }
      .st-phone .app-h { position:absolute; left:0; right:0; top:66px; height:52px; display:flex; align-items:center; justify-content:center; gap:10px; font-size:28px; font-weight:800; }
      .st-phone .app-h .ic { font-size:30px; }

      /* 電子支付 */
      .st-phone .app-pay { background:linear-gradient(180deg, #06323d, #04131b 70%); transform-origin:${COLS[0]}px ${ROWS[0]}px; }
      .st-phone .pay-nfc { position:absolute; left:81px; top:140px; width:200px; height:200px; }
      .st-phone .pay-wave { position:absolute; inset:30px; border-radius:50%; border:4px solid #22d3ee; opacity:0; }
      .st-phone .pay-ok { position:absolute; inset:0; overflow:visible; }
      .st-phone .pay-ring { fill:rgba(34,211,238,.12); stroke:#22d3ee; stroke-width:8; }
      .st-phone .pay-tick { fill:none; stroke:#fff; stroke-width:12; stroke-linecap:round; stroke-linejoin:round; }
      .st-phone .pay-msg { position:absolute; left:0; right:0; top:358px; text-align:center; font-size:32px; font-weight:800; }
      .st-phone .pay-amt { position:absolute; left:0; right:0; top:404px; text-align:center; font-size:50px; font-weight:800; color:#67e8f9; }
      .st-phone .pay-list { position:absolute; left:22px; right:22px; top:492px; }
      .st-phone .pay-lk { font-size:24px; color:rgba(255,255,255,.65); margin:0 0 8px 6px; }
      .st-phone .pay-row { display:flex; justify-content:space-between; align-items:center; height:60px; padding:0 18px; border-radius:16px; font-size:26px; overflow:hidden; border-bottom:1px solid rgba(255,255,255,.08); }
      .st-phone .pay-row b { font-family:var(--mono); font-weight:700; color:#a5f3fc; }
      .st-phone .pay-new { background:rgba(34,211,238,.1); }

      /* 地圖 */
      .st-phone .app-map { background:#0a1222; transform-origin:${COLS[2]}px ${ROWS[0]}px; }
      .st-phone .map-svg { position:absolute; inset:0; width:100%; height:100%; }
      .st-phone .map-block { fill:#111a30; }
      .st-phone .map-park { fill:#0f2e25; }
      .st-phone .map-water { fill:#0d2547; }
      .st-phone .map-road { fill:none; stroke:#22304f; stroke-width:16; stroke-linecap:round; }
      .st-phone .map-alt { fill:none; stroke:rgba(180,190,224,.45); stroke-width:8; stroke-linecap:round; stroke-linejoin:round; }
      .st-phone .map-best { fill:none; stroke:#34d399; stroke-width:10; stroke-linecap:round; stroke-linejoin:round; }
      .st-phone .map-dot { fill:#fff; stroke:#34d399; stroke-width:5; }
      .st-phone .map-pin-a { fill:#22d3ee; stroke:#fff; stroke-width:5; }
      .st-phone .map-pin-b { fill:#ff3d7f; stroke:#fff; stroke-width:4; }
      .st-phone .map-search { position:absolute; left:22px; right:22px; top:72px; height:58px; border-radius:20px; display:flex; align-items:center; gap:10px; padding:0 18px; font-size:24px; font-weight:700; background:rgba(15,23,42,.92); border:1px solid rgba(255,255,255,.15); }
      .st-phone .map-search .ic { color:#ff3d7f; font-size:28px; }
      .st-phone .map-sheet { position:absolute; left:14px; right:14px; bottom:14px; height:150px; border-radius:30px; padding:22px 26px; background:rgba(15,23,42,.95); border:1px solid rgba(52,211,153,.4); }
      .st-phone .map-sk { font-size:24px; color:#6ee7b7; font-weight:700; }
      .st-phone .map-sv { font-size:32px; font-weight:800; margin-top:6px; white-space:nowrap; }

      /* 相片 */
      .st-phone .app-photo { background:linear-gradient(180deg, #1b0f2e, #0c0717); transform-origin:${COLS[1]}px ${ROWS[0]}px; }
      .st-phone .ph-pix { position:absolute; left:31px; top:136px; width:300px; height:300px; display:grid; grid-template-columns:repeat(15, 20px); border-radius:18px; overflow:hidden; box-shadow:0 20px 50px rgba(0,0,0,.5); }
      .st-phone .ph-pix i { width:20px; height:20px; }
      .st-phone .ph-pkts i { position:absolute; width:18px; height:18px; border-radius:4px; opacity:0; }
      .st-phone .photo-st { position:absolute; left:31px; right:31px; top:462px; display:flex; justify-content:space-between; font-size:26px; font-weight:700; }
      .st-phone .photo-pct { color:#f9a8d4; }
      .st-phone .photo-bar { position:absolute; left:31px; right:31px; top:510px; height:14px; border-radius:7px; background:rgba(255,255,255,.12); overflow:hidden; }
      .st-phone .photo-bar i { position:absolute; inset:0; background:linear-gradient(90deg, #f472b6, #a78bfa); transform-origin:0 50%; transform:scaleX(0); }
      .st-phone .photo-note { position:absolute; left:31px; right:31px; top:556px; font-size:24px; line-height:1.45; color:rgba(255,255,255,.75); text-align:center; }

      /* AI 助理 */
      .st-phone .app-ai { background:linear-gradient(180deg, #120d2e, #08061a); transform-origin:${COLS[2]}px ${ROWS[1]}px; }
      .st-phone .ai-msg { position:absolute; padding:14px 20px; border-radius:24px; font-size:26px; line-height:1.4; }
      .st-phone .ai-user { right:20px; top:140px; background:linear-gradient(135deg, #8b5cf6, #6d28d9); border-bottom-right-radius:6px; }
      .st-phone .ai-bot { left:20px; top:228px; width:286px; min-height:66px; background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.14); border-bottom-left-radius:6px; }
      .st-phone .ai-dots { position:absolute; left:22px; top:22px; display:flex; gap:8px; }
      .st-phone .ai-dots i { width:12px; height:12px; border-radius:50%; background:#c4b5fd; }
      .st-phone .ai-text { visibility:hidden; }
      .st-phone .ai-priv { position:absolute; left:20px; right:20px; top:540px; padding:16px 18px; border-radius:20px; display:flex; gap:12px; align-items:flex-start; font-size:24px; line-height:1.45; color:#fde68a; background:rgba(251,191,36,.12); border:1px solid rgba(251,191,36,.4); }
      .st-phone .ai-priv .ic { font-size:28px; flex:none; margin-top:2px; }
      .st-phone .ai-input { position:absolute; left:20px; right:20px; bottom:40px; height:62px; border-radius:31px; padding:0 24px; display:flex; align-items:center; font-size:24px; color:rgba(255,255,255,.5); background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.14); }

      /* 網購 */
      .st-phone .app-shop { background:linear-gradient(180deg, #2a0f1c, #12060c); transform-origin:${COLS[0]}px ${ROWS[1]}px; }
      .st-phone .shop-cart { position:absolute; right:28px; top:8px; font-size:34px; }
      .st-phone .shop-badge { position:absolute; right:-14px; top:-10px; min-width:30px; height:30px; padding:0 6px; border-radius:15px; display:grid; place-items:center; font:800 20px/1 var(--mono); background:#fb923c; color:#1a0a00; }
      .st-phone .shop-grid { position:absolute; left:22px; right:22px; top:136px; display:grid; grid-template-columns:1fr 1fr; gap:16px; }
      .st-phone .shop-tile { border-radius:22px; padding:12px; background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.12); }
      .st-phone .shop-img { height:112px; border-radius:16px; display:grid; place-items:center; font-size:58px; color:#fff; background:linear-gradient(140deg, var(--g1), var(--g2)); }
      .st-phone .shop-n { font-size:24px; font-weight:700; margin-top:8px; }
      .st-phone .shop-p { font-size:24px; color:#fdba74; font-weight:700; }
      .st-phone .shop-fly { position:absolute; width:70px; height:70px; border-radius:16px; display:grid; place-items:center; font-size:40px; color:#fff; background:linear-gradient(140deg, #fb923c, #e11d48); opacity:0; z-index:3; }
      .st-phone .shop-toast { position:absolute; left:40px; right:40px; top:600px; height:64px; border-radius:32px; display:flex; align-items:center; justify-content:center; gap:10px; font-size:26px; font-weight:800; background:#fb923c; color:#1a0a00; opacity:0; }

      /* 密碼 */
      .st-phone .app-lock { background:linear-gradient(180deg, #071b3a, #040b19); transform-origin:${COLS[1]}px ${ROWS[1]}px; }
      .st-phone .lk-svg { position:absolute; left:121px; top:84px; width:120px; height:140px; overflow:visible; }
      .st-phone .lk-shackle { fill:none; stroke:#93c5fd; stroke-width:12; stroke-linecap:round; }
      .st-phone .lk-body { fill:#3b82f6; }
      .st-phone .lk-hole { fill:#0b1a36; }
      .st-phone .lk-title { position:absolute; left:0; right:0; top:240px; text-align:center; font-size:30px; font-weight:800; }
      .st-phone .lk-field { position:absolute; left:26px; right:26px; height:64px; border-radius:18px; display:flex; align-items:center; gap:14px; padding:0 18px; font-size:26px; background:rgba(255,255,255,.08); border:1px solid rgba(147,197,253,.35); }
      .st-phone .lk-field .ic { font-size:28px; color:#93c5fd; }
      .st-phone .lk-f1 { top:300px; } .st-phone .lk-f2 { top:380px; }
      .st-phone .lk-dots { display:flex; gap:8px; }
      .st-phone .lk-dots i { width:14px; height:14px; border-radius:50%; background:#fff; opacity:0; }
      .st-phone .lk-meter { position:absolute; left:26px; right:26px; top:466px; display:flex; align-items:center; gap:12px; font-size:24px; color:rgba(255,255,255,.75); }
      .st-phone .lk-bar { flex:1; height:12px; border-radius:6px; background:rgba(255,255,255,.12); overflow:hidden; position:relative; }
      .st-phone .lk-bar i { position:absolute; inset:0; transform-origin:0 50%; transform:scaleX(0); background:#ef4444; }
      .st-phone .lk-lvl { color:#4ade80; min-width:28px; }
      .st-phone .lk-btn { position:absolute; left:26px; right:26px; top:520px; height:66px; border-radius:20px; display:grid; place-items:center; font-size:28px; font-weight:800; background:#3b82f6; }
      .st-phone .lk-ok { position:absolute; left:26px; right:26px; top:612px; height:120px; border-radius:24px; display:flex; align-items:center; justify-content:center; gap:16px; font-size:30px; font-weight:800; color:#4ade80; background:rgba(74,222,128,.12); border:2px solid rgba(74,222,128,.5); opacity:0; }
      .st-phone .lk-ok svg { width:64px; height:64px; overflow:visible; }
      .st-phone .lk-ok path { fill:none; stroke:#4ade80; stroke-width:2.4; stroke-linecap:round; stroke-linejoin:round; }

      /* 連線 */
      .st-phone .ph-wires { position:absolute; inset:0; width:1920px; height:1080px; pointer-events:none; overflow:visible; }
      .st-phone .ph-wire { opacity:0; }
      .st-phone .w-line { fill:none; stroke:var(--c); stroke-width:4; stroke-linecap:round; }
      .st-phone .w-glow { fill:none; stroke:var(--c); stroke-width:14; stroke-linecap:round; opacity:.22; }
      .st-phone .w-end, .st-phone .w-start { fill:#05060f; stroke:var(--c); stroke-width:4; }
      .st-phone .w-pulse { opacity:0; } .st-phone .w-pulse circle:first-child { fill:var(--c); opacity:.35; } .st-phone .w-pulse circle:last-child { fill:#fff; }

      /* 卡片 */
      .st-phone .ph-card { position:absolute; width:${CARD.w}px; height:${CARD.h}px; padding:24px 28px; opacity:0; backdrop-filter:none; border-color:color-mix(in srgb, var(--c) 55%, transparent); box-shadow:0 0 0 1px color-mix(in srgb, var(--c) 20%, transparent), 0 0 50px color-mix(in srgb, var(--c) 22%, transparent), 0 24px 70px rgba(0,0,0,.45); background:linear-gradient(160deg, color-mix(in srgb, var(--c) 16%, rgba(12,16,40,.92)), rgba(10,13,31,.9)); }
      .st-phone .ph-card-top { display:flex; align-items:center; gap:16px; }
      .st-phone .ph-card-ic { width:58px; height:58px; border-radius:16px; display:grid; place-items:center; font-size:32px; color:#fff; background:linear-gradient(140deg, var(--c), var(--c2)); flex:none; }
      .st-phone .ph-card-name { font-size:34px; font-weight:800; white-space:nowrap; }
      .st-phone .ph-card-k { margin-left:auto; font-size:24px; font-weight:700; color:var(--c); white-space:nowrap; }
      .st-phone .ph-card-tech { font-size:31px; font-weight:700; color:var(--ink); margin-top:16px; white-space:nowrap; }
      .st-phone .ph-card-mods { display:flex; gap:12px; margin-top:16px; }
      .st-phone .ph-mod { display:inline-flex; align-items:center; gap:10px; height:44px; padding:0 16px 0 6px; border-radius:12px; font-size:24px; font-weight:700; color:var(--ink); background:color-mix(in srgb, var(--m) 16%, transparent); border:1px solid color-mix(in srgb, var(--m) 55%, transparent); }
      .st-phone .ph-mod b { display:grid; place-items:center; min-width:36px; height:32px; padding:0 6px; border-radius:8px; font:800 22px/1 var(--mono); color:#05060f; background:var(--m); }

      /* 拆層標籤及結語 */
      .st-phone .ph-lab { position:absolute; display:flex; align-items:center; gap:14px; white-space:nowrap; opacity:0; }
      .st-phone .ph-lab i { position:relative; width:70px; height:3px; background:linear-gradient(90deg, var(--c), color-mix(in srgb, var(--c) 30%, transparent)); }
      .st-phone .ph-lab i::before { content:""; position:absolute; left:-6px; top:-5px; width:13px; height:13px; border-radius:50%; background:var(--c); box-shadow:0 0 14px var(--c); }
      .st-phone .ph-lab b { font-size:32px; font-weight:800; color:var(--c); }
      .st-phone .ph-lab span { font-size:26px; color:var(--ink-2); }
      .st-phone .ph-final { position:absolute; left:1200px; top:290px; width:700px; opacity:0; }
      .st-phone .ph-final p { margin:0; }
      .st-phone .ph-f-k { font:700 26px var(--mono); letter-spacing:.2em; color:var(--accent); margin-bottom:22px; }
      .st-phone .ph-f1 { font-size:40px; font-weight:700; color:var(--ink-2); }
      .st-phone .ph-user { color:var(--hot); }
      .st-phone .ph-f2 { font-size:54px; font-weight:800; margin-top:34px; }
      .st-phone .ph-f3 { font-size:120px; font-weight:900; line-height:1.15; margin-left:-30px; }
      .st-phone .ph-f4 { font-size:30px; color:var(--ink-2); margin-top:40px; }
    `;
    root.appendChild(css);
  },

  // ---------- 六個迷你 App ----------
  _apps() {
    const roads = [
      'M40 150 V760', 'M130 150 V760', 'M210 150 V760', 'M300 150 V760',
      'M20 170 H342', 'M20 280 H342', 'M20 400 H342', 'M20 520 H342', 'M20 640 H342', 'M40 647 L330 238',
    ];
    const blocks = [];
    const xs = [40, 130, 210, 300, 342], ys = [170, 280, 400, 520, 640, 760];
    for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < ys.length - 1; j++) {
      const park = i === 2 && j === 0;
      blocks.push(`<rect class="${park ? 'map-park' : 'map-block'}" x="${xs[i] + 12}" y="${ys[j] + 12}" width="${xs[i + 1] - xs[i] - 24}" height="${ys[j + 1] - ys[j] - 24}" rx="8"/>`);
    }
    const pk = Array.from({ length: 10 }, (_, i) => `<i style="background:${pixelColor((i * 7) % 15, (i * 4 + 3) % 15)};left:${70 + (i % 5) * 50}px;top:${250 + Math.floor(i / 5) * 60}px"></i>`).join('');
    return `
      <div class="ph-app app-pay" data-k="pay">
        <div class="app-h">${ic('credit-card')}電子支付</div>
        <div class="pay-nfc"><i class="pay-wave"></i><i class="pay-wave"></i><i class="pay-wave"></i>
          <svg viewBox="0 0 200 200" class="pay-ok"><circle class="pay-ring" cx="100" cy="100" r="78"/><path class="pay-tick" d="M64 102 L90 127 L138 77"/></svg></div>
        <div class="pay-msg">付款成功</div>
        <div class="pay-amt">HK$ 12.8</div>
        <div class="pay-list"><div class="pay-lk">交易紀錄</div>
          <div class="pay-row pay-new"><span>便利店</span><b>−12.8</b></div>
          <div class="pay-row"><span>巴士</span><b>−6.4</b></div>
          <div class="pay-row"><span>午餐</span><b>−38.0</b></div>
        </div>
      </div>
      <div class="ph-app app-map" data-k="map">
        <svg class="map-svg" viewBox="0 0 362 832">
          <path class="map-water" d="M0 690 C80 670 160 720 362 680 V832 H0 Z"/>
          ${blocks.join('')}
          ${roads.map(d => `<path class="map-road" d="${d}"/>`).join('')}
          <path class="map-alt" d="M130 640 V280 H300 V236"/>
          <path class="map-alt" d="M130 640 H300 V236"/>
          <path class="map-best" d="M130 640 V520 L300 280 V236"/>
          <circle class="map-pin-a" cx="130" cy="640" r="14"/>
          <g class="map-pin-b"><path d="M300 236 c-22 -26 -30 -38 -30 -52 a30 30 0 0 1 60 0 c0 14 -8 26 -30 52z"/><circle cx="300" cy="184" r="10" fill="#fff" stroke="none"/></g>
          <circle class="map-dot" cx="130" cy="640" r="11"/>
        </svg>
        <div class="map-search">${ic('map-pinned')}前往：學校</div>
        <div class="map-sheet"><div class="map-sk">最短路線</div><div class="map-sv">12 分鐘 · 1.2 公里</div></div>
      </div>
      <div class="ph-app app-photo" data-k="photo">
        <div class="app-h">${ic('image')}相片分享</div>
        <div class="ph-pix">${Array.from({ length: 225 }, (_, i) => `<i style="background:${pixelColor(i % 15, Math.floor(i / 15))}"></i>`).join('')}</div>
        <div class="ph-pkts">${pk}</div>
        <div class="photo-st"><span class="photo-lbl">上載中……</span><span class="photo-pct mono">0%</span></div>
        <div class="photo-bar"><i></i></div>
        <div class="photo-note">一張相片由大量像素組成，<br>每個像素都是數字</div>
      </div>
      <div class="ph-app app-ai" data-k="ai">
        <div class="app-h">${ic('bot')}AI 助理</div>
        <div class="ai-msg ai-user">甚麼是演算法？</div>
        <div class="ai-msg ai-bot"><span class="ai-dots"><i></i><i></i><i></i></span><span class="ai-text">演算法就是解決問題的清晰步驟。</span></div>
        <div class="ai-priv">${ic('lock')}<span>你輸入的資料，會被收集和使用嗎？</span></div>
        <div class="ai-input">輸入訊息……</div>
      </div>
      <div class="ph-app app-shop" data-k="shop">
        <div class="app-h">網上購物<span class="shop-cart">${ic('shopping-cart')}<b class="shop-badge">0</b></span></div>
        <div class="shop-grid">
          ${[['headphones', '耳機', '$299', '#fb923c', '#e11d48'], ['watch', '手錶', '$459', '#f472b6', '#7c3aed'], ['backpack', '背包', '$189', '#38bdf8', '#1d4ed8'], ['book-open', '圖書', '$88', '#34d399', '#0f766e']]
            .map(([icn, n, p, g1, g2]) => `<div class="shop-tile"><div class="shop-img" style="--g1:${g1};--g2:${g2}">${ic(icn)}</div><div class="shop-n">${n}</div><div class="shop-p mono">${p}</div></div>`).join('')}
        </div>
        <div class="shop-fly f1">${ic('headphones')}</div><div class="shop-fly f2" style="background:linear-gradient(140deg,#38bdf8,#1d4ed8)">${ic('backpack')}</div>
        <div class="shop-toast">${ic('shopping-cart')}已加入購物車</div>
      </div>
      <div class="ph-app app-lock" data-k="lock">
        <svg class="lk-svg" viewBox="0 0 120 140"><path class="lk-shackle" d="M32 66 V42 a28 28 0 0 1 56 0 V66"/><rect class="lk-body" x="14" y="62" width="92" height="72" rx="16"/><circle class="lk-hole" cx="60" cy="96" r="10"/><rect class="lk-hole" x="56" y="98" width="8" height="18" rx="3"/></svg>
        <div class="lk-title">登入帳戶</div>
        <div class="lk-field lk-f1">${ic('user')}<span class="mono">student01</span></div>
        <div class="lk-field lk-f2">${ic('key-round')}<span class="lk-dots">${'<i></i>'.repeat(12)}</span></div>
        <div class="lk-meter"><span>密碼強度</span><div class="lk-bar"><i></i></div><b class="lk-lvl">弱</b></div>
        <div class="lk-btn">登入</div>
        <div class="lk-ok"><svg viewBox="0 0 24 24"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path class="lk-check" d="m9 12 2 2 4-4"/></svg>已安全登入</div>
      </div>`;
  },

  // 各 App 的迷你示範（約 1.4 秒）
  _demo(k, app) {
    const q = s => app.querySelector(s), qa = s => app.querySelectorAll(s);
    const t = gsap.timeline();
    const fx = this._ctx.fx;
    if (k === 'pay') {
      t.fromTo(qa('.pay-wave'), { scale: 0.5, opacity: 1 }, { scale: 1.6, opacity: 0, duration: 0.6, stagger: 0.12, ease: 'power1.out' }, 0);
      t.fromTo(q('.pay-ring'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.45, ease: 'power2.inOut' }, 0.4);
      t.fromTo(q('.pay-tick'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.25, ease: 'power2.out' }, 0.8);
      t.fromTo([q('.pay-msg'), q('.pay-amt')], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.08 }, 0.75);
      t.add(fx.countUp(q('.pay-amt'), 12.8, { decimals: 1, prefix: 'HK$ ', duration: 0.5 }), 0.8);
      t.fromTo(q('.pay-new'), { height: 0, opacity: 0 }, { height: 60, opacity: 1, duration: 0.35, ease: 'power2.out' }, 1.05);
      t.fromTo(q('.pay-new'), { backgroundColor: 'rgba(34,211,238,.55)' }, { backgroundColor: 'rgba(34,211,238,.1)', duration: 0.6 }, 1.3);
    } else if (k === 'map') {
      t.fromTo(q('.map-pin-a'), { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.3, ease: 'back.out(3)' }, 0);
      t.fromTo(q('.map-pin-b'), { y: -40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'bounce.out' }, 0.05);
      t.fromTo(qa('.map-alt'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.55, stagger: 0.1, ease: 'power1.inOut' }, 0.1);
      t.fromTo(q('.map-best'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.6, ease: 'power2.inOut' }, 0.55);
      t.to(q('.map-dot'), { motionPath: { path: q('.map-best'), align: q('.map-best'), alignOrigin: [0.5, 0.5] }, duration: 0.8, ease: 'power1.inOut' }, 0.6);
      t.fromTo(q('.map-sheet'), { y: 170 }, { y: 0, duration: 0.45, ease: 'expo.out' }, 0.95);
    } else if (k === 'photo') {
      t.fromTo(qa('.ph-pix i'), { opacity: 0, scale: 0.2 }, { opacity: 1, scale: 1, duration: 0.25, stagger: { amount: 0.6, grid: [15, 15], from: 0 } }, 0);
      t.to(q('.ph-pix'), { scale: 0.9, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.inOut' }, 0.8);
      t.fromTo(q('.photo-bar i'), { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: 'power1.inOut' }, 0.85);
      t.add(fx.countUp(q('.photo-pct'), 100, { suffix: '%', duration: 0.6, ease: 'power1.inOut' }), 0.85);
      t.fromTo(qa('.ph-pkts i'), { opacity: 1, y: 0, scale: 1 }, { opacity: 0, y: -300, scale: 0.4, duration: 0.6, stagger: 0.05, ease: 'power2.in' }, 0.85);
      t.call(() => { q('.photo-lbl').textContent = '已分享'; }, null, 1.45);
    } else if (k === 'ai') {
      t.fromTo(q('.ai-user'), { opacity: 0, scale: 0.6, transformOrigin: '100% 100%' }, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2)' }, 0);
      t.fromTo(q('.ai-bot'), { opacity: 0, scale: 0.6, transformOrigin: '0% 100%' }, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2)' }, 0.3);
      t.fromTo(qa('.ai-dots i'), { y: 0 }, { y: -8, duration: 0.15, stagger: 0.08, yoyo: true, repeat: 1 }, 0.4);
      t.set(q('.ai-dots'), { opacity: 0 }, 0.8);
      t.set(q('.ai-text'), { visibility: 'visible' }, 0.8);
      t.add(fx.typeOn(q('.ai-text'), { cps: 32, cursor: false }), 0.8);
      t.fromTo(q('.ai-priv'), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4, ease: 'expo.out' }, 1.15);
    } else if (k === 'shop') {
      const tiles = qa('.shop-tile'), badge = q('.shop-badge');
      t.to(tiles[0], { scale: 0.93, duration: 0.12, yoyo: true, repeat: 1 }, 0);
      t.fromTo(q('.shop-fly.f1'), { left: 70, top: 168, opacity: 1, scale: 1 }, { left: 284, top: 62, scale: 0.35, opacity: 0.2, duration: 0.5, ease: 'power2.in' }, 0.12);
      t.call(() => { badge.textContent = '1'; }, null, 0.62);
      t.fromTo(badge, { scale: 1.8 }, { scale: 1, duration: 0.3, ease: 'back.out(3)' }, 0.62);
      t.to(tiles[2], { scale: 0.93, duration: 0.12, yoyo: true, repeat: 1 }, 0.6);
      t.fromTo(q('.shop-fly.f2'), { left: 70, top: 390, opacity: 1, scale: 1 }, { left: 284, top: 62, scale: 0.35, opacity: 0.2, duration: 0.5, ease: 'power2.in' }, 0.72);
      t.call(() => { badge.textContent = '2'; }, null, 1.22);
      t.fromTo(badge, { scale: 1.8 }, { scale: 1, duration: 0.3, ease: 'back.out(3)' }, 1.22);
      t.set(q('.shop-fly.f1'), { opacity: 0 }, 0.62);
      t.set(q('.shop-fly.f2'), { opacity: 0 }, 1.22);
      t.fromTo(q('.shop-toast'), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.35, ease: 'back.out(2)' }, 1.2);
    } else if (k === 'lock') {
      const lvl = q('.lk-lvl');
      t.fromTo(qa('.lk-dots i'), { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.12, stagger: 0.05 }, 0);
      t.fromTo(q('.lk-bar i'), { scaleX: 0, backgroundColor: '#ef4444' }, { scaleX: 1, backgroundColor: '#4ade80', duration: 0.65, ease: 'power1.in' }, 0.05);
      t.call(() => { lvl.textContent = '中'; lvl.style.color = '#fbbf24'; }, null, 0.35);
      t.call(() => { lvl.textContent = '強'; lvl.style.color = '#4ade80'; }, null, 0.65);
      t.to(q('.lk-btn'), { scale: 0.94, duration: 0.1, yoyo: true, repeat: 1 }, 0.75);
      t.to(q('.lk-shackle'), { y: -16, duration: 0.25, ease: 'back.out(3)' }, 0.95);
      t.fromTo(q('.lk-ok'), { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(2)' }, 1.0);
      t.fromTo(q('.lk-check'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.3 }, 1.15);
    }
    return t;
  },

  // ---------- 小工具 ----------
  _sfx(name) { if (!this._quiet) this._ctx.sfx.play(name); },
  _run(tl, instant) {
    this._tls.push(tl);
    if (instant) { this._quiet = true; tl.progress(1); this._quiet = false; }
    return tl;
  },
  _settle() {
    this._quiet = true;
    this._tls.forEach(t => t.progress(1));
    this._quiet = false;
    this._tls = [];
  },
  _loop(key, make) {
    if (this._loops.has(key)) return;
    this._loops.add(key);
    make();
  },

  enter(root, ctx, { instant }) {
    const q = s => root.querySelector(s), qa = s => root.querySelectorAll(s);
    // 環境動畫：光暈旋轉、牆紙流動、訊號光環
    ctx.track(gsap.to(q('.ph-halo-a'), { rotation: 360, duration: 26, repeat: -1, ease: 'none' }));
    qa('.ph-blob').forEach((b, i) => ctx.track(gsap.to(b, { x: i % 2 ? -60 : 70, y: i === 1 ? 80 : -60, duration: 5 + i * 1.3, repeat: -1, yoyo: true, ease: 'sine.inOut' })));
    qa('.ph-rings i').forEach((r, i) => ctx.track(gsap.fromTo(r, { scale: 0.75, opacity: 0.5 }, { scale: 1.7, opacity: 0, duration: 4.5, repeat: -1, delay: i * 1.5, ease: 'power1.out' })));

    const tl = ctx.tl();
    tl.call(() => this._sfx('rise'), null, 0.1);
    tl.fromTo(q('.ph-move'), { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: 'expo.out' }, 0);
    tl.fromTo(q('.ph-halo'), { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 1.6, ease: 'expo.out' }, 0.1);
    tl.fromTo(q('.ph-off'), { opacity: 1 }, { opacity: 0, duration: 0.6, ease: 'power2.out' }, 0.6);
    tl.fromTo(q('.ph-sweep'), { xPercent: -100 }, { xPercent: 100, duration: 1.1, ease: 'power2.inOut' }, 0.7);
    tl.fromTo(q('.ph-clock'), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out' }, 0.8);
    tl.add(ctx.fx.scramble(q('.ph-clock-t'), '08:30', { chars: '0123456789', duration: 0.7 }), 0.8);
    tl.fromTo(qa('.ph-icon'), { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.55, stagger: 0.07, ease: 'back.out(2.2)' }, 1.0);
    tl.fromTo(q('.ph-widget'), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' }, 1.3);
    tl.fromTo(qa('.ph-w-bars i'), { scaleY: 0 }, { scaleY: 1, duration: 0.5, stagger: 0.05, ease: 'back.out(2)' }, 1.4);
    tl.fromTo(q('.ph-dock'), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' }, 1.4);
    tl.fromTo(q('.station-head'), { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.8, ease: 'expo.out' }, 0.3);
    tl.fromTo(qa('.ph-ghost'), { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.6, stagger: 0.08, ease: 'back.out(1.6)' }, 1.5);
    tl.fromTo(q('.ph-question'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out' }, 1.9);
    tl.call(() => this._sfx('blip'), null, 1.9);
    this._run(tl, instant);
  },

  // 打開一個 App → 示範 → 飛出卡片 → 關閉 App
  _appSeq(root, a) {
    const ctx = this._ctx;
    const q = s => root.querySelector(s);
    const icon = q(`.ph-icon[data-k="${a.k}"]`), app = q(`.ph-app[data-k="${a.k}"]`);
    const card = q(`.ph-card[data-k="${a.k}"]`), wire = q(`.ph-wire[data-k="${a.k}"]`), ghost = q(`.ph-ghost[data-k="${a.k}"]`);
    const cam = q('.ph-cam'), tap = q('.ph-tap');
    const s = gsap.timeline();
    s.call(() => this._sfx('pop'), null, 0);
    s.to(icon, { scale: 0.86, duration: 0.12, yoyo: true, repeat: 1, ease: 'power2.inOut' }, 0);
    s.fromTo(tap, { left: COLS[a.col], top: ROWS[a.row], scale: 0.4, opacity: 0.9 }, { scale: 1.6, opacity: 0, duration: 0.5, ease: 'power2.out' }, 0);
    s.to(cam, { scale: 1.12, duration: 0.8, ease: 'power3.inOut' }, 0.05);
    s.fromTo(app, { scale: 0.25, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.55, ease: 'expo.out' }, 0.2);
    s.add(this._demo(a.k, app), 0.6);
    s.to(cam, { scale: 1, duration: 0.9, ease: 'power3.inOut' }, 1.9);
    s.call(() => this._sfx('whoosh'), null, 2.0);
    s.fromTo(wire, { opacity: 0 }, { opacity: 1, duration: 0.2 }, 2.0);
    s.fromTo(wire.querySelectorAll('.w-line, .w-glow'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.7, ease: 'power2.out' }, 2.0);
    s.fromTo(card, { x: a.ix - (a.cx + CARD.w / 2), y: a.iy - (a.cy + CARD.h / 2), scale: 0.15, opacity: 0 }, { x: 0, y: 0, scale: 1, opacity: 1, duration: 0.9, ease: 'expo.out' }, 2.05);
    s.to(ghost, { opacity: 0, duration: 0.3 }, 2.2);
    s.fromTo(card.querySelectorAll('.ph-mod'), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: 'back.out(2)' }, 2.55);
    s.call(() => this._sfx('tick'), null, 2.6);
    s.to(app, { scale: 0.25, opacity: 0, duration: 0.45, ease: 'power3.in' }, 2.5);
    s.call(() => icon.classList.add('is-lit'), null, 2.85);
    s.call(() => this._pulseWire(root, a), null, 2.95);
    return s;
  },

  // 連線上流動的光點（無限循環，必須 track）
  _pulseWire(root, a) {
    this._loop('wire-' + a.k, () => {
      const g = root.querySelector(`.ph-wire[data-k="${a.k}"]`);
      const dot = g.querySelector('.w-pulse'), path = g.querySelector('.w-line');
      gsap.set(dot, { opacity: 1 });
      this._ctx.track(gsap.to(dot, { motionPath: { path, align: path, alignOrigin: [0.5, 0.5] }, duration: 1.8, repeat: -1, ease: 'power1.inOut', repeatDelay: 0.6 + (a.slot * 0.3) }));
    });
  },

  step(root, ctx, n, { instant }) {
    this._settle();
    const q = s => root.querySelector(s), qa = s => root.querySelectorAll(s);
    const tl = ctx.tl();
    if (n >= 1 && n <= 3) {
      // 之前步驟的卡片略為變暗，聚焦新內容
      const prev = APPS.filter(a => a.step < n);
      if (prev.length) {
        tl.to(prev.map(a => q(`.ph-card[data-k="${a.k}"]`)), { opacity: 0.5, duration: 0.5 }, 0);
        tl.to(prev.map(a => q(`.ph-wire[data-k="${a.k}"]`)), { opacity: 0.35, duration: 0.5 }, 0);
      }
      APPS.filter(a => a.step === n).forEach((a, i) => tl.add(this._appSeq(root, a), i * 2.7));
    }
    if (n === 4) {
      const cards = qa('.ph-card'), move = q('.ph-move');
      tl.call(() => this._sfx('whooshOut'), null, 0);
      APPS.forEach((a, i) => {
        tl.to(q(`.ph-card[data-k="${a.k}"]`), { x: a.ix - (a.cx + CARD.w / 2), y: a.iy - (a.cy + CARD.h / 2), scale: 0.1, opacity: 0, duration: 0.6, ease: 'power3.in' }, i * 0.05);
      });
      tl.to(qa('.ph-wire'), { opacity: 0, duration: 0.4 }, 0);
      tl.to([...qa('.ph-ghost'), q('.ph-question')], { opacity: 0, duration: 0.4 }, 0);
      tl.to(qa('.ph-rings i'), { autoAlpha: 0, duration: 0.4 }, 0);
      tl.set(qa('.ph-layer'), { opacity: 1 }, 0.5);
      tl.to(move, { x: SHIFT.x, y: SHIFT.y, scale: SHIFT.s, duration: 1.4, ease: 'power3.inOut' }, 0.5);
      tl.to(q('.ph-tilt'), { rotationX: SHIFT.rx, duration: 1.4, ease: 'power3.inOut' }, 0.5);
      tl.to(q('.ph-device'), { rotation: SHIFT.rz, duration: 1.4, ease: 'power3.inOut' }, 0.5);
      tl.to(q('.ph-halo'), { x: SHIFT.x, y: SHIFT.y, scale: 0.85, opacity: 0.8, duration: 1.4, ease: 'power3.inOut' }, 0.5);
      tl.call(() => this._sfx('rise'), null, 1.5);
      const order = ['.ph-frame', '.ph-l-code', '.ph-l-data', '.ph-l-chip'];
      order.forEach((sel, i) => tl.to(q(sel), { z: LZ[i], duration: 1.1, ease: 'expo.out' }, 1.6 + i * 0.06));
      tl.call(() => this._placeLabels(root), null, 1.6);
      tl.fromTo(qa('.ph-lab'), { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.12, ease: 'expo.out' }, 2.3);
      tl.fromTo(q('.ph-final'), { opacity: 0 }, { opacity: 1, duration: 0.01 }, 2.0);
      tl.fromTo(['.ph-f-k', '.ph-f1', '.ph-f2'].map(q), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.25, ease: 'expo.out' }, 2.0);
      tl.fromTo(q('.ph-f3'), { opacity: 0, scale: 0.6, transformOrigin: '0% 50%' }, { opacity: 1, scale: 1, duration: 0.9, ease: 'back.out(1.6)' }, 2.9);
      tl.call(() => { this._sfx('success'); }, null, 2.9);
      tl.fromTo(q('.ph-f4'), { opacity: 0 }, { opacity: 1, duration: 0.6 }, 3.5);
      tl.call(() => this._floatStack(root), null, 3.0);
    }
    this._run(tl, instant);
  },

  // 量度拆層後各層右下角的位置（用一組隱藏的「探針」元素，不干擾動畫），把標籤放在旁邊
  _placeLabels(root) {
    const rr = root.getBoundingClientRect(), k = rr.width / 1920 || 1;
    const labs = root.querySelectorAll('.ph-lab');
    root.querySelectorAll('.ph-probe b').forEach((m, i) => {
      const r = m.getBoundingClientRect();
      const x = (r.left + r.width / 2 - rr.left) / k, y = (r.top + r.height / 2 - rr.top) / k;
      labs[i].style.left = Math.round(x - 30) + 'px';
      labs[i].style.top = Math.round(y - 24) + 'px';
    });
  },

  _floatStack(root) {
    this._loop('float', () => {
      const ctx = this._ctx;
      ['.ph-frame', '.ph-l-code', '.ph-l-data', '.ph-l-chip'].forEach((sel, i) => {
        ctx.track(gsap.to(root.querySelector(sel), { z: LZ[i] + (i - 1.5) * 10, duration: 2.4, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: i * 0.15 }));
      });
    });
  },
};
