// 音效：全部由 Web Audio 即時合成，不需下載音效檔。按 M 開關。
export function createSfx() {
  let ctx = null, master = null;
  let enabled = true;
  try { enabled = localStorage.getItem('ict-talk-sound') !== 'off'; } catch (e) { /* 私隱模式 */ }

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.32;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  // 第一次按鍵或點擊後才可以播放聲音（瀏覽器規定）
  const unlock = () => { ensure(); removeEventListener('keydown', unlock); removeEventListener('pointerdown', unlock); };
  addEventListener('keydown', unlock); addEventListener('pointerdown', unlock);

  function noiseBuffer(sec = 1) {
    const b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function tone({ type = 'sine', f0 = 440, f1 = f0, dur = 0.15, gain = 0.3, delay = 0, attack = 0.005 }) {
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise({ dur = 0.8, f0 = 400, f1 = 4000, q = 1.2, gain = 0.4, delay = 0, type = 'bandpass' }) {
    const t = ctx.currentTime + delay;
    const s = ctx.createBufferSource(); s.buffer = noiseBuffer(dur + 0.1);
    const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(master); s.start(t); s.stop(t + dur + 0.1);
  }

  const sounds = {
    whoosh: () => { noise({ dur: 0.9, f0: 300, f1: 3200, gain: 0.35 }); tone({ type: 'sine', f0: 90, f1: 40, dur: 0.9, gain: 0.25 }); },
    whooshOut: () => { noise({ dur: 0.9, f0: 3200, f1: 300, gain: 0.32 }); tone({ type: 'sine', f0: 50, f1: 110, dur: 0.8, gain: 0.2 }); },
    swipe: () => noise({ dur: 0.45, f0: 900, f1: 2400, gain: 0.22 }),
    blip: () => tone({ type: 'square', f0: 880, f1: 1320, dur: 0.07, gain: 0.08 }),
    tick: () => tone({ type: 'square', f0: 1800, f1: 1600, dur: 0.025, gain: 0.04 }),
    type: () => tone({ type: 'square', f0: 2200 + Math.random() * 600, f1: 1800, dur: 0.018, gain: 0.025 }),
    pop: () => tone({ type: 'sine', f0: 520, f1: 980, dur: 0.12, gain: 0.18 }),
    reveal: () => { tone({ type: 'triangle', f0: 523, dur: 0.18, gain: 0.14 }); tone({ type: 'triangle', f0: 784, dur: 0.24, gain: 0.12, delay: 0.07 }); },
    success: () => [523, 659, 784, 1047].forEach((f, i) => tone({ type: 'triangle', f0: f, dur: 0.22, gain: 0.13, delay: i * 0.08 })),
    error: () => { tone({ type: 'sawtooth', f0: 220, f1: 150, dur: 0.22, gain: 0.1 }); tone({ type: 'sawtooth', f0: 180, f1: 110, dur: 0.28, gain: 0.1, delay: 0.12 }); },
    boom: () => { tone({ type: 'sine', f0: 140, f1: 30, dur: 1.4, gain: 0.5 }); noise({ dur: 1.2, f0: 2000, f1: 120, gain: 0.3, type: 'lowpass' }); },
    rise: () => { tone({ type: 'sawtooth', f0: 110, f1: 880, dur: 1.6, gain: 0.07, attack: 0.4 }); noise({ dur: 1.6, f0: 200, f1: 6000, gain: 0.12 }); },
    glitch: () => { for (let i = 0; i < 6; i++) tone({ type: 'square', f0: 200 + Math.random() * 1800, dur: 0.03, gain: 0.05, delay: i * 0.035 }); },
    hum: () => tone({ type: 'sine', f0: 60, f1: 62, dur: 1.5, gain: 0.08, attack: 0.3 }),
  };

  return {
    play(name) {
      if (!enabled || !sounds[name]) return;
      if (!ensure()) return;
      try { sounds[name](); } catch (e) { /* 忽略 */ }
    },
    get enabled() { return enabled; },
    toggle() {
      enabled = !enabled;
      try { localStorage.setItem('ict-talk-sound', enabled ? 'on' : 'off'); } catch (e) { /* 忽略 */ }
      return enabled;
    },
  };
}
