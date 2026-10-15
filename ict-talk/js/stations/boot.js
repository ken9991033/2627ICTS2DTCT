// 01 開場：一段程式「生成」整個網站 → 0 與 1 的雨 → 粒子組成 ICT
// 步驟：0 自動打出程式碼　1 執行（按 Enter／→）　2 點題，準備潛入
const gsap = window.gsap;

const CODE = `# 中三同學，歡迎來到 ICT 的世界
message = "ICT"

for ch in message:
    print(ch, "→", format(ord(ch), "08b"))

launch(world="深入科技", start="你的手機")`;

const OUTPUT = [
  ['I', '01001001'],
  ['C', '01000011'],
  ['T', '01010100'],
];

export default {
  id: 'boot',
  title: '開場：程式啟動',
  short: '程式啟動',
  accent: '#22d3ee',
  hud: false,
  overviewY: 0.3,
  steps: 2,
  minutes: 1.5,
  tint: ['#22d3ee', '#7c3aed'],
  notes: `【開場，全場燈光調暗】
1. 畫面會自動打出一段 Python 程式。可以問同學：「你們猜這段程式會做甚麼？」
2. 按 Enter（或 →）執行程式：程式把 I、C、T 三個字母轉成二進制，然後「啟動」整個網站。
3. 點題：「剛才你看到的一切──文字、動畫、粒子──全部都是由程式寫出來的。ICT 不是『玩電腦』，而是學習創造這些科技的專業。」
4. 再按 → ：今天我們會由大家最熟悉的手機開始，一層一層 Zoom 入去，看看科技背後的世界。`,

  build(root, ctx) {
    const { fx } = ctx;
    root.innerHTML = `
      <canvas class="boot-rain" width="1920" height="1080"></canvas>
      <div class="boot-term code-window">
        <div class="bar"><span class="dots"><i></i><i></i><i></i></span><span>launch_ict.py — Python 3</span></div>
        <div class="boot-body">
          <div class="boot-prompt mono"><span class="accent">~/ict</span> $ python3 launch_ict.py</div>
          <pre class="code boot-code">${fx.highlightPython(CODE)}</pre>
          <div class="boot-out terminal-out"></div>
        </div>
      </div>
      <div class="boot-hint"><span class="kbd">Enter</span>　執行程式</div>
      <div class="boot-title">
        <div class="kicker boot-kicker">HKDSE · 資訊及通訊科技</div>
        <div class="boot-sub h2">不是「玩電腦」，而是<span class="grad">創造科技</span>的專業</div>
      </div>
      <div class="boot-reveal">
        <p class="h3">剛才你看到的一切，都是由<span class="accent">程式</span>寫出來的。</p>
        <p class="body">現在，由你最熟悉的東西開始，一層一層 <b class="ink">Zoom 入去</b>。</p>
      </div>
      <div class="boot-portal" aria-hidden="true"><i></i><i></i><i></i><span>START</span></div>
    `;
    const css = document.createElement('style');
    css.textContent = `
      .st-boot .boot-rain { position:absolute; inset:0; width:1920px; height:1080px; opacity:0; }
      .st-boot .boot-term { position:absolute; left:360px; top:190px; width:1200px; }
      .st-boot .boot-body { padding:30px 40px 36px; min-height:520px; }
      .st-boot .boot-prompt { font-size:24px; color:var(--ink-3); margin-bottom:18px; }
      .st-boot .boot-code { margin:0; font-size:30px; }
      .st-boot .boot-out { margin-top:22px; min-height:150px; font-size:28px; }
      .st-boot .boot-out .ln { opacity:0; }
      .st-boot .boot-out .bin { color:#67e8f9; letter-spacing:.08em; }
      .st-boot .boot-hint { position:absolute; left:0; right:0; top:900px; text-align:center; font-size:28px; color:var(--ink-2); opacity:0; }
      .st-boot .boot-title { position:absolute; inset:0; text-align:center; pointer-events:none; }
      .st-boot .boot-kicker { position:absolute; left:0; right:0; top:150px; }
      .st-boot .boot-kicker { font-size:26px; opacity:0; }
      .st-boot .boot-sub { position:absolute; left:0; right:0; top:650px; opacity:0; }
      .st-boot .boot-reveal { position:absolute; left:0; right:0; top:780px; text-align:center; opacity:0; }
      .st-boot .boot-reveal p { margin:0 0 10px; }
      .st-boot .boot-portal { position:absolute; left:930px; top:935px; width:60px; height:60px; opacity:0; }
      .st-boot .boot-portal i { position:absolute; inset:0; border-radius:50%; border:2px solid var(--accent); box-shadow:0 0 20px var(--accent), inset 0 0 20px var(--accent); }
      .st-boot .boot-portal span { position:absolute; top:70px; left:50%; transform:translateX(-50%); font:700 14px var(--mono); letter-spacing:.3em; color:var(--accent); }
    `;
    root.appendChild(css);
    this._chars = null;
  },

  enter(root, ctx, { instant }) {
    const term = root.querySelector('.boot-term');
    const code = root.querySelector('.boot-code');
    const hint = root.querySelector('.boot-hint');
    ctx.bg.hideParticles(0.3);
    if (instant) {
      gsap.set(hint, { opacity: 1 });
      return;
    }
    const tl = ctx.tl();
    tl.from(term, { opacity: 0, y: 40, scale: 0.96, duration: 0.9, ease: 'expo.out' });
    const typing = ctx.fx.typeOn(code, { cps: 38, sfx: ctx.sfx });
    ctx.track(typing.pause());
    tl.call(() => typing.play(), null, 0.9);
    tl.to(hint, { opacity: 1, duration: 0.6 }, 0.9 + typing.duration() + 0.2);
    tl.to(hint, { opacity: 0.45, repeat: -1, yoyo: true, duration: 0.9, ease: 'sine.inOut' });
    this._typing = typing;
  },

  step(root, ctx, n, { instant }) {
    const term = root.querySelector('.boot-term');
    const out = root.querySelector('.boot-out');
    const hint = root.querySelector('.boot-hint');
    if (this._typing) this._typing.progress(1);
    const cursor = root.querySelector('.type-cursor');
    if (cursor) gsap.killTweensOf(cursor), cursor.remove();

    if (n === 1) {
      gsap.killTweensOf(hint);
      out.innerHTML = OUTPUT.map(([c, b]) => `<div class="ln">${c} → <span class="bin">${b}</span></div>`).join('') + '<div class="ln launch">&gt;&gt;&gt; 啟動「深入科技」……</div>';
      const lines = out.querySelectorAll('.ln');
      const rain = root.querySelector('.boot-rain');
      const kicker = root.querySelector('.boot-kicker');
      const sub = root.querySelector('.boot-sub');
      if (instant) {
        gsap.set(lines, { opacity: 1 });
        gsap.set([term, hint], { opacity: 0 });
        gsap.set([kicker, sub], { opacity: 1 });
        ctx.bg.formText('ICT', { y: 420, size: 400, speed: 0.5 });
        return;
      }
      const tl = ctx.tl();
      tl.to(hint, { opacity: 0, duration: 0.3 }, 0);
      lines.forEach((ln, i) => {
        tl.set(ln, { opacity: 1 }, 0.25 + i * 0.45);
        const bin = ln.querySelector('.bin');
        if (bin) tl.add(ctx.fx.scramble(bin, bin.textContent, { duration: 0.4 }), 0.25 + i * 0.45);
        tl.call(() => ctx.sfx.play('blip'), null, 0.25 + i * 0.45);
      });
      tl.call(() => ctx.sfx.play('rise'), null, 1.7);
      // 終端機被「吸入」，0 與 1 灑滿畫面
      tl.to(term, { scale: 0.2, opacity: 0, filter: 'blur(8px)', duration: 0.8, ease: 'power3.in' }, 2.2);
      tl.call(() => this._rain(rain, ctx), null, 2.4);
      tl.to(rain, { opacity: 1, duration: 0.4 }, 2.4);
      tl.call(() => { ctx.sfx.play('boom'); ctx.bg.burstFrom(960, 420); ctx.bg.formText('ICT', { y: 420, size: 400 }); ctx.bg.warp(1, 1.4, 0.6); }, null, 4.2);
      tl.to(rain, { opacity: 0, duration: 1.2 }, 4.4);
      tl.to(kicker, { opacity: 1, duration: 0.8 }, 5.2);
      tl.add(ctx.fx.scramble(kicker, kicker.textContent, { chars: '01ICT', duration: 1 }), 5.2);
      tl.fromTo(sub, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, ease: 'expo.out' }, 5.8);
    }

    if (n === 2) {
      const rv = root.querySelector('.boot-reveal');
      const portal = root.querySelector('.boot-portal');
      if (instant) { gsap.set([rv, portal], { opacity: 1 }); return; }
      const tl = ctx.tl();
      tl.fromTo(rv, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out' });
      tl.call(() => ctx.sfx.play('reveal'), null, 0);
      tl.to(portal, { opacity: 1, duration: 0.5 }, 0.6);
      portal.querySelectorAll('i').forEach((r, i) => {
        ctx.track(gsap.fromTo(r, { scale: 0.6, opacity: 1 }, { scale: 2.4, opacity: 0, duration: 2.2, repeat: -1, delay: i * 0.7, ease: 'power1.out' }));
      });
    }
  },

  _rain(canvas, ctx) {
    const g = canvas.getContext('2d');
    const cols = 96, colW = 1920 / cols;
    const drops = Array.from({ length: cols }, () => ({ y: -Math.random() * 1200, v: 9 + Math.random() * 16 }));
    ctx.raf(dt => {
      g.fillStyle = 'rgba(4,5,13,0.18)';
      g.fillRect(0, 0, 1920, 1080);
      g.font = '700 24px "JetBrains Mono", monospace';
      drops.forEach((d, i) => {
        const ch = Math.random() < 0.5 ? '0' : '1';
        const x = i * colW + 4;
        g.fillStyle = i % 3 ? '#22d3ee' : '#a78bfa';
        g.globalAlpha = 0.9;
        g.fillText(ch, x, d.y);
        g.globalAlpha = 1;
        g.fillStyle = '#ffffff';
        g.fillText(ch, x, d.y + 26);
        d.y += d.v * dt * 60;
        if (d.y > 1120) d.y = -Math.random() * 200;
      });
    });
  },

  leave(root, ctx) {
    ctx.bg.scatter({ toward: true, duration: 1.2 });
  },
};
