/* Shared helpers + a tiny event bus that wires the widgets together.
   Events:
     section:change  {id, shape}   section scrolled into focus
     scene:shape     shape         3D manifold changed
     scene:stats     {fps, edges}  3D scene telemetry
     skill:select    name | null   global skill filter
     rag:query       {score}       resume RAG ran a retrieval */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const bus = {
    on(type, fn) { window.addEventListener(type, (e) => fn(e.detail)); },
    emit(type, detail) { window.dispatchEvent(new CustomEvent(type, { detail })); }
  };

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let toastTimer;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  // Smooth-scroll to a selector and pulse it so the eye lands on it.
  function focusTarget(sel) {
    const el = typeof sel === 'string' ? $(sel) : sel;
    if (!el) return;
    el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: el.tagName === 'SECTION' ? 'start' : 'center' });
    if (el.tagName !== 'SECTION') {
      el.classList.remove('flash');
      void el.offsetWidth;
      el.classList.add('flash');
    }
  }

  async function copy(text, label = 'Copied') {
    try {
      await navigator.clipboard.writeText(text);
      toast(`✓ ${label}`);
    } catch {
      toast(text);
    }
  }

  // Global skill selection lives here so every widget agrees on it.
  let selectedSkill = null;
  function selectSkill(name) {
    selectedSkill = name && name !== selectedSkill ? name : null;
    bus.emit('skill:select', selectedSkill);
  }

  window.App = { $, $$, bus, reduceMotion, finePointer, sleep, esc, toast, focusTarget, copy, selectSkill, get skill() { return selectedSkill; } };
})();
