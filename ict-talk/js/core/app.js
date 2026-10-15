// 簡報引擎：管理各站、步驟、轉場、HUD、全景地圖、鍵盤及講者備註視窗
import { runTransition, reverseOf } from './transitions.js';

const gsap = window.gsap;

// 深度計的「觀察尺度」（以 10 的次方表示，米）
export const LAYERS = {
  world:   { name: '社會層', scale: '40,000 km', exp: 7.6 },
  network: { name: '網絡層', scale: '12,000 km', exp: 7.08 },
  surface: { name: '介面層', scale: '15 cm', exp: -0.82 },
  code:    { name: '程式層', scale: '0.1 mm', exp: -4 },
  data:    { name: '數據層', scale: '20 nm', exp: -7.7 },
  chip:    { name: '硬件層', scale: '5 nm', exp: -8.3 },
};
const EXP_TOP = 8, EXP_BOTTOM = -9;

export function createApp(stations, env) {
  const world = document.getElementById('world');
  const stageEl = document.getElementById('stage');
  const params = new URLSearchParams(location.search);
  const SHOT = params.has('shot'); // 截圖模式：不播轉場，所有動畫即時完成

  const state = { index: -1, step: 0, busy: false, transit: null, pending: null, lite: false };
  const channel = 'BroadcastChannel' in window ? new BroadcastChannel('ict-talk') : null;
  const t0 = Date.now();

  // ---------- 舞台縮放 ----------
  function fit() {
    const s = Math.min(innerWidth / 1920, innerHeight / 1080);
    stageEl.style.transform = `translate(-50%, -50%) scale(${s})`;
    state.scale = s;
  }
  addEventListener('resize', fit); fit();

  // ---------- 建立各站的容器 ----------
  stations.forEach((st, i) => {
    const root = document.createElement('section');
    root.className = `station st-${st.id}`;
    root.dataset.id = st.id;
    root.setAttribute('aria-label', st.title || st.id);
    if (st.accent) root.style.setProperty('--accent', st.accent);
    world.appendChild(root);
    st._root = root; st._i = i;
  });

  // ---------- 每站獨立的 ctx（離開時自動清理） ----------
  function makeScope(st) {
    const anims = new Set(), cleanups = [], rafs = new Set();
    const scope = {
      ...env,
      station: st,
      app: api,
      instant: false,
      /** 建立會被自動清理的 timeline */
      tl(opts) { const t = gsap.timeline(opts); anims.add(t); return t; },
      /** 登記動畫／tween，離開時自動 kill */
      track(a) { if (a) anims.add(a); return a; },
      /** 離開時執行的清理函數 */
      onCleanup(fn) { cleanups.push(fn); },
      /** 每幀執行 fn(dtSeconds, timeSeconds)，離開時自動停止 */
      raf(fn) {
        let last = performance.now(), id;
        const loop = now => { id = requestAnimationFrame(loop); rafs.add(id); fn(Math.min(0.05, (now - last) / 1000), now / 1000); last = now; };
        id = requestAnimationFrame(loop); rafs.add(id);
        const stop = () => cancelAnimationFrame(id);
        cleanups.push(stop); return stop;
      },
      /** 每隔 sec 秒重複（用 GSAP 計時，截圖模式亦適用） */
      every(sec, fn) { const d = gsap.delayedCall(sec, function tick() { fn(); d.restart(true); }); anims.add(d); return d; },
      /** 加入事件監聽，離開時自動移除 */
      listen(target, type, fn, o) { target.addEventListener(type, fn, o); cleanups.push(() => target.removeEventListener(type, fn, o)); },
      /** 若在即時模式則直接跳到完結 */
      play(t) { if (scope.instant && t && t.progress) t.progress(1); return t; },
      dispose() {
        anims.forEach(a => { try { a.kill(); } catch (e) { /* 忽略 */ } });
        rafs.forEach(id => cancelAnimationFrame(id));
        cleanups.splice(0).forEach(fn => { try { fn(); } catch (e) { console.warn(e); } });
        anims.clear(); rafs.clear();
      },
    };
    return scope;
  }

  function buildStation(st) {
    if (st._scope) st._scope.dispose();
    gsap.killTweensOf(st._root.querySelectorAll('*'));
    st._root.innerHTML = '';
    st._root.className = `station st-${st.id}`;
    st._scope = makeScope(st);
    try { st.build && st.build(st._root, st._scope); }
    catch (e) { showError(st, e); }
  }
  function callSafe(st, fn, ...args) {
    try { return fn && fn.call(st, st._root, st._scope, ...args); }
    catch (e) { console.error(`[${st.id}]`, e); showError(st, e); }
  }
  function showError(st, e) {
    console.error(`站「${st.id}」出錯`, e);
    toast(`站「${st.title || st.id}」出現錯誤，請按 → 繼續`);
  }
  function teardown(st) {
    if (!st || !st._scope) return;
    callSafe(st, st.leave);
    st._scope.dispose();
    st._root.classList.remove('is-active', 'is-transit');
    if (!st.persist) st._root.innerHTML = '';
    st._scope = null;
  }

  // ---------- 焦點（鏡頭穿越點） ----------
  function focusPoint(outer, selector) {
    if (!selector || !outer) return { x: 960, y: 540 };
    if (typeof selector === 'object') return selector;
    const el = outer._root.querySelector(selector);
    if (!el) return { x: 960, y: 540 };
    const r = el.getBoundingClientRect(), s = stageEl.getBoundingClientRect();
    const k = state.scale || 1;
    return { x: (r.left + r.width / 2 - s.left) / k, y: (r.top + r.height / 2 - s.top) / k };
  }

  // ---------- 前往某一站 ----------
  function go(index, opts = {}) {
    index = Math.max(0, Math.min(stations.length - 1, index));
    if (state.transit) { state.transit.progress(1); }
    const from = stations[state.index];
    const to = stations[index];
    const dir = opts.dir ?? (index >= state.index ? 1 : -1);
    const steps = opts.atStep ?? (opts.fromEnd ? (to.steps || 0) : 0);

    gsap.set(to._root, { clearProps: 'transform,opacity,filter,clipPath' });
    buildStation(to);
    to._root.classList.add('is-transit');
    applyStationChrome(to, steps);

    const land = () => {
      to._scope.instant = !!opts.instant || SHOT || steps > 0;
      callSafe(to, to.enter, { instant: to._scope.instant, dir });
      for (let k = 1; k <= steps; k++) callSafe(to, to.step, k, { instant: true });
      to._scope.instant = false;
      state.step = steps;
      broadcast();
    };

    state.index = index; state.step = steps;
    updateHash();

    if (!from || from === to || SHOT || opts.cut) {
      if (from && from !== to) teardown(from);
      to._root.classList.remove('is-transit'); to._root.classList.add('is-active');
      land();
      return;
    }

    // 轉場：前進用目的站的設定；後退用離開那站設定的反向
    let t, outer;
    if (dir > 0 && to._i === from._i + 1) { t = to.transition || { type: 'fade' }; }
    else if (dir < 0 && from._i === to._i + 1) { t = reverseOf(from.transition || { type: 'fade' }); }
    else { t = { type: dir > 0 ? 'orbit' : 'orbitBack' }; }
    // focus 永遠在「外層世界」：zoomIn 時外層是 from，zoomOut 時外層是 to
    if (t.type === 'zoomIn') outer = from; else if (t.type === 'zoomOut') outer = to;
    const focus = focusPoint(outer, t.focus);

    from._root.classList.remove('is-active'); from._root.classList.add('is-transit');
    state.busy = true;
    state.transit = runTransition(t, from._root, to._root, {
      ...env, focus,
      onLand: land,
    });
    state.transit.eventCallback('onComplete', () => {
      gsap.set([from._root, to._root], { clearProps: 'transform,opacity,filter,clipPath,transformOrigin' });
      teardown(from);
      to._root.classList.remove('is-transit'); to._root.classList.add('is-active');
      state.transit = null; state.busy = false;
    });
  }

  function next() {
    if (state.transit) { state.transit.progress(1); return; }
    const st = stations[state.index];
    if (st && state.step < (st.steps || 0)) {
      state.step++;
      callSafe(st, st.step, state.step, { instant: false });
      updateProgress(); broadcast(); updateHash();
    } else if (state.index < stations.length - 1) {
      go(state.index + 1, { dir: 1 });
    }
  }
  function prev() {
    if (state.transit) { state.transit.progress(1); return; }
    const st = stations[state.index];
    if (state.step > 0) {
      // 重建本站並即時回到上一步
      go(state.index, { cut: true, atStep: state.step - 1 });
    } else if (state.index > 0) {
      go(state.index - 1, { dir: -1, fromEnd: true });
    }
  }

  // ---------- HUD ----------
  const meter = document.getElementById('meter');
  const meterMarker = document.getElementById('meterMarker');
  const meterScale = document.getElementById('meterScale');
  const meterLayer = document.getElementById('meterLayer');
  const ticks = document.getElementById('meterTicks');
  [[7, '10⁷ m'], [4, '10⁴ m'], [0, '1 m'], [-3, '1 mm'], [-6, '1 µm'], [-9, '1 nm']].forEach(([e, label]) => {
    const s = document.createElement('span');
    s.style.top = ((EXP_TOP - e) / (EXP_TOP - EXP_BOTTOM) * 100) + '%';
    s.textContent = label; ticks.appendChild(s);
  });
  let lastLayer = null;
  function applyStationChrome(st, step) {
    document.body.style.setProperty('--accent', st.accent || 'var(--mod-a)');
    document.getElementById('crumbMod').textContent = st.module || '';
    document.getElementById('crumbTitle').textContent = st.title || '';
    const L = st.layer && LAYERS[st.layer];
    meter.classList.toggle('is-hidden', !L || st.hud === false);
    if (L && st.layer !== lastLayer) {
      const y = (EXP_TOP - L.exp) / (EXP_TOP - EXP_BOTTOM) * 300;
      gsap.to(meterMarker, { top: y, duration: 1.4, ease: 'expo.inOut' });
      gsap.to(meterScale, { duration: 1.2, scrambleText: { text: L.scale, chars: '0123456789', speed: 0.5 } });
      meterLayer.textContent = L.name;
      lastLayer = st.layer;
    }
    document.getElementById('hud').style.display = st.hud === 'none' ? 'none' : '';
    if (st.tint && env.bg) env.bg.setTint(st.tint[0], st.tint[1]);
    updateProgress(step);
  }
  const progress = document.getElementById('progress');
  stations.forEach(() => progress.appendChild(document.createElement('i')));
  function updateProgress() {
    [...progress.children].forEach((el, i) => { el.className = i < state.index ? 'done' : i === state.index ? 'now' : ''; });
    overview.querySelectorAll('.ov-node').forEach((n, i) => n.classList.toggle('now', i === state.index));
  }

  // ---------- 全景地圖 ----------
  const overview = document.getElementById('overview');
  const ovMap = document.getElementById('overviewMap');
  function buildOverview() {
    const bands = [['社會層', 0.06], ['網絡層', 0.2], ['介面層', 0.36], ['程式層', 0.55], ['數據層', 0.72], ['硬件層', 0.88]];
    ovMap.innerHTML = '';
    bands.forEach(([n, y]) => { const b = document.createElement('div'); b.className = 'ov-band'; b.style.top = (y * 100) + '%'; b.textContent = n; ovMap.appendChild(b); });
    const pts = stations.map((st, i) => {
      const x = 0.1 + 0.86 * (i / Math.max(1, stations.length - 1));
      const y = st.overviewY ?? (st.layer ? ({ world: 0.08, network: 0.22, surface: 0.38, code: 0.56, data: 0.72, chip: 0.88 })[st.layer] : 0.3);
      return [x, y];
    });
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const W = 1000, H = 1000;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('preserveAspectRatio', 'none');
    let d = '';
    pts.forEach(([x, y], i) => {
      const X = x * W, Y = y * H;
      if (!i) d += `M${X},${Y}`;
      else { const [px, py] = pts[i - 1]; const mx = (px * W + X) / 2; d += ` C${mx},${py * H} ${mx},${Y} ${X},${Y}`; }
    });
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none'); path.setAttribute('stroke', 'url(#ovg)'); path.setAttribute('stroke-width', '3'); path.setAttribute('vector-effect', 'non-scaling-stroke'); path.setAttribute('stroke-dasharray', '6 8');
    svg.innerHTML = '<defs><linearGradient id="ovg" x1="0" x2="1"><stop offset="0" stop-color="#22d3ee"/><stop offset=".5" stop-color="#a78bfa"/><stop offset="1" stop-color="#ff3d7f"/></linearGradient></defs>';
    svg.appendChild(path);
    ovMap.appendChild(svg);
    stations.forEach((st, i) => {
      const n = document.createElement('button');
      n.type = 'button'; n.className = 'ov-node';
      n.style.left = (pts[i][0] * 100) + '%'; n.style.top = (pts[i][1] * 100) + '%';
      if (st.accent) n.style.setProperty('--accent', st.accent);
      n.innerHTML = `<div class="n">${String(i + 1).padStart(2, '0')}${st.module ? ' · ' + st.module : ''}</div><div class="t">${st.short || st.title || st.id}</div>${st.layer ? `<div class="l">${LAYERS[st.layer].name}</div>` : ''}`;
      n.addEventListener('click', () => { toggleOverview(false); go(i); });
      ovMap.appendChild(n);
    });
    ovMap._path = path;
  }
  function toggleOverview(show) {
    const on = show ?? overview.hidden;
    if (on) {
      if (!ovMap.childElementCount) buildOverview();
      overview.hidden = false; updateProgress();
      gsap.fromTo(overview, { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'expo.out' });
      gsap.fromTo(ovMap.querySelectorAll('.ov-node'), { opacity: 0, y: 30 }, { opacity: 1, y: 0, stagger: 0.025, duration: 0.5, ease: 'back.out(2)' });
      if (ovMap._path) gsap.fromTo(ovMap._path, { strokeDashoffset: 400 }, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.out' });
      env.sfx.play('whooshOut');
    } else if (!overview.hidden) {
      gsap.to(overview, { opacity: 0, scale: 1.05, duration: 0.35, onComplete: () => { overview.hidden = true; } });
    }
  }

  // ---------- 提示 ----------
  let toastTimer;
  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  // ---------- 鍵盤 ----------
  function isTyping(e) { return e.target.closest && e.target.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""]'); }
  addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (isTyping(e)) { e.target.blur(); return; }
      if (!document.getElementById('help').hidden) { document.getElementById('help').hidden = true; return; }
      if (!overview.hidden) { toggleOverview(false); return; }
      return;
    }
    if (isTyping(e) || e.ctrlKey || e.metaKey || e.altKey) return;
    const st = stations[state.index];
    if (st && st.onKey && !state.transit && callSafe(st, st.onKey, e) === true) { e.preventDefault(); return; }
    const k = e.key;
    if (!document.getElementById('blackout').hidden && !['b', 'B', '.'].includes(k)) { document.getElementById('blackout').hidden = true; e.preventDefault(); return; }
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(k)) { e.preventDefault(); if (!overview.hidden) toggleOverview(false); next(); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(k)) { e.preventDefault(); prev(); }
    else if (k === 'Home') go(0);
    else if (k === 'End') go(stations.length - 1);
    else if (k === 'o' || k === 'O') toggleOverview();
    else if (k === 'f' || k === 'F') toggleFullscreen();
    else if (k === 'm' || k === 'M') toggleSound();
    else if (k === 'n' || k === 'N') openNotes();
    else if (k === 'p' || k === 'P') toggleLite();
    else if (k === 'b' || k === 'B' || k === '.') { const b = document.getElementById('blackout'); b.hidden = !b.hidden; }
    else if (k === '?' || k === '/') { const h = document.getElementById('help'); h.hidden = !h.hidden; }
    else if (/^Digit[0-9]$/.test(e.code)) {
      let n = Number(e.code.slice(5)); n = n === 0 ? 10 : n;
      if (e.shiftKey) n += 10;
      if (n <= stations.length) go(n - 1);
    }
  });

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => toast('瀏覽器不允許全螢幕'));
    else document.exitFullscreen?.();
  }
  function toggleSound() {
    const on = env.sfx.toggle();
    document.getElementById('btnSound').classList.toggle('off', !on);
    toast(on ? '音效：開' : '音效：關');
  }
  function toggleLite() {
    state.lite = !state.lite;
    document.body.classList.toggle('lite', state.lite);
    env.bg.setLite(state.lite);
    try { localStorage.setItem('ict-talk-lite', state.lite ? '1' : '0'); } catch (e) { /* 忽略 */ }
    toast(state.lite ? '效能模式：開（粒子較少）' : '效能模式：關');
  }
  let notesWin = null;
  function openNotes() {
    notesWin = window.open('notes.html', 'ict-talk-notes', 'width=900,height=700');
    if (!notesWin) toast('瀏覽器阻擋了彈出視窗，請允許後再按 N');
    setTimeout(broadcast, 800);
  }

  // ---------- 講者備註同步 ----------
  function broadcast() {
    if (!channel) return;
    const st = stations[state.index], nx = stations[state.index + 1];
    channel.postMessage({
      type: 'state', index: state.index, total: stations.length, step: state.step, steps: st?.steps || 0,
      id: st?.id, title: st?.title, module: st?.module, notes: st?.notes || '', minutes: st?.minutes || 1,
      next: nx ? nx.title : '（最後一站）', start: t0,
      plan: stations.map(s => ({ title: s.short || s.title, minutes: s.minutes || 1 })),
    });
  }
  if (channel) channel.onmessage = ev => {
    const m = ev.data || {};
    if (m.type === 'cmd') { if (m.cmd === 'next') next(); else if (m.cmd === 'prev') prev(); else if (m.cmd === 'goto') go(m.index); else if (m.cmd === 'hello') broadcast(); }
  };

  // ---------- 網址 ----------
  function updateHash() {
    if (SHOT) return;
    const st = stations[state.index];
    history.replaceState(null, '', `${location.pathname}${location.search}#${st.id}${state.step ? '/' + state.step : ''}`);
  }

  // ---------- 控制按鈕／游標 ----------
  document.getElementById('controls').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const a = b.dataset.act;
    if (a === 'next') next(); else if (a === 'prev') prev(); else if (a === 'overview') toggleOverview();
    else if (a === 'sound') toggleSound(); else if (a === 'notes') openNotes(); else if (a === 'fullscreen') toggleFullscreen();
    else if (a === 'help') { const h = document.getElementById('help'); h.hidden = !h.hidden; }
    b.blur();
  });
  document.getElementById('help').addEventListener('click', e => { if (e.target.id === 'help') e.currentTarget.hidden = true; });
  let idle;
  addEventListener('pointermove', () => {
    document.body.classList.add('show-controls'); document.body.style.cursor = '';
    clearTimeout(idle); idle = setTimeout(() => { document.body.classList.remove('show-controls'); if (!SHOT) document.body.style.cursor = 'none'; }, 2500);
  });
  document.getElementById('btnSound').classList.toggle('off', !env.sfx.enabled);

  const api = {
    go, next, prev, toast, toggleOverview,
    get index() { return state.index; }, get step() { return state.step; },
    get scale() { return state.scale; },
    stations,
    start() {
      try { if (localStorage.getItem('ict-talk-lite') === '1') { state.lite = true; document.body.classList.add('lite'); env.bg.setLite(true); } } catch (e) { /* 忽略 */ }
      // 起點：?station=id&step=n 或 #id/n
      const hash = location.hash.slice(1).split('/');
      const qid = params.get('station') || hash[0];
      const qstep = Number(params.get('step') ?? hash[1] ?? 0) || 0;
      let i = stations.findIndex(s => s.id === qid);
      if (i < 0) i = 0;
      go(i, { cut: true, atStep: Math.min(qstep, stations[i].steps || 0) });
      if (SHOT) document.body.classList.add('shot');
    },
  };
  return api;
}
