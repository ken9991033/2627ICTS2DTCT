// 背景：three.js 星空隧道（轉場時「躍遷」）＋ 可組成文字／形狀的發光粒子
import * as THREE from '../../vendor/three/three.module.js';

const DEPTH = 900;
const SPREAD = 420;

function glowMaterial(size) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uSize: { value: size }, uPixelRatio: { value: 1 }, uOpacity: { value: 1 } },
    vertexShader: /* glsl */`
      attribute vec3 color;
      attribute float scale;
      uniform float uSize; uniform float uPixelRatio;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = uSize * scale * uPixelRatio * (300.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform float uOpacity;
      varying vec3 vColor;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        float a = smoothstep(0.5, 0.0, d);
        a = pow(a, 1.6);
        gl_FragColor = vec4(vColor * a * 1.35, a * uOpacity);
      }`,
  });
}

export function createBackground(canvas, opts = {}) {
  const gsap = window.gsap;
  let lite = !!opts.lite;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
  } catch (e) {
    console.warn('WebGL 不可用，背景改為靜態。', e);
    return fallback();
  }
  renderer.setClearColor(0x04050d, 1);
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x04050d, 0.0016);
  const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 3000);
  camera.position.set(0, 0, 0);

  // ---------- 星空 ----------
  let N = lite ? 1400 : 3600;
  let stars, starGeo, starPos, starCol, starMat, lineGeo, linePos, lineCol, lineMat, lines, starBase;
  const tint = { a: new THREE.Color('#22d3ee'), b: new THREE.Color('#a78bfa') };

  function buildStars() {
    if (stars) { scene.remove(stars, lines); starGeo.dispose(); lineGeo.dispose(); }
    starPos = new Float32Array(N * 3);
    starCol = new Float32Array(N * 3);
    starBase = new Float32Array(N); // 每粒星的顏色混合比例及亮度
    const scale = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      resetStar(i, true);
      starBase[i] = Math.random();
      scale[i] = 0.4 + Math.random() * 1.4;
    }
    starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starCol, 3));
    starGeo.setAttribute('scale', new THREE.BufferAttribute(scale, 1));
    starMat = glowMaterial(4.2);
    stars = new THREE.Points(starGeo, starMat);
    stars.frustumCulled = false;

    linePos = new Float32Array(N * 6);
    lineCol = new Float32Array(N * 6);
    lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
    lineGeo.setAttribute('color', new THREE.BufferAttribute(lineCol, 3));
    lineMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    lines = new THREE.LineSegments(lineGeo, lineMat);
    lines.frustumCulled = false;
    scene.add(stars, lines);
    applyTint(1);
  }
  function resetStar(i, anyZ, front) {
    // 避開正中央，令星點像隧道壁
    let x, y;
    do { x = (Math.random() * 2 - 1) * SPREAD; y = (Math.random() * 2 - 1) * SPREAD * 0.62; } while (Math.abs(x) < 26 && Math.abs(y) < 16);
    starPos[i * 3] = x; starPos[i * 3 + 1] = y;
    starPos[i * 3 + 2] = anyZ ? -Math.random() * DEPTH : (front ? -2 : -DEPTH);
  }
  const _c = new THREE.Color();
  function applyTint(k = 1) {
    for (let i = 0; i < N; i++) {
      _c.copy(tint.a).lerp(tint.b, starBase[i]);
      const dim = 0.35 + 0.65 * ((i * 7919) % 100) / 100;
      starCol[i * 3] = _c.r * dim; starCol[i * 3 + 1] = _c.g * dim; starCol[i * 3 + 2] = _c.b * dim;
    }
    starGeo.attributes.color.needsUpdate = true;
  }

  // ---------- 粒子（組字） ----------
  const M = lite ? 2600 : 5200;
  const pPos = new Float32Array(M * 3);
  const pTarget = new Float32Array(M * 3);
  const pCol = new Float32Array(M * 3);
  const pScale = new Float32Array(M);
  const pSeed = new Float32Array(M);
  for (let i = 0; i < M; i++) {
    pPos[i * 3] = (Math.random() - .5) * 600; pPos[i * 3 + 1] = (Math.random() - .5) * 400; pPos[i * 3 + 2] = -200 - Math.random() * 600;
    pTarget.set(pPos.subarray(i * 3, i * 3 + 3), i * 3);
    pScale[i] = 0.5 + Math.random() * 0.9; pSeed[i] = Math.random() * 1000;
    pCol[i * 3] = .4; pCol[i * 3 + 1] = .8; pCol[i * 3 + 2] = 1;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
  pGeo.setAttribute('scale', new THREE.BufferAttribute(pScale, 1));
  const pMat = glowMaterial(2.6);
  pMat.uniforms.uOpacity.value = 0;
  const particles = new THREE.Points(pGeo, pMat);
  particles.frustumCulled = false;
  scene.add(particles);
  const morph = { k: 0.06, jitter: 0.25, active: false };

  // 舞台座標（1920×1080）→ 世界座標（z 平面）
  const stageEl = document.getElementById('stage');
  function stageToWorld(x, y, z = -160) {
    const r = stageEl.getBoundingClientRect();
    const vw = canvas.clientWidth, vh = canvas.clientHeight;
    const sx = r.left + (x / 1920) * r.width;
    const sy = r.top + (y / 1080) * r.height;
    const ndcX = (sx / vw) * 2 - 1, ndcY = -((sy / vh) * 2 - 1);
    const d = -z;
    const h = 2 * d * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const w = h * camera.aspect;
    return [ndcX * w / 2, ndcY * h / 2, z];
  }

  function samplePoints(draw, { width = 1920, height = 1080, step = 5 } = {}) {
    const cv = document.createElement('canvas');
    cv.width = width; cv.height = height;
    const g = cv.getContext('2d');
    draw(g, width, height);
    const data = g.getImageData(0, 0, width, height).data;
    const pts = [];
    for (let y = 0; y < height; y += step) for (let x = 0; x < width; x += step) {
      const a = data[(y * width + x) * 4 + 3];
      if (a > 120) pts.push([x + (Math.random() - .5) * step * .6, y + (Math.random() - .5) * step * .6]);
    }
    return pts;
  }

  /** 粒子組成文字。text 位置以舞台座標表示。回傳完成時間（秒）。 */
  function formText(text, o = {}) {
    const cx = o.x ?? 960, cy = o.y ?? 470, size = o.size ?? 380;
    const font = o.font ?? `900 ${size}px "Noto Sans TC Variable", "Microsoft JhengHei", sans-serif`;
    const pts = samplePoints((g, w, h) => {
      g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = font;
      if (o.letterSpacing) g.letterSpacing = o.letterSpacing + 'px';
      g.fillText(text, cx, cy);
    }, { step: o.step ?? (lite ? 7 : 5) });
    return formPoints(pts, o);
  }

  /** 粒子組成任意點集（舞台座標 [x,y]）。 */
  function formPoints(pts, o = {}) {
    const colors = (o.colors || ['#22d3ee', '#a78bfa', '#ff3d7f']).map(c => new THREE.Color(c));
    const z = o.z ?? -160;
    let minX = Infinity, maxX = -Infinity;
    for (const p of pts) { if (p[0] < minX) minX = p[0]; if (p[0] > maxX) maxX = p[0]; }
    const used = pts.length ? Math.floor(M * (o.fill ?? 0.86)) : 0;
    for (let i = 0; i < M; i++) {
      if (i < used) {
        const p = pts[Math.floor(i * pts.length / used)];
        const [wx, wy, wz] = stageToWorld(p[0], p[1], z + (Math.random() - .5) * 6);
        pTarget[i * 3] = wx; pTarget[i * 3 + 1] = wy; pTarget[i * 3 + 2] = wz;
        const t = (p[0] - minX) / Math.max(1, maxX - minX);
        const c = t < .5 ? colors[0].clone().lerp(colors[1], t * 2) : colors[1].clone().lerp(colors[2] || colors[1], (t - .5) * 2);
        pCol[i * 3] = c.r; pCol[i * 3 + 1] = c.g; pCol[i * 3 + 2] = c.b;
      } else {
        // 多出的粒子作為周圍的塵埃
        const a = Math.random() * Math.PI * 2, rr = 120 + Math.random() * 260;
        pTarget[i * 3] = Math.cos(a) * rr; pTarget[i * 3 + 1] = Math.sin(a) * rr * .6; pTarget[i * 3 + 2] = -300 - Math.random() * 400;
        pCol[i * 3] = .25; pCol[i * 3 + 1] = .35; pCol[i * 3 + 2] = .7;
      }
    }
    pGeo.attributes.color.needsUpdate = true;
    morph.active = true;
    morph.k = o.speed ?? 0.045;
    gsap.to(pMat.uniforms.uOpacity, { value: o.opacity ?? 1, duration: 0.8 });
    return 2.2;
  }

  /** 粒子由某點（舞台座標）爆出，例如程式執行時。 */
  function burstFrom(x = 960, y = 540) {
    const [wx, wy, wz] = stageToWorld(x, y, -160);
    for (let i = 0; i < M; i++) {
      pPos[i * 3] = wx + (Math.random() - .5) * 4; pPos[i * 3 + 1] = wy + (Math.random() - .5) * 4; pPos[i * 3 + 2] = wz;
    }
    pGeo.attributes.position.needsUpdate = true;
  }

  /** 散開並淡出粒子。 */
  function scatter(o = {}) {
    for (let i = 0; i < M; i++) {
      const a = Math.random() * Math.PI * 2, b = Math.random() * Math.PI - Math.PI / 2;
      const rr = 400 + Math.random() * 600;
      pTarget[i * 3] = Math.cos(a) * Math.cos(b) * rr;
      pTarget[i * 3 + 1] = Math.sin(b) * rr * .6;
      pTarget[i * 3 + 2] = (o.toward ? 60 : -900) + Math.random() * 200;
    }
    morph.k = 0.02;
    gsap.to(pMat.uniforms.uOpacity, { value: 0, duration: o.duration ?? 1.4, delay: 0.3, onComplete: () => { morph.active = false; } });
  }
  function hideParticles(d = 0.6) { gsap.to(pMat.uniforms.uOpacity, { value: 0, duration: d }); }

  // ---------- 躍遷 ----------
  const motion = { speed: 0.35, streak: 0, dir: 1 };
  function warp(dir = 1, duration = 1.3, strength = 1) {
    gsap.killTweensOf(motion);
    motion.dir = dir;
    const peak = 14 * strength;
    const tl = gsap.timeline();
    tl.to(motion, { speed: peak, streak: 1, duration: duration * 0.45, ease: 'power3.in' })
      .to(motion, { speed: 0.35, streak: 0, duration: duration * 0.55, ease: 'power2.out' });
    return tl;
  }
  function setTint(a, b, duration = 1.2) {
    const ta = new THREE.Color(a), tb = new THREE.Color(b || a);
    const from = { a: tint.a.clone(), b: tint.b.clone() };
    const o = { t: 0 };
    gsap.to(o, { t: 1, duration, onUpdate: () => { tint.a.copy(from.a).lerp(ta, o.t); tint.b.copy(from.b).lerp(tb, o.t); applyTint(); } });
  }

  // ---------- 主迴圈 ----------
  let last = performance.now(), running = true, raf;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(50, now - last) / 16.67; last = now;
    if (!running) return;
    const v = motion.speed * motion.dir * dt;
    const streakLen = 0.4 + motion.streak * 26;
    for (let i = 0; i < N; i++) {
      const j = i * 3;
      starPos[j + 2] += v;
      if (starPos[j + 2] > -1) resetStar(i, false, false);
      else if (starPos[j + 2] < -DEPTH) resetStar(i, false, true);
      const k = i * 6;
      linePos[k] = starPos[j]; linePos[k + 1] = starPos[j + 1]; linePos[k + 2] = starPos[j + 2];
      linePos[k + 3] = starPos[j]; linePos[k + 4] = starPos[j + 1]; linePos[k + 5] = starPos[j + 2] - streakLen * motion.dir;
      lineCol[k] = starCol[j]; lineCol[k + 1] = starCol[j + 1]; lineCol[k + 2] = starCol[j + 2];
      lineCol[k + 3] = 0; lineCol[k + 4] = 0; lineCol[k + 5] = 0;
    }
    starGeo.attributes.position.needsUpdate = true;
    lineGeo.attributes.position.needsUpdate = true;
    lineGeo.attributes.color.needsUpdate = true;
    lineMat.opacity = Math.min(1, motion.streak * 1.4);

    if (pMat.uniforms.uOpacity.value > 0.001 || morph.active) {
      const t = now * 0.001;
      for (let i = 0; i < M; i++) {
        const j = i * 3, s = pSeed[i];
        const jx = Math.sin(t * 1.3 + s) * morph.jitter, jy = Math.cos(t * 1.1 + s * 1.7) * morph.jitter;
        pPos[j] += (pTarget[j] + jx - pPos[j]) * morph.k * dt;
        pPos[j + 1] += (pTarget[j + 1] + jy - pPos[j + 1]) * morph.k * dt;
        pPos[j + 2] += (pTarget[j + 2] - pPos[j + 2]) * morph.k * dt;
      }
      pGeo.attributes.position.needsUpdate = true;
    }
    camera.rotation.z = Math.sin(now * 0.00007) * 0.04;
    renderer.render(scene, camera);
  }

  function resize() {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    const pr = Math.min(devicePixelRatio || 1, lite ? 1 : 1.5);
    renderer.setPixelRatio(pr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    starMat.uniforms.uPixelRatio.value = pr; pMat.uniforms.uPixelRatio.value = pr;
  }

  buildStars();
  resize();
  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => { running = !document.hidden; last = performance.now(); });
  raf = requestAnimationFrame(frame);

  function setLite(v) { lite = v; N = v ? 1400 : 3600; buildStars(); resize(); }

  return { warp, setTint, formText, formPoints, burstFrom, scatter, hideParticles, stageToWorld, setLite, motion, three: THREE };

  function fallback() {
    const noop = () => {};
    return { warp: () => gsap.timeline(), setTint: noop, formText: () => 0, formPoints: () => 0, burstFrom: noop, scatter: noop, hideParticles: noop, stageToWorld: () => [0, 0, 0], setLite: noop, motion: {}, three: THREE };
  }
}
