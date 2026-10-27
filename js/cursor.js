/* Cursor layer: dot + lagging ring with contextual labels, a gradient
   "attention" trail, magnetic buttons, 3D tilt, glass spotlights and
   scramble-on-hover text. */
(() => {
  const { $, $$, finePointer, reduceMotion } = window.App;

  const mouse = { x: innerWidth / 2, y: innerHeight / 2, moved: false };
  window.App.mouse = mouse;

  // Spotlight + border glow on every glass panel, including neighbours of the hovered one.
  let glassEls = [];
  const refreshGlass = () => { glassEls = $$('.glass'); };
  let spotQueued = false;
  function updateSpotlights() {
    spotQueued = false;
    for (const el of glassEls) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) continue;
      el.style.setProperty('--mx', `${mouse.x - r.left}px`);
      el.style.setProperty('--my', `${mouse.y - r.top}px`);
    }
  }
  const queueSpot = () => { if (!spotQueued) { spotQueued = true; requestAnimationFrame(updateSpotlights); } };

  addEventListener('pointermove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.moved = true;
    queueSpot();
  }, { passive: true });
  addEventListener('scroll', queueSpot, { passive: true });

  window.App.refreshInteractive = () => {
    refreshGlass();
    bindMagnetic();
    bindTilt();
    bindScramble();
  };

  // ── magnetic buttons ──
  function bindMagnetic() {
    if (!finePointer || reduceMotion) return;
    $$('.magnetic:not([data-mag])').forEach((el) => {
      el.dataset.mag = '1';
      const strength = el.classList.contains('email-pill') ? 0.06 : 0.28;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  // ── 3D tilt on cards ──
  function bindTilt() {
    if (!finePointer || reduceMotion) return;
    $$('.tilt:not([data-tilt])').forEach((el) => {
      el.dataset.tilt = '1';
      const max = el.classList.contains('proj') ? 5 : 7;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transition = 'transform 0.1s, opacity 0.4s, filter 0.4s, border-color 0.4s, box-shadow 0.4s';
        el.style.transform = `perspective(900px) rotateX(${-py * max}deg) rotateY(${px * max}deg) translateZ(0)`;
      });
      el.addEventListener('pointerleave', () => {
        el.style.transition = 'transform 0.6s cubic-bezier(.2,.8,.2,1), opacity 0.4s, filter 0.4s, border-color 0.4s, box-shadow 0.4s';
        el.style.transform = '';
      });
    });
  }

  // ── scramble text (decoder effect) ──
  const GLYPHS = '01<>/{}[]=+*#%$abcdefxyz';
  function bindScramble() {
    $$('[data-scramble]:not([data-scr])').forEach((el) => {
      el.dataset.scr = '1';
      const original = el.textContent;
      let raf;
      el.addEventListener('pointerenter', () => {
        if (reduceMotion) return;
        let frame = 0;
        cancelAnimationFrame(raf);
        const tick = () => {
          frame++;
          el.textContent = original.split('').map((c, i) => (i < frame / 2 ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join('');
          if (frame / 2 < original.length) raf = requestAnimationFrame(tick);
          else el.textContent = original;
        };
        tick();
      });
    });
  }

  if (!finePointer) { window.App.refreshInteractive(); return; }

  // ── custom cursor ──
  document.body.classList.add('has-cursor');
  const dot = $('.cursor-dot');
  const ring = $('.cursor-ring');
  const label = $('.cursor-label');
  const ringPos = { x: mouse.x, y: mouse.y };

  document.addEventListener('pointerover', (e) => {
    const t = e.target;
    const labelled = t.closest('[data-cursor]');
    const textField = t.closest('input[type=text], textarea');
    const clickable = t.closest('a, button, [role=button], .chips button, .tag, input[type=range]');
    ring.classList.remove('hover', 'label', 'text');
    if (textField) ring.classList.add('text');
    else if (labelled) { ring.classList.add('label'); label.textContent = labelled.dataset.cursor; }
    else if (clickable) ring.classList.add('hover');
  });
  addEventListener('pointerdown', () => ring.classList.add('down'));
  addEventListener('pointerup', () => ring.classList.remove('down'));
  document.addEventListener('pointerleave', () => document.body.classList.add('cursor-hidden'));
  document.addEventListener('pointerenter', () => document.body.classList.remove('cursor-hidden'));

  // ── trail canvas ──
  const trail = $('#trail');
  const tctx = trail.getContext('2d');
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const sizeTrail = () => {
    trail.width = innerWidth * dpr;
    trail.height = innerHeight * dpr;
    tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  sizeTrail();
  addEventListener('resize', sizeTrail);
  const pts = [];
  const TRAIL_MS = 380;

  function loop(now) {
    dot.style.transform = `translate(${mouse.x}px, ${mouse.y}px)`;
    ringPos.x += (mouse.x - ringPos.x) * 0.18;
    ringPos.y += (mouse.y - ringPos.y) * 0.18;
    ring.style.transform = `translate(${ringPos.x}px, ${ringPos.y}px)`;

    if (!reduceMotion) {
      const last = pts[pts.length - 1];
      if (!last || last.x !== mouse.x || last.y !== mouse.y) pts.push({ x: mouse.x, y: mouse.y, t: now });
      while (pts.length && now - pts[0].t > TRAIL_MS) pts.shift();
      tctx.clearRect(0, 0, innerWidth, innerHeight);
      if (pts.length > 2) {
        tctx.lineCap = 'round';
        for (let i = 1; i < pts.length; i++) {
          const a = pts[i - 1];
          const b = pts[i];
          const k = i / pts.length;
          tctx.strokeStyle = `hsla(${250 - k * 85}, 95%, 72%, ${k * 0.55})`;
          tctx.lineWidth = k * 3.2;
          tctx.beginPath();
          tctx.moveTo(a.x, a.y);
          tctx.lineTo(b.x, b.y);
          tctx.stroke();
        }
      }
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  window.App.refreshInteractive();
})();
