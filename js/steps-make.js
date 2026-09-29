/* ============================================================
 * steps-make.js — 課次 6：步驟 5–8
 * 5 設計花階磚  6 3D 原型  7 測試與改良  8 作品卡
 * ============================================================ */
(function (global) {
  'use strict';
  const App = global.App, C = App.C, E = App.E, M = global.TileMesh;
  const { $, $$, esc, css, clamp } = App;
  const DEG = Math.PI / 180;
  const fitCanvas = (cv, fb) => App.fitCanvas(cv, fb);
  const design = () => App.P.design;

  // 形狀在單位座標的大約範圍（用來放控制點）
  const EXTENT = {
    circle: [1, 1], ring: [1, 1], petal: [0.62, 1], leaf: [0.5, 1], flower: [1, 1], heart: [1, 0.95],
    star4: [1, 1], star8: [1, 1], diamond: [0.62, 1], square: [0.72, 0.72], triangle: [0.87, 1],
    cross: [1, 1], semicircle: [1, 0.5], arch: [1, 0.5], bar: [0.12, 1]
  };

  function smallIcon(drawFn, px) {
    const c = document.createElement('canvas');
    const dpr = 2;
    c.width = c.height = px * dpr;
    const g = c.getContext('2d');
    g.setTransform(dpr * px / 200, 0, 0, dpr * px / 200, dpr * px / 2, dpr * px / 2);
    drawFn(g);
    return c;
  }

  /* ======================= 步驟 5：設計花階磚 ======================= */
  const S5 = {
    sel: null,          // 已選形狀的 id
    activeT: 0,         // 被點中的是哪一個複本
    color: 'red',       // 新形狀的顏色
    hist: [], hIdx: -1,
    init() {
      // 形狀庫
      $('#shapeGrid').innerHTML = E.SHAPE_LIST.map(s =>
        '<button type="button" class="shape-btn" data-shape="' + s.type + '" title="' + esc(s.name) + '"><span class="sr">' + esc(s.name) + '</span></button>').join('');
      $$('#shapeGrid .shape-btn').forEach(b => {
        const type = b.dataset.shape;
        b.appendChild(smallIcon(g => {
          g.fillStyle = css('--ink-2') || '#4B5751';
          const s = { type, x: 0, y: 0, size: type === 'bar' ? 80 : 78, sx: type === 'bar' ? 1.6 : 1, rot: type === 'bar' ? 45 : 0 };
          E.drawShape(g, s, null);
        }, 32));
      });
      $('#shapeGrid').addEventListener('click', e => {
        const b = e.target.closest('[data-shape]');
        if (b) this.addShape(b.dataset.shape);
      });
      $('#bgSwatches').addEventListener('click', e => {
        const b = e.target.closest('[data-color]');
        if (!b) return;
        design().bg = b.dataset.color;
        this.commit();
      });
      $('#symList').addEventListener('click', e => {
        const b = e.target.closest('[data-sym]');
        if (!b || b.disabled) return;
        const s = C.symmetries.find(x => x.id === b.dataset.sym);
        design().algo = { n: s.n, mirror: s.mirror };
        this.activeT = 0;
        App.sound('tick');
        this.commit();
      });
      $('#presetRow').addEventListener('click', e => {
        const b = e.target.closest('[data-preset]');
        if (b) this.loadPreset(b.dataset.preset);
      });
      $('#btnRandom').addEventListener('click', () => this.randomize());
      $('#btnUndo').addEventListener('click', () => this.undo());
      $('#btnRedo').addEventListener('click', () => this.redo());
      $('#btnClear').addEventListener('click', () => this.clearAll());
      $('#optGuide').addEventListener('change', () => this.render());
      $('#edFloorRule').innerHTML = C.floorRules.map(r => '<option value="' + r.id + '">' + esc(r.name) + '</option>').join('');
      $('#edFloorRule').addEventListener('change', e => { design().floorRule = e.target.value; App.save(); this.renderFloor(); });
      $('#btnSaveVersion').addEventListener('click', () => this.saveVersion());
      $('#inspector').addEventListener('input', e => this.onInspector(e, false));
      $('#inspector').addEventListener('change', e => this.onInspector(e, true));
      $('#inspector').addEventListener('click', e => this.onInspectorClick(e));
      this.bindCanvas();
      const ro = new ResizeObserver(App.debounce(() => { if (App.current === 5) this.layout(); }, 60));
      ro.observe($('#editorBox'));
      document.addEventListener('keydown', e => this.onKey(e));
    },
    reset() { this.sel = null; this.hist = []; this.hIdx = -1; },
    enter() {
      if (!this.hist.length) this.pushHist();
      this.renderPanels();
      this.layout();
    },
    leave() { this.dragging = null; },
    retheme() { this.renderPanels(); this.render(); },

    /* ---- 歷史（復原／重做） ---- */
    pushHist() {
      const s = JSON.stringify(design());
      if (this.hist[this.hIdx] === s) return;
      this.hist = this.hist.slice(0, this.hIdx + 1);
      this.hist.push(s);
      if (this.hist.length > 80) this.hist.shift();
      this.hIdx = this.hist.length - 1;
      this.syncUndo();
    },
    syncUndo() {
      $('#btnUndo').disabled = this.hIdx <= 0;
      $('#btnRedo').disabled = this.hIdx >= this.hist.length - 1;
    },
    restore(s) {
      const d = JSON.parse(s);
      App.P.design = d;
      if (this.sel && !d.shapes.some(x => x.id === this.sel)) this.sel = null;
      this.syncUndo();
      this.afterChange(true);
    },
    undo() { if (this.hIdx > 0) { this.hIdx--; this.restore(this.hist[this.hIdx]); App.sound('tick'); } },
    redo() { if (this.hIdx < this.hist.length - 1) { this.hIdx++; this.restore(this.hist[this.hIdx]); App.sound('tick'); } },
    commit() { this.pushHist(); this.afterChange(true); },
    afterChange(panels) {
      App.save();
      if (panels) this.renderPanels(); else { this.renderInspector(); this.renderCriteria(); this.renderStatus(); }
      this.renderFloor();
      this.render();
      this.checkDone();
    },

    /* ---- 版面 ---- */
    layout() {
      const box = $('#editorBox');
      const cv = $('#editorCanvas');
      const narrow = global.innerWidth < 1000;
      const size = Math.floor(narrow ? Math.min(box.clientWidth, 560) : Math.max(260, Math.min(box.clientWidth, box.clientHeight)));
      if (!size) return;
      const dpr = Math.min(2, global.devicePixelRatio || 1);
      cv.style.width = size + 'px';
      cv.style.height = size + 'px';
      cv.width = Math.round(size * dpr);
      cv.height = Math.round(size * dpr);
      this.size = size;
      this.dpr = dpr;
      this.pad = 18;
      this.scale = (size - this.pad * 2) / 200;
      this.render();
    },
    toDesign(e) {
      const r = $('#editorCanvas').getBoundingClientRect();
      return { x: (e.clientX - r.left - this.size / 2) / this.scale, y: (e.clientY - r.top - this.size / 2) / this.scale };
    },

    /* ---- 繪畫 ---- */
    render() {
      const cv = $('#editorCanvas');
      if (!this.size) return;
      const g = cv.getContext('2d');
      const d = design();
      const k = this.dpr * this.scale;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, cv.width, cv.height);
      g.setTransform(k, 0, 0, k, cv.width / 2, cv.height / 2);
      // 陰影
      g.save();
      g.shadowColor = 'rgba(0,0,0,0.18)';
      g.shadowBlur = 14 * this.dpr;
      g.shadowOffsetY = 4 * this.dpr;
      g.fillStyle = E.colorHex(d.bg);
      g.fill(E.clipPathFor(d));
      g.restore();
      E.renderTile(g, d, { texture: 0.06 });
      if ($('#optGuide').checked) this.drawGuides(g, d);
      this.drawSelection(g, d);
    },
    drawGuides(g, d) {
      const algo = E.algoFor(d);
      const w = E.wedgeAngles(algo);
      const lw = 1 / this.scale;
      const accent = css('--accent') || '#1E5B47';
      g.save();
      g.clip(E.clipPathFor(d));
      // 基本區域
      if (algo.n > 1 || algo.mirror) {
        g.beginPath();
        g.moveTo(0, 0);
        g.arc(0, 0, 160, w.start * DEG, (w.start + w.span) * DEG);
        g.closePath();
        g.fillStyle = 'rgba(30, 91, 71, 0.10)';
        g.fill();
        g.lineWidth = 2 * lw;
        g.strokeStyle = accent;
        g.setLineDash([6 * lw, 4 * lw]);
        g.stroke();
      }
      // 其他對稱軸
      g.setLineDash([3 * lw, 5 * lw]);
      g.lineWidth = lw;
      g.strokeStyle = 'rgba(40, 40, 40, 0.35)';
      const step = algo.mirror ? 180 / algo.n : 360 / algo.n;
      if (algo.n > 1 || algo.mirror) {
        for (let a = 0; a < 360; a += step) {
          g.beginPath();
          g.moveTo(0, 0);
          g.lineTo(Math.cos((w.start + a) * DEG) * 160, Math.sin((w.start + a) * DEG) * 160);
          g.stroke();
        }
      }
      g.restore();
    },
    shapeOutline(g, s, T, lwPx, color, dash) {
      const Mx = E.shapeMatrix(s);
      g.save();
      g.transform(T.a, T.b, T.c, T.d, 0, 0);
      g.transform(Mx.a, Mx.b, Mx.c, Mx.d, Mx.e, Mx.f);
      g.lineWidth = lwPx / (this.scale * s.size * Math.max(0.5, Math.min(1, s.sx || 1)));
      g.strokeStyle = color;
      if (dash) g.setLineDash([4 / (this.scale * s.size), 3 / (this.scale * s.size)]);
      g.stroke(E.shapePath(s.type));
      g.restore();
    },
    handles(s, T) {
      const c = E.applyT(T, s.x, s.y);
      const r = s.rot * DEG;
      const loc = (ux, uy) => {
        const x = ux * Math.cos(r) - uy * Math.sin(r), y = ux * Math.sin(r) + uy * Math.cos(r);
        return E.applyT(T, x, y);
      };
      const ext = EXTENT[s.type] || [1, 1];
      const lim = 100 + (this.pad - 8) / this.scale;
      const cl = p => ({ x: clamp(p.x, -lim, lim), y: clamp(p.y, -lim, lim) });
      const up = loc(0, -1);
      const off = s.size * ext[1] + 20 / this.scale;
      let rot = { x: c.x + up.x * off, y: c.y + up.y * off };
      if (Math.abs(rot.x) > lim || Math.abs(rot.y) > lim) rot = { x: c.x - up.x * off, y: c.y - up.y * off };
      const corner = loc(ext[0] * s.size * (s.sx || 1) + 8 / this.scale, ext[1] * s.size + 8 / this.scale);
      return { c, rot: cl(rot), size: cl({ x: c.x + corner.x, y: c.y + corner.y }) };
    },
    drawSelection(g, d) {
      const accent = css('--accent') || '#1E5B47';
      const sun = css('--sun') || '#C98E1F';
      const Ts = E.symTransforms(E.algoFor(d));
      if (this.hover != null && this.hover !== this.sel) {
        const s = d.shapes.find(x => x.id === this.hover);
        if (s) Ts.forEach(T => this.shapeOutline(g, s, T, 1.5, 'rgba(255,255,255,0.9)'));
      }
      const s = d.shapes.find(x => x.id === this.sel);
      if (!s) return;
      Ts.forEach(T => this.shapeOutline(g, s, T, 1.5, sun, true));
      const T = Ts[this.activeT] || Ts[0];
      this.shapeOutline(g, s, T, 3, accent);
      const h = this.handles(s, T);
      const px = 1 / this.scale;
      g.save();
      g.lineWidth = 1.5 * px;
      g.strokeStyle = accent;
      g.beginPath(); g.moveTo(h.c.x, h.c.y); g.lineTo(h.rot.x, h.rot.y); g.stroke();
      const dot = (p, fill, r) => { g.beginPath(); g.arc(p.x, p.y, r * px, 0, Math.PI * 2); g.fillStyle = fill; g.fill(); g.lineWidth = 2 * px; g.strokeStyle = '#fff'; g.stroke(); };
      dot(h.rot, accent, 8);
      // 旋轉符號
      g.strokeStyle = '#fff'; g.lineWidth = 1.6 * px;
      g.beginPath(); g.arc(h.rot.x, h.rot.y, 4 * px, -0.3, Math.PI * 1.4); g.stroke();
      g.fillStyle = accent;
      g.fillRect(h.size.x - 7 * px, h.size.y - 7 * px, 14 * px, 14 * px);
      g.strokeStyle = '#fff'; g.lineWidth = 2 * px;
      g.strokeRect(h.size.x - 7 * px, h.size.y - 7 * px, 14 * px, 14 * px);
      dot(h.c, sun, 3.5);
      g.restore();
    },

    /* ---- 滑鼠／觸控 ---- */
    bindCanvas() {
      const cv = $('#editorCanvas');
      let raf = 0;
      const redraw = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; this.render(); }); };
      cv.addEventListener('pointerdown', e => {
        cv.focus({ preventScroll: true });
        const d = design();
        const p = this.toDesign(e);
        const hitR = 13 / this.scale;
        const s = d.shapes.find(x => x.id === this.sel);
        if (s) {
          const Ts = E.symTransforms(E.algoFor(d));
          const T = Ts[this.activeT] || Ts[0];
          const h = this.handles(s, T);
          if (Math.hypot(p.x - h.rot.x, p.y - h.rot.y) < hitR) { this.startDrag(e, 'rotate', s, T); return; }
          if (Math.hypot(p.x - h.size.x, p.y - h.size.y) < hitR) {
            this.startDrag(e, 'resize', s, T, { d0: Math.hypot(h.size.x - h.c.x, h.size.y - h.c.y), s0: s.size });
            return;
          }
        }
        const hit = E.hitTest(d, p.x, p.y, 7 / this.scale);
        if (hit) {
          const sh = d.shapes[hit.index];
          this.sel = sh.id;
          const Ts = E.symTransforms(E.algoFor(d));
          this.activeT = Math.max(0, Ts.findIndex(T => T.i === hit.T.i && T.m === hit.T.m));
          const c = E.applyT(hit.T, sh.x, sh.y);
          this.startDrag(e, 'move', sh, hit.T, { ox: p.x - c.x, oy: p.y - c.y });
          this.color = sh.color;
          this.renderInspector();
          App.sound('tick');
        } else {
          this.sel = null;
          this.renderInspector();
        }
        this.render();
      });
      cv.addEventListener('pointermove', e => {
        const d = design();
        const p = this.toDesign(e);
        const dr = this.dragging;
        if (!dr) {
          const hit = E.hitTest(d, p.x, p.y, 5 / this.scale);
          const id = hit ? d.shapes[hit.index].id : null;
          if (id !== this.hover) { this.hover = id; cv.classList.toggle('grab', !!id); redraw(); }
          return;
        }
        const s = dr.shape;
        const inv = E.invT(dr.T);
        const snap = $('#optSnap').checked && !e.altKey;
        if (dr.kind === 'move') {
          const q = E.applyT(inv, p.x - dr.ox, p.y - dr.oy);
          const lim = 130;
          let x = clamp(q.x, -lim, lim), y = clamp(q.y, -lim, lim);
          if (snap) { const sp = E.snapPoint(d, x, y, 5); x = sp.x; y = sp.y; }
          s.x = Math.round(x * 10) / 10;
          s.y = Math.round(y * 10) / 10;
        } else if (dr.kind === 'rotate') {
          const c = E.applyT(dr.T, s.x, s.y);
          const u = E.applyT(inv, p.x - c.x, p.y - c.y);
          let deg = Math.atan2(u.x, -u.y) / DEG;
          if (snap) deg = Math.round(deg / 15) * 15;
          s.rot = Math.round(((deg + 540) % 360) - 180);
        } else if (dr.kind === 'resize') {
          const c = E.applyT(dr.T, s.x, s.y);
          const dist = Math.hypot(p.x - c.x, p.y - c.y);
          s.size = clamp(Math.round(dr.s0 * dist / Math.max(1, dr.d0)), 3, 120);
        }
        dr.moved = true;
        this.renderInspectorValues();
        redraw();
      });
      const end = () => {
        const dr = this.dragging;
        if (!dr) return;
        this.dragging = null;
        cv.classList.remove('grabbing');
        if (dr.moved) { this.pushHist(); this.afterChange(false); }
      };
      cv.addEventListener('pointerup', end);
      cv.addEventListener('pointercancel', end);
      cv.addEventListener('pointerleave', () => { if (this.hover && !this.dragging) { this.hover = null; redraw(); } });
      cv.addEventListener('wheel', e => {
        const s = design().shapes.find(x => x.id === this.sel);
        if (!s) return;
        e.preventDefault();
        if (e.shiftKey) s.rot = Math.round(((s.rot + (e.deltaY > 0 ? 15 : -15) + 540) % 360) - 180);
        else s.size = clamp(s.size + (e.deltaY > 0 ? -1 : 1), 3, 120);
        this.renderInspectorValues();
        this.render();
        clearTimeout(this.wheelT);
        this.wheelT = setTimeout(() => { this.pushHist(); this.afterChange(false); }, 400);
      }, { passive: false });
    },
    startDrag(e, kind, shape, T, extra) {
      const cv = $('#editorCanvas');
      try { cv.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      this.dragging = Object.assign({ kind, shape, T, moved: false }, extra || {});
      cv.classList.add('grabbing');
    },
    onKey(e) {
      if (App.current !== 5) return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); if (e.shiftKey) this.redo(); else this.undo(); return; }
      if (ctrl && (e.key === 'y' || e.key === 'Y')) { e.preventDefault(); this.redo(); return; }
      const s = design().shapes.find(x => x.id === this.sel);
      if (!s) return;
      const stepPx = e.shiftKey ? 5 : 1;
      let handled = true;
      switch (e.key) {
        case 'ArrowLeft': s.x -= stepPx; break;
        case 'ArrowRight': s.x += stepPx; break;
        case 'ArrowUp': s.y -= stepPx; break;
        case 'ArrowDown': s.y += stepPx; break;
        case 'Delete': case 'Backspace': this.deleteSel(); return;
        case '[': s.rot = Math.round(((s.rot - 15 + 540) % 360) - 180); break;
        case ']': s.rot = Math.round(((s.rot + 15 + 540) % 360) - 180); break;
        case '+': case '=': s.size = clamp(s.size + 2, 3, 120); break;
        case '-': s.size = clamp(s.size - 2, 3, 120); break;
        case 'Escape': this.sel = null; this.renderInspector(); break;
        default:
          if (ctrl && (e.key === 'd' || e.key === 'D')) { this.duplicate(); } else handled = false;
      }
      if (!handled) return;
      e.preventDefault();
      clearTimeout(this.keyT);
      this.renderInspectorValues();
      this.render();
      this.keyT = setTimeout(() => { this.pushHist(); this.afterChange(false); }, 350);
    },

    /* ---- 加入、刪除、複製 ---- */
    newPos() {
      const d = design();
      const w = E.wedgeAngles(E.algoFor(d));
      const n = d.shapes.length;
      const a = (w.start + w.span * (0.3 + 0.2 * (n % 3))) * DEG;
      const r = 40 + (n % 4) * 9;
      return { x: Math.round(Math.cos(a) * r), y: Math.round(Math.sin(a) * r) };
    },
    addShape(type) {
      const d = design();
      let color = this.color;
      if (color === d.bg) color = C.palette.map(p => p.key).find(k => k !== d.bg && E.contrastRatio(E.colorHex(k), E.colorHex(d.bg)) > 2.5) || 'red';
      const p = this.newPos();
      const s = E.makeShape(type, p.x, p.y, color);
      if (type === 'bar') { s.rot = 90; s.x = 0; s.y = -88; s.size = 100; s.sx = 0.22; }
      if (type === 'petal' || type === 'leaf' || type === 'heart' || type === 'triangle') {
        // 讓尖端向外
        s.rot = Math.round((Math.atan2(p.y, p.x) / DEG + 90) / 15) * 15;
      }
      d.shapes.push(s);
      this.sel = s.id;
      this.activeT = 0;
      App.sound('pop');
      this.commit();
    },
    deleteSel() {
      const d = design();
      d.shapes = d.shapes.filter(x => x.id !== this.sel);
      this.sel = null;
      App.sound('tick');
      this.commit();
    },
    duplicate() {
      const d = design();
      const s = d.shapes.find(x => x.id === this.sel);
      if (!s) return;
      const c = Object.assign({}, s, { id: E.newId(), x: s.x + 8, y: s.y + 8 });
      d.shapes.push(c);
      this.sel = c.id;
      App.sound('pop');
      this.commit();
    },
    async loadPreset(id) {
      const pr = C.presets.find(p => p.id === id);
      if (!pr) return;
      if (design().shapes.length) {
        const ok = await App.ask('使用範例「' + pr.name + '」？', '<p>範例會取代畫布上現有的圖案（可以按「復原」返回）。之後記得加入你自己的改動！</p>', '使用範例', '取消');
        if (!ok) return;
      }
      const d = design();
      const src = E.cloneDesign(pr.design);
      d.bg = src.bg;
      d.algo = src.algo;
      d.shapes = src.shapes.map(s => Object.assign({}, s, { id: E.newId() }));
      d.floorRule = src.floorRule || 'same';
      d.heights = {};
      if (E.isRoundProduct(src) !== E.isRoundProduct(d)) d.product = src.product;
      App.P.usedPreset = pr.name;
      this.sel = null;
      App.sound('pop');
      this.commit();
    },
    async randomize() {
      if (C.options && C.options.allowRandom === false) { App.toast('老師已關閉隨機靈感。'); return; }
      if (design().shapes.length) {
        const ok = await App.ask('產生隨機靈感？', '<p>電腦會按你現在的對稱方法，隨機產生一塊磚，取代畫布上的圖案（可以按「復原」返回）。作品卡上會註明你用了靈感產生器。</p>', '產生', '取消');
        if (!ok) return;
      }
      const d = design();
      const r = E.randomDesign(Date.now(), { product: d.product, algo: d.algo, rounded: d.rounded });
      d.bg = r.bg;
      d.shapes = r.shapes;
      d.heights = {};
      App.P.usedRandom = true;
      this.sel = null;
      App.sound('ok');
      this.commit();
    },
    async clearAll() {
      if (!design().shapes.length) return;
      const ok = await App.ask('清除全部形狀？', '<p>可以按「復原」返回。</p>', '清除', '取消');
      if (!ok) return;
      design().shapes = [];
      this.sel = null;
      this.commit();
    },

    /* ---- 側邊面板 ---- */
    renderPanels() {
      const d = design();
      // 背景
      $('#bgSwatches').innerHTML = C.palette.map(p =>
        '<button type="button" class="swatch" data-color="' + p.key + '" style="background:' + p.hex + '" aria-pressed="' + (d.bg === p.key) + '" title="' + esc(p.name) + '"><span class="sr">' + esc(p.name) + '</span></button>').join('');
      // 對稱
      const round = E.isRoundProduct(d);
      const cur = C.symmetries.find(s => s.n === (d.algo.n || 1) && !!s.mirror === !!d.algo.mirror);
      $('#symList').innerHTML = C.symmetries.filter(s => round || !s.roundOnly).map(s =>
        '<button type="button" class="sym-opt" data-sym="' + s.id + '" aria-pressed="' + (cur && cur.id === s.id) + '"><span class="si"></span>' +
        '<span><b>' + esc(s.name) + '（' + esc(s.parts) + '）</b><small>' + esc(s.hint) + '</small></span></button>').join('');
      $$('#symList .sym-opt').forEach(b => {
        const s = C.symmetries.find(x => x.id === b.dataset.sym);
        b.querySelector('.si').appendChild(smallIcon(g => {
          const motif = { bg: 'cream', algo: { n: s.n, mirror: s.mirror }, product: round ? 'round' : 'coaster', shapes: [
            { type: 'petal', x: 20, y: -52, size: 34, sx: 0.8, rot: 20, color: 'red' },
            { type: 'circle', x: 46, y: -24, size: 12, sx: 1, rot: 0, color: 'green' }
          ] };
          E.renderTile(g, motif, {});
        }, 38));
      });
      // 範例
      const presets = C.presets.filter(p => round ? E.isRoundProduct(p.design) || p.design.algo.n === 4 : !E.isRoundProduct(p.design));
      $('#presetRow').innerHTML = presets.map(p => '<button type="button" class="preset-btn" data-preset="' + p.id + '" title="' + esc(p.name) + '"><span class="pv"></span>' + esc(p.name) + '</button>').join('');
      $$('#presetRow .preset-btn').forEach(b => {
        const pr = C.presets.find(x => x.id === b.dataset.preset);
        const img = E.tileImage(pr.design, 120, { texture: 0.06 });
        b.querySelector('.pv').replaceWith(img);
      });
      $('#btnRandom').hidden = !!(C.options && C.options.allowRandom === false);
      $('#edFloorRule').value = d.floorRule || 'same';
      this.renderInspector();
      this.renderCriteria();
      this.renderFeedbackPanel();
      this.renderVersions();
      this.renderStatus();
      this.renderFloor();
      this.syncUndo();
    },
    renderInspector() {
      const d = design();
      const s = d.shapes.find(x => x.id === this.sel);
      const host = $('#inspector');
      const used = new Set(E.usedColors(d));
      const sw = (active, attr) => C.palette.map(p =>
        '<button type="button" class="swatch" ' + attr + '="' + p.key + '" style="background:' + p.hex + '" aria-pressed="' + (active === p.key) + '" title="' + esc(p.name) + (used.has(p.key) ? '（已使用）' : '') + '"><span class="sr">' + esc(p.name) + '</span></button>').join('');
      if (!s) {
        host.innerHTML = '<h3>形狀設定</h3><div class="insp-empty">' +
          '<p>點選畫布上的形狀即可修改。拖曳 <b>●</b> 可旋轉，拖曳 <b>■</b> 可放大縮小。</p>' +
          '<p class="small">新形狀的顏色：</p><div class="swatches">' + sw(this.color, 'data-newcolor') + '</div>' +
          '<p class="small muted">鍵盤：方向鍵移動、<kbd>Delete</kbd> 刪除、<kbd>Ctrl</kbd>+<kbd>Z</kbd> 復原、<kbd>[</kbd> <kbd>]</kbd> 旋轉</p></div>';
        return;
      }
      const name = (E.SHAPE_INFO[s.type] || {}).name || s.type;
      host.innerHTML =
        '<h3>已選：' + esc(name) + ' <button type="button" class="btn ghost small" data-act="deselect">完成</button></h3>' +
        '<div class="swatches">' + sw(s.color, 'data-shapecolor') + '</div>' +
        '<div class="insp-grid">' +
        '<label for="inSize">大小</label><input type="range" id="inSize" min="3" max="120" step="1" value="' + s.size + '"><output id="outSize">' + Math.round(s.size) + '</output>' +
        '<label for="inSx">闊窄</label><input type="range" id="inSx" min="0.2" max="3" step="0.05" value="' + (s.sx || 1) + '"><output id="outSx">' + (s.sx || 1).toFixed(2) + '</output>' +
        '<label for="inRot">角度</label><input type="range" id="inRot" min="-180" max="180" step="1" value="' + s.rot + '"><output id="outRot">' + Math.round(s.rot) + '°</output>' +
        '</div>' +
        '<div class="insp-actions">' +
        '<button type="button" class="btn" data-act="rotL">↺ 15°</button><button type="button" class="btn" data-act="rotR">↻ 15°</button><button type="button" class="btn" data-act="dup">複製</button>' +
        '<button type="button" class="btn" data-act="up">移上一層</button><button type="button" class="btn" data-act="down">移下一層</button><button type="button" class="btn" data-act="del">刪除</button>' +
        '</div><p class="small muted" id="outPos">位置：x = ' + Math.round(s.x) + '，y = ' + Math.round(-s.y) + '</p>';
    },
    renderInspectorValues() {
      const s = design().shapes.find(x => x.id === this.sel);
      if (!s || !$('#inSize')) return;
      $('#inSize').value = s.size; $('#outSize').textContent = Math.round(s.size);
      $('#inSx').value = s.sx || 1; $('#outSx').textContent = (s.sx || 1).toFixed(2);
      $('#inRot').value = s.rot; $('#outRot').textContent = Math.round(s.rot) + '°';
      $('#outPos').textContent = '位置：x = ' + Math.round(s.x) + '，y = ' + Math.round(-s.y);
    },
    onInspector(e, final) {
      const s = design().shapes.find(x => x.id === this.sel);
      if (!s) return;
      const v = parseFloat(e.target.value);
      if (e.target.id === 'inSize') s.size = v;
      else if (e.target.id === 'inSx') s.sx = v;
      else if (e.target.id === 'inRot') s.rot = v;
      else return;
      this.renderInspectorValues();
      this.render();
      if (final) { this.pushHist(); this.afterChange(false); }
    },
    onInspectorClick(e) {
      const d = design();
      const nc = e.target.closest('[data-newcolor]');
      if (nc) { this.color = nc.dataset.newcolor; this.renderInspector(); return; }
      const s = d.shapes.find(x => x.id === this.sel);
      const sc = e.target.closest('[data-shapecolor]');
      if (sc && s) {
        const before = E.usedColors(d).length;
        s.color = sc.dataset.shapecolor;
        this.color = s.color;
        const after = E.usedColors(d).length;
        if (after > 5 && after > before) App.toast('花階磚一般只用 2–5 種顏色；顏色太多會難以打印。');
        App.sound('tick');
        this.commit();
        return;
      }
      const a = e.target.closest('[data-act]');
      if (!a) return;
      const i = d.shapes.findIndex(x => x.id === this.sel);
      switch (a.dataset.act) {
        case 'deselect': this.sel = null; this.renderInspector(); this.render(); return;
        case 'rotL': if (s) s.rot = Math.round(((s.rot - 15 + 540) % 360) - 180); break;
        case 'rotR': if (s) s.rot = Math.round(((s.rot + 15 + 540) % 360) - 180); break;
        case 'dup': this.duplicate(); return;
        case 'del': this.deleteSel(); return;
        case 'up': if (i >= 0 && i < d.shapes.length - 1) { const t = d.shapes[i]; d.shapes[i] = d.shapes[i + 1]; d.shapes[i + 1] = t; } break;
        case 'down': if (i > 0) { const t = d.shapes[i]; d.shapes[i] = d.shapes[i - 1]; d.shapes[i - 1] = t; } break;
      }
      this.commit();
    },
    renderFloor() {
      const cv = $('#miniFloor');
      const f = fitCanvas(cv, 240);
      const g = cv.getContext('2d');
      const d = design();
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, f.w, f.h);
      if (E.isRoundProduct(d)) {
        g.fillStyle = css('--panel') || '#F3F4EF';
        g.fillRect(0, 0, f.w, f.h);
        const img = E.tileImage(d, Math.round(f.w * 0.8), { texture: 0.08 });
        g.drawImage(img, f.w * 0.1, f.h * 0.1);
        g.fillStyle = css('--ink-3') || '#6F7B75';
        g.font = (12 * f.dpr) + 'px ' + (css('--font-body') || 'sans-serif');
        g.textAlign = 'center';
        g.fillText('圓形作品不能拼成地板', f.w / 2, f.h - 6 * f.dpr);
        $('#edFloorRule').disabled = true;
        return;
      }
      $('#edFloorRule').disabled = false;
      const gap = Math.max(1, 2 * f.dpr), cell = (f.w - gap * 5) / 4;
      const img = E.tileImage(d, Math.ceil(cell), { texture: 0.08 });
      E.renderFloor(g, img, { rows: 4, cols: 4, cell, gap, rule: d.floorRule || 'same', seed: 7, grout: css('--grout') || '#CEC8BB' });
    },
    renderCriteria() {
      const cr = App.P.brief.criteria;
      const host = $('#criteriaPanel');
      if (!cr.length) {
        host.innerHTML = '<h3>設計準則</h3><p class="small muted">還未定義準則。<button type="button" class="btn small ghost" data-go="2">到步驟 2</button></p>';
        return;
      }
      host.innerHTML = '<h3>設計準則 <span class="small muted">即時檢查</span></h3><ul class="check-list">' + cr.map(id => {
        const d = App.needInfo(id), r = App.checkNeed(id);
        return '<li><span class="st ' + r.state + '" aria-label="' + r.state + '">' + App.stateIcon(r.state) + '</span><span>' + d.icon + ' ' + esc(d.label) + '<small>' + esc(r.note) + '</small></span></li>';
      }).join('') + '</ul>';
    },
    renderFeedbackPanel() {
      const host = $('#feedbackPanel');
      const fb = App.P.feedback;
      if (!fb.length) { host.hidden = true; return; }
      host.hidden = false;
      const count = {};
      fb.forEach(f => (f.suggest || []).forEach(s => { count[s] = (count[s] || 0) + 1; }));
      const sug = Object.keys(count).sort((a, b) => count[b] - count[a]);
      host.innerHTML = '<h3>同學的建議</h3>' +
        (sug.length ? '<div class="chips">' + sug.map(s => '<span class="chip">' + esc(s) + (count[s] > 1 ? ' ×' + count[s] : '') + '</span>').join('') + '</div>' : '<p class="small muted">沒有改善建議。</p>') +
        fb.filter(f => f.comment).map(f => '<p class="small">「' + esc(f.comment) + '」— ' + esc(f.tester) + '</p>').join('');
    },
    versionLabel() {
      const P = App.P;
      if (!P.versions.length) return { text: '儲存為 v1', mode: 'new' };
      if (!P.feedback.length) return { text: '更新 v1', mode: 'replace' };
      if (P.versions.length === 1) return { text: '儲存為 v2（改良版）', mode: 'new' };
      return { text: '更新 v' + P.versions.length, mode: 'replace' };
    },
    renderVersions() {
      const P = App.P;
      $('#versionList').innerHTML = P.versions.map((v, i) => '<div class="version" data-v="' + i + '"><span class="vt"></span>' + esc(v.label) + '</div>').join('') ||
        '<p class="small muted">設計好之後，儲存為 v1，再請同學測試。</p>';
      $$('#versionList .version').forEach(el => {
        const v = P.versions[Number(el.dataset.v)];
        el.querySelector('.vt').replaceWith(E.tileImage(v.design, 112, { texture: 0.06 }));
      });
      $('#btnSaveVersion').textContent = this.versionLabel().text;
    },
    saveVersion() {
      const P = App.P, d = design();
      if (d.shapes.length < 3) { App.toast('最少放 3 個形狀才儲存版本。'); return; }
      const vl = this.versionLabel();
      const snap = { label: '', design: E.cloneDesign(d), time: Date.now() };
      if (vl.mode === 'new') { snap.label = 'v' + (P.versions.length + 1); P.versions.push(snap); }
      else { snap.label = P.versions[P.versions.length - 1].label; P.versions[P.versions.length - 1] = snap; }
      App.sound('ok');
      App.toast('已儲存 ' + snap.label + '。', 'ok');
      App.save();
      this.renderVersions();
      App.renderPath();
      this.checkDone();
      if (snap.label === 'v2' && App.steps[7]) App.steps[7].checkDone();
    },
    renderStatus() {
      const d = design();
      const n = d.shapes.length;
      const k = E.symTransforms(E.algoFor(d)).length;
      $('#editorStatus').innerHTML = n
        ? '你畫了 <b>' + n + '</b> 個形狀 → 演算法重複 <b>' + k + '</b> 份 → 畫布上共有 <b>' + (n * k) + '</b> 個圖案'
        : '在左邊點一個形狀，加到綠色的「基本區域」裏。';
    },
    checkDone() {
      if (design().shapes.length >= 3 && App.P.versions.length >= 1) App.complete(5);
      App.refreshStatus();
    },
    status() {
      const d = design();
      if (d.shapes.length < 3) return { done: false, hint: '最少加入 3 個形狀（現在 ' + d.shapes.length + ' 個）。', todo: '最少加入 3 個形狀' };
      if (!App.P.versions.length) return { done: false, hint: '滿意之後，按右邊「儲存為 v1」。', todo: '儲存 v1' };
      if (App.P.feedback.length && App.P.versions.length < 2) return { done: true, hint: '按同學意見修改，然後「儲存為 v2」。' };
      return { done: true, hint: '已儲存 ' + App.P.versions[App.P.versions.length - 1].label + '。下一步：看看 3D 模型。' };
    }
  };
  App.steps[5] = S5;

  /* ======================= 步驟 6：3D 原型 ======================= */
  const FILAMENTS = [
    { key: 'white', name: '白', hex: '#F1EFE9' }, { key: 'black', name: '黑', hex: '#2A2A2A' },
    { key: 'red', name: '紅', hex: '#C0392B' }, { key: 'green', name: '綠', hex: '#2E7D4F' },
    { key: 'blue', name: '藍', hex: '#2F5D9E' }, { key: 'yellow', name: '黃', hex: '#E3B23C' },
    { key: 'grey', name: '灰', hex: '#9A9A9A' }
  ];
  const filHex = k => (FILAMENTS.find(f => f.key === k) || FILAMENTS[0]).hex;
  const CHECKS = ['尺寸和款式適合用家', '沒有太幼、印不出的部分', '不同顏色的高度分得開'];

  const S6 = {
    viewer: null,
    model: null,
    init() {
      $('#printProduct').addEventListener('click', e => {
        const b = e.target.closest('[data-product]');
        if (!b) return;
        design().product = b.dataset.product;
        App.P.brief.product = b.dataset.product;
        App.sound('tick');
        this.changed();
      });
      $('#optRounded').addEventListener('change', e => { design().rounded = e.target.checked; this.changed(); });
      $('#heightTable').addEventListener('click', e => {
        const b = e.target.closest('[data-lv]');
        if (!b) return;
        design().heights[b.dataset.key] = Number(b.dataset.lv);
        App.sound('tick');
        this.changed();
      });
      $('#modeSeg').addEventListener('click', e => {
        const b = e.target.closest('[data-mode]');
        if (!b) return;
        App.P.print.mode = b.dataset.mode;
        this.renderMode();
        this.applyModel();
        App.save();
      });
      $('#filaments').addEventListener('click', e => {
        const b = e.target.closest('[data-fil]');
        if (!b) return;
        App.P.print[b.dataset.slot] = b.dataset.fil;
        this.renderMode();
        this.applyModel();
        App.save();
      });
      $('#autoRotate').addEventListener('change', e => { if (this.viewer) this.viewer.setAutoRotate(e.target.checked); });
      $('#btnSTL').addEventListener('click', () => this.downloadSTL());
      $('#btnZip').addEventListener('click', () => this.downloadZip());
      $('#printWarnings').addEventListener('change', e => {
        const c = e.target.closest('[data-check]');
        if (!c) return;
        App.P.print.checks = App.P.print.checks || {};
        App.P.print.checks[c.dataset.check] = c.checked;
        App.save();
        this.checkDone();
      });
    },
    ensureViewer() {
      if (this.viewer) return this.viewer;
      if (!global.THREE) { $('#viewerError').hidden = false; return null; }
      this.viewer = new global.TileViewer($('#viewerHost'));
      this.viewer.onAutoChange = on => { $('#autoRotate').checked = on; };
      this.viewer.setBackground(css('--panel') || '#F3F4EF');
      return this.viewer;
    },
    enter() {
      const v = this.ensureViewer();
      this.renderPanel();
      if (v) { v.resize(); v.start(); }
      this.build();
    },
    leave() { if (this.viewer) this.viewer.stop(); },
    retheme() {
      if (this.viewer) this.viewer.setBackground(css('--panel') || '#F3F4EF');
      this.renderPanel();
    },
    changed() {
      App.save();
      this.renderPanel();
      clearTimeout(this.bt);
      this.bt = setTimeout(() => this.build(), 120);
    },
    build() {
      if (!global.THREE) return;
      $('#viewerBusy').hidden = false;
      setTimeout(() => {
        try {
          this.disposeModel();
          this.modelDesign = design();
          this.model = M.buildModel(this.modelDesign);
          this.applyModel();
          this.renderStats();
          App.steps[5].renderCriteria && App.steps[5].renderCriteria();
        } catch (err) {
          console.error(err);
          App.toast('生成 3D 模型時出錯：' + err.message);
        }
        $('#viewerBusy').hidden = true;
      }, 30);
    },
    disposeModel() {
      if (!this.model) return;
      if (this.viewer) this.viewer.clear();
      this.model.base.dispose();
      this.model.parts.forEach(p => p.geometry.dispose());
      this.model = null;
    },
    texture() {
      const d = this.modelDesign || design(), prod = C.products[d.product];
      const S = prod.size, span = prod.tab ? S + 30 : S;
      const px = 1024;
      const c = document.createElement('canvas');
      c.width = c.height = px;
      const g = c.getContext('2d');
      g.fillStyle = E.colorHex(d.bg);
      g.fillRect(0, 0, px, px);
      const k = px * (S / span) / 200;
      g.setTransform(k, 0, 0, k, px / 2, px / 2);
      E.renderTile(g, d, { texture: 0.05 });
      return { canvas: c, span };
    },
    applyModel() {
      if (!this.viewer || !this.model) return;
      const P = App.P, d = this.modelDesign || design();
      this.viewer.setModel(this.model, {
        mode: P.print.mode,
        texture: P.print.mode === 'real' ? this.texture() : null,
        baseHex: E.colorHex(d.bg),
        filamentA: filHex(P.print.filA),
        filamentB: filHex(P.print.filB)
      });
    },
    renderMode() {
      const P = App.P;
      $$('#modeSeg [data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === P.print.mode)));
      const fp = $('#filamentPanel');
      fp.hidden = P.print.mode === 'real';
      const row = (slot, label) => '<div class="fil-row"><span>' + label + '</span>' + FILAMENTS.map(f =>
        '<button type="button" class="swatch" data-slot="' + slot + '" data-fil="' + f.key + '" style="background:' + f.hex + '" aria-pressed="' + (P.print[slot] === f.key) + '" title="' + f.name + '"><span class="sr">' + f.name + '</span></button>').join('') + '</div>';
      $('#filaments').innerHTML = P.print.mode === 'mono' ? row('filA', '線材顏色') : row('filA', '底座（A）') + row('filB', '凸起（B）');
    },
    renderPanel() {
      const d = design(), prod = C.products[d.product];
      const per = App.persona();
      App.renderProductPick($('#printProduct'), d.product, per && per.product, true);
      $('#roundedWrap').hidden = prod.outline === 'circle';
      $('#optRounded').checked = !!d.rounded;
      const lvNames = ['平', '低', '高'];
      $('#heightTable').innerHTML = E.usedColors(d).map(k => {
        const lv = E.levelOf(d, k);
        return '<div class="h-row"><span class="sw" style="background:' + E.colorHex(k) + '"></span><span>' + esc(E.colorName(k)) + (k === d.bg ? '（背景）' : '') + '</span>' +
          '<span class="seg" role="radiogroup" aria-label="' + esc(E.colorName(k)) + ' 的高度">' + lvNames.map((n, i) =>
            '<button type="button" data-key="' + k + '" data-lv="' + i + '" aria-pressed="' + (lv === i) + '">' + n + '</button>').join('') + '</span></div>';
      }).join('');
      // 高度提示
      const levels = {};
      E.usedColors(d).forEach(k => { const lv = E.levelOf(d, k); (levels[lv] = levels[lv] || []).push(k); });
      let hint = '';
      Object.keys(levels).forEach(lv => {
        if (levels[lv].length > 1) hint = levels[lv].map(E.colorName).join('、') + ' 一樣高：用單色打印時會分不出來。';
      });
      if (!Object.keys(levels).some(lv => Number(lv) > 0)) hint = '全部顏色都是「平」：打印出來只是一塊平板。';
      $('#heightHint').hidden = !hint;
      $('#heightHint').textContent = hint;
      this.renderMode();
      this.renderStats();
      $('#dualTip').textContent = '雙色打印：在切片軟件的 ' + prod.base.toFixed(1) + ' mm 高度加入「暫停／換料」，底座和凸起就會是兩種顏色。';
    },
    renderStats() {
      const d = design(), prod = C.products[d.product];
      const m = this.model;
      const dims = prod.outline === 'circle' ? '直徑 ' + prod.size + ' mm' : prod.size + ' × ' + prod.size + ' mm';
      let rows = '<dt>款式</dt><dd>' + esc(prod.name) + (prod.tab ? '（有掛孔）' : '') + '</dd><dt>尺寸</dt><dd>' + dims + '</dd>';
      if (m) {
        rows += '<dt>總高度</dt><dd>' + m.height.toFixed(1) + ' mm（底座 ' + m.baseH.toFixed(1) + ' mm）</dd>' +
          '<dt>估計時間</dt><dd>約 ' + m.estimate.minMinutes + '–' + m.estimate.maxMinutes + ' 分鐘</dd>' +
          '<dt>用料</dt><dd>約 ' + m.estimate.grams.toFixed(1) + ' 克 PLA</dd>';
      }
      $('#printStats').innerHTML = rows;
      const w = [];
      if (m) {
        m.warnings.forEach(x => w.push('<li>' + esc(E.colorName(x.key)) + '有約 ' + Math.round(x.thin * 100) + '% 的部分少於 1 mm，可能印不出。可以把形狀放大或加闊。</li>'));
        if (!m.parts.length) w.push('<li>沒有凸起部分，打印出來只是一塊平板。把圖案的顏色設為「低」或「高」。</li>');
        if (!w.length) w.push('<li class="good">✓ 沒有發現太幼的部分，可以打印。</li>');
      }
      const ck = App.P.print.checks || {};
      w.push('<li class="good"><b>打印前檢查</b>' + CHECKS.map((t, i) =>
        '<label class="switch" style="display:flex;margin-top:4px"><input type="checkbox" data-check="' + i + '"' + (ck[i] ? ' checked' : '') + '> ' + esc(t) + '</label>').join('') + '</li>');
      $('#printWarnings').innerHTML = w.join('');
    },
    ensureModel() {
      if (global.THREE && (!this.model || this.modelDesign !== design())) {
        this.disposeModel();
        this.modelDesign = design();
        this.model = M.buildModel(this.modelDesign);
      }
      return this.model;
    },
    downloadSTL() {
      const m = this.ensureModel();
      if (!m) { App.toast('未能生成 3D 模型。'); return; }
      const prod = C.products[design().product];
      App.download(App.fileBase() + '_' + prod.name + '.stl', M.modelSTL(m), 'model/stl');
      App.P.print.stlDone = true;
      App.save();
      this.checkDone();
    },
    downloadZip() {
      const m = this.ensureModel();
      if (!m) return;
      const files = [{ name: 'base.stl', data: M.toSTL([m.base]) }];
      m.parts.forEach((p, i) => files.push({ name: 'part' + (i + 1) + '_' + p.key + '_level' + p.level + '.stl', data: M.toSTL([p.geometry]) }));
      const readme = '花階磚設計工作室 — 分色模型\r\n\r\n' +
        '在切片軟件（例如 Bambu Studio、PrusaSlicer、Cura）同時匯入所有 STL，選擇「作為一個物件的多個部件」，再為每個部件指定線材顏色。\r\n\r\n' +
        'base.stl = 底座（' + E.colorName(design().bg) + '）\r\n' +
        m.parts.map((p, i) => 'part' + (i + 1) + ' = ' + E.colorName(p.key) + '（高度級別 ' + p.level + '）').join('\r\n') + '\r\n';
      files.push({ name: 'README.txt', data: new TextEncoder().encode(readme) });
      App.download(App.fileBase() + '_分色模型.zip', M.makeZip(files), 'application/zip');
      App.P.print.stlDone = true;
      App.save();
      this.checkDone();
    },
    // 作品卡用：一律以「真實顏色」拍照
    snapshot(d) {
      if (!this.viewer || !this.viewer.ok) return null;
      try {
        this.disposeModel();
        this.modelDesign = d || design();
        this.model = M.buildModel(this.modelDesign);
      } catch (e) { return null; }
      const mode = App.P.print.mode;
      App.P.print.mode = 'real';
      this.applyModel();
      const url = this.viewer.snapshot();
      App.P.print.mode = mode;
      this.applyModel();
      return url;
    },
    checkDone() {
      const ck = App.P.print.checks || {};
      const allChecked = CHECKS.every((t, i) => ck[i]);
      if (App.P.print.stlDone || allChecked) App.complete(6);
      App.refreshStatus();
    },
    status() {
      if (App.P.done[6]) return { done: true, hint: '3D 模型準備好了。下一步：請同學測試。' };
      return { done: false, hint: '調整顏色高度，完成「打印前檢查」或下載 STL。', todo: '完成打印前檢查' };
    }
  };
  App.steps[6] = S6;

  /* ======================= 步驟 7：測試與改良 ======================= */
  const FACES = [{ v: 2, t: '😀 做到' }, { v: 1, t: '😐 部分做到' }, { v: 0, t: '😟 未做到' }];

  const S7 = {
    init() {
      $('#testDesigner').addEventListener('click', e => {
        const a = e.target.closest('[data-act]');
        if (a && a.dataset.act === 'start-test') this.openTester();
        const ch = e.target.closest('[data-change]');
        if (ch) { this.toggle(App.P.changes, ch.dataset.change); this.renderDesigner(); this.checkDone(); }
        const rs = e.target.closest('[data-reason]');
        if (rs) { this.toggle(App.P.changeReasons, rs.dataset.reason); this.renderDesigner(); this.checkDone(); }
      });
      $('#testerView').addEventListener('click', e => {
        const f = e.target.closest('[data-rate]');
        if (f) { this.form.ratings[f.dataset.crit] = Number(f.dataset.rate); this.renderTester(); return; }
        const p = e.target.closest('[data-praise]');
        if (p) { this.toggle(this.form.praise, p.dataset.praise); this.renderTester(); return; }
        const s = e.target.closest('[data-suggest]');
        if (s) { this.toggle(this.form.suggest, s.dataset.suggest); this.renderTester(); return; }
        const a = e.target.closest('[data-act]');
        if (!a) return;
        if (a.dataset.act === 'cancel') this.closeTester();
        if (a.dataset.act === 'submit') this.submit();
      });
      $('#testerView').addEventListener('input', e => {
        if (e.target.id === 'tComment') this.form.comment = e.target.value;
        if (e.target.id === 'tWho') this.form.tester = e.target.value;
      });
    },
    toggle(arr, v) { const i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); App.save(); },
    enter() { this.closeTester(true); },
    leave() { this.closeTester(true); },
    retheme() { if (App.current === 7) { if ($('#testerView').hidden) this.renderDesigner(); else this.renderTester(); } },
    tileCanvas(d, px) { const c = E.tileImage(d, px, { texture: 0.08 }); c.className = 'tile-img'; return c; },
    renderDesigner() {
      const P = App.P, host = $('#testDesigner');
      const v1 = P.versions[0], v2 = P.versions[1];
      const cr = P.brief.criteria;
      let left = '<div class="panel test-card"><h3>① 測試你的 v1</h3>';
      if (!v1) {
        left += '<p>還未儲存 v1。先在設計頁按「儲存為 v1」。</p><button type="button" class="btn primary" data-go="5">到步驟 5 設計</button></div>';
      } else {
        left += '<div class="row"><span class="tv1"></span><div><p>準則：' + cr.map(id => App.needInfo(id).icon + ' ' + esc(App.needInfo(id).label)).join('、') + '</p>' +
          '<p class="small muted">已收到 ' + P.feedback.length + ' 份意見</p></div></div>' +
          '<button type="button" class="btn primary big" data-act="start-test">開始測試（交給測試員）</button>' +
          '<p class="small muted">測試員要代入你的用家，誠實評分。多找一位同學測試，意見會更全面。</p></div>';
      }
      let right = '<div class="panel test-card"><h3>② 同學的意見</h3>';
      if (!P.feedback.length) right += '<p class="muted">還沒有意見。</p>';
      else {
        right += '<div class="fb-list">' + P.feedback.map(f =>
          '<div class="fb-item"><span class="who">測試員 ' + esc(f.tester) + '（測試 ' + esc(f.version || 'v1') + '）</span>' +
          '<div class="rate-row">' + Object.keys(f.ratings).map(id => {
            const r = f.ratings[id];
            return '<span class="chip">' + App.needInfo(id).icon + ' ' + esc(App.needInfo(id).label) + '：' + ['😟', '😐', '😀'][r] + '</span>';
          }).join('') + '</div>' +
          (f.praise.length ? '<div>讚：' + f.praise.map(esc).join('、') + '</div>' : '') +
          (f.suggest.length ? '<div>建議：' + f.suggest.map(esc).join('、') + '</div>' : '') +
          (f.comment ? '<div>「' + esc(f.comment) + '」</div>' : '') + '</div>').join('') + '</div>';
      }
      right += '</div>';
      let bottom = '';
      if (P.feedback.length) {
        bottom = '<div class="panel test-card" style="grid-column:1/-1"><h3>③ 改良：v1 → v2</h3>';
        if (!v2) {
          bottom += '<p>根據意見修改設計，然後在設計頁按「儲存為 v2（改良版）」。</p><div class="row"><button type="button" class="btn primary" data-go="5">回到設計頁修改</button></div>';
        } else {
          const auto = this.autoChanges(v1.design, v2.design);
          const sugs = Array.from(new Set([].concat.apply([], P.feedback.map(f => f.suggest || []))));
          bottom += '<div class="compare"><figure><span class="cv1"></span><figcaption>v1</figcaption></figure><span class="arrow" aria-hidden="true">→</span><figure><span class="cv2"></span><figcaption>v2</figcaption></figure></div>' +
            '<p class="field-label">我改了甚麼？<span class="small muted">（電腦偵測到的已加上 ★）</span></p><div class="chips">' +
            C.changes.map(c => '<button type="button" class="chip' + (P.changes.indexOf(c) >= 0 ? ' on' : '') + '" data-change="' + esc(c) + '" aria-pressed="' + (P.changes.indexOf(c) >= 0) + '">' + (auto.indexOf(c) >= 0 ? '★ ' : '') + esc(c) + '</button>').join('') + '</div>' +
            (sugs.length ? '<p class="field-label">我根據哪些意見修改？</p><div class="chips">' + sugs.map(s => '<button type="button" class="chip' + (P.changeReasons.indexOf(s) >= 0 ? ' on' : '') + '" data-reason="' + esc(s) + '" aria-pressed="' + (P.changeReasons.indexOf(s) >= 0) + '">' + esc(s) + '</button>').join('') + '</div>' : '') +
            '<div class="row"><button type="button" class="btn ghost" data-go="5">再修改</button></div>';
        }
        bottom += '</div>';
      }
      host.innerHTML = left + right + bottom;
      const put = (sel, d, px) => { const el = host.querySelector(sel); if (el && d) el.replaceWith(this.tileCanvas(d, px)); };
      put('.tv1', v1 && v1.design, 180);
      put('.cv1', v1 && v1.design, 360);
      put('.cv2', v2 && v2.design, 360);
      $$('canvas.tile-img', host).forEach(c => { c.style.width = c.closest('.compare') ? '100%' : '120px'; c.style.maxWidth = '220px'; c.style.borderRadius = '6px'; });
    },
    autoChanges(a, b) {
      const out = [];
      const cols = d => Array.from(new Set(d.shapes.map(s => s.color).concat([d.bg]))).sort().join();
      if (cols(a) !== cols(b)) out.push('改了顏色');
      if (b.shapes.length > a.shapes.length) out.push('加了圖案');
      if (b.shapes.length < a.shapes.length) out.push('刪了圖案');
      const byId = {};
      a.shapes.forEach(s => { byId[s.id] = s; });
      let size = false, pos = false;
      b.shapes.forEach(s => {
        const o = byId[s.id];
        if (!o) return;
        if (Math.abs(o.size - s.size) > 0.5 || Math.abs((o.sx || 1) - (s.sx || 1)) > 0.01) size = true;
        if (Math.abs(o.x - s.x) > 0.5 || Math.abs(o.y - s.y) > 0.5 || Math.abs(o.rot - s.rot) > 0.5) pos = true;
      });
      if (size) out.push('改了大小');
      if (pos) out.push('改了位置或角度');
      if (a.algo.n !== b.algo.n || !!a.algo.mirror !== !!b.algo.mirror) out.push('改了對稱方法');
      if (JSON.stringify(a.heights || {}) !== JSON.stringify(b.heights || {})) out.push('改了凸起高度');
      if (a.product !== b.product || !!a.rounded !== !!b.rounded) out.push('改了產品款式');
      return out;
    },
    openTester() {
      const v1 = App.P.versions[0];
      if (!v1) return;
      this.form = { tester: '', ratings: {}, praise: [], suggest: [], comment: '' };
      $('#testDesigner').hidden = true;
      $('#testerView').hidden = false;
      this.renderTester(true);
      $('#stage').scrollTop = 0;
    },
    closeTester(silent) {
      $('#testerView').hidden = true;
      $('#testDesigner').hidden = false;
      if (App.current === 7 || silent) this.renderDesigner();
    },
    renderTester(first) {
      const P = App.P, per = App.persona(), f = this.form;
      const v1 = P.versions[0];
      const d = v1.design;
      const prod = C.products[d.product];
      const host = $('#testerView');
      const scroll = $('#stage').scrollTop;
      host.innerHTML =
        '<div class="tester-banner">' + (per ? '<span class="avatar" style="background:' + per.tint + '" aria-hidden="true">' + per.avatar + '</span>' : '') +
        '<div><b>測試員：請代入「' + esc(per ? per.name : '用家') + '」</b><p class="small">' + esc(per ? per.age + ' 歲｜' + per.role + '。' + per.intro : '') + '</p></div></div>' +
        '<div class="design-view"><span class="tview"></span><p><b>' + esc(prod.name) + '</b>（' + (prod.outline === 'circle' ? '直徑 ' : '') + prod.size + ' mm）</p>' +
        '<p class="small muted">設計者：' + esc(P.student.cls + '-' + P.student.no) + '</p></div>' +
        '<div class="test-card">' +
        P.brief.criteria.map(id => {
          const info = App.needInfo(id), auto = App.checkNeed(id, d);
          return '<div class="rate-q"><div class="t">' + info.icon + ' ' + esc(info.label) + '<span class="small muted">— ' + esc(info.desc) + '</span></div>' +
            (auto.state !== 'peer' ? '<div class="auto">電腦檢查：' + App.stateIcon(auto.state) + ' ' + esc(auto.note) + '</div>' : '') +
            '<div class="rate-row">' + FACES.map(x => '<button type="button" class="face" data-crit="' + id + '" data-rate="' + x.v + '" aria-pressed="' + (f.ratings[id] === x.v) + '">' + x.t + '</button>').join('') + '</div></div>';
        }).join('') +
        '<p class="field-label">讚（可揀多項）</p><div class="chips">' + C.feedback.praise.map(t => '<button type="button" class="chip' + (f.praise.indexOf(t) >= 0 ? ' on' : '') + '" data-praise="' + esc(t) + '" aria-pressed="' + (f.praise.indexOf(t) >= 0) + '">' + esc(t) + '</button>').join('') + '</div>' +
        '<p class="field-label">建議（可揀多項）</p><div class="chips">' + C.feedback.suggest.map(t => '<button type="button" class="chip' + (f.suggest.indexOf(t) >= 0 ? ' on' : '') + '" data-suggest="' + esc(t) + '" aria-pressed="' + (f.suggest.indexOf(t) >= 0) + '">' + esc(t) + '</button>').join('') + '</div>' +
        '<label class="field" for="tComment"><span class="field-label">一句話（可不填）</span><textarea id="tComment" maxlength="60" placeholder="例如：婆婆應該會喜歡紅色的花">' + esc(f.comment) + '</textarea></label>' +
        '<div class="row"><label for="tWho">測試員班別學號</label><input id="tWho" maxlength="8" placeholder="2A-16" value="' + esc(f.tester) + '" style="width:110px"></div>' +
        '<div class="row"><button type="button" class="btn primary" data-act="submit">提交意見</button><button type="button" class="btn ghost" data-act="cancel">取消</button></div>' +
        '</div>';
      host.querySelector('.tview').replaceWith(this.tileCanvas(d, 360));
      if (!first) $('#stage').scrollTop = scroll;
    },
    submit() {
      const f = this.form, cr = App.P.brief.criteria;
      if (cr.some(id => f.ratings[id] == null)) { App.toast('請為每一項準則評分。'); return; }
      if (!f.praise.length && !f.suggest.length) { App.toast('最少揀一個「讚」或「建議」。'); return; }
      if (!f.tester.trim()) { App.toast('請輸入測試員的班別學號。'); $('#tWho').focus(); return; }
      App.P.feedback.push({ tester: f.tester.trim(), ratings: f.ratings, praise: f.praise.slice(), suggest: f.suggest.slice(), comment: f.comment.trim(), version: 'v1', time: Date.now() });
      App.save();
      App.sound('ok');
      App.toast('謝謝測試員！意見已交給設計師。', 'ok');
      this.closeTester();
      App.steps[5].renderVersions();
      this.checkDone();
    },
    checkDone() {
      const P = App.P;
      if (P.feedback.length && P.versions.length >= 2 && P.changes.length) App.complete(7);
      App.refreshStatus();
    },
    status() {
      const P = App.P;
      if (!P.versions.length) return { done: false, hint: '先在步驟 5 儲存 v1。', todo: '儲存 v1' };
      if (!P.feedback.length) return { done: false, hint: '請一位同學按「開始測試」給你意見。', todo: '收集同學意見' };
      if (P.versions.length < 2) return { done: false, hint: '按意見修改設計，然後儲存為 v2。', todo: '儲存 v2' };
      if (!P.changes.length) return { done: false, hint: '選出你改了甚麼。', todo: '說明改了甚麼' };
      return { done: true, hint: '改良完成！下一步：製作作品卡。' };
    }
  };
  App.steps[7] = S7;

  /* ======================= 步驟 8：作品卡 ======================= */
  const PROUD = ['顏色配搭', '圖案設計', '對稱效果', '地板效果', '3D 模型', '符合用家需要'];

  function wrapText(g, text, x, y, maxW, lh, maxLines) {
    const chars = Array.from(text);
    let line = '', lines = 0;
    for (let i = 0; i < chars.length; i++) {
      const test = line + chars[i];
      if (g.measureText(test).width > maxW && line) {
        g.fillText(line, x, y);
        y += lh; line = chars[i]; lines++;
        if (maxLines && lines >= maxLines - 1) {
          let rest = chars.slice(i).join('');
          while (g.measureText(rest + '…').width > maxW && rest.length) rest = rest.slice(0, -1);
          g.fillText(rest + (rest.length < chars.length - i ? '…' : ''), x, y);
          return y + lh;
        }
      } else line = test;
    }
    if (line) { g.fillText(line, x, y); y += lh; }
    return y;
  }

  const S8 = {
    init() {
      $('#learnedPick').addEventListener('click', e => {
        const b = e.target.closest('[data-l]');
        if (!b) return;
        const arr = App.P.learned, v = b.dataset.l, i = arr.indexOf(v);
        if (i >= 0) arr.splice(i, 1); else { arr.push(v); if (arr.length > 3) arr.shift(); }
        this.update();
      });
      $('#proudPick').addEventListener('click', e => {
        const b = e.target.closest('[data-p]');
        if (!b) return;
        const arr = App.P.proud, v = b.dataset.p, i = arr.indexOf(v);
        if (i >= 0) arr.splice(i, 1); else { arr.push(v); if (arr.length > 2) arr.shift(); }
        this.update();
      });
      $('#declarePick').addEventListener('change', e => {
        const c = e.target.closest('[data-dec]');
        if (!c) return;
        App.P.declare[c.dataset.dec] = c.checked;
        this.update();
      });
      $('#dlCard').addEventListener('click', () => {
        this.draw();
        App.downloadCanvas(App.fileBase() + '_作品卡.png', $('#cardCanvas'));
        App.P.exported.card = true;
        this.checkDone();
      });
      $('#dlTile').addEventListener('click', () => {
        App.downloadCanvas(App.fileBase() + '_花階磚.png', E.tileImage(this.finalDesign(), 1200, { texture: 0.1 }));
      });
      $('#dlStl').addEventListener('click', () => {
        if (!global.THREE) { App.toast('未能載入 3D 程式庫。'); return; }
        const d = this.finalDesign();
        const m = M.buildModel(d);
        App.download(App.fileBase() + '_' + C.products[d.product].name + '.stl', M.modelSTL(m), 'model/stl');
      });
      $('#dlJson').addEventListener('click', () => { App.exportJSON(); this.checkDone(); });
    },
    finalDesign() {
      const v = App.P.versions;
      return v.length ? v[v.length - 1].design : design();
    },
    enter() {
      const P = App.P;
      // 自動勾選創作聲明（學生可修改）
      if (P.declare.preset == null) P.declare.preset = !!P.usedPreset;
      if (P.declare.random == null) P.declare.random = !!P.usedRandom;
      if (P.declare.peer == null) P.declare.peer = P.feedback.length > 0;
      if (P.declare.own == null) P.declare.own = true;
      this.snapImg = null;
      this.snap = App.steps[6].snapshot ? App.steps[6].snapshot(this.finalDesign()) : null;
      if (this.snap) { const im = new Image(); im.onload = () => { this.snapImg = im; this.draw(); }; im.src = this.snap; }
      this.update();
    },
    retheme() { this.update(); },
    update() {
      const P = App.P;
      $('#learnedPick').innerHTML = C.learned.map(t => '<button type="button" class="chip' + (P.learned.indexOf(t) >= 0 ? ' on' : '') + '" data-l="' + esc(t) + '" aria-pressed="' + (P.learned.indexOf(t) >= 0) + '">' + esc(t) + '</button>').join('');
      $('#proudPick').innerHTML = PROUD.map(t => '<button type="button" class="chip' + (P.proud.indexOf(t) >= 0 ? ' on' : '') + '" data-p="' + esc(t) + '" aria-pressed="' + (P.proud.indexOf(t) >= 0) + '">' + esc(t) + '</button>').join('');
      $('#declarePick').innerHTML = C.declarations.map(d =>
        '<label><input type="checkbox" data-dec="' + d.id + '"' + (P.declare[d.id] ? ' checked' : '') + '> <span>' + esc(d.text) + (d.id === 'preset' && P.usedPreset ? '（' + esc(P.usedPreset) + '）' : '') + '</span></label>').join('');
      $('#badgeShelf').innerHTML = App.STEPS.filter(s => s.badge).map(s =>
        '<div class="badge' + (P.done[s.id] ? ' got' : '') + '"><span class="b-ic" aria-hidden="true">' + s.badge.icon + '</span>' + esc(s.badge.name) + '</div>').join('');
      App.save();
      this.draw();
      App.refreshStatus();
    },
    // 先在一張高畫布上排版，再按內容高度輸出（內容多也不會被頁尾遮住）
    draw() {
      const W = 1240, GREEN = '#1E5B47', PAPER = '#F6F3EA';
      const fontB = '"Chiron Hei HK", "Microsoft JhengHei", "PingFang HK", sans-serif';
      const work = document.createElement('canvas');
      work.width = W; work.height = 2800;
      const bottom = this.paint(work);
      const H = Math.max(1754, Math.ceil(bottom + 110));
      const cv = $('#cardCanvas');
      cv.width = W; cv.height = H;
      const g = cv.getContext('2d');
      g.fillStyle = PAPER; g.fillRect(0, 0, W, H);
      g.drawImage(work, 0, 0);
      g.fillStyle = GREEN; g.fillRect(0, H - 70, W, 70);
      g.fillStyle = '#FFFFFF'; g.font = '400 22px ' + fontB;
      g.fillText(C.appName + '　同理 → 定義 → 構思 → 原型 → 測試', 70, H - 28);
    },
    paint(cv) {
      const P = App.P, g = cv.getContext('2d');
      const W = cv.width;
      const per = App.persona();
      const d = this.finalDesign();
      const prod = C.products[d.product];
      const fontD = '"Chiron GoRound TC", "Microsoft JhengHei", "PingFang HK", sans-serif';
      const fontB = '"Chiron Hei HK", "Microsoft JhengHei", "PingFang HK", sans-serif';
      const INK = '#1C2521', INK2 = '#4B5751', GREEN = '#1E5B47', PAPER = '#F6F3EA', SOFT = '#ECE8DC', SUN = '#F5E6C2';
      g.fillStyle = PAPER; g.fillRect(0, 0, W, cv.height);
      // 頁首
      g.fillStyle = GREEN; g.fillRect(0, 0, W, 170);
      g.fillStyle = '#FFFFFF';
      g.font = '700 58px ' + fontD; g.textBaseline = 'alphabetic';
      g.fillText('花階磚設計卡', 70, 100);
      g.font = '400 28px ' + fontB;
      const who = P.student.cls + '-' + P.student.no + (P.student.name ? '　' + P.student.name : '');
      g.fillText(who + '　｜　' + new Date().toLocaleDateString('zh-HK'), 70, 145);
      g.textAlign = 'right';
      g.font = '400 24px ' + fontB;
      g.fillText(C.school + '・設計與計算思維', W - 70, 145);
      g.textAlign = 'left';
      // 用家與任務
      let y = 230;
      g.fillStyle = INK; g.font = '700 30px ' + fontD;
      g.fillText('用家：' + (per ? per.name + '（' + per.age + ' 歲，' + per.role + '）' : '—'), 70, y);
      y += 50;
      g.font = '400 27px ' + fontB; g.fillStyle = INK2;
      const cr = P.brief.criteria.map(id => App.needInfo(id).label);
      const hmw = '我們可以如何為' + (per ? per.name : '用家') + '設計一個' + prod.name + '，做到' + (cr.length ? cr.join('、') : '……') + '？';
      y = wrapText(g, hmw, 70, y, W - 140, 40, 3);
      // 大圖＋右欄（3D、地板）
      y += 10;
      const big = 560, tileImg = E.tileImage(d, big, { texture: 0.1 });
      g.save(); g.shadowColor = 'rgba(0,0,0,0.2)'; g.shadowBlur = 24; g.shadowOffsetY = 8;
      g.drawImage(tileImg, 70, y); g.restore();
      const rx = 70 + big + 40, rw = W - rx - 70;
      let ry = y;
      if (this.snapImg) {
        const sh = Math.round(rw * 0.56);
        g.fillStyle = SOFT; g.fillRect(rx, ry, rw, sh);
        g.drawImage(this.snapImg, rx, ry, rw, sh);
        g.fillStyle = INK2; g.font = '400 22px ' + fontB;
        g.fillText('3D 模型（' + prod.name + '，' + (prod.outline === 'circle' ? '直徑 ' : '') + prod.size + ' mm）', rx, ry + sh + 30);
        ry += sh + 50;
      }
      if (!E.isRoundProduct(d)) {
        const fs = Math.max(120, Math.min(rw * 0.62, y + big - ry));
        const fc = document.createElement('canvas'); fc.width = fc.height = Math.round(fs);
        const gap = 3, cell = (fs - gap * 5) / 4;
        E.renderFloor(fc.getContext('2d'), E.tileImage(d, Math.ceil(cell), { texture: 0.08 }), { rows: 4, cols: 4, cell, gap, rule: d.floorRule || 'same', seed: 7, grout: '#CEC8BB' });
        g.drawImage(fc, rx, ry);
        const rule = C.floorRules.find(r => r.id === (d.floorRule || 'same'));
        g.fillStyle = INK2; g.font = '400 22px ' + fontB;
        wrapText(g, '地板效果：' + rule.name, rx + fs + 18, ry + 30, rw - fs - 18, 32, 3);
      }
      y += big + 50;
      // 演算法
      const algo = E.algoFor(d), k = E.symTransforms(algo).length;
      g.fillStyle = SUN; g.fillRect(70, y, W - 140, 120);
      g.fillStyle = INK; g.font = '700 28px ' + fontD;
      g.fillText('我的演算法', 94, y + 44);
      g.font = '400 26px ' + fontB;
      g.fillText('重複 ' + algo.n + ' 次，每次右轉 ' + Math.round(algo.angle) + '°' + (algo.mirror ? '，再加鏡像' : '') + '　→　' + d.shapes.length + ' 個形狀變成 ' + (d.shapes.length * k) + ' 個圖案', 94, y + 90);
      y += 170;
      // 準則結果
      g.fillStyle = INK; g.font = '700 28px ' + fontD; g.fillText('設計準則與測試結果', 70, y); y += 46;
      g.font = '400 25px ' + fontB;
      P.brief.criteria.forEach((id, i) => {
        const info = App.needInfo(id);
        const rs = P.feedback.map(f => f.ratings[id]).filter(v => v != null);
        const avg = rs.length ? rs.reduce((a, b) => a + b, 0) / rs.length : null;
        const auto = App.checkNeed(id, d);
        const face = avg == null ? '（未測試）' : avg >= 1.5 ? '😀 做到' : avg >= 0.75 ? '😐 部分做到' : '😟 未做到';
        g.fillStyle = INK;
        g.fillText((i + 1) + '. ' + info.label + '：同學評分 ' + face + (auto.state !== 'peer' ? '　電腦檢查 ' + App.stateIcon(auto.state) : ''), 90, y);
        y += 40;
      });
      y += 30;
      // v1 → v2
      const v = P.versions;
      if (v.length >= 2) {
        g.fillStyle = INK; g.font = '700 28px ' + fontD; g.fillText('改良過程', 70, y); y += 22;
        g.drawImage(E.tileImage(v[0].design, 170, { texture: 0.08 }), 70, y);
        g.fillStyle = INK2; g.font = '700 40px ' + fontD; g.fillText('→', 262, y + 100);
        g.drawImage(E.tileImage(v[v.length - 1].design, 170, { texture: 0.08 }), 320, y);
        g.fillStyle = INK; g.font = '400 25px ' + fontB;
        let ty = y + 34;
        ty = wrapText(g, '我改了：' + (P.changes.length ? P.changes.join('、') : '—'), 530, ty, W - 600, 36, 2);
        wrapText(g, '根據意見：' + (P.changeReasons.length ? P.changeReasons.join('、') : '—'), 530, ty + 6, W - 600, 36, 3);
        y += 230;
      }
      // 反思
      g.fillStyle = INK; g.font = '700 28px ' + fontD; g.fillText('反思', 70, y); y += 44;
      g.font = '400 25px ' + fontB;
      y = wrapText(g, '我學到：' + (P.learned.length ? P.learned.join('、') : '—'), 90, y, W - 180, 36, 2);
      y = wrapText(g, '最滿意：' + (P.proud.length ? P.proud.join('、') : '—'), 90, y + 4, W - 180, 36, 2);
      // 創作聲明
      y += 30;
      g.fillStyle = INK; g.font = '700 28px ' + fontD; g.fillText('創作聲明', 70, y); y += 44;
      g.font = '400 25px ' + fontB;
      const decl = C.declarations.filter(x => P.declare[x.id]).map(x => x.text + (x.id === 'preset' && P.usedPreset ? '（' + P.usedPreset + '）' : ''));
      y = wrapText(g, decl.length ? decl.join('；') + '。' : '—', 90, y, W - 180, 36, 3);
      return y;
    },
    checkDone() {
      if (App.P.exported.card || App.P.exported.json) App.complete(8);
      App.save();
      App.refreshStatus();
    },
    status() {
      const P = App.P;
      if (!P.learned.length) return { done: false, hint: '揀出你學到的東西（最多 3 項）。', todo: '完成反思' };
      if (!P.exported.card && !P.exported.json) return { done: false, hint: '下載作品卡和存檔，然後提交。', todo: '下載作品卡' };
      return { done: true, hint: '全部完成！記得把作品卡和存檔提交給老師。' };
    }
  };
  App.steps[8] = S8;
})(window);
