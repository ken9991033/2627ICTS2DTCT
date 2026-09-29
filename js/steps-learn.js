/* ============================================================
 * steps-learn.js — 課次 5：步驟 1–4
 * 1 認識用家（同理）  2 定義問題  3 花階磚偵探（拆解・模式）  4 演算法工作坊
 * ============================================================ */
(function (global) {
  'use strict';
  const App = global.App, C = App.C, E = App.E;
  const { $, $$, esc, css } = App;
  const DEG = Math.PI / 180;

  // 把 canvas 的像素大小配合實際顯示大小（高解像度螢幕更清晰）
  function fitCanvas(cv, fallback) {
    const dpr = Math.min(2, global.devicePixelRatio || 1);
    const w = Math.round((cv.clientWidth || fallback || 300) * dpr);
    const h = Math.round((cv.clientHeight || cv.clientWidth || fallback || 300) * dpr);
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    return { w, h, dpr };
  }
  App.fitCanvas = fitCanvas;

  const preset = id => C.presets.find(p => p.id === id);

  /* ======================= 步驟 1：認識用家 ======================= */
  let cantoVoice = null;
  function findVoice() {
    if (!('speechSynthesis' in global)) return null;
    const vs = global.speechSynthesis.getVoices() || [];
    return vs.find(v => /zh[-_]HK|yue/i.test(v.lang)) || vs.find(v => /Cantonese|粵|廣東/i.test(v.name)) || null;
  }

  function answerHTML(text) {
    // [[文字|需要代號]] → 可點擊的線索
    return esc(text).replace(/\[\[([^|\]]+)\|([a-zA-Z]+)\]\]/g, (m, t, id) => {
      const got = App.P.needs.indexOf(id) >= 0;
      return '<button type="button" class="need-link' + (got ? ' got' : '') + '" data-need="' + id + '">' + t + '</button>';
    });
  }
  const plain = text => text.replace(/\[\[([^|\]]+)\|[a-zA-Z]+\]\]/g, '$1');

  const S1 = {
    init() {
      $('#personaGrid').innerHTML = C.personas.map(p =>
        '<button type="button" class="persona-card" data-persona="' + p.id + '">' +
        '<span class="avatar" style="background:' + p.tint + '" aria-hidden="true">' + p.avatar + '</span>' +
        '<span><b>' + esc(p.name) + '</b>（' + p.age + ' 歲）<span class="role">' + esc(p.role) + '</span><p>' + esc(p.intro) + '</p></span></button>'
      ).join('');
      $('#personaGrid').addEventListener('click', e => {
        const b = e.target.closest('[data-persona]');
        if (b) this.choose(b.dataset.persona);
      });
      $('#personaBar').addEventListener('click', e => {
        if (e.target.closest('[data-act="change"]')) { this.browsing = true; this.render(); }
      });
      $('#questionList').addEventListener('click', e => {
        const b = e.target.closest('[data-q]');
        if (b) this.ask(Number(b.dataset.q));
      });
      $('#chatLog').addEventListener('click', e => {
        const n = e.target.closest('.need-link');
        if (n) { this.collect(n.dataset.need); return; }
        const sp = e.target.closest('[data-speak]');
        if (sp) this.speak(Number(sp.dataset.speak));
      });
      $('#needList').addEventListener('click', e => {
        const b = e.target.closest('[data-remove]');
        if (b) this.remove(b.dataset.remove);
      });
      if ('speechSynthesis' in global) {
        cantoVoice = findVoice();
        global.speechSynthesis.onvoiceschanged = () => { cantoVoice = findVoice(); if (App.current === 1) this.renderChat(); };
      }
    },
    reset() { this.browsing = false; },
    enter() { this.render(); },
    async choose(id) {
      const P = App.P;
      if (P.persona && P.persona !== id && (P.needs.length || P.asked.length)) {
        const ok = await App.ask('換另一位用家？', '<p>已收集的需要及訪問紀錄會清除。</p>', '換用家', '取消');
        if (!ok) return;
        P.asked = []; P.needs = []; P.brief.criteria = [];
        App.uncomplete(1); App.uncomplete(2);
      }
      P.persona = id;
      const per = App.persona();
      if (!P.brief.product) { P.brief.product = per.product; P.design.product = per.product; }
      this.browsing = false;
      App.sound('pop');
      App.save();
      this.render();
    },
    ask(i) {
      const P = App.P;
      if (P.asked.indexOf(i) < 0) { P.asked.push(i); App.sound('tick'); App.save(); }
      this.renderQuestions();
      this.renderChat(i);
    },
    collect(id) {
      const P = App.P;
      if (P.needs.indexOf(id) >= 0) return;
      P.needs.push(id);
      App.sound('pop');
      App.save();
      this.renderChat();
      this.renderNeeds();
      this.check();
    },
    remove(id) {
      const P = App.P;
      P.needs = P.needs.filter(n => n !== id);
      P.brief.criteria = P.brief.criteria.filter(n => n !== id);
      App.save();
      this.renderChat();
      this.renderNeeds();
      this.check();
    },
    check() {
      if (App.P.persona && App.P.needs.length >= 3) App.complete(1);
      else App.uncomplete(1);
      App.refreshStatus();
    },
    speak(i) {
      const per = App.persona();
      if (!per || !cantoVoice) return;
      const u = new SpeechSynthesisUtterance(plain(per.interview[i].a));
      u.voice = cantoVoice;
      u.lang = cantoVoice.lang;
      u.rate = 0.95;
      global.speechSynthesis.cancel();
      global.speechSynthesis.speak(u);
    },
    render() {
      const per = App.persona();
      const browsing = !per || this.browsing;
      $('#personaGrid').hidden = !browsing;
      $('#interviewLayout').hidden = browsing;
      $$('#personaGrid .persona-card').forEach(b => b.classList.toggle('on', b.dataset.persona === App.P.persona));
      if (browsing) return;
      $('#personaBar').innerHTML =
        '<span class="avatar" style="background:' + per.tint + '" aria-hidden="true">' + per.avatar + '</span>' +
        '<div class="who"><b>' + esc(per.name) + '</b>（' + per.age + ' 歲）｜' + esc(per.role) + '<p>' + esc(per.intro) + '</p></div>' +
        '<button type="button" class="btn ghost small" data-act="change">換用家</button>';
      this.renderQuestions();
      this.renderChat();
      this.renderNeeds();
    },
    renderQuestions() {
      const per = App.persona();
      $('#questionList').innerHTML = per.interview.map((it, i) =>
        '<button type="button" class="q-btn' + (App.P.asked.indexOf(i) >= 0 ? ' asked' : '') + '" data-q="' + i + '">' + esc(it.q) + '</button>').join('');
    },
    renderChat(focusIdx) {
      const per = App.persona();
      if (!per) return;
      const log = $('#chatLog');
      if (!App.P.asked.length) {
        log.innerHTML = '<p class="muted small">按上面的問題開始訪問。</p>';
        return;
      }
      log.innerHTML = App.P.asked.map(i => {
        const it = per.interview[i];
        return '<div class="bubble q" data-qi="' + i + '">' + esc(it.q) + '</div>' +
          '<div class="bubble a"><span class="avatar sm" style="background:' + per.tint + '" aria-hidden="true">' + per.avatar + '</span>' +
          '<span class="say">' + answerHTML(it.a) + '</span>' +
          (cantoVoice ? '<button type="button" class="icon-btn speak" data-speak="' + i + '" title="讀出來"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 8.5a4.5 4.5 0 0 1 0 7"/></svg><span class="sr">讀出來</span></button>' : '') +
          '</div>';
      }).join('');
      if (focusIdx != null) {
        const q = log.querySelector('[data-qi="' + focusIdx + '"]');
        if (q && q.nextElementSibling) q.nextElementSibling.scrollIntoView({ block: 'nearest', behavior: App.reducedMotion() ? 'auto' : 'smooth' });
      }
    },
    renderNeeds() {
      const n = App.P.needs.length;
      $('#needCount').textContent = '已收集 ' + n + ' 個需要' + (n >= 3 ? ' ✓' : '');
      $('#needList').innerHTML = App.P.needs.map(id => {
        const d = App.needInfo(id);
        return '<li class="need-card"><span class="ic" aria-hidden="true">' + d.icon + '</span><span><b>' + esc(d.label) + '</b><small>' + esc(d.desc) + '</small></span>' +
          '<button type="button" data-remove="' + id + '" title="移除" aria-label="移除 ' + esc(d.label) + '">×</button></li>';
      }).join('') || '<li class="muted small">（空）點擊答案中有底線的文字。</li>';
    },
    status() {
      const n = App.P.needs.length;
      if (!App.P.persona) return { done: false, hint: '揀一位用家，開始訪問。', todo: '還未揀用家' };
      if (n < 3) return { done: false, hint: '已收集 ' + n + ' 個需要，最少要 3 個。', todo: '最少收集 3 個需要' };
      return { done: true, hint: '收集了 ' + n + ' 個需要。下一步：揀出最重要的 3 個。' };
    }
  };
  App.steps[1] = S1;

  /* ======================= 步驟 2：定義問題 ======================= */
  function productIcon(key, px) {
    const prod = C.products[key];
    const c = document.createElement('canvas');
    const dpr = 2;
    c.width = c.height = px * dpr;
    const g = c.getContext('2d');
    g.scale(dpr, dpr);
    const s = px * (prod.size / 80) * 0.62 + px * 0.12;
    const cx = px / 2, cy = px / 2 + (prod.tab ? px * 0.06 : 0);
    g.fillStyle = css('--accent-soft') || '#D2E5DA';
    g.strokeStyle = css('--accent') || '#1E5B47';
    g.lineWidth = 2;
    const p = new Path2D();
    if (prod.outline === 'circle') p.arc(cx, cy, s / 2, 0, Math.PI * 2);
    else p.rect(cx - s / 2, cy - s / 2, s, s);
    if (prod.tab) {
      const ty = cy - s / 2 - 3;
      p.moveTo(cx + 5, ty); p.arc(cx, ty, 5, 0, Math.PI * 2);
    }
    g.fill(p); g.stroke(p);
    if (prod.tab) {
      g.fillStyle = css('--card') || '#fff';
      g.beginPath(); g.arc(cx, cy - s / 2 - 3, 2, 0, Math.PI * 2); g.fill();
    }
    return c;
  }
  App.productIcon = productIcon;

  App.renderProductPick = function (host, current, suggested, compact) {
    host.innerHTML = Object.keys(C.products).map(k => {
      const p = C.products[k];
      return '<button type="button" class="product-opt" role="radio" data-product="' + k + '" aria-checked="' + (k === current) + '">' +
        '<span class="pi"></span><b>' + esc(p.name) + '</b>' + (compact ? '' : '<small>' + esc(p.note) + '</small>') +
        (k === suggested ? '<span class="tag">用家建議</span>' : '') + '</button>';
    }).join('');
    $$('.product-opt', host).forEach(b => {
      b.querySelector('.pi').appendChild(productIcon(b.dataset.product, 44));
    });
  };

  const S2 = {
    init() {
      $('#productPick').addEventListener('click', e => {
        const b = e.target.closest('[data-product]');
        if (!b) return;
        App.P.brief.product = b.dataset.product;
        App.P.design.product = b.dataset.product;
        App.sound('tick');
        this.update();
      });
      $('#rankPick').addEventListener('click', e => {
        const b = e.target.closest('[data-need]');
        if (!b) return;
        const cr = App.P.brief.criteria, id = b.dataset.need;
        const i = cr.indexOf(id);
        if (i >= 0) cr.splice(i, 1);
        else if (cr.length < 3) cr.push(id);
        else { App.toast('最多揀 3 個。先按已選的需要取消，再揀另一個。'); return; }
        App.sound('tick');
        this.update();
      });
      $('#stylePick').addEventListener('click', e => {
        const b = e.target.closest('[data-style]');
        if (!b) return;
        const st = App.P.brief.styles, v = b.dataset.style;
        const i = st.indexOf(v);
        if (i >= 0) st.splice(i, 1);
        else { st.push(v); if (st.length > 2) st.shift(); }
        App.sound('tick');
        this.update();
      });
    },
    enter() { this.update(); },
    retheme() { this.update(); },
    update() {
      const P = App.P, per = App.persona();
      $('#defPersona').textContent = per ? per.name : '用家';
      App.renderProductPick($('#productPick'), P.brief.product, per && per.product);
      $('#rankPick').innerHTML = P.needs.map(id => {
        const d = App.needInfo(id), r = P.brief.criteria.indexOf(id);
        return '<button type="button" class="chip' + (r >= 0 ? ' on' : '') + '" data-need="' + id + '" aria-pressed="' + (r >= 0) + '">' +
          (r >= 0 ? '<span class="num">' + (r + 1) + '</span>' : '') + d.icon + ' ' + esc(d.label) + '</button>';
      }).join('') || '<p class="muted">收集箱是空的。</p>';
      $('#rankNote').innerHTML = P.needs.length < 3
        ? '收集箱只有 ' + P.needs.length + ' 個需要。<button type="button" class="btn small ghost" data-go="1">回到步驟 1 收集</button>'
        : '再按一次可以取消。';
      $('#stylePick').innerHTML = C.styles.map(s =>
        '<button type="button" class="chip' + (P.brief.styles.indexOf(s) >= 0 ? ' on' : '') + '" data-style="' + esc(s) + '" aria-pressed="' + (P.brief.styles.indexOf(s) >= 0) + '">' + esc(s) + '</button>').join('');
      this.renderHMW();
      const done = !!(P.brief.product && P.brief.criteria.length === 3 && P.brief.styles.length);
      if (done) App.complete(2); else App.uncomplete(2);
      App.save();
      App.refreshStatus();
    },
    renderHMW() {
      const P = App.P, per = App.persona();
      const prod = P.brief.product ? C.products[P.brief.product].name : '＿＿＿';
      const cr = P.brief.criteria.map(id => App.needInfo(id).label);
      while (cr.length < 3) cr.push('＿＿＿');
      const who = per ? per.name : '＿＿＿';
      $('#hmwCard').innerHTML =
        '<p class="eyebrow">設計任務書</p>' +
        '<p class="q">我們可以如何為 <em>' + esc(who) + '</em> 設計一個 <em>' + esc(prod) + '</em>，做到 <em>' + esc(cr[0]) + '</em>、<em>' + esc(cr[1]) + '</em> 和 <em>' + esc(cr[2]) + '</em>？</p>' +
        (P.brief.styles.length ? '<p>設計風格：<b>' + P.brief.styles.map(esc).join('、') + '</b></p>' : '') +
        '<h3>設計準則（稍後用來測試）</h3>' +
        '<ul class="criteria">' + (P.brief.criteria.map((id, i) => {
          const d = App.needInfo(id);
          return '<li><span class="rank">' + (i + 1) + '</span><span class="ic" aria-hidden="true">' + d.icon + '</span><span><b>' + esc(d.label) + '</b><br><span class="small muted">' + esc(d.desc) + '</span></span>' +
            '<span class="how">' + (d.auto ? '電腦檢查' : '同學判斷') + '</span></li>';
        }).join('') || '<li class="muted">按左邊的需要，排出次序。</li>') + '</ul>' +
        '<p class="small muted">抽象化：設計師只保留最重要的資料，其他細節暫時放下。</p>';
    },
    status() {
      const b = App.P.brief;
      if (!b.product) return { done: false, hint: '揀一款產品。', todo: '揀產品' };
      if (b.criteria.length < 3) return { done: false, hint: '按重要次序點選 3 個需要（已選 ' + b.criteria.length + ' 個）。', todo: '排出 3 個最重要的需要' };
      if (!b.styles.length) return { done: false, hint: '揀 1–2 個設計風格。', todo: '揀設計風格' };
      return { done: true, hint: '任務書完成！下一步：拆解花階磚。' };
    }
  };
  App.steps[2] = S2;

  /* ======================= 步驟 3：花階磚偵探 ======================= */
  // 三個選項的範圍（設計座標）
  function regionPath(kind) {
    const p = new Path2D();
    if (kind === 'half') p.rect(-100, -100, 100, 200);
    else if (kind === 'quarter') p.rect(0, -100, 100, 100);
    else { p.moveTo(0, 0); p.lineTo(0, -100); p.lineTo(100, -100); p.closePath(); }
    return p;
  }
  const OPTS = [
    { id: 'half', label: '一半', frac: '1/2' },
    { id: 'quarter', label: '四分一', frac: '1/4' },
    { id: 'eighth', label: '八分一', frac: '1/8' }
  ];

  function DetTask(host, cfg) {
    this.host = host;
    this.cfg = cfg;
    this.sel = null;
    host.innerHTML =
      '<canvas class="det-canvas"></canvas>' +
      '<div class="det-side">' +
      '<p class="det-q">' + esc(cfg.question) + '</p>' +
      '<div class="opt-row">' + OPTS.map(o => '<button type="button" class="opt" data-opt="' + o.id + '" aria-pressed="false">' + o.label + '<br><small>' + o.frac + '</small></button>').join('') + '</div>' +
      '<div class="row"><button type="button" class="btn primary" data-act="check">確定答案</button>' +
      '<button type="button" class="btn ghost" data-act="replay" hidden>再看一次重組</button></div>' +
      '<div class="feedback" hidden></div>' +
      '<div class="insight" hidden></div>' +
      '</div>';
    this.cv = host.querySelector('canvas');
    this.design = E.cloneDesign(preset(cfg.preset).design);
    host.addEventListener('click', e => {
      const o = e.target.closest('[data-opt]');
      if (o) { this.sel = o.dataset.opt; this.markOpts(); this.draw(this.sel); App.sound('tick'); return; }
      const a = e.target.closest('[data-act]');
      if (!a) return;
      if (a.dataset.act === 'check') this.check();
      if (a.dataset.act === 'replay') this.rebuild();
    });
    host.addEventListener('pointerover', e => {
      const o = e.target.closest('[data-opt]');
      if (o && !this.animating) this.draw(o.dataset.opt);
    });
    host.addEventListener('pointerout', e => {
      if (e.target.closest('[data-opt]') && !this.animating) this.draw(this.sel);
    });
  }
  DetTask.prototype.markOpts = function () {
    $$('[data-opt]', this.host).forEach(b => {
      b.setAttribute('aria-pressed', String(b.dataset.opt === this.sel));
      b.classList.remove('right', 'wrong');
    });
  };
  DetTask.prototype.setup = function () {
    const f = fitCanvas(this.cv, 400);
    const g = this.cv.getContext('2d');
    const pad = f.w * 0.04;
    const s = (f.w - pad * 2) / 200;
    g.setTransform(s, 0, 0, s, f.w / 2, f.h / 2);
    return { g, f, s };
  };
  DetTask.prototype.draw = function (region) {
    const { g, f, s } = this.setup();
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, f.w, f.h);
    g.restore();
    E.renderTile(g, this.design, { texture: 0.08 });
    if (region) {
      const shade = new Path2D();
      shade.rect(-110, -110, 220, 220);
      shade.addPath(regionPath(region));
      g.fillStyle = 'rgba(245, 243, 236, 0.78)';
      g.fill(shade, 'evenodd');
      g.lineWidth = 3 / s;
      g.strokeStyle = css('--accent') || '#1E5B47';
      g.setLineDash([6 / s, 4 / s]);
      g.stroke(regionPath(region));
      g.setLineDash([]);
    }
  };
  DetTask.prototype.check = function () {
    if (!this.sel) { App.toast('先揀一個答案。'); return; }
    const fb = this.host.querySelector('.feedback');
    const btn = this.host.querySelector('[data-opt="' + this.sel + '"]');
    fb.hidden = false;
    if (this.sel === this.cfg.answer) {
      btn.classList.add('right');
      fb.className = 'feedback ok';
      fb.textContent = this.cfg.right;
      App.sound('ok');
      this.cfg.onSolved();
      this.host.querySelector('[data-act="replay"]').hidden = false;
      const ins = this.host.querySelector('.insight');
      ins.hidden = false;
      ins.innerHTML = this.cfg.insight;
      this.rebuild();
    } else {
      btn.classList.add('wrong');
      fb.className = 'feedback no';
      fb.textContent = this.cfg.wrong[this.sel] || '再想想。';
      App.sound('no');
    }
  };
  // 重組動畫：由最細的部分，按演算法一份一份變回整塊磚
  DetTask.prototype.rebuild = function () {
    const region = regionPath(this.cfg.answer);
    const Ts = E.symTransforms(E.algoFor(this.design));
    const per = App.reducedMotion() ? 0 : 520;
    const t0 = performance.now();
    this.animating = true;
    const bg = css('--panel') || '#F3F4EF';
    const frame = now => {
      const { g, f } = this.setup();
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = bg; g.fillRect(0, 0, f.w, f.h); g.restore();
      g.save(); g.strokeStyle = css('--line') || '#C8CEC6'; g.lineWidth = 1; g.strokeRect(-100, -100, 200, 200); g.restore();
      let busy = false;
      Ts.forEach((T, k) => {
        const t = per ? Math.max(0, Math.min(1, (now - t0 - k * per) / (per * 0.85))) : 1;
        if (t <= 0) { busy = true; return; }
        if (t < 1) busy = true;
        const e = 1 - Math.pow(1 - t, 3);
        g.save();
        g.globalAlpha = 0.25 + 0.75 * e;
        g.rotate((1 - e) * -25 * DEG);
        g.transform(T.a, T.b, T.c, T.d, 0, 0);
        g.clip(region);
        E.renderTile(g, this.design, { texture: 0.08, clip: false });
        g.restore();
      });
      if (busy) requestAnimationFrame(frame);
      else { this.animating = false; this.draw(null); }
    };
    requestAnimationFrame(frame);
  };

  const S3 = {
    init() {
      $('#detTabs').addEventListener('click', e => {
        const b = e.target.closest('[role="tab"]');
        if (b) this.tab(b.dataset.tab);
      });
      const P = () => App.P;
      this.t1 = new DetTask($('#det-d1'), {
        preset: 'redflower', answer: 'eighth',
        question: '這塊「紅花地磚」最少要畫哪一部分，其餘都可以用「重複」完成？（把滑鼠移到選項上可以預覽）',
        right: '答對！只要畫好 1/8，旋轉 4 次再加鏡像，就變回整塊磚：1 份 → 8 份。',
        wrong: { half: '一半可以，但還可以再細。一半裏面，上下兩邊是不是一樣？', quarter: '很接近！看看這 1/4：沿斜線對摺，兩邊是不是一模一樣（鏡像）？' },
        insight: '<b>模式識別：</b>花階磚有「旋轉對稱」和「鏡像對稱」。找出重複的模式，就可以<b>只畫 1/8</b>，其餘交給電腦。',
        onSolved: () => { P().detective.t1 = true; this.check(); }
      });
      this.t2 = new DetTask($('#det-d2'), {
        preset: 'pinwheel', answer: 'quarter',
        question: '這塊「綠葉風車」又如何？最少要畫哪一部分？',
        right: '答對！風車磚只有旋轉，沒有鏡像，所以最細是 1/4：旋轉 4 次 → 4 份。',
        wrong: { half: '一半可以，但還可以再細。', eighth: '留意：把 1/8 反轉（鏡像）之後的樣子，在這塊磚上找不到。這塊磚沒有鏡像對稱，所以 1/8 不夠。' },
        insight: '<b>發現：</b>不同的對稱方法（演算法），決定了最少要畫多少。萬花筒磚畫 1/8，風車磚畫 1/4。',
        onSolved: () => { P().detective.t2 = true; this.check(); }
      });
      this.initTree();
    },
    enter() {
      this.tab(this.curTab || 'd1');
    },
    retheme() { this.redraw(); },
    tab(id) {
      this.curTab = id;
      $$('#detTabs [role="tab"]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === id)));
      $('#det-d1').hidden = id !== 'd1';
      $('#det-d2').hidden = id !== 'd2';
      $('#det-d3').hidden = id !== 'd3';
      this.markTabs();
      if (id === 'd3') this.renderTree();
      this.redraw();
    },
    redraw() {
      if (this.curTab === 'd1') this.t1.draw(this.t1.sel);
      if (this.curTab === 'd2') this.t2.draw(this.t2.sel);
    },
    markTabs() {
      const d = App.P.detective;
      const done = { d1: d.t1, d2: d.t2, d3: d.t3done };
      $$('#detTabs [role="tab"]').forEach(b => {
        const base = b.textContent.replace(' ✓', '');
        b.textContent = base + (done[b.dataset.tab] ? ' ✓' : '');
      });
    },
    check() {
      const d = App.P.detective;
      this.markTabs();
      App.save();
      if (d.t1 && d.t2 && d.t3done) App.complete(3);
      App.refreshStatus();
    },

    /* ---- 任務三：拆解樹 ---- */
    initTree() {
      const host = $('#decompTree');
      host.addEventListener('click', e => {
        const card = e.target.closest('.task-card');
        if (card) {
          const zoneEl = card.closest('[data-zone]');
          if (this.selCard != null && this.selCard !== card.dataset.card && zoneEl && zoneEl.dataset.zone !== 'pool') {
            this.place(this.selCard, zoneEl.dataset.zone);
            return;
          }
          this.selCard = this.selCard === card.dataset.card ? null : card.dataset.card;
          $$('.task-card', host).forEach(c => c.setAttribute('aria-pressed', String(c.dataset.card === this.selCard)));
          return;
        }
        const zone = e.target.closest('[data-zone]');
        if (zone && this.selCard != null) { this.place(this.selCard, zone.dataset.zone); return; }
        if (e.target.closest('[data-act="check-tree"]')) this.checkTree();
      });
      host.addEventListener('dragstart', e => {
        const card = e.target.closest('.task-card');
        if (card) { e.dataTransfer.setData('text/plain', card.dataset.card); e.dataTransfer.effectAllowed = 'move'; }
      });
      host.addEventListener('dragover', e => {
        const z = e.target.closest('[data-zone]');
        if (z) { e.preventDefault(); z.classList.add('target'); }
      });
      host.addEventListener('dragleave', e => {
        const z = e.target.closest('[data-zone]');
        if (z) z.classList.remove('target');
      });
      host.addEventListener('drop', e => {
        const z = e.target.closest('[data-zone]');
        if (!z) return;
        e.preventDefault();
        z.classList.remove('target');
        this.place(e.dataTransfer.getData('text/plain'), z.dataset.zone);
      });
    },
    place(card, zone) {
      const t3 = App.P.detective.t3;
      if (zone === 'pool') delete t3[card]; else t3[card] = zone;
      this.selCard = null;
      App.sound('tick');
      App.save();
      this.renderTree();
    },
    renderTree(marks) {
      const P = App.P, per = App.persona();
      const prod = P.brief.product ? C.products[P.brief.product].name : '花階磚';
      const t3 = P.detective.t3;
      const D = C.decompose;
      const card = (c, i) => {
        const m = marks ? (marks[i] ? ' right' : ' wrong') : '';
        return '<button type="button" class="task-card' + m + '" draggable="true" data-card="' + i + '" aria-pressed="false">' + esc(c.text) + '</button>';
      };
      const pool = D.cards.map((c, i) => t3[i] ? '' : card(c, i)).join('');
      $('#decompTree').innerHTML =
        '<div class="tree-root">為' + esc(per ? per.name : '用家') + '設計' + esc(prod) + '</div>' +
        '<p class="small muted" style="text-align:center">把大問題拆成三類小問題：先點一張卡，再點要放的類別（也可以拖曳）。</p>' +
        '<div class="tree-branches">' + D.branches.map(b =>
          '<div class="branch" data-zone="' + b.id + '"><h4>' + esc(b.name) + '<small>' + esc(b.desc) + '</small></h4>' +
          D.cards.map((c, i) => t3[i] === b.id ? card(c, i) : '').join('') + '</div>').join('') + '</div>' +
        '<div class="card-pool" data-zone="pool">' + (pool || '<span class="muted small">全部卡都放好了。</span>') + '</div>' +
        '<div class="row"><button type="button" class="btn primary" data-act="check-tree">檢查</button>' +
        (P.detective.t3done ? '<span class="feedback ok">完成！大問題變成 8 個容易處理的小任務，這就是<b>拆解</b>。</span>' : '') + '</div>';
    },
    checkTree() {
      const D = C.decompose, t3 = App.P.detective.t3;
      const placed = Object.keys(t3).length;
      if (placed < D.cards.length) { App.toast('還有 ' + (D.cards.length - placed) + ' 張卡未放好。'); return; }
      const marks = D.cards.map((c, i) => t3[i] === c.branch);
      this.renderTree(marks);
      if (marks.every(Boolean)) {
        App.P.detective.t3done = true;
        App.sound('ok');
        this.check();
        setTimeout(() => this.renderTree(), 900);
      } else {
        App.sound('no');
        const wrong = marks.filter(m => !m).length;
        App.toast(wrong + ' 張卡放錯了，它們會回到下面。想想：這件事是關於「外觀」、「製作」還是「用家」？');
        setTimeout(() => {
          D.cards.forEach((c, i) => { if (!marks[i]) delete t3[i]; });
          App.save();
          this.renderTree();
        }, 1100);
      }
    },
    status() {
      const d = App.P.detective;
      const n = (d.t1 ? 1 : 0) + (d.t2 ? 1 : 0) + (d.t3done ? 1 : 0);
      if (n < 3) return { done: false, hint: '完成 3 個偵探任務（已完成 ' + n + ' 個）。', todo: '完成偵探任務' };
      return { done: true, hint: '偵探任務完成！下一步：用演算法重複圖案。' };
    }
  };
  App.steps[3] = S3;

  /* ======================= 步驟 4：演算法工作坊 ======================= */
  // 用來實驗的「基本圖案」（故意不對稱，才看得出旋轉和鏡像）
  const MOTIF = {
    bg: 'cream', algo: { n: 1, mirror: false }, product: 'coaster',
    shapes: [
      { type: 'petal', x: 16, y: -62, size: 20, sx: 1, rot: 16, color: 'red' },
      { type: 'leaf', x: 40, y: -36, size: 15, sx: 0.8, rot: 52, color: 'green' },
      { type: 'circle', x: 9, y: -30, size: 6, sx: 1, rot: 0, color: 'ochre' }
    ]
  };

  function stampSet(p) {
    const set = new Set();
    const n = Math.max(1, p.n | 0);
    for (let i = 0; i < n; i++) {
      const a = ((Math.round(i * p.angle) % 360) + 360) % 360;
      set.add(String(a));
      if (p.mirror) set.add(a + 'm');
    }
    return set;
  }
  function sameResult(p, t) {
    if ((p.n | 0) !== t.n || !!p.mirror !== !!t.mirror) return false;
    const a = stampSet(p), b = stampSet(t);
    if (a.size !== b.size) return false;
    for (const x of a) if (!b.has(x)) return false;
    return a.size === (t.mirror ? t.n * 2 : t.n);
  }

  function setupBoard(cv) {
    const f = fitCanvas(cv, 420);
    const g = cv.getContext('2d');
    const pad = f.w * 0.05;
    const s = (f.w - pad * 2) / 200;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = css('--panel') || '#F3F4EF';
    g.fillRect(0, 0, f.w, f.h);
    g.setTransform(s, 0, 0, s, f.w / 2, f.h / 2);
    return { g, s, f };
  }

  function drawStamps(g, stamps, round) {
    const clip = new Path2D();
    if (round) clip.arc(0, 0, 100, 0, Math.PI * 2); else clip.rect(-100, -100, 200, 200);
    g.save();
    g.fillStyle = E.colorHex('cream');
    g.fill(clip);
    g.clip(clip);
    stamps.forEach(st => {
      const T = transformOf(st.angle, st.m);
      g.save();
      if (st.pop != null && st.pop < 1) {
        const k = 0.8 + 0.2 * st.pop;
        g.globalAlpha = 0.3 + 0.7 * st.pop;
        g.scale(k, k);
      }
      MOTIF.shapes.forEach(sh => { g.fillStyle = E.colorHex(sh.color); E.drawShape(g, sh, T); });
      g.restore();
    });
    g.restore();
    g.save();
    g.strokeStyle = css('--line') || '#C8CEC6';
    g.lineWidth = 1.2;
    g.stroke(clip);
    g.restore();
  }
  function transformOf(angle, m) {
    const c = Math.cos(angle * DEG), s = Math.sin(angle * DEG);
    return m ? { a: -c, b: -s, c: -s, d: c } : { a: c, b: s, c: -s, d: c };
  }
  function drawTurtle(g, heading, s) {
    g.save();
    g.rotate(heading * DEG);
    g.fillStyle = css('--accent') || '#1E5B47';
    g.strokeStyle = css('--card') || '#fff';
    g.lineWidth = 2 / s;
    g.beginPath();
    g.moveTo(0, -26); g.lineTo(11, -4); g.lineTo(3, -8); g.lineTo(3, 10); g.lineTo(-3, 10); g.lineTo(-3, -8); g.lineTo(-11, -4);
    g.closePath();
    g.fill(); g.stroke();
    g.restore();
  }

  const S4 = {
    params: { n: 1, angle: 0, mirror: false },
    stamps: [],
    heading: 0,
    ch: 0,
    running: false,
    init() {
      $('#algoTabs').addEventListener('click', e => {
        const b = e.target.closest('[role="tab"]');
        if (b) this.tab(b.dataset.tab);
      });
      // 一塊磚
      $('#tileChallenges').addEventListener('click', e => {
        const b = e.target.closest('[data-ch]');
        if (b) this.pick(Number(b.dataset.ch));
      });
      $('#tileBlocks').addEventListener('click', e => {
        const b = e.target.closest('[data-d]');
        if (!b || this.running) return;
        const p = this.params;
        const k = b.dataset.d;
        if (k === 'n-') p.n = Math.max(1, p.n - 1);
        if (k === 'n+') p.n = Math.min(12, p.n + 1);
        if (k === 'a-') p.angle = p.angle - 15;
        if (k === 'a+') p.angle = p.angle + 15;
        App.sound('tick');
        this.onParam();
      });
      $('#tileBlocks').addEventListener('change', e => {
        const p = this.params;
        if (e.target.id === 'pN') p.n = Math.max(1, Math.min(12, parseInt(e.target.value, 10) || 1));
        if (e.target.id === 'pA') p.angle = Math.max(-360, Math.min(360, parseInt(e.target.value, 10) || 0));
        if (e.target.id === 'pM') p.mirror = e.target.checked;
        this.onParam();
      });
      $('#runTile').addEventListener('click', () => this.run(false));
      $('#stepTile').addEventListener('click', () => this.run(true));
      $('#resetTile').addEventListener('click', () => this.resetRun());
      // 地板
      $('#floorChallenges').addEventListener('click', e => {
        const b = e.target.closest('[data-fch]');
        if (b) this.pickFloor(Number(b.dataset.fch));
      });
      $('#floorRule').innerHTML = C.floorRules.map(r => '<option value="' + r.id + '">' + esc(r.name) + '</option>').join('');
      $('#floorRule').addEventListener('change', () => { this.floor.rule = $('#floorRule').value; this.renderFloorBlocks(); this.drawFloor(0); });
      $('#floorTile').addEventListener('change', () => { this.floor.tile = $('#floorTile').value; this.drawFloor(0); });
      $('#runFloor').addEventListener('click', () => this.runFloor());
      $('#resetFloor').addEventListener('click', () => { this.stopFloor(); this.drawFloor(0); });
      this.floor = { rule: 'same', tile: 'arc', fch: 0, seed: 1 };
      this.pick(0, true);
    },
    enter() {
      this.tab(this.curTab || 'tile');
    },
    leave() { this.stopRun(); this.stopFloor(); },
    retheme() { this.drawTile(); this.drawTarget(); this.drawFloor(this.floorShown || 0); this.drawFloorTarget(); },
    tab(id) {
      this.curTab = id;
      $$('#algoTabs [role="tab"]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === id)));
      $('#algo-tile').hidden = id !== 'tile';
      $('#algo-floor').hidden = id !== 'floor';
      if (id === 'tile') { this.renderChallenges(); this.renderBlocks(); this.drawTile(); this.drawTarget(); }
      else { this.fillTileSelect(); this.renderFloorChallenges(); this.renderFloorBlocks(); this.drawFloor(this.floorShown || 0); this.drawFloorTarget(); }
    },

    /* ---- 一塊磚 ---- */
    challenge() { return C.algoChallenges[this.ch]; },
    pick(i, silent) {
      this.stopRun();
      this.ch = i;
      const c = this.challenge();
      this.params = Object.assign({}, c.start);
      this.stamps = [];
      this.heading = 0;
      this.hLogic = 0;
      this.gen = null;
      this.tries = 0;
      $('#tileMsg').textContent = c.goal;
      $('#tileMsg').className = 'algo-msg';
      if (!silent) { this.renderChallenges(); this.renderBlocks(); this.drawTile(); this.drawTarget(); }
    },
    renderChallenges() {
      const solved = App.P.algo.solved;
      $('#tileChallenges').innerHTML = C.algoChallenges.map((c, i) =>
        '<button type="button" class="challenge' + (i === this.ch ? ' on' : '') + (solved[c.id] ? ' solved' : '') + '" data-ch="' + i + '">' +
        '<b>' + esc(c.title) + '</b><small>' + esc(c.goal) + '</small></button>').join('');
    },
    renderBlocks() {
      const p = this.params;
      $('#tileBlocks').innerHTML =
        '<div class="blk event" data-b="start">當 ▶ 被點擊</div>' +
        '<div class="c-block">' +
        '<div class="blk control" data-b="repeat">重複 <span class="slot"><button type="button" data-d="n-" aria-label="減少">−</button><input id="pN" type="number" min="1" max="12" value="' + p.n + '" aria-label="重複次數"><button type="button" data-d="n+" aria-label="增加">+</button></span> 次</div>' +
        '<div class="c-body">' +
        '<div class="blk pen" data-b="stamp">蓋印 圖案</div>' +
        '<div class="c-block">' +
        '<div class="blk control" data-b="if">如果 <span class="bool"><label><input type="checkbox" id="pM"' + (p.mirror ? ' checked' : '') + '> 要鏡像</label></span> 那麼</div>' +
        '<div class="c-body"><div class="blk pen' + (p.mirror ? '' : ' off') + '" data-b="stampM">蓋印 鏡像圖案</div></div>' +
        '<div class="c-foot"></div></div>' +
        '<div class="blk motion" data-b="turn">右轉 ↻ <span class="slot"><button type="button" data-d="a-" aria-label="減少">−</button><input id="pA" type="number" step="15" value="' + p.angle + '" aria-label="角度"><button type="button" data-d="a+" aria-label="增加">+</button></span> 度</div>' +
        '</div><div class="c-foot"></div></div>';
      this.renderCode();
    },
    renderCode() {
      const p = this.params;
      $('#tileCode').textContent =
        '// 按「執行」時，電腦會這樣做：\n' +
        'for (let i = 0; i < ' + p.n + '; i++) {   // 重複 ' + p.n + ' 次\n' +
        '  stamp(motif);                  // 蓋印 圖案\n' +
        '  if (' + (p.mirror ? 'true' : 'false') + ') {                    // 如果 要鏡像\n' +
        '    stamp(flip(motif));          //   蓋印 鏡像圖案\n' +
        '  }\n' +
        '  turnRight(' + p.angle + ');                 // 右轉 ' + p.angle + ' 度\n' +
        '}';
    },
    onParam() {
      this.resetRun();
      this.renderBlocks();
    },
    hl(name) {
      $$('#tileBlocks .blk').forEach(b => b.classList.toggle('active', b.dataset.b === name));
    },
    vars(i) {
      const p = this.params;
      $('#tileVars').innerHTML = i == null ? '' :
        '<span class="var-pill">第 ' + (i + 1) + ' 次</span><span class="var-pill">已轉 ' + Math.round(this.hLogic || 0) + '°</span><span class="var-pill">已蓋印 ' + this.stamps.length + ' 次</span>';
    },
    drawTile() {
      const c = this.challenge();
      const { g, s } = setupBoard($('#algoCanvas'));
      drawStamps(g, this.stamps, c.round);
      if (!this.stamps.length) {
        // 未執行：淡淡顯示基本圖案的位置
        g.save(); g.globalAlpha = 0.35;
        MOTIF.shapes.forEach(sh => { g.fillStyle = E.colorHex(sh.color); E.drawShape(g, sh, null); });
        g.restore();
      }
      drawTurtle(g, this.heading, s);
    },
    drawTarget() {
      const c = this.challenge();
      const { g } = setupBoard($('#algoTarget'));
      const t = c.target, st = [];
      for (let i = 0; i < t.n; i++) {
        st.push({ angle: i * t.angle, m: false });
        if (t.mirror) st.push({ angle: i * t.angle, m: true });
      }
      drawStamps(g, st, c.round);
    },
    *program() {
      const p = this.params;
      yield { b: 'start' };
      for (let i = 0; i < p.n; i++) {
        yield { b: 'repeat', i };
        yield { b: 'stamp', i, act: () => this.addStamp(this.hLogic, false) };
        yield { b: 'if', i };
        if (p.mirror) yield { b: 'stampM', i, act: () => this.addStamp(this.hLogic, true) };
        yield { b: 'turn', i, turn: p.angle };
      }
    },
    addStamp(angle, m) {
      const st = { angle, m, pop: 0 };
      this.stamps.push(st);
      App.sound('stamp');
      const t0 = performance.now();
      const anim = now => {
        st.pop = Math.min(1, (now - t0) / 220);
        this.drawTile();
        if (st.pop < 1) requestAnimationFrame(anim);
      };
      if (App.reducedMotion()) { st.pop = 1; this.drawTile(); } else requestAnimationFrame(anim);
    },
    resetRun() {
      this.stopRun();
      this.stamps = [];
      this.heading = 0;
      this.hLogic = 0;
      this.gen = null;
      this.hl(null);
      this.vars(null);
      this.drawTile();
    },
    stopRun() {
      clearTimeout(this.timer);
      this.running = false;
    },
    run(stepMode) {
      if (this.running && !stepMode) return;
      if (!this.gen || this.finished) {
        this.stamps = []; this.heading = 0; this.hLogic = 0; this.finished = false;
        this.gen = this.program();
      }
      const fast = $('#fastTile').checked;
      const delay = fast ? 130 : 520;
      const advance = () => {
        const r = this.gen.next();
        if (r.done) { this.finished = true; this.running = false; this.hl(null); this.evaluate(); return; }
        const s = r.value;
        this.hl(s.b);
        if (s.act) s.act();
        if (s.turn != null) this.turnBy(s.turn, fast ? 90 : 300);
        this.vars(s.i);
        this.drawTile();
        if (!stepMode) this.timer = setTimeout(advance, delay);
      };
      if (stepMode) { this.stopRun(); advance(); }
      else { this.running = true; advance(); }
    },
    turnBy(deg, ms) {
      this.hLogic = (this.hLogic || 0) + deg;
      const h0 = this.heading, t0 = performance.now();
      if (App.reducedMotion() || ms <= 0) { this.heading = h0 + deg; this.drawTile(); return; }
      const anim = now => {
        const t = Math.min(1, (now - t0) / ms);
        this.heading = h0 + deg * (1 - Math.pow(1 - t, 2));
        this.drawTile();
        if (t < 1) requestAnimationFrame(anim);
        else this.heading = h0 + deg;
      };
      requestAnimationFrame(anim);
    },
    evaluate() {
      const c = this.challenge(), p = this.params, t = c.target;
      const msg = $('#tileMsg');
      this.tries = (this.tries || 0) + 1;
      if (sameResult(p, t)) {
        msg.className = 'algo-msg ok';
        msg.textContent = c.id === 'bug'
          ? '捉到蟲了！4 × 90° = 360°，剛好轉一圈。規律：每次轉的角度 = 360 ÷ 重複次數。'
          : c.id === 'snow' ? '漂亮的雪花！360 ÷ 6 = 60°。' : '完成！和目標一模一樣。';
        if (!App.P.algo.solved[c.id]) {
          App.P.algo.solved[c.id] = true;
          App.sound('ok');
          App.confetti();
          App.save();
        }
        this.renderChallenges();
        this.checkDone();
        return;
      }
      msg.className = 'algo-msg no';
      const total = p.n * p.angle;
      App.sound('no');
      if (p.n !== t.n) msg.textContent = '目標有 ' + t.n + ' 份' + (t.mirror ? '（未計鏡像）' : '') + '，你重複了 ' + p.n + ' 次。';
      else if (((total % 360) + 360) % 360 !== 0 || total === 0) {
        msg.textContent = '一共轉了 ' + total + '°，沒有剛好轉完一圈（360°），所以圖案分佈不平均。' +
          (this.tries > 1 ? '提示：每次轉的角度 = 360 ÷ ' + p.n + '。' : '');
      } else if (!!p.mirror !== !!t.mirror) msg.textContent = t.mirror ? '形狀的位置對了，但少了鏡像的另一半。' : '這個目標不需要鏡像。';
      else msg.textContent = '差一點！檢查每次轉的角度。';
    },

    /* ---- 地板 ---- */
    fillTileSelect() {
      const opts = [['arc', '單弧線'], ['truchet', '彎彎曲線'], ['pinwheel', '綠葉風車'], ['redflower', '紅花地磚']];
      if (App.P.design.shapes.length && !E.isRoundProduct(App.P.design)) opts.push(['mine', '我的設計']);
      $('#floorTile').innerHTML = opts.map(o => '<option value="' + o[0] + '"' + (o[0] === this.floor.tile ? ' selected' : '') + '>' + o[1] + '</option>').join('');
      $('#floorRule').value = this.floor.rule;
    },
    floorDesign(id) {
      if (id === 'mine') return App.P.design;
      return preset(id).design;
    },
    pickFloor(i) {
      this.stopFloor();
      this.floor.fch = i;
      this.floor.tile = C.floorChallenges[i].tile || 'arc';
      $('#floorMsg').textContent = C.floorChallenges[i].goal;
      $('#floorMsg').className = 'algo-msg';
      this.fillTileSelect();
      this.renderFloorChallenges();
      this.drawFloor(0);
      this.drawFloorTarget();
    },
    renderFloorChallenges() {
      const solved = App.P.algo.floorSolved;
      $('#floorChallenges').innerHTML = C.floorChallenges.map((c, i) =>
        '<button type="button" class="challenge' + (i === this.floor.fch ? ' on' : '') + (solved[c.id] ? ' solved' : '') + '" data-fch="' + i + '">' +
        '<b>地板挑戰 ' + (i + 1) + '：' + esc(c.title) + '</b><small>' + esc(c.goal) + '</small></button>').join('') +
        '<div class="challenge"><b>自由探索</b><small>試試「隨機旋轉」按幾次執行；再用「紅花地磚」試試每一條規則。</small></div>';
      if (!$('#floorMsg').textContent) $('#floorMsg').textContent = C.floorChallenges[this.floor.fch].goal;
    },
    renderFloorBlocks() {
      const r = this.floor.rule;
      const place = (deg, flip) => '<div class="blk pen" data-b="place' + (deg != null ? deg : '') + '">放一塊磚 ' + (flip || '↻ <span class="slot">' + deg + '</span> 度') + '</div>';
      const ifElse = (cond, a, b, tag) => '<div class="c-block"><div class="blk control" data-b="' + tag + '">如果 <span class="bool">' + cond + '</span> 那麼</div>' +
        '<div class="c-body">' + a + '</div>' + (b != null ? '<div class="blk control" data-b="' + tag + 'else">否則</div><div class="c-body">' + b + '</div>' : '') + '<div class="c-foot"></div></div>';
      let body = '';
      if (r === 'same') body = place(0);
      if (r === 'alt') body = ifElse('<span class="op">(<b>行</b> + <b>列</b>) 除以 2 的餘數</span> = 1', place(90), place(0), 'if');
      if (r === 'pinwheel') {
        body = ifElse('<b>行</b> 是單數',
          ifElse('<b>列</b> 是單數', place(0), place(90), 'if2'),
          ifElse('<b>列</b> 是單數', place(270), place(180), 'if3'), 'if');
      }
      if (r === 'mirror') {
        body = ifElse('<b>列</b> 是雙數', '<div class="blk motion" data-b="fx">左右翻轉</div>', null, 'ifx') +
          ifElse('<b>行</b> 是雙數', '<div class="blk motion" data-b="fy">上下翻轉</div>', null, 'ify') +
          '<div class="blk pen" data-b="placeM">放一塊磚</div>';
      }
      if (r === 'random') body = '<div class="blk pen" data-b="placeR">放一塊磚 ↻ <span class="op">在 0 至 3 之間隨機選一個數</span> × 90 度</div>';
      $('#floorBlocks').innerHTML =
        '<div class="blk event" data-b="start">當 ▶ 被點擊</div>' +
        '<div class="c-block"><div class="blk control" data-b="rows">重複 <span class="slot">4</span> 次　（<b>行</b> = 1, 2, 3, 4）</div><div class="c-body">' +
        '<div class="c-block"><div class="blk control" data-b="cols">重複 <span class="slot">4</span> 次　（<b>列</b> = 1, 2, 3, 4）</div><div class="c-body">' + body + '</div><div class="c-foot"></div></div>' +
        '</div><div class="c-foot"></div></div>';
      this.floorThink();
    },
    floorThink(after) {
      const t = this.floor.tile, r = this.floor.rule;
      let s = '這是<b>巢狀迴圈</b>：外面的迴圈負責「行」，裏面的迴圈負責「列」，一共放 4 × 4 = 16 塊磚。';
      if (after && t === 'redflower' && r !== 'same') s = '有沒有發現？紅花地磚是八份對稱的，怎樣轉都一樣，所以規則對它沒有影響！';
      else if (after && r === 'random') {
        s = '每次執行，結果都不同，因為用了<b>隨機數</b>。' + (t === 'truchet'
          ? '「彎彎曲線」配隨機旋轉，會出現像迷宮的圖案！下學期在 Delightex 也會用到隨機數。'
          : '試試用「彎彎曲線」配「隨機旋轉」，會出現像迷宮的圖案！');
      } else if (after && (r === 'pinwheel' || r === 'mirror') && t === 'arc') s = '四塊磚的弧線在中間合成一個完整的大圓：<b>小規則，大圖案</b>。';
      else if (r !== 'same' && r !== 'random') s += ' 「如果」會按行、列的數字決定每塊磚怎樣放。';
      $('#floorThink').innerHTML = s;
    },
    floorVars(r, c, cell) {
      $('#floorVars').innerHTML = r == null ? '' :
        '<span class="var-pill">行 = ' + (r + 1) + '</span><span class="var-pill">列 = ' + (c + 1) + '</span>' +
        (cell ? '<span class="var-pill">' + (cell.fx || cell.fy ? (cell.fx ? '左右翻' : '') + (cell.fy ? '上下翻' : '') : '轉 ' + cell.rot + '°') + '</span>' : '');
    },
    drawFloor(limit) {
      this.floorShown = limit;
      const cv = $('#floorCanvas');
      const f = fitCanvas(cv, 420);
      const g = cv.getContext('2d');
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.fillStyle = css('--panel') || '#F3F4EF';
      g.fillRect(0, 0, f.w, f.h);
      const gap = Math.max(2, f.w * 0.006), cell = (f.w - gap * 5) / 4;
      const img = E.tileImage(this.floorDesign(this.floor.tile), Math.ceil(cell), { texture: 0.08 });
      E.renderFloor(g, img, { rows: 4, cols: 4, cell, gap, rule: this.floor.rule, seed: this.floor.seed, limit, grout: css('--grout') || '#CEC8BB' });
      // 還未放的位置畫虛線格
      g.save();
      g.strokeStyle = css('--line') || '#C8CEC6';
      g.setLineDash([4, 4]);
      for (let i = limit; i < 16; i++) {
        const r = Math.floor(i / 4), c = i % 4;
        g.strokeRect(gap + c * (cell + gap) + 0.5, gap + r * (cell + gap) + 0.5, cell - 1, cell - 1);
      }
      g.restore();
    },
    drawFloorTarget() {
      const ch = C.floorChallenges[this.floor.fch];
      const cv = $('#floorTarget');
      const f = fitCanvas(cv, 150);
      const g = cv.getContext('2d');
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.fillStyle = css('--panel') || '#F3F4EF';
      g.fillRect(0, 0, f.w, f.h);
      const gap = 2, cell = (f.w - gap * 5) / 4;
      const img = E.tileImage(preset(ch.tile || 'arc').design, Math.ceil(cell), { texture: 0.08 });
      E.renderFloor(g, img, { rows: 4, cols: 4, cell, gap, rule: ch.target, seed: 1, grout: css('--grout') || '#CEC8BB' });
    },
    // 把地板畫成小圖，用來比較「看起來是否一樣」
    floorPixels(tileId, rule, seed) {
      const c = document.createElement('canvas');
      c.width = c.height = 4 * 40;
      const g = c.getContext('2d', { willReadFrequently: true });
      const img = E.tileImage(preset(tileId).design, 40, { texture: 0 });
      E.renderFloor(g, img, { rows: 4, cols: 4, cell: 40, gap: 0, rule, seed, grout: '#000' });
      return g.getImageData(0, 0, c.width, c.height).data;
    },
    sameFloor(tileId, ruleA, seedA, ruleB) {
      const a = this.floorPixels(tileId, ruleA, seedA), b = this.floorPixels(tileId, ruleB, 1);
      let diff = 0;
      for (let i = 0; i < a.length; i += 4) diff += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
      return diff / (a.length / 4 * 3) < 3;
    },
    stopFloor() { clearTimeout(this.ftimer); this.frunning = false; this.floorVars(null); $$('#floorBlocks .blk').forEach(b => b.classList.remove('active')); },
    runFloor() {
      this.stopFloor();
      if (this.floor.rule === 'random') this.floor.seed = (Math.random() * 1e9) | 0;
      const fast = $('#fastFloor').checked;
      const delay = fast ? 60 : 280;
      const rng = E.seededRng(this.floor.seed);
      let i = 0;
      this.frunning = true;
      const hl = names => $$('#floorBlocks .blk').forEach(b => b.classList.toggle('active', names.indexOf(b.dataset.b) >= 0));
      const tick = () => {
        if (i >= 16) {
          this.frunning = false;
          hl([]);
          this.floorVars(null);
          this.floorThink(true);
          this.evalFloor();
          return;
        }
        const r = Math.floor(i / 4), c = i % 4;
        const cell = E.floorCell(this.floor.rule, r, c, rng);
        const names = ['rows', 'cols'];
        const R = this.floor.rule;
        if (R === 'same') names.push('place0');
        if (R === 'alt') names.push((r + c) % 2 ? 'if' : 'ifelse', 'place' + cell.rot);
        if (R === 'pinwheel') names.push(r % 2 ? 'ifelse' : 'if', r % 2 ? (c % 2 ? 'if3else' : 'if3') : (c % 2 ? 'if2else' : 'if2'), 'place' + cell.rot);
        if (R === 'mirror') { names.push('placeM', 'ifx', 'ify'); if (cell.fx) names.push('fx'); if (cell.fy) names.push('fy'); }
        if (R === 'random') names.push('placeR');
        hl(names);
        this.floorVars(r, c, cell);
        i++;
        this.drawFloor(i);
        App.sound('tick');
        this.ftimer = setTimeout(tick, delay);
      };
      tick();
    },
    evalFloor() {
      const ch = C.floorChallenges[this.floor.fch];
      const msg = $('#floorMsg');
      const tileId = ch.tile || 'arc';
      if (this.floor.tile !== tileId) { msg.className = 'algo-msg'; msg.textContent = '要和目標比較，請用「' + preset(tileId).name + '」這塊磚。'; return; }
      if (this.sameFloor(tileId, this.floor.rule, this.floor.seed, ch.target)) {
        msg.className = 'algo-msg ok';
        const name = r => C.floorRules.find(x => x.id === r).name;
        msg.textContent = this.floor.rule === ch.target
          ? '找到了！規則是「' + name(ch.target) + '」。'
          : '砌出來和目標一模一樣！你用了「' + name(this.floor.rule) + '」，和預設答案「' + name(ch.target) + '」不同：不同的演算法，也可以得到相同的結果。';
        if (!App.P.algo.floorSolved[ch.id]) {
          App.P.algo.floorSolved[ch.id] = true;
          App.sound('ok');
          App.confetti();
          App.save();
        }
        this.renderFloorChallenges();
        this.checkDone();
      } else {
        msg.className = 'algo-msg no';
        msg.textContent = '和目標不一樣。比較一下：目標中哪幾塊磚轉了方向？';
        App.sound('no');
      }
    },
    checkDone() {
      const s = App.P.algo.solved, f = App.P.algo.floorSolved;
      if (s.pin && s.kal && s.bug && Object.keys(f).length >= 1) App.complete(4);
      App.refreshStatus();
    },
    status() {
      const s = App.P.algo.solved, f = App.P.algo.floorSolved;
      const n = ['pin', 'kal', 'bug'].filter(k => s[k]).length;
      if (n < 3) return { done: false, hint: '完成「一塊磚」挑戰 1–3（已完成 ' + n + ' 個）。', todo: '完成演算法挑戰 1–3' };
      if (!Object.keys(f).length) return { done: false, hint: '再完成一個「整個地板」挑戰。', todo: '完成一個地板挑戰' };
      return { done: true, hint: '演算法達人！課次 5 完成。記得下載存檔。' };
    }
  };
  App.steps[4] = S4;
})(window);
