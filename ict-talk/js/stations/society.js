// 09 社會層：E 社會影響（約 8 小時）
// 鏡頭由網絡層的地球向外拉，看見「人」：密碼強度測試器 → 帳戶被盜如何波及身邊的人 → 四大社會議題
// 步驟：1 輸入 123456　2 輸入 chan2010　3 輸入 Tiger!Moon$Rice7　4 鏡頭轉向社會議題及「科技人員的責任」
const gsap = window.gsap;

const DEMO = ['123456', 'chan2010', 'Tiger!Moon$Rice7'];
const RATE_LOG10 = 10; // 假設每秒嘗試 100 億（10^10）次
const COMMON = new Set(['123456', '1234567', '12345678', '123456789', '1234567890', '12345', '111111', '000000', '654321', '666666', '888888', '123123', 'password', 'password1', 'qwerty', 'qwerty123', 'abc123', 'iloveyou', 'admin', 'welcome', 'letmein', 'aa123456']);
const LEVELS = [
  { name: '—', color: '#7c86b2' },
  { name: '極弱', color: '#ff3d7f' },
  { name: '弱', color: '#fb923c' },
  { name: '中等', color: '#fbbf24' },
  { name: '強', color: '#a3e635' },
  { name: '極強', color: '#34d399' },
];
const ISSUES = [
  { k: 'priv', title: '私隱', color: '#22d3ee', x: 230, y: 285, icon: '<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/>', text: '分享相片前，先想一想：<br>會否洩露位置、學校及行蹤？' },
  { k: 'ip', title: '版權與知識產權', color: '#fbbf24', x: 230, y: 610, icon: '<circle cx="12" cy="12" r="10"/><path d="M14.83 14.83a4 4 0 1 1 0-5.66"/>', text: '網上找到的圖片、音樂和程式，<br>不等於可以隨意使用。' },
  { k: 'ai', title: '人工智能與深偽', color: '#a78bfa', x: 1370, y: 285, icon: '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01"/><path d="M15 9h.01"/>', text: 'AI 可生成以假亂真的影像，<br>分享前要先查證來源。' },
  { k: 'care', title: '網絡欺凌與健康使用', color: '#ff7ab2', x: 1370, y: 610, icon: '<path d="M19.414 14.414C21 12.828 22 11.5 22 9.5a5.5 5.5 0 0 0-9.591-3.676.6.6 0 0 1-.818.001A5.5 5.5 0 0 0 2 9.5c0 2.3 1.5 4 3 5.5l5.535 5.362a2 2 0 0 0 2.879.052 2.12 2.12 0 0 0-.004-3 2.124 2.124 0 1 0 3-3 2.124 2.124 0 0 0 3.004 0 2 2 0 0 0 0-2.828l-1.881-1.882a2.41 2.41 0 0 0-3.409 0l-1.71 1.71a2 2 0 0 1-2.828 0 2 2 0 0 1 0-2.828l2.823-2.762"/>', text: '尊重他人，不轉發傷人的內容；<br>善用科技，而不沉迷。' },
];
const CAPTIONS = {
  idle: '每一個帳戶背後，都連繫著身邊的人。',
  red: '帳戶被盜用：騙徒冒認你，<br>向你的朋友發出詐騙訊息。',
  green: '強密碼不只保護自己，也保護身邊的人。',
};
const LOCK_CLOSED = 'M7 11V7a5 5 0 0 1 10 0v4';
const LOCK_OPEN = 'M7 11V7a5 5 0 0 1 9.9-1';

// 社交網絡（舞台座標）
const NET = { cx: 1555, cy: 555, rx: 245, ry: 220 };
const NODES = Array.from({ length: 12 }, (_, i) => {
  const a = Math.PI + i * Math.PI / 6;
  return { x: NET.cx + NET.rx * Math.cos(a), y: NET.cy + NET.ry * Math.sin(a) };
});
const EDGES = [];
for (let i = 0; i < 12; i++) { EDGES.push([i, (i + 1) % 12]); EDGES.push([i, (i + 2) % 12]); }
// 由「你」（0 號）出發的感染路線：[父, 子, 層]
const SPREAD = [[0, 1, 1], [0, 11, 1], [0, 2, 1], [0, 10, 1], [2, 3, 2], [10, 9, 2], [2, 4, 2], [10, 8, 2]];
const CAM_MOVE = { x: -515, y: 40 }; // 第 4 步：鏡頭把地球移到畫面中央

// ---------- 密碼分析 ----------
function analyse(pw) {
  const chars = [...pw];
  const sets = {
    lower: /[a-z]/.test(pw), upper: /[A-Z]/.test(pw), digit: /[0-9]/.test(pw), symbol: /[^a-zA-Z0-9]/.test(pw),
  };
  const size = (sets.lower ? 26 : 0) + (sets.upper ? 26 : 0) + (sets.digit ? 10 : 0) + (sets.symbol ? 33 : 0);
  const len = chars.length;
  const lc = len && size ? len * Math.log10(size) : 0;
  const common = COMMON.has(pw.toLowerCase());
  const pattern = !common && /^[a-z]+(19|20)\d{2}$/i.test(pw);
  const ls = common ? -4 : lc - RATE_LOG10; // log10(秒)
  let level = 0;
  if (len) level = common || ls < 0 ? 1 : ls < 5 ? 2 : ls < 9.5 ? 3 : ls < 14 ? 4 : 5;
  const frac = !len ? 0 : Math.min(1, Math.pow(10, Math.log10(3600) - ls)); // 攻擊一小時可完成的比例
  return { pw, sets, size, len, lc, ls, common, pattern, level, frac, cracked: len > 0 && frac >= 1 };
}
function round2(v) {
  if (v >= 100) return Math.round(v / 10) * 10;
  if (v >= 2) return Math.round(v);
  return Math.round(v * 10) / 10;
}
function crackText(a) {
  if (!a.len) return { main: '—', sub: '請輸入一個密碼' };
  if (a.common) return { main: '即時被破解', sub: '最常見的密碼之一，攻擊者第一批就會試。' };
  if (a.ls < 0) return { main: '即時被破解', sub: '少於 1 秒便試完所有組合。' };
  if (a.ls > 300) return { main: '遠超宇宙年齡', sub: '比宇宙年齡（約 138 億年）還要長。' };
  const s = Math.pow(10, a.ls);
  const y = s / 31557600;
  let main;
  if (s < 60) main = `約 ${round2(s)} 秒`;
  else if (s < 3600) main = `約 ${round2(s / 60)} 分鐘`;
  else if (s < 86400) main = `約 ${round2(s / 3600)} 小時`;
  else if (y < 1) main = `約 ${round2(s / 86400)} 日`;
  else if (y < 1e4) main = `約 ${round2(y).toLocaleString('en-US')} 年`;
  else if (y < 1e8) main = `約 ${round2(y / 1e4)} 萬年`;
  else if (y < 1e12) main = `約 ${round2(y / 1e8)} 億年`;
  else if (y < 1e16) main = `約 ${round2(y / 1e12)} 萬億年`;
  else main = '遠超宇宙年齡';
  let sub = '';
  if (y > 1.38e10) sub = '比宇宙年齡（約 138 億年）還要長。';
  else if (a.pattern) sub = '而且「名字＋年份」是常見組合，實際更快。';
  else if (s < 3600) sub = '攻擊者一小時內便可試完所有組合。';
  else if (y < 100) sub = '電腦愈來愈快，這個時間會愈來愈短。';
  else sub = '加長密碼，是最有效的做法。';
  return { main, sub };
}
function comboHTML(a) {
  if (!a.len) return '—';
  if (a.lc < 7) return `${a.size}<sup>${a.len}</sup> ＝ ${Math.round(Math.pow(10, a.lc)).toLocaleString('en-US')}`;
  const e = Math.floor(a.lc);
  let m = Math.pow(10, a.lc - e);
  m = Math.round(m * 10) / 10;
  return `${a.size}<sup>${a.len}</sup> ≈ ${m.toFixed(1)} × 10<sup>${e}</sup>`;
}

// ---------- 點陣地球（世界陸地資料，模組內快取） ----------
let LAND = null, landPromise = null;
function loadLand() {
  if (LAND) return Promise.resolve(LAND);
  if (landPromise) return landPromise;
  landPromise = fetch(new URL('../../vendor/world/land-110m.json', import.meta.url))
    .then(r => r.json())
    .then(topo => { LAND = landDots(topo); return LAND; })
    .catch(err => { console.warn('地球資料載入失敗，改用簡化地球', err); landPromise = null; return null; });
  return landPromise;
}
function landDots(topo) {
  const [sx, sy] = topo.transform.scale, [tx, ty] = topo.transform.translate;
  const arcs = topo.arcs.map(arc => { let x = 0, y = 0; return arc.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty]; }); });
  const ring = idx => { const out = []; idx.forEach((i, k) => { const a = i < 0 ? arcs[~i].slice().reverse() : arcs[i]; for (let j = k ? 1 : 0; j < a.length; j++) out.push(a[j]); }); return out; };
  const obj = topo.objects.land;
  const geoms = obj.type === 'GeometryCollection' ? obj.geometries : [obj];
  const polys = [];
  geoms.forEach(g => {
    const list = g.type === 'Polygon' ? [g.arcs] : g.type === 'MultiPolygon' ? g.arcs : [];
    list.forEach(p => {
      const rings = p.map(ring);
      let x0 = 180, x1 = -180, y0 = 90, y1 = -90;
      rings[0].forEach(([x, y]) => { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; });
      polys.push({ rings, x0, x1, y0, y1 });
    });
  });
  const inside = (lon, lat) => {
    for (const p of polys) {
      if (lon < p.x0 || lon > p.x1 || lat < p.y0 || lat > p.y1) continue;
      let c = false;
      for (const r of p.rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
        const [xi, yi] = r[i], [xj, yj] = r[j];
        if ((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) c = !c;
      }
      if (c) return true;
    }
    return false;
  };
  const pts = [];
  const STEP = 2.3;
  for (let lat = -56; lat <= 82; lat += STEP) {
    const dl = STEP / Math.max(0.22, Math.cos(lat * Math.PI / 180));
    for (let lon = -180; lon < 180; lon += dl) if (inside(lon, lat)) pts.push(lon * Math.PI / 180, lat * Math.PI / 180);
  }
  return new Float32Array(pts);
}

export default {
  id: 'society',
  title: '社會層：E 社會影響',
  short: '社會層',
  module: 'E',
  accent: '#34d399',
  layer: 'world',
  tint: ['#34d399', '#60a5fa'],
  transition: { type: 'zoomOut', focus: '.soc-origin' },
  steps: 4,
  minutes: 1.25,
  notes: `【社會層：E 社會影響（約 8 小時）】
進場：鏡頭由網絡層的地球向外拉，看見地球四周的「人」。可以說：「網絡把全世界連在一起，但科技同時帶來不少社會問題。E 單元就是討論這些問題。」

1. 按 →：測試器自動輸入「123456」。先問同學：「有沒有人用過這個密碼？」它是最常見的密碼之一，即時被破解。右邊的人際網絡隨即變紅：帳戶被盜用後，騙徒會冒認你，向你的朋友發出詐騙訊息。
2. 按 →：輸入「chan2010」（英文姓氏＋年份）。指出：只有小寫字母及數字，約 5 分鐘便可試完所有組合；而且「名字＋年份」是常見組合，實際更快。
3. 按 →：輸入「Tiger!Moon$Rice7」（三個英文字＋符號＋數字，共 16 個字元）。打字時強度條逐格上升，估計破解時間遠比宇宙年齡長。網絡全部轉為綠色，並介紹三個小貼士：長度比複雜更重要、不同網站用不同密碼、開啟雙重認證。
   互動：可請同學提議一個「假」密碼，老師點擊輸入框即場輸入，強度會即時更新（按 Esc 離開輸入框後再按 → 繼續）。提醒同學不要說出自己真正使用的密碼。
4. 按 →：鏡頭轉向四個社會議題：私隱、版權與知識產權、人工智能與深偽、網絡欺凌與健康使用。可以問：「你見過 AI 造出來的假影片嗎？怎樣分辨？」
結語：「科技人員的責任：創造科技的人，更要顧及它對社會的影響。」

備註：破解時間以「字元種類的數目 ^ 長度」及「每秒嘗試 100 億次」粗略估算，只作示意。`,

  build(root, ctx) {
    const nodesSVG = NODES.map((p, i) => i === 0
      ? `<g class="nd nd-you" data-i="0" transform="translate(${p.x},${p.y})"><circle class="nd-halo" r="62"/><circle class="nd-c" r="36"/><text class="nd-t" y="10">你</text></g>`
      : `<g class="nd" data-i="${i}" transform="translate(${p.x},${p.y})"><circle class="nd-c" r="26"/><g class="nd-g"><circle cx="0" cy="-6" r="6.5"/><path d="M-11,13 a11,9 0 0 1 22,0"/></g></g>`).join('');
    const edgesSVG = EDGES.map(([a, b]) => `<line class="ed" data-e="${a}-${b}" x1="${NODES[a].x}" y1="${NODES[a].y}" x2="${NODES[b].x}" y2="${NODES[b].y}"/>`).join('');
    const spokesSVG = NODES.map((p, i) => {
      const ang = Math.atan2(p.y - NET.cy, p.x - NET.cx);
      const sx = NET.cx + Math.cos(ang) * 112, sy = NET.cy + Math.sin(ang) * 112;
      return `<line class="sp" x1="${sx.toFixed(1)}" y1="${sy.toFixed(1)}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" data-i="${i}"/>`;
    }).join('');

    root.innerHTML = `
      <svg class="soc-lines" width="1920" height="1080" viewBox="0 0 1920 1080" aria-hidden="true"></svg>
      <div class="soc-cam">
        <svg class="soc-net" width="1920" height="1080" viewBox="0 0 1920 1080" aria-hidden="true">
          <defs>
            <radialGradient id="socYou"><stop offset=".45" stop-color="#34d399" stop-opacity=".55"/><stop offset="1" stop-color="#34d399" stop-opacity="0"/></radialGradient>
            <radialGradient id="socAura"><stop offset="0" stop-color="#34d399" stop-opacity=".22"/><stop offset=".55" stop-color="#60a5fa" stop-opacity=".06"/><stop offset="1" stop-color="#60a5fa" stop-opacity="0"/></radialGradient>
          </defs>
          <ellipse class="soc-aura" cx="${NET.cx}" cy="${NET.cy}" rx="380" ry="350" fill="url(#socAura)"/>
          <ellipse class="soc-orbit" cx="${NET.cx}" cy="${NET.cy}" rx="${NET.rx}" ry="${NET.ry}"/>
          <g class="spokes">${spokesSVG}</g>
          <g class="edges">${edgesSVG}</g>
          <ellipse class="soc-wave" cx="${NET.cx}" cy="${NET.cy}" rx="10" ry="10"/>
          <g class="packets"></g>
          <g class="pulses"></g>
          <g class="nodes">${nodesSVG}</g>
        </svg>
        <div class="soc-globe soc-origin"><canvas width="440" height="440"></canvas></div>
        <div class="soc-caption"><span class="cap-dot"></span><span class="cap-t" data-state="idle">${CAPTIONS.idle}</span></div>

        <div class="soc-panel panel">
          <div class="sp-top"><span class="sp-title">密碼強度測試器</span><span class="chip">假設每秒嘗試 100 億次</span></div>
          <label class="sp-input">
            <svg viewBox="0 0 24 24" class="sp-key"><path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/></svg>
            <input type="text" spellcheck="false" autocomplete="off" autocapitalize="off" placeholder="按 → 示範，或在此輸入" aria-label="輸入密碼測試強度">
          </label>
          <div class="sp-cols">
            <div class="sp-left">
              <div class="sp-strength"><div class="sp-bar"><i></i><i></i><i></i><i></i><i></i></div><b class="sp-level">—</b></div>
              <div class="sp-sets">
                <span class="cs" data-k="lower"><b>a–z</b>小寫</span>
                <span class="cs" data-k="upper"><b>A–Z</b>大寫</span>
                <span class="cs" data-k="digit"><b>0–9</b>數字</span>
                <span class="cs" data-k="symbol"><b>!$#</b>符號</span>
              </div>
              <div class="sp-combo"><span class="lbl">可能組合數目</span><span class="val">—</span></div>
              <div class="sp-time"><span class="lbl">估計破解時間</span><b class="val">—</b><span class="sub">請輸入一個密碼</span></div>
            </div>
            <div class="sp-right">
              <div class="lbl">模擬攻擊 1 小時</div>
              <svg class="sp-ring" viewBox="0 0 240 240">
                <circle class="trk" cx="120" cy="120" r="104"/>
                <circle class="arc-glow" cx="120" cy="120" r="104" transform="rotate(-90 120 120)"/>
                <circle class="arc" cx="120" cy="120" r="104" transform="rotate(-90 120 120)"/>
                <g class="lock" transform="translate(76.8 78) scale(3.6)">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                  <path class="shackle" d="${LOCK_CLOSED}"/>
                  <circle class="hole" cx="12" cy="16.5" r="1.3"/>
                </g>
              </svg>
              <div class="sp-status">等待輸入</div>
              <div class="sp-tick">&nbsp;</div>
            </div>
          </div>
        </div>
        <div class="soc-tips">
          <span class="tip"><b>1</b>長度比複雜更重要</span>
          <span class="tip"><b>2</b>不同網站用不同密碼</span>
          <span class="tip"><b>3</b>開啟雙重認證</span>
        </div>
      </div>

      <div class="station-head">
        <div class="kicker">MODULE E · 社會影響 · 約 8 小時</div>
        <h1 class="h1">社會層：<span class="grad-e">科技與人</span></h1>
      </div>

      <div class="soc-issues">
        ${ISSUES.map(c => `
          <div class="iss panel" data-k="${c.k}" style="left:${c.x}px;top:${c.y}px;--c:${c.color}">
            <div class="iss-h"><span class="iss-ic"><svg viewBox="0 0 24 24">${c.icon}</svg></span><span class="iss-t">${c.title}</span></div>
            <p class="iss-p">${c.text}</p>
          </div>`).join('')}
      </div>
      <div class="soc-banner-wrap"><div class="soc-banner panel glow-edge"><b>科技人員的責任：</b>創造科技的人，更要顧及它對社會的影響。</div></div>
    `;

    const css = document.createElement('style');
    css.textContent = `
      .st-society .station-head { left: 200px; z-index: 5; }
      .st-society .kicker { font-size: 24px; }
      .st-society .grad-e { background: linear-gradient(100deg, #34d399, #60a5fa 70%); -webkit-background-clip: text; background-clip: text; color: transparent; }
      .st-society .soc-lines { position: absolute; left: 0; top: 0; z-index: 1; pointer-events: none; overflow: visible; }
      .st-society .soc-lines path { fill: none; stroke-width: 3; stroke-linecap: round; opacity: .55; }
      .st-society .soc-cam { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; z-index: 2; transform-origin: 0 0; }
      .st-society .soc-net { position: absolute; left: 0; top: 0; overflow: visible; pointer-events: none; }
      .st-society .soc-orbit { fill: none; stroke: rgba(52, 211, 153, .18); stroke-width: 2; stroke-dasharray: 3 9; }
      .st-society .sp { stroke: rgba(125, 211, 252, .22); stroke-width: 2; stroke-dasharray: 4 7; }
      .st-society .ed { stroke: rgba(160, 180, 255, .26); stroke-width: 2.5; }
      .st-society .ed.red { stroke: rgba(255, 61, 127, .75); }
      .st-society .ed.green { stroke: rgba(52, 211, 153, .5); }
      .st-society .soc-wave { fill: none; stroke: #34d399; stroke-width: 6; opacity: 0; }
      .st-society .packets circle { fill: #a5f3fc; stroke: rgba(125, 211, 252, .35); stroke-width: 6; }
      .st-society .pulses circle { fill: #ff8fb1; stroke: rgba(255, 61, 127, .45); stroke-width: 10; }
      .st-society .nd-c { fill: #0c1733; stroke: #7dd3fc; stroke-width: 3; }
      .st-society .nd-g { fill: none; stroke: #cfe3ff; stroke-width: 2.6; stroke-linecap: round; }
      .st-society .nd-g circle { fill: #cfe3ff; stroke: none; }
      .st-society .nd-you .nd-c { stroke: #34d399; stroke-width: 4; fill: #08261e; }
      .st-society .nd-halo { fill: url(#socYou); }
      .st-society .nd-t { font: 900 30px var(--font); fill: #eafff6; text-anchor: middle; }
      .st-society .soc-globe { position: absolute; left: ${NET.cx - 110}px; top: ${NET.cy - 110}px; width: 220px; height: 220px; border-radius: 50%; box-shadow: 0 0 70px rgba(52, 211, 153, .35), 0 0 140px rgba(96, 165, 250, .25); }
      .st-society .soc-globe canvas { width: 220px; height: 220px; display: block; }
      .st-society .soc-caption { position: absolute; left: ${NET.cx - 270}px; top: 838px; width: 540px; display: flex; gap: 14px; align-items: flex-start; font-size: 28px; line-height: 1.45; color: var(--ink); font-weight: 700; }
      .st-society .cap-dot { flex: none; width: 14px; height: 14px; margin-top: 13px; border-radius: 50%; background: #7dd3fc; box-shadow: 0 0 12px #7dd3fc; }

      .st-society .soc-panel { position: absolute; left: 200px; top: 248px; width: 980px; padding: 32px 40px 34px; }
      .st-society .sp-top { display: flex; align-items: center; justify-content: space-between; height: 46px; }
      .st-society .sp-title { font-size: 32px; font-weight: 800; color: var(--ink); }
      .st-society .chip { font-size: 24px; }
      .st-society .sp-input { display: flex; align-items: center; gap: 20px; margin-top: 18px; height: 108px; padding: 0 30px; border-radius: 20px; background: #050816; border: 2px solid var(--line-strong); box-shadow: inset 0 0 30px rgba(0, 0, 0, .5); cursor: text; transition: border-color .3s, box-shadow .3s; }
      .st-society .sp-input:focus-within { border-color: var(--accent); box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 25%, transparent), inset 0 0 30px rgba(0, 0, 0, .5); }
      .st-society .sp-key { width: 48px; height: 48px; flex: none; fill: none; stroke: var(--accent); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
      .st-society .sp-input input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: #f5f7ff; font: 700 56px/1 var(--mono); letter-spacing: .04em; caret-color: var(--accent); }
      .st-society .sp-input input::placeholder { color: #5b6590; font: 500 34px var(--font); letter-spacing: 0; }
      .st-society .sp-cols { display: flex; gap: 34px; margin-top: 26px; }
      .st-society .sp-left { flex: 1; min-width: 0; }
      .st-society .sp-right { width: 270px; flex: none; text-align: center; }
      .st-society .sp-strength { display: flex; align-items: center; gap: 24px; height: 44px; }
      .st-society .sp-bar { flex: 1; display: flex; gap: 8px; height: 22px; }
      .st-society .sp-bar i { flex: 1; border-radius: 6px; background: rgba(255, 255, 255, .08); }
      .st-society .sp-level { width: 96px; font-size: 34px; font-weight: 900; color: var(--ink-3); text-align: right; }
      .st-society .sp-sets { display: flex; gap: 12px; margin-top: 20px; }
      .st-society .cs { display: inline-flex; align-items: baseline; gap: 8px; padding: 6px 14px; border-radius: 12px; font-size: 24px; font-weight: 700; color: var(--ink-3); border: 1.5px solid var(--line); background: rgba(255, 255, 255, .03); }
      .st-society .cs b { font: 700 24px var(--mono); }
      .st-society .cs.on { color: #05060f; background: var(--accent); border-color: transparent; box-shadow: 0 0 18px color-mix(in srgb, var(--accent) 50%, transparent); }
      .st-society .sp-combo { margin-top: 22px; }
      .st-society .lbl { display: block; font-size: 24px; color: var(--ink-3); font-weight: 600; }
      .st-society .sp-combo .val { display: block; margin-top: 4px; font: 700 40px/1.3 var(--mono); color: var(--ink); white-space: nowrap; }
      .st-society .sp-combo .val sup { font-size: 24px; line-height: 0; }
      .st-society .sp-time { margin-top: 20px; }
      .st-society .sp-time .val { display: block; margin-top: 2px; font-size: 70px; line-height: 1.15; font-weight: 900; color: var(--ink-2); white-space: nowrap; }
      .st-society .sp-time .sub { display: block; font-size: 26px; line-height: 1.4; color: var(--ink-2); min-height: 36px; }
      .st-society .sp-right .lbl { color: var(--ink-2); }
      .st-society .sp-ring { width: 236px; height: 236px; display: block; margin: 8px auto 0; overflow: visible; }
      .st-society .sp-ring .trk { fill: rgba(5, 8, 22, .6); stroke: rgba(255, 255, 255, .08); stroke-width: 16; }
      .st-society .sp-ring .arc { fill: none; stroke: #ff3d7f; stroke-width: 16; stroke-linecap: round; }
      .st-society .sp-ring .arc-glow { fill: none; stroke: #ff3d7f; stroke-width: 34; stroke-linecap: round; opacity: .22; }
      .st-society .sp-ring .lock { fill: none; stroke: #b4bce0; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
      .st-society .sp-ring .lock .hole { fill: #b4bce0; stroke: none; }
      .st-society .sp-status { margin-top: 10px; font-size: 30px; font-weight: 800; color: var(--ink-3); white-space: nowrap; }
      .st-society .sp-tick { margin-top: 4px; font: 700 28px var(--mono); color: var(--ink-3); white-space: nowrap; overflow: hidden; }

      .st-society .soc-tips { position: absolute; left: 200px; top: 914px; width: 980px; display: flex; gap: 16px; }
      .st-society .tip { display: inline-flex; align-items: center; gap: 12px; padding: 10px 22px 10px 12px; border-radius: 999px; font-size: 26px; font-weight: 700; color: var(--ink); background: rgba(52, 211, 153, .1); border: 1.5px solid rgba(52, 211, 153, .5); opacity: 0; }
      .st-society .tip b { display: inline-grid; place-items: center; width: 38px; height: 38px; border-radius: 50%; background: var(--accent); color: #05060f; font: 900 24px var(--mono); }

      .st-society .soc-issues { position: absolute; inset: 0; z-index: 3; pointer-events: none; }
      .st-society .iss { position: absolute; width: 480px; height: 262px; padding: 26px 30px; opacity: 0; border-color: color-mix(in srgb, var(--c) 45%, transparent); box-shadow: 0 0 40px color-mix(in srgb, var(--c) 18%, transparent), 0 24px 80px rgba(0, 0, 0, .4); background: linear-gradient(160deg, color-mix(in srgb, var(--c) 14%, rgba(10, 14, 34, .92)), rgba(10, 14, 34, .9)); }
      .st-society .iss-h { display: flex; align-items: center; gap: 18px; }
      .st-society .iss-ic { width: 68px; height: 68px; flex: none; display: grid; place-items: center; border-radius: 18px; background: var(--c); box-shadow: 0 0 26px color-mix(in srgb, var(--c) 55%, transparent); }
      .st-society .iss-ic svg { width: 40px; height: 40px; fill: none; stroke: #05060f; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
      .st-society .iss-t { font-size: 36px; font-weight: 900; color: var(--ink); line-height: 1.2; }
      .st-society .iss-p { margin: 18px 0 0; font-size: 28px; line-height: 1.5; color: var(--ink-2); }
      .st-society .soc-banner-wrap { position: absolute; left: 0; right: 0; top: 910px; z-index: 4; display: flex; justify-content: center; pointer-events: none; }
      .st-society .soc-banner { white-space: nowrap; padding: 20px 44px; font-size: 34px; font-weight: 700; color: var(--ink); opacity: 0; }
      .st-society .soc-banner b { color: var(--accent); font-weight: 900; }
    `;
    root.appendChild(css);

    this._ctx = ctx;
    this._root = root;
    const S = this._s = {
      input: root.querySelector('.sp-input input'),
      bars: [...root.querySelectorAll('.sp-bar i')],
      level: root.querySelector('.sp-level'),
      sets: [...root.querySelectorAll('.cs')],
      combo: root.querySelector('.sp-combo .val'),
      timeVal: root.querySelector('.sp-time .val'),
      timeSub: root.querySelector('.sp-time .sub'),
      arc: root.querySelectorAll('.sp-ring .arc, .sp-ring .arc-glow'),
      lock: root.querySelector('.sp-ring .lock'),
      shackle: root.querySelector('.sp-ring .shackle'),
      status: root.querySelector('.sp-status'),
      tick: root.querySelector('.sp-tick'),
      cam: root.querySelector('.soc-cam'),
      nodes: [...root.querySelectorAll('.nd')],
      edges: [...root.querySelectorAll('.ed')],
      caption: root.querySelector('.cap-t'),
      capDot: root.querySelector('.cap-dot'),
      ticker: null, open: false, last: null, anim: null, animN: 0,
      netState: 'idle',
    };
    gsap.set(S.arc, { drawSVG: '0% 0%' });
    this._update('', { instant: true });

    // 老師可即場輸入
    ctx.listen(S.input, 'input', () => this._update(S.input.value, { live: true }));

    // 點陣地球
    this._globe(root.querySelector('.soc-globe canvas'), ctx);
  },

  enter(root, ctx, { instant }) {
    const head = root.querySelector('.station-head');
    const panel = root.querySelector('.soc-panel');
    const nodes = root.querySelectorAll('.nd');
    const lines = root.querySelectorAll('.ed');
    const spokes = root.querySelectorAll('.sp');
    const cap = root.querySelector('.soc-caption');
    this._ambient(root, ctx);
    if (instant) return;
    const tl = ctx.tl();
    tl.from(head, { opacity: 0, y: 30, duration: 0.9, ease: 'expo.out' }, 0.5)
      .from(panel, { opacity: 0, x: -80, duration: 1.1, ease: 'expo.out' }, 0.7)
      .from(lines, { drawSVG: '0%', duration: 1.1, stagger: 0.02, ease: 'power2.out' }, 0.6)
      .from(spokes, { opacity: 0, duration: 0.8, stagger: 0.04 }, 0.9)
      .from(nodes, { opacity: 0, scale: 0, transformOrigin: '50% 50%', duration: 0.6, stagger: 0.05, ease: 'back.out(2.4)' }, 0.8)
      .from(cap, { opacity: 0, y: 20, duration: 0.8, ease: 'expo.out' }, 1.4);
    tl.call(() => ctx.sfx.play('pop'), null, 0.9);
  },

  step(root, ctx, n, { instant }) {
    const S = this._s;
    // 上一步的動畫仍在播放 → 立即完成
    if (S.anim) { S.anim.kill(); S.anim = null; this._final(root, ctx, S.animN); }
    if (instant) { this._final(root, ctx, n); return; }
    S.animN = n;
    S.anim = n <= 3 ? this._playType(root, ctx, n) : this._playIssues(root, ctx);
    S.anim.eventCallback('onComplete', () => { S.anim = null; });
  },

  // ---------- 即時呈現第 n 步完成狀態 ----------
  _final(root, ctx, n) {
    const S = this._s;
    if (n <= 3) {
      S.input.value = DEMO[n - 1];
      this._update(DEMO[n - 1], { instant: true });
      this._setNet(n === 3 ? 'green' : 'red', true);
      if (n === 3) gsap.set(root.querySelectorAll('.tip'), { opacity: 1, y: 0, scale: 1 });
      return;
    }
    // 第 4 步：鏡頭轉向社會議題
    gsap.set(S.cam, { x: CAM_MOVE.x, y: CAM_MOVE.y });
    gsap.set([root.querySelector('.soc-panel'), root.querySelector('.soc-tips'), root.querySelector('.soc-caption')], { opacity: 0 });
    gsap.set(root.querySelectorAll('.iss'), { opacity: 1, x: 0, y: 0, scale: 1 });
    if (!root.querySelector('.soc-lines path')) gsap.set(this._issueLines(root, ctx), { drawSVG: '0% 100%' });
    gsap.set(root.querySelector('.soc-banner'), { opacity: 1, y: 0 });
  },

  // ---------- 第 1–3 步：自動輸入密碼 ----------
  _playType(root, ctx, n) {
    const S = this._s;
    const pw = DEMO[n - 1];
    const chars = [...pw];
    const tl = ctx.tl();
    const cps = n === 3 ? 0.1 : 0.14;
    // 先清空，網絡回到原狀
    tl.call(() => { S.input.value = ''; this._update('', {}); this._setNet('idle', false); }, null, 0);
    tl.fromTo(S.input.parentNode, { scale: 1 }, { scale: 1.02, duration: 0.15, yoyo: true, repeat: 1, transformOrigin: '50% 50%' }, 0);
    chars.forEach((c, i) => {
      tl.call(() => {
        S.input.value = chars.slice(0, i + 1).join('');
        this._update(S.input.value, {});
        ctx.sfx.play('type');
      }, null, 0.35 + i * cps);
    });
    const tEnd = 0.35 + chars.length * cps + 0.35;
    const a = analyse(pw);
    if (a.cracked) {
      tl.call(() => ctx.sfx.play('error'), null, tEnd);
      tl.fromTo(root.querySelector('.sp-ring'), { x: 0 }, { x: 10, duration: 0.05, repeat: 7, yoyo: true, ease: 'none', clearProps: 'x' }, tEnd);
      tl.fromTo(S.timeVal, { scale: 1.25, transformOrigin: '0% 50%' }, { scale: 1, duration: 0.6, ease: 'back.out(3)' }, tEnd);
      tl.add(this._spreadRed(root, ctx), tEnd + 0.3);
      tl.call(() => this._setCaption('red', false), null, tEnd + 0.3);
    } else {
      tl.call(() => ctx.sfx.play('success'), null, tEnd);
      tl.fromTo(S.timeVal, { scale: 1.2, transformOrigin: '0% 50%' }, { scale: 1, duration: 0.7, ease: 'back.out(3)' }, tEnd);
      tl.add(this._greenWave(root, ctx), tEnd + 0.2);
      tl.fromTo(root.querySelectorAll('.tip'), { opacity: 0, y: 30, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.18, ease: 'back.out(2)' }, tEnd + 1.0);
      tl.call(() => ctx.sfx.play('pop'), null, tEnd + 1.0);
    }
    tl.call(() => this._final(root, ctx, n));
    return tl;
  },

  // 由「你」出發，紅色訊號沿網絡擴散
  _spreadRed(root, ctx) {
    const S = this._s;
    const tl = gsap.timeline();
    const g = root.querySelector('.pulses');
    SPREAD.forEach(([p, c, d], k) => {
      const at = (d - 1) * 0.6 + (k % 4) * 0.06;
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('r', 9);
      tl.call(() => { g.appendChild(dot); }, null, at);
      tl.fromTo(dot, { attr: { cx: NODES[p].x, cy: NODES[p].y } }, { attr: { cx: NODES[c].x, cy: NODES[c].y }, duration: 0.5, ease: 'power1.in' }, at);
      tl.call(() => {
        dot.remove();
        this._nodeState(c, 'red', false);
        const e = this._edge(p, c); if (e) e.classList.add('red');
        if (d === 1 && k === 0) ctx.sfx.play('glitch');
      }, null, at + 0.5);
    });
    tl.call(() => this._nodeState(0, 'red', false), null, 0);
    return tl;
  },

  _greenWave(root, ctx) {
    const wave = root.querySelector('.soc-wave');
    const tl = gsap.timeline();
    tl.fromTo(wave, { attr: { rx: 40, ry: 36 }, opacity: 0.9 }, { attr: { rx: 330, ry: 300 }, opacity: 0, duration: 1.2, ease: 'power2.out' }, 0);
    NODES.forEach((p, i) => {
      const d = Math.hypot(p.x - NODES[0].x, p.y - NODES[0].y);
      tl.call(() => this._nodeState(i, 'green', false), null, d / 900);
    });
    tl.call(() => { this._s.edges.forEach(e => { e.classList.remove('red'); e.classList.add('green'); }); this._setCaption('green', false); }, null, 0.3);
    return tl;
  },

  // ---------- 第 4 步：鏡頭轉向社會議題 ----------
  _playIssues(root, ctx) {
    const S = this._s;
    const tl = ctx.tl();
    const panelEls = [root.querySelector('.soc-panel'), root.querySelector('.soc-tips'), root.querySelector('.soc-caption')];
    ctx.sfx.play('whoosh');
    tl.to(panelEls, { opacity: 0, duration: 0.7, ease: 'power2.in' }, 0)
      .to(S.cam, { x: CAM_MOVE.x, y: CAM_MOVE.y, duration: 1.4, ease: 'expo.inOut' }, 0)
      .fromTo(root.querySelector('.soc-globe'), { scale: 1 }, { scale: 1.12, duration: 0.5, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 0.9);

    const gx = NET.cx + CAM_MOVE.x, gy = NET.cy + CAM_MOVE.y;
    root.querySelectorAll('.iss').forEach((card, i) => {
      const cx = parseFloat(card.style.left) + 240, cy = parseFloat(card.style.top) + 131;
      const at = 1.35 + i * 0.22;
      tl.fromTo(card, { opacity: 0, x: gx - cx, y: gy - cy, scale: 0.15 }, { opacity: 1, x: 0, y: 0, scale: 1, duration: 0.9, ease: 'expo.out' }, at);
      tl.call(() => ctx.sfx.play('pop'), null, at);
    });
    tl.add(() => {
      const paths = this._issueLines(root, ctx);
      ctx.track(gsap.fromTo(paths, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 0.9, stagger: 0.15, ease: 'power2.out' }));
    }, 1.5);
    tl.fromTo(root.querySelector('.soc-banner'), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out' }, 2.7);
    tl.call(() => ctx.sfx.play('reveal'), null, 2.7);
    tl.call(() => this._final(root, ctx, 4));
    return tl;
  },

  // 議題卡與地球之間的連線（鏡頭移動後的舞台座標）
  _issueLines(root, ctx) {
    const svg = root.querySelector('.soc-lines');
    if (svg.childElementCount) return [...svg.querySelectorAll('path')];
    const gx = NET.cx + CAM_MOVE.x, gy = NET.cy + CAM_MOVE.y;
    svg.innerHTML = ISSUES.map(c => {
      const left = c.x < 960;
      const ex = left ? c.x + 480 : c.x, ey = c.y + 131;
      const ang = Math.atan2(ey - gy, ex - gx);
      const sx = gx + Math.cos(ang) * 120, sy = gy + Math.sin(ang) * 120;
      const mx = (sx + ex) / 2;
      return `<path d="M${sx.toFixed(1)},${sy.toFixed(1)} C${mx.toFixed(1)},${sy.toFixed(1)} ${mx.toFixed(1)},${ey} ${ex},${ey}" stroke="${c.color}"/>`;
    }).join('') + ISSUES.map(c => `<circle r="7" fill="${c.color}" style="color:${c.color}" opacity="0"/>`).join('');
    const paths = [...svg.querySelectorAll('path')];
    // 小光點由地球沿線流向議題卡
    svg.querySelectorAll('circle').forEach((dot, i) => {
      ctx.track(gsap.fromTo(dot, { opacity: 0 }, { opacity: 1, duration: 0.3, delay: 0.8 + i * 0.2 }));
      ctx.track(gsap.to(dot, { motionPath: { path: paths[i], align: paths[i], alignOrigin: [0.5, 0.5] }, duration: 1.8, repeat: -1, ease: 'none', delay: i * 0.45 }));
    });
    return paths;
  },

  // ---------- 更新測試器 ----------
  _update(pw, { instant = false, live = false } = {}) {
    const S = this._s;
    const a = analyse(pw);
    const L = LEVELS[a.level];
    const d = instant ? 0 : 0.35;
    S.bars.forEach((b, i) => {
      const on = i < a.level;
      gsap.to(b, { backgroundColor: on ? L.color : 'rgba(255,255,255,0.08)', boxShadow: on ? `0 0 14px ${L.color}` : '0 0 0px rgba(0,0,0,0)', duration: d, delay: instant ? 0 : i * 0.03, overwrite: 'auto' });
    });
    S.level.textContent = L.name;
    S.level.style.color = L.color;
    S.sets.forEach(el => el.classList.toggle('on', !!a.sets[el.dataset.k] && a.len > 0));
    S.combo.innerHTML = comboHTML(a);
    const t = crackText(a);
    S.timeVal.textContent = t.main;
    S.timeVal.style.color = a.len ? L.color : '';
    S.timeSub.textContent = t.sub;
    // 攻擊進度環
    const color = !a.len ? '#7c86b2' : a.cracked ? '#ff3d7f' : a.level >= 4 ? '#34d399' : '#fbbf24';
    const pct = a.cracked ? 100 : Math.max(0, a.frac * 100);
    gsap.to(S.arc, { drawSVG: `0% ${pct}%`, stroke: color, duration: instant ? 0 : 0.5, ease: 'power2.out', overwrite: 'auto' });
    gsap.to(S.lock, { stroke: color, duration: d, overwrite: 'auto' });
    gsap.set(S.lock.querySelector('.hole'), { fill: color });
    if (a.cracked !== S.open) {
      S.open = a.cracked;
      gsap.to(S.shackle, { morphSVG: a.cracked ? LOCK_OPEN : LOCK_CLOSED, duration: instant ? 0 : 0.35, ease: 'back.out(3)', overwrite: 'auto' });
      if (!instant && live && a.cracked) this._ctx?.sfx.play('error');
    }
    S.status.textContent = !a.len ? '等待輸入' : a.cracked ? '一小時內被破解' : '一小時內未能破解';
    S.status.style.color = !a.len ? '' : a.cracked ? '#ff3d7f' : L.color;
    this._ticker(a);
    S.last = a;
  },

  // 破解者的嘗試：未破解時不停顯示亂碼，破解後顯示密碼
  _ticker(a) {
    const S = this._s, ctx = this._ctx;
    if (!a.len) { if (S.ticker) { S.ticker.kill(); S.ticker = null; } S.tick.innerHTML = '&nbsp;'; return; }
    if (a.cracked) {
      if (S.ticker) { S.ticker.kill(); S.ticker = null; }
      S.tick.textContent = `試出：${a.pw}`;
      S.tick.style.color = '#ff8fa3';
      return;
    }
    S.tick.style.color = '';
    S.tickLen = Math.min(12, a.len);
    if (!S.ticker && ctx) {
      const POOL = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!$#@%&*?';
      const tickFn = () => {
        let s = '';
        for (let i = 0; i < S.tickLen; i++) s += POOL[(Math.random() * POOL.length) | 0];
        S.tick.textContent = '嘗試：' + s;
      };
      tickFn();
      S.ticker = ctx.every(0.07, tickFn);
    }
  },

  // ---------- 網絡狀態 ----------
  _edge(a, b) {
    return this._s.edges.find(e => e.dataset.e === `${a}-${b}` || e.dataset.e === `${b}-${a}`);
  },
  _nodeState(i, state, instant) {
    const node = this._s.nodes[i];
    if (!node) return;
    const c = node.querySelector('.nd-c');
    const g = node.querySelector('.nd-g');
    const you = i === 0;
    const COLORS = {
      idle: { fill: you ? '#08261e' : '#0c1733', stroke: you ? '#34d399' : '#7dd3fc', ink: '#cfe3ff' },
      red: { fill: '#3a0a1c', stroke: '#ff3d7f', ink: '#ff8fa3' },
      green: { fill: '#06281d', stroke: '#34d399', ink: '#86efac' },
    }[state];
    const d = instant ? 0 : 0.35;
    const r0 = you ? 36 : 26;
    gsap.killTweensOf(c);
    if (!instant && state !== 'idle') gsap.fromTo(c, { attr: { r: r0 * 1.45 } }, { attr: { r: r0 }, fill: COLORS.fill, stroke: COLORS.stroke, duration: 0.6, ease: 'back.out(3)' });
    else gsap.to(c, { attr: { r: r0 }, fill: COLORS.fill, stroke: COLORS.stroke, duration: d });
    if (you) gsap.to(node.querySelector('.nd-halo'), { opacity: state === 'red' ? 0 : 1, duration: d, overwrite: 'auto' });
    if (g) { gsap.to(g, { stroke: COLORS.ink, duration: d, overwrite: 'auto' }); gsap.to(g.querySelector('circle'), { fill: COLORS.ink, duration: d, overwrite: 'auto' }); }
  },
  _setNet(state, instant) {
    const S = this._s;
    S.netState = state;
    const red = new Set([0, ...SPREAD.map(s => s[1])]);
    NODES.forEach((_, i) => this._nodeState(i, state === 'red' ? (red.has(i) ? 'red' : 'idle') : state, instant));
    S.edges.forEach(e => { e.classList.remove('red', 'green'); if (state === 'green') e.classList.add('green'); });
    if (state === 'red') SPREAD.forEach(([p, c]) => { const e = this._edge(p, c); if (e) e.classList.add('red'); });
    this._root.querySelector('.pulses').innerHTML = '';
    this._setCaption(state, instant);
  },
  _setCaption(state, instant) {
    const S = this._s;
    const txt = CAPTIONS[state] || CAPTIONS.idle;
    const col = state === 'red' ? '#ff3d7f' : state === 'green' ? '#34d399' : '#7dd3fc';
    S.capDot.style.background = col; S.capDot.style.boxShadow = `0 0 12px ${col}`;
    if (S.caption.dataset.state === state) return;
    S.caption.dataset.state = state;
    if (instant) { gsap.killTweensOf(S.caption); gsap.set(S.caption, { opacity: 1, y: 0 }); S.caption.innerHTML = txt; return; }
    gsap.fromTo(S.caption, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out', onStart: () => { S.caption.innerHTML = txt; } });
  },

  // ---------- 持續的小動畫 ----------
  _ambient(root, ctx) {
    this._ctx = ctx;
    ctx.track(gsap.to(root.querySelector('.soc-orbit'), { strokeDashoffset: -120, duration: 6, repeat: -1, ease: 'none' }));
    ctx.track(gsap.to(root.querySelectorAll('.sp'), { strokeDashoffset: -22, duration: 1.4, repeat: -1, ease: 'none' }));
    // 資料封包在地球與各人之間往返
    const g = root.querySelector('.packets');
    [1, 4, 6, 8, 10, 11].forEach((i, k) => {
      const p = NODES[i];
      const ang = Math.atan2(p.y - NET.cy, p.x - NET.cx);
      const sx = NET.cx + Math.cos(ang) * 112, sy = NET.cy + Math.sin(ang) * 112;
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('r', 5); dot.setAttribute('cx', sx); dot.setAttribute('cy', sy);
      g.appendChild(dot);
      ctx.track(gsap.fromTo(dot, { attr: { cx: sx, cy: sy } }, { attr: { cx: p.x, cy: p.y }, duration: 1.6, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: k * 0.37 }));
    });
  },

  _globe(canvas, ctx) {
    const g = canvas.getContext('2d');
    const W = canvas.width, R = W / 2 - 12, C = W / 2;
    const lat0 = 18 * Math.PI / 180;
    const sin0 = Math.sin(lat0), cos0 = Math.cos(lat0);
    const HK = [114.17 * Math.PI / 180, 22.3 * Math.PI / 180];
    let lon0 = 114 * Math.PI / 180;
    let pts = LAND;
    if (!pts) loadLand().then(p => { pts = p; });
    const draw = t => {
      g.clearRect(0, 0, W, W);
      const ocean = g.createRadialGradient(C - R * 0.35, C - R * 0.4, R * 0.1, C, C, R);
      ocean.addColorStop(0, '#0f3b5e'); ocean.addColorStop(0.7, '#082039'); ocean.addColorStop(1, '#04101f');
      g.fillStyle = ocean; g.beginPath(); g.arc(C, C, R, 0, Math.PI * 2); g.fill();
      // 經緯線（只畫向著鏡頭的一面）
      g.strokeStyle = 'rgba(125, 211, 252, 0.16)'; g.lineWidth = 1.6;
      const line = (fn, n) => {
        g.beginPath(); let pen = false;
        for (let k = 0; k <= n; k++) {
          const [lo, la] = fn(k / n);
          const dl = lo - lon0, cl = Math.cos(la), sl = Math.sin(la), cd = Math.cos(dl);
          if (sin0 * sl + cos0 * cl * cd <= 0) { pen = false; continue; }
          const x = C + R * cl * Math.sin(dl), y = C - R * (cos0 * sl - sin0 * cl * cd);
          if (pen) g.lineTo(x, y); else { g.moveTo(x, y); pen = true; }
        }
        g.stroke();
      };
      for (let la = -60; la <= 60; la += 30) line(u => [u * Math.PI * 2, la * Math.PI / 180], 72);
      for (let lo = 0; lo < 360; lo += 30) line(u => [lo * Math.PI / 180, (u - 0.5) * Math.PI], 36);
      if (pts) {
        const buckets = [[], [], []];
        for (let i = 0; i < pts.length; i += 2) {
          const dl = pts[i] - lon0, la = pts[i + 1];
          const cl = Math.cos(la), sl = Math.sin(la), cd = Math.cos(dl);
          const cosc = sin0 * sl + cos0 * cl * cd;
          if (cosc <= 0.02) continue;
          const x = C + R * cl * Math.sin(dl);
          const y = C - R * (cos0 * sl - sin0 * cl * cd);
          buckets[cosc > 0.66 ? 2 : cosc > 0.33 ? 1 : 0].push(x, y);
        }
        const cols = ['rgba(52, 211, 153, 0.35)', 'rgba(110, 231, 183, 0.7)', 'rgba(190, 255, 225, 0.95)'];
        const rs = [2.2, 2.9, 3.4];
        buckets.forEach((b, k) => {
          g.fillStyle = cols[k]; g.beginPath();
          for (let i = 0; i < b.length; i += 2) { g.moveTo(b[i] + rs[k], b[i + 1]); g.arc(b[i], b[i + 1], rs[k], 0, Math.PI * 2); }
          g.fill();
        });
      }
      // 香港（呼應上一站）
      {
        const dl = HK[0] - lon0, cl = Math.cos(HK[1]), sl = Math.sin(HK[1]), cd = Math.cos(dl);
        const cosc = sin0 * sl + cos0 * cl * cd;
        if (cosc > 0.05) {
          const x = C + R * cl * Math.sin(dl), y = C - R * (cos0 * sl - sin0 * cl * cd);
          const pr = 7 + 5 * (0.5 + 0.5 * Math.sin(t * 4));
          g.fillStyle = 'rgba(255, 61, 127, 0.28)'; g.beginPath(); g.arc(x, y, pr * 2, 0, Math.PI * 2); g.fill();
          g.fillStyle = '#ff7ab2'; g.beginPath(); g.arc(x, y, 6, 0, Math.PI * 2); g.fill();
        }
      }
      // 邊緣光
      const rim = g.createRadialGradient(C, C, R * 0.82, C, C, R * 1.02);
      rim.addColorStop(0, 'rgba(96, 165, 250, 0)'); rim.addColorStop(0.8, 'rgba(96, 165, 250, 0.25)'); rim.addColorStop(1, 'rgba(165, 243, 252, 0.7)');
      g.fillStyle = rim; g.beginPath(); g.arc(C, C, R, 0, Math.PI * 2); g.fill();
    };
    draw(0);
    ctx.raf((dt, t) => { lon0 += dt * 0.16; draw(t); });
  },
};
