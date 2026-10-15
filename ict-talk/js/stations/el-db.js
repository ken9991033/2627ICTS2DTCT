// 12 選修 2A 數據庫：在瀏覽器內以 Python sqlite3 執行真正的 SQL
// 步驟：0 數據表登場　1 WHERE＋ORDER BY（篩選、排序）　2 GROUP BY＋COUNT（分組統計）　3 十萬筆紀錄的查詢
const gsap = window.gsap;

// 類別顏色
const CAT = { 科學: '#60a5fa', 科技: '#2dd4bf', 歷史: '#fbbf24', 小說: '#f472b6', 藝術: '#a78bfa' };

// 示範數據表 loans（學校圖書館借書紀錄，全部為虛構資料）
const DATA = [
  ['陳嘉欣', '3A', '宇宙的盡頭', '科學', 12],
  ['李俊傑', '3C', '機械人入門', '科技', 5],
  ['黃子晴', '3B', '香港的街道', '歷史', 9],
  ['張家豪', '3D', '程式設計初探', '科技', 14],
  ['何詠詩', '3A', '星夜小說集', '小說', 3],
  ['林浩然', '3B', '人工智能與我', '科技', 8],
  ['周曉彤', '3C', '海洋的秘密', '科學', 6],
  ['吳志明', '3D', '偵探少年', '小說', 11],
  ['梁凱琳', '3A', '數碼攝影', '藝術', 4],
  ['鄭家朗', '3C', '晶片的故事', '科技', 10],
  ['劉芷晴', '3B', '古代文明', '歷史', 7],
  ['蔡子健', '3A', '時光旅人', '小說', 13],
];

// 每一步的「問題」及 SQL
const QS = [
  { ask: '這是學校圖書館的借書紀錄。數據庫把資料整齊地存成一個「數據表」。', sql: 'SELECT *\nFROM loans;' },
  { ask: '哪些同學借了「科技」類圖書？按借閱日數由多至少排列。', sql: "SELECT name, title, days\nFROM loans\nWHERE category = '科技'\nORDER BY days DESC;" },
  { ask: '每一類圖書，各有多少位同學借閱？', sql: 'SELECT category, COUNT(*) AS total\nFROM loans\nGROUP BY category\nORDER BY total DESC;' },
  { ask: '如果有十萬筆紀錄，有多少本書逾期（借出超過 14 日）？', sql: 'SELECT COUNT(*)\nFROM loans\nWHERE days > 14;' },
];

// Python 未能載入時的預存結果（與 sqlite3 真實執行的結果相同）
const FALLBACK = {
  0: { cols: ['name', 'class', 'title', 'category', 'days'], rows: DATA },
  1: { cols: ['name', 'title', 'days'], rows: [['張家豪', '程式設計初探', 14], ['鄭家朗', '晶片的故事', 10], ['林浩然', '人工智能與我', 8], ['李俊傑', '機械人入門', 5]] },
  2: { cols: ['category', 'total'], rows: [['科技', 4], ['小說', 3], ['科學', 2], ['歷史', 2], ['藝術', 1]] },
  3: { n: 8047, total: 100000 },
};

const PY_RUN = `import sqlite3, json, time
con = sqlite3.connect(':memory:')
con.execute('CREATE TABLE loans (name TEXT, class TEXT, title TEXT, category TEXT, days INTEGER)')
con.executemany('INSERT INTO loans VALUES (?, ?, ?, ?, ?)', DATA)
t = time.perf_counter()
cur = con.execute(QUERY)
rows = cur.fetchmany(50)
ms = (time.perf_counter() - t) * 1000
cols = [d[0] for d in cur.description] if cur.description else []
json.dumps({'cols': cols, 'rows': rows, 'ms': ms}, ensure_ascii=False)`;

const PY_BIG = `import sqlite3, random, time, json
random.seed(2026)
con = sqlite3.connect(':memory:')
con.execute('CREATE TABLE loans (name TEXT, class TEXT, title TEXT, category TEXT, days INTEGER)')
names = [r[0] for r in DATA]
titles = [r[2] for r in DATA]
cats = ['科學', '科技', '歷史', '小說', '藝術']
classes = [f'{f}{c}' for f in range(1, 7) for c in 'ABCD']
rows = []
for i in range(100000):
    d = random.randint(1, 14) if random.random() < 0.92 else random.randint(15, 45)
    rows.append((random.choice(names), random.choice(classes), random.choice(titles), random.choice(cats), d))
con.executemany('INSERT INTO loans VALUES (?, ?, ?, ?, ?)', rows)
t = time.perf_counter()
n = con.execute(QUERY).fetchone()[0]
ms = (time.perf_counter() - t) * 1000
ids = [r[0] - 1 for r in con.execute('SELECT rowid FROM loans WHERE days > 14')]
json.dumps({'n': n, 'ms': ms, 'ids': ids, 'total': len(rows)})`;

// 數據表版面（表身座標）
const COLS = [
  { key: 'name', zh: '姓名', x: 0, w: 150 },
  { key: 'class', zh: '班別', x: 150, w: 110 },
  { key: 'title', zh: '書名', x: 260, w: 330 },
  { key: 'category', zh: '類別', x: 590, w: 150 },
  { key: 'days', zh: '借閱日數', x: 740, w: 160 },
];
const Q1_COLS = { name: [0, 220], title: [230, 420], days: [680, 200] };
const RH = 48, TW = 912;
// 分組統計圖（表身座標）
const SLOT_W = TW / 5, BLOCK_W = 150, BLOCK_H = 60, BLOCK_GAP = 10, BASE = 530;
// 十萬點畫布
const GRID_C = 500, GRID_R = 200, CELL = 3, CW = GRID_C * CELL, CH = GRID_R * CELL;

const ICON = {
  db: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M6 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L7.5 3.64A1 1 0 0 0 6 4.5z"/></svg>',
  filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h18l-7 8.5V19l-4 2v-8.5z"/></svg>',
  sort: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4v16"/><path d="m3 16 4 4 4-4"/><path d="M14 5h7"/><path d="M14 10h5"/><path d="M14 15h3"/></svg>',
  cols: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>',
};

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// 簡單的可重現亂數（後備圖案用）
function mulberry32(a) {
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

export default {
  id: 'el-db',
  title: '2A 數據庫：用 SQL 向數據發問',
  short: '2A 數據庫',
  module: '2A',
  accent: '#2dd4bf',
  tint: ['#2dd4bf', '#0ea5e9'],
  transition: { type: 'zoomIn', focus: '.el-card-2a' },
  steps: 3,
  minutes: 1,
  notes: `【選修 2A 數據庫，約 1 分鐘】
進場：「這是學校圖書館的借書紀錄。數據庫把資料存成『數據表』：每一行是一筆紀錄，每一欄是一項資料。」
1. 按 →：畫面先出現一個問題，再打出一句 SQL。可以問同學：「如果用眼逐行找，要多久？」SQL 會先篩選（WHERE），再排序（ORDER BY），最後只選取需要的欄位（SELECT）。左邊程式碼會逐行發光，對應右邊的變化。
2. 按 →：第二句 SQL 用 GROUP BY 把紀錄分組，再用 COUNT 數一數。每一格方塊就是一筆紀錄，堆起來便成為一幅統計圖。可以問：「哪一類圖書最受歡迎？」
3. 按 →：鏡頭拉遠。如果全校累積了十萬筆紀錄？同一句 SQL，只需數毫秒便找出所有逾期紀錄（右邊顯示真實執行時間）。
小結：「2A 數據庫會學習設計數據表，以及用 SQL 查詢及分析數據。學校、醫院、銀行、網上購物，背後都有數據庫。」
提示：所有查詢都由 Python 的 sqlite3 在瀏覽器內真實執行。老師可點擊程式碼自行修改（例如把「科技」改成「小說」），再按「執行 SQL」；按 Esc 離開編輯器後才可用鍵盤轉頁。Python 未載入時會顯示預存結果，簡報不會停頓。`,

  build(root, ctx) {
    const { fx } = ctx;
    HL = fx.highlightSQL;
    root.innerHTML = `
      <div class="station-head">
        <div class="kicker">選修單元 2A · DATABASE</div>
        <h1 class="h1">數據庫：用 <span class="accent glow">SQL</span> 向數據發問</h1>
      </div>
      <div class="mod-badge db-badge">2A</div>
      <div class="db-cam">
        <div class="db-con">
          <div class="db-ask panel"><span class="chip db-ask-chip">問題</span><div class="db-ask-text"></div></div>
          <div class="db-editor code-window">
            <div class="bar"><span class="dots"><i></i><i></i><i></i></span><span>query.sql · SQLite</span><span class="db-edit-hint">可點擊修改</span></div>
            <div class="db-code-wrap">
              <div class="db-code code"></div>
              <textarea class="db-ta code-input" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="SQL 查詢"></textarea>
            </div>
          </div>
          <div class="db-runrow">
            <button type="button" class="btn db-run">${ICON.play}<span>執行 SQL</span></button>
            <div class="db-result"></div>
          </div>
          <div class="db-py"><i class="db-dot"></i><span class="db-py-text">Python</span></div>
        </div>
        <div class="db-tab panel glow-edge">
          <div class="db-tab-head">
            <span class="db-ico">${ICON.db}</span>
            <span class="db-tname mono">loans</span><span class="db-tzh">借書紀錄</span>
            <span class="chip db-count">12 筆紀錄</span>
          </div>
          <div class="db-colhead"></div>
          <div class="db-body">
            <div class="db-scan"></div>
            <div class="db-legend">
              <div class="db-lg" data-k="where"><span class="db-lg-ico">${ICON.filter}</span><b class="mono">WHERE</b><span>篩選：只保留符合條件的紀錄</span></div>
              <div class="db-lg" data-k="order"><span class="db-lg-ico">${ICON.sort}</span><b class="mono">ORDER BY</b><span>排序：按指定欄位排列</span></div>
              <div class="db-lg" data-k="select"><span class="db-lg-ico">${ICON.cols}</span><b class="mono">SELECT</b><span>選取：只顯示需要的欄位</span></div>
            </div>
            <div class="db-chart"></div>
          </div>
        </div>
      </div>
      <div class="db-big">
        <div class="db-field panel">
          <canvas class="db-canvas" width="${CW}" height="${CH}"></canvas>
          <div class="db-field-legend"><span class="chip">loans · 每一點代表一筆紀錄</span><span class="chip db-hot-chip"><i></i>逾期紀錄</span></div>
          <div class="db-tagline"><span>同一句 SQL，十萬筆紀錄，</span><span>一眨眼就找到答案。</span></div>
        </div>
        <div class="db-stats">
          <div class="db-stat panel"><b class="mono db-s-total">0</b><span>筆借書紀錄</span></div>
          <div class="db-stat panel db-stat-hot"><b class="mono db-s-n">—</b><span>筆逾期（超過 14 日）</span></div>
          <div class="db-stat panel"><b class="mono db-s-ms">—</b><span class="db-s-ms-l">查詢時間</span></div>
        </div>
        <div class="db-bigcode code-window">
          <div class="bar"><span class="dots"><i></i><i></i><i></i></span><span>big_query.sql</span><button type="button" class="btn ghost db-rerun">${ICON.play}<span>再執行</span></button></div>
          <div class="db-bigcode-body code"></div>
        </div>
        <div class="db-learn">
          <div class="kicker">2A 數據庫會學習</div>
          <div class="db-learn-text">設計數據表，並用 SQL 查詢及分析數據</div>
        </div>
      </div>
    `;
    const css = document.createElement('style');
    css.textContent = `
      .st-el-db .db-badge { position:absolute; right:120px; top:84px; }
      .st-el-db .db-cam { position:absolute; inset:0; transform-origin:960px 620px; }
      .st-el-db .db-con { position:absolute; left:120px; top:250px; width:680px; height:740px; }
      .st-el-db .db-ask { position:absolute; left:0; top:0; width:680px; height:178px; padding:22px 28px; }
      .st-el-db .db-ask-chip { font-size:24px; padding:4px 16px; }
      .st-el-db .db-ask-text { margin-top:12px; font-size:30px; line-height:1.5; font-weight:700; color:var(--ink); }
      .st-el-db .db-editor { position:absolute; left:0; top:200px; width:680px; height:330px; }
      .st-el-db .db-editor .bar span:nth-child(2) { font-size:24px; }
      .st-el-db .db-edit-hint { margin-left:auto; font:600 24px var(--font); color:var(--ink-3); }
      .st-el-db .db-code-wrap { position:relative; height:274px; }
      .st-el-db .db-code, .st-el-db .db-ta { position:absolute; inset:0; padding:22px 28px; margin:0; font:400 28px/1.6 var(--mono); white-space:pre; overflow:hidden; }
      .st-el-db .db-code .ln { display:block; min-height:1.6em; margin:0 -28px; padding:0 28px; border-left:6px solid transparent; transition:background .35s, border-color .35s; }
      .st-el-db .db-code .ln.hot { background:color-mix(in srgb, var(--accent) 22%, transparent); border-left-color:var(--accent); }
      .st-el-db .db-ta { color:transparent; background:transparent; caret-color:var(--accent); z-index:2; }
      .st-el-db .db-ta::selection { background:rgba(45,212,191,.3); color:transparent; }
      .st-el-db .db-caret { display:inline-block; width:.55em; height:1.1em; vertical-align:-.18em; background:var(--accent); box-shadow:0 0 12px var(--accent); margin-left:2px; }
      .st-el-db .db-runrow { position:absolute; left:0; top:556px; width:680px; display:flex; align-items:center; gap:24px; }
      .st-el-db .db-run { font-size:28px; padding:16px 30px; flex:none; }
      .st-el-db .db-run svg, .st-el-db .db-rerun svg { width:26px; height:26px; }
      .st-el-db .db-result { font-size:26px; line-height:1.35; color:var(--ink-2); font-weight:700; min-width:0; }
      .st-el-db .db-result .ok { color:var(--accent); }
      .st-el-db .db-result .err { color:#ff8fa3; font:600 24px/1.35 var(--mono); display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
      .st-el-db .db-py { position:absolute; left:0; top:680px; display:flex; align-items:center; gap:12px; font-size:24px; color:var(--ink-3); }
      .st-el-db .db-dot { width:14px; height:14px; border-radius:50%; background:#fbbf24; box-shadow:0 0 12px #fbbf24; flex:none; }
      .st-el-db .db-py.ready .db-dot { background:#34d399; box-shadow:0 0 12px #34d399; }
      .st-el-db .db-py.error .db-dot, .st-el-db .db-py.idle .db-dot { background:#7c86b2; box-shadow:none; }

      .st-el-db .db-tab { position:absolute; left:840px; top:250px; width:960px; height:740px; overflow:hidden; }
      .st-el-db .db-tab-head { height:64px; display:flex; align-items:center; gap:14px; padding:0 24px; border-bottom:1px solid var(--line); background:rgba(45,212,191,.07); }
      .st-el-db .db-ico { width:34px; height:34px; color:var(--accent); display:grid; }
      .st-el-db .db-ico svg { width:34px; height:34px; }
      .st-el-db .db-tname { font-size:28px; font-weight:800; color:var(--ink); }
      .st-el-db .db-tzh { font-size:26px; color:var(--ink-2); }
      .st-el-db .db-count { margin-left:auto; font-size:24px; padding:6px 18px; }
      .st-el-db .db-colhead { position:absolute; left:24px; top:64px; width:${TW}px; height:70px; }
      .st-el-db .db-hcell { position:absolute; top:0; height:70px; padding:8px 14px 0; line-height:1.15; }
      .st-el-db .db-hcell b { display:block; font:700 24px var(--mono); color:var(--accent); }
      .st-el-db .db-hcell span { display:block; font-size:24px; color:var(--ink-3); }
      .st-el-db .db-hcell.r { text-align:right; }
      .st-el-db .db-body { position:absolute; left:24px; top:134px; width:${TW}px; height:592px; }
      .st-el-db .db-row { position:absolute; left:0; top:0; width:${TW}px; height:${RH}px; border-radius:10px; background:rgba(255,255,255,.035); color:var(--ink); }
      .st-el-db .db-row:nth-child(even) { background:rgba(255,255,255,0); }
      .st-el-db .db-row.hit { background:color-mix(in srgb, var(--accent) 20%, transparent) !important; box-shadow:inset 6px 0 0 var(--accent); }
      .st-el-db .db-cell { position:absolute; left:0; top:0; height:100%; padding:0 14px; display:flex; align-items:center; font-size:28px; white-space:nowrap; overflow:hidden; }
      .st-el-db .db-cell.c-class, .st-el-db .db-cell.c-days { font-family:var(--mono); }
      .st-el-db .db-cell.c-days { justify-content:flex-end; font-weight:700; }
      .st-el-db .db-cat { display:inline-block; padding:1px 14px; border-radius:999px; font-size:24px; font-weight:700; color:var(--c); background:color-mix(in srgb, var(--c) 16%, transparent); border:1px solid color-mix(in srgb, var(--c) 55%, transparent); }
      .st-el-db .db-scan { position:absolute; left:-12px; top:0; width:${TW + 24}px; height:${RH}px; border-radius:12px; opacity:0; pointer-events:none;
        background:linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent) 35%, transparent) 30%, color-mix(in srgb, var(--accent) 35%, transparent) 70%, transparent);
        box-shadow:0 0 40px color-mix(in srgb, var(--accent) 50%, transparent); }
      .st-el-db .db-legend { position:absolute; left:0; top:248px; width:${TW}px; display:flex; gap:24px; }
      .st-el-db .db-lg { flex:1; padding:20px 22px; border-radius:20px; border:1px solid var(--line); background:rgba(255,255,255,.03); opacity:0; }
      .st-el-db .db-lg-ico { display:block; width:44px; height:44px; color:var(--accent); }
      .st-el-db .db-lg-ico svg { width:44px; height:44px; }
      .st-el-db .db-lg b { display:block; margin:10px 0 6px; font-size:28px; color:var(--accent); }
      .st-el-db .db-lg span:last-child { display:block; font-size:24px; line-height:1.4; color:var(--ink-2); }
      .st-el-db .db-chart { position:absolute; inset:0; pointer-events:none; }
      .st-el-db .db-chart .cnt { position:absolute; left:0; top:0; width:${SLOT_W}px; text-align:center; font:800 52px/1 var(--mono); color:var(--ink); opacity:0; }
      .st-el-db .db-chart .lab { position:absolute; left:0; width:${SLOT_W}px; text-align:center; top:${BASE + 14}px; opacity:0; }
      .st-el-db .db-chart .lab span { display:inline-block; padding:4px 18px; border-radius:999px; font-size:28px; font-weight:800; color:#05060f; background:var(--c); }
      .st-el-db .db-chart .axis { position:absolute; left:0; top:${BASE + 4}px; width:${TW}px; height:3px; background:var(--line-strong); transform-origin:0 50%; transform:scaleX(0); }
      .st-el-db .db-custom { position:absolute; left:24px; top:64px; width:${TW}px; }
      .st-el-db .db-custom .db-row { position:relative; margin-bottom:0; }
      .st-el-db .db-custom .hrow { height:70px; position:relative; }
      .st-el-db .db-custom .more { font-size:24px; color:var(--ink-3); padding:10px 14px; }

      .st-el-db .db-big { position:absolute; inset:0; pointer-events:none; }
      .st-el-db .db-big > * { pointer-events:auto; }
      .st-el-db .db-field { position:absolute; left:120px; top:240px; width:1280px; height:526px; padding:12px; opacity:0; overflow:hidden; }
      .st-el-db .db-canvas { display:block; width:1256px; height:502px; border-radius:16px; }
      .st-el-db .db-field-legend { position:absolute; left:28px; top:26px; display:flex; gap:14px; }
      .st-el-db .db-field-legend .chip { font-size:24px; background:rgba(4,5,13,.82); }
      .st-el-db .db-hot-chip { color:#ff7aa6; border-color:#ff3d7f; }
      .st-el-db .db-hot-chip i { width:14px; height:14px; border-radius:3px; background:#ff3d7f; box-shadow:0 0 10px #ff3d7f; }
      .st-el-db .db-tagline { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); padding:26px 44px; border-radius:24px; text-align:center;
        background:rgba(4,5,13,.84); border:1px solid color-mix(in srgb, var(--accent) 55%, transparent); box-shadow:0 0 60px rgba(0,0,0,.6); opacity:0; white-space:nowrap; }
      .st-el-db .db-tagline span { display:block; font-size:40px; font-weight:900; line-height:1.4; }
      .st-el-db .db-tagline span:last-child { color:var(--accent); }
      .st-el-db .db-stats { position:absolute; left:1440px; top:240px; width:360px; display:flex; flex-direction:column; gap:22px; }
      .st-el-db .db-stat { height:164px; padding:24px 28px; opacity:0; }
      .st-el-db .db-stat b { display:block; font-size:60px; line-height:1.1; color:var(--ink); white-space:nowrap; }
      .st-el-db .db-stat b small { font:700 30px var(--font); margin-left:6px; color:var(--ink-2); }
      .st-el-db .db-stat span { display:block; margin-top:10px; font-size:26px; color:var(--ink-2); }
      .st-el-db .db-stat-hot b { color:#ff5c93; text-shadow:0 0 24px rgba(255,61,127,.5); }
      .st-el-db .db-bigcode { position:absolute; left:120px; top:800px; width:680px; height:214px; opacity:0; }
      .st-el-db .db-bigcode .bar span:nth-child(2) { font-size:24px; }
      .st-el-db .db-rerun { margin-left:auto; padding:6px 18px; font-size:24px; border-width:2px; }
      .st-el-db .db-bigcode-body { padding:14px 28px; font-size:28px; line-height:1.55; }
      .st-el-db .db-learn { position:absolute; left:840px; top:812px; width:960px; height:190px; padding:30px 36px; border-radius:var(--r-lg); opacity:0;
        background:linear-gradient(120deg, color-mix(in srgb, var(--accent) 16%, transparent), rgba(140,160,255,.05)); border:1px solid color-mix(in srgb, var(--accent) 45%, transparent); }
      .st-el-db .db-learn .kicker { font-size:24px; }
      .st-el-db .db-learn-text { margin-top:16px; font-size:40px; font-weight:800; line-height:1.3; }
    `;
    root.appendChild(css);

    // ---------- 每次 build 的狀態 ----------
    const $ = s => root.querySelector(s);
    const S = this._S = {
      alive: true, gen: 0, state: 0, tls: [], fx,
      root, cam: $('.db-cam'), con: $('.db-con'), tab: $('.db-tab'),
      askText: $('.db-ask-text'), ask: $('.db-ask'), pre: $('.db-code'), ta: $('.db-ta'),
      runBtn: $('.db-run'), result: $('.db-result'), py: $('.db-py'), pyText: $('.db-py-text'),
      count: $('.db-count'), colhead: $('.db-colhead'), body: $('.db-body'), scan: $('.db-scan'),
      legend: [...root.querySelectorAll('.db-lg')], chart: $('.db-chart'),
      big: $('.db-big'), field: $('.db-field'), canvas: $('.db-canvas'), tagline: $('.db-tagline'),
      stats: [...root.querySelectorAll('.db-stat')], sTotal: $('.db-s-total'), sN: $('.db-s-n'), sMs: $('.db-s-ms'), sMsL: $('.db-s-ms-l'),
      bigcode: $('.db-bigcode'), bigBody: $('.db-bigcode-body'), rerun: $('.db-rerun'), learn: $('.db-learn'),
      custom: null, rows: [], cells: [], hcells: {},
    };
    ctx.onCleanup(() => { S.alive = false; });

    // 欄位標題
    COLS.forEach(c => {
      const el = document.createElement('div');
      el.className = 'db-hcell' + (c.key === 'days' ? ' r' : '');
      el.innerHTML = `<b>${c.key}</b><span>${c.zh}</span>`;
      el.style.width = c.w + 'px';
      gsap.set(el, { x: c.x });
      S.colhead.appendChild(el); S.hcells[c.key] = el;
    });
    // 數據列
    DATA.forEach((r, i) => {
      const row = document.createElement('div');
      row.className = 'db-row';
      row.dataset.i = i;
      const cells = {};
      COLS.forEach((c, k) => {
        const cell = document.createElement('div');
        cell.className = `db-cell c-${c.key}`;
        cell.style.width = c.w + 'px';
        const v = r[k];
        cell.innerHTML = c.key === 'title' ? `《${esc(v)}》` : c.key === 'category' ? `<span class="db-cat" style="--c:${CAT[v]}">${esc(v)}</span>` : esc(v);
        row.appendChild(cell); cells[c.key] = cell;
      });
      S.body.insertBefore(row, S.scan);
      S.rows.push(row); S.cells.push(cells);
    });
    // 統計圖的標籤
    S.axis = document.createElement('div'); S.axis.className = 'axis'; S.chart.appendChild(S.axis);
    S.cnts = []; S.labs = [];
    for (let k = 0; k < 5; k++) {
      const c = document.createElement('div'); c.className = 'cnt'; S.chart.appendChild(c); S.cnts.push(c);
      const l = document.createElement('div'); l.className = 'lab'; S.chart.appendChild(l); S.labs.push(l);
    }
    S.g = S.canvas.getContext('2d');
    S.reveal = 0; S.sweep = 0;
    setFull(S);

    // 編輯器
    setCode(S, QS[0].sql);
    ctx.listen(S.ta, 'input', () => renderCode(S, S.ta.value));
    ctx.listen(S.runBtn, 'click', () => { S.runBtn.blur(); onRun(this, S, ctx); });
    ctx.listen(S.rerun, 'click', () => { S.rerun.blur(); if (S.state !== 3) return; S.gen++; finishTls(S); playBig(S, ctx, { rerun: true }); });
    S.askText.textContent = QS[0].ask;
    S.bigBody.innerHTML = codeLines(QS[3].sql);

    // Python 狀態
    const off = ctx.python.onStatus(st => {
      if (!S.alive) return;
      S.py.className = 'db-py ' + st;
      S.pyText.textContent = st === 'ready' ? 'Python 3.14 · sqlite3 已就緒：在瀏覽器內真實執行'
        : st === 'loading' ? 'Python 載入中……（未載入時使用預存結果）'
        : st === 'error' ? 'Python 未能載入：使用預存結果'
        : 'Python 未啟動：使用預存結果';
    });
    ctx.onCleanup(off);
  },

  enter(root, ctx, { instant }) {
    const S = this._S;
    S.state = 0;
    const real = () => runSQL(ctx, QS[0].sql).then(res => { if (S.alive && S.state === 0 && res) showResult(S, res, 12); });
    if (instant) {
      showResult(S, null, 12, true);
      real();
      return;
    }
    const tl = newTl(S, ctx);
    tl.from(S.tab, { opacity: 0, x: 80, rotationY: -12, transformPerspective: 1600, duration: 0.9, ease: 'expo.out' }, 0);
    tl.from([S.ask, root.querySelector('.db-editor'), S.runBtn.parentNode, S.py], { opacity: 0, x: -50, stagger: 0.08, duration: 0.7, ease: 'expo.out' }, 0.1);
    tl.from(root.querySelector('.db-badge'), { scale: 0, rotation: -90, duration: 0.8, ease: 'back.out(2)' }, 0.3);
    tl.from(Object.values(S.hcells), { opacity: 0, y: -16, stagger: 0.05, duration: 0.4 }, 0.4);
    rowsCascade(S, ctx, tl, 0.55);
    tl.call(() => showResult(S, null, 12, true), null, 0.55);
    tl.call(real, null, 1.2);
  },

  step(root, ctx, n, { instant }) {
    const S = this._S;
    S.gen++;
    finishTls(S);
    if (n === 1) playQ1(S, ctx, { instant });
    if (n === 2) playQ2(S, ctx, { instant });
    if (n === 3) playBig(S, ctx, { instant });
  },
};

// 每一步的動畫：新一步開始時，把上一步未完成的動畫即時完成
function newTl(S, ctx) { const t = ctx.tl(); S.tls.push(t); return t; }
function finishTls(S) { const list = S.tls.splice(0); list.forEach(t => { t.progress(1); t.kill(); }); }
function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; }

// =====================================================================
// 編輯器
// =====================================================================
let HL = s => esc(s);
function codeLines(sql, caret) {
  const lines = sql.split('\n');
  return lines.map((ln, i) => `<span class="ln">${ln ? HL(ln) : ''}${caret && i === lines.length - 1 ? '<span class="db-caret"></span>' : ''}</span>`).join('');
}
function renderCode(S, sql, caret) {
  S.pre.innerHTML = codeLines(sql, caret);
}
function setCode(S, sql) {
  S.ta.value = sql;
  renderCode(S, sql);
}
function hotLine(S, k) {
  S.pre.querySelectorAll('.ln').forEach((l, i) => l.classList.toggle('hot', i === k));
}
function typeSQL(S, ctx, tl, sql, at, cps = 34) {
  const o = { n: 0, last: -1 };
  const dur = sql.length / cps;
  tl.call(() => { S.ta.value = ''; renderCode(S, '', true); }, null, at);
  tl.to(o, {
    n: sql.length, duration: dur, ease: 'none',
    onUpdate() { const k = Math.round(o.n); if (k !== o.last) { o.last = k; renderCode(S, sql.slice(0, k), true); if (k % 2 === 0 && /\S/.test(sql[k - 1] || '')) ctx.sfx.play('type'); } },
  }, at);
  tl.call(() => setCode(S, sql), null, at + dur + 0.05);
  return dur + 0.05;
}
function swapAsk(S, tl, text, at) {
  tl.to(S.askText, { opacity: 0, y: -14, duration: 0.25 }, at);
  tl.call(() => { S.askText.textContent = text; }, null, at + 0.25);
  tl.fromTo(S.askText, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out', immediateRender: false }, at + 0.27);
  tl.fromTo(S.ask, { boxShadow: '0 0 0 2px rgba(45,212,191,.9), 0 0 50px rgba(45,212,191,.4)' }, { boxShadow: '0 24px 80px rgba(0,0,0,.35)', duration: 1.2, immediateRender: false }, at + 0.25);
}
function pressRun(S, tl, at) {
  tl.to(S.runBtn, { scale: 0.92, duration: 0.1 }, at).to(S.runBtn, { scale: 1, duration: 0.5, ease: 'elastic.out(1.2,0.4)' }, at + 0.1);
}

// =====================================================================
// 執行 SQL（真實 → 後備）
// =====================================================================
async function runSQL(ctx, sql) {
  if (ctx.python.status !== 'ready') return null;
  const r = await ctx.python.run(PY_RUN, { globals: { DATA, QUERY: sql } });
  if (!r.ok) return { ok: false, error: r.error };
  try { return { ok: true, real: true, ...JSON.parse(r.result) }; } catch (e) { return { ok: false, error: String(e) }; }
}
function fmtMs(ms) { return ms < 10 ? ms.toFixed(2) : ms < 100 ? ms.toFixed(1) : Math.round(ms).toString(); }
function showResult(S, res, nRows, initial) {
  S.count.textContent = `${nRows} 筆${S.state === 0 ? '紀錄' : '結果'}`;
  if (res && res.ok) S.result.innerHTML = `<span class="ok">${nRows} 筆結果</span><br>真實執行 · ${fmtMs(res.ms)} 毫秒`;
  else if (res && !res.ok) S.result.innerHTML = `<span class="err">${esc(res.error)}</span>`;
  else S.result.innerHTML = `<span class="ok">${nRows} 筆結果</span><br>${initial ? '已讀取數據表' : '預存結果'}`;
}
function showRunning(S) { S.result.innerHTML = '執行中……'; }

// 按「執行 SQL」：與本步相同的查詢 → 重播；否則執行自訂查詢
async function onRun(st, S, ctx) {
  const sql = S.ta.value.trim();
  const norm = s => s.replace(/\s+/g, ' ').trim().toLowerCase();
  if (S.state <= 2 && norm(sql) === norm(QS[S.state].sql)) {
    S.gen++;
    finishTls(S);
    if (S.state === 0) { clearCustom(S); setFull(S); const tl = newTl(S, ctx); rowsCascade(S, ctx, tl, 0); runSQL(ctx, QS[0].sql).then(res => { if (S.alive && res) showResult(S, res, 12); }); }
    if (S.state === 1) playQ1(S, ctx, { replay: true });
    if (S.state === 2) playQ2(S, ctx, { replay: true });
    return;
  }
  if (!sql) return;
  if (ctx.python.status !== 'ready') { S.result.innerHTML = '<span class="err">Python 未就緒，暫時未能執行自訂查詢</span>'; return; }
  const gen = ++S.gen;
  finishTls(S);
  showRunning(S);
  ctx.sfx.play('blip');
  const res = await runSQL(ctx, sql);
  if (!S.alive || gen !== S.gen) return;
  if (!res || !res.ok) { ctx.sfx.play('error'); showResult(S, res || { ok: false, error: '未能執行' }, 0); return; }
  renderCustom(S, ctx, res);
}

// =====================================================================
// 數據表各種狀態
// =====================================================================
function setFull(S) {
  clearCustom(S);
  S.rows.forEach((row, i) => {
    row.classList.remove('hit');
    gsap.set(row, { clearProps: 'backgroundColor,color,borderRadius,boxShadow', x: 0, y: i * RH, width: TW, height: RH, opacity: 1, scale: 1 });
    COLS.forEach(c => gsap.set(S.cells[i][c.key], { x: c.x, width: c.w, opacity: 1, justifyContent: c.key === 'days' ? 'flex-end' : 'flex-start', fontSize: 28, fontWeight: c.key === 'days' ? 700 : 400 }));
  });
  COLS.forEach(c => gsap.set(S.hcells[c.key], { x: c.x, width: c.w, opacity: 1 }));
  gsap.set(S.colhead, { opacity: 1 });
  gsap.set(S.legend, { opacity: 0, y: 0 });
  gsap.set([...S.cnts, ...S.labs], { opacity: 0 });
  gsap.set(S.axis, { scaleX: 0 });
  gsap.set(S.scan, { opacity: 0, y: 0 });
  hotLine(S, -1);
}
// 由目前狀態動畫回到完整數據表
function animFull(S, tl, at) {
  if (S.custom) { const c = S.custom; S.custom = null; tl.to(c, { opacity: 0, duration: 0.3 }, at).call(() => c.remove(), null, at + 0.3); }
  S.rows.forEach((row, i) => {
    tl.call(() => row.classList.remove('hit'), null, at);
    tl.to(row, { x: 0, y: i * RH, width: TW, height: RH, opacity: 1, backgroundColor: i % 2 ? 'rgba(255,255,255,0)' : 'rgba(255,255,255,0.035)', color: '#eef1ff', borderRadius: 10, duration: 0.6, ease: 'power3.inOut' }, at);
    COLS.forEach(c => tl.to(S.cells[i][c.key], { x: c.x, width: c.w, opacity: 1, fontSize: 28, duration: 0.6, ease: 'power3.inOut' }, at));
    tl.set(S.cells[i].name, { justifyContent: 'flex-start', fontWeight: 400 }, at + 0.3);
  });
  COLS.forEach(c => tl.to(S.hcells[c.key], { x: c.x, width: c.w, opacity: 1, duration: 0.6, ease: 'power3.inOut' }, at));
  tl.to(S.colhead, { opacity: 1, duration: 0.4 }, at);
  tl.to(S.legend, { opacity: 0, duration: 0.3 }, at);
  tl.to([...S.cnts, ...S.labs], { opacity: 0, duration: 0.3 }, at);
  tl.to(S.axis, { scaleX: 0, duration: 0.3 }, at);
  tl.set(S.rows, { clearProps: 'backgroundColor,color,borderRadius' }, at + 0.62);
  return 0.65;
}
function rowsCascade(S, ctx, tl, at) {
  S.rows.forEach((row, i) => {
    tl.fromTo(row, { opacity: 0, x: -60 }, { opacity: 1, x: 0, duration: 0.5, ease: 'expo.out' }, at + i * 0.05);
    tl.add(S.fx.scramble(S.cells[i].days, String(DATA[i][4]), { chars: '0123456789', duration: 0.5 }), at + i * 0.05);
  });
  tl.call(() => ctx.sfx.play('reveal'), null, at);
}
function clearCustom(S) {
  if (S.custom) { S.custom.remove(); S.custom = null; }
}
function renderCustom(S, ctx, res) {
  clearCustom(S);
  const tl = newTl(S, ctx);
  tl.to([...S.rows, S.colhead, ...S.legend, ...S.cnts, ...S.labs], { opacity: 0, duration: 0.3 }, 0);
  tl.to(S.axis, { scaleX: 0, duration: 0.3 }, 0);
  const box = document.createElement('div');
  box.className = 'db-custom';
  const cols = res.cols.length ? res.cols : ['（沒有結果）'];
  const w = TW / cols.length;
  const head = document.createElement('div');
  head.className = 'hrow';
  head.innerHTML = cols.map((c, k) => `<div class="db-hcell" style="width:${w}px;transform:translateX(${k * w}px)"><b>${esc(c)}</b></div>`).join('');
  box.appendChild(head);
  const MAX = 11;
  res.rows.slice(0, MAX).forEach((r, i) => {
    const row = document.createElement('div');
    row.className = 'db-row';
    row.style.background = i % 2 ? 'transparent' : 'rgba(255,255,255,.035)';
    row.innerHTML = r.map((v, k) => {
      const isNum = typeof v === 'number';
      const txt = v === null ? 'NULL' : isNum && !Number.isInteger(v) ? v.toFixed(2) : String(v);
      return `<div class="db-cell" style="width:${w}px;transform:translateX(${k * w}px);${isNum ? 'font-family:var(--mono);font-weight:700' : ''}">${esc(txt)}</div>`;
    }).join('');
    box.appendChild(row);
  });
  if (res.rows.length > MAX) { const m = document.createElement('div'); m.className = 'more'; m.textContent = `……其餘 ${res.rows.length - MAX} 筆未顯示`; box.appendChild(m); }
  S.tab.appendChild(box);
  S.custom = box;
  tl.from(box.children, { opacity: 0, y: 14, stagger: 0.04, duration: 0.4, ease: 'expo.out' }, 0.25);
  tl.call(() => ctx.sfx.play('reveal'), null, 0.25);
  showResult(S, res, res.rows.length);
  S.count.textContent = `${res.rows.length} 筆結果`;
}

// ---------- 步驟 1：WHERE＋ORDER BY＋SELECT ----------
function q1Plan(res) {
  const rows = (res && res.ok ? res.rows : FALLBACK[1].rows);
  const rank = new Map();
  rows.forEach((r, k) => { const i = DATA.findIndex(d => d[0] === r[0]); if (i >= 0) rank.set(i, k); });
  return rank;
}
function setQ1(S, rank) {
  setFull(S);
  S.rows.forEach((row, i) => {
    const k = rank.get(i);
    if (k === undefined) { gsap.set(row, { opacity: 0, x: -40 }); return; }
    row.classList.add('hit');
    gsap.set(row, { y: k * RH });
  });
  S.rows.forEach((row, i) => {
    ['class', 'category'].forEach(key => gsap.set(S.cells[i][key], { opacity: 0 }));
    Object.entries(Q1_COLS).forEach(([key, [x, w]]) => gsap.set(S.cells[i][key], { x, width: w }));
  });
  ['class', 'category'].forEach(key => gsap.set(S.hcells[key], { opacity: 0 }));
  Object.entries(Q1_COLS).forEach(([key, [x, w]]) => gsap.set(S.hcells[key], { x, width: w }));
  gsap.set(S.legend, { opacity: 1 });
  S.legend.forEach(l => l.classList.remove('dim'));
}
function playQ1(S, ctx, { instant, replay } = {}) {
  S.state = 1;
  const gen = S.gen;
  if (instant) {
    clearCustom(S);
    S.askText.textContent = QS[1].ask;
    setCode(S, QS[1].sql);
    const rank = q1Plan(null);
    setQ1(S, rank);
    showResult(S, null, rank.size);
    gsap.set(S.cam, { scale: 1, x: 0, y: 0 }); gsap.set([S.con, S.tab], { opacity: 1 });
    runSQL(ctx, QS[1].sql).then(res => { if (S.alive && S.gen === gen && res) showResult(S, res, rank.size); });
    return;
  }
  const tl = newTl(S, ctx);
  let t = animFull(S, tl, 0);
  if (!replay) {
    swapAsk(S, tl, QS[1].ask, 0);
    tl.to(S.tab, { opacity: 0.45, duration: 0.5 }, 0.2);
    tl.to(S.cam, { scale: 1.03, x: 16, duration: 0.9, ease: 'power2.inOut' }, 0.1);
    t = 0.6 + typeSQL(S, ctx, tl, QS[1].sql, 0.6);
  }
  pressRun(S, tl, t);
  tl.call(() => { showRunning(S); ctx.sfx.play('blip'); }, null, t);
  tl.to(S.tab, { opacity: 1, duration: 0.4 }, t);
  tl.to(S.cam, { scale: 1.03, x: -14, duration: 0.9, ease: 'power2.inOut' }, t);
  tl.call(() => {
    runSQL(ctx, QS[1].sql).then(res => {
      if (!S.alive || S.gen !== gen) return;
      q1Anim(S, ctx, res);
    });
  }, null, t + 0.15);
}
function q1Anim(S, ctx, res) {
  const rank = q1Plan(res);
  const tl = newTl(S, ctx);
  // A：掃描（WHERE）
  tl.call(() => hotLine(S, 2), null, 0);
  tl.to(S.scan, { opacity: 1, duration: 0.2 }, 0);
  tl.fromTo(S.scan, { y: 0 }, { y: (DATA.length - 1) * RH, duration: 1.3, ease: 'none' }, 0);
  S.rows.forEach((row, i) => {
    const at = 0.05 + i * (1.3 / (DATA.length - 1));
    if (rank.has(i)) {
      tl.call(() => { row.classList.add('hit'); ctx.sfx.play('blip'); }, null, at);
      tl.fromTo(S.cells[i].category, { scale: 1.25 }, { scale: 1, duration: 0.4, ease: 'back.out(3)', immediateRender: false }, at);
    } else tl.to(row, { opacity: 0.22, duration: 0.25 }, at);
  });
  tl.to(S.scan, { opacity: 0, duration: 0.25 }, 1.4);
  // B：不符合的紀錄離場
  const out = S.rows.filter((_, i) => !rank.has(i));
  tl.to(out, { opacity: 0, x: -40, duration: 0.45, stagger: 0.02, ease: 'power2.in' }, 1.55);
  tl.fromTo(S.legend[0], { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out', immediateRender: false }, 1.9);
  // C：排序（ORDER BY）
  tl.call(() => { hotLine(S, 3); ctx.sfx.play('swipe'); }, null, 2.2);
  S.rows.forEach((row, i) => { if (rank.has(i)) tl.to(row, { y: rank.get(i) * RH, duration: 0.8, ease: 'power3.inOut' }, 2.25); });
  S.rows.forEach((row, i) => { if (rank.has(i)) tl.fromTo(S.cells[i].days, { color: '#fde68a', scale: 1.2 }, { color: '#eef1ff', scale: 1, duration: 0.6, immediateRender: false }, 2.95); });
  tl.fromTo(S.legend[1], { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out', immediateRender: false }, 2.5);
  // D：只選取需要的欄位（SELECT）
  tl.call(() => { hotLine(S, 0); ctx.sfx.play('pop'); }, null, 3.3);
  const cols = ['class', 'category'];
  tl.to([...S.rows.flatMap((_, i) => cols.map(k => S.cells[i][k])), ...cols.map(k => S.hcells[k])], { opacity: 0, duration: 0.35 }, 3.3);
  Object.entries(Q1_COLS).forEach(([key, [x, w]]) => {
    tl.to([...S.rows.map((_, i) => S.cells[i][key]), S.hcells[key]], { x, width: w, duration: 0.7, ease: 'power3.inOut' }, 3.55);
  });
  tl.fromTo(S.legend[2], { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out', immediateRender: false }, 3.6);
  tl.call(() => { hotLine(S, -1); showResult(S, res, rank.size); S.fx.scramble(S.count, `${rank.size} 筆結果`, { chars: '0123456789', duration: 0.5 }); ctx.sfx.play('success'); }, null, 4.3);
  tl.to(S.cam, { scale: 1, x: 0, duration: 1, ease: 'power2.inOut' }, 4.2);
}

// ---------- 步驟 2：GROUP BY＋COUNT ----------
function q2Plan(res) {
  const groups = (res && res.ok ? res.rows : FALLBACK[2].rows).map(r => [r[0], r[1]]);
  const slot = new Map(groups.map((g, k) => [g[0], k]));
  const pos = new Map(); // row i → { k, j }
  const seen = {};
  DATA.forEach((d, i) => { const k = slot.get(d[3]); if (k === undefined) return; seen[k] = (seen[k] || 0); pos.set(i, { k, j: seen[k]++ }); });
  return { groups, pos };
}
const blockX = k => k * SLOT_W + (SLOT_W - BLOCK_W) / 2;
const blockY = j => BASE - (j + 1) * (BLOCK_H + BLOCK_GAP) + BLOCK_GAP;
function setChartLabels(S, groups) {
  groups.forEach(([cat, total], k) => {
    const c = S.cnts[k], l = S.labs[k];
    c.textContent = total;
    gsap.set(c, { x: k * SLOT_W, y: blockY(total - 1) - 68 });
    l.innerHTML = `<span style="--c:${CAT[cat] || '#2dd4bf'}">${esc(cat)}</span>`;
    gsap.set(l, { x: k * SLOT_W });
  });
}
function blockProps(i, p) {
  const col = CAT[DATA[i][3]] || '#2dd4bf';
  return { x: blockX(p.k), y: blockY(p.j), width: BLOCK_W, height: BLOCK_H, borderRadius: 14, backgroundColor: col, color: '#05060f', opacity: 1 };
}
function setQ2(S, plan) {
  setFull(S);
  gsap.set(S.colhead, { opacity: 0 });
  S.rows.forEach((row, i) => {
    const p = plan.pos.get(i);
    if (!p) { gsap.set(row, { opacity: 0 }); return; }
    gsap.set(row, blockProps(i, p));
    COLS.forEach(c => { if (c.key !== 'name') gsap.set(S.cells[i][c.key], { opacity: 0 }); });
    gsap.set(S.cells[i].name, { x: 0, width: BLOCK_W, justifyContent: 'center', fontSize: 26, fontWeight: 800 });
  });
  setChartLabels(S, plan.groups);
  gsap.set(plan.groups.map((_, k) => S.cnts[k]), { opacity: 1 });
  gsap.set(plan.groups.map((_, k) => S.labs[k]), { opacity: 1 });
  gsap.set(S.axis, { scaleX: 1 });
}
function playQ2(S, ctx, { instant, replay } = {}) {
  S.state = 2;
  const gen = S.gen;
  if (instant) {
    clearCustom(S);
    S.askText.textContent = QS[2].ask;
    setCode(S, QS[2].sql);
    const plan = q2Plan(null);
    setQ2(S, plan);
    showResult(S, null, plan.groups.length);
    gsap.set(S.cam, { scale: 1, x: 0, y: 0 }); gsap.set([S.con, S.tab], { opacity: 1 });
    runSQL(ctx, QS[2].sql).then(res => { if (S.alive && S.gen === gen && res) showResult(S, res, plan.groups.length); });
    return;
  }
  const tl = newTl(S, ctx);
  let t = animFull(S, tl, 0);
  if (!replay) {
    swapAsk(S, tl, QS[2].ask, 0);
    tl.to(S.tab, { opacity: 0.45, duration: 0.5 }, 0.5);
    tl.to(S.cam, { scale: 1.03, x: 16, duration: 0.9, ease: 'power2.inOut' }, 0.3);
    t = 0.7 + typeSQL(S, ctx, tl, QS[2].sql, 0.7);
  }
  pressRun(S, tl, t);
  tl.call(() => { showRunning(S); ctx.sfx.play('blip'); }, null, t);
  tl.to(S.tab, { opacity: 1, duration: 0.4 }, t);
  tl.to(S.cam, { scale: 1.03, x: -14, duration: 0.9, ease: 'power2.inOut' }, t);
  tl.call(() => {
    runSQL(ctx, QS[2].sql).then(res => {
      if (!S.alive || S.gen !== gen) return;
      q2Anim(S, ctx, res);
    });
  }, null, t + 0.15);
}
function q2Anim(S, ctx, res) {
  const plan = q2Plan(res);
  const tl = newTl(S, ctx);
  setChartLabels(S, plan.groups);
  // A：GROUP BY 一行發光，每列按類別上色
  tl.call(() => hotLine(S, 2), null, 0);
  S.rows.forEach((row, i) => {
    const col = CAT[DATA[i][3]];
    tl.to(row, { boxShadow: `inset 8px 0 0 ${col}`, backgroundColor: hexA(col, 0.22), duration: 0.3 }, 0.05 + i * 0.04);
  });
  tl.to(S.colhead, { opacity: 0, duration: 0.4 }, 0.6);
  // B：紀錄變成方塊，飛到各組堆疊
  const order = [...plan.pos.keys()].sort((a, b) => plan.pos.get(a).j - plan.pos.get(b).j || plan.pos.get(a).k - plan.pos.get(b).k);
  order.forEach((i, n) => {
    const p = plan.pos.get(i);
    const at = 0.9 + n * 0.07;
    COLS.forEach(c => { if (c.key !== 'name') tl.to(S.cells[i][c.key], { opacity: 0, duration: 0.25 }, at); });
    tl.set(S.cells[i].name, { justifyContent: 'center', fontWeight: 800 }, at + 0.2);
    tl.to(S.cells[i].name, { x: 0, width: BLOCK_W, fontSize: 26, duration: 0.8, ease: 'power3.inOut' }, at);
    tl.to(S.rows[i], { ...blockProps(i, p), boxShadow: 'inset 0 0 0 transparent', duration: 0.8, ease: 'power3.inOut' }, at);
    tl.call(() => ctx.sfx.play('tick'), null, at + 0.75);
  });
  const land = 0.9 + order.length * 0.07 + 0.8;
  // C：COUNT 數字跳出
  tl.call(() => { hotLine(S, 0); ctx.sfx.play('pop'); }, null, land - 0.2);
  tl.to(S.axis, { scaleX: 1, duration: 0.6, ease: 'power3.out' }, land - 0.4);
  plan.groups.forEach(([, total], k) => {
    tl.fromTo(S.cnts[k], { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2.5)', immediateRender: false }, land + k * 0.1);
    tl.add(S.fx.countUp(S.cnts[k], total, { duration: 0.6, from: 0 }), land + k * 0.1);
    tl.fromTo(S.labs[k], { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out', immediateRender: false }, land + k * 0.1);
  });
  tl.call(() => { hotLine(S, -1); showResult(S, res, plan.groups.length); S.fx.scramble(S.count, `${plan.groups.length} 筆結果`, { chars: '0123456789', duration: 0.5 }); ctx.sfx.play('success'); }, null, land + 0.6);
  tl.to(S.cam, { scale: 1, x: 0, duration: 1, ease: 'power2.inOut' }, land + 0.3);
}

// ---------- 步驟 3：十萬筆紀錄 ----------
function fallbackIds(n) {
  if (fallbackIds.cache) return fallbackIds.cache;
  const rnd = mulberry32(2026);
  const all = new Uint32Array(GRID_C * GRID_R);
  for (let i = 0; i < all.length; i++) all[i] = i;
  for (let i = 0; i < n; i++) { const j = i + Math.floor(rnd() * (all.length - i)); const t = all[i]; all[i] = all[j]; all[j] = t; }
  return (fallbackIds.cache = Array.from(all.subarray(0, n)));
}
function buildLayers(S, ids) {
  // 底層：十萬點（顏色代表不同類別，純屬示意）
  if (!S.baseLayer) {
    const b = document.createElement('canvas'); b.width = CW; b.height = CH;
    const g = b.getContext('2d');
    const rnd = mulberry32(7);
    const cols = Object.values(CAT);
    for (let i = 0; i < GRID_C * GRID_R; i++) {
      const x = (i % GRID_C) * CELL, y = Math.floor(i / GRID_C) * CELL;
      g.globalAlpha = 0.28 + rnd() * 0.3;
      g.fillStyle = cols[Math.floor(rnd() * cols.length)];
      g.fillRect(x, y, CELL - 1, CELL - 1);
    }
    S.baseLayer = b;
  }
  const h = document.createElement('canvas'); h.width = CW; h.height = CH;
  const g = h.getContext('2d');
  g.fillStyle = '#ff3d7f';
  g.shadowColor = '#ff3d7f'; g.shadowBlur = 6;
  for (const i of ids) g.fillRect((i % GRID_C) * CELL - 0.5, Math.floor(i / GRID_C) * CELL - 0.5, CELL + 1, CELL + 1);
  g.shadowBlur = 0; g.fillStyle = '#ffd1e0';
  for (const i of ids) g.fillRect((i % GRID_C) * CELL + 0.5, Math.floor(i / GRID_C) * CELL + 0.5, CELL - 2, CELL - 2);
  S.hitLayer = h;
}
function drawField(S) {
  const g = S.g;
  g.clearRect(0, 0, CW, CH);
  if (S.reveal > 0 && S.baseLayer) {
    g.save(); g.beginPath(); g.arc(0, 0, S.reveal, 0, Math.PI * 2); g.clip(); g.drawImage(S.baseLayer, 0, 0); g.restore();
  }
  if (S.sweep > 0 && S.hitLayer) {
    g.save(); g.beginPath(); g.rect(0, 0, S.sweep, CH); g.clip(); g.drawImage(S.hitLayer, 0, 0); g.restore();
    if (S.sweep < CW) {
      const grad = g.createLinearGradient(S.sweep - 60, 0, S.sweep + 4, 0);
      grad.addColorStop(0, 'rgba(45,212,191,0)'); grad.addColorStop(1, 'rgba(45,212,191,.9)');
      g.fillStyle = grad; g.fillRect(S.sweep - 60, 0, 64, CH);
    }
  }
}
function setBigStats(S, n, ms, real) {
  S.sTotal.textContent = '100,000';
  S.sN.textContent = n.toLocaleString('en-US');
  if (ms == null) { S.sMs.innerHTML = '&lt; 1<small>秒</small>'; S.sMsL.textContent = '查詢時間（預存結果）'; }
  else { S.sMs.innerHTML = `${fmtMs(ms)}<small>毫秒</small>`; S.sMsL.textContent = real ? '查詢時間（真實執行）' : '查詢時間'; }
}
async function runBig(ctx) {
  if (ctx.python.status !== 'ready') return null;
  const r = await ctx.python.run(PY_BIG, { globals: { DATA, QUERY: QS[3].sql } });
  if (!r.ok) return null;
  try { return JSON.parse(r.result); } catch (e) { return null; }
}
function playBig(S, ctx, { instant, rerun } = {}) {
  S.state = 3;
  const gen = S.gen;
  const fb = FALLBACK[3];
  if (instant) {
    clearCustom(S);
    gsap.set(S.cam, { scale: 0.03, x: 150 - 960, y: 262 - 620, opacity: 0 });
    gsap.set([S.field, ...S.stats, S.bigcode, S.learn, S.tagline], { opacity: 1 });
    buildLayers(S, fallbackIds(fb.n));
    S.reveal = 2000; S.sweep = CW; drawField(S);
    setBigStats(S, fb.n, null, false);
    S.bigBody.innerHTML = codeLines(QS[3].sql);
    // 背景真實執行，只更新數字（結果應相同）
    runBig(ctx).then(res => {
      if (!S.alive || S.gen !== gen || !res) return;
      buildLayers(S, res.ids); drawField(S); setBigStats(S, res.n, res.ms, true);
    });
    return;
  }
  const tl = newTl(S, ctx);
  if (!rerun) {
    // 鏡頭拉遠：整個數據表縮成十萬點中的一角
    tl.call(() => { ctx.sfx.play('whooshOut'); ctx.bg.warp(-1, 1.4, 0.5); }, null, 0);
    tl.to(S.cam, { scale: 0.03, x: 150 - 960, y: 262 - 620, duration: 1.4, ease: 'power3.in' }, 0);
    tl.to(S.cam, { opacity: 0, duration: 0.4 }, 1.1);
    tl.fromTo(S.field, { opacity: 0, scale: 1.15 }, { opacity: 1, scale: 1, duration: 1.2, ease: 'expo.out' }, 0.5);
    tl.call(() => { buildLayers(S, fallbackIds(fb.n)); S.sweep = 0; }, null, 0.45);
    const o = { r: 0 };
    tl.to(o, { r: 1650, duration: 1.8, ease: 'power2.inOut', onUpdate: () => { S.reveal = o.r; drawField(S); } }, 1.0);
    tl.fromTo(S.stats[0], { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 0.6, ease: 'expo.out' }, 1.0);
    tl.add(S.fx.countUp(S.sTotal, 100000, { duration: 1.8 }), 1.0);
    tl.fromTo(S.bigcode, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' }, 1.6);
    tl.call(() => { S.bigBody.innerHTML = ''; }, null, 1.6);
    const sql = QS[3].sql, o2 = { n: 0, last: -1 };
    tl.to(o2, { n: sql.length, duration: sql.length / 30, ease: 'none', onUpdate() { const k = Math.round(o2.n); if (k !== o2.last) { o2.last = k; S.bigBody.innerHTML = codeLines(sql.slice(0, k), true); if (k % 2 === 0) ctx.sfx.play('type'); } } }, 2.0);
    tl.call(() => { S.bigBody.innerHTML = codeLines(sql); }, null, 2.0 + sql.length / 30 + 0.05);
    tl.fromTo(S.stats[1], { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 0.6, ease: 'expo.out' }, 2.6);
    tl.fromTo(S.stats[2], { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 0.6, ease: 'expo.out' }, 2.75);
  } else {
    tl.to(S.tagline, { opacity: 0, duration: 0.3 }, 0);
  }
  const tRun = rerun ? 0.3 : 3.4;
  tl.call(() => { S.sN.textContent = '……'; S.sMs.innerHTML = '……'; S.sMsL.textContent = ctx.python.status === 'ready' ? '建立十萬筆紀錄並執行中' : '查詢時間'; ctx.sfx.play('blip'); }, null, tRun - 0.2);
  tl.call(() => {
    // 讓「執行中」先顯示一格畫面，才開始（會短暫佔用瀏覽器的）Python
    ctx.track(gsap.delayedCall(0.06, () => {
      runBig(ctx).then(res => {
        if (!S.alive || S.gen !== gen) return;
        bigScan(S, ctx, res);
      });
    }));
  }, null, tRun);
}
function bigScan(S, ctx, res) {
  const fb = FALLBACK[3];
  const n = res ? res.n : fb.n;
  buildLayers(S, res ? res.ids : fallbackIds(fb.n));
  const tl = newTl(S, ctx);
  const o = { s: 0 };
  S.sweep = 0; drawField(S);
  tl.call(() => ctx.sfx.play('rise'), null, 0);
  tl.to(o, { s: CW + 70, duration: 1.6, ease: 'power1.inOut', onUpdate: () => { S.sweep = o.s; drawField(S); } }, 0);
  tl.call(() => setBigStats(S, n, res ? res.ms : null, !!res), null, 0);
  tl.add(S.fx.countUp(S.sN, n, { duration: 1.6 }), 0);
  tl.fromTo(S.stats[2], { scale: 1.08 }, { scale: 1, duration: 0.6, ease: 'back.out(3)', immediateRender: false }, 1.6);
  tl.call(() => ctx.sfx.play('success'), null, 1.6);
  tl.fromTo(S.tagline, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.7, ease: 'back.out(1.8)', immediateRender: false }, 1.8);
  tl.fromTo(S.learn, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', immediateRender: false }, 2.2);
}
