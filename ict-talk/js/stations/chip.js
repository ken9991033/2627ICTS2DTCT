// 07 硬件層：B 電腦系統基礎（20 小時）
// 視覺主角：手機「爆炸圖」（SVG 等角投影）→ CPU「擷取 → 解碼 → 執行」→ 晶片內數十億個電晶體 → 訊號經天線離開
// 步驟：1 拆開手機　2 CPU 計 5 + 3　3 晶片與電晶體　4 訊號出發（下一站網絡層）
const gsap = window.gsap;

// ---------- 等角投影 ----------
const C = 0.8660254, S = 0.5;
const PL = 480, PW = 240, RX = 36;      // 手機局部座標：長 480（u）、闊 240（v）
const OX = 750, OY = 600, EX = 120;     // 爆炸後第一層（底殼）原點；每層向右上位移 EX
const AX = 934, AY = 430;               // 組合時各層的原點（置中）
const LIFT = [0, 4, 10, 11];            // 組合時各層的高度
const isoM = (x, y) => `matrix(${C} ${S} ${-C} ${S} ${x} ${y})`;
const LO = k => [OX + EX * k, OY - EX * k];
const isoP = (k, u, v) => { const [x, y] = LO(k); return [x + (u - v) * C, y + (u + v) * S]; };

// 偽隨機（固定種子，每次畫面一樣）
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ---------- 各層圖案（局部座標） ----------
function layerCase() {
  let s = `<rect width="${PL}" height="${PW}" rx="${RX}" fill="url(#chip-case)" stroke="#fbbf24" stroke-opacity=".4" stroke-width="2"/>
    <rect x="14" y="14" width="452" height="212" rx="26" fill="#090d1b" stroke="rgba(255,255,255,.07)" stroke-width="1.5"/>
    <rect x="150" y="34" width="276" height="172" rx="16" fill="url(#chip-bat)" stroke="rgba(251,191,36,.5)" stroke-width="2"/>
    <rect x="150" y="34" width="46" height="172" rx="12" fill="rgba(251,191,36,.22)"/>
    <text x="306" y="131" text-anchor="middle" font-family="JetBrains Mono, monospace" font-weight="800" font-size="30" fill="rgba(251,191,36,.75)" letter-spacing="4">BATTERY</text>
    <rect x="30" y="34" width="92" height="92" rx="24" fill="#141a2e" stroke="rgba(160,180,255,.4)" stroke-width="2"/>
    <circle cx="58" cy="62" r="18" fill="url(#chip-lens)" stroke="#2a3150" stroke-width="3"/>
    <circle cx="94" cy="98" r="18" fill="url(#chip-lens)" stroke="#2a3150" stroke-width="3"/>
    <circle cx="96" cy="58" r="7" fill="#fde68a" opacity=".9"/>`;
  for (let i = 0; i < 6; i++) s += `<circle cx="454" cy="${92 + i * 11}" r="3.2" fill="#3a4266"/>`;
  return s;
}

function layerBoard() {
  const r = rng(7);
  let s = `<rect width="${PL}" height="${PW}" rx="30" fill="url(#chip-pcb)" stroke="#fbbf24" stroke-opacity=".6" stroke-width="2"/>
    <rect x="6" y="6" width="468" height="228" rx="26" fill="url(#chip-grid)"/>`;
  // 線路
  const tr = [];
  for (let i = 0; i < 6; i++) tr.push(`M${262 + i * 15} 90 V${66 - i * 7} H${40 + i * 7} V${150 + i * 9} H${104}`);
  for (let i = 0; i < 4; i++) tr.push(`M250 ${148 + i * 11} H222`);
  for (let i = 0; i < 5; i++) tr.push(`M350 ${100 + i * 18} H${361} V${84 + i * 22} H372`);
  for (let i = 0; i < 4; i++) tr.push(`M${165 + i * 14} 200 V${222 - i * 3} H${24 + i * 6}`);
  for (let i = 0; i < 3; i++) tr.push(`M438 ${96 + i * 24} H${446 - i * 2}`);
  for (let i = 0; i < 4; i++) tr.push(`M${380 + i * 14} 180 V${210 - i * 4} H${440}`);
  s += `<g fill="none" stroke="#f59e0b" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" opacity=".7">${tr.map(d => `<path class="ch-trace" d="${d}"/>`).join('')}</g>`;
  s += `<g class="ch-flow" fill="none" stroke="#fff7d6" stroke-width="3" stroke-linecap="round" stroke-dasharray="5 46" opacity="0">${tr.map(d => `<path d="${d}"/>`).join('')}</g>`;
  // 過孔
  for (let i = 0; i < 6; i++) s += `<circle cx="${40 + i * 7}" cy="${150 + i * 9}" r="3.4" fill="#fde68a"/>`;
  // 小型元件（避開晶片）
  const block = [[100, 112, 128, 92], [240, 80, 120, 120], [364, 62, 84, 128], [440, 10, 40, 220], [20, 20, 120, 30]];
  let n = 0, guard = 0;
  while (n < 34 && guard++ < 600) {
    const w = r() < 0.5 ? 12 : 7, h = w === 12 ? 7 : 12;
    const x = 18 + r() * 420, y = 16 + r() * 200;
    if (block.some(([bx, by, bw, bh]) => x + w > bx && x < bx + bw && y + h > by && y < by + bh)) continue;
    s += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w}" height="${h}" rx="1.5" fill="${r() < 0.5 ? '#3b3f58' : '#5b4a2a'}" stroke="rgba(253,230,138,.35)" stroke-width="1"/>`;
    n++;
  }
  // 儲存（SSD）
  s += `<g class="ch-ssd"><rect x="110" y="120" width="110" height="80" rx="8" fill="#171c30" stroke="#fbbf24" stroke-opacity=".7" stroke-width="2"/>
    <rect x="118" y="128" width="94" height="64" rx="5" fill="none" stroke="rgba(255,255,255,.08)"/>
    <text x="165" y="170" text-anchor="middle" font-family="JetBrains Mono, monospace" font-weight="800" font-size="26" fill="#fde68a">SSD</text></g>`;
  // 記憶體（RAM）
  let pins = '';
  for (let i = 0; i < 9; i++) pins += `<rect x="${375 + i * 7}" y="64" width="3" height="6" fill="#fde68a"/><rect x="${375 + i * 7}" y="180" width="3" height="6" fill="#fde68a"/>`;
  s += `<g class="ch-ram">${pins}<rect x="372" y="70" width="66" height="110" rx="8" fill="#171c30" stroke="#fbbf24" stroke-opacity=".7" stroke-width="2"/>
    <text x="405" y="134" text-anchor="middle" font-family="JetBrains Mono, monospace" font-weight="800" font-size="24" fill="#fde68a">RAM</text></g>`;
  // CPU
  s += `<g class="ch-cpu"><rect x="244" y="84" width="112" height="112" rx="12" fill="rgba(251,191,36,.25)" filter="url(#chip-glow)"/>
    <rect x="250" y="90" width="100" height="100" rx="10" fill="url(#chip-lid)" stroke="#fde68a" stroke-width="2"/>
    <rect x="264" y="104" width="72" height="72" rx="6" fill="none" stroke="rgba(60,40,0,.35)" stroke-width="2"/>
    <text x="300" y="150" text-anchor="middle" font-family="JetBrains Mono, monospace" font-weight="900" font-size="30" fill="#3a2600">CPU</text></g>`;
  // 天線
  s += `<path class="ch-ant" d="M452 22 V218 M462 30 H472 V54 H462 V78 H472 V102 H462 V126 H472 V150 H462 V174 H472 V198 H462" fill="none" stroke="#fb923c" stroke-width="3" stroke-linejoin="round" opacity=".8"/>`;
  // 訊號路徑（第 4 步發光）
  s += `<path class="ch-sig-dim" d="M330 196 V226 H452" fill="none" stroke="#f59e0b" stroke-width="2.4" opacity=".6"/>
    <path class="ch-sig" d="M300 140 H330 V226 H452 V22" fill="none" stroke="#fff7d6" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" filter="url(#chip-glow)"/>`;
  return s;
}

function layerScreen() {
  let g = '';
  for (let u = 36; u < PL; u += 36) g += `<path d="M${u} 14 V226"/>`;
  for (let v = 36; v < PW; v += 36) g += `<path d="M14 ${v} H466"/>`;
  return `<rect width="${PL}" height="${PW}" rx="${RX}" fill="url(#chip-glass)" stroke="rgba(170,190,255,.6)" stroke-width="2"/>
    <rect x="12" y="12" width="456" height="216" rx="26" fill="#050914"/>
    <g class="ch-touch" stroke="#67e8f9" stroke-width="1.2" opacity=".22" fill="none">${g}</g>
    <circle cx="26" cy="120" r="6.5" fill="#1b2240" stroke="rgba(255,255,255,.25)"/>
    <path d="M12 12 H230 L90 228 H12 Z" fill="url(#chip-sheen)" opacity=".7"/>`;
}

function layerOS() {
  const cols = ['#22d3ee', '#a78bfa', '#fb923c', '#34d399', '#f472b6', '#fbbf24', '#60a5fa', '#ff3d7f'];
  let s = `<rect width="${PL}" height="${PW}" rx="${RX}" fill="url(#chip-os)" stroke="#67e8f9" stroke-width="2.5" stroke-opacity=".85"/>
    <rect x="20" y="96" width="10" height="48" rx="5" fill="rgba(255,255,255,.35)"/>`;
  let i = 0;
  for (let r = 0; r < 6; r++) for (let c = 0; c < 4; c++, i++) {
    const u = 52 + r * 56, v = 26 + c * 50;
    s += `<g class="ch-app"><rect x="${u}" y="${v}" width="40" height="40" rx="11" fill="${cols[(i * 5 + r) % cols.length]}" opacity=".88"/><circle cx="${u + 20}" cy="${v + 20}" r="8" fill="rgba(255,255,255,.75)"/></g>`;
  }
  for (let c = 0; c < 4; c++) s += `<rect class="ch-app" x="408" y="${26 + c * 50}" width="40" height="40" rx="11" fill="rgba(255,255,255,.22)" stroke="rgba(255,255,255,.35)"/>`;
  return s;
}

function sceneASVG() {
  const defs = `<defs>
    <linearGradient id="chip-case" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#28304b"/><stop offset="1" stop-color="#0f1426"/></linearGradient>
    <linearGradient id="chip-bat" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2b3150"/><stop offset="1" stop-color="#151a2e"/></linearGradient>
    <radialGradient id="chip-lens"><stop offset="0" stop-color="#60a5fa"/><stop offset=".35" stop-color="#1e293b"/><stop offset="1" stop-color="#05070f"/></radialGradient>
    <linearGradient id="chip-pcb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0d3a3a"/><stop offset="1" stop-color="#062126"/></linearGradient>
    <pattern id="chip-grid" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M16 0H0V16" fill="none" stroke="rgba(110,231,183,.12)" stroke-width="1"/></pattern>
    <linearGradient id="chip-lid" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3c4"/><stop offset=".45" stop-color="#fbbf24"/><stop offset="1" stop-color="#b45309"/></linearGradient>
    <linearGradient id="chip-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1b2446"/><stop offset="1" stop-color="#0a0f22"/></linearGradient>
    <linearGradient id="chip-sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <linearGradient id="chip-os" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22d3ee" stop-opacity=".30"/><stop offset=".5" stop-color="#7c3aed" stop-opacity=".22"/><stop offset="1" stop-color="#22d3ee" stop-opacity=".12"/></linearGradient>
    <filter id="chip-shadow" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="26" stdDeviation="18" flood-color="#000" flood-opacity=".6"/></filter>
    <filter id="chip-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>`;
  const layers = [
    { k: 0, cls: 'case', thick: 18, side: '#0a0e1c', edge: 'rgba(251,191,36,.45)', body: layerCase() },
    { k: 1, cls: 'board', thick: 6, side: '#3a2a08', edge: 'rgba(251,191,36,.7)', body: layerBoard() },
    { k: 2, cls: 'screen', thick: 8, side: '#0c1124', edge: 'rgba(170,190,255,.5)', body: layerScreen() },
    { k: 3, cls: 'os', thick: 0, body: layerOS() },
  ];
  const body = layers.map(l => {
    const [x, y] = LO(l.k);
    let side = '';
    for (let t = l.thick; t > 0; t -= 2) side += `<rect transform="${isoM(x, y + t)}" width="${PL}" height="${PW}" rx="${RX}" fill="${l.side}"${t === l.thick ? ` stroke="${l.edge}" stroke-width="2"` : ''}/>`;
    return `<g class="ch-layer ch-l-${l.cls}" data-k="${l.k}"><g${l.k < 3 ? ' filter="url(#chip-shadow)"' : ' filter="url(#chip-glow)"'}>${side}<g transform="${isoM(x, y)}">${l.body}</g></g></g>`;
  }).join('');
  // 爆炸圖虛線（各層角落）
  let guides = '';
  [[0, 0], [PL, 0], [0, PW], [PL, PW]].forEach(([u, v]) => {
    const a = isoP(0, u, v), b = isoP(3, u, v);
    guides += `<path d="M${a[0]} ${a[1]} L${b[0]} ${b[1]}"/>`;
  });
  return `${defs}<g class="ch-guides" fill="none" stroke="rgba(251,191,36,.35)" stroke-width="2" stroke-dasharray="6 10">${guides}</g>${body}`;
}

// 標示（label）：錨點（層 k 的局部座標）→ 標籤位置
const LABELS = [
  { id: 'os', k: 3, u: 40, v: 228, x: 640, y: 296, side: 'L', t: '作業系統', tag: '軟件', d: '管理硬件，讓 App 運行' },
  { id: 'io', k: 2, u: 70, v: 232, x: 640, y: 470, side: 'L', t: '輸入／輸出', tag: '硬件', d: '觸控螢幕、鏡頭、喇叭' },
  { id: 'ssd', k: 1, u: 165, v: 160, x: 620, y: 800, side: 'L', t: '儲存裝置', tag: '硬件', d: '長期保存相片及 App' },
  { id: 'cpu', k: 1, u: 300, v: 140, x: 1350, y: 690, side: 'R', t: 'CPU 中央處理器', tag: '硬件', d: '執行指令的「大腦」' },
  { id: 'ram', k: 1, u: 405, v: 125, x: 1350, y: 860, side: 'R', t: '記憶體 RAM', tag: '硬件', d: '暫存正在使用的數據' },
];

// ---------- 晶片（die）圖 ----------
function dieSVG() {
  const r = rng(21);
  let s = `<defs>
    <linearGradient id="chip-die" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a1d36"/><stop offset=".5" stop-color="#1b1a33"/><stop offset="1" stop-color="#2d1f12"/></linearGradient>
    <linearGradient id="chip-iri" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbbf24" stop-opacity=".22"/><stop offset=".5" stop-color="#f472b6" stop-opacity=".12"/><stop offset="1" stop-color="#60a5fa" stop-opacity=".22"/></linearGradient>
    <pattern id="chip-sram" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="rgba(251,191,36,.35)"/></pattern>
    <pattern id="chip-logic" width="10" height="4" patternUnits="userSpaceOnUse"><rect width="7" height="2" fill="rgba(167,139,250,.35)"/></pattern>
  </defs>
  <rect width="480" height="480" rx="10" fill="url(#chip-die)" stroke="#fbbf24" stroke-opacity=".7" stroke-width="3"/>`;
  for (let i = 0; i < 22; i++) {
    const p = 24 + i * 19.5;
    s += `<rect x="${p}" y="6" width="10" height="12" fill="#c08a2a"/><rect x="${p}" y="462" width="10" height="12" fill="#c08a2a"/><rect x="6" y="${p}" width="12" height="10" fill="#c08a2a"/><rect x="462" y="${p}" width="12" height="10" fill="#c08a2a"/>`;
  }
  // 四個核心
  [[34, 34], [146, 34], [34, 146], [146, 146]].forEach(([x, y]) => {
    s += `<rect x="${x}" y="${y}" width="100" height="100" fill="url(#chip-logic)" stroke="rgba(167,139,250,.7)" stroke-width="2"/>
      <rect x="${x + 8}" y="${y + 8}" width="40" height="40" fill="url(#chip-sram)" stroke="rgba(251,191,36,.6)"/>
      <rect x="${x + 56}" y="${y + 56}" width="36" height="36" fill="rgba(251,146,60,.25)" stroke="rgba(251,146,60,.7)"/>`;
  });
  // GPU 陣列
  for (let i = 0; i < 4; i++) for (let j = 0; j < 5; j++) s += `<rect x="${262 + i * 46}" y="${34 + j * 42}" width="40" height="36" fill="rgba(96,165,250,.18)" stroke="rgba(96,165,250,.65)" stroke-width="1.5"/>`;
  // 快取記憶體
  s += `<rect x="34" y="262" width="412" height="96" fill="url(#chip-sram)" stroke="rgba(251,191,36,.75)" stroke-width="2"/>`;
  // 其他區塊
  for (let i = 0; i < 6; i++) {
    const w = 50 + r() * 40;
    s += `<rect x="${34 + i * 70}" y="${374}" width="${Math.min(w, 62)}" height="${50 + r() * 22}" fill="rgba(52,211,153,.14)" stroke="rgba(52,211,153,.55)" stroke-width="1.5"/>`;
  }
  s += `<rect width="480" height="480" rx="10" fill="url(#chip-iri)"/>`;
  return s;
}

const PROG = [
  { a: 0, ins: 'LOAD 5', dec: '動作：載入　數值：5' },
  { a: 1, ins: 'ADD 3', dec: '動作：相加　數值：3' },
  { a: 2, ins: 'STORE 05', dec: '動作：存入　位址：05' },
];
const ROW_Y = [460, 544, 628, 772]; // 記憶體各列中心 y（位址 00、01、02、05）

const TITLES = ['拆開手機：硬件與軟件', '拆開手機：硬件與軟件', 'CPU 怎樣執行指令？', '晶片裏的微觀世界', '訊號，準備出發'];

export default {
  id: 'chip',
  title: '硬件層：B 電腦系統基礎',
  short: '硬件層',
  module: 'B',
  accent: '#fbbf24',
  layer: 'chip',
  tint: ['#fbbf24', '#f97316'],
  transition: { type: 'zoomIn', focus: '.data-dive' },
  steps: 4,
  minutes: 1.25,
  notes: `【硬件層：單元 B 電腦系統基礎，約 20 小時】
（進場）鏡頭穿過一個記憶體位元，來到手機內部。問同學：「這部手機裏面，究竟有甚麼？」
1. 按 →：手機「爆炸」拆開。逐一指出：作業系統（軟件）、輸入／輸出（觸控螢幕、鏡頭、喇叭）、儲存裝置、CPU、記憶體 RAM。強調「硬件」是看得見、摸得到的零件；「軟件」是指揮硬件工作的程式。可問：「關機後，相片存在哪裏？為甚麼 RAM 的內容會消失？」
2. 按 →：鏡頭放大到 CPU。動畫示範 CPU 的「擷取 → 解碼 → 執行」循環：由記憶體擷取指令 LOAD 5、ADD 3、STORE 05，最後把 5 + 3 的結果 8 存回記憶體位址 05。說明控制單元、算術邏輯單元（ALU）及暫存器的角色。真實的 CPU 每秒可重複這個循環數十億次。
3. 按 →：再放大到晶片內部。一塊指甲般大小的晶片內，有數十億至數百億個電晶體，每個只有數納米。每個電晶體就像一個開關：開代表 1，關代表 0──呼應上一站「電腦只懂 0 和 1」。
4. 按 →：鏡頭拉回手機，訊號由 CPU 沿線路到達天線，然後離開手機。帶出：「訊號離開手機之後，去了哪裏？」再按 → 進入網絡層。`,

  build(root, ctx) {
    this._cur = null;
    this._loops = false;
    const lab = LABELS.map(l => `<div class="ch-lab ch-lab-${l.side}" data-id="${l.id}" style="${l.side === 'L' ? `right:${1920 - l.x}px` : `left:${l.x}px`};top:${l.y - 48}px">
        <div class="ch-lab-t">${l.t}<span class="ch-tag ${l.tag === '軟件' ? 'sw' : ''}">${l.tag}</span></div>
        <div class="ch-lab-d">${l.d}</div></div>`).join('');
    const leads = LABELS.map(l => {
      const [ax, ay] = isoP(l.k, l.u, l.v);
      const ex = l.side === 'L' ? l.x + 14 : l.x - 14;
      return `<g class="ch-lead" data-id="${l.id}"><path d="M${ex} ${l.y} L${ax.toFixed(1)} ${ay.toFixed(1)}"/><circle cx="${ax.toFixed(1)}" cy="${ay.toFixed(1)}" r="8"/></g>`;
    }).join('');
    const [antX, antY] = isoP(1, 457, 30);
    this._ant = [antX, antY];
    const [cpuX, cpuY] = isoP(1, 300, 140);
    this._cpu = [cpuX, cpuY];
    let waves = '';
    for (let i = 0; i < 4; i++) waves += `<path class="ch-wave" vector-effect="non-scaling-stroke" d="M${antX + 40 * Math.cos(-1.45)} ${antY + 40 * Math.sin(-1.45)} A40 40 0 0 1 ${antX + 40 * Math.cos(-0.2)} ${antY + 40 * Math.sin(-0.2)}"/>`;
    let pins = '';
    for (let i = 0; i < 13; i++) {
      const p = 40 + i * 48;
      pins += `<rect x="${p}" y="0" width="16" height="14" rx="3"/><rect x="${p}" y="586" width="16" height="14" rx="3"/>`;
      if (i < 12) pins += `<rect x="0" y="${30 + i * 46}" width="14" height="16" rx="3"/><rect x="666" y="${30 + i * 46}" width="14" height="16" rx="3"/>`;
    }

    root.innerHTML = `
      <div class="station-head"><div class="kicker">硬件層 · 單元 B · 20 小時</div><h1 class="h1 ch-title">${TITLES[0]}</h1></div>

      <div class="ch-scene ch-A">
        <svg class="ch-svg" viewBox="0 0 1920 1080" width="1920" height="1080">${sceneASVG()}
          <g class="ch-leads" fill="none" stroke="#fde68a" stroke-width="2.5">${leads}</g>
          <g class="ch-waves" fill="none" stroke="#fbbf24" stroke-width="6" stroke-linecap="round">${waves}</g>
          <circle class="ch-ant-glow" cx="${antX}" cy="${antY}" r="16" fill="#fff7d6"/>
        </svg>
        ${lab}
        <div class="ch-ask">這部手機裏面，究竟有甚麼？</div>
        <div class="ch-sigtxt">
          <div class="ch-sig-h">訊號由晶片出發，<br>經天線離開這部手機……</div>
          <div class="ch-sig-n">下一站：網絡層（單元 C）</div>
        </div>
        <div class="ch-ant-lab">天線</div>
      </div>

      <div class="ch-scene ch-B">
        <div class="ch-phases">
          <div class="ch-ph" data-p="0"><b>1</b>擷取</div><i class="ch-arr"></i>
          <div class="ch-ph" data-p="1"><b>2</b>解碼</div><i class="ch-arr"></i>
          <div class="ch-ph" data-p="2"><b>3</b>執行</div>
        </div>
        <div class="ch-ram panel">
          <div class="ch-box-h">記憶體 RAM</div>
          <div class="ch-box-s">存放程式及數據</div>
        </div>
        ${PROG.map((p, i) => `<div class="ch-row" data-i="${i}" style="top:${ROW_Y[i] - 36}px"><span class="a">0${p.a}</span><span class="i">${p.ins}</span><span class="ok">✓</span></div>`).join('')}
        <div class="ch-dots" style="top:${ROW_Y[2] + 44}px">⋮</div>
        <div class="ch-row data" data-i="3" style="top:${ROW_Y[3] - 36}px"><span class="a">05</span><span class="i v">0</span><span class="g">數據</span></div>
        <svg class="ch-bus" viewBox="0 0 1920 1080" width="1920" height="1080">
          <defs><marker id="chip-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#fbbf24"/></marker></defs>
          <path d="M724 548 H1096" stroke="#fbbf24" stroke-width="5" stroke-opacity=".55" marker-start="url(#chip-arrow)" marker-end="url(#chip-arrow)"/>
          <path d="M724 600 H1096" stroke="#fbbf24" stroke-width="5" stroke-opacity=".55" marker-start="url(#chip-arrow)" marker-end="url(#chip-arrow)"/>
          <path class="ch-bus-flow" d="M724 574 H1096" stroke="#fde68a" stroke-width="3" stroke-dasharray="4 18" stroke-opacity=".8"/>
          <g class="ch-cpu-pins" transform="translate(1110 300)" fill="#c08a2a">${pins}</g>
        </svg>
        <div class="ch-bus-lab">匯流排</div>
        <div class="ch-cpubox">
          <div class="ch-box-h">中央處理器 CPU</div>
        </div>
        <div class="ch-cu">
          <div class="ch-sub">控制單元</div>
          <div class="ch-reg pc"><span>程式計數器 PC</span><b>00</b></div>
          <div class="ch-reg ir"><span>指令暫存器 IR</span><b>——</b></div>
          <div class="ch-dec"><span class="k">解碼</span><span class="v">——</span></div>
        </div>
        <div class="ch-alu"><div class="ch-sub">算術邏輯單元 ALU</div><div class="ch-op">——</div></div>
        <div class="ch-acc"><div class="ch-sub">累加器 ACC</div><b>0</b></div>
        <div class="ch-pkt">LOAD 5</div>
        <div class="ch-note">真實的 CPU 每秒可以重複這個循環<b>數十億次</b>。</div>
      </div>

      <div class="ch-scene ch-C">
        <svg class="ch-die" viewBox="0 0 480 480" width="480" height="480">${dieSVG()}</svg>
        <svg class="ch-zoomlines" viewBox="0 0 1920 1080" width="1920" height="1080" fill="none" stroke="#fbbf24" stroke-width="2.5">
          <rect class="ch-mag" x="560" y="560" width="64" height="64" stroke-width="4"/>
          <path class="ch-zl" d="M624 560 L940 324"/><path class="ch-zl" d="M624 624 L940 736"/>
        </svg>
        <div class="ch-lens"><canvas width="420" height="420"></canvas><div class="ch-lens-cap">放大數百萬倍</div></div>
        <div class="ch-switch panel">
          <div class="ch-sw-h">一個電晶體 ＝ 一個開關</div>
          <svg viewBox="0 0 500 220" width="500" height="220">
            <path d="M20 120 H170" stroke="#7c86b2" stroke-width="8" stroke-linecap="round"/>
            <path class="ch-sw-cur" d="M20 120 H170 M290 120 H360" stroke="#fde68a" stroke-width="8" stroke-linecap="round" stroke-dasharray="10 22"/>
            <circle cx="170" cy="120" r="12" fill="#e5e7eb"/>
            <circle cx="290" cy="120" r="12" fill="#e5e7eb"/>
            <path d="M290 120 H360" stroke="#7c86b2" stroke-width="8" stroke-linecap="round"/>
            <line class="ch-blade" x1="170" y1="120" x2="290" y2="120" stroke="#fbbf24" stroke-width="10" stroke-linecap="round"/>
            <circle class="ch-led-glow" cx="410" cy="120" r="62" fill="#fbbf24" opacity=".35"/>
            <circle class="ch-led" cx="410" cy="120" r="44" fill="#fbbf24" stroke="#fde68a" stroke-width="4"/>
            <text class="ch-bit" x="410" y="140" text-anchor="middle" font-family="JetBrains Mono, monospace" font-weight="900" font-size="58" fill="#1a1200">1</text>
          </svg>
          <div class="ch-sw-row"><span class="on1">開 → 1</span><span class="on0">關 → 0</span></div>
        </div>
        <div class="ch-big"><span class="ch-big-n">數十億至數百億個</span>電晶體</div>
        <div class="ch-big-s">每個只有數納米，全部集成在指甲般大小的晶片上。</div>
      </div>
    `;

    const css = document.createElement('style');
    css.textContent = `
      .st-chip .station-head { left: 200px; z-index: 5; }
      .st-chip .ch-title { text-shadow: 0 4px 30px rgba(0,0,0,.6); }
      .st-chip .ch-scene { position: absolute; inset: 0; transform-origin: 50% 50%; }
      .st-chip .ch-svg, .st-chip .ch-bus, .st-chip .ch-zoomlines { position: absolute; left: 0; top: 0; overflow: visible; pointer-events: none; }
      .st-chip .ch-leads circle { fill: #fbbf24; stroke: #fff7d6; stroke-width: 3; }
      .st-chip .ch-lead, .st-chip .ch-lab { opacity: 0; }
      .st-chip .ch-lab { position: absolute; width: 440px; }
      .st-chip .ch-lab-L { text-align: right; }
      .st-chip .ch-lab-t { font-size: 36px; font-weight: 800; line-height: 1.2; color: var(--ink); text-shadow: 0 2px 16px rgba(0,0,0,.8); white-space: nowrap; }
      .st-chip .ch-lab-d { font-size: 27px; line-height: 1.4; color: var(--ink-2); margin-top: 6px; text-shadow: 0 2px 12px rgba(0,0,0,.9); white-space: nowrap; }
      .st-chip .ch-tag { display: inline-block; vertical-align: 6px; margin: 0 12px; padding: 2px 12px; border-radius: 10px; font-size: 24px; font-weight: 800; color: #1a1200; background: #fbbf24; }
      .st-chip .ch-tag.sw { background: #67e8f9; color: #04202a; }
      .st-chip .ch-ask { position: absolute; left: 200px; right: 0; top: 930px; text-align: center; font-size: 40px; font-weight: 800; color: var(--ink); opacity: 0; }
      .st-chip .ch-sigtxt { position: absolute; left: 1330px; top: 806px; width: 520px; opacity: 0; }
      .st-chip .ch-sig-h { font-size: 40px; font-weight: 800; line-height: 1.35; color: var(--ink); text-shadow: 0 2px 20px rgba(0,0,0,.8); }
      .st-chip .ch-sig-n { margin-top: 14px; font-size: 26px; font-weight: 700; color: var(--accent); }
      .st-chip .ch-ant-lab { position: absolute; left: ${antX + 34}px; top: ${antY - 22}px; padding: 4px 16px; border-radius: 12px; font-size: 26px; font-weight: 800; color: #1a1200; background: #fb923c; opacity: 0; box-shadow: 0 0 24px rgba(251,146,60,.6); }
      .st-chip .ch-wave, .st-chip .ch-ant-glow, .st-chip .ch-sig { opacity: 0; }
      .st-chip .ch-l-os .ch-app { transform-box: fill-box; transform-origin: 50% 50%; }

      /* 場景 B：擷取 → 解碼 → 執行 */
      .st-chip .ch-B, .st-chip .ch-C { opacity: 0; visibility: hidden; }
      .st-chip .ch-phases { position: absolute; left: 1110px; top: 196px; display: flex; align-items: center; gap: 14px; }
      .st-chip .ch-ph { display: flex; align-items: center; gap: 12px; height: 68px; padding: 0 26px 0 12px; border-radius: 34px; font-size: 32px; font-weight: 800; color: var(--ink-3); border: 2px solid var(--line-strong); background: rgba(10,13,31,.7); transition: none; }
      .st-chip .ch-ph b { display: grid; place-items: center; width: 46px; height: 46px; border-radius: 50%; font: 900 26px var(--mono); color: #05060f; background: var(--ink-3); }
      .st-chip .ch-ph.on { color: #1a1200; background: #fbbf24; border-color: #fde68a; box-shadow: 0 0 40px rgba(251,191,36,.6); }
      .st-chip .ch-ph.on b { background: #1a1200; color: #fbbf24; }
      .st-chip .ch-ph.done { color: var(--ink); border-color: rgba(251,191,36,.7); }
      .st-chip .ch-ph.done b { background: #fbbf24; }
      .st-chip .ch-arr { width: 34px; height: 4px; background: var(--line-strong); position: relative; }
      .st-chip .ch-arr::after { content: ""; position: absolute; right: -4px; top: -8px; border: 10px solid transparent; border-left-color: var(--line-strong); border-right: 0; }
      .st-chip .ch-ram { position: absolute; left: 230px; top: 300px; width: 480px; height: 560px; }
      .st-chip .ch-cpubox { position: absolute; left: 1124px; top: 314px; width: 652px; height: 572px; border-radius: 26px; border: 3px solid rgba(251,191,36,.75); background: linear-gradient(160deg, rgba(251,191,36,.10), rgba(10,12,28,.85) 40%); box-shadow: 0 0 80px rgba(251,191,36,.18), inset 0 0 60px rgba(251,191,36,.08); }
      .st-chip .ch-box-h { position: absolute; left: 28px; top: 20px; font-size: 34px; font-weight: 800; color: #fbbf24; }
      .st-chip .ch-box-s { position: absolute; left: 28px; top: 70px; font-size: 26px; color: var(--ink-2); }
      .st-chip .ch-cpubox .ch-box-h { left: 30px; top: 16px; }
      .st-chip .ch-row { position: absolute; left: 254px; width: 432px; height: 72px; display: flex; align-items: center; gap: 22px; padding: 0 20px; border-radius: 14px; background: rgba(255,255,255,.04); border: 2px solid var(--line); }
      .st-chip .ch-row .a { font: 700 26px var(--mono); color: #fbbf24; width: 44px; }
      .st-chip .ch-row .i { font: 800 32px var(--mono); color: var(--ink); flex: 1; }
      .st-chip .ch-row .g { font-size: 24px; color: var(--ink-3); }
      .st-chip .ch-row .ok { font: 900 30px var(--mono); color: #34d399; opacity: 0; }
      .st-chip .ch-row.on { background: rgba(251,191,36,.18); border-color: #fbbf24; box-shadow: 0 0 30px rgba(251,191,36,.35); }
      .st-chip .ch-row.data .i { color: #fde68a; }
      .st-chip .ch-dots { position: absolute; left: 254px; width: 432px; text-align: center; font-size: 34px; line-height: 1; color: var(--ink-3); }
      .st-chip .ch-bus-lab { position: absolute; left: 724px; width: 372px; top: 486px; text-align: center; font-size: 28px; font-weight: 700; color: #fde68a; }
      .st-chip .ch-cu { position: absolute; left: 1150px; top: 380px; width: 600px; height: 250px; border-radius: 18px; border: 2px solid rgba(251,191,36,.35); background: rgba(5,7,18,.6); }
      .st-chip .ch-sub { position: absolute; left: 20px; top: 12px; font-size: 26px; font-weight: 700; color: var(--ink-2); }
      .st-chip .ch-reg { position: absolute; top: 56px; height: 96px; border-radius: 14px; background: #070a18; border: 2px solid var(--line-strong); padding: 8px 16px; }
      .st-chip .ch-reg span { display: block; font-size: 24px; color: var(--ink-3); }
      .st-chip .ch-reg b { display: block; font: 800 38px/1.2 var(--mono); color: #fde68a; }
      .st-chip .ch-reg.pc { left: 20px; width: 220px; }
      .st-chip .ch-reg.ir { left: 256px; width: 324px; }
      .st-chip .ch-dec { position: absolute; left: 20px; top: 166px; width: 560px; height: 66px; display: flex; align-items: center; gap: 16px; }
      .st-chip .ch-dec .k { padding: 4px 14px; border-radius: 10px; font-size: 24px; font-weight: 800; color: #1a1200; background: #fbbf24; }
      .st-chip .ch-dec .v { font-size: 30px; font-weight: 700; color: var(--ink); white-space: nowrap; }
      .st-chip .ch-alu { position: absolute; left: 1150px; top: 650px; width: 330px; height: 210px; border-radius: 18px; border: 2px solid rgba(251,191,36,.35); background: rgba(5,7,18,.6); }
      .st-chip .ch-alu svg { position: absolute; }
      .st-chip .ch-op { position: absolute; left: 0; right: 0; top: 84px; text-align: center; font: 800 46px var(--mono); color: var(--ink); white-space: nowrap; }
      .st-chip .ch-acc { position: absolute; left: 1500px; top: 650px; width: 250px; height: 210px; border-radius: 18px; border: 2px solid rgba(251,191,36,.6); background: rgba(251,191,36,.08); }
      .st-chip .ch-acc b { position: absolute; left: 0; right: 0; top: 64px; text-align: center; font: 900 100px/1.1 var(--mono); color: #fbbf24; text-shadow: 0 0 30px rgba(251,191,36,.6); }
      .st-chip .ch-pkt { position: absolute; left: 0; top: 0; width: 220px; height: 60px; margin: -30px 0 0 -110px; display: grid; place-items: center; border-radius: 16px; font: 800 30px var(--mono); color: #1a1200; background: #fbbf24; box-shadow: 0 0 40px rgba(251,191,36,.8); opacity: 0; z-index: 4; }
      .st-chip .ch-note { position: absolute; left: 230px; top: 920px; font-size: 32px; color: var(--ink-2); opacity: 0; }
      .st-chip .ch-note b { color: #fbbf24; }

      /* 場景 C：晶片與電晶體 */
      .st-chip .ch-die { position: absolute; left: 236px; top: 300px; filter: drop-shadow(0 0 40px rgba(251,191,36,.25)); }
      .st-chip .ch-mag { filter: drop-shadow(0 0 10px #fbbf24); }
      .st-chip .ch-lens { position: absolute; left: 770px; top: 320px; width: 420px; height: 420px; border-radius: 50%; overflow: hidden; border: 4px solid #fbbf24; box-shadow: 0 0 60px rgba(251,191,36,.45), inset 0 0 40px rgba(0,0,0,.8); background: #0b0814; }
      .st-chip .ch-lens canvas { position: absolute; inset: 0; width: 420px; height: 420px; }
      .st-chip .ch-lens-cap { position: absolute; left: 0; right: 0; bottom: 34px; text-align: center; font-size: 24px; font-weight: 800; color: #fde68a; text-shadow: 0 2px 10px #000, 0 0 4px #000; }
      .st-chip .ch-switch { position: absolute; left: 1250px; top: 300px; width: 540px; height: 440px; padding: 26px 20px; }
      .st-chip .ch-sw-h { font-size: 34px; font-weight: 800; color: var(--ink); text-align: center; }
      .st-chip .ch-switch svg { display: block; margin: 26px auto 0; overflow: visible; }
      .st-chip .ch-sw-row { display: flex; justify-content: center; gap: 40px; margin-top: 20px; font: 800 36px var(--font); }
      .st-chip .ch-sw-row span { padding: 4px 22px; border-radius: 14px; color: var(--ink-3); border: 2px solid var(--line); }
      .st-chip .ch-sw-row span.lit { color: #1a1200; background: #fbbf24; border-color: #fbbf24; box-shadow: 0 0 30px rgba(251,191,36,.5); }
      .st-chip .ch-big { position: absolute; left: 200px; right: 0; top: 792px; text-align: center; font-size: 60px; font-weight: 800; color: var(--ink); white-space: nowrap; }
      .st-chip .ch-big-n { font-size: 88px; font-weight: 900; margin-right: 18px; background: linear-gradient(100deg, #fde68a, #fbbf24 40%, #fb923c); -webkit-background-clip: text; background-clip: text; color: transparent; }
      .st-chip .ch-big-s { position: absolute; left: 200px; right: 0; top: 920px; text-align: center; font-size: 32px; color: var(--ink-2); }
      .st-chip .ch-mag, .st-chip .ch-zl, .st-chip .ch-lens, .st-chip .ch-switch, .st-chip .ch-big, .st-chip .ch-big-s { opacity: 0; }
    `;
    root.appendChild(css);

    // 電晶體陣列（放大鏡內）
    this._lens = root.querySelector('.ch-lens canvas');
    this._cells = Array.from({ length: 14 * 14 }, (_, i) => (i * 7919) % 3 === 0 ? 1 : 0);
    this._drawLens();
  },

  _drawLens() {
    const cv = this._lens; if (!cv) return;
    const g = cv.getContext('2d');
    g.fillStyle = '#0b0814'; g.fillRect(0, 0, 420, 420);
    // 金屬導線
    g.strokeStyle = 'rgba(251,191,36,.18)'; g.lineWidth = 4;
    for (let i = 0; i < 14; i++) { g.beginPath(); g.moveTo(0, 15 + i * 30); g.lineTo(420, 15 + i * 30); g.stroke(); }
    g.strokeStyle = 'rgba(167,139,250,.16)'; g.lineWidth = 3;
    for (let i = 0; i < 14; i++) { g.beginPath(); g.moveTo(15 + i * 30, 0); g.lineTo(15 + i * 30, 420); g.stroke(); }
    for (let i = 0; i < 14; i++) for (let j = 0; j < 14; j++) {
      const on = this._cells[i * 14 + j];
      const x = j * 30 + 6, y = i * 30 + 6;
      if (on) { g.shadowColor = '#fbbf24'; g.shadowBlur = 14; g.fillStyle = '#fbbf24'; }
      else { g.shadowBlur = 0; g.fillStyle = '#2a2140'; }
      g.fillRect(x, y, 18, 18);
      g.shadowBlur = 0;
      g.fillStyle = on ? 'rgba(255,247,214,.9)' : 'rgba(120,110,160,.5)';
      g.fillRect(x + 7, y + 2, 4, 14);
    }
  },

  enter(root, ctx, { instant }) {
    const layers = [...root.querySelectorAll('.ch-layer')];
    // 組合狀態：各層疊在一起
    layers.forEach((el, k) => gsap.set(el, { x: AX - (OX + EX * k), y: AY - (OY - EX * k) - LIFT[k] }));
    const ask = root.querySelector('.ch-ask');
    const guides = root.querySelector('.ch-guides');
    gsap.set(guides, { opacity: 0 });
    if (instant) { gsap.set(ask, { opacity: 1 }); return; }
    const tl = ctx.tl();
    this._cur = tl;
    tl.from(layers, { y: '-=160', opacity: 0, duration: 0.8, stagger: 0.14, ease: 'back.out(1.4)' }, 0.2);
    tl.call(() => ctx.sfx.play('pop'), null, 0.3);
    tl.from(root.querySelectorAll('.ch-trace'), { drawSVG: 0, duration: 0.9, stagger: 0.02, ease: 'power2.out' }, 0.5);
    tl.from(root.querySelectorAll('.ch-l-os .ch-app'), { scale: 0, duration: 0.4, stagger: 0.025, ease: 'back.out(2)' }, 0.9);
    tl.from(root.querySelector('.station-head'), { opacity: 0, x: -40, duration: 0.8, ease: 'expo.out' }, 0.2);
    tl.to(ask, { opacity: 1, duration: 0.8 }, 1.6);
  },

  step(root, ctx, n, { instant }) {
    if (this._cur) { this._cur.progress(1); this._cur = null; }
    const q = s => root.querySelector(s), qa = s => [...root.querySelectorAll(s)];
    const sfx = name => { if (!instant) ctx.sfx.play(name); };
    const title = q('.ch-title');
    const A = q('.ch-A'), B = q('.ch-B'), Cc = q('.ch-C');
    const tl = ctx.tl();
    this._cur = tl;
    const swapTitle = (at) => {
      tl.to(title, { opacity: 0, y: -24, duration: 0.3, ease: 'power2.in' }, at);
      tl.call(() => { title.textContent = TITLES[n]; }, null, at + 0.3);
      tl.set(title, { y: 24 }, at + 0.3);
      tl.to(title, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' }, at + 0.31);
    };

    if (n === 1) {
      // 拆開手機（爆炸圖）
      const layers = qa('.ch-layer');
      tl.to(q('.ch-ask'), { opacity: 0, duration: 0.3 }, 0);
      tl.call(() => sfx('whoosh'), null, 0);
      tl.fromTo(A, { scale: 1.06 }, { scale: 1, duration: 1.6, ease: 'expo.out', immediateRender: false }, 0);
      tl.to(layers, { x: 0, y: 0, duration: 1.2, ease: 'expo.inOut', stagger: { each: 0.06, from: 'center' } }, 0.05);
      tl.to(q('.ch-guides'), { opacity: 1, duration: 0.6 }, 0.9);
      tl.fromTo(q('.ch-guides').querySelectorAll('path'), { drawSVG: 0 }, { drawSVG: '100%', duration: 0.8, immediateRender: false }, 0.9);
      LABELS.forEach((l, i) => {
        const lead = q(`.ch-lead[data-id="${l.id}"]`), lab = q(`.ch-lab[data-id="${l.id}"]`);
        const at = 1.25 + i * 0.32;
        tl.set(lead, { opacity: 1 }, at);
        tl.fromTo(lead.querySelector('path'), { drawSVG: '100% 100%' }, { drawSVG: '0% 100%', duration: 0.45, ease: 'power2.out', immediateRender: false }, at);
        tl.fromTo(lead.querySelector('circle'), { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.4, ease: 'back.out(3)', immediateRender: false }, at);
        tl.fromTo(lab, { opacity: 0, x: l.side === 'L' ? -30 : 30 }, { opacity: 1, x: 0, duration: 0.5, ease: 'expo.out', immediateRender: false }, at + 0.25);
        tl.call(() => sfx('blip'), null, at + 0.25);
      });
      tl.to(q('.ch-flow'), { opacity: 0.9, duration: 0.6 }, 1.2);
      tl.call(() => ctx.track(gsap.fromTo(q('.ch-flow').querySelectorAll('path'), { strokeDashoffset: 0 }, { strokeDashoffset: -102, duration: 1.4, ease: 'none', repeat: -1 })), null, 1.2);
    }

    if (n === 2) {
      // 鏡頭放大到 CPU → CPU 擷取／解碼／執行
      const [cx, cy] = this._cpu;
      swapTitle(0);
      tl.call(() => sfx('whoosh'), null, 0);
      tl.to(A, { scale: 5, transformOrigin: `${cx}px ${cy}px`, opacity: 0, duration: 1.0, ease: 'power3.in' }, 0);
      tl.set(A, { visibility: 'hidden' }, 1.0);
      tl.set(B, { visibility: 'visible', scale: 0.35, opacity: 0, transformOrigin: '1450px 600px' }, 0.7);
      tl.to(B, { scale: 1, opacity: 1, duration: 1.0, ease: 'expo.out' }, 0.7);
      this._fde(root, ctx, tl, 1.6, instant);
    }

    if (n === 3) {
      // 再放大：晶片內部
      swapTitle(0);
      tl.call(() => sfx('whoosh'), null, 0);
      tl.to(B, { scale: 6, transformOrigin: '1450px 600px', opacity: 0, duration: 1.0, ease: 'power3.in' }, 0);
      tl.set(B, { visibility: 'hidden' }, 1.0);
      tl.set(Cc, { visibility: 'visible', scale: 0.3, opacity: 0, transformOrigin: '476px 540px' }, 0.7);
      tl.to(Cc, { scale: 1, opacity: 1, duration: 1.1, ease: 'expo.out' }, 0.7);
      tl.set(q('.ch-mag'), { opacity: 1 }, 1.6);
      tl.fromTo(q('.ch-mag'), { drawSVG: 0 }, { drawSVG: '100%', duration: 0.5, immediateRender: false }, 1.6);
      qa('.ch-zl').forEach(p => { tl.set(p, { opacity: 1 }, 1.9); tl.fromTo(p, { drawSVG: 0 }, { drawSVG: '100%', duration: 0.5, immediateRender: false }, 1.9); });
      tl.fromTo(q('.ch-lens'), { opacity: 0, scale: 0.1, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.9, ease: 'expo.out', immediateRender: false }, 2.2);
      tl.call(() => sfx('reveal'), null, 2.2);
      tl.fromTo(q('.ch-switch'), { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 0.7, ease: 'expo.out', immediateRender: false }, 2.9);
      tl.to(q('.ch-big'), { opacity: 1, duration: 0.3 }, 3.4);
      const big = q('.ch-big-n');
      tl.add(gsap.to(big, { duration: 1.2, scrambleText: { text: '數十億至數百億個', chars: '0123456789', speed: 0.8, revealDelay: 0.4 } }), 3.4);
      tl.call(() => sfx('boom'), null, 4.4);
      tl.fromTo(q('.ch-big-s'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', immediateRender: false }, 4.6);
      tl.call(() => this._chipLoops(root, ctx), null, 2.4);
    }

    if (n === 4) {
      // 鏡頭拉回手機：訊號經天線離開
      const [cx, cy] = this._cpu;
      const [ax, ay] = this._ant;
      swapTitle(0);
      tl.call(() => sfx('whooshOut'), null, 0);
      tl.to(Cc, { scale: 0.15, opacity: 0, transformOrigin: '476px 540px', duration: 0.9, ease: 'power3.in' }, 0);
      tl.set(Cc, { visibility: 'hidden' }, 0.9);
      tl.to(qa('.ch-lab, .ch-lead'), { opacity: 0, duration: 0.01 }, 0);
      tl.set(A, { visibility: 'visible', scale: 4, opacity: 0, transformOrigin: `${cx}px ${cy}px` }, 0.4);
      tl.to(A, { scale: 1, opacity: 1, duration: 1.2, ease: 'expo.out' }, 0.4);
      tl.set(q('.ch-sig'), { opacity: 1 }, 1.4);
      tl.fromTo(q('.ch-sig'), { drawSVG: 0 }, { drawSVG: '100%', duration: 1.0, ease: 'power2.inOut', immediateRender: false }, 1.4);
      tl.call(() => sfx('rise'), null, 1.4);
      tl.fromTo(q('.ch-ant-glow'), { opacity: 0, scale: 0, svgOrigin: `${ax} ${ay}` }, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(3)', immediateRender: false }, 2.3);
      tl.to(q('.ch-ant-lab'), { opacity: 1, duration: 0.4 }, 2.4);
      tl.call(() => { sfx('reveal'); this._waveLoop(root, ctx); }, null, 2.4);
      tl.fromTo(q('.ch-sigtxt'), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out', immediateRender: false }, 2.8);
    }

    if (instant) { tl.progress(1); this._cur = null; }
  },

  // CPU 執行三條指令：LOAD 5 → ADD 3 → STORE 05
  _fde(root, ctx, tl, t0, instant) {
    const q = s => root.querySelector(s);
    const sfx = name => { if (!instant) ctx.sfx.play(name); };
    const phases = [...root.querySelectorAll('.ch-ph')];
    const rows = [...root.querySelectorAll('.ch-row')];
    const pc = q('.ch-reg.pc b'), ir = q('.ch-reg.ir b'), dec = q('.ch-dec .v');
    const op = q('.ch-op'), acc = q('.ch-acc b'), mem5 = q('.ch-row.data .i');
    const pkt = q('.ch-pkt');
    const setPhase = p => phases.forEach((el, i) => { el.classList.toggle('on', i === p); el.classList.toggle('done', p === 9); });
    const IR = [1568, 484], ACC = [1625, 755];
    let t = t0;
    let accVal = { v: 0 };
    PROG.forEach((p, i) => {
      const ry = ROW_Y[i];
      // ① 擷取
      tl.call(() => { setPhase(0); rows.forEach((r, k) => r.classList.toggle('on', k === i)); sfx('tick'); }, null, t);
      tl.call(() => { pkt.textContent = p.ins; }, null, t);
      tl.set(pkt, { x: 600, y: ry, opacity: 0, scale: 0.6 }, t);
      tl.to(pkt, { opacity: 1, scale: 1, duration: 0.25, ease: 'back.out(2)' }, t + 0.05);
      tl.to(pkt, { keyframes: [{ x: 760, y: 574, duration: 0.3 }, { x: 1060, y: 574, duration: 0.35 }, { x: IR[0], y: IR[1], duration: 0.3 }], ease: 'power1.inOut' }, t + 0.3);
      tl.to(pkt, { opacity: 0, scale: 0.6, duration: 0.2 }, t + 1.25);
      tl.add(gsap.to(ir, { duration: 0.4, scrambleText: { text: p.ins, chars: '01', speed: 1 } }), t + 1.2);
      tl.add(gsap.to(pc, { duration: 0.3, scrambleText: { text: `0${p.a + 1}`, chars: '0123456789', speed: 1 } }), t + 1.25);
      tl.call(() => sfx('blip'), null, t + 1.25);
      // ② 解碼
      tl.call(() => { setPhase(1); sfx('tick'); }, null, t + 1.55);
      tl.add(gsap.to(dec, { duration: 0.45, scrambleText: { text: p.dec, chars: '01', speed: 1 } }), t + 1.6);
      // ③ 執行
      tl.call(() => { setPhase(2); sfx('tick'); }, null, t + 2.15);
      if (i === 0) {
        tl.call(() => { op.textContent = '→ 5'; }, null, t + 2.2);
        tl.to(accVal, { v: 5, duration: 0.5, ease: 'none', onUpdate: () => { acc.textContent = Math.round(accVal.v); } }, t + 2.2);
        tl.fromTo(acc, { scale: 1.4 }, { scale: 1, duration: 0.5, ease: 'back.out(3)', immediateRender: false }, t + 2.6);
        tl.call(() => sfx('pop'), null, t + 2.6);
      } else if (i === 1) {
        tl.call(() => { op.textContent = '5 + 3'; }, null, t + 2.2);
        tl.call(() => { op.textContent = '5 + 3 = 8'; }, null, t + 2.55);
        tl.to(accVal, { v: 8, duration: 0.45, ease: 'none', onUpdate: () => { acc.textContent = Math.round(accVal.v); } }, t + 2.55);
        tl.fromTo(acc, { scale: 1.4 }, { scale: 1, duration: 0.5, ease: 'back.out(3)', immediateRender: false }, t + 3.0);
        tl.call(() => sfx('pop'), null, t + 3.0);
      } else {
        tl.call(() => { pkt.textContent = '8'; }, null, t + 2.2);
        tl.set(pkt, { x: ACC[0], y: ACC[1], opacity: 0, scale: 0.6 }, t + 2.2);
        tl.to(pkt, { opacity: 1, scale: 1, duration: 0.2 }, t + 2.2);
        tl.to(pkt, { keyframes: [{ x: 1060, y: 574, duration: 0.4 }, { x: 760, y: 574, duration: 0.35 }, { x: 600, y: ROW_Y[3], duration: 0.3 }], ease: 'power1.inOut' }, t + 2.4);
        tl.to(pkt, { opacity: 0, scale: 0.6, duration: 0.2 }, t + 3.45);
        tl.call(() => { rows.forEach((r, k) => r.classList.toggle('on', k === 3)); sfx('success'); }, null, t + 3.45);
        tl.call(() => { mem5.textContent = '8'; }, null, t + 3.45);
        tl.fromTo(mem5, { scale: 1.6, color: '#ffffff' }, { scale: 1, color: '#fde68a', duration: 0.6, ease: 'back.out(3)', immediateRender: false }, t + 3.45);
      }
      tl.set(rows[i].querySelector('.ok'), { opacity: 1 }, t + (i === 2 ? 3.4 : 2.9));
      t += i === 2 ? 3.6 : 3.05;
    });
    tl.call(() => { setPhase(9); rows.forEach(r => r.classList.remove('on')); }, null, t + 0.2);
    tl.to(q('.ch-note'), { opacity: 1, duration: 0.6 }, t + 0.2);
    // 匯流排上的數據流動（背景循環）
    tl.call(() => ctx.track(gsap.fromTo(q('.ch-bus-flow'), { strokeDashoffset: 0 }, { strokeDashoffset: -88, duration: 1, ease: 'none', repeat: -1 })), null, t0);
  },

  // 晶片：電晶體閃動及開關循環
  _chipLoops(root, ctx) {
    if (this._loops) return;
    this._loops = true;
    ctx.onCleanup(() => { this._loops = false; });
    ctx.every(0.12, () => {
      for (let k = 0; k < 14; k++) { const i = Math.floor(Math.random() * this._cells.length); this._cells[i] ^= 1; }
      this._drawLens();
    });
    const blade = root.querySelector('.ch-blade');
    const led = root.querySelector('.ch-led'), glow = root.querySelector('.ch-led-glow'), bit = root.querySelector('.ch-bit');
    const cur = root.querySelector('.ch-sw-cur');
    const [on1, on0] = root.querySelectorAll('.ch-sw-row span');
    const set = on => {
      gsap.to(blade, { rotation: on ? 0 : -32, svgOrigin: '170 120', duration: 0.35, ease: 'back.out(2)' });
      gsap.to([led], { fill: on ? '#fbbf24' : '#2a2140', duration: 0.25 });
      gsap.to(glow, { opacity: on ? 0.35 : 0, duration: 0.25 });
      gsap.to(cur, { opacity: on ? 1 : 0, duration: 0.2 });
      bit.textContent = on ? '1' : '0';
      bit.setAttribute('fill', on ? '#1a1200' : '#7c86b2');
      on1.classList.toggle('lit', on); on0.classList.toggle('lit', !on);
    };
    let state = true;
    set(true);
    ctx.track(gsap.fromTo(cur, { strokeDashoffset: 0 }, { strokeDashoffset: -64, duration: 0.8, ease: 'none', repeat: -1 }));
    ctx.every(1.3, () => { state = !state; set(state); });
  },

  // 天線發出的電波
  _waveLoop(root, ctx) {
    const [ax, ay] = this._ant;
    root.querySelectorAll('.ch-wave').forEach((w, i) => {
      ctx.track(gsap.fromTo(w, { scale: 0.7, opacity: 1, svgOrigin: `${ax} ${ay}` }, { scale: 10, opacity: 0, duration: 2.4, ease: 'power1.out', repeat: -1 })).progress(i * 0.25);
    });
    const glow = root.querySelector('.ch-ant-glow');
    ctx.track(gsap.to(glow, { scale: 1.5, svgOrigin: `${ax} ${ay}`, duration: 0.6, yoyo: true, repeat: -1, ease: 'sine.inOut' }));
    const sig = root.querySelector('.ch-sig');
    ctx.track(gsap.fromTo(sig, { strokeDasharray: '14 30', strokeDashoffset: 0 }, { strokeDashoffset: -88, duration: 0.7, ease: 'none', repeat: -1 }));
  },
};
