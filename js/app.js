/* ============================================================
 * app.js — 核心：狀態、儲存、導航、提示、音效、開始頁
 * 各步驟的介面在 steps-learn.js（1–4）及 steps-make.js（5–8）
 * ============================================================ */
(function (global) {
  'use strict';
  const C = global.CONTENT, E = global.TileEngine;

  /* ---------- 小工具 ---------- */
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function debounce(fn, ms) {
    let t = null;
    return function () { const a = arguments; clearTimeout(t); t = setTimeout(() => fn.apply(null, a), ms); };
  }
  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  const reducedMotion = () => !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const STORE_KEY = 'hkTileStudio.project.v1';

  const STEPS = [
    { id: 0, name: '開始' },
    { id: 1, name: '認識用家', dt: '同理', ct: '收集資料', lesson: 5, badge: { name: '同理心偵探', icon: '👂' } },
    { id: 2, name: '定義問題', dt: '定義', ct: '抽象化', lesson: 5, badge: { name: '問題定義師', icon: '🎯' } },
    { id: 3, name: '花階磚偵探', dt: '定義', ct: '拆解・模式識別', lesson: 5, badge: { name: '拆解高手', icon: '🔍' } },
    { id: 4, name: '演算法工作坊', dt: '構思', ct: '演算法・迴圈・條件', lesson: 5, badge: { name: '演算法達人', icon: '🔁' } },
    { id: 5, name: '設計花階磚', dt: '構思・原型', ct: '抽象化・演算法', lesson: 6, badge: { name: '花磚設計師', icon: '🎨' } },
    { id: 6, name: '3D 原型', dt: '原型', ct: '數據表示', lesson: 6, badge: { name: '3D 工程師', icon: '🧊' } },
    { id: 7, name: '測試與改良', dt: '測試', ct: '測試・除錯・迭代', lesson: 6, badge: { name: '測試員', icon: '🧪' } },
    { id: 8, name: '作品卡', dt: '分享', ct: '反思', lesson: 6, badge: { name: '發佈者', icon: '🏅' } }
  ];

  /* ---------- 專案狀態 ---------- */
  function newProject() {
    return {
      app: 'hk-tile-studio', v: 1, created: Date.now(), updated: Date.now(),
      student: { cls: '', no: '', name: '' },
      step: 0, done: {},
      persona: null, asked: [], needs: [],
      brief: { product: null, criteria: [], styles: [] },
      detective: { t1: false, t2: false, t3: {} },
      algo: { solved: {}, floorSolved: {} },
      design: E.blankDesign(),
      usedPreset: null, usedRandom: false,
      versions: [], feedback: [],
      changes: [], changeReasons: [],
      learned: [], proud: [], declare: {},
      print: { mode: 'real', filA: 'white', filB: 'red', stlDone: false, checked: false },
      exported: { card: false, json: false }
    };
  }
  function mergeProject(obj) {
    const base = newProject();
    if (!obj || typeof obj !== 'object') return base;
    const out = Object.assign(base, obj);
    ['student', 'brief', 'detective', 'algo', 'print', 'exported'].forEach(k => {
      out[k] = Object.assign(newProject()[k], obj[k] || {});
    });
    out.design = Object.assign(E.blankDesign(), obj.design || {});
    if (!Array.isArray(out.design.shapes)) out.design.shapes = [];
    out.design.shapes.forEach(s => { if (!s.id) s.id = E.newId(); });
    ['asked', 'needs', 'versions', 'feedback', 'changes', 'changeReasons', 'learned', 'proud'].forEach(k => {
      if (!Array.isArray(out[k])) out[k] = [];
    });
    return out;
  }

  const App = {
    C, E, $, $$, esc, clamp, debounce, css, reducedMotion, STEPS,
    P: newProject(),
    steps: {},
    current: 0,
    framed: (function () { try { return global.self !== global.top; } catch (e) { return true; } })()
  };

  /* ---------- 儲存 ---------- */
  function saveLocal() {
    try {
      App.P.updated = Date.now();
      localStorage.setItem(STORE_KEY, JSON.stringify(App.P));
    } catch (e) { /* 私隱模式等情況：忽略 */ }
  }
  App.save = debounce(saveLocal, 350);
  App.saveNow = saveLocal;
  function loadLocal() {
    try {
      const s = localStorage.getItem(STORE_KEY);
      return s ? JSON.parse(s) : null;
    } catch (e) { return null; }
  }
  function clearLocal() { try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ } }

  App.fileBase = function () {
    const s = App.P.student;
    const raw = [s.cls, s.no].join('') + (s.name ? '_' + s.name : '');
    return (raw || '學生').replace(/[\\/:*?"<>|\s]+/g, '');
  };

  App.download = function (name, data, type) {
    const blob = data instanceof Blob ? data : new Blob([data], { type: type || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 2000);
    if (App.framed) App.toast('如果沒有開始下載，請在新分頁或學校網站開啟本工作室。');
  };
  App.downloadCanvas = function (name, canvas) {
    if (canvas.toBlob) canvas.toBlob(b => App.download(name, b, 'image/png'), 'image/png');
  };

  App.exportJSON = function () {
    App.P.exported.json = true;
    App.saveNow();
    App.download(App.fileBase() + '_花階磚存檔.json', JSON.stringify(App.P, null, 1), 'application/json');
    App.refreshStatus();
  };

  App.importJSON = function (file) {
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const obj = JSON.parse(fr.result);
        if (!obj || obj.app !== 'hk-tile-studio') throw new Error('not ours');
        App.P = mergeProject(obj);
        App.saveNow();
        Object.values(App.steps).forEach(s => s.reset && s.reset());
        renderPath();
        updateStudentChip();
        App.toast('已載入 ' + (App.P.student.cls + App.P.student.no) + ' 的存檔。', 'ok');
        App.go(App.P.step && App.P.step > 0 ? App.P.step : 1);
      } catch (e) {
        App.toast('這個檔案不是花階磚存檔，請揀選 .json 存檔。');
      }
    };
    fr.readAsText(file);
  };

  /* ---------- 提示、對話框 ---------- */
  let toastTimer = null;
  App.toast = function (msg, kind) {
    const t = $('#toast');
    t.textContent = msg;
    t.className = 'toast' + (kind ? ' ' + kind : '');
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 3600);
  };

  App.ask = function (title, bodyHTML, okText, cancelText) {
    return new Promise(resolve => {
      const m = $('#modal');
      $('#modalTitle').textContent = title;
      $('#modalBody').innerHTML = bodyHTML || '';
      const ok = $('#modalOk'), cancel = $('#modalCancel');
      ok.textContent = okText || '確定';
      cancel.textContent = cancelText || '取消';
      cancel.hidden = cancelText === false;
      m.hidden = false;
      ok.focus();
      const done = v => {
        m.hidden = true;
        ok.onclick = cancel.onclick = null;
        document.removeEventListener('keydown', onKey);
        resolve(v);
      };
      const onKey = e => { if (e.key === 'Escape') done(false); };
      document.addEventListener('keydown', onKey);
      ok.onclick = () => done(true);
      cancel.onclick = () => done(false);
    });
  };

  /* ---------- 音效（預設關閉） ---------- */
  const Sound = {
    on: false, ctx: null,
    ensure() {
      if (!this.ctx) {
        const AC = global.AudioContext || global.webkitAudioContext;
        if (!AC) return null;
        this.ctx = new AC();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    },
    tone(freq, dur, type, vol, when) {
      const ctx = this.ensure();
      if (!ctx) return;
      const t0 = ctx.currentTime + (when || 0);
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol || 0.08, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(t0); o.stop(t0 + dur + 0.02);
    },
    play(kind) {
      if (!this.on) return;
      switch (kind) {
        case 'pop': this.tone(660, 0.09, 'triangle', 0.06); break;
        case 'tick': this.tone(880, 0.05, 'square', 0.025); break;
        case 'stamp': this.tone(420, 0.07, 'triangle', 0.06); break;
        case 'ok': [523, 659, 784].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.07, i * 0.09)); break;
        case 'no': this.tone(220, 0.18, 'sawtooth', 0.035); break;
        case 'done': [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.07, i * 0.1)); break;
        case 'bell': [880, 660, 880].forEach((f, i) => this.tone(f, 0.35, 'sine', 0.1, i * 0.4)); break;
      }
    }
  };
  App.sound = k => Sound.play(k);
  App.Sound = Sound;

  /* ---------- 彩紙 ---------- */
  App.confetti = function () {
    if (reducedMotion()) return;
    const cv = $('#confetti');
    const g = cv.getContext('2d');
    const W = cv.width = global.innerWidth, H = cv.height = global.innerHeight;
    const cols = C.palette.filter(p => p.key !== 'cream').map(p => p.hex);
    const bits = Array.from({ length: 90 }, () => ({
      x: W / 2 + (Math.random() - 0.5) * W * 0.3, y: H * 0.35,
      vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 12 - 4,
      s: 6 + Math.random() * 8, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
      c: cols[Math.floor(Math.random() * cols.length)]
    }));
    let frame = 0;
    const tick = () => {
      g.clearRect(0, 0, W, H);
      bits.forEach(b => {
        b.vy += 0.45; b.x += b.vx; b.y += b.vy; b.r += b.vr; b.vx *= 0.99;
        g.save(); g.translate(b.x, b.y); g.rotate(b.r);
        g.fillStyle = b.c; g.fillRect(-b.s / 2, -b.s / 2, b.s, b.s);
        g.restore();
      });
      if (++frame < 110) requestAnimationFrame(tick);
      else g.clearRect(0, 0, W, H);
    };
    tick();
  };

  /* ---------- 完成步驟 ---------- */
  App.complete = function (step, quiet) {
    if (App.P.done[step]) { App.refreshStatus(); return; }
    App.P.done[step] = true;
    App.save();
    renderPath();
    App.refreshStatus();
    const b = STEPS[step].badge;
    if (!quiet && b) {
      App.toast('完成！獲得徽章：' + b.icon + ' ' + b.name, 'ok');
      App.sound('done');
      App.confetti();
    }
  };
  App.uncomplete = function (step) {
    if (!App.P.done[step]) return;
    delete App.P.done[step];
    App.save();
    renderPath();
  };

  /* ---------- 導航 ---------- */
  function tileThumb(px) {
    const d = App.P.design && App.P.design.shapes && App.P.design.shapes.length >= 2 && !E.isRoundProduct(App.P.design)
      ? App.P.design
      : C.presets[0].design;
    return E.tileImage(d, px, { texture: 0.06 });
  }

  function renderPath() {
    const nav = $('#path');
    const cur = App.current;
    let html = '';
    STEPS.forEach(s => {
      if (s.id === 0) return;
      if (s.id === 1) html += '<span class="lesson-tag">課次 5</span>';
      if (s.id === 5) html += '<span class="lesson-tag">課次 6</span>';
      const cls = ['path-tile'];
      if (App.P.done[s.id]) cls.push('done');
      if (s.id === cur) cls.push('current');
      html += '<button type="button" class="' + cls.join(' ') + '" data-go="' + s.id + '" title="步驟 ' + s.id + '：' + esc(s.name) + '"' +
        (s.id === cur ? ' aria-current="step"' : '') + '><span>' + s.id + '</span></button>';
    });
    if (cur > 0) html += '<span class="path-current">' + esc(STEPS[cur].name) + '</span>';
    nav.innerHTML = html;
    const doneTiles = $$('.path-tile.done', nav);
    if (doneTiles.length) {
      const img = tileThumb(68);
      doneTiles.forEach(b => {
        const c = document.createElement('canvas');
        c.width = c.height = 68;
        c.getContext('2d').drawImage(img, 0, 0);
        b.insertBefore(c, b.firstChild);
      });
    }
  }
  App.renderPath = renderPath;

  App.go = function (n) {
    n = clamp(n | 0, 0, 8);
    if (n > 0 && !App.P.student.cls) {
      App.toast('請先輸入班別和學號。');
      n = 0;
    }
    const prev = App.current;
    if (App.steps[prev] && App.steps[prev].leave) App.steps[prev].leave();
    $$('#stage > .step').forEach(sec => { sec.hidden = Number(sec.dataset.step) !== n; });
    App.current = n;
    App.P.step = n;
    if (App.steps[n] && App.steps[n].enter) App.steps[n].enter();
    renderPath();
    App.refreshStatus();
    $('#stage').scrollTop = 0;
    if (global.innerWidth < 1000) global.scrollTo(0, 0);
    App.save();
    try { if (history.replaceState) history.replaceState(null, '', n ? '#step' + n : location.pathname + location.search); } catch (e) { /* ignore */ }
  };

  App.refreshStatus = function () {
    const n = App.current;
    const st = App.steps[n] && App.steps[n].status ? App.steps[n].status() : { hint: '' };
    $('#stepHint').textContent = st.hint || '';
    $('#prevBtn').disabled = n === 0;
    const next = $('#nextBtn');
    next.textContent = n === 0 ? '開始' : n === 8 ? '完成' : '下一步';
  };

  function onNext() {
    const n = App.current;
    if (n === 0) { $('#studentForm').requestSubmit(); return; }
    if (n === 8) {
      if (!App.P.done[8]) App.toast('記得下載作品卡和存檔，然後提交給老師。');
      else App.toast('做得好！記得把作品卡和存檔提交給老師。', 'ok');
      return;
    }
    const st = App.steps[n] && App.steps[n].status ? App.steps[n].status() : { done: true };
    if (!st.done && st.todo) App.toast('提示：' + st.todo + '（你可以稍後回來完成）');
    App.go(n + 1);
  }

  /* ---------- 學生資料 ---------- */
  function updateStudentChip() {
    const s = App.P.student;
    const chip = $('#btnStudent');
    if (s.cls) {
      chip.hidden = false;
      chip.textContent = s.cls + (s.no ? '-' + s.no : '') + (s.name ? ' ' + s.name : '');
      chip.title = '修改班別、學號';
    } else chip.hidden = true;
  }

  /* ---------- 開始頁 ---------- */
  const Welcome = {
    anim: null,
    init() {
      $('#studentForm').addEventListener('submit', e => {
        e.preventDefault();
        const cls = $('#stuClass').value.trim().toUpperCase();
        const no = $('#stuNo').value.trim();
        if (!cls || !no) { App.toast('請輸入班別和學號。'); return; }
        App.P.student = { cls, no, name: $('#stuName').value.trim() };
        updateStudentChip();
        App.save();
        App.sound('pop');
        App.go(App.P.step > 0 ? App.P.step : 1);
      });
      $('#resumeBtn').addEventListener('click', () => App.go(App.P.step > 0 ? App.P.step : 1));
      $('#freshBtn').addEventListener('click', () => App.restart());
      this.renderJourney();
      const ro = new ResizeObserver(debounce(() => { if (App.current === 0) this.drawHero(true); }, 120));
      ro.observe($('.hero'));
    },
    enter() {
      const s = App.P.student;
      $('#stuClass').value = s.cls || '';
      $('#stuNo').value = s.no || '';
      $('#stuName').value = s.name || '';
      const box = $('#resumeBox');
      if (s.cls && App.P.step > 0) {
        box.hidden = false;
        $('#resumeText').innerHTML = '歡迎回來，<b>' + esc(s.cls + '-' + s.no) + '</b>！上次做到：步驟 ' + App.P.step + '「' + esc(STEPS[App.P.step].name) + '」。';
        $('#startBtn').textContent = '更新資料並繼續';
      } else {
        box.hidden = true;
        $('#startBtn').textContent = '開始任務';
      }
      this.renderJourney();
      this.drawHero(false);
    },
    leave() { if (this.anim) cancelAnimationFrame(this.anim); },
    status() { return { done: !!App.P.student.cls, hint: '輸入班別和學號，然後按「開始任務」。' }; },
    renderJourney() {
      const col = lesson => {
        const items = STEPS.filter(s => s.lesson === lesson).map(s =>
          '<button type="button" class="journey-item' + (App.P.done[s.id] ? ' done' : '') + '" data-go="' + s.id + '">' +
          '<span class="n">' + s.id + '</span><span><b>' + esc(s.name) + '</b><small>' + esc(s.dt) + '｜' + esc(s.ct) + '</small></span></button>').join('');
        return '<div class="journey-col"><h3>課次 ' + lesson + '（雙連堂 70 分鐘）</h3>' + items + '</div>';
      };
      $('#journey').innerHTML = col(5) + col(6);
    },
    drawHero(still) {
      const cv = $('#heroFloor');
      const box = cv.parentElement;
      const W = Math.round(box.clientWidth), H = Math.round(box.clientHeight);
      if (!W || !H) return;
      const dpr = Math.min(2, global.devicePixelRatio || 1);
      cv.width = W * dpr; cv.height = H * dpr;
      const g = cv.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cols = 5, gap = 3;
      const cell = (W - gap * (cols + 1)) / cols;
      const rows = Math.ceil((H - gap) / (cell + gap));
      const ids = ['redflower', 'bluestar', 'pinwheel', 'scallop'];
      const imgs = {};
      ids.forEach(id => { imgs[id] = E.tileImage(C.presets.find(p => p.id === id).design, Math.ceil(cell * dpr), { texture: 0.12 }); });
      const pick = (r, c) => ids[(Math.floor(r / 2) * 3 + Math.floor(c / 2)) % ids.length];
      const total = rows * cols;
      const start = performance.now();
      const per = 55, dur = 360;
      const grout = css('--grout') || '#CEC8BB';
      const frame = now => {
        g.fillStyle = grout;
        g.fillRect(0, 0, W, H);
        let busy = false;
        for (let i = 0; i < total; i++) {
          const r = Math.floor(i / cols), c = i % cols;
          const t = still || reducedMotion() ? 1 : clamp((now - start - i * per) / dur, 0, 1);
          if (t <= 0) { busy = true; continue; }
          if (t < 1) busy = true;
          const e = 1 - Math.pow(1 - t, 3);
          const x = gap + c * (cell + gap), y = gap + r * (cell + gap);
          g.save();
          g.globalAlpha = e;
          g.translate(x + cell / 2, y + cell / 2 - (1 - e) * 14);
          g.scale(0.9 + 0.1 * e, 0.9 + 0.1 * e);
          g.drawImage(imgs[pick(r, c)], -cell / 2, -cell / 2, cell, cell);
          g.restore();
        }
        if (busy) this.anim = requestAnimationFrame(frame);
      };
      if (this.anim) cancelAnimationFrame(this.anim);
      frame(performance.now());
    }
  };
  App.steps[0] = Welcome;

  App.restart = async function () {
    const ok = await App.ask('重新開始？', '<p>現在的進度會被清除。如果之後還需要，請先按「取消」，再從「存檔」選單下載存檔。</p>', '清除並重新開始', '取消');
    if (!ok) return;
    const stu = App.P.student;
    App.P = newProject();
    App.P.student = stu;
    clearLocal();
    App.saveNow();
    Object.values(App.steps).forEach(s => s.reset && s.reset());
    renderPath();
    App.go(stu.cls ? 1 : 0);
  };

  /* ---------- 共用：用家、需要 ---------- */
  App.persona = () => C.personas.find(p => p.id === App.P.persona) || null;
  App.needInfo = id => C.needs[id] || { label: id, icon: '•', desc: '' };

  // 自動檢查設計準則：回傳 { state: 'pass'|'part'|'fail'|'peer', note }
  App.checkNeed = function (id, design, model) {
    const d = design || App.P.design;
    const info = App.needInfo(id);
    const prod = C.products[d.product] || C.products.coaster;
    const levels = E.usedColors(d).map(k => E.levelOf(d, k));
    const maxLv = Math.max.apply(null, levels.concat([0]));
    const est = model ? model.estimate : null;
    switch (info.auto) {
      case 'contrast': {
        const r = E.bestContrast(d);
        return { state: r >= 4.5 ? 'pass' : r >= 3 ? 'part' : 'fail', note: '對比度 ' + r.toFixed(1) + '（4.5 以上最好）' };
      }
      case 'simple': {
        const n = d.shapes.length, small = d.shapes.filter(s => s.size < 10).length;
        return { state: n <= 6 && !small ? 'pass' : n <= 9 ? 'part' : 'fail', note: n + ' 個形狀' + (small ? '，' + small + ' 個太細' : '') + '（6 個以內、不太細最好）' };
      }
      case 'bright': {
        const vivid = new Set(d.shapes.map(s => s.color).filter(k => E.saturation(E.colorHex(k)) > 0.35));
        return { state: vivid.size >= 2 ? 'pass' : vivid.size === 1 ? 'part' : 'fail', note: '用了 ' + vivid.size + ' 種鮮明顏色' };
      }
      case 'large':
        return { state: prod.size >= 70 ? 'pass' : 'fail', note: prod.name + '（' + prod.size + ' mm）' };
      case 'small':
        return { state: prod.size <= 45 ? 'pass' : prod.size <= 60 ? 'part' : 'fail', note: prod.name + '（' + prod.size + ' mm）' };
      case 'keyring':
        return { state: prod.tab ? 'pass' : 'fail', note: prod.tab ? prod.name + '有掛孔' : '這款沒有掛孔' };
      case 'rounded': {
        const ok = prod.outline === 'circle' || d.rounded;
        return { state: ok ? 'pass' : 'fail', note: ok ? '邊角圓滑' : '可在 3D 原型頁開啟「圓角」' };
      }
      case 'tactile':
        return { state: maxLv >= 2 ? 'pass' : maxLv === 1 ? 'part' : 'fail', note: maxLv >= 2 ? '有「高」凸起' : '把主要顏色設為「高」' };
      case 'clean':
        return { state: maxLv <= 1 ? 'pass' : 'part', note: maxLv <= 1 ? '凸起不高' : '有「高」凸起，較難清潔' };
      case 'limitedColors': {
        const n = E.usedColors(d).length;
        return { state: n <= 3 ? 'pass' : n === 4 ? 'part' : 'fail', note: '共 ' + n + ' 種顏色（連背景）' };
      }
      case 'tileable': {
        if (prod.outline === 'circle') return { state: 'fail', note: '圓形不能拼成地板' };
        const edge = E.touchesEdge(d);
        return { state: edge ? 'pass' : 'part', note: edge ? '圖案碰到磚邊，拼起來會連接' : '把圖案放到磚邊或角落，拼起來會更連貫' };
      }
      case 'quickprint': {
        const e = est || TileMesh_estimateFor(d);
        const m = Math.round((e.minMinutes + e.maxMinutes) / 2);
        return { state: m <= 15 ? 'pass' : m <= 30 ? 'part' : 'fail', note: '約 ' + e.minMinutes + '–' + e.maxMinutes + ' 分鐘' };
      }
      default:
        return { state: 'peer', note: '請同學（扮演用家）判斷' };
    }
  };
  // 不建立 3D 模型時的粗略估算
  function TileMesh_estimateFor(d) {
    const prod = C.products[d.product] || C.products.coaster;
    const area = prod.outline === 'circle' ? Math.PI * Math.pow(prod.size / 2, 2) : prod.size * prod.size;
    const vol = area * prod.base + area * 0.35 * prod.step;
    return global.TileMesh.estimate(vol, prod.base + prod.step);
  }
  App.stateIcon = st => ({ pass: '✓', part: '~', fail: '✗', peer: '?' }[st] || '?');

  /* ---------- 啟動 ---------- */
  App.boot = function () {
    const saved = loadLocal();
    if (saved && saved.app === 'hk-tile-studio') App.P = mergeProject(saved);
    Sound.on = !!(C.options && C.options.sound);
    if (App.framed) $('#frameNote').hidden = false;

    // 品牌小磚
    const bt = $('#brandTile');
    bt.getContext('2d').drawImage(E.tileImage(C.presets[0].design, 80, { texture: 0.08 }), 0, 0);

    // 事件
    document.addEventListener('click', e => {
      const g = e.target.closest('[data-go]');
      if (g && !g.disabled) { App.go(Number(g.dataset.go)); }
    });
    $('#prevBtn').addEventListener('click', () => App.go(App.current - 1));
    $('#nextBtn').addEventListener('click', onNext);
    $('#btnStudent').addEventListener('click', () => App.go(0));
    const sb = $('#btnSound');
    const syncSound = () => { sb.setAttribute('aria-pressed', String(Sound.on)); sb.title = '音效：' + (Sound.on ? '開' : '關'); };
    syncSound();
    sb.addEventListener('click', () => { Sound.on = !Sound.on; syncSound(); if (Sound.on) App.sound('ok'); });
    const fm = $('#fileMenu'), fb = $('#btnFile');
    const closeMenu = () => { fm.hidden = true; fb.setAttribute('aria-expanded', 'false'); };
    fb.addEventListener('click', e => {
      e.stopPropagation();
      fm.hidden = !fm.hidden;
      fb.setAttribute('aria-expanded', String(!fm.hidden));
    });
    document.addEventListener('click', e => { if (!fm.hidden && !e.target.closest('.menu-wrap')) closeMenu(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
    fm.addEventListener('click', e => {
      const b = e.target.closest('button[data-act]');
      if (!b) return;
      closeMenu();
      if (b.dataset.act === 'save-json') App.exportJSON();
      if (b.dataset.act === 'restart') App.restart();
    });
    $('#loadJson').addEventListener('change', e => {
      const f = e.target.files && e.target.files[0];
      closeMenu();
      if (f) App.importJSON(f);
      e.target.value = '';
    });
    $('#btnTeacher').addEventListener('click', () => App.teacher && App.teacher.open());

    // 各步驟初始化
    Object.keys(App.steps).forEach(k => { if (App.steps[k].init) App.steps[k].init(); });
    updateStudentChip();

    // 主題改變時重畫
    const mq = global.matchMedia ? global.matchMedia('(prefers-color-scheme: dark)') : null;
    const rethemed = () => { const s = App.steps[App.current]; if (s && s.retheme) s.retheme(); };
    if (mq && mq.addEventListener) mq.addEventListener('change', rethemed);
    new MutationObserver(rethemed).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    let start = 0;
    const m = /^#step([1-8])$/.exec(location.hash || '');
    if (m && App.P.student.cls) start = Number(m[1]);
    App.go(start);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { const s = App.steps[App.current]; if (s && s.retheme) s.retheme(); });
  };

  global.App = App;
})(window);
