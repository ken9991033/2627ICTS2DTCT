// Prezi 式鏡頭轉場。每個轉場回傳一個 GSAP timeline。
// 「focus」是外層世界內的一點（舞台座標），鏡頭會穿過這一點進入／退出。
const gsap = window.gsap;

const REVERSE = { zoomIn: 'zoomOut', zoomOut: 'zoomIn', flip: 'flipBack', flipBack: 'flip', glitch: 'glitch', fade: 'fade', pan: 'pan', orbit: 'orbitBack', orbitBack: 'orbit' };
const OPP = { left: 'right', right: 'left', up: 'down', down: 'up' };

export function reverseOf(t) {
  const type = REVERSE[t.type] || 'fade';
  return { ...t, type, dir: t.type === 'pan' ? OPP[t.dir || 'right'] : t.dir };
}

function flash(tl, at, strength = 0.7) {
  const el = document.getElementById('flash');
  tl.fromTo(el, { opacity: 0 }, { opacity: strength, duration: 0.18, ease: 'power2.in' }, at)
    .to(el, { opacity: 0, duration: 0.5, ease: 'power2.out' }, at + 0.18);
}

const clear = el => gsap.set(el, { clearProps: 'transform,opacity,filter,clipPath,transformOrigin,zIndex' });

export function runTransition(t, fromEl, toEl, env) {
  const { bg, sfx, focus = { x: 960, y: 540 }, onLand } = env;
  const tl = gsap.timeline({ onComplete: () => { clear(fromEl); clear(toEl); } });
  const origin = `${focus.x}px ${focus.y}px`;
  let land = 0.6;

  switch (t.type) {
    case 'zoomIn': {
      // 鏡頭衝入外層（from）的 focus 點，新世界由那一點長出來
      sfx.play('whoosh'); bg.warp(1, 1.6, 1.1);
      gsap.set(fromEl, { transformOrigin: origin });
      gsap.set(toEl, { transformOrigin: origin, scale: 0.06, opacity: 0 });
      tl.to(fromEl, { scale: 14, opacity: 0, duration: 1.3, ease: 'power3.in' }, 0)
        .to(toEl, { opacity: 1, duration: 0.35, ease: 'none' }, 0.62)
        .to(toEl, { scale: 1, duration: 1.15, ease: 'expo.out' }, 0.62);
      flash(tl, 0.95, 0.55);
      land = 0.9;
      break;
    }
    case 'zoomOut': {
      // 鏡頭向後拉：舊世界縮回新世界（to）的 focus 點
      sfx.play('whooshOut'); bg.warp(-1, 1.6, 1.1);
      gsap.set(fromEl, { transformOrigin: '50% 50%' });
      gsap.set(toEl, { transformOrigin: origin, scale: 9, opacity: 0 });
      tl.to(fromEl, { scale: 0.05, opacity: 0, x: focus.x - 960, y: focus.y - 540, duration: 1.25, ease: 'power3.in' }, 0)
        .to(toEl, { opacity: 1, duration: 0.5, ease: 'none' }, 0.35)
        .to(toEl, { scale: 1, duration: 1.4, ease: 'expo.out' }, 0.35);
      land = 0.75;
      break;
    }
    case 'pan': {
      // 拉遠 → 平移（略帶旋轉）→ 拉近
      sfx.play('swipe'); bg.warp(1, 1.2, 0.35);
      const d = t.dir || 'right';
      const vx = d === 'right' ? 1 : d === 'left' ? -1 : 0;
      const vy = d === 'down' ? 1 : d === 'up' ? -1 : 0;
      const rot = (t.rotate ?? 6) * (vx || vy);
      gsap.set(toEl, { x: vx * 2300, y: vy * 1400, scale: 0.72, rotation: rot, opacity: 1 });
      tl.to(fromEl, { scale: 0.72, duration: 0.45, ease: 'power2.inOut' }, 0)
        .to(fromEl, { x: -vx * 2300, y: -vy * 1400, rotation: -rot, duration: 0.85, ease: 'power3.inOut' }, 0.3)
        .to(toEl, { x: 0, y: 0, rotation: 0, duration: 0.85, ease: 'power3.inOut' }, 0.3)
        .to(toEl, { scale: 1, duration: 0.6, ease: 'power2.out' }, 1.0);
      land = 0.75;
      break;
    }
    case 'flip':
    case 'flipBack': {
      // 立方體式翻轉
      sfx.play('swipe'); bg.warp(1, 1.1, 0.4);
      const s = t.type === 'flip' ? 1 : -1;
      gsap.set(toEl, { transformPerspective: 2400, transformOrigin: s > 0 ? '0% 50%' : '100% 50%', rotationY: 88 * s, x: 1920 * s * 0.5, opacity: 0.2 });
      gsap.set(fromEl, { transformPerspective: 2400, transformOrigin: s > 0 ? '100% 50%' : '0% 50%' });
      tl.to(fromEl, { rotationY: -88 * s, x: -1920 * s * 0.5, opacity: 0.1, duration: 1.0, ease: 'power3.inOut' }, 0)
        .to(toEl, { rotationY: 0, x: 0, opacity: 1, duration: 1.0, ease: 'power3.inOut' }, 0);
      land = 0.55;
      break;
    }
    case 'orbit':
    case 'orbitBack': {
      // 鏡頭繞過去：新畫面由深處旋轉而來
      sfx.play('whoosh'); bg.warp(1, 1.4, 0.7);
      const s = t.type === 'orbit' ? 1 : -1;
      gsap.set(toEl, { transformPerspective: 2000, rotationX: 0, rotationY: -40 * s, z: -1800, opacity: 0 });
      tl.to(fromEl, { transformPerspective: 2000, rotationY: 40 * s, z: -1800, opacity: 0, duration: 0.9, ease: 'power3.in' }, 0)
        .to(toEl, { rotationY: 0, z: 0, opacity: 1, duration: 1.1, ease: 'expo.out' }, 0.55);
      land = 0.75;
      break;
    }
    case 'glitch': {
      // 數碼干擾
      sfx.play('glitch');
      const g = gsap.timeline();
      for (let i = 0; i < 6; i++) g.set(fromEl, { x: gsap.utils.random(-60, 60), skewX: gsap.utils.random(-14, 14), filter: `hue-rotate(${gsap.utils.random(0, 300)}deg) saturate(3)`, clipPath: `inset(${gsap.utils.random(0, 60)}% 0 ${gsap.utils.random(0, 30)}% 0)` }, i * 0.05);
      tl.add(g, 0).set(fromEl, { opacity: 0 }, 0.32)
        .fromTo(toEl, { opacity: 1, clipPath: 'inset(49% 0 49% 0)', filter: 'brightness(3) saturate(0)' }, { clipPath: 'inset(0% 0 0% 0)', filter: 'brightness(1) saturate(1)', duration: 0.6, ease: 'expo.out' }, 0.3);
      land = 0.4;
      break;
    }
    default: {
      gsap.set(toEl, { opacity: 0, scale: 1.04 });
      tl.to(fromEl, { opacity: 0, duration: 0.5 }, 0).to(toEl, { opacity: 1, scale: 1, duration: 0.7, ease: 'power2.out' }, 0.2);
      land = 0.3;
    }
  }
  if (onLand) tl.call(onLand, null, land);
  return tl;
}
