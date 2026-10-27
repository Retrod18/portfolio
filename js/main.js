/* Renders content from data.js and connects the widgets to each other. */
(() => {
  const D = window.PORTFOLIO;
  const { $, $$, bus, esc, reduceMotion, sleep, copy, selectSkill, focusTarget } = window.App;

  // ── content ──
  $('#status-text').textContent = D.status;
  $('#summary').innerHTML = esc(D.summary)
    .replace('generative AI and LLM applications', '<b>generative AI and LLM applications</b>')
    .replace('RAG pipelines, autonomous AI agents', '<b>RAG pipelines, autonomous AI agents</b>');
  $('#email-text').textContent = D.email;
  $('#lnk-linkedin').href = D.linkedin;
  $('#lnk-github').href = D.github;
  $('#year').textContent = new Date().getFullYear();
  if (/Mac|iPhone|iPad/.test(navigator.platform)) $('#kbd-mod').textContent = '⌘';
  // touch devices have no shortcut: the palette doubles as the menu
  if (!window.App.finePointer) $('#open-palette').innerHTML = '<span class="mono">menu</span>';

  $('#metrics').innerHTML = D.metrics.map((m, i) => `
    <article class="glass metric tilt" data-reveal style="--d:${i * 0.06}s">
      <p class="num">${m.prefix ? `<span>${m.prefix}</span>` : ''}<b data-count="${m.value}">0</b><span>${m.suffix}</span></p>
      <p>${esc(m.label)}</p>
    </article>`).join('');

  const marqueeItems = D.skills.map((s) => `<span>${esc(s.name)}</span>`).join('');
  $('#marquee').innerHTML = marqueeItems + marqueeItems;

  const tags = (skills) => `<div class="tags">${skills.map((s) => `<button class="tag" data-skill="${esc(s)}" data-cursor="filter">${esc(s)}</button>`).join('')}</div>`;

  $('#exp-list').innerHTML = D.experience.map((x, i) => `
    <article class="glass exp" id="exp-${x.id}" data-reveal data-skills="${esc(x.skills.join('|'))}">
      <span class="exp-dot"></span>
      <div class="exp-head">
        <div>
          <p class="mono exp-period">${esc(x.period)}</p>
          <h3>${esc(x.role)} <span class="at">@</span> ${esc(x.org)}</h3>
          <p class="exp-note">${esc(x.note)}</p>
        </div>
        <span class="mono exp-idx">step_${String(i + 1).padStart(2, '0')}</span>
      </div>
      <ol class="trace">${x.trace.map(([k, v]) => `<li class="trace-${k}"><span class="mono k">${k}</span><span class="v">${esc(v)}</span></li>`).join('')}</ol>
      ${tags(x.skills)}
    </article>`).join('');

  $('#proj-list').innerHTML = D.projects.map((p) => `
    <article class="glass proj tilt ${p.featured ? 'featured' : ''}" id="proj-${p.id}" data-reveal data-skills="${esc(p.skills.join('|'))}">
      <div class="proj-top">
        <div>
          <p class="mono proj-kind">${esc(p.kind)} · ${esc(p.date)}</p>
          <h3>${esc(p.name)}</h3>
        </div>
        <div class="proj-metric"><strong>${esc(p.metric[0])}</strong><span class="mono dim">${esc(p.metric[1])}</span></div>
      </div>
      <div class="pipe" aria-label="Pipeline: ${esc(p.pipeline.join(' to '))}">
        ${p.pipeline.map((n, i) => `${i ? `<span class="edge" style="--i:${i}"></span>` : ''}<span class="node">${esc(n)}</span>`).join('')}
      </div>
      <p class="blurb">${esc(p.blurb)}</p>
      <div class="proj-foot">
        ${tags(p.skills)}
        <div class="proj-links">${(p.links || [{ label: 'github', url: D.github }]).map((l) => `<a class="proj-link" href="${esc(l.url)}" target="_blank" rel="noopener" data-cursor="${l.cursor || 'code'}">${esc(l.label)} ↗</a>`).join('')}</div>
      </div>
    </article>`).join('');

  $('#edu-list').innerHTML = D.education.map((e) => `
    <li><span class="t">${esc(e.title)}</span><span class="p">${esc(e.period)}</span><span class="o">${esc(e.org)}</span><span class="g">${esc(e.detail)}</span></li>`).join('');
  $('#cert-list').innerHTML = D.certs.map((c) => `
    <li id="${c.id}" data-skills="${esc(c.skills.join('|'))}"><p class="t">${esc(c.title)}</p><p class="o">${esc(c.org)} · ${esc(c.period)}</p></li>`).join('');

  // section rail
  const sections = $$('[data-section]');
  $('#rail').innerHTML = sections.map((s) => `<a href="#${s.id}" data-id="${s.id}" aria-label="${s.id}"><span>${s.id}</span><i></i></a>`).join('');

  window.App.refreshInteractive();

  // ── reveal on scroll ──
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      revealIO.unobserve(e.target);
      e.target.querySelectorAll('[data-count]').forEach(countUp);
      if (e.target.classList.contains('proj')) animatePipe(e.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  $$('[data-reveal]').forEach((el) => revealIO.observe(el));

  function countUp(el) {
    const end = +el.dataset.count;
    if (reduceMotion) { el.textContent = end; return; }
    const t0 = performance.now();
    const dur = 1400;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      el.textContent = Math.round(end * (1 - Math.pow(1 - k, 4)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // light up pipeline nodes one after another, on loop while visible
  function animatePipe(card) {
    const nodes = [...card.querySelectorAll('.pipe .node')];
    let i = 0;
    setInterval(() => {
      if (document.hidden) return;
      nodes.forEach((n, k) => n.classList.toggle('lit', k === i));
      i = (i + 1) % nodes.length;
    }, 650);
  }

  // ── active section → nav, rail, 3D manifold ──
  const navLinks = $$('.nav-links a');
  const railLinks = $$('#rail a');
  const sectionIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const id = e.target.id;
      navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${id}`));
      railLinks.forEach((a) => a.classList.toggle('active', a.dataset.id === id));
      document.body.classList.toggle('past-hero', id !== 'hero');
      bus.emit('section:change', { id, shape: e.target.dataset.section });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => sectionIO.observe(s));

  // ── hero: streamed tagline ──
  (async function stream() {
    const el = $('#stream');
    if (reduceMotion) { el.textContent = D.streamLines[0]; return; }
    await sleep(900);
    for (let n = 0; ; n = (n + 1) % D.streamLines.length) {
      const toks = D.streamLines[n].match(/\S+\s*/g);
      el.textContent = '';
      for (const t of toks) {
        el.textContent += t;
        await sleep(55 + Math.random() * 90);
      }
      await sleep(2600);
      // "regenerate": fade out token by token from the end
      for (let k = toks.length; k > 0; k--) {
        el.textContent = toks.slice(0, k - 1).join('');
        await sleep(28);
      }
      await sleep(250);
    }
  })();

  // ── hero: params widget ↔ 3D scene ──
  const temp = $('#temp'), topk = $('#topk');
  const fill = (r) => r.style.setProperty('--p', `${((r.value - r.min) / (r.max - r.min)) * 100}%`);
  temp.addEventListener('input', () => {
    $('#temp-out').textContent = (+temp.value).toFixed(2);
    fill(temp);
    window.scene3d?.setTemperature(+temp.value);
  });
  topk.addEventListener('input', () => {
    $('#topk-out').textContent = topk.value;
    fill(topk);
    window.scene3d?.setTopK(+topk.value);
  });
  fill(temp); fill(topk);
  $('#shape-chips').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-shape]');
    if (b) window.scene3d?.setShape(b.dataset.shape);
  });
  bus.on('scene:shape', (shape) => $$('#shape-chips button').forEach((b) => b.classList.toggle('on', b.dataset.shape === shape)));
  bus.on('scene:stats', ({ fps, edges }) => {
    $('#fps').textContent = `${fps} fps`;
    $('#edge-count').textContent = edges;
  });

  // ── clock ──
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: D.timezone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const dayFmt = new Intl.DateTimeFormat('en-GB', { timeZone: D.timezone, weekday: 'long' });
  const tick = () => {
    const now = new Date();
    $('#clock').textContent = fmt.format(now);
    const h = +fmt.format(now).slice(0, 2);
    const mood = h < 6 ? 'probably asleep' : h < 10 ? 'morning coffee' : h < 19 ? 'likely building' : h < 23 ? 'evening deep work' : 'late-night debugging';
    $('#clock-meta').textContent = `IST · ${dayFmt.format(now)} · ${mood}`;
  };
  tick();
  setInterval(tick, 1000);

  // ── global skill filter ──
  document.addEventListener('click', (e) => {
    const tag = e.target.closest('.tag[data-skill]');
    if (tag) selectSkill(tag.dataset.skill);
  });
  bus.on('skill:select', (name) => {
    document.body.classList.toggle('filtering', !!name);
    $('#filter-name').textContent = name || '';
    $$('[data-skills]').forEach((el) => el.classList.toggle('match', !!name && el.dataset.skills.split('|').includes(name)));
    $$('.tag[data-skill]').forEach((t) => t.classList.toggle('on', t.dataset.skill === name));
  });
  $('#filter-clear').addEventListener('click', () => selectSkill(null));

  // ── contact ──
  $('#copy-email').addEventListener('click', () => copy(D.email, 'Email copied'));
  $('#compose').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    const subject = `Hello from ${f.name.value.trim()}`;
    const body = `${f.msg.value.trim()}\n\n— ${f.name.value.trim()}`;
    location.href = `mailto:${D.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });

  // smooth in-page links that also flash their target
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href') === '#') return;
    e.preventDefault();
    focusTarget(a.getAttribute('href'));
  });

  // ── loader ──
  const loader = $('#loader');
  const fillEl = $('#loader-fill');
  const pctEl = $('#loader-pct');
  let pct = 0, ready = false;
  bus.on('scene:ready', () => { ready = true; });
  const timer = setInterval(() => {
    pct = Math.min(ready ? 100 : 92, pct + (ready ? 9 : 2 + Math.random() * 5));
    fillEl.style.width = `${pct}%`;
    pctEl.textContent = Math.round(pct);
    if (pct >= 100) finish();
  }, 40);
  const hardStop = setTimeout(finish, 4500);
  function finish() {
    clearInterval(timer);
    clearTimeout(hardStop);
    loader.classList.add('done');
    $$('#hero [data-reveal]').forEach((el, i) => { el.style.setProperty('--d', `${0.1 + i * 0.08}s`); el.classList.add('in'); });
  }
})();
