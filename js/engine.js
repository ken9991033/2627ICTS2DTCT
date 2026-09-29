/* ============================================================
 * engine.js — 花階磚繪圖引擎
 * 形狀、對稱（演算法）、繪圖、地板拼法、設計分析、隨機靈感
 * 設計座標：一塊磚由 -100 至 100（y 向下，和 Scratch 一樣「右轉」= 順時針）
 * ============================================================ */
(function (global) {
  'use strict';

  const TAU = Math.PI * 2;
  const DEG = Math.PI / 180;
  const HALF = 100;

  /* ---------------- 形狀庫 ---------------- */
  // 每個形狀都畫在「單位座標」內（大約 -1 至 1），之後再按大小、角度、位置放到磚上。
  const SHAPE_LIST = [
    { type: 'circle', name: '圓形', size: 14 },
    { type: 'ring', name: '圓環', size: 20 },
    { type: 'petal', name: '花瓣', size: 22 },
    { type: 'leaf', name: '葉子', size: 20 },
    { type: 'flower', name: '小花', size: 18 },
    { type: 'heart', name: '心形', size: 16 },
    { type: 'star4', name: '星芒', size: 18 },
    { type: 'star8', name: '八角星', size: 20 },
    { type: 'diamond', name: '菱形', size: 16 },
    { type: 'square', name: '正方形', size: 14 },
    { type: 'triangle', name: '三角形', size: 16 },
    { type: 'cross', name: '十字', size: 14 },
    { type: 'semicircle', name: '半圓', size: 18 },
    { type: 'arch', name: '拱形', size: 22 },
    { type: 'bar', name: '長條', size: 60, sx: 0.3 }
  ];
  const SHAPE_INFO = {};
  SHAPE_LIST.forEach(s => { SHAPE_INFO[s.type] = s; });

  const pathCache = {};

  function buildPath(type) {
    const p = new Path2D();
    switch (type) {
      case 'circle':
        p.arc(0, 0, 1, 0, TAU);
        break;
      case 'ring':
        // 外圈順時針、內圈逆時針 → 中間是空心
        p.arc(0, 0, 1, 0, TAU);
        p.moveTo(0.7, 0);
        p.arc(0, 0, 0.7, 0, TAU, true);
        break;
      case 'petal': {
        // 水滴形，尖端向上
        const cy = 0.35, r = 0.62, d = cy + 1;
        const beta = Math.acos(r / d);
        const a1 = -Math.PI / 2 + beta, a2 = -Math.PI / 2 - beta;
        p.moveTo(0, -1);
        p.lineTo(r * Math.cos(a1), cy + r * Math.sin(a1));
        p.arc(0, cy, r, a1, a2 + TAU, false);
        p.closePath();
        break;
      }
      case 'leaf': {
        // 杏仁形，兩端尖
        const w = 0.5, c = (w * w - 1) / (2 * w), R = w - c;
        const a = Math.atan2(1, -c);
        p.moveTo(0, -1);
        p.arc(c, 0, R, -a, a, false);
        p.arc(-c, 0, R, Math.PI - a, Math.PI + a, false);
        p.closePath();
        break;
      }
      case 'flower':
        for (let i = 0; i < 4; i++) {
          const a = i * Math.PI / 2 - Math.PI / 2;
          const cx = 0.5 * Math.cos(a), cy = 0.5 * Math.sin(a);
          p.moveTo(cx + 0.5 * Math.cos(a), cy + 0.5 * Math.sin(a));
          p.ellipse(cx, cy, 0.5, 0.34, a, 0, TAU);
        }
        p.moveTo(0.3, 0);
        p.arc(0, 0, 0.3, 0, TAU);
        break;
      case 'heart':
        p.moveTo(0, 0.9);
        p.bezierCurveTo(-0.1, 0.8, -1, 0.35, -1, -0.25);
        p.bezierCurveTo(-1, -0.7, -0.6, -0.95, -0.32, -0.95);
        p.bezierCurveTo(-0.12, -0.95, 0, -0.8, 0, -0.62);
        p.bezierCurveTo(0, -0.8, 0.12, -0.95, 0.32, -0.95);
        p.bezierCurveTo(0.6, -0.95, 1, -0.7, 1, -0.25);
        p.bezierCurveTo(1, 0.35, 0.1, 0.8, 0, 0.9);
        p.closePath();
        break;
      case 'star4':
        p.moveTo(0, -1);
        p.quadraticCurveTo(0.14, -0.14, 1, 0);
        p.quadraticCurveTo(0.14, 0.14, 0, 1);
        p.quadraticCurveTo(-0.14, 0.14, -1, 0);
        p.quadraticCurveTo(-0.14, -0.14, 0, -1);
        p.closePath();
        break;
      case 'star8':
        for (let i = 0; i < 16; i++) {
          const r = i % 2 ? 0.7654 : 1;
          const a = -Math.PI / 2 + i * Math.PI / 8;
          if (i === 0) p.moveTo(r * Math.cos(a), r * Math.sin(a));
          else p.lineTo(r * Math.cos(a), r * Math.sin(a));
        }
        p.closePath();
        break;
      case 'diamond':
        p.moveTo(0, -1); p.lineTo(0.62, 0); p.lineTo(0, 1); p.lineTo(-0.62, 0);
        p.closePath();
        break;
      case 'square':
        p.rect(-0.72, -0.72, 1.44, 1.44);
        break;
      case 'triangle':
        p.moveTo(0, -1); p.lineTo(0.866, 0.5); p.lineTo(-0.866, 0.5);
        p.closePath();
        break;
      case 'cross': {
        const w = 0.3;
        p.moveTo(-w, -1); p.lineTo(w, -1); p.lineTo(w, -w); p.lineTo(1, -w); p.lineTo(1, w);
        p.lineTo(w, w); p.lineTo(w, 1); p.lineTo(-w, 1); p.lineTo(-w, w); p.lineTo(-1, w);
        p.lineTo(-1, -w); p.lineTo(-w, -w);
        p.closePath();
        break;
      }
      case 'semicircle':
        p.arc(0, 0.5, 1, Math.PI, TAU);
        p.closePath();
        break;
      case 'arch':
        p.arc(0, 0.5, 1, Math.PI, TAU);
        p.lineTo(0.62, 0.5);
        p.arc(0, 0.5, 0.62, TAU, Math.PI, true);
        p.closePath();
        break;
      case 'bar':
        p.rect(-0.12, -1, 0.24, 2);
        break;
      default:
        p.arc(0, 0, 1, 0, TAU);
    }
    return p;
  }

  function shapePath(type) {
    if (!pathCache[type]) pathCache[type] = buildPath(type);
    return pathCache[type];
  }

  /* ---------------- 對稱（演算法） ---------------- */
  // algo = { n: 重複次數, angle: 每次右轉幾度, mirror: 是否加鏡像 }
  // 回傳一組 2×2 變換：先（可能）左右翻轉，再旋轉。
  function symTransforms(algo) {
    const out = [];
    const n = Math.max(1, Math.min(24, algo.n | 0));
    const ang = Number(algo.angle) || 0;
    for (let i = 0; i < n; i++) {
      const phi = i * ang * DEG;
      const c = Math.cos(phi), s = Math.sin(phi);
      out.push({ a: c, b: s, c: -s, d: c, m: false, i, phi });
      if (algo.mirror) out.push({ a: -c, b: -s, c: -s, d: c, m: true, i, phi });
    }
    return out;
  }
  function applyT(T, x, y) { return { x: T.a * x + T.c * y, y: T.b * x + T.d * y }; }
  function invT(T) { return { a: T.a, b: T.c, c: T.b, d: T.d, m: T.m, i: T.i, phi: -T.phi }; }

  function algoFor(design) {
    const a = design.algo || { n: 4, mirror: true };
    const n = Math.max(1, a.n | 0);
    return { n, angle: 360 / n, mirror: !!a.mirror };
  }

  // 基本區域（要自己畫的部分）：由向上方向開始的扇形
  function wedgeAngles(algo) {
    const n = Math.max(1, algo.n | 0);
    const span = n === 1 ? (algo.mirror ? 180 : 360) : (algo.mirror ? 180 / n : 360 / n);
    return { start: -90, span };
  }

  /* ---------------- 顏色 ---------------- */
  function paletteMap() {
    const m = {};
    (global.CONTENT && global.CONTENT.palette || []).forEach(p => { m[p.key] = p; });
    return m;
  }
  let PAL = null;
  function pal() { return PAL || (PAL = paletteMap()); }
  function colorHex(key) { const p = pal()[key]; return p ? p.hex : '#888888'; }
  function colorName(key) { const p = pal()[key]; return p ? p.name : key; }

  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    const v = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
  }
  function relLum(hex) {
    const { r, g, b } = hexToRgb(hex);
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  }
  function contrastRatio(h1, h2) {
    const a = relLum(h1), b = relLum(h2);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  }
  function saturation(hex) {
    const { r, g, b } = hexToRgb(hex);
    const mx = Math.max(r, g, b) / 255, mn = Math.min(r, g, b) / 255;
    const l = (mx + mn) / 2;
    if (mx === mn) return 0;
    return l > 0.5 ? (mx - mn) / (2 - mx - mn) : (mx - mn) / (mx + mn);
  }

  /* ---------------- 設計資料 ---------------- */
  let uid = 1;
  function newId() { return 's' + Date.now().toString(36) + (uid++).toString(36); }

  function blankDesign() {
    return {
      bg: 'cream',
      algo: { n: 4, mirror: true },
      shapes: [],
      heights: {},
      product: 'coaster',
      rounded: false,
      floorRule: 'same'
    };
  }
  function cloneDesign(d) { return JSON.parse(JSON.stringify(d)); }

  function makeShape(type, x, y, color, extra) {
    const info = SHAPE_INFO[type] || { size: 16 };
    return Object.assign({
      id: newId(), type, x, y,
      size: info.size, sx: info.sx || 1, rot: 0,
      color: color || 'red'
    }, extra || {});
  }

  function isRoundProduct(design) {
    const p = global.CONTENT.products[design.product];
    return p && p.outline === 'circle';
  }

  /* ---------------- 繪圖 ---------------- */
  function shapeMatrix(s) {
    // 單位座標 → 設計座標（未計對稱）
    const r = (s.rot || 0) * DEG, c = Math.cos(r), sn = Math.sin(r);
    const w = s.size * (s.sx || 1), h = s.size;
    return { a: c * w, b: sn * w, c: -sn * h, d: c * h, e: s.x, f: s.y };
  }

  function drawShape(ctx, s, T) {
    ctx.save();
    if (T) ctx.transform(T.a, T.b, T.c, T.d, 0, 0);
    const M = shapeMatrix(s);
    ctx.transform(M.a, M.b, M.c, M.d, M.e, M.f);
    ctx.fill(shapePath(s.type));
    ctx.restore();
  }

  function clipPathFor(design, product) {
    const p = new Path2D();
    const prod = product || global.CONTENT.products[design.product] || { outline: 'square' };
    if (prod.outline === 'circle') {
      p.arc(0, 0, HALF, 0, TAU);
    } else if (design.rounded) {
      const r = (prod.roundedCorner || 8) / prod.size * 200;
      roundRectPath(p, -HALF, -HALF, 2 * HALF, 2 * HALF, r);
    } else {
      p.rect(-HALF, -HALF, 2 * HALF, 2 * HALF);
    }
    return p;
  }
  function roundRectPath(p, x, y, w, h, r) {
    p.moveTo(x + r, y);
    p.lineTo(x + w - r, y); p.arcTo(x + w, y, x + w, y + r, r);
    p.lineTo(x + w, y + h - r); p.arcTo(x + w, y + h, x + w - r, y + h, r);
    p.lineTo(x + r, y + h); p.arcTo(x, y + h, x, y + h - r, r);
    p.lineTo(x, y + r); p.arcTo(x, y, x + r, y, r);
    p.closePath();
  }

  let noiseCanvas = null;
  function noise() {
    if (noiseCanvas) return noiseCanvas;
    const c = document.createElement('canvas');
    c.width = c.height = 160;
    const g = c.getContext('2d');
    const img = g.createImageData(160, 160);
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 200 + Math.floor(rnd() * 55);
      const speck = rnd() < 0.012 ? -90 : 0;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = Math.max(0, v + speck);
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    noiseCanvas = c;
    return c;
  }

  // 在 ctx 上畫一塊磚。呼叫前 ctx 應已設定好：設計座標 (-100..100) 對應到目標位置。
  // opts: { texture: 0..1, colorOf: key => css color, bgColor, clip: true }
  function renderTile(ctx, design, opts) {
    opts = opts || {};
    const algo = opts.algo || algoFor(design);
    const Ts = symTransforms(algo);
    const colorOf = opts.colorOf || colorHex;
    ctx.save();
    if (opts.clip !== false) ctx.clip(clipPathFor(design));
    ctx.fillStyle = opts.bgColor || colorOf(design.bg);
    ctx.fillRect(-HALF - 2, -HALF - 2, 2 * HALF + 4, 2 * HALF + 4);
    const shapes = design.shapes || [];
    for (let k = 0; k < shapes.length; k++) {
      const s = shapes[k];
      if (opts.only && !opts.only(s)) continue;
      ctx.fillStyle = colorOf(s.color, s);
      for (let t = 0; t < Ts.length; t++) drawShape(ctx, s, Ts[t]);
    }
    if (opts.texture) {
      ctx.globalAlpha = opts.texture;
      ctx.globalCompositeOperation = 'multiply';
      const pat = ctx.createPattern(noise(), 'repeat');
      ctx.fillStyle = pat;
      ctx.fillRect(-HALF, -HALF, 2 * HALF, 2 * HALF);
      ctx.globalCompositeOperation = 'source-over';
      const g = ctx.createRadialGradient(0, 0, HALF * 0.55, 0, 0, HALF * 1.45);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(40,30,20,0.9)');
      ctx.globalAlpha = opts.texture * 1.4;
      ctx.fillStyle = g;
      ctx.fillRect(-HALF, -HALF, 2 * HALF, 2 * HALF);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  // 把一塊磚畫成一張獨立圖片（canvas）
  function tileImage(design, px, opts) {
    const c = document.createElement('canvas');
    c.width = c.height = px;
    const g = c.getContext('2d');
    g.setTransform(px / 200, 0, 0, px / 200, px / 2, px / 2);
    renderTile(g, design, Object.assign({ texture: 0.1 }, opts || {}));
    return c;
  }

  /* ---------------- 地板拼法 ---------------- */
  // 每塊磚按「行、列」決定要不要旋轉或翻轉
  function floorCell(rule, r, c, rng) {
    switch (rule) {
      case 'alt': return { rot: ((r + c) % 2) ? 90 : 0, fx: false, fy: false };
      case 'pinwheel': return { rot: [[0, 90], [270, 180]][r % 2][c % 2], fx: false, fy: false };
      case 'mirror': return { rot: 0, fx: c % 2 === 1, fy: r % 2 === 1 };
      case 'random': return { rot: 90 * Math.floor((rng ? rng() : Math.random()) * 4), fx: false, fy: false };
      default: return { rot: 0, fx: false, fy: false };
    }
  }

  function seededRng(seed) {
    let s = (seed >>> 0) || 1;
    return function () {
      s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0;
      return (s >>> 0) / 4294967296;
    };
  }

  // 畫地板：tileCanvas 是一塊磚的圖片
  function renderFloor(ctx, tileCanvas, o) {
    const rows = o.rows, cols = o.cols, cell = o.cell, gap = o.gap || 0;
    const rng = seededRng(o.seed || 12345);
    ctx.save();
    ctx.fillStyle = o.grout || '#CFC9BD';
    ctx.fillRect(o.x || 0, o.y || 0, cols * cell + (cols + 1) * gap, rows * cell + (rows + 1) * gap);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (o.limit != null && r * cols + c >= o.limit) continue;
        const f = floorCell(o.rule, r, c, rng);
        const cx = (o.x || 0) + gap + c * (cell + gap) + cell / 2;
        const cy = (o.y || 0) + gap + r * (cell + gap) + cell / 2;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(f.rot * DEG);
        ctx.scale(f.fx ? -1 : 1, f.fy ? -1 : 1);
        ctx.drawImage(tileCanvas, -cell / 2, -cell / 2, cell, cell);
        ctx.restore();
      }
    }
    ctx.restore();
  }

  /* ---------------- 點擊測試 ---------------- */
  let hitCtx = null;
  function hctx() {
    if (!hitCtx) hitCtx = document.createElement('canvas').getContext('2d');
    return hitCtx;
  }
  function pointInShape(s, x, y) {
    const M = shapeMatrix(s);
    // 反向變換
    const det = M.a * M.d - M.b * M.c;
    if (Math.abs(det) < 1e-9) return false;
    const dx = x - M.e, dy = y - M.f;
    const ux = (M.d * dx - M.c * dy) / det;
    const uy = (-M.b * dx + M.a * dy) / det;
    if (ux * ux + uy * uy > 2.2) return false;
    return hctx().isPointInPath(shapePath(s.type), ux, uy);
  }
  // 由最上層開始找：回傳 { index, T }（T 是被點中的那個複本）
  function hitTest(design, x, y, slack) {
    const Ts = symTransforms(algoFor(design));
    const shapes = design.shapes;
    for (let k = shapes.length - 1; k >= 0; k--) {
      const s = shapes[k];
      for (let t = 0; t < Ts.length; t++) {
        const inv = invT(Ts[t]);
        const p = applyT(inv, x, y);
        if (pointInShape(s, p.x, p.y)) return { index: k, T: Ts[t] };
      }
    }
    if (slack) {
      // 很細的形狀：用距離中心點判斷
      let best = null, bestD = slack;
      for (let k = shapes.length - 1; k >= 0; k--) {
        const s = shapes[k];
        for (let t = 0; t < Ts.length; t++) {
          const c = applyT(Ts[t], s.x, s.y);
          const d = Math.hypot(c.x - x, c.y - y);
          if (d < bestD) { bestD = d; best = { index: k, T: Ts[t] }; }
        }
      }
      return best;
    }
    return null;
  }

  /* ---------------- 對齊輔助 ---------------- */
  function snapPoint(design, x, y, strength) {
    const th = strength || 5;
    const pts = [[0, 0]];
    if (!isRoundProduct(design)) {
      pts.push([HALF, HALF], [HALF, -HALF], [-HALF, HALF], [-HALF, -HALF],
        [0, HALF], [0, -HALF], [HALF, 0], [-HALF, 0]);
    }
    for (const [px, py] of pts) {
      if (Math.hypot(px - x, py - y) < th * 1.3) return { x: px, y: py, snapped: 'point' };
    }
    const algo = algoFor(design);
    const lines = [];
    if (algo.mirror) {
      for (let k = 0; k < algo.n; k++) lines.push(-90 + k * 180 / algo.n);
    } else {
      lines.push(-90, 0);
    }
    let best = null, bestD = th;
    for (const deg of lines) {
      const ux = Math.cos(deg * DEG), uy = Math.sin(deg * DEG);
      const t = x * ux + y * uy;
      const qx = t * ux, qy = t * uy;
      const d = Math.hypot(qx - x, qy - y);
      if (d < bestD) { bestD = d; best = { x: qx, y: qy, snapped: 'line' }; }
    }
    return best || { x, y, snapped: null };
  }

  /* ---------------- 分析設計（自動檢查用） ---------------- */
  function usedColors(design) {
    const set = new Set([design.bg]);
    (design.shapes || []).forEach(s => set.add(s.color));
    return Array.from(set);
  }
  function levelOf(design, key) {
    if (design.heights && design.heights[key] != null) return design.heights[key];
    return key === design.bg ? 0 : 1;
  }
  function bestContrast(design) {
    const bgHex = colorHex(design.bg);
    let best = 1;
    (design.shapes || []).forEach(s => {
      best = Math.max(best, contrastRatio(bgHex, colorHex(s.color)));
    });
    return best;
  }
  function touchesEdge(design) {
    const Ts = symTransforms(algoFor(design));
    return (design.shapes || []).some(s => {
      const r = s.size * Math.max(1, s.sx || 1);
      return Ts.some(T => {
        const c = applyT(T, s.x, s.y);
        return Math.abs(c.x) + r * 0.6 > HALF || Math.abs(c.y) + r * 0.6 > HALF;
      });
    });
  }
  function minFeature(design) {
    let m = Infinity;
    (design.shapes || []).forEach(s => {
      const thin = { bar: 0.24, ring: 0.3, arch: 0.38, leaf: 1, petal: 1.2, star4: 0.5 }[s.type] || 1.2;
      const w = s.size * Math.min(1, s.sx || 1) * thin;
      m = Math.min(m, w, s.size * 1.2);
    });
    return m;
  }

  /* ---------------- 隨機靈感 ---------------- */
  // 傳統花階磚常見的配色（背景 + 2–3 種圖案顏色）
  const SCHEMES = [
    ['cream', 'red', 'green', 'ochre'], ['cream', 'blue', 'sky', 'black'], ['cream', 'green', 'mint', 'ochre'],
    ['rose', 'cream', 'green', 'ochre'], ['sky', 'blue', 'cream', 'ochre'], ['grey', 'red', 'cream', 'black'],
    ['green', 'cream', 'ochre', 'mint'], ['red', 'cream', 'ochre', 'black'], ['blue', 'cream', 'sky', 'ochre'],
    ['mint', 'green', 'cream', 'red'], ['cream', 'black', 'red', 'grey'], ['ochre', 'cream', 'green', 'red']
  ];

  function randomDesign(seed, base) {
    const rng = seededRng(seed || Date.now());
    const pick = arr => arr[Math.floor(rng() * arr.length)];
    const P = global.CONTENT.palette.map(p => p.key);
    const ok = SCHEMES.filter(sc => sc.every(k => P.indexOf(k) >= 0));
    let bg, cols;
    if (ok.length) {
      const sc = pick(ok);
      bg = sc[0];
      cols = sc.slice(1).sort(() => rng() - 0.5);
    } else {
      bg = P[0];
      cols = P.filter(k => k !== bg && contrastRatio(colorHex(k), colorHex(bg)) > 2.2).slice(0, 3);
    }
    const d = Object.assign(blankDesign(), base || {});
    d.bg = bg;
    d.shapes = [];
    const n = (d.algo && d.algo.n) || 4;
    const mirror = d.algo ? !!d.algo.mirror : true;
    const w = wedgeAngles({ n, mirror });
    const round = isRoundProduct(d);
    const polar = (deg, r) => ({ x: Math.round(Math.cos(deg * DEG) * r), y: Math.round(Math.sin(deg * DEG) * r) });
    const outward = deg => Math.round((deg + 90) / 15) * 15;
    // 1. 中心
    const cType = pick(['circle', 'star8', 'flower', 'star4', 'ring', 'square']);
    d.shapes.push(makeShape(cType, 0, 0, cols[0], { size: 11 + Math.round(rng() * 13), rot: cType === 'square' ? 45 : pick([0, 45]) }));
    if (rng() < 0.5) d.shapes.push(makeShape('circle', 0, 0, cols[1] || cols[0], { size: 4 + Math.round(rng() * 4) }));
    // 2. 主圖案：放在對稱軸上，尖端向外
    const mainType = pick(['petal', 'leaf', 'heart', 'diamond', 'petal', 'arch', 'semicircle', 'leaf']);
    const r1 = 30 + rng() * 18;
    const m1 = polar(w.start, r1);
    d.shapes.push(makeShape(mainType, m1.x, m1.y, cols[1] || cols[0], {
      size: 15 + Math.round(rng() * 12), sx: mainType === 'leaf' ? 0.85 : 1,
      rot: mainType === 'arch' || mainType === 'semicircle' ? outward(w.start) + 180 : outward(w.start)
    }));
    // 3. 第二條軸（萬花筒的斜線）
    if (mirror && n >= 3 && rng() < 0.7) {
      const a2 = w.start + w.span;
      const q = polar(a2, 38 + rng() * 22);
      const t2 = pick(['leaf', 'petal', 'diamond', 'circle']);
      d.shapes.push(makeShape(t2, q.x, q.y, cols[2] || cols[0], { size: 9 + Math.round(rng() * 9), sx: t2 === 'leaf' ? 0.8 : 1, rot: outward(a2) }));
    }
    // 4. 點綴
    const extra = 1 + Math.floor(rng() * 2);
    for (let i = 0; i < extra; i++) {
      const a = w.start + w.span * (0.3 + rng() * 0.4);
      const q = polar(a, 55 + rng() * (round ? 25 : 30));
      d.shapes.push(makeShape(pick(['circle', 'diamond', 'circle', 'star4']), q.x, q.y, pick(cols), { size: 4 + Math.round(rng() * 6), rot: outward(a) }));
    }
    if (!round) {
      // 5. 角落（四塊磚拼起來會變成完整圖案）
      if (rng() < 0.8) {
        const t = pick(['circle', 'ring', 'star8', 'flower', 'square', 'circle']);
        d.shapes.push(makeShape(t, HALF, -HALF, pick(cols), { size: 20 + Math.round(rng() * 20), rot: t === 'square' ? 45 : 0 }));
        if (t === 'ring' || rng() < 0.4) d.shapes.push(makeShape('circle', HALF, -HALF, pick(cols), { size: 8 + Math.round(rng() * 6) }));
      }
      // 6. 邊框
      if (rng() < 0.6) {
        d.shapes.push(makeShape('bar', 0, -HALF + 7 + Math.round(rng() * 6), pick(cols), { size: 100, sx: 0.14 + rng() * 0.08, rot: 90 }));
      }
    } else if (rng() < 0.7) {
      d.shapes.push(makeShape(pick(['circle', 'diamond', 'petal']), polar(w.start, 84).x, polar(w.start, 84).y, pick(cols), { size: 7 + Math.round(rng() * 5), rot: outward(w.start) }));
    }
    return d;
  }

  global.TileEngine = {
    TAU, DEG, HALF,
    SHAPE_LIST, SHAPE_INFO, shapePath,
    symTransforms, applyT, invT, algoFor, wedgeAngles,
    colorHex, colorName, hexToRgb, relLum, contrastRatio, saturation,
    blankDesign, cloneDesign, makeShape, newId, isRoundProduct,
    shapeMatrix, drawShape, renderTile, tileImage, clipPathFor, roundRectPath, noise,
    floorCell, renderFloor, seededRng,
    pointInShape, hitTest, snapPoint,
    usedColors, levelOf, bestContrast, touchesEdge, minFeature,
    randomDesign
  };
})(window);
