/* Skill embedding space: every skill is a point in 3D, clustered by category.
   Drag to rotate, hover for nearest neighbours, click to filter the site. */
(() => {
  const D = window.PORTFOLIO;
  const { $, bus, esc, reduceMotion, selectSkill, focusTarget } = window.App;
  const canvas = $('#skills-canvas');
  const ctx = canvas.getContext('2d');
  const tip = $('#space-tip');
  const rotHud = $('#space-rot');

  const catKeys = Object.keys(D.categories);
  const centers = {};
  catKeys.forEach((k, i) => {
    const a = (i / catKeys.length) * Math.PI * 2;
    centers[k] = [Math.cos(a) * 1.55, (i % 2 ? 0.4 : -0.4), Math.sin(a) * 1.55];
  });

  // deterministic jitter per skill name
  const hash = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
  const pts = D.skills.map((s) => {
    let h = hash(s.name);
    const r = () => { h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return h / 4294967296 - 0.5; };
    const c = centers[s.cat];
    return { ...s, color: D.categories[s.cat].color, p: [c[0] + r() * 1.05, c[1] + r() * 1.05, c[2] + r() * 1.05], sx: 0, sy: 0, sz: 0, scale: 1 };
  });
  // centre the cloud so rotation pivots around its middle
  const mean = [0, 1, 2].map((k) => pts.reduce((s, p) => s + p.p[k], 0) / pts.length);
  pts.forEach((p) => { p.p = p.p.map((v, k) => v - mean[k]); });
  const dist = (a, b) => Math.hypot(a.p[0] - b.p[0], a.p[1] - b.p[1], a.p[2] - b.p[2]);
  pts.forEach((p) => {
    p.nn = pts.filter((q) => q !== p).map((q) => ({ q, d: dist(p, q) })).sort((a, b) => a.d - b.d).slice(0, 3);
  });
  const byName = Object.fromEntries(pts.map((p) => [p.name, p]));
  const sim = (d) => Math.max(0, 1 - d / 3.2).toFixed(2);

  // where each skill shows up across the site
  const usage = {};
  const addUse = (skill, label, sub, anchor) => (usage[skill] ||= []).push({ label, sub, anchor });
  D.experience.forEach((x) => x.skills.forEach((s) => addUse(s, `${x.role} · ${x.org}`, 'experience', `#exp-${x.id}`)));
  D.projects.forEach((p) => p.skills.forEach((s) => addUse(s, p.name, 'project', `#proj-${p.id}`)));
  D.certs.forEach((c) => c.skills.forEach((s) => addUse(s, c.title, 'certification', `#${c.id}`)));

  // ── view state ──
  let rotY = 0.6, rotX = -0.25, velY = 0.0025, velX = 0;
  let dragging = false, last = null, moved = 0;
  let hovered = null, selected = null, focusCat = null, searchHit = null;
  let W = 0, H = 0, visible = false;
  const dpr = Math.min(devicePixelRatio || 1, 2);

  function resize() {
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  new ResizeObserver(resize).observe(canvas);

  function project() {
    const cy = Math.cos(rotY), sy = Math.sin(rotY), cx = Math.cos(rotX), sx = Math.sin(rotX);
    const unit = Math.min(W * 0.75, H) * 0.3;
    for (const p of pts) {
      const [x, y, z] = p.p;
      const x1 = x * cy - z * sy;
      const z1 = x * sy + z * cy;
      const y1 = y * cx - z1 * sx;
      const z2 = y * sx + z1 * cx;
      const persp = 8 / (8 + z2);
      p.sx = W / 2 + x1 * unit * persp;
      p.sy = H / 2 + y1 * unit * persp;
      p.sz = z2;
      p.scale = persp;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    project();
    const active = hovered || selected || searchHit;

    // cluster halos
    for (const k of catKeys) {
      const members = pts.filter((p) => p.cat === k);
      const mx = members.reduce((a, p) => a + p.sx, 0) / members.length;
      const my = members.reduce((a, p) => a + p.sy, 0) / members.length;
      const g = ctx.createRadialGradient(mx, my, 0, mx, my, 110);
      const dim = focusCat && focusCat !== k;
      g.addColorStop(0, hexA(D.categories[k].color, dim ? 0.02 : 0.11));
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.fillRect(mx - 120, my - 120, 240, 240);
    }

    // neighbour edges for the active point
    if (active) {
      for (const { q, d } of active.nn) {
        ctx.strokeStyle = hexA(active.color, 0.55);
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 4]);
        ctx.beginPath(); ctx.moveTo(active.sx, active.sy); ctx.lineTo(q.sx, q.sy); ctx.stroke();
        ctx.setLineDash([]);
        const mx = (active.sx + q.sx) / 2, my = (active.sy + q.sy) / 2;
        ctx.fillStyle = 'rgba(236,238,244,0.7)';
        ctx.font = '10px "Geist Mono", monospace';
        ctx.fillText(sim(d), mx + 4, my - 4);
      }
    }

    // points, far to near
    const sorted = [...pts].sort((a, b) => b.sz - a.sz);
    for (const p of sorted) {
      const depth = Math.min(1, Math.max(0, (p.scale - 0.8) / 0.45));
      const isActive = p === active;
      const isNeighbour = active && active.nn.some((n) => n.q === p);
      const dim = (focusCat && focusCat !== p.cat) || (selected && !isActive && !isNeighbour);
      const r = (2.5 + depth * 3) * (isActive ? 1.8 : 1);
      ctx.globalAlpha = dim ? 0.18 : 0.35 + depth * 0.65;
      if (isActive) {
        ctx.fillStyle = hexA(p.color, 0.18);
        ctx.beginPath(); ctx.arc(p.sx, p.sy, r * 3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2); ctx.fill();

      const showLabel = isActive || isNeighbour || (!dim && depth > 0.45) || (focusCat === p.cat);
      if (showLabel) {
        ctx.globalAlpha = dim ? 0.2 : isActive ? 1 : 0.35 + depth * 0.55;
        ctx.fillStyle = '#eceef4';
        ctx.font = `${isActive ? 500 : 400} ${isActive ? 13 : 11}px Geist, system-ui, sans-serif`;
        ctx.fillText(p.name, p.sx + r + 6, p.sy + 4);
      }
    }
    ctx.globalAlpha = 1;
    rotHud.textContent = `θ ${Math.round(((rotY % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) * 57.3)}°`;
  }

  function loop() {
    if (visible) {
      if (!dragging) {
        rotY += reduceMotion ? 0 : velY;
        rotX += velX;
        velY += (0.0025 - velY) * 0.02;
        velX *= 0.92;
        rotX += (-0.25 - rotX) * 0.01;
      }
      draw();
    }
    requestAnimationFrame(loop);
  }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
  requestAnimationFrame(loop);

  // ── interaction ──
  function pick(x, y) {
    let best = null, bd = 22;
    for (const p of pts) {
      const d = Math.hypot(p.sx - x, p.sy - y);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }
  const local = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };

  canvas.addEventListener('pointerdown', (e) => {
    dragging = true; moved = 0; last = local(e);
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    const [x, y] = local(e);
    if (dragging && last) {
      const dx = x - last[0], dy = y - last[1];
      moved += Math.abs(dx) + Math.abs(dy);
      rotY += dx * 0.008; rotX += dy * 0.006;
      velY = dx * 0.0015; velX = dy * 0.001;
      rotX = Math.max(-1.2, Math.min(1.2, rotX));
      last = [x, y];
    }
    const p = dragging && moved > 4 ? null : pick(x, y);
    hovered = p;
    if (p) {
      tip.innerHTML = `${esc(p.name)} <span class="dim">· ${esc(D.categories[p.cat].label)}</span>`;
      tip.style.left = `${p.sx}px`; tip.style.top = `${p.sy}px`;
      tip.classList.add('show');
    } else tip.classList.remove('show');
  });
  canvas.addEventListener('pointerup', (e) => {
    dragging = false;
    if (moved < 5) {
      const [x, y] = local(e);
      const p = pick(x, y);
      if (p) selectSkill(p.name);
      else if (selected) selectSkill(null);
    }
  });
  canvas.addEventListener('pointerleave', () => { hovered = null; tip.classList.remove('show'); });

  // ── legend ──
  const legend = $('#legend');
  legend.innerHTML = catKeys.map((k) => {
    const c = D.categories[k];
    const n = pts.filter((p) => p.cat === k).length;
    return `<button data-cat="${k}"><i style="background:${c.color};color:${c.color}"></i>${esc(c.label)}<span class="count">${n}</span></button>`;
  }).join('');
  legend.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-cat]');
    if (!b) return;
    focusCat = focusCat === b.dataset.cat ? null : b.dataset.cat;
    legend.classList.toggle('focused', !!focusCat);
    legend.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x.dataset.cat === focusCat));
    if (focusCat) {
      // rotate so the focused cluster faces the viewer
      const c = centers[focusCat];
      rotY = Math.atan2(-c[0], -c[2]);
    }
  });

  // ── search: nearest skill by name ──
  const search = $('#skill-search');
  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    searchHit = q ? pts.find((p) => p.name.toLowerCase().startsWith(q)) || pts.find((p) => p.name.toLowerCase().includes(q)) || null : null;
  });
  search.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && searchHit) { selectSkill(searchHit.name); search.value = ''; searchHit = null; }
  });

  // ── detail panel reacts to the global selection ──
  const detail = $('#skill-detail');
  bus.on('skill:select', (name) => {
    selected = name ? byName[name] || null : null;
    if (!selected) {
      detail.innerHTML = '<p class="mono tile-label">query vector</p><p class="detail-empty dim">Select a skill to see where I\'ve used it.</p>';
      return;
    }
    const uses = usage[selected.name] || [];
    detail.innerHTML = `
      <p class="mono tile-label">query vector</p>
      <p class="detail-title"><i style="background:${selected.color}"></i>${esc(selected.name)}</p>
      <p class="detail-cat">${esc(D.categories[selected.cat].label)}</p>
      <p class="mono tile-label">used in · ${uses.length}</p>
      ${uses.length ? `<ul class="used">${uses.map((u) => `<li><button data-go="${u.anchor}"><span>${esc(u.label)}</span><span class="mono">${u.sub}</span></button></li>`).join('')}</ul>`
        : '<p class="dim" style="margin-bottom:16px;font-size:.9rem">Part of the toolkit, not tied to one listed role or project.</p>'}
      <p class="mono tile-label">nearest neighbours</p>
      <div class="neighbours">${selected.nn.map(({ q, d }) => `<button class="tag" data-skill="${esc(q.name)}">${esc(q.name)} · ${sim(d)}</button>`).join('')}</div>`;
  });
  detail.addEventListener('click', (e) => {
    const go = e.target.closest('[data-go]');
    if (go) focusTarget(go.dataset.go);
  });

  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
  }
})();
