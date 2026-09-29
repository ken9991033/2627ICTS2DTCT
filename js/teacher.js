/* ============================================================
 * teacher.js — 教師工具：課堂流程＋計時器、全班作品牆、答案與提示
 * ============================================================ */
(function (global) {
  'use strict';
  const App = global.App, C = App.C, E = App.E, M = global.TileMesh;
  const { $, $$, esc, css } = App;

  const T = {
    cur: 'lesson',
    items: [],
    timer: { total: 300, left: 300, running: false, last: 0, h: null },
    init() {
      $('#teacherClose').addEventListener('click', () => this.close());
      $('#teacher').addEventListener('click', e => { if (e.target.id === 'teacher') this.close(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#teacher').hidden) this.close(); });
      $('#teacherTabs').addEventListener('click', e => {
        const b = e.target.closest('[role="tab"]');
        if (b) this.tab(b.dataset.tab);
      });
      $('#t-lesson').addEventListener('click', e => {
        const a = e.target.closest('[data-t]');
        if (!a) return;
        const v = a.dataset.t;
        if (v === 'start') this.startTimer();
        else if (v === 'pause') this.pauseTimer();
        else if (v === 'reset') this.setTimer(this.timer.total);
        else if (v.indexOf('min') === 0) this.setTimer(Number(v.slice(3)) * 60);
      });
      $('#t-lesson').addEventListener('click', e => {
        const g = e.target.closest('[data-open-step]');
        if (g) { this.close(); App.go(Number(g.dataset.openStep)); }
      });
      const wall = $('#t-wall');
      wall.addEventListener('change', e => {
        if (e.target.id === 'wallFiles') { this.readFiles(e.target.files); e.target.value = ''; }
        if (e.target.id === 'plateSize') this.renderPlateInfo();
        const ck = e.target.closest('[data-pick]');
        if (ck) { this.items[Number(ck.dataset.pick)].checked = ck.checked; this.renderPlateInfo(); }
      });
      wall.addEventListener('click', e => {
        const a = e.target.closest('[data-w]');
        if (!a) return;
        const v = a.dataset.w;
        if (v === 'floor') this.showFloor();
        if (v === 'floor-png') this.downloadFloor();
        if (v === 'plate') this.downloadPlate();
        if (v === 'all') { this.items.forEach(i => { i.checked = true; }); this.renderWall(); }
        if (v === 'none') { this.items.forEach(i => { i.checked = false; }); this.renderWall(); }
        if (v === 'clear') { this.items = []; this.renderWall(); }
      });
      wall.addEventListener('dragover', e => { const z = e.target.closest('.drop'); if (z) { e.preventDefault(); z.classList.add('over'); } });
      wall.addEventListener('dragleave', e => { const z = e.target.closest('.drop'); if (z) z.classList.remove('over'); });
      wall.addEventListener('drop', e => {
        const z = e.target.closest('.drop');
        if (!z) return;
        e.preventDefault();
        z.classList.remove('over');
        this.readFiles(e.dataTransfer.files);
      });
    },
    open() {
      $('#teacher').hidden = false;
      this.tab(this.cur);
      $('#teacherClose').focus();
    },
    close() { $('#teacher').hidden = true; },
    tab(id) {
      this.cur = id;
      $$('#teacherTabs [role="tab"]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === id)));
      ['lesson', 'wall', 'tips'].forEach(k => { $('#t-' + k).hidden = k !== id; });
      if (id === 'lesson') this.renderLesson();
      if (id === 'wall') this.renderWall();
      if (id === 'tips') this.renderTips();
    },

    /* ---- 課堂流程 ---- */
    renderLesson() {
      const html = C.lessons.map(L => {
        let t = 0;
        const total = L.blocks.reduce((a, b) => a + b.t, 0);
        const bar = L.blocks.map(b => '<span style="width:' + (b.t / total * 100) + '%" title="' + esc(b.name) + '"></span>').join('');
        const items = L.blocks.map(b => {
          const from = t; t += b.t;
          return '<li><span class="min">' + from + '–' + t + '′</span><span><b>' + esc(b.name) + '</b>' + esc(b.what) +
            (b.step ? '<br><button type="button" class="btn small ghost" data-open-step="' + b.step + '">打開步驟 ' + b.step + '</button>' : '') + '</span></li>';
        }).join('');
        return '<div class="lesson"><h3>' + esc(L.title) + '</h3>' +
          '<p class="meta">目標：' + esc(L.goal) + '<br>價值觀：' + esc(L.values) + '｜共 ' + total + ' 分鐘</p>' +
          '<div class="timeline-bar" aria-hidden="true">' + bar + '</div><ol class="tl">' + items + '</ol></div>';
      }).join('');
      $('#t-lesson').innerHTML =
        '<div class="timer"><span class="digits" id="tDigits">05:00</span>' +
        '<div class="row">' + [3, 5, 8, 10, 15].map(m => '<button type="button" class="btn small" data-t="min' + m + '">' + m + ' 分</button>').join('') + '</div>' +
        '<div class="row"><button type="button" class="btn primary" data-t="start">開始</button><button type="button" class="btn" data-t="pause">暫停</button><button type="button" class="btn ghost" data-t="reset">重設</button></div>' +
        '<p class="small muted">可以把這個計時器投影給全班看。完結時會響鈴（要先開啟音效）。</p></div>' +
        '<div class="lesson-grid">' + html + '</div>';
      this.paintTimer();
    },
    setTimer(sec) {
      this.pauseTimer();
      this.timer.total = sec;
      this.timer.left = sec;
      this.paintTimer();
    },
    startTimer() {
      const tm = this.timer;
      if (tm.running) return;
      if (tm.left <= 0) tm.left = tm.total;
      tm.running = true;
      tm.last = Date.now();
      tm.h = setInterval(() => {
        const now = Date.now();
        tm.left -= (now - tm.last) / 1000;
        tm.last = now;
        if (tm.left <= 0) { tm.left = 0; this.pauseTimer(); App.Sound.play('bell'); }
        this.paintTimer();
      }, 250);
    },
    pauseTimer() { clearInterval(this.timer.h); this.timer.running = false; },
    paintTimer() {
      const el = $('#tDigits');
      if (!el) return;
      const s = Math.ceil(this.timer.left);
      el.textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
      el.classList.toggle('end', s <= 0);
    },

    /* ---- 全班作品牆 ---- */
    readFiles(list) {
      const files = Array.from(list || []).filter(f => /\.json$/i.test(f.name) || f.type === 'application/json');
      if (!files.length) { App.toast('請揀選學生的 .json 存檔。'); return; }
      let pending = files.length, bad = 0;
      files.forEach(f => {
        const fr = new FileReader();
        fr.onload = () => {
          try {
            const p = JSON.parse(fr.result);
            if (!p || p.app !== 'hk-tile-studio' || !p.design) throw new Error('bad');
            const v = p.versions || [];
            const d = Object.assign(E.blankDesign(), v.length ? v[v.length - 1].design : p.design);
            if (!d.shapes || !d.shapes.length) throw new Error('empty');
            const key = (p.student.cls || '') + '-' + (p.student.no || '') + '-' + (p.student.name || f.name);
            const item = { key, p, design: d, checked: true, file: f.name };
            const i = this.items.findIndex(x => x.key === key);
            if (i >= 0) this.items[i] = item; else this.items.push(item);
          } catch (e) { bad++; }
          if (--pending === 0) {
            this.items.sort((a, b) => a.key.localeCompare(b.key, 'zh-HK', { numeric: true }));
            this.renderWall();
            App.toast('已匯入 ' + (files.length - bad) + ' 份存檔' + (bad ? '，' + bad + ' 份無法讀取' : '') + '。', bad ? '' : 'ok');
          }
        };
        fr.readAsText(f);
      });
    },
    renderWall() {
      const plates = [180, 220, 256];
      $('#t-wall').innerHTML =
        '<label class="drop" for="wallFiles">把學生的存檔（.json）拖到這裏，或<b>按這裏揀選多個檔案</b><input type="file" id="wallFiles" accept=".json,application/json" multiple class="sr"></label>' +
        '<div class="wall-tools">' +
        '<span><b>' + this.items.length + '</b> 份作品</span>' +
        '<button type="button" class="btn" data-w="floor"' + (this.items.length ? '' : ' disabled') + '>砌成全班地板</button>' +
        '<button type="button" class="btn ghost small" data-w="all">全選</button><button type="button" class="btn ghost small" data-w="none">全不選</button>' +
        '<label class="field inline small" for="plateSize">打印盤 <select id="plateSize">' + plates.map(p => '<option value="' + p + '"' + (p === 220 ? ' selected' : '') + '>' + p + ' × ' + p + ' mm</option>').join('') + '</select></label>' +
        '<button type="button" class="btn primary" data-w="plate"' + (this.items.length ? '' : ' disabled') + '>下載打印盤 STL（迷你磚 40 mm）</button>' +
        '<span class="small muted" id="plateInfo"></span>' +
        '<button type="button" class="btn ghost small" data-w="clear">清除</button>' +
        '</div>' +
        '<div id="floorBox" hidden><canvas class="class-floor" id="classFloor"></canvas><div class="row"><button type="button" class="btn" data-w="floor-png">下載全班地板（PNG）</button></div></div>' +
        '<div class="wall-grid" id="wallGrid">' + (this.items.map((it, i) => {
          const per = C.personas.find(p => p.id === it.p.persona);
          const prod = C.products[it.design.product] || C.products.coaster;
          return '<div class="wall-item"><span class="wt" data-i="' + i + '"></span><b>' + esc(it.p.student.cls + '-' + it.p.student.no + ' ' + (it.p.student.name || '')) + '</b>' +
            '<span>' + esc(per ? per.avatar + ' ' + per.name : '—') + '｜' + esc(prod.name) + '</span>' +
            '<span>意見 ' + (it.p.feedback || []).length + ' 份｜版本 ' + (it.p.versions || []).length + '</span>' +
            '<label><input type="checkbox" data-pick="' + i + '"' + (it.checked ? ' checked' : '') + '> 打印</label></div>';
        }).join('') || '<p class="muted">還沒有匯入作品。學生在步驟 8 按「存檔（JSON）」下載檔案，再交給老師。</p>') + '</div>';
      $$('#wallGrid .wt').forEach(el => el.replaceWith(E.tileImage(this.items[Number(el.dataset.i)].design, 240, { texture: 0.08 })));
      this.renderPlateInfo();
    },
    renderPlateInfo() {
      const el = $('#plateInfo');
      if (!el) return;
      const n = this.items.filter(i => i.checked).length;
      const size = Number(($('#plateSize') || {}).value || 220);
      const per = Math.pow(Math.floor((size + 4) / 44), 2);
      el.textContent = '已選 ' + n + ' 件；每盤最多 ' + per + ' 件（約 ' + Math.round(per * 9 / 60 * 10) / 10 + ' 小時）';
    },
    classFloorCanvas(cellPx) {
      const n = this.items.length;
      const cols = Math.max(1, Math.ceil(Math.sqrt(n)));
      const rows = Math.ceil(n / cols);
      const gap = Math.max(2, Math.round(cellPx * 0.03));
      const c = document.createElement('canvas');
      c.width = cols * cellPx + (cols + 1) * gap;
      c.height = rows * cellPx + (rows + 1) * gap;
      const g = c.getContext('2d');
      g.fillStyle = css('--grout') || '#CEC8BB';
      g.fillRect(0, 0, c.width, c.height);
      this.items.forEach((it, i) => {
        const r = Math.floor(i / cols), k = i % cols;
        g.drawImage(E.tileImage(it.design, cellPx, { texture: 0.1 }), gap + k * (cellPx + gap), gap + r * (cellPx + gap));
      });
      return c;
    },
    showFloor() {
      if (!this.items.length) return;
      const n = this.items.length;
      const src = this.classFloorCanvas(n <= 4 ? 200 : n <= 16 ? 150 : 110);
      const cv = $('#classFloor');
      cv.width = src.width; cv.height = src.height;
      cv.style.width = Math.min(src.width, 900) + 'px';
      cv.getContext('2d').drawImage(src, 0, 0);
      $('#floorBox').hidden = false;
      cv.scrollIntoView({ behavior: App.reducedMotion() ? 'auto' : 'smooth', block: 'nearest' });
    },
    downloadFloor() {
      if (!this.items.length) return;
      App.downloadCanvas('全班花階磚地板.png', this.classFloorCanvas(300));
    },
    downloadPlate() {
      if (!global.THREE) { App.toast('未能載入 3D 程式庫（three.js）。'); return; }
      const sel = this.items.filter(i => i.checked);
      if (!sel.length) { App.toast('先剔選要打印的作品。'); return; }
      const size = Number($('#plateSize').value || 220);
      App.toast('生成打印盤中，請稍候……');
      setTimeout(() => {
        try {
          const out = M.plateSTL(sel.map(i => i.design), { plate: size, productKey: 'mini' });
          App.download('打印盤_' + out.count + '件_迷你磚.stl', out.stl, 'model/stl');
          if (sel.length > out.count) App.toast('一盤最多 ' + out.perPlate + ' 件；已包括首 ' + out.count + ' 件，其餘請取消剔選後再下載。');
        } catch (e) {
          console.error(e);
          App.toast('生成打印盤時出錯：' + e.message);
        }
      }, 40);
    },

    /* ---- 答案與提示 ---- */
    renderTips() {
      $('#t-tips').innerHTML =
        '<div class="lesson"><h3>答案與教學提示</h3><ul class="tips">' + C.teacherTips.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul></div>' +
        '<div class="lesson"><h3>計算思維對照</h3><ul class="tips">' +
        '<li><b>拆解</b>：步驟 3 把「設計杯墊」拆成圖案、製作、用家三類小任務。</li>' +
        '<li><b>模式識別</b>：步驟 3 找出 1/8、1/4 的重複單位。</li>' +
        '<li><b>抽象化</b>：步驟 2 只保留 3 個最重要的需要；步驟 6 把顏色轉成高度。</li>' +
        '<li><b>演算法</b>：步驟 4 重複（迴圈）、旋轉、鏡像（條件）；地板的巢狀迴圈及「如果」。</li>' +
        '<li><b>測試與除錯</b>：步驟 4 捉蟲；步驟 7 同學測試、v1 → v2 迭代。</li></ul></div>' +
        '<div class="lesson"><h3>修改內容</h3><p class="small">用家、顏色、產品尺寸、範例磚、意見選項及課堂流程都放在 <code>js/content.js</code>，可以直接修改。</p></div>';
    }
  };
  App.teacher = T;
  App.steps.teacher = { init: () => T.init() };
})(window);
