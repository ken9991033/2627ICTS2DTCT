/* ============================================================
 * view3d.js — three.js 3D 預覽（拖曳旋轉、滾輪縮放）
 * ============================================================ */
(function (global) {
  'use strict';

  function TileViewer(host) {
    this.host = host;
    this.ok = !!global.THREE;
    if (!this.ok) return;
    const THREE = global.THREE;
    // 顏色：把 sRGB 顏色正確轉換，打印預覽才不會過亮
    if (THREE.ColorManagement && 'legacyMode' in THREE.ColorManagement) THREE.ColorManagement.legacyMode = false;
    const r = this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    r.outputEncoding = THREE.sRGBEncoding;
    r.setPixelRatio(Math.min(2, global.devicePixelRatio || 1));
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.domElement.className = 'viewer-canvas';
    r.domElement.setAttribute('aria-label', '3D 模型預覽，拖曳可旋轉，滾動滑鼠可放大縮小');
    host.appendChild(r.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(32, 1, 1, 3000);
    this.group = new THREE.Group();
    this.group.rotation.x = -Math.PI / 2; // 模型是 Z 軸向上
    this.scene.add(this.group);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x8a8577, 0.55);
    this.scene.add(hemi);
    const sun = this.sun = new THREE.DirectionalLight(0xffffff, 0.7);
    sun.position.set(70, 140, 90);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    const sc = sun.shadow.camera;
    sc.left = -90; sc.right = 90; sc.top = 90; sc.bottom = -90; sc.near = 10; sc.far = 400;
    sun.shadow.bias = -0.0008;
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0xffffff, 0.18);
    fill.position.set(-80, 60, -60);
    this.scene.add(fill);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), new THREE.ShadowMaterial({ opacity: 0.16 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    this.scene.add(ground);

    this.theta = -0.55;
    this.phi = 0.95;
    this.radius = 190;
    this.autoRotate = true;
    this.active = false;
    this.meshes = [];
    this._bind();
    const ro = new ResizeObserver(() => this.resize());
    ro.observe(host);
    this.resize();
  }

  TileViewer.prototype._bind = function () {
    const el = this.renderer.domElement;
    let drag = null;
    const pts = new Map();
    el.addEventListener('pointerdown', e => {
      el.setPointerCapture(e.pointerId);
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      drag = { x: e.clientX, y: e.clientY, t: this.theta, p: this.phi, pinch: null };
      this.autoRotate = false;
      this._emitAuto();
    });
    el.addEventListener('pointermove', e => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2) {
        const [a, b] = Array.from(pts.values());
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (drag.pinch == null) drag.pinch = { d, r: this.radius };
        else this.radius = Math.max(40, Math.min(600, drag.pinch.r * drag.pinch.d / Math.max(1, d)));
      } else if (drag) {
        this.theta = drag.t - (e.clientX - drag.x) * 0.008;
        this.phi = Math.max(0.12, Math.min(1.45, drag.p - (e.clientY - drag.y) * 0.008));
      }
      this.render();
    });
    const end = e => { pts.delete(e.pointerId); if (!pts.size) drag = null; };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('wheel', e => {
      e.preventDefault();
      this.radius = Math.max(40, Math.min(600, this.radius * (e.deltaY > 0 ? 1.1 : 0.9)));
      this.render();
    }, { passive: false });
  };

  TileViewer.prototype._emitAuto = function () {
    if (this.onAutoChange) this.onAutoChange(this.autoRotate);
  };

  TileViewer.prototype.resize = function () {
    if (!this.ok) return;
    const w = Math.max(10, this.host.clientWidth), h = Math.max(10, this.host.clientHeight);
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    // 直向（手機）畫面：鏡頭拉遠一點，整件作品才放得下
    this.aspectK = Math.max(1, 1.2 / this.camera.aspect);
    this.render();
  };

  TileViewer.prototype.setBackground = function (css) {
    if (!this.ok) return;
    this.renderer.setClearColor(new global.THREE.Color(css), 1);
    this.render();
  };

  TileViewer.prototype.clear = function () {
    this.meshes.forEach(m => {
      this.group.remove(m);
      if (Array.isArray(m.material)) m.material.forEach(x => { if (x.map) x.map.dispose(); x.dispose(); });
      else m.material.dispose();
    });
    this.meshes = [];
    if (this._geoms) this._geoms.forEach(g => g.dispose());
    this._geoms = [];
  };

  // mode: 'real' 真實顏色 / 'mono' 單色打印 / 'dual' 雙色打印
  TileViewer.prototype.setModel = function (model, o) {
    if (!this.ok) return;
    const THREE = global.THREE;
    this.clear();
    o = o || {};
    const mode = o.mode || 'real';
    const mat = hex => new THREE.MeshStandardMaterial({ color: new THREE.Color(hex), roughness: 0.66, metalness: 0 });
    const S = model.S;
    let baseMat;
    if (mode === 'real' && o.texture) {
      const tex = new THREE.CanvasTexture(o.texture.canvas);
      tex.encoding = THREE.sRGBEncoding;
      const span = o.texture.span;
      tex.repeat.set(1 / span, 1 / span);
      tex.offset.set(0.5, 0.5);
      tex.anisotropy = 4;
      baseMat = [new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7, metalness: 0 }), mat(o.baseHex)];
    } else {
      baseMat = mat(mode === 'real' ? o.baseHex : (o.filamentA || '#EEEBE4'));
    }
    const base = new THREE.Mesh(model.base, baseMat);
    base.castShadow = true; base.receiveShadow = true;
    this.group.add(base);
    this.meshes.push(base);
    model.parts.forEach(p => {
      const color = mode === 'real' ? p.hex : mode === 'mono' ? (o.filamentA || '#EEEBE4') : (o.filamentB || '#B03A2E');
      const m = new THREE.Mesh(p.geometry, mat(color));
      m.castShadow = true; m.receiveShadow = true;
      this.group.add(m);
      this.meshes.push(m);
    });
    if (o.fit !== false && this._lastS !== S) {
      this.radius = S * 2.35;
      this._lastS = S;
    }
    this.render();
  };

  TileViewer.prototype.render = function () {
    if (!this.ok) return;
    const t = this.theta, p = this.phi, R = this.radius * (this.aspectK || 1);
    this.camera.position.set(R * Math.sin(p) * Math.sin(t), R * Math.cos(p), R * Math.sin(p) * Math.cos(t));
    this.camera.lookAt(0, 2, 0);
    this.renderer.render(this.scene, this.camera);
  };

  TileViewer.prototype.start = function () {
    if (!this.ok || this.active) return;
    this.active = true;
    const loop = () => {
      if (!this.active) return;
      if (this.autoRotate && !(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
        this.theta += 0.0045;
        this.render();
      }
      this._raf = requestAnimationFrame(loop);
    };
    loop();
  };
  TileViewer.prototype.stop = function () {
    this.active = false;
    if (this._raf) cancelAnimationFrame(this._raf);
  };
  TileViewer.prototype.setAutoRotate = function (on) {
    this.autoRotate = !!on;
    this._emitAuto();
  };
  // 以固定大小拍照（即使 3D 頁未顯示也可以）
  TileViewer.prototype.snapshot = function (w, h) {
    if (!this.ok) return null;
    w = w || 960; h = h || 540;
    const r = this.renderer, cam = this.camera;
    const keep = { t: this.theta, p: this.phi, R: this.radius, k: this.aspectK };
    this.aspectK = 1;
    this.theta = -0.45; this.phi = 0.8; this.radius = (this._lastS || 80) * 2.3;
    const old = r.getSize(new global.THREE.Vector2());
    const oldAspect = cam.aspect;
    r.setSize(w, h, false);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
    this.render();
    let url = null;
    try { url = r.domElement.toDataURL('image/png'); } catch (e) { url = null; }
    r.setSize(Math.max(10, old.x), Math.max(10, old.y), false);
    this.theta = keep.t; this.phi = keep.p; this.radius = keep.R; this.aspectK = keep.k;
    cam.aspect = oldAspect;
    cam.updateProjectionMatrix();
    this.render();
    return url;
  };

  global.TileViewer = TileViewer;
})(window);
