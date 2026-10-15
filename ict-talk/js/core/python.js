// 在瀏覽器內執行真正的 Python（Pyodide，CPython 編譯成 WebAssembly）。
// 開啟網站後會在背景預先載入（約 13 MB），到 D 站時通常已經準備好。
let pyPromise = null;
let status = 'idle'; // idle | loading | ready | error
const listeners = new Set();

function setStatus(s) { status = s; listeners.forEach(fn => { try { fn(s); } catch (e) { /* 忽略 */ } }); }

export function preloadPython() {
  if (pyPromise) return pyPromise;
  setStatus('loading');
  pyPromise = (async () => {
    const base = new URL('../../vendor/pyodide/', import.meta.url).href;
    const { loadPyodide } = await import('../../vendor/pyodide/pyodide.mjs');
    const py = await loadPyodide({ indexURL: base });
    setStatus('ready');
    return py;
  })().catch(err => { console.error('Pyodide 載入失敗', err); setStatus('error'); pyPromise = null; throw err; });
  return pyPromise;
}

export const python = {
  get status() { return status; },
  onStatus(fn) { listeners.add(fn); fn(status); return () => listeners.delete(fn); },
  load: preloadPython,
  /**
   * 執行一段 Python 程式。
   * opts.onOut(text) / opts.onErr(text)：逐行收到輸出
   * opts.globals：要放進 Python 的變數（例如 {name: 'Ken'}）
   * opts.stdin：input() 會依次讀取的字串陣列
   * 回傳 { ok, result, error, ms }
   */
  async run(code, opts = {}) {
    const py = await preloadPython();
    const t0 = performance.now();
    py.setStdout({ batched: s => opts.onOut && opts.onOut(s) });
    py.setStderr({ batched: s => opts.onErr && opts.onErr(s) });
    const queue = [...(opts.stdin || [])];
    py.setStdin({ stdin: () => (queue.length ? String(queue.shift()) : undefined) });
    try {
      const ns = py.globals.get('dict')();
      if (opts.globals) for (const [k, v] of Object.entries(opts.globals)) ns.set(k, py.toPy(v));
      const result = await py.runPythonAsync(code, { globals: ns });
      const out = result && result.toJs ? result.toJs({ dict_converter: Object.fromEntries }) : result;
      if (result && result.destroy) result.destroy();
      ns.destroy();
      return { ok: true, result: out, ms: performance.now() - t0 };
    } catch (err) {
      // 只保留最後幾行，學生較易看懂
      const msg = String(err.message || err).trim().split('\n').filter(l => !l.includes('File "/lib/python')).slice(-3).join('\n');
      opts.onErr && opts.onErr(msg);
      return { ok: false, error: msg, ms: performance.now() - t0 };
    }
  },
};
