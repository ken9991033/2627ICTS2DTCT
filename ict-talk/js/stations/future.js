// 17 能力與出路：星座圖（五種能力 → 職業 → 向上望：大學相關學科）
// 步驟：1 能力連線到職業　2 鏡頭向上，看見大學相關學科　3 就算不讀電腦，這些能力同樣重要
const gsap = window.gsap;

const ICON = {
  code_xml: '<path d="m18 16 4-4-4-4"/> <path d="m6 8-4 4 4 4"/> <path d="m14.5 4-5 16"/>',
  chart_column: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/> <path d="M18 17V9"/> <path d="M13 17V5"/> <path d="M8 17v-3"/>',
  shield_check: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/> <path d="m9 12 2 2 4-4"/>',
  bot: '<path d="M12 8V4H8"/> <rect width="16" height="12" x="4" y="8" rx="2"/> <path d="M2 14h2"/> <path d="M20 14h2"/> <path d="M15 13v2"/> <path d="M9 13v2"/>',
  gamepad_2: '<line x1="6" x2="10" y1="11" y2="11"/> <line x1="8" x2="8" y1="9" y2="13"/> <line x1="15" x2="15.01" y1="12" y2="12"/> <line x1="18" x2="18.01" y1="10" y2="10"/> <path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z"/>',
  palette: '<path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/> <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/> <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/> <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/> <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>',
  landmark: '<path d="M10 18v-7"/> <path d="M11.119 2.205a2 2 0 0 1 1.762 0l7.84 3.846A.5.5 0 0 1 20.5 7h-17a.5.5 0 0 1-.22-.949z"/> <path d="M14 18v-7"/> <path d="M18 18v-7"/> <path d="M3 22h18"/> <path d="M6 18v-7"/>',
  heart_pulse: '<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/> <path d="M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>',
  briefcase: '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/> <rect width="20" height="14" x="2" y="6" rx="2"/>',
  clapperboard: '<path d="m12.296 3.464 3.02 3.956"/> <path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3z"/> <path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/> <path d="m6.18 5.276 3.1 3.899"/>',
  stethoscope: '<path d="M11 2v2"/> <path d="M5 2v2"/> <path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1"/> <path d="M8 15a6 6 0 0 0 12 0v-3"/> <circle cx="20" cy="10" r="2"/>',
  graduation_cap: '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/> <path d="M22 10v6"/> <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
  pen_tool: '<path d="m18 13-.654-4.736a4 4 0 00-2.756-3.266l-9.163-2.9a2 2 0 00-2.017.493l-.82.819a2 2 0 00-.492 2.017l2.9 9.163a4 4 0 003.266 2.756L13 18"/> <path d="M18.648 12.352a1.205 1.205 0 011.704 0l1.296 1.296a1.205 1.205 0 010 1.704l-6.296 6.296a1.205 1.205 0 01-1.704 0l-1.296-1.296a1.205 1.205 0 010-1.704z"/> <path d="m3 3 6.586 6.586"/> <circle cx="11" cy="11" r="2"/>',
};
const ic = k => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON[k]}</svg>`;

// 星空座標：整片天空 1920 × 2160；下半部（y ≥ 1080）是「能力與職業」，上半部是「大學學科」
const H = 1080;
const PC = { x: 960, y: H + 600 }, PR = 190;
const ABIL = [
  { name: '運算思維', color: '#a78bfa', a: -90 },
  { name: '創意', color: '#f472b6', a: -18 },
  { name: '協作', color: '#fbbf24', a: 54 },
  { name: '數碼素養', color: '#34d399', a: 126 },
  { name: '解難', color: '#22d3ee', a: 198 },
].map(o => ({ ...o, x: PC.x + Math.cos(o.a * Math.PI / 180) * PR, y: PC.y + Math.sin(o.a * Math.PI / 180) * PR }));

const JC = { x: 960, y: H + 610 }, JRX = 690, JRY = 320;
const JOBS = [
  { name: '軟件工程師', icon: 'code_xml', a: -112.5, link: [0, 4] },
  { name: '人工智能工程師', icon: 'bot', a: -67.5, link: [0, 1] },
  { name: '遊戲開發者', icon: 'gamepad_2', a: -22.5, link: [1, 0] },
  { name: 'UI/UX 設計師', icon: 'palette', a: 22.5, link: [1, 2] },
  { name: '醫療科技', icon: 'heart_pulse', a: 67.5, link: [2, 3] },
  { name: '金融科技', icon: 'landmark', a: 112.5, link: [3, 2] },
  { name: '數據分析師', icon: 'chart_column', a: 157.5, link: [3, 4] },
  { name: '網絡保安專家', icon: 'shield_check', a: 202.5, link: [4, 0] },
].map(o => ({ ...o, x: JC.x + Math.cos(o.a * Math.PI / 180) * JRX, y: JC.y + Math.sin(o.a * Math.PI / 180) * JRY }));

const UNI = [
  ['計算機科學', 330, 470], ['資訊工程', 590, 405], ['數據科學', 850, 370],
  ['人工智能', 1110, 370], ['資訊系統', 1370, 405], ['數碼媒體', 1630, 470],
].map(([name, x, y]) => ({ name, x, y }));
const BEAMS = [[0, 4], [2, 0], [3, 0], [5, 1]]; // 學科 → 能力（光束）

const FIELDS = [['商業', 'briefcase'], ['設計', 'pen_tool'], ['傳媒', 'clapperboard'], ['醫療', 'stethoscope']];

const SPARK = 'M0 -1 C .12 -.22 .22 -.12 1 0 C .22 .12 .12 .22 0 1 C -.12 .22 -.22 .12 -1 0 C -.22 -.12 -.12 -.22 0 -1 Z';
const star = (x, y, color, size, cls) => `
  <g class="star ${cls}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})" style="--c:${color}">
    <circle class="halo" r="${size * 2.6}" fill="url(#fuHalo)" style="color:${color}"/>
    <g class="flare"><path d="${SPARK}" transform="scale(${size * 2.2})" fill="${color}"/><path d="${SPARK}" transform="rotate(45) scale(${size * 1.1})" fill="#fff" opacity=".7"/></g>
    <circle class="core" r="${size * 0.42}" fill="#fff"/>
  </g>`;

export default {
  id: 'future',
  title: '能力與出路：ICT 帶你去哪裏？',
  short: '能力出路',
  accent: '#a78bfa',
  tint: ['#a78bfa', '#22d3ee'],
  transition: { type: 'pan', dir: 'up' },
  steps: 3,
  minutes: 1,
  notes: `【能力與出路｜約 1 分鐘】
進站：五粒星是讀 ICT 會培養的五種能力──解難、運算思維、創意、協作、數碼素養。

按 →（職業）：能力連線到不同職業：軟件工程師、人工智能工程師、遊戲開發者、UI/UX 設計師、醫療科技、金融科技、數據分析師、網絡保安專家。可問同學：「你最想做哪一種？」

按 →（大學）：鏡頭向上，看見大學相關學科：計算機科學、資訊工程、數據科學、人工智能、資訊系統、數碼媒體。

按 →（總結）：強調「就算將來不讀電腦相關學科，這些能力在商業、設計、傳媒、醫療等範疇同樣重要。」ICT 培養的是可以帶到任何行業的能力。`,

  build(root) {
    this._tl = null;
    const pent = ABIL.map((a, i) => { const b = ABIL[(i + 1) % 5]; return `<path class="pe" d="M${a.x.toFixed(1)} ${a.y.toFixed(1)} L${b.x.toFixed(1)} ${b.y.toFixed(1)}"/>`; }).join('')
      + ABIL.map((a, i) => { const b = ABIL[(i + 2) % 5]; return `<path class="pg" d="M${a.x.toFixed(1)} ${a.y.toFixed(1)} L${b.x.toFixed(1)} ${b.y.toFixed(1)}"/>`; }).join('');
    const jl = JOBS.map((j, k) => j.link.map(i => { const a = ABIL[i]; return `<path class="jl j${k}" stroke="${a.color}" d="M${a.x.toFixed(1)} ${a.y.toFixed(1)} L${j.x.toFixed(1)} ${j.y.toFixed(1)}"/>`; }).join('')).join('');
    const ul = UNI.slice(1).map((u, i) => { const p = UNI[i]; return `<path class="ul" d="M${p.x} ${p.y} Q${(p.x + u.x) / 2} ${Math.min(p.y, u.y) - 40} ${u.x} ${u.y}"/>`; }).join('');
    const beams = BEAMS.map(([u, a]) => `<path class="bm" stroke="url(#fuBeam)" d="M${ABIL[a].x.toFixed(1)} ${ABIL[a].y.toFixed(1)} L${UNI[u].x} ${UNI[u].y}"/>`).join('');

    root.innerHTML = `
      <canvas class="fu-sky" width="1920" height="1080"></canvas>
      <div class="fu-cam">
        <svg class="fu-svg" width="1920" height="2160" viewBox="0 0 1920 2160" aria-hidden="true">
          <defs>
            <radialGradient id="fuHalo"><stop offset="0" stop-color="currentColor" stop-opacity=".75"/><stop offset=".35" stop-color="currentColor" stop-opacity=".22"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient>
            <linearGradient id="fuBeam" gradientUnits="userSpaceOnUse" x1="0" y1="${H + 500}" x2="0" y2="380"><stop offset="0" stop-color="#a78bfa" stop-opacity=".05"/><stop offset=".6" stop-color="#a78bfa" stop-opacity=".45"/><stop offset="1" stop-color="#22d3ee" stop-opacity=".9"/></linearGradient>
          </defs>
          <g class="beams">${beams}</g>
          <g class="jlines">${jl}</g>
          <g class="pent">${pent}</g>
          <g class="ulines">${ul}</g>
          ${ABIL.map((a, i) => star(a.x, a.y, a.color, 22, `ab ab${i}`)).join('')}
          ${UNI.map((u, i) => star(u.x, u.y, i % 2 ? '#22d3ee' : '#a78bfa', 16, `un un${i}`)).join('')}
        </svg>
        <div class="tag tag-a" style="top:${H + 236}px">${ic('graduation_cap')}五種能力　→　相關職業</div>
        <div class="tag tag-b" style="top:236px">${ic('graduation_cap')}大學相關學科</div>
        ${ABIL.map((a, i) => `<div class="ab-lab l${i}" style="left:${a.x - 150}px;top:${a.y + 36}px;--c:${a.color}"><span>${a.name}</span></div>`).join('')}
        ${JOBS.map((j, k) => `<div class="job j${k}" style="left:${j.x.toFixed(0)}px;top:${j.y.toFixed(0)}px">${ic(j.icon)}<span>${j.name}</span></div>`).join('')}
        ${UNI.map((u, i) => `<div class="un-lab u${i}" style="left:${u.x - 150}px;top:${u.y + 34}px">${u.name}</div>`).join('')}
        <div class="fu-close panel glow-edge">
          <p class="l1">就算將來不讀電腦相關學科，</p>
          <p class="l2">這些能力在<span class="accent">商業、設計、傳媒、醫療</span>等範疇同樣重要。</p>
          <div class="fields">${FIELDS.map(([n, k]) => `<span class="fd">${ic(k)}${n}</span>`).join('')}</div>
        </div>
      </div>
      <div class="station-head">
        <div class="kicker">SKILLS · CAREERS · UNIVERSITY</div>
        <h1 class="h1">能力與出路：ICT 帶你<span class="grad">去哪裏</span>？</h1>
      </div>
    `;
    const css = document.createElement('style');
    css.textContent = `
      .st-future .station-head { z-index:5; }
      .st-future .station-head .kicker { font-size:24px; }
      .st-future .fu-sky { position:absolute; left:0; top:0; width:1920px; height:1080px; }
      .st-future .fu-cam { position:absolute; left:0; top:0; width:1920px; height:2160px; transform-origin:${PC.x}px ${PC.y}px; }
      .st-future .fu-svg { position:absolute; left:0; top:0; overflow:visible; }
      .st-future .ic { width:100%; height:100%; display:block; }
      .st-future .pe { fill:none; stroke:rgba(200,190,255,.55); stroke-width:3; stroke-dasharray:2 10; stroke-linecap:round; }
      .st-future .pg { fill:none; stroke:rgba(167,139,250,.16); stroke-width:2; }
      .st-future .jl { fill:none; stroke-width:3; opacity:.55; stroke-linecap:round; }
      .st-future .ul { fill:none; stroke:rgba(103,232,249,.5); stroke-width:3; stroke-dasharray:2 10; stroke-linecap:round; }
      .st-future .bm { fill:none; stroke-width:4; stroke-linecap:round; }
      .st-future .star .flare { transform-box:fill-box; transform-origin:center; animation:fu-tw 3.2s ease-in-out infinite; }
      .st-future .star.ab1 .flare { animation-delay:-.6s; } .st-future .star.ab2 .flare { animation-delay:-1.3s; }
      .st-future .star.ab3 .flare { animation-delay:-2s; } .st-future .star.ab4 .flare { animation-delay:-2.6s; }
      .st-future .star.un .flare { animation-duration:2.6s; }
      .st-future .star.un1 .flare, .st-future .star.un4 .flare { animation-delay:-1.1s; }
      .st-future .star.un2 .flare, .st-future .star.un5 .flare { animation-delay:-1.9s; }
      @keyframes fu-tw { 0%,100% { transform:scale(1) rotate(0deg); opacity:1; } 50% { transform:scale(.72) rotate(12deg); opacity:.75; } }

      .st-future .ab-lab { position:absolute; width:300px; text-align:center; }
      .st-future .ab-lab span { display:inline-block; padding:2px 16px; border-radius:14px; font-size:38px; font-weight:900; color:var(--ink); background:rgba(4,5,13,.72); text-shadow:0 0 18px var(--c); box-shadow:0 0 0 1px color-mix(in srgb, var(--c) 35%, transparent); }
      .st-future .job { position:absolute; display:flex; align-items:center; gap:14px; height:72px; padding:0 26px 0 18px; border-radius:999px; white-space:nowrap; font-size:30px; font-weight:800; color:var(--ink); background:rgba(10,13,31,.82); border:1px solid rgba(167,139,250,.45); box-shadow:0 0 30px rgba(167,139,250,.18); opacity:0; }
      .st-future .job .ic { width:40px; height:40px; color:var(--accent); flex:none; }
      .st-future .un-lab { position:absolute; width:300px; text-align:center; font-size:36px; font-weight:900; color:var(--ink); text-shadow:0 0 16px rgba(103,232,249,.7), 0 0 2px #000; opacity:0; }
      .st-future .tag { position:absolute; left:120px; display:flex; align-items:center; gap:12px; height:52px; padding:0 22px; border-radius:999px; font-size:26px; font-weight:800; color:var(--accent); border:1px solid rgba(167,139,250,.5); background:rgba(167,139,250,.1); }
      .st-future .tag .ic { width:30px; height:30px; }
      .st-future .tag-a, .st-future .tag-b { opacity:0; }
      .st-future .fu-close { position:absolute; left:340px; top:648px; width:1240px; padding:36px 60px 40px; text-align:center; opacity:0; }
      .st-future .fu-close p { margin:0; }
      .st-future .fu-close .l1 { font-size:32px; color:var(--ink-2); }
      .st-future .fu-close .l2 { margin-top:10px; font-size:42px; font-weight:900; line-height:1.35; }
      .st-future .fields { display:flex; justify-content:center; gap:22px; margin-top:28px; }
      .st-future .fd { display:inline-flex; align-items:center; gap:12px; padding:12px 28px; border-radius:999px; font-size:30px; font-weight:800; color:var(--accent); border:2px solid rgba(167,139,250,.6); background:rgba(167,139,250,.1); }
      .st-future .fd .ic { width:34px; height:34px; }
    `;
    root.appendChild(css);

    const q = s => [...root.querySelectorAll(s)];
    this._s = {
      cam: root.querySelector('.fu-cam'), canvas: root.querySelector('.fu-sky'),
      ab: q('.star.ab'), abLab: q('.ab-lab'), pe: q('.pe'), pg: q('.pg'),
      jl: q('.jl'), jobs: q('.job'), un: q('.star.un'), unLab: q('.un-lab'), ul: q('.ul'), bm: q('.bm'),
      tagA: root.querySelector('.tag-a'), tagB: root.querySelector('.tag-b'), close: root.querySelector('.fu-close'),
    };
    const S = this._s;
    gsap.set(S.jobs, { xPercent: -50, yPercent: -50 });
    gsap.set([...S.jl, ...S.ul, ...S.bm], { drawSVG: '0%' });
    gsap.set(S.un, { opacity: 0 });
    gsap.set(S.cam, { y: -H, scale: 1.14 });
  },

  enter(root, ctx, { instant }) {
    const S = this._s;
    ctx.bg.hideParticles(0.3);
    this._sky(ctx);
    if (instant) return;
    const tl = this._tl = ctx.tl();
    tl.from(root.querySelector('.station-head'), { opacity: 0, y: 30, duration: 0.8, ease: 'expo.out' }, 0.2);
    tl.from(S.ab, { scale: 0, transformOrigin: '50% 50%', duration: 0.9, ease: 'back.out(2.5)', stagger: 0.2 }, 0.4);
    S.ab.forEach((_, i) => tl.call(() => ctx.sfx.play('blip'), null, 0.4 + i * 0.2));
    tl.from(S.abLab, { opacity: 0, y: 16, duration: 0.6, stagger: 0.2 }, 0.6);
    tl.from(S.pe, { drawSVG: '0%', duration: 0.5, stagger: 0.15, ease: 'power1.inOut' }, 1.3);
    tl.from(S.pg, { drawSVG: '0%', opacity: 0, duration: 0.8, stagger: 0.1 }, 1.9);
  },

  step(root, ctx, n, { instant }) {
    if (this._tl) { this._tl.progress(1); this._tl = null; }
    const S = this._s;
    const tl = instant ? null : (this._tl = ctx.tl());

    if (n === 1) {
      if (!tl) {
        gsap.set(S.cam, { scale: 1 });
        gsap.set(S.jl, { drawSVG: '100%' });
        gsap.set(S.jobs, { opacity: 1, scale: 1 });
        gsap.set(S.tagA, { opacity: 1, x: 0 });
        return;
      }
      tl.call(() => ctx.sfx.play('whooshOut'), null, 0);
      tl.to(S.cam, { scale: 1, duration: 1.4, ease: 'power3.inOut' }, 0);
      tl.fromTo(S.tagA, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.6 }, 1.2);
      JOBS.forEach((j, k) => {
        const at = 0.5 + k * 0.16;
        tl.fromTo(S.jl.filter(l => l.classList.contains(`j${k}`)), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.6, ease: 'power2.out' }, at);
        tl.fromTo(S.jobs[k], { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(2.2)' }, at + 0.45);
        tl.call(() => ctx.sfx.play('pop'), null, at + 0.45);
      });
      tl.to(S.ab.map(s => s.querySelector('.halo')), { scale: 1.5, transformOrigin: '50% 50%', duration: 0.3, yoyo: true, repeat: 1, stagger: 0.1 }, 0.5);
    }

    if (n === 2) {
      if (!tl) {
        gsap.set(S.cam, { y: 0, scale: 1 });
        gsap.set([...S.bm, ...S.ul], { drawSVG: '100%' });
        gsap.set(S.un, { opacity: 1, scale: 1 });
        gsap.set([...S.unLab, S.tagB], { opacity: 1, y: 0 });
        return;
      }
      tl.call(() => { ctx.sfx.play('rise'); ctx.bg.warp(-1, 1.6, 0.35); }, null, 0);
      tl.to(S.cam, { y: 0, duration: 1.9, ease: 'power3.inOut' }, 0);
      tl.to(S.cam, { scale: 0.9, duration: 0.9, ease: 'power2.inOut' }, 0);
      tl.to(S.cam, { scale: 1, duration: 1.0, ease: 'power2.out' }, 0.9);
      tl.fromTo(S.bm, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.6, ease: 'power2.inOut', stagger: 0.1 }, 0.2);
      UNI.forEach((u, i) => {
        const at = 1.5 + i * 0.16;
        tl.fromTo(S.un[i], { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, transformOrigin: '50% 50%', duration: 0.7, ease: 'back.out(3)' }, at);
        tl.fromTo(S.unLab[i], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5 }, at + 0.15);
        tl.call(() => ctx.sfx.play('blip'), null, at);
      });
      tl.fromTo(S.ul, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.4, stagger: 0.16 }, 1.7);
      tl.fromTo(S.tagB, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.6 }, 1.4);
    }

    if (n === 3) {
      const fields = S.close.querySelectorAll('.fd');
      if (!tl) { gsap.set(S.close, { opacity: 1, y: 0 }); return; }
      tl.fromTo(S.close, { opacity: 0, y: 60, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'expo.out' }, 0);
      tl.call(() => ctx.sfx.play('reveal'), null, 0);
      tl.from(S.close.querySelectorAll('.l1, .l2'), { opacity: 0, y: 20, duration: 0.6, stagger: 0.25 }, 0.3);
      tl.from(fields, { opacity: 0, scale: 0.5, duration: 0.5, ease: 'back.out(2.5)', stagger: 0.14 }, 1.0);
      fields.forEach((_, i) => tl.call(() => ctx.sfx.play('pop'), null, 1.0 + i * 0.14));
      tl.to(S.un.map(s => s.querySelector('.halo')), { scale: 1.6, transformOrigin: '50% 50%', duration: 0.35, yoyo: true, repeat: 1, stagger: 0.08 }, 1.0);
    }
  },

  /** 會隨鏡頭視差移動的星空（Canvas），偶爾有流星 */
  _sky(ctx) {
    const S = this._s;
    const g = S.canvas.getContext('2d');
    const PAR = 0.35, EXTRA = H * PAR;
    const stars = Array.from({ length: 320 }, () => ({
      x: Math.random() * 1920, y: Math.random() * (1080 + EXTRA), r: Math.random() < 0.08 ? 1.6 + Math.random() * 1.4 : 0.5 + Math.random() * 1.1,
      p: Math.random() * Math.PI * 2, s: 0.6 + Math.random() * 1.8, c: Math.random() < 0.3 ? '#c4b5fd' : Math.random() < 0.5 ? '#a5f3fc' : '#ffffff',
    }));
    const meteors = [];
    ctx.every(2.4, () => {
      meteors.push({ x: 300 + Math.random() * 1500, y: 60 + Math.random() * 300, vx: -9 - Math.random() * 5, vy: 4 + Math.random() * 2, life: 1 });
    });
    ctx.raf((dt, t) => {
      const camY = gsap.getProperty(S.cam, 'y');
      const off = (H + camY) * PAR - EXTRA;
      g.clearRect(0, 0, 1920, 1080);
      for (const s of stars) {
        const y = s.y + off;
        if (y < -4 || y > 1084) continue;
        g.globalAlpha = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * s.s + s.p));
        g.fillStyle = s.c;
        g.beginPath(); g.arc(s.x, y, s.r, 0, Math.PI * 2); g.fill();
      }
      g.globalAlpha = 1;
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.x += m.vx * dt * 60; m.y += m.vy * dt * 60; m.life -= dt * 0.9;
        if (m.life <= 0) { meteors.splice(i, 1); continue; }
        const grd = g.createLinearGradient(m.x, m.y, m.x - m.vx * 14, m.y - m.vy * 14);
        grd.addColorStop(0, `rgba(255,255,255,${m.life})`); grd.addColorStop(1, 'rgba(167,139,250,0)');
        g.strokeStyle = grd; g.lineWidth = 2.5;
        g.beginPath(); g.moveTo(m.x, m.y); g.lineTo(m.x - m.vx * 14, m.y - m.vy * 14); g.stroke();
      }
    });
  },
};
