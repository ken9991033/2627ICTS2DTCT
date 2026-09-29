/* ============================================================
 * mesh.js — 由 2D 設計生成 3D 打印模型
 *   1. 每種顏色畫成一張黑白「遮罩」
 *   2. 用 Marching Squares 找出輪廓
 *   3. 把輪廓升高（顏色 → 高度）成為立體
 *   4. 匯出 STL（3D 打印機通用格式）
 * 單位：毫米；Z 軸向上。
 * ============================================================ */
(function (global) {
  'use strict';
  const E = global.TileEngine;

  function productOf(design) {
    const P = global.CONTENT.products;
    return P[design.product] || P.coaster;
  }

  /* ---------- 1. 遮罩 ---------- */
  function maskFor(design, key, N) {
    const c = document.createElement('canvas');
    c.width = c.height = N;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.fillStyle = '#000';
    g.fillRect(0, 0, N, N);
    g.setTransform(N / 200, 0, 0, N / 200, N / 2, N / 2);
    E.renderTile(g, design, { colorOf: k => (k === key ? '#fff' : '#000'), texture: 0 });
    const data = g.getImageData(0, 0, N, N).data;
    const f = new Float32Array(N * N);
    let count = 0;
    for (let i = 0, j = 0; i < f.length; i++, j += 4) {
      f[i] = data[j] / 255;
      if (f[i] > 0.5) count++;
    }
    return count > 2 ? f : null;
  }

  /* ---------- 2. Marching Squares ---------- */
  function marchingSquares(f, W, H, iso) {
    const val = (i, j) => (i < 0 || j < 0 || i >= W || j >= H) ? 0 : f[j * W + i];
    const KW = W + 2;
    const pos = new Map();
    const segs = [];
    const hKey = (i, j) => ((j + 1) * KW + (i + 1)) * 2;
    const vKey = (i, j) => ((j + 1) * KW + (i + 1)) * 2 + 1;
    function hP(i, j, v0, v1) {
      const k = hKey(i, j);
      if (!pos.has(k)) { const t = (iso - v0) / (v1 - v0); pos.set(k, [i + t + 0.5, j + 0.5]); }
      return k;
    }
    function vP(i, j, v0, v1) {
      const k = vKey(i, j);
      if (!pos.has(k)) { const t = (iso - v0) / (v1 - v0); pos.set(k, [i + 0.5, j + t + 0.5]); }
      return k;
    }
    for (let j = -1; j < H; j++) {
      for (let i = -1; i < W; i++) {
        const v0 = val(i, j), v1 = val(i + 1, j), v2 = val(i + 1, j + 1), v3 = val(i, j + 1);
        const idx = (v0 > iso ? 1 : 0) | (v1 > iso ? 2 : 0) | (v2 > iso ? 4 : 0) | (v3 > iso ? 8 : 0);
        if (idx === 0 || idx === 15) continue;
        const T = () => hP(i, j, v0, v1);
        const R = () => vP(i + 1, j, v1, v2);
        const B = () => hP(i, j + 1, v3, v2);
        const L = () => vP(i, j, v0, v3);
        switch (idx) {
          case 1: case 14: segs.push([L(), T()]); break;
          case 2: case 13: segs.push([T(), R()]); break;
          case 3: case 12: segs.push([L(), R()]); break;
          case 4: case 11: segs.push([R(), B()]); break;
          case 6: case 9: segs.push([T(), B()]); break;
          case 7: case 8: segs.push([L(), B()]); break;
          case 5:
            if ((v0 + v1 + v2 + v3) / 4 > iso) { segs.push([T(), R()]); segs.push([L(), B()]); }
            else { segs.push([L(), T()]); segs.push([R(), B()]); }
            break;
          case 10:
            if ((v0 + v1 + v2 + v3) / 4 > iso) { segs.push([L(), T()]); segs.push([R(), B()]); }
            else { segs.push([T(), R()]); segs.push([L(), B()]); }
            break;
        }
      }
    }
    // 把線段接成封閉輪廓
    const adj = new Map();
    segs.forEach((s, idx) => {
      for (const k of s) { const a = adj.get(k); if (a) a.push(idx); else adj.set(k, [idx]); }
    });
    const used = new Uint8Array(segs.length);
    const loops = [];
    for (let s0 = 0; s0 < segs.length; s0++) {
      if (used[s0]) continue;
      used[s0] = 1;
      const startKey = segs[s0][0];
      let cur = segs[s0][1];
      const pts = [pos.get(startKey), pos.get(cur)];
      let guard = 0;
      while (cur !== startKey && guard++ < 5e6) {
        const list = adj.get(cur);
        let next = -1;
        for (let q = 0; q < list.length; q++) if (!used[list[q]]) { next = list[q]; break; }
        if (next < 0) break;
        used[next] = 1;
        const sg = segs[next];
        cur = sg[0] === cur ? sg[1] : sg[0];
        if (cur !== startKey) pts.push(pos.get(cur));
      }
      if (pts.length >= 3) loops.push(pts);
    }
    return loops;
  }

  /* ---------- 簡化輪廓（Ramer–Douglas–Peucker） ---------- */
  function rdp(pts, eps) {
    const n = pts.length;
    if (n < 3) return pts.slice();
    const keep = new Uint8Array(n);
    keep[0] = keep[n - 1] = 1;
    const stack = [[0, n - 1]];
    while (stack.length) {
      const [s, e] = stack.pop();
      const ax = pts[s][0], ay = pts[s][1];
      const dx = pts[e][0] - ax, dy = pts[e][1] - ay;
      const len = Math.hypot(dx, dy) || 1e-9;
      let idx = -1, md = eps;
      for (let i = s + 1; i < e; i++) {
        const d = Math.abs((pts[i][0] - ax) * dy - (pts[i][1] - ay) * dx) / len;
        if (d > md) { md = d; idx = i; }
      }
      if (idx >= 0) { keep[idx] = 1; stack.push([s, idx], [idx, e]); }
    }
    const out = [];
    for (let i = 0; i < n; i++) if (keep[i]) out.push(pts[i]);
    return out;
  }
  function simplifyClosed(pts, eps) {
    if (pts.length < 10) return pts;
    let far = 0, fd = -1;
    for (let i = 1; i < pts.length; i++) {
      const d = (pts[i][0] - pts[0][0]) ** 2 + (pts[i][1] - pts[0][1]) ** 2;
      if (d > fd) { fd = d; far = i; }
    }
    const a = rdp(pts.slice(0, far + 1), eps);
    const b = rdp(pts.slice(far).concat([pts[0]]), eps);
    const out = a.slice(0, -1).concat(b.slice(0, -1));
    return out.length >= 3 ? out : pts;
  }

  function polyArea(p) {
    let a = 0;
    for (let i = 0, j = p.length - 1; i < p.length; j = i++) a += (p[j][0] + p[i][0]) * (p[j][1] - p[i][1]);
    return a / 2;
  }
  function bbox(p) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const q of p) { if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0]; if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1]; }
    return { x0, y0, x1, y1 };
  }
  function boxIn(inner, outer) {
    return inner.x0 >= outer.x0 && inner.x1 <= outer.x1 && inner.y0 >= outer.y0 && inner.y1 <= outer.y1;
  }
  function pointInPoly(pt, poly) {
    const x = pt[0], y = pt[1];
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  }

  // 輪廓 → THREE.Shape（外框 + 洞）
  function loopsToShapes(loops, minArea) {
    const items = loops
      .map(pts => ({ pts, area: Math.abs(polyArea(pts)), box: bbox(pts) }))
      .filter(it => it.area > minArea);
    items.forEach((it, i) => {
      it.depth = 0;
      it.containers = [];
      const p = it.pts[0];
      items.forEach((o, j) => {
        if (i !== j && o.area > it.area && boxIn(it.box, o.box) && pointInPoly(p, o.pts)) {
          it.depth++;
          it.containers.push(j);
        }
      });
    });
    const v2 = pts => pts.map(q => new THREE.Vector2(q[0], q[1]));
    const shapes = [];
    items.forEach(it => {
      if (it.depth % 2 === 0) { it.shape = new THREE.Shape(v2(it.pts)); shapes.push(it.shape); }
    });
    items.forEach(it => {
      if (it.depth % 2 === 1) {
        let parent = null;
        it.containers.forEach(j => {
          const o = items[j];
          if (o.depth === it.depth - 1 && o.shape && (!parent || o.area < parent.area)) parent = o;
        });
        if (parent) parent.shape.holes.push(new THREE.Path(v2(it.pts)));
      }
    });
    return shapes;
  }

  /* ---------- 產品外形（底座） ----------
   * 全部用「點」直接組成外框，並刪除重複的點，避免 STL 出現破面。 */
  function arcPts(cx, cy, r, a0, a1, ccw, segPerTurn) {
    let da = a1 - a0;
    const TAU = Math.PI * 2;
    if (ccw && da <= 0) da += TAU;
    if (!ccw && da >= 0) da -= TAU;
    const steps = Math.max(2, Math.ceil(Math.abs(da) / TAU * (segPerTurn || 96)));
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const a = a0 + da * i / steps;
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    return pts;
  }
  function dedupe(pts) {
    const out = [];
    pts.forEach(p => {
      const q = out[out.length - 1];
      if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) > 1e-4) out.push(p);
    });
    while (out.length > 2 && Math.hypot(out[0][0] - out[out.length - 1][0], out[0][1] - out[out.length - 1][1]) <= 1e-4) out.pop();
    return out;
  }
  function circlePts(cx, cy, r, n) {
    const pts = [];
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
    return pts;
  }
  const toV2 = pts => pts.map(p => new THREE.Vector2(p[0], p[1]));

  function outlineShape(design, prod) {
    const S = prod.size, h = S / 2;
    const tabR = 6.5, holeR = 2.6;
    let pts, hole = null;
    if (prod.outline === 'circle') {
      const R = h;
      if (prod.tab) {
        const D = R + 3.5;
        const y = (R * R - tabR * tabR + D * D) / (2 * D);
        const x = Math.sqrt(Math.max(0, R * R - y * y));
        const aMain = Math.atan2(y, x);
        // 由右邊交點順時針繞過底部到左邊交點，再繞過掛耳頂部返回
        pts = arcPts(0, 0, R, aMain, Math.PI - aMain, false, 128)
          .concat(arcPts(0, D, tabR, Math.atan2(y - D, -x), Math.atan2(y - D, x), false, 64));
        hole = circlePts(0, D, holeR, 32);
      } else {
        pts = circlePts(0, 0, R, 128);
      }
    } else {
      const r = design.rounded ? (prod.roundedCorner || 6) : 0;
      const corner = (cx, cy, a0) => arcPts(cx, cy, r, a0, a0 + Math.PI / 2, true, 64);
      pts = [];
      // 逆時針：右下 → 右上 → （掛耳）→ 左上 → 左下
      if (r) {
        pts = pts.concat(corner(h - r, -h + r, -Math.PI / 2), corner(h - r, h - r, 0));
      } else {
        pts.push([h, -h], [h, h]);
      }
      if (prod.tab) {
        const d = 4, x = Math.sqrt(tabR * tabR - d * d);
        pts = pts.concat(arcPts(0, h + d, tabR, Math.atan2(-d, x), Math.atan2(-d, -x), true, 64));
        hole = circlePts(0, h + d, holeR, 32);
      }
      if (r) {
        pts = pts.concat(corner(-h + r, h - r, Math.PI / 2), corner(-h + r, -h + r, Math.PI));
      } else {
        pts.push([-h, h], [-h, -h]);
      }
    }
    const shape = new THREE.Shape(toV2(dedupe(pts)));
    if (hole) shape.holes.push(new THREE.Path(toV2(dedupe(hole))));
    return shape;
  }

  /* ---------- 太幼的部分（形態學開運算） ---------- */
  function thinFraction(f, N, pxMM, minMM) {
    const r = Math.max(1, Math.round((minMM / 2) / pxMM));
    const B = new Uint8Array(N * N);
    let total = 0;
    for (let i = 0; i < f.length; i++) if (f[i] > 0.5) { B[i] = 1; total++; }
    if (!total) return 0;
    const minMax = (src, isMin) => {
      const tmp = new Uint8Array(N * N), out = new Uint8Array(N * N);
      for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
          let v = isMin ? 1 : 0;
          for (let k = -r; k <= r; k++) {
            const xx = x + k;
            const s = (xx < 0 || xx >= N) ? 0 : src[y * N + xx];
            if (isMin ? s < v : s > v) { v = s; if (isMin ? !v : v) break; }
          }
          tmp[y * N + x] = v;
        }
      }
      for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
          let v = isMin ? 1 : 0;
          for (let k = -r; k <= r; k++) {
            const yy = y + k;
            const s = (yy < 0 || yy >= N) ? 0 : tmp[yy * N + x];
            if (isMin ? s < v : s > v) { v = s; if (isMin ? !v : v) break; }
          }
          out[y * N + x] = v;
        }
      }
      return out;
    };
    const opened = minMax(minMax(B, true), false);
    let thin = 0;
    for (let i = 0; i < B.length; i++) if (B[i] && !opened[i]) thin++;
    return thin / total;
  }

  /* ---------- 3. 建立模型 ---------- */
  function buildModel(design, opts) {
    opts = opts || {};
    const prod = Object.assign({}, productOf(design), opts.productOverride || {});
    const S = prod.size;
    const N = opts.res || Math.max(160, Math.min(420, Math.round(S / 0.2)));
    const pxMM = S / N;
    const baseH = prod.base, step = prod.step;
    const d = opts.productOverride ? Object.assign({}, design, { product: opts.productKey || design.product }) : design;

    const base = new THREE.ExtrudeGeometry(outlineShape(d, prod), { depth: baseH, bevelEnabled: false, curveSegments: 40 });
    const parts = [];
    const warnings = [];
    E.usedColors(d).forEach(key => {
      const lvl = E.levelOf(d, key);
      if (lvl <= 0) return;
      const f = maskFor(d, key, N);
      if (!f) return;
      const loops = marchingSquares(f, N, N, 0.5)
        .map(l => simplifyClosed(l, 0.22))
        .map(l => l.map(p => [(p[0] / N - 0.5) * S, (0.5 - p[1] / N) * S]));
      const shapes = loopsToShapes(loops, pxMM * pxMM * 2);
      if (!shapes.length) return;
      const g = new THREE.ExtrudeGeometry(shapes, { depth: step * lvl, bevelEnabled: false, curveSegments: 1 });
      g.translate(0, 0, baseH);
      const thin = opts.skipThin ? 0 : thinFraction(f, N, pxMM, 1.0);
      if (thin > 0.05) warnings.push({ key, thin });
      parts.push({ key, level: lvl, hex: E.colorHex(key), geometry: g, thin });
    });
    const geoms = [base].concat(parts.map(p => p.geometry));
    const volume = geoms.reduce((a, g) => a + geomVolume(g), 0);
    const tris = geoms.reduce((a, g) => a + triCount(g), 0);
    const maxLevel = parts.reduce((m, p) => Math.max(m, p.level), 0);
    const height = baseH + maxLevel * step;
    return { product: prod, S, baseH, step, base, parts, volume, tris, height, warnings, estimate: estimate(volume, height) };
  }

  function triCount(g) {
    return g.index ? g.index.count / 3 : g.attributes.position.count / 3;
  }
  function geomVolume(g) {
    const p = g.attributes.position.array;
    const idx = g.index ? g.index.array : null;
    const n = idx ? idx.length : p.length / 3;
    let v = 0;
    for (let t = 0; t < n; t += 3) {
      const a = (idx ? idx[t] : t) * 3, b = (idx ? idx[t + 1] : t + 1) * 3, c = (idx ? idx[t + 2] : t + 2) * 3;
      v += p[a] * (p[b + 1] * p[c + 2] - p[b + 2] * p[c + 1])
        - p[a + 1] * (p[b] * p[c + 2] - p[b + 2] * p[c])
        + p[a + 2] * (p[b] * p[c + 1] - p[b + 1] * p[c]);
    }
    return Math.abs(v / 6);
  }

  // 粗略估計：PLA 密度 1.24 g/cm³；一般學校打印機每秒擠出約 5–12 mm³
  function estimate(volume, height) {
    const grams = volume / 1000 * 1.24 * 0.85;
    const layers = height / 0.2;
    const fast = volume * 0.85 / 12 / 60 + layers * 3 / 60 + 1.5;
    const slow = volume * 0.85 / 5 / 60 + layers * 6 / 60 + 3;
    return { grams, minMinutes: Math.max(2, Math.round(fast)), maxMinutes: Math.max(3, Math.round(slow)) };
  }

  /* ---------- 4. STL ---------- */
  function toSTL(geoms, offsets) {
    let total = 0;
    geoms.forEach(g => { total += triCount(g); });
    const buf = new ArrayBuffer(84 + total * 50);
    const dv = new DataView(buf);
    const head = 'Hong Kong cement tile - Tile Design Studio (mm)';
    for (let i = 0; i < 80; i++) dv.setUint8(i, i < head.length ? head.charCodeAt(i) : 32);
    dv.setUint32(80, total, true);
    let o = 84;
    geoms.forEach((g, gi) => {
      const off = offsets && offsets[gi] || [0, 0, 0];
      const p = g.attributes.position.array;
      const idx = g.index ? g.index.array : null;
      const n = idx ? idx.length : p.length / 3;
      for (let t = 0; t < n; t += 3) {
        const ia = (idx ? idx[t] : t) * 3, ib = (idx ? idx[t + 1] : t + 1) * 3, ic = (idx ? idx[t + 2] : t + 2) * 3;
        const ax = p[ia] + off[0], ay = p[ia + 1] + off[1], az = p[ia + 2] + off[2];
        const bx = p[ib] + off[0], by = p[ib + 1] + off[1], bz = p[ib + 2] + off[2];
        const cx = p[ic] + off[0], cy = p[ic + 1] + off[1], cz = p[ic + 2] + off[2];
        let nx = (by - ay) * (cz - az) - (bz - az) * (cy - ay);
        let ny = (bz - az) * (cx - ax) - (bx - ax) * (cz - az);
        let nz = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
        const l = Math.hypot(nx, ny, nz) || 1;
        nx /= l; ny /= l; nz /= l;
        dv.setFloat32(o, nx, true); dv.setFloat32(o + 4, ny, true); dv.setFloat32(o + 8, nz, true);
        dv.setFloat32(o + 12, ax, true); dv.setFloat32(o + 16, ay, true); dv.setFloat32(o + 20, az, true);
        dv.setFloat32(o + 24, bx, true); dv.setFloat32(o + 28, by, true); dv.setFloat32(o + 32, bz, true);
        dv.setFloat32(o + 36, cx, true); dv.setFloat32(o + 40, cy, true); dv.setFloat32(o + 44, cz, true);
        dv.setUint16(o + 48, 0, true);
        o += 50;
      }
    });
    return buf;
  }

  function modelSTL(model) {
    return toSTL([model.base].concat(model.parts.map(p => p.geometry)));
  }

  /* ---------- 多張 STL 打包成 ZIP（不壓縮） ---------- */
  const CRC_TABLE = (function () {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(u8) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < u8.length; i++) c = CRC_TABLE[(c ^ u8[i]) & 255] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  function makeZip(files) {
    const enc = new TextEncoder();
    const now = new Date();
    const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
    const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    const chunks = [], central = [];
    let offset = 0;
    files.forEach(f => {
      const name = enc.encode(f.name);
      const data = f.data instanceof Uint8Array ? f.data : new Uint8Array(f.data);
      const crc = crc32(data);
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true);
      lh.setUint16(8, 0, true); lh.setUint16(10, dosTime, true); lh.setUint16(12, dosDate, true);
      lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true);
      lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
      chunks.push(new Uint8Array(lh.buffer), name, data);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true);
      ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true); ch.setUint16(12, dosTime, true); ch.setUint16(14, dosDate, true);
      ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true);
      ch.setUint16(28, name.length, true); ch.setUint16(30, 0, true); ch.setUint16(32, 0, true);
      ch.setUint16(34, 0, true); ch.setUint16(36, 0, true); ch.setUint32(38, 0, true); ch.setUint32(42, offset, true);
      central.push(new Uint8Array(ch.buffer), name);
      offset += 30 + name.length + data.length;
    });
    const cdSize = central.reduce((a, c) => a + c.length, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
    end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
    return new Blob(chunks.concat(central, [new Uint8Array(end.buffer)]), { type: 'application/zip' });
  }

  /* ---------- 教師：打印盤（多件作品合併） ---------- */
  function plateSTL(designs, o) {
    const size = o.plate || 220, gap = o.gap || 4;
    const key = o.productKey || 'mini';
    const prod = global.CONTENT.products[key];
    const pitch = prod.size + gap + (prod.tab ? 10 : 0);
    const cols = Math.max(1, Math.floor((size + gap) / pitch));
    const geoms = [], offsets = [];
    const n = Math.min(designs.length, cols * cols);
    const rows = Math.ceil(n / cols);
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / cols), c = i % cols;
      const d = Object.assign({}, designs[i], { product: key });
      const m = buildModel(d, { skipThin: true });
      const ox = (c - (Math.min(cols, n) - 1) / 2) * pitch;
      const oy = ((rows - 1) / 2 - r) * pitch;
      [m.base].concat(m.parts.map(p => p.geometry)).forEach(g => { geoms.push(g); offsets.push([ox, oy, 0]); });
    }
    return { stl: toSTL(geoms, offsets), count: n, perPlate: cols * cols };
  }

  global.TileMesh = {
    productOf, maskFor, marchingSquares, simplifyClosed, loopsToShapes, outlineShape,
    buildModel, modelSTL, toSTL, makeZip, plateSTL, estimate, geomVolume
  };
})(window);
