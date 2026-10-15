// 常用動畫小工具（各站共用）
const gsap = window.gsap;

/** 把元素內所有文字拆成逐字 <span class="ch">，保留原有的 <span class="kw"> 等標記。回傳字元陣列。 */
export function splitChars(el) {
  const chars = [];
  const walk = node => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        for (const c of child.textContent) {
          if (c === '\n') { frag.appendChild(document.createTextNode('\n')); continue; }
          const s = document.createElement('span');
          s.className = 'ch'; s.textContent = c;
          frag.appendChild(s); chars.push(s);
        }
        child.replaceWith(frag);
      } else if (child.nodeType === 1) walk(child);
    }
  };
  walk(el);
  return chars;
}

/**
 * 打字效果：逐字顯示（支援已上色的程式碼 HTML）。
 * 回傳 timeline。opts: { cps 每秒字數, sfx, cursor: true }
 */
export function typeOn(el, opts = {}) {
  const chars = splitChars(el);
  const cps = opts.cps ?? 45;
  gsap.set(chars, { visibility: 'hidden' });
  const tl = gsap.timeline();
  let cursor;
  if (opts.cursor !== false) {
    cursor = document.createElement('span');
    cursor.className = 'type-cursor';
    cursor.style.cssText = 'display:inline-block;width:.55em;height:1.1em;vertical-align:-.15em;background:var(--accent);margin-left:2px;box-shadow:0 0 12px var(--accent)';
  }
  chars.forEach((c, i) => {
    tl.call(() => {
      c.style.visibility = 'visible';
      if (cursor) c.after(cursor);
      if (opts.sfx && i % 2 === 0 && c.textContent.trim()) opts.sfx.play('type');
    }, null, i / cps);
  });
  if (cursor) tl.call(() => { gsap.to(cursor, { opacity: 0, repeat: -1, yoyo: true, duration: 0.45, ease: 'steps(1)' }); }, null, chars.length / cps);
  tl.cursor = cursor;
  return tl;
}

/** 數字由 from 跳到 to。 */
export function countUp(el, to, opts = {}) {
  const o = { v: opts.from ?? 0 };
  const dec = opts.decimals ?? 0;
  const fmt = v => (opts.prefix || '') + (opts.comma === false ? v.toFixed(dec) : Number(v.toFixed(dec)).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })) + (opts.suffix || '');
  el.textContent = fmt(o.v);
  return gsap.to(o, { v: to, duration: opts.duration ?? 1.4, ease: opts.ease ?? 'power2.out', delay: opts.delay ?? 0, onUpdate: () => { el.textContent = fmt(o.v); } });
}

/** 亂碼解碼效果（ScrambleTextPlugin）。 */
export function scramble(el, text, opts = {}) {
  return gsap.to(el, { duration: opts.duration ?? 1.0, delay: opts.delay ?? 0, scrambleText: { text, chars: opts.chars ?? '01', speed: 0.6, revealDelay: opts.revealDelay ?? 0.2 } });
}

/** 簡單 Python 語法上色，回傳 HTML（已轉義）。 */
export function highlightPython(code) {
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const KW = new Set(['import', 'from', 'as', 'def', 'return', 'if', 'elif', 'else', 'for', 'while', 'in', 'not', 'and', 'or', 'True', 'False', 'None', 'class', 'break', 'continue', 'pass', 'with', 'try', 'except', 'lambda', 'global', 'range']);
  const BI = new Set(['print', 'input', 'len', 'int', 'str', 'float', 'list', 'dict', 'sum', 'min', 'max', 'sorted', 'enumerate', 'zip', 'abs', 'round', 'chr', 'ord', 'bin', 'format', 'open', 'random', 'math']);
  const re = /(#[^\n]*)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)|([=+\-*/%<>!]+)|([\s\S])/g;
  let out = '', m;
  while ((m = re.exec(code))) {
    if (m[1]) out += `<span class="com">${esc(m[1])}</span>`;
    else if (m[2]) out += `<span class="str">${esc(m[2])}</span>`;
    else if (m[3]) out += `<span class="num">${m[3]}</span>`;
    else if (m[4]) out += KW.has(m[4]) ? `<span class="kw">${m[4]}</span>` : BI.has(m[4]) ? `<span class="fn">${m[4]}</span>` : m[4];
    else if (m[5]) out += `<span class="op">${esc(m[5])}</span>`;
    else out += esc(m[6]);
  }
  return out;
}

/** 簡單 SQL 語法上色。 */
export function highlightSQL(code) {
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const KW = /\b(SELECT|FROM|WHERE|ORDER|BY|GROUP|HAVING|ASC|DESC|AND|OR|NOT|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|COUNT|AVG|SUM|MIN|MAX|AS|LIMIT|LIKE|JOIN|ON|INTEGER|TEXT|REAL)\b/gi;
  return code.split(/('(?:[^']|'')*')/g).map((part, i) => i % 2 ? `<span class="str">${esc(part)}</span>`
    : esc(part).replace(KW, w => `<span class="kw">${w.toUpperCase()}</span>`).replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="num">$1</span>')).join('');
}

/** 建立 DOM：h('div.panel.foo', {style:'…'}, '文字', child…) */
export function h(tag, attrs, ...kids) {
  const [name, ...cls] = tag.split('.');
  const el = document.createElement(name || 'div');
  if (cls.length) el.className = cls.join(' ');
  if (attrs && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) { kids.unshift(attrs); attrs = null; }
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) el.append(k instanceof Node ? k : document.createTextNode(String(k)));
  return el;
}

/** 在指定位置發出一圈光環（點擊／強調用）。x, y 為站內座標。 */
export function pulseAt(root, x, y, color = 'var(--accent)') {
  const r = document.createElement('div');
  r.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:20px;height:20px;margin:-10px 0 0 -10px;border-radius:50%;border:3px solid ${color};pointer-events:none;z-index:50`;
  root.appendChild(r);
  gsap.fromTo(r, { scale: 0.5, opacity: 1 }, { scale: 9, opacity: 0, duration: 0.9, ease: 'power2.out', onComplete: () => r.remove() });
}
