// 16 評核：DSE 怎樣計分？ 大型動態環形圖 55% / 25% / 20%
// 步驟：1 卷一 必修部分 55%　2 卷二 選修部分 25%　3 校本評核 SBA 20%（之後合共 100%）
const gsap = window.gsap;

const ICON = {
  file_text: '<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/> <path d="M14 2v5a1 1 0 0 0 1 1h5"/> <path d="M10 9H8"/> <path d="M16 13H8"/> <path d="M16 17H8"/>',
  layers_2: '<path d="M13 13.74a2 2 0 0 1-2 0L2.5 8.87a1 1 0 0 1 0-1.74L11 2.26a2 2 0 0 1 2 0l8.5 4.87a1 1 0 0 1 0 1.74z"/> <path d="m20 14.285 1.5.845a1 1 0 0 1 0 1.74L13 21.74a2 2 0 0 1-2 0l-8.5-4.87a1 1 0 0 1 0-1.74l1.5-.845"/>',
  folder_kanban: '<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/> <path d="M8 10v4"/> <path d="M12 10v2"/> <path d="M16 10v6"/>',
};
const ic = k => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON[k]}</svg>`;

// 只用課程文件的比重
const PARTS = [
  { v: 55, from: 0, to: 55, color: '#ff3d7f', t: '卷一', sub: '必修部分', d: '考核五個必修單元', icon: 'file_text' },
  { v: 25, from: 55, to: 80, color: '#fb923c', t: '卷二', sub: '選修部分', d: '回答所選的兩個選修單元', icon: 'layers_2' },
  { v: 20, from: 80, to: 100, color: '#a3e635', t: '校本評核', sub: 'SBA', d: '約 30 小時的資訊系統專題', icon: 'folder_kanban' },
];
const CX = 600, CY = 625, R = 250, SW = 110;
const CARD_X = 1080, CARD_W = 720, CARD_H = 196, CARD_TOP = [262, 488, 714];
const GAP = 0.35; // 每段之間的空隙（%）
// 旋轉圓環，令目前一段的中點指向右方（3 點鐘），正對說明卡
const rotFor = k => { const p = PARTS[k]; return 90 - ((p.from + p.to) / 2) * 3.6; };
/** 數字跳動（不會在建立時立即改寫文字） */
const num = (el, from, to, duration = 1) => { const o = { v: from }; return gsap.to(o, { v: to, duration, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(o.v); } }); };
const midRad = k => { const p = PARTS[k]; return ((p.from + p.to) / 2) * 3.6 * Math.PI / 180; };

export default {
  id: 'assess',
  title: '評核：DSE 怎樣計分？',
  short: '評核比重',
  accent: '#ff3d7f',
  tint: ['#ff3d7f', '#a78bfa'],
  transition: { type: 'flip' },
  steps: 3,
  minutes: 0.75,
  notes: `【評核比重｜約 45 秒】
進站：環形圖代表 DSE ICT 的全科總分（100%）。可先問同學：「你們估計 SBA 佔多少分？」

按 →（卷一）：紅色一段畫出，佔 55%。說：「卷一考核必修部分，即我們剛才旅程中的五個單元。」

按 →（卷二）：橙色一段畫出，佔 25%。說：「卷二考核選修部分，同學只需回答自己所選的兩個選修單元。」

按 →（SBA）：綠色一段畫出，佔 20%，之後中央顯示 55＋25＋20＝100%。說：「五分之一的分數來自校本評核，平日認真做專題，就已經為 DSE 打好基礎。」
（不需要提及考試時間或題數。）`,

  build(root) {
    this._tl = null; this._spin = null;
    const ticks = Array.from({ length: 100 }, (_, i) => {
      const a = i * 3.6 * Math.PI / 180, major = i % 5 === 0;
      const r1 = 346, r2 = major ? 368 : 358;
      return `<line class="${major ? 'mj' : ''}" x1="${(Math.sin(a) * r1).toFixed(1)}" y1="${(-Math.cos(a) * r1).toFixed(1)}" x2="${(Math.sin(a) * r2).toFixed(1)}" y2="${(-Math.cos(a) * r2).toFixed(1)}"/>`;
    }).join('');
    root.innerHTML = `
      <div class="station-head">
        <div class="kicker">HKDSE · ASSESSMENT</div>
        <h1 class="h1">評核：DSE <span class="accent">怎樣計分</span>？</h1>
      </div>

      <svg class="as-donut" width="780" height="780" viewBox="-390 -390 780 780" aria-hidden="true">
        <defs>
          <radialGradient id="asCore"><stop offset="0" stop-color="#1a1036"/><stop offset=".8" stop-color="#0a0b1c"/><stop offset="1" stop-color="#05060f"/></radialGradient>
          <filter id="asGlow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="10" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <g class="spin">
          <g class="ticks">${ticks}</g>
          <circle class="trk" r="${R}"/>
          ${PARTS.map((p, i) => `<g class="segwrap s${i}"><circle class="seg" r="${R}" transform="rotate(-90)" stroke="${p.color}"/></g>`).join('')}
        </g>
        <circle class="core" r="${R - SW / 2 - 6}"/>
        <circle class="core-ring" r="${R - SW / 2 - 6}"/>
        <g class="orbit"><circle class="comet" cx="0" cy="-378" r="6"/></g>
      </svg>
      <div class="as-center">
        <div class="pct"><b class="v">100</b><small>%</small></div>
        <div class="lab">全科總分</div>
      </div>

      <svg class="as-links" width="1920" height="1080" viewBox="0 0 1920 1080" aria-hidden="true">
        ${CARD_TOP.map((t, i) => `<path class="lk l${i}" stroke="${PARTS[i].color}" d="M985 ${CY} C1035 ${CY} 1030 ${t + CARD_H / 2} ${CARD_X} ${t + CARD_H / 2}"/>`).join('')}
        <circle class="lk-dot" cx="985" cy="${CY}" r="8"/>
      </svg>

      ${CARD_TOP.map((t, i) => `<div class="as-ghost" style="left:${CARD_X}px;top:${t}px"><span>${['卷一', '卷二', 'SBA'][i]}</span><b>?</b></div>`).join('')}
      ${PARTS.map((p, i) => `
        <div class="as-card panel c${i}" style="--c:${p.color};left:${CARD_X}px;top:${CARD_TOP[i]}px">
          <div class="wm">${ic(p.icon)}</div>
          <div class="pc"><b>${p.v}</b><small>%</small></div>
          <div class="txt">
            <div class="t">${p.t}<span>${p.sub}</span></div>
            <div class="d">${p.d}</div>
          </div>
        </div>`).join('')}
    `;
    const css = document.createElement('style');
    css.textContent = `
      .st-assess .station-head .kicker { font-size:24px; }
      .st-assess .as-donut { position:absolute; left:${CX - 390}px; top:${CY - 390}px; overflow:visible; }
      .st-assess .ticks line { stroke:rgba(180,190,255,.22); stroke-width:2; }
      .st-assess .ticks line.mj { stroke:rgba(220,225,255,.5); stroke-width:3; }
      .st-assess .trk { fill:none; stroke:rgba(160,180,255,.07); stroke-width:${SW}; }
      .st-assess .seg { fill:none; stroke-width:${SW}; filter:url(#asGlow); }
      .st-assess .core { fill:url(#asCore); }
      .st-assess .core-ring { fill:none; stroke:rgba(160,180,255,.18); stroke-width:2; stroke-dasharray:4 10; }
      .st-assess .comet { fill:#fff; filter:url(#asGlow); }
      .st-assess .as-center { position:absolute; left:${CX - 180}px; top:${CY - 180}px; width:360px; height:360px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; pointer-events:none; }
      .st-assess .pct { display:flex; align-items:baseline; line-height:1; font-weight:900; color:var(--ink); }
      .st-assess .pct b { font-size:150px; letter-spacing:-.04em; font-variant-numeric:tabular-nums; text-shadow:0 0 50px currentColor; }
      .st-assess .pct small { font-size:64px; margin-left:4px; }
      .st-assess .lab { margin-top:10px; font-size:36px; font-weight:800; color:var(--ink-2); white-space:nowrap; }
      .st-assess .as-links { position:absolute; left:0; top:0; pointer-events:none; overflow:visible; }
      .st-assess .lk { fill:none; stroke-width:4; stroke-linecap:round; opacity:0; filter:drop-shadow(0 0 6px currentColor); }
      .st-assess .lk-dot { fill:#fff; opacity:0; }
      .st-assess .as-ghost { position:absolute; width:${CARD_W}px; height:${CARD_H}px; border:2px dashed rgba(160,180,255,.18); border-radius:var(--r-lg); display:flex; align-items:center; gap:28px; padding:0 48px; color:rgba(180,190,230,.35); }
      .st-assess .as-ghost b { font-size:96px; font-weight:900; margin-left:auto; }
      .st-assess .as-ghost span { font-size:40px; font-weight:800; }
      .st-assess .as-card { position:absolute; width:${CARD_W}px; height:${CARD_H}px; padding:0 40px 0 0; display:flex; align-items:center; overflow:hidden; opacity:0; border-color:color-mix(in srgb, var(--c) 35%, transparent); }
      .st-assess .as-card::before { content:""; position:absolute; left:0; top:0; bottom:0; width:10px; background:var(--c); box-shadow:0 0 24px var(--c); }
      .st-assess .as-card.on { border-color:var(--c); box-shadow:0 0 0 1px color-mix(in srgb, var(--c) 40%, transparent), 0 0 60px color-mix(in srgb, var(--c) 30%, transparent), 0 24px 80px rgba(0,0,0,.4); }
      .st-assess .as-card .wm { position:absolute; right:-20px; top:50%; width:190px; height:190px; margin-top:-95px; color:var(--c); opacity:.1; }
      .st-assess .as-card .wm .ic { width:100%; height:100%; }
      .st-assess .pc { flex:0 0 240px; display:flex; align-items:baseline; justify-content:center; color:var(--c); line-height:1; font-weight:900; }
      .st-assess .pc b { font-size:104px; letter-spacing:-.04em; text-shadow:0 0 36px color-mix(in srgb, var(--c) 60%, transparent); }
      .st-assess .pc small { font-size:44px; margin-left:4px; }
      .st-assess .txt { position:relative; }
      .st-assess .t { font-size:44px; font-weight:900; line-height:1.2; }
      .st-assess .t span { margin-left:16px; font-size:32px; font-weight:800; color:var(--c); }
      .st-assess .d { margin-top:10px; font-size:30px; color:var(--ink-2); white-space:nowrap; }
    `;
    root.appendChild(css);

    const q = s => root.querySelector(s);
    this._s = {
      spin: q('.spin'), segs: [...root.querySelectorAll('.seg')], wraps: [...root.querySelectorAll('.segwrap')],
      cards: [...root.querySelectorAll('.as-card')], ghosts: [...root.querySelectorAll('.as-ghost')], links: [...root.querySelectorAll('.lk')], dot: q('.lk-dot'),
      v: q('.pct b'), pct: q('.pct'), lab: q('.lab'), center: q('.as-center'),
    };
    const S = this._s;
    PARTS.forEach((p, i) => gsap.set(S.segs[i], { drawSVG: `${p.from + GAP}% ${p.from + GAP}%` }));
    gsap.set(S.links, { drawSVG: '0%' });
    gsap.set(S.spin, { rotation: 0, svgOrigin: '0 0' });
  },

  enter(root, ctx, { instant }) {
    ctx.bg.hideParticles(0.3);
    // 外圈小光點環繞（裝飾）
    ctx.track(gsap.to(root.querySelector('.orbit'), { rotation: 360, svgOrigin: '0 0', duration: 9, repeat: -1, ease: 'none' }));
    if (instant) return;
    const S = this._s;
    const tl = this._tl = ctx.tl();
    tl.from(root.querySelector('.station-head'), { opacity: 0, y: 30, duration: 0.8, ease: 'expo.out' }, 0.2);
    tl.from(root.querySelector('.trk'), { drawSVG: '0%', duration: 1.2, ease: 'power2.inOut' }, 0.3);
    tl.from(root.querySelectorAll('.ticks line'), { opacity: 0, duration: 0.02, stagger: 0.008 }, 0.3);
    tl.from(root.querySelectorAll('.core, .core-ring'), { scale: 0, svgOrigin: '0 0', duration: 0.9, ease: 'back.out(1.6)' }, 0.4);
    tl.from(S.center, { opacity: 0, scale: 0.6, duration: 0.8, ease: 'back.out(2)' }, 0.7);
    tl.add(ctx.fx.countUp(S.v, 100, { duration: 1.2 }), 0.7);
    tl.from(S.ghosts, { opacity: 0, x: 60, duration: 0.6, stagger: 0.12, ease: 'power3.out' }, 0.9);
  },

  step(root, ctx, n, { instant }) {
    if (this._tl) { this._tl.progress(1); this._tl = null; }
    const S = this._s;
    const k = n - 1, p = PARTS[k];
    const tl = instant ? null : (this._tl = ctx.tl());
    const ex = 22, mx = Math.sin(midRad(k)) * ex, my = -Math.cos(midRad(k)) * ex;
    const cardIn = S.cards[k];

    if (!tl) {
      gsap.set(S.spin, { rotation: rotFor(k), svgOrigin: '0 0' });
      gsap.set(S.segs[k], { drawSVG: `${p.from + GAP}% ${p.to - GAP}%` });
      S.wraps.forEach((w, i) => gsap.set(w, i === k ? { x: mx, y: my } : { x: 0, y: 0 }));
      gsap.set(S.segs.slice(0, k), { opacity: 0.6 });
      gsap.set(S.segs[k], { opacity: 1 });
      gsap.set(cardIn, { opacity: 1, x: 0 });
      gsap.set(S.ghosts[k], { opacity: 0 });
      S.cards.forEach((c, i) => c.classList.toggle('on', i === k));
      S.links.forEach((l, i) => gsap.set(l, i === k ? { opacity: 1, drawSVG: '100%' } : { opacity: 0 }));
      gsap.set(S.dot, { opacity: 1, fill: p.color });
      this._center(k, null, ctx);
      if (k === 2) this._finale(root, null, ctx);
      return;
    }

    tl.call(() => ctx.sfx.play('rise'), null, 0);
    tl.to(S.spin, { rotation: rotFor(k), svgOrigin: '0 0', duration: 1.3, ease: 'power3.inOut' }, 0);
    tl.fromTo(S.segs[k], { drawSVG: `${p.from + GAP}% ${p.from + GAP}%` }, { drawSVG: `${p.from + GAP}% ${p.to - GAP}%`, duration: 1.2, ease: 'power2.inOut' }, 0.15);
    S.wraps.forEach((w, i) => { if (i !== k) tl.to(w, { x: 0, y: 0, duration: 0.6, ease: 'power2.out' }, 0); });
    tl.to(S.segs.slice(0, k), { opacity: 0.6, duration: 0.6 }, 0);
    tl.to(S.wraps[k], { x: mx, y: my, duration: 0.7, ease: 'back.out(2.5)' }, 1.25);
    this._center(k, tl, ctx);
    // 連線及說明卡
    S.links.forEach((l, i) => { if (i !== k) tl.to(l, { opacity: 0, duration: 0.4 }, 0); });
    tl.set(S.links[k], { opacity: 1 }, 1.1);
    tl.fromTo(S.links[k], { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.5, ease: 'power2.out' }, 1.1);
    tl.to(S.dot, { opacity: 1, fill: p.color, duration: 0.3 }, 1.1);
    tl.call(() => S.cards.forEach((c, i) => c.classList.toggle('on', i === k)), null, 1.4);
    tl.to(S.ghosts[k], { opacity: 0, scale: 0.94, duration: 0.4 }, 1.25);
    tl.fromTo(cardIn, { opacity: 0, x: 90 }, { opacity: 1, x: 0, duration: 0.8, ease: 'expo.out' }, 1.3);
    tl.add(ctx.fx.countUp(cardIn.querySelector('.pc b'), p.v, { duration: 0.9 }), 1.3);
    tl.call(() => { ctx.sfx.play('pop'); ctx.fx.pulseAt(root, CARD_X, CARD_TOP[k] + CARD_H / 2, p.color); }, null, 1.5);
    if (k === 2) this._finale(root, tl, ctx, 3.0);
  },

  /** 中央大數字 */
  _center(k, tl, ctx) {
    const S = this._s, p = PARTS[k];
    const label = `${p.t}・${p.sub}`;
    if (!tl) { S.v.textContent = p.v; S.lab.textContent = label; gsap.set(S.pct, { color: p.color }); return; }
    tl.to(S.pct, { color: p.color, duration: 0.6 }, 0.3);
    tl.add(num(S.v, 0, p.v, 1.2), 0.3);
    tl.fromTo(S.lab, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5 }, 0.5);
    tl.call(() => { S.lab.textContent = label; }, null, 0.5);
    tl.fromTo(S.center, { scale: 0.85 }, { scale: 1, duration: 0.8, ease: 'back.out(2.5)' }, 0.3);
  },

  /** 三段到齊：中央顯示 55＋25＋20＝100% */
  _finale(root, tl, ctx, at = 0) {
    const S = this._s;
    const sum = '55＋25＋20';
    if (!tl) {
      gsap.set(S.segs, { opacity: 1 });
      S.v.textContent = '100'; S.lab.textContent = sum; gsap.set(S.pct, { color: '#eef1ff' });
      return;
    }
    tl.to(S.segs, { opacity: 1, duration: 0.5 }, at);
    tl.to(S.pct, { color: '#eef1ff', duration: 0.5 }, at);
    tl.add(num(S.v, 20, 100, 1.0), at);
    tl.to(S.lab, { opacity: 0, duration: 0.2 }, at);
    tl.call(() => { S.lab.textContent = sum; }, null, at + 0.2);
    tl.to(S.lab, { opacity: 1, duration: 0.4 }, at + 0.25);
    tl.fromTo(S.spin, { scale: 1 }, { scale: 1.04, svgOrigin: '0 0', duration: 0.25, yoyo: true, repeat: 1, ease: 'power2.out' }, at + 0.9);
    tl.call(() => { ctx.sfx.play('success'); ctx.fx.pulseAt(root, CX, CY, '#ff3d7f'); }, null, at + 0.9);
  },
};
