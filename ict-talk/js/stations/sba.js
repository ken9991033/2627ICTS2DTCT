// 15 校本評核 SBA：以「學校圖書館借還書系統」為例，走一次 分析 → 設計 → 實踐 → 測試 → 評估
// 步驟：1 分析＋設計　2 實踐（程式）　3 測試＋評估　4 五個階段收入時間軸，顯示「約 30 小時／佔 20%」
const gsap = window.gsap;

const ICON = {
  search: '<path d="m21 21-4.34-4.34"/> <circle cx="11" cy="11" r="8"/>',
  pen_tool: '<path d="m18 13-.654-4.736a4 4 0 00-2.756-3.266l-9.163-2.9a2 2 0 00-2.017.493l-.82.819a2 2 0 00-.492 2.017l2.9 9.163a4 4 0 003.266 2.756L13 18"/> <path d="M18.648 12.352a1.205 1.205 0 011.704 0l1.296 1.296a1.205 1.205 0 010 1.704l-6.296 6.296a1.205 1.205 0 01-1.704 0l-1.296-1.296a1.205 1.205 0 010-1.704z"/> <path d="m3 3 6.586 6.586"/> <circle cx="11" cy="11" r="2"/>',
  code_xml: '<path d="m18 16 4-4-4-4"/> <path d="m6 8-4 4 4 4"/> <path d="m14.5 4-5 16"/>',
  flask_conical: '<path d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2"/> <path d="M6.453 15h11.094"/> <path d="M8.5 2h7"/>',
  trending_up: '<path d="M16 7h6v6"/> <path d="m22 7-8.5 8.5-5-5L2 17"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  book_open: '<path d="M12 5v16"/> <path d="M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z"/>',
  x: '<path d="M18 6 6 18"/> <path d="m6 6 12 12"/>',
  scan_barcode: '<path d="M3 7V5a2 2 0 0 1 2-2h2"/> <path d="M17 3h2a2 2 0 0 1 2 2v2"/> <path d="M21 17v2a2 2 0 0 1-2 2h-2"/> <path d="M7 21H5a2 2 0 0 1-2-2v-2"/> <path d="M8 7v10"/> <path d="M12 7v10"/> <path d="M17 7v10"/>',
  bell: '<path d="M10.268 21a2 2 0 0 0 3.464 0"/> <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
  message_square_text: '<path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"/> <path d="M7 11h10"/> <path d="M7 15h6"/> <path d="M7 7h8"/>',
};
const ic = (k, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON[k]}</svg>`;

const STAGES = [['分析問題', 'search'], ['設計', 'pen_tool'], ['實踐', 'code_xml'], ['測試', 'flask_conical'], ['評估', 'trending_up']];
const NODE_X = [250, 605, 960, 1315, 1670];
const LINE_Y = 300;

// 站內鏡頭：所有「產出」排成一條長長的工作枱（track），鏡頭沿它平移
const TRACK_TOP = 450, CARD_H = 560, CAM_OY = 730;
const CARDS = [
  { x: 0, w: 1400 },    // 0 任務簡介
  { x: 1520, w: 640 },  // 1 需求清單（分析）
  { x: 2220, w: 640 },  // 2 流程圖（設計）
  { x: 2980, w: 760 },  // 3 程式碼（實踐）
  { x: 3860, w: 660 },  // 4 測試表（測試）
  { x: 4580, w: 640 },  // 5 改良建議（評估）
];
const VIEW = [
  { c: 700, on: [0], nodes: 0, cur: [] },
  { c: 2190, on: [1, 2], nodes: 2, cur: [0, 1] },
  { c: 3360, on: [3], nodes: 3, cur: [2] },
  { c: 4540, on: [4, 5], nodes: 5, cur: [3, 4] },
];
const OVERVIEW = { c: 2610, s: 0.3 };

const CODE = `def borrow(book_id):
    book = books[book_id]
    if book["可借"]:
        book["可借"] = False
        print("借書成功")
    else:
        print("此書已借出")`;

/** 有 timeline 時加入動畫；即時模式則直接設定最終狀態 */
function put(tl, target, vars, pos) {
  if (tl) return tl.to(target, vars, pos);
  const { duration, ease, stagger, delay, ...rest } = vars;
  gsap.set(target, rest);
  return null;
}

export default {
  id: 'sba',
  title: '校本評核：做一個屬於你的資訊系統',
  short: '校本評核',
  module: 'SBA',
  accent: '#a3e635',
  tint: ['#a3e635', '#22d3ee'],
  transition: { type: 'zoomOut' },
  steps: 4,
  minutes: 1,
  notes: `【校本評核 SBA｜約 1 分鐘】
進站：先讀出任務──「按指引，為一個真實問題設計及實踐一個資訊系統，並進行測試及評估。」以「學校圖書館借還書系統」作例子。上方的時間軸就是整個專題的五個階段。

按 →（分析＋設計）：鏡頭移到「需求清單」及「流程圖」。說：「先了解用家需要甚麼，再用流程圖設計系統怎樣運作。」可問同學：「如果那本書已經被借出，系統應該怎樣做？」

按 →（實踐）：程式碼逐行打出，並顯示執行結果。說：「這就是 D 單元學到的程式編寫，SBA 會真正派上用場。」

按 →（測試＋評估）：測試表第三行先顯示「未通過」，修正後變成通過。強調：「找出錯誤、修正、再測試，是專業的一部分。」最後提出改良建議及反思。

按 →：五個階段收入時間軸，顯示「約 30 小時」及「佔總分 20%」。重點句：「不是一試定生死──五分之一的分數來自平日的專題。」`,

  build(root, ctx) {
    const { fx } = ctx;
    this._tl = null; this._typing = null; this._pulses = [];
    const ticks = Array.from({ length: 12 }, (_, i) => {
      const a = i / 12 * Math.PI * 2;
      return `<line x1="${Math.sin(a) * 74}" y1="${-Math.cos(a) * 74}" x2="${Math.sin(a) * 84}" y2="${-Math.cos(a) * 84}"/>`;
    }).join('');
    root.innerHTML = `
      <div class="station-head">
        <div class="kicker">SCHOOL-BASED ASSESSMENT · SBA</div>
        <h1 class="h1">校本評核：做一個<span class="accent">屬於你</span>的資訊系統</h1>
      </div>

      <svg class="sba-line" width="1920" height="1080" viewBox="0 0 1920 1080" aria-hidden="true">
        <defs><linearGradient id="sbaLineG" x1="0" x2="1"><stop offset="0" stop-color="#a3e635"/><stop offset="1" stop-color="#22d3ee"/></linearGradient></defs>
        <path class="base" d="M${NODE_X[0]} ${LINE_Y} H${NODE_X[4]}"/>
        <path class="prog" d="M${NODE_X[0]} ${LINE_Y} H${NODE_X[4]}"/>
      </svg>
      <div class="sba-nodes">${STAGES.map(([name, icon], i) => `
        <div class="node" style="left:${NODE_X[i] - 46}px;top:${LINE_Y - 46}px">
          <i class="ring"></i>
          <div class="dot">${ic(icon, 'stage-ic')}${ic('check', 'done-ic')}</div>
          <div class="lab"><b>${i + 1}</b>${name}</div>
        </div>`).join('')}
      </div>

      <div class="sba-cam"><div class="sba-track">
        <div class="card c0 panel glow-edge" style="left:${CARDS[0].x}px;width:${CARDS[0].w}px">
          <div class="brief-ic">${ic('book_open')}</div>
          <div class="brief-txt">
            <div class="kicker">SBA 任務</div>
            <div class="h2">為一個<span class="accent">真實問題</span>，設計及實踐一個資訊系統</div>
            <p class="body">示範專題：學校圖書館的借書、還書全靠人手登記，<br>經常出錯。可以怎樣用資訊系統改善？</p>
            <div class="brief-foot">整個專題會經歷上面的五個階段 ↑</div>
          </div>
        </div>

        <div class="card c1 panel" style="left:${CARDS[1].x}px;width:${CARDS[1].w}px">
          <div class="head"><span class="badge">${ic('search')}</span><span class="t">需求清單</span><span class="tag">STAGE 1</span></div>
          <ul class="req">
            <li class="rv"><i class="box">${ic('check')}</i>學生可借書、還書及續借</li>
            <li class="rv"><i class="box">${ic('check')}</i>查詢書本是否可以借出</li>
            <li class="rv"><i class="box">${ic('check')}</i>逾期未還，自動發出提示</li>
            <li class="rv"><i class="box">${ic('check')}</i>管理員可新增書本資料</li>
          </ul>
          <div class="note rv">先了解用家真正需要甚麼</div>
        </div>

        <div class="card c2 panel" style="left:${CARDS[2].x}px;width:${CARDS[2].w}px">
          <div class="head"><span class="badge">${ic('pen_tool')}</span><span class="t">流程圖</span><span class="tag">STAGE 2</span></div>
          <svg class="flow" viewBox="0 0 560 400" width="560" height="400">
            <defs><marker id="sbaArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#a3e635"/></marker></defs>
            <rect class="sh" x="150" y="2" width="140" height="48" rx="24"/>
            <path class="cn" d="M220 50 V76" marker-end="url(#sbaArrow)"/>
            <rect class="sh" x="60" y="80" width="320" height="60" rx="10"/>
            <path class="cn" d="M220 140 V166" marker-end="url(#sbaArrow)"/>
            <path class="sh dia" d="M220 170 L330 230 L220 290 L110 230 Z"/>
            <path class="cn" d="M220 290 V324" marker-end="url(#sbaArrow)"/>
            <path class="cn" d="M330 230 H396" marker-end="url(#sbaArrow)"/>
            <rect class="sh" x="60" y="328" width="320" height="60" rx="10"/>
            <rect class="sh warn" x="400" y="200" width="152" height="60" rx="10"/>
            <g class="tx">
              <text x="220" y="27">開始</text>
              <text x="220" y="111">輸入書本編號</text>
              <text x="220" y="231">可借？</text>
              <text x="220" y="359">記錄借出及到期日</text>
              <text x="476" y="231">顯示提示</text>
              <text class="yn" x="244" y="312">是</text>
              <text class="yn" x="362" y="216">否</text>
            </g>
          </svg>
        </div>

        <div class="card c3 panel" style="left:${CARDS[3].x}px;width:${CARDS[3].w}px">
          <div class="head"><span class="badge">${ic('code_xml')}</span><span class="t">程式編寫</span><span class="tag">STAGE 3</span></div>
          <div class="codebox"><pre class="code sba-code">${fx.highlightPython(CODE)}</pre></div>
          <div class="out rv"><span class="pr">&gt;&gt;&gt; borrow("B042")</span><span class="ok">借書成功</span></div>
        </div>

        <div class="card c4 panel" style="left:${CARDS[4].x}px;width:${CARDS[4].w}px">
          <div class="head"><span class="badge">${ic('flask_conical')}</span><span class="t">測試表</span><span class="tag">STAGE 4</span></div>
          <div class="tbl">
            <div class="tr th"><span>測試數據</span><span>預期結果</span><span>結果</span></div>
            <div class="tr rv"><span>可借的書</span><span>借書成功</span><span class="res pass">${ic('check')}通過</span></div>
            <div class="tr rv"><span>已借出的書</span><span>顯示提示</span><span class="res pass">${ic('check')}通過</span></div>
            <div class="tr rv r3"><span>不存在的編號</span><span>顯示錯誤</span><span class="res-wrap"><span class="res fail">${ic('x')}未通過</span><span class="res pass fixed">${ic('check')}已修正</span></span></div>
          </div>
          <div class="loop rv">發現錯誤 → 修正程式 → 再測試</div>
        </div>

        <div class="card c5 panel" style="left:${CARDS[5].x}px;width:${CARDS[5].w}px">
          <div class="head"><span class="badge">${ic('trending_up')}</span><span class="t">評估及改良</span><span class="tag">STAGE 5</span></div>
          <ul class="imp">
            <li class="rv">${ic('scan_barcode')}加入條碼掃描，借書更快</li>
            <li class="rv">${ic('bell')}到期前自動發出提示</li>
            <li class="rv">${ic('message_square_text')}收集用家意見，再作改良</li>
          </ul>
          <div class="reflect rv">反思：系統是否解決了原本的問題？</div>
        </div>
      </div></div>

      <div class="sba-stats">
        <div class="stat s-hours panel glow-edge">
          <svg class="clock" viewBox="-110 -110 220 220" width="220" height="220"><circle class="trk" r="96"/><circle class="arc" r="96" transform="rotate(-90)"/><g class="tk">${ticks}</g><path class="hand" d="M0 0 V-58"/><path class="hand h2" d="M0 0 H40"/><circle class="pin" r="7"/></svg>
          <div class="info">
            <div class="num"><small>約</small><b class="v-h">30</b><small>小時</small></div>
            <div class="cap">完成一個資訊系統專題</div>
          </div>
        </div>
        <div class="stat s-pct panel glow-edge">
          <div class="num"><small>佔總分</small><b class="v-p">20</b><small>%</small></div>
          <div class="blocks"><i class="on">SBA</i><i></i><i></i><i></i><i></i></div>
          <div class="cap">即全科總分的<b>五分之一</b></div>
        </div>
        <div class="sba-banner panel">不是一試定生死：<span class="accent">五分之一</span>的分數來自平日的專題</div>
      </div>
    `;

    const css = document.createElement('style');
    css.textContent = `
      .st-sba .station-head .kicker { font-size:24px; }
      .st-sba .ic { width:100%; height:100%; display:block; }

      /* 時間軸 */
      .st-sba .sba-line { position:absolute; left:0; top:0; pointer-events:none; }
      .st-sba .sba-line path { fill:none; stroke-linecap:round; }
      .st-sba .sba-line .base { stroke:rgba(160,180,255,.18); stroke-width:6; stroke-dasharray:2 14; }
      .st-sba .sba-line .prog { stroke:url(#sbaLineG); stroke-width:8; filter:drop-shadow(0 0 10px rgba(163,230,53,.7)); }
      .st-sba .node { position:absolute; width:92px; height:92px; }
      .st-sba .node .ring { position:absolute; inset:0; border-radius:50%; border:3px solid var(--accent); opacity:0; }
      .st-sba .node .dot { position:absolute; inset:0; border-radius:50%; display:grid; place-items:center; background:#0b1024; border:3px solid var(--line-strong); color:var(--ink-3); transition:background .5s, border-color .5s, color .5s, box-shadow .5s; }
      .st-sba .node .dot .ic { width:44px; height:44px; grid-area:1/1; }
      .st-sba .node .done-ic { opacity:0; transform:scale(.4); transition:opacity .4s, transform .5s var(--ease-out); }
      .st-sba .node .stage-ic { transition:opacity .3s; }
      .st-sba .node.on .dot { border-color:var(--accent); color:var(--accent); background:#121d0c; box-shadow:0 0 30px rgba(163,230,53,.45), inset 0 0 18px rgba(163,230,53,.25); }
      .st-sba .node.done .dot { background:var(--accent); color:#0a1204; border-color:var(--accent); box-shadow:0 0 36px rgba(163,230,53,.6); }
      .st-sba .node.done .stage-ic { opacity:0; }
      .st-sba .node.done .done-ic { opacity:1; transform:scale(1); stroke-width:3; }
      .st-sba .node .lab { position:absolute; top:104px; left:50%; width:260px; margin-left:-130px; text-align:center; font-size:30px; font-weight:800; color:var(--ink-3); transition:color .5s; white-space:nowrap; }
      .st-sba .node .lab b { font:800 24px var(--mono); color:var(--ink-3); margin-right:10px; }
      .st-sba .node.on .lab, .st-sba .node.done .lab { color:var(--ink); }
      .st-sba .node.on .lab b, .st-sba .node.done .lab b { color:var(--accent); }

      /* 站內鏡頭 */
      .st-sba .sba-cam { position:absolute; left:0; top:0; width:1920px; height:1080px; transform-origin:960px ${CAM_OY}px; }
      .st-sba .sba-track { position:absolute; left:0; top:${TRACK_TOP}px; width:5300px; height:${CARD_H}px; }
      .st-sba .card { position:absolute; top:0; height:${CARD_H}px; padding:30px 40px; opacity:.22; }
      .st-sba .card.c0 { top:40px; height:470px; display:flex; align-items:center; gap:56px; padding:40px 64px; opacity:1; }
      .st-sba .brief-ic { flex:0 0 200px; height:200px; border-radius:50%; display:grid; place-items:center; color:var(--accent); background:radial-gradient(circle, rgba(163,230,53,.22), rgba(163,230,53,.04) 70%); border:2px solid rgba(163,230,53,.5); box-shadow:0 0 60px rgba(163,230,53,.25); }
      .st-sba .brief-ic .ic { width:100px; height:100px; }
      .st-sba .brief-txt .kicker { font-size:24px; margin-bottom:12px; }
      .st-sba .brief-txt .h2 { margin-bottom:18px; }
      .st-sba .brief-txt .body { margin:0 0 18px; font-size:32px; color:var(--ink-2); }
      .st-sba .brief-foot { font-size:28px; color:var(--accent); font-weight:700; }

      .st-sba .head { display:flex; align-items:center; gap:18px; margin-bottom:24px; }
      .st-sba .badge { width:64px; height:64px; padding:14px; border-radius:18px; color:var(--accent); background:rgba(163,230,53,.12); border:2px solid rgba(163,230,53,.6); flex:none; }
      .st-sba .head .t { font-size:40px; font-weight:900; }
      .st-sba .head .tag { margin-left:auto; font:800 24px var(--mono); color:var(--accent); letter-spacing:.12em; }
      .st-sba .rv { opacity:0; }

      .st-sba .req { list-style:none; margin:0; padding:0; }
      .st-sba .req li { display:flex; align-items:center; gap:18px; font-size:30px; padding:16px 0; border-bottom:1px dashed var(--line); }
      .st-sba .req .box { flex:none; width:40px; height:40px; padding:5px; border-radius:10px; border:2px solid var(--accent); color:var(--accent); }
      .st-sba .req .box .ic { stroke-width:3; }
      .st-sba .note { margin-top:26px; font-size:28px; color:var(--accent); font-weight:700; }

      .st-sba .flow { display:block; overflow:visible; }
      .st-sba .flow .sh { fill:rgba(163,230,53,.07); stroke:#a3e635; stroke-width:3; }
      .st-sba .flow .sh.warn { stroke:#fbbf24; fill:rgba(251,191,36,.08); }
      .st-sba .flow .cn { fill:none; stroke:#a3e635; stroke-width:3; }
      .st-sba .flow text { fill:#eef1ff; font:700 26px var(--font); text-anchor:middle; dominant-baseline:central; }
      .st-sba .flow text.yn { fill:#a3e635; font-size:24px; }

      .st-sba .codebox { background:#060915; border:1px solid var(--line); border-radius:16px; padding:18px 24px; }
      .st-sba .sba-code { margin:0; font-size:26px; line-height:1.55; visibility:hidden; }
      .st-sba .out { margin-top:18px; display:flex; gap:24px; align-items:center; font:500 26px var(--mono); padding:14px 22px; border-radius:14px; background:rgba(163,230,53,.08); border:1px solid rgba(163,230,53,.4); }
      .st-sba .out .pr { color:var(--ink-2); }
      .st-sba .out .ok { color:#d9f99d; font-weight:800; font-family:var(--font); font-size:30px; margin-left:auto; }

      .st-sba .tbl { border:1px solid var(--line); border-radius:16px; overflow:hidden; }
      .st-sba .tr { display:grid; grid-template-columns:215px 175px 1fr; align-items:center; gap:12px; padding:0 20px; height:84px; font-size:28px; border-top:1px solid var(--line); }
      .st-sba .tr.th { height:58px; border-top:0; font-size:24px; color:var(--ink-3); font-weight:700; background:rgba(255,255,255,.03); }
      .st-sba .res { display:inline-flex; align-items:center; gap:8px; font-weight:800; white-space:nowrap; }
      .st-sba .res .ic { width:30px; height:30px; stroke-width:3; }
      .st-sba .res.pass { color:var(--accent); }
      .st-sba .res.fail { color:#ff6b8f; }
      .st-sba .res-wrap { display:grid; }
      .st-sba .res-wrap > * { grid-area:1/1; }
      .st-sba .res.fixed { opacity:0; }
      .st-sba .loop { margin-top:24px; font-size:28px; font-weight:700; color:var(--accent); }

      .st-sba .imp { list-style:none; margin:0; padding:0; }
      .st-sba .imp li { display:flex; align-items:center; gap:20px; font-size:30px; padding:20px 0; border-bottom:1px dashed var(--line); }
      .st-sba .imp li .ic { flex:none; width:44px; height:44px; color:var(--accent); }
      .st-sba .reflect { margin-top:28px; font-size:28px; color:var(--ink-2); padding:16px 20px; border-left:4px solid var(--accent); background:rgba(163,230,53,.06); border-radius:0 12px 12px 0; }

      /* 大數字 */
      .st-sba .sba-stats { position:absolute; inset:0; pointer-events:none; }
      .st-sba .stat { position:absolute; top:460px; height:340px; opacity:0; }
      .st-sba .s-hours { left:160px; width:760px; display:flex; align-items:center; gap:40px; padding:0 50px; }
      .st-sba .clock { flex:none; overflow:visible; }
      .st-sba .clock circle { fill:none; }
      .st-sba .clock .trk { stroke:rgba(163,230,53,.15); stroke-width:14; }
      .st-sba .clock .arc { stroke:#a3e635; stroke-width:14; stroke-linecap:round; filter:drop-shadow(0 0 10px rgba(163,230,53,.8)); }
      .st-sba .clock .tk line { stroke:rgba(238,241,255,.45); stroke-width:4; stroke-linecap:round; }
      .st-sba .clock .hand { stroke:#eef1ff; stroke-width:8; stroke-linecap:round; fill:none; }
      .st-sba .clock .hand.h2 { stroke:#a3e635; }
      .st-sba .clock .pin { fill:#a3e635; }
      .st-sba .num { display:flex; align-items:baseline; gap:12px; line-height:1; }
      .st-sba .num b { font-size:160px; font-weight:900; color:var(--accent); letter-spacing:-.03em; text-shadow:0 0 40px rgba(163,230,53,.45); font-variant-numeric:tabular-nums; }
      .st-sba .num small { font-size:44px; font-weight:800; color:var(--ink); }
      .st-sba .cap { margin-top:18px; font-size:30px; color:var(--ink-2); }
      .st-sba .cap b { color:var(--accent); }
      .st-sba .s-pct { left:1000px; width:760px; padding:40px 56px; display:flex; flex-direction:column; justify-content:center; }
      .st-sba .blocks { display:flex; gap:12px; margin-top:22px; }
      .st-sba .blocks i { flex:1; height:52px; border-radius:12px; border:2px solid var(--line-strong); background:rgba(255,255,255,.03); display:grid; place-items:center; font:800 24px var(--mono); font-style:normal; color:#0a1204; }
      .st-sba .blocks i.on { background:var(--accent); border-color:var(--accent); box-shadow:0 0 30px rgba(163,230,53,.6); }
      .st-sba .sba-banner { position:absolute; left:260px; width:1400px; top:850px; height:120px; display:grid; place-items:center; font-size:44px; font-weight:900; opacity:0; border-color:rgba(163,230,53,.45); }
    `;
    root.appendChild(css);

    const S = this._s = {
      track: root.querySelector('.sba-track'),
      cam: root.querySelector('.sba-cam'),
      cards: [...root.querySelectorAll('.card')],
      nodes: [...root.querySelectorAll('.node')],
      prog: root.querySelector('.sba-line .prog'),
      base: root.querySelector('.sba-line .base'),
    };
    gsap.set(S.track, { x: 960 - VIEW[0].c });
    gsap.set(S.prog, { drawSVG: '0% 0%' });
    gsap.set(root.querySelectorAll('.flow .sh, .flow .cn'), { drawSVG: '0%' });
    gsap.set(root.querySelector('.flow .tx'), { opacity: 0 });
  },

  enter(root, ctx, { instant }) {
    ctx.bg.hideParticles(0.3);
    if (instant) return;
    const S = this._s;
    const tl = this._tl = ctx.tl();
    tl.from(root.querySelector('.station-head'), { opacity: 0, y: 30, duration: 0.8, ease: 'expo.out' }, 0.2);
    tl.from(S.base, { drawSVG: '0%', duration: 1.1, ease: 'power2.inOut' }, 0.3);
    tl.from(S.nodes.map(n => n.querySelector('.dot')), { scale: 0, duration: 0.6, ease: 'back.out(2.2)', stagger: 0.12 }, 0.45);
    tl.from(S.nodes.map(n => n.querySelector('.lab')), { opacity: 0, y: 16, duration: 0.5, stagger: 0.12 }, 0.6);
    tl.call(() => ctx.sfx.play('pop'), null, 0.5);
    tl.from(S.cards[0], { opacity: 0, y: 60, scale: 0.92, duration: 1, ease: 'expo.out' }, 0.9);
    tl.from(S.cards[0].querySelectorAll('.brief-ic, .brief-txt > *'), { opacity: 0, x: 40, duration: 0.7, stagger: 0.1, ease: 'power3.out' }, 1.1);
  },

  step(root, ctx, n, { instant }) {
    this._finish();
    const S = this._s;
    const tl = instant ? null : (this._tl = ctx.tl());

    if (n >= 1 && n <= 3) {
      this._camTo(VIEW[n], tl);
      this._nodesTo(VIEW[n], tl, ctx, 0.4);
      if (tl) tl.call(() => ctx.sfx.play('whoosh'), null, 0);
    }

    if (n === 1) {
      const items = S.cards[1].querySelectorAll('.req li');
      put(tl, items, { opacity: 1, x: 0, duration: 0.5, stagger: 0.18, ease: 'power3.out' }, 1.0);
      if (tl) { tl.set(items, { x: -30 }, 0); items.forEach((_, i) => tl.call(() => ctx.sfx.play('tick'), null, 1.0 + i * 0.18)); }
      put(tl, S.cards[1].querySelector('.note'), { opacity: 1, duration: 0.5 }, 1.8);
      const flow = S.cards[2];
      put(tl, flow.querySelectorAll('.flow .sh, .flow .cn'), { drawSVG: '100%', duration: 0.5, stagger: 0.12, ease: 'power2.inOut' }, 1.2);
      put(tl, flow.querySelector('.flow .tx'), { opacity: 1, duration: 0.6 }, 2.2);
    }

    if (n === 2) {
      const pre = S.cards[3].querySelector('.sba-code');
      const out = S.cards[3].querySelector('.out');
      if (tl) {
        const typing = this._typing = ctx.fx.typeOn(pre, { cps: 55, sfx: ctx.sfx, cursor: false });
        pre.style.visibility = 'visible';
        tl.add(typing, 1.1);
        const t1 = 1.1 + typing.duration() + 0.2;
        tl.fromTo(out, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'back.out(2)' }, t1);
        tl.add(ctx.fx.scramble(out.querySelector('.ok'), '借書成功', { chars: '01#*', duration: 0.6 }), t1);
        tl.call(() => ctx.sfx.play('success'), null, t1 + 0.3);
      } else {
        pre.style.visibility = 'visible';
        gsap.set(out, { opacity: 1, y: 0 });
      }
    }

    if (n === 3) {
      const rows = S.cards[4].querySelectorAll('.tr.rv');
      const fail = S.cards[4].querySelector('.res.fail');
      const fixed = S.cards[4].querySelector('.res.fixed');
      if (tl) {
        tl.fromTo(rows, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.45, stagger: 0.35, ease: 'power3.out' }, 1.0);
        tl.call(() => ctx.sfx.play('tick'), null, 1.0);
        tl.call(() => ctx.sfx.play('tick'), null, 1.35);
        tl.call(() => ctx.sfx.play('error'), null, 1.7);
        tl.fromTo(rows[2], { backgroundColor: 'rgba(255,61,127,.18)' }, { backgroundColor: 'rgba(255,61,127,0)', duration: 1.2 }, 1.7);
        tl.to(fail, { opacity: 0, y: -16, duration: 0.3 }, 2.7);
        tl.fromTo(fixed, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, ease: 'back.out(2)' }, 2.85);
        tl.call(() => ctx.sfx.play('success'), null, 2.85);
        tl.to(S.cards[4].querySelector('.loop'), { opacity: 1, duration: 0.5 }, 3.0);
        tl.fromTo(S.cards[5].querySelectorAll('.imp li'), { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.45, stagger: 0.2, ease: 'power3.out' }, 3.2);
        tl.to(S.cards[5].querySelector('.reflect'), { opacity: 1, duration: 0.5 }, 3.9);
      } else {
        gsap.set(rows, { opacity: 1, x: 0 });
        gsap.set(fail, { opacity: 0 });
        gsap.set(fixed, { opacity: 1, y: 0 });
        gsap.set(S.cards[4].querySelector('.loop'), { opacity: 1 });
        gsap.set(S.cards[5].querySelectorAll('.imp li, .reflect'), { opacity: 1, x: 0 });
      }
    }

    if (n === 4) this._collapse(root, ctx, tl);
  },

  /** 完成上一段動畫，避免兩段同時進行 */
  _finish() {
    if (this._typing) { this._typing.progress(1); this._typing = null; }
    if (this._tl) { this._tl.progress(1); this._tl = null; }
  },

  _camTo(view, tl) {
    const S = this._s;
    const x = 960 - view.c;
    if (tl) {
      tl.to(S.track, { x, duration: 1.4, ease: 'power3.inOut' }, 0);
      tl.to(S.cam, { scale: 0.8, duration: 0.65, ease: 'power2.inOut' }, 0);
      tl.to(S.cam, { scale: 1, duration: 0.75, ease: 'power2.out' }, 0.65);
    } else {
      gsap.set(S.track, { x }); gsap.set(S.cam, { scale: 1 });
    }
    S.cards.forEach((c, i) => {
      const on = view.on.includes(i);
      put(tl, c, { opacity: on ? 1 : 0.22, duration: 0.8 }, on ? 0.6 : 0);
      if (tl) tl.call(() => c.classList.toggle('glow-edge', on), null, on ? 0.9 : 0);
      else c.classList.toggle('glow-edge', on);
    });
  },

  /** 時間軸亮到第 k 個階段 */
  _nodesTo(view, tl, ctx, at = 0) {
    const S = this._s;
    const k = view.nodes;
    put(tl, S.prog, { drawSVG: `0% ${Math.max(0, (k - 1) * 25)}%`, duration: 1.0, ease: 'power2.inOut' }, at);
    const apply = () => {
      this._pulses.forEach(p => p.kill()); this._pulses = [];
      S.nodes.forEach((nd, i) => {
        const wasOn = nd.classList.contains('on');
        nd.classList.toggle('on', i < k);
        if (i < k && !wasOn && tl) gsap.fromTo(nd.querySelector('.dot'), { scale: 0.7 }, { scale: 1, duration: 0.6, ease: 'back.out(3)' });
      });
      // 目前階段的光環脈動
      view.cur.map(i => S.nodes[i]).forEach(nd => {
        const r = nd.querySelector('.ring');
        this._pulses.push(ctx.track(gsap.fromTo(r, { scale: 1, opacity: 0.9 }, { scale: 1.9, opacity: 0, duration: 1.6, repeat: -1, ease: 'power1.out' })));
      });
    };
    if (tl) { tl.call(apply, null, at + 0.6); tl.call(() => ctx.sfx.play('pop'), null, at + 0.6); }
    else apply();
  },

  /** 第 4 步：鏡頭拉遠看見全部產出 → 各自飛入時間軸 → 大數字 */
  _collapse(root, ctx, tl) {
    const S = this._s;
    const { c, s } = OVERVIEW;
    const tx = 960 - c;
    const stats = root.querySelectorAll('.stat');
    const banner = root.querySelector('.sba-banner');
    const markDone = () => {
      this._pulses.forEach(p => p.kill()); this._pulses = [];
      S.nodes.forEach(nd => { nd.classList.add('on', 'done'); });
    };
    if (!tl) {
      gsap.set(S.track, { x: tx }); gsap.set(S.cam, { scale: s, autoAlpha: 0 });
      gsap.set(S.prog, { drawSVG: '0% 100%' });
      markDone();
      gsap.set([...stats, banner], { opacity: 1, y: 0 });
      gsap.set(root.querySelector('.clock .arc'), { drawSVG: '0% 100%' });
      return;
    }
    tl.call(() => ctx.sfx.play('whooshOut'), null, 0);
    tl.to(S.track, { x: tx, duration: 1.2, ease: 'power3.inOut' }, 0);
    tl.to(S.cam, { scale: s, duration: 1.2, ease: 'power3.inOut' }, 0);
    tl.to(S.cards, { opacity: 1, duration: 0.6 }, 0.2);
    tl.to(S.prog, { drawSVG: '0% 100%', duration: 1.2, ease: 'power2.inOut' }, 0.4);
    // 每張卡飛入對應的階段節點
    tl.to(S.cards[0], { opacity: 0, scale: 0.6, duration: 0.5 }, 1.35);
    S.cards.slice(1).forEach((card, j) => {
      const k = CARDS[j + 1];
      const X = 960 + (tx + k.x + k.w / 2 - 960) * s;
      const Y = CAM_OY + (TRACK_TOP + CARD_H / 2 - CAM_OY) * s;
      const dx = (NODE_X[j] - X) / s, dy = (LINE_Y - Y) / s;
      const at = 1.45 + j * 0.14;
      tl.to(card, { x: dx, y: dy, scale: 0.1, opacity: 0, duration: 0.75, ease: 'power3.in' }, at);
      tl.call(() => {
        const nd = S.nodes[j];
        nd.classList.add('on', 'done');
        gsap.fromTo(nd.querySelector('.dot'), { scale: 1.45 }, { scale: 1, duration: 0.6, ease: 'back.out(3)' });
        ctx.fx.pulseAt(root, NODE_X[j], LINE_Y, '#a3e635');
        ctx.sfx.play('pop');
      }, null, at + 0.72);
    });
    tl.call(markDone, null, 2.9);
    tl.set(S.cam, { autoAlpha: 0 }, 2.9);
    // 大數字
    tl.fromTo(stats, { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.18, ease: 'expo.out' }, 2.8);
    tl.call(() => ctx.sfx.play('reveal'), null, 2.8);
    tl.fromTo(root.querySelector('.clock .arc'), { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 1.4, ease: 'power2.inOut' }, 3.0);
    tl.fromTo(root.querySelector('.clock .h2'), { rotation: -120, svgOrigin: '0 0' }, { rotation: 0, svgOrigin: '0 0', duration: 1.4, ease: 'power2.inOut' }, 3.0);
    tl.add(ctx.fx.countUp(root.querySelector('.v-h'), 30, { duration: 1.4 }), 3.0);
    tl.add(ctx.fx.countUp(root.querySelector('.v-p'), 20, { duration: 1.4 }), 3.1);
    tl.fromTo(root.querySelectorAll('.blocks i'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.08 }, 3.2);
    tl.fromTo(root.querySelector('.blocks i.on'), { scale: 1.4 }, { scale: 1, duration: 0.7, ease: 'elastic.out(1, .5)' }, 3.8);
    tl.fromTo(banner, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.6)' }, 4.2);
    tl.call(() => ctx.sfx.play('success'), null, 4.3);
  },
};
