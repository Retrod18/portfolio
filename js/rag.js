/* Resume RAG that runs in the browser: TF-IDF embeddings + cosine similarity,
   query expansion, a title-match re-rank, then a grounded streamed answer. */
(() => {
  const D = window.PORTFOLIO;
  const { $, $$, bus, sleep, esc, reduceMotion, focusTarget } = window.App;

  const STOP = new Set(('a an the and or of to in on for with at by from is are was were be been being his her he she him their they them what which who whom how does do did can could would should has have had about tell me you your dhruv dhruvs sharma i my we our it its this that these those any some please give show list know anything there here into than then so as also more most very just much many does doing done'.split(' ')));
  const SYN = {
    experience: ['intern', 'internship', 'role', 'work'], work: ['experience', 'intern', 'role'], job: ['experience', 'role', 'available'],
    worked: ['experience', 'intern'], internship: ['intern', 'experience'], recent: ['latest'], latest: ['recent'],
    project: ['built', 'platform', 'engine'], projects: ['project', 'built'], build: ['built', 'project'], built: ['project'], made: ['built', 'project'],
    skill: ['skills', 'stack'], skills: ['stack', 'tech'], stack: ['skills', 'tech'], tech: ['skills', 'stack'], technologies: ['skills', 'stack'], tools: ['skills', 'tools'], know: ['skills'],
    education: ['degree', 'university', 'college'], study: ['education', 'pursuing', 'university', 'degree'], studying: ['education', 'pursuing', 'university'],
    college: ['education', 'university'], university: ['education'], degree: ['education', 'bachelor', 'master'], qualification: ['education', 'degree'], gpa: ['cgpa'], marks: ['cgpa'],
    contact: ['email', 'reach', 'linkedin', 'github'], reach: ['contact', 'email'], email: ['contact', 'mail'], hire: ['contact', 'available', 'open'], phone: ['contact'],
    live: ['location', 'based'], located: ['location', 'based'], from: ['location'], city: ['location'],
    rag: ['retrieval', 'augmented', 'generation', 'pipelines'], retrieval: ['rag', 'retrievers'], llm: ['llms', 'language', 'model'], llms: ['llm'], gpt: ['llm', 'bert'],
    agent: ['agents', 'autonomous', 'mcp'], agents: ['agent', 'autonomous', 'mcp'], agentic: ['agents', 'autonomous'],
    vector: ['faiss', 'chroma', 'pinecone', 'embeddings'], embeddings: ['vector', 'tf-idf'], database: ['vector', 'faiss', 'sql'], databases: ['vector', 'databases'],
    cloud: ['aws', 'vercel', 'firebase', 'deployment'], deploy: ['deployment', 'deployed', 'cloud'], aws: ['cloud', 'lambda'],
    certifications: ['certification', 'certified'], certificate: ['certifications'], certified: ['certifications'], courses: ['certifications'],
    drdo: ['defence', 'research'], defence: ['drdo'], defense: ['defence', 'drdo'], handshake: ['trainer'], evaluation: ['evaluated', 'evaluating'], evaluate: ['evaluation', 'evaluated'],
    recommendation: ['bookwise', 'recommender'], book: ['bookwise', 'books'], books: ['bookwise'], document: ['docusense', 'documents', 'pdf'], documents: ['docusense', 'pdf'],
    finetuning: ['fine', 'tuned', 'bert'], bert: ['fine', 'tuned', 'nlp'], nlp: ['bert', 'language'], ml: ['machine', 'learning'], ai: ['generative'],
    automation: ['automated', 'automl'], data: ['pipelines', 'preprocessing'], python: ['pandas', 'numpy'], frontend: ['react', 'next'], backend: ['fastapi', 'flask'],
    who: ['overview', 'summary'], about: ['summary', 'overview'], summary: ['overview'], open: ['available', 'opportunities'], available: ['availability', 'open']
  };

  const stem = (w) => (w.length > 4 ? w.replace(/(ings|ing|ies|ied|ed|es|s)$/, '') : w);
  const tokenize = (text) => text.toLowerCase()
    .replace(/[’']/g, '')
    .split(/[^a-z0-9+#]+/)
    .filter((w) => w && w.length > 1 && !STOP.has(w))
    .map(stem);

  // ── index ──
  const docs = D.chunks.map((c) => tokenize(`${c.title} ${c.title} ${c.text}`));
  const titleTokens = D.chunks.map((c) => new Set(tokenize(c.title)));
  const df = new Map();
  docs.forEach((toks) => new Set(toks).forEach((t) => df.set(t, (df.get(t) || 0) + 1)));
  const N = docs.length;
  const idf = (t) => Math.log((N + 1) / ((df.get(t) || 0) + 1)) + 1;
  const vectorize = (weights) => {
    let norm = 0;
    weights.forEach((w) => { norm += w * w; });
    norm = Math.sqrt(norm) || 1;
    weights.forEach((w, t) => weights.set(t, w / norm));
    return weights;
  };
  const docVecs = docs.map((toks) => {
    const tf = new Map();
    toks.forEach((t) => tf.set(t, (tf.get(t) || 0) + 1));
    const w = new Map();
    tf.forEach((f, t) => w.set(t, (1 + Math.log(f)) * idf(t)));
    return vectorize(w);
  });

  function embedQuery(q) {
    const raw = tokenize(q);
    const terms = new Map();
    const syn = new Set();
    raw.forEach((t) => terms.set(t, (terms.get(t) || 0) + idf(t)));
    q.toLowerCase().split(/[^a-z0-9+#]+/).forEach((w) => {
      (SYN[w] || SYN[stem(w)] || []).forEach((s) => {
        const st = stem(s);
        if (!terms.has(st)) { terms.set(st, idf(st) * 0.45); syn.add(st); }
      });
    });
    // keep only terms the index knows about (out-of-vocabulary terms add nothing)
    [...terms.keys()].forEach((t) => { if (!df.has(t)) terms.delete(t); });
    return { vec: vectorize(terms), raw, syn };
  }

  function retrieve(q) {
    const t0 = performance.now();
    const { vec, raw, syn } = embedQuery(q);
    const scored = docVecs.map((dv, i) => {
      let s = 0;
      vec.forEach((w, t) => { s += w * (dv.get(t) || 0); });
      return { i, chunk: D.chunks[i], score: s, boost: 0 };
    });
    // re-rank: reward chunks whose title contains a literal query term
    const ranked = scored.map((r) => {
      const hits = raw.filter((t) => titleTokens[r.i].has(t)).length;
      r.boost = hits ? Math.min(0.15, hits * 0.07) : 0;
      r.final = r.score + r.boost;
      return r;
    });
    const firstPass = [...scored].sort((a, b) => b.score - a.score).slice(0, 3);
    const top = [...ranked].sort((a, b) => b.final - a.final).slice(0, 3);
    return { vec, raw, syn, firstPass, top, ms: performance.now() - t0 };
  }

  function compose(top) {
    const best = top[0];
    if (!best || best.final < 0.12) {
      return {
        text: "I couldn't find a confident match for that in Dhruv's resume. Try asking about his RAG work, the DRDO internship, DocuSense AI, his skills, or how to reach him.",
        sources: []
      };
    }
    let text = best.chunk.answer;
    const sources = [best.chunk];
    const second = top[1];
    if (second && second.final > best.final * 0.78 && second.final > 0.2 && second.chunk.answer !== best.chunk.answer) {
      text += ' ' + second.chunk.answer;
      sources.push(second.chunk);
    }
    return { text, sources };
  }

  // ── UI ──
  const form = $('#rag-form');
  const input = $('#rag-q');
  const stages = $$('#rag-stages li');
  const qvecEl = $('#rag-qvec');
  const ctxEl = $('#rag-ctx');
  const answerEl = $('#rag-answer');
  const sourcesEl = $('#rag-sources');
  const metaEl = $('#rag-meta');
  let runId = 0;
  const pace = (ms) => sleep(reduceMotion ? 0 : ms);

  function setStage(name) {
    let reached = false;
    stages.forEach((li) => {
      const s = li.dataset.stage;
      li.classList.remove('active', 'done');
      if (s === name) { li.classList.add('active'); reached = true; } else if (!reached) li.classList.add('done');
    });
    if (name === 'complete') stages.forEach((li) => { li.classList.remove('active'); li.classList.add('done'); });
  }

  async function ask(q) {
    q = q.trim();
    if (!q) return;
    const id = ++runId;
    const alive = () => id === runId;
    input.value = q;
    sourcesEl.innerHTML = '';
    metaEl.textContent = '';
    answerEl.innerHTML = '<p class="dim">…</p>';
    ctxEl.innerHTML = '';

    const r = retrieve(q);

    // 01 embed
    setStage('embed');
    const terms = [...r.vec.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    qvecEl.innerHTML = terms.length
      ? terms.map(([t, w]) => `<div class="qrow ${r.syn.has(t) ? 'syn' : ''}"><span>${esc(t)}${r.syn.has(t) ? ' ⁺' : ''}</span><span class="bar"><i data-w="${w}"></i></span><span class="w">${w.toFixed(2)}</span></div>`).join('')
      : '<p class="dim">No known terms. The query is out of vocabulary.</p>';
    requestAnimationFrame(() => qvecEl.querySelectorAll('i[data-w]').forEach((i) => { i.style.width = `${Math.round(i.dataset.w * 100)}%`; }));
    await pace(520);
    if (!alive()) return;

    // 02 retrieve (first-pass order)
    setStage('retrieve');
    bus.emit('rag:query', { score: r.top[0]?.final || 0 });
    const maxScore = Math.max(0.01, ...r.top.map((x) => x.final));
    ctxEl.innerHTML = r.firstPass.map((x) => `
      <div class="chunk" data-i="${x.i}">
        <div class="chunk-head"><span>${esc(x.chunk.title)}</span><span class="mono">${x.score.toFixed(3)}</span></div>
        <div class="bar"><i data-w="${x.score / maxScore}"></i></div>
        <p class="boost">re-rank +${0} title match</p>
      </div>`).join('');
    const chunkEls = [...ctxEl.children];
    for (const [k, el] of chunkEls.entries()) {
      await pace(110);
      if (!alive()) return;
      el.classList.add('show');
      el.querySelector('.bar i').style.width = `${Math.round(el.querySelector('.bar i').dataset.w * 100)}%`;
      if (k === 0) el.classList.add('top');
    }
    await pace(380);
    if (!alive()) return;

    // 03 re-rank: apply title boosts and reorder with FLIP
    setStage('rerank');
    const first = new Map(chunkEls.map((el) => [el.dataset.i, el.getBoundingClientRect().top]));
    ctxEl.innerHTML = '';
    r.top.forEach((x, k) => {
      const el = chunkEls.find((c) => +c.dataset.i === x.i) || (() => {
        const n = document.createElement('div');
        n.className = 'chunk show';
        n.dataset.i = x.i;
        n.innerHTML = `<div class="chunk-head"><span>${esc(x.chunk.title)}</span><span class="mono"></span></div><div class="bar"><i></i></div><p class="boost"></p>`;
        return n;
      })();
      el.classList.toggle('top', k === 0);
      el.classList.toggle('boosted', x.boost > 0);
      el.querySelector('.chunk-head .mono').textContent = x.final.toFixed(3);
      el.querySelector('.boost').textContent = `re-rank +${x.boost.toFixed(2)} · title match`;
      el.querySelector('.bar i').style.width = `${Math.round((x.final / maxScore) * 100)}%`;
      ctxEl.appendChild(el);
    });
    if (!reduceMotion) {
      [...ctxEl.children].forEach((el) => {
        const before = first.get(el.dataset.i);
        if (before == null) return;
        const dy = before - el.getBoundingClientRect().top;
        if (!dy) return;
        el.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.2,.8,.2,1)' });
      });
    }
    await pace(480);
    if (!alive()) return;

    // 04 generate: stream tokens
    setStage('generate');
    const { text, sources } = compose(r.top);
    answerEl.innerHTML = '';
    const tokens = text.match(/\S+\s*/g) || [];
    const t0 = performance.now();
    for (const tok of tokens) {
      if (!alive()) return;
      const span = document.createElement('span');
      span.className = 'tok';
      span.textContent = tok;
      answerEl.appendChild(span);
      await pace(16 + Math.random() * 26);
    }
    if (!alive()) return;
    setStage('complete');
    sourcesEl.innerHTML = sources.map((c) => `<button data-go="${c.anchor}">↗ ${esc(c.title)}</button>`).join('');
    const genMs = performance.now() - t0;
    metaEl.textContent = `retrieval ${r.ms.toFixed(2)} ms · ${N} chunks · ${r.vec.size} terms · ${tokens.length} tokens streamed in ${(genMs / 1000).toFixed(1)} s`;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); ask(input.value); });
  $('#rag-suggest').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) ask(b.textContent);
  });
  sourcesEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]');
    if (b) focusTarget(b.dataset.go);
  });

  window.rag = { ask, retrieve };
})();
