/* Command palette (Ctrl/⌘ K or /): jump around, morph the 3D scene, filter
   by skill, open links, or fall through to asking the resume RAG. */
(() => {
  const D = window.PORTFOLIO;
  const { $, esc, focusTarget, copy, selectSkill } = window.App;
  const root = $('#palette');
  const input = $('#palette-q');
  const list = $('#palette-list');

  const go = (sel) => () => focusTarget(sel);
  const commands = [
    { group: 'Navigate', ic: '00', label: 'Home', run: go('#hero') },
    { group: 'Navigate', ic: '01', label: 'About', run: go('#about') },
    { group: 'Navigate', ic: '02', label: 'Experience · agent trace', run: go('#experience') },
    { group: 'Navigate', ic: '03', label: 'Projects', run: go('#projects') },
    { group: 'Navigate', ic: '04', label: 'Skills · embedding space', run: go('#skills') },
    { group: 'Navigate', ic: '05', label: 'Ask my resume', run: () => { focusTarget('#ask'); setTimeout(() => $('#rag-q').focus({ preventScroll: true }), 600); } },
    { group: 'Navigate', ic: '06', label: 'Education & certifications', run: go('#education') },
    { group: 'Navigate', ic: '07', label: 'Contact', run: go('#contact') },
    ...D.projects.map((p) => ({ group: 'Projects', ic: '◇', label: p.name, hint: p.kind, run: go(`#proj-${p.id}`) })),
    { group: 'Actions', ic: '@', label: 'Copy email', hint: D.email, run: () => copy(D.email, 'Email copied') },
    { group: 'Actions', ic: 'in', label: 'Open LinkedIn', run: () => open(D.linkedin, '_blank', 'noopener') },
    { group: 'Actions', ic: 'gh', label: 'Open GitHub', run: () => open(D.github, '_blank', 'noopener') },
    { group: 'Actions', ic: '↓', label: 'Download resume (PDF)', run: () => { const a = document.createElement('a'); a.href = D.resume; a.download = ''; a.click(); } },
    ...['sphere', 'cluster', 'helix', 'knot', 'wave'].map((s) => ({ group: 'Latent space', ic: '◎', label: `Morph to ${s}`, run: () => window.scene3d?.setShape(s) })),
    { group: 'Latent space', ic: '✕', label: 'Clear skill filter', run: () => selectSkill(null) },
    ...D.skills.map((s) => ({ group: 'Filter by skill', ic: '#', label: s.name, hint: D.categories[s.cat].label, run: () => { if (window.App.skill !== s.name) selectSkill(s.name); } }))
  ];

  // subsequence fuzzy match, returns score + matched indices
  function fuzzy(q, text) {
    const t = text.toLowerCase();
    let ti = 0, score = 0, streak = 0;
    const idx = [];
    for (const c of q) {
      const f = t.indexOf(c, ti);
      if (f < 0) return null;
      streak = f === ti ? streak + 1 : 0;
      score += 1 + streak * 2 + (f === 0 || t[f - 1] === ' ' ? 3 : 0);
      idx.push(f);
      ti = f + 1;
    }
    return { score: score - t.length * 0.02, idx };
  }
  const highlight = (text, idx) => [...text].map((c, i) => (idx.includes(i) ? `<mark>${esc(c)}</mark>` : esc(c))).join('');

  let items = [];
  let sel = 0;

  function render() {
    const q = input.value.trim().toLowerCase();
    if (!q) {
      items = commands.filter((c) => c.group !== 'Filter by skill').map((c) => ({ ...c, html: esc(c.label) }));
    } else {
      items = commands
        .map((c) => { const m = fuzzy(q, c.label); return m && { ...c, s: m.score, html: highlight(c.label, m.idx) }; })
        .filter(Boolean)
        .sort((a, b) => b.s - a.s)
        .slice(0, 12);
      const ask = { group: 'Ask', ic: '?', label: input.value.trim(), html: `Ask resume: “${esc(input.value.trim())}”`, hint: 'RAG', run: () => { focusTarget('#ask'); window.rag?.ask(input.value.trim()); } };
      // a question (or no strong match) goes to the RAG first
      if (q.includes(' ') || !items.length || items[0].s < q.length * 1.5) items.unshift(ask);
      else items.push(ask);
    }
    sel = Math.min(sel, items.length - 1);
    let lastGroup = '';
    list.innerHTML = items.map((c, i) => {
      const head = c.group !== lastGroup ? `<li class="group" aria-hidden="true">${esc(c.group)}</li>` : '';
      lastGroup = c.group;
      return `${head}<li role="option" data-i="${i}" class="${i === sel ? 'sel' : ''}" aria-selected="${i === sel}"><span class="ic">${esc(c.ic)}</span><span>${c.html}</span>${c.hint ? `<span class="hint">${esc(c.hint)}</span>` : ''}</li>`;
    }).join('');
  }

  function openPalette() {
    root.hidden = false;
    input.value = '';
    sel = 0;
    render();
    input.focus();
  }
  function closePalette() { root.hidden = true; }
  function runSel(i = sel) {
    const c = items[i];
    if (!c) return;
    closePalette();
    c.run();
  }

  addEventListener('keydown', (e) => {
    const typing = /^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName);
    if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); root.hidden ? openPalette() : closePalette(); return; }
    if (e.key === '/' && !typing && root.hidden) { e.preventDefault(); openPalette(); return; }
    if (root.hidden) return;
    if (e.key === 'Escape') closePalette();
    else if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % items.length; render(); scrollSel(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + items.length) % items.length; render(); scrollSel(); }
    else if (e.key === 'Enter') { e.preventDefault(); runSel(); }
  });
  const scrollSel = () => list.querySelector('.sel')?.scrollIntoView({ block: 'nearest' });
  input.addEventListener('input', () => { sel = 0; render(); });
  list.addEventListener('pointermove', (e) => {
    const li = e.target.closest('li[data-i]');
    if (li && +li.dataset.i !== sel) { sel = +li.dataset.i; list.querySelectorAll('li[data-i]').forEach((x) => x.classList.toggle('sel', +x.dataset.i === sel)); }
  });
  list.addEventListener('click', (e) => { const li = e.target.closest('li[data-i]'); if (li) runSel(+li.dataset.i); });
  root.addEventListener('click', (e) => { if (e.target === root) closePalette(); });
  $('#open-palette').addEventListener('click', openPalette);
})();
