/* The 3D "latent space": 1,800 embedding points that morph between manifolds
   as you scroll, a refracting glass core, orbiting glass tokens, and k-nearest
   neighbour edges. Cursor pushes points away; the hero panel tunes it live. */
(async () => {
  const { bus, reduceMotion } = window.App;
  const canvas = document.getElementById('gl');

  let THREE, RoomEnvironment;
  try {
    THREE = await import('three');
    ({ RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js'));
  } catch (err) {
    console.warn('3D scene unavailable:', err);
    document.documentElement.classList.add('no-webgl');
    bus.emit('scene:ready');
    return;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (err) {
    document.documentElement.classList.add('no-webgl');
    bus.emit('scene:ready');
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 0, 11);

  const world = new THREE.Group();
  scene.add(world);

  // ── manifolds ──
  const N = 1800;
  const rand = mulberry32(7);
  const shapes = {
    sphere: new Float32Array(N * 3),
    cluster: new Float32Array(N * 3),
    helix: new Float32Array(N * 3),
    knot: new Float32Array(N * 3),
    wave: new Float32Array(N * 3)
  };
  const golden = Math.PI * (3 - Math.sqrt(5));
  const clusterCenters = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2;
    return [Math.cos(a) * 2.3, (i % 2 ? 0.9 : -0.9), Math.sin(a) * 2.3];
  });
  const cols = 60;
  const rows = Math.ceil(N / cols);
  for (let i = 0; i < N; i++) {
    const o = i * 3;
    // fibonacci sphere with a soft shell
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = golden * i;
    const R = 2.75 + (rand() - 0.5) * 0.35;
    set(shapes.sphere, o, Math.cos(th) * r * R, y * R, Math.sin(th) * r * R);

    // gaussian clusters, like embeddings grouped by topic
    const c = clusterCenters[i % 6];
    const s = 0.55;
    set(shapes.cluster, o, c[0] + gauss(rand) * s, c[1] + gauss(rand) * s, c[2] + gauss(rand) * s);

    // double helix, a trace unrolling through time
    const t = (i / N) * Math.PI * 8;
    const strand = i % 2 ? Math.PI : 0;
    const hr = 1.55 + (rand() - 0.5) * 0.25;
    set(shapes.helix, o, Math.cos(t + strand) * hr, (i / N - 0.5) * 7.5, Math.sin(t + strand) * hr);

    // torus knot (2,3)
    const u = (i / N) * Math.PI * 2;
    const p = 2, q = 3;
    const kr = 1.75 + 0.75 * Math.cos(q * u);
    const jitter = 0.22;
    set(shapes.knot, o,
      kr * Math.cos(p * u) + (rand() - 0.5) * jitter,
      kr * Math.sin(p * u) + (rand() - 0.5) * jitter,
      -0.9 * Math.sin(q * u) + (rand() - 0.5) * jitter);

    // wave surface, the "retrieval" landscape
    const gx = (i % cols) / (cols - 1) - 0.5;
    const gz = Math.floor(i / cols) / (rows - 1) - 0.5;
    set(shapes.wave, o, gx * 8, Math.sin(gx * 9) * Math.cos(gz * 7) * 0.55, gz * 5);
  }

  const pos = new Float32Array(shapes.sphere);
  const display = new Float32Array(N * 3);
  const speed = new Float32Array(N);
  const phase = new Float32Array(N);
  const sizes = new Float32Array(N);
  const colors = new Float32Array(N * 3);
  const cA = new THREE.Color('#9b8cff');
  const cB = new THREE.Color('#5ef0c8');
  const cC = new THREE.Color('#ffffff');
  const tmp = new THREE.Color();
  for (let i = 0; i < N; i++) {
    speed[i] = 0.025 + rand() * 0.045;
    phase[i] = rand() * Math.PI * 2;
    sizes[i] = 0.6 + rand() * 1.1 + (rand() > 0.97 ? 1.4 : 0);
    tmp.copy(cA).lerp(cB, rand());
    if (rand() > 0.9) tmp.lerp(cC, 0.6);
    colors.set([tmp.r, tmp.g, tmp.b], i * 3);
  }

  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(display, 3));
  pGeo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  pGeo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  const pMat = new THREE.ShaderMaterial({
    uniforms: { uSize: { value: 3.2 }, uPixelRatio: { value: renderer.getPixelRatio() }, uPulse: { value: 0 } },
    vertexShader: `
      attribute float aSize; attribute vec3 aColor;
      uniform float uSize; uniform float uPixelRatio; uniform float uPulse;
      varying vec3 vColor; varying float vDepth;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * aSize * (1.0 + uPulse * 0.8) * uPixelRatio * (10.0 / -mv.z);
        vColor = mix(aColor, vec3(1.0), uPulse * 0.5);
        vDepth = smoothstep(16.0, 7.0, -mv.z);
      }`,
    fragmentShader: `
      varying vec3 vColor; varying float vDepth;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float core = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vColor * (0.35 + core * 0.9) * (0.45 + vDepth * 0.75), 1.0);
      }`
  });
  const points = new THREE.Points(pGeo, pMat);
  world.add(points);

  // ── kNN edges over a subset of nodes ──
  const M = 150;
  const MAX_K = 6;
  const nodes = Array.from({ length: M }, (_, i) => Math.floor((i / M) * N + rand() * (N / M)));
  const ePos = new Float32Array(M * MAX_K * 2 * 3);
  const eGeo = new THREE.BufferGeometry();
  eGeo.setAttribute('position', new THREE.BufferAttribute(ePos, 3));
  const eMat = new THREE.LineBasicMaterial({ color: 0x9b8cff, transparent: true, opacity: 0.22, depthWrite: false });
  const edges = new THREE.LineSegments(eGeo, eMat);
  world.add(edges);

  // ── glass core ──
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0.06,
    transmission: 1,
    thickness: 1.4,
    ior: 1.5,
    iridescence: 0.9,
    iridescenceIOR: 1.35,
    iridescenceThicknessRange: [120, 480],
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.6,
    attenuationColor: new THREE.Color('#b9adff'),
    attenuationDistance: 3,
    flatShading: true
  });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25, 0), glassMat);
  world.add(core);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.0, 0.028, 16, 220),
    new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 1, roughness: 0.15, envMapIntensity: 1.4 })
  );
  ring.rotation.set(1.15, 0.3, 0);
  world.add(ring);

  // small glass "tokens" orbiting the core
  const tokenGeos = [new THREE.OctahedronGeometry(0.22, 0), new THREE.TetrahedronGeometry(0.26, 0), new THREE.BoxGeometry(0.26, 0.26, 0.26)];
  const tokens = Array.from({ length: 5 }, (_, i) => {
    const m = new THREE.Mesh(tokenGeos[i % 3], glassMat);
    m.userData = { r: 2.0 + (i % 2) * 0.35, s: 0.25 + i * 0.07, o: (i / 5) * Math.PI * 2, tilt: (i - 2) * 0.35 };
    world.add(m);
    return m;
  });

  // ── state ──
  const state = {
    shape: 'sphere',
    temperature: 0.7,
    topK: 3,
    pulse: 0,
    layout: { x: 0, y: 0, s: 1 },
    sectionId: 'hero'
  };
  const LAYOUTS = {
    hero: { x: 2.6, y: -0.1, s: 1 },
    about: { x: 4.4, y: 1.6, s: 0.75 },
    experience: { x: 4.6, y: 1.2, s: 0.7 },
    projects: { x: 0, y: 0, s: 1.15 },
    skills: { x: 4.7, y: 1.7, s: 0.6 },
    ask: { x: 4.5, y: 1.5, s: 0.7 },
    education: { x: 4.4, y: 1.4, s: 0.75 },
    contact: { x: 0, y: 0.4, s: 1.05 }
  };
  const target = { x: 0, y: 0, s: 1 };
  function applyLayout() {
    const mobile = innerWidth < 900;
    const l = LAYOUTS[state.sectionId] || LAYOUTS.hero;
    if (mobile) {
      // phones: centred above the hero copy, then tucked into the top-right corner
      const hero = state.sectionId === 'hero';
      target.x = hero ? 0 : 1.7;
      target.y = hero ? 1.9 : 2.9;
      target.s = hero ? 0.62 : 0.42;
    } else {
      target.x = l.x;
      target.y = l.y;
      target.s = l.s;
    }
  }
  applyLayout();
  state.layout = { ...target };

  function setShape(name) {
    if (!shapes[name] || name === state.shape) return;
    state.shape = name;
    bus.emit('scene:shape', name);
  }

  bus.on('section:change', ({ id, shape }) => {
    state.sectionId = id;
    applyLayout();
    if (shape) setShape(shape);
  });
  bus.on('rag:query', () => { state.pulse = 1; });

  window.scene3d = {
    setTemperature: (v) => { state.temperature = v; },
    setTopK: (v) => { state.topK = v; },
    setShape,
    pulse: () => { state.pulse = 1; }
  };

  // ── pointer → world-space point on the z=0 plane ──
  const ndc = new THREE.Vector2(9, 9);
  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hit = new THREE.Vector3();
  const localHit = new THREE.Vector3();
  let pointerActive = false;
  addEventListener('pointermove', (e) => {
    ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    pointerActive = true;
  }, { passive: true });
  document.addEventListener('pointerleave', () => { pointerActive = false; });

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight, false);
    pMat.uniforms.uPixelRatio.value = renderer.getPixelRatio();
    applyLayout();
  });

  // ── loop ──
  const clock = new THREE.Clock();
  let frames = 0, fpsTime = 0, edgeCount = 0;
  const motion = reduceMotion ? 0.25 : 1;
  const nodeDist = new Float32Array(M);
  const order = new Int16Array(M);

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    // layout easing
    state.layout.x += (target.x - state.layout.x) * 0.045;
    state.layout.y += (target.y - state.layout.y) * 0.045;
    state.layout.s += (target.s - state.layout.s) * 0.045;
    world.position.set(state.layout.x, state.layout.y, 0);
    world.scale.setScalar(state.layout.s);

    const temp = state.temperature;
    world.rotation.y += dt * (0.08 + temp * 0.12) * motion;
    world.rotation.x = Math.sin(t * 0.2) * 0.15 + (scrollY / innerHeight) * 0.04;

    // camera parallax follows the cursor
    const mx = pointerActive ? ndc.x : 0;
    const my = pointerActive ? ndc.y : 0;
    camera.position.x += (mx * 0.7 - camera.position.x) * 0.04;
    camera.position.y += (my * 0.5 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);

    world.updateMatrixWorld();
    let hasHit = false;
    if (pointerActive) {
      raycaster.setFromCamera(ndc, camera);
      if (raycaster.ray.intersectPlane(plane, hit)) {
        localHit.copy(hit);
        world.worldToLocal(localHit);
        hasHit = true;
      }
    }

    // morph + noise + cursor repulsion
    const goal = shapes[state.shape];
    const amp = temp * 0.12;
    const repelR = 1.5 / state.layout.s;
    const repelR2 = repelR * repelR;
    for (let i = 0; i < N; i++) {
      const o = i * 3;
      const k = speed[i] * motion + (reduceMotion ? 0.02 : 0);
      pos[o] += (goal[o] - pos[o]) * k;
      pos[o + 1] += (goal[o + 1] - pos[o + 1]) * k;
      pos[o + 2] += (goal[o + 2] - pos[o + 2]) * k;
      const ph = phase[i];
      let x = pos[o] + Math.sin(t * 1.3 + ph) * amp;
      let y = pos[o + 1] + Math.cos(t * 1.1 + ph * 1.7) * amp;
      let z = pos[o + 2] + Math.sin(t * 0.9 + ph * 2.3) * amp;
      if (hasHit) {
        const dx = x - localHit.x, dy = y - localHit.y, dz = z - localHit.z;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < repelR2) {
          const d = Math.sqrt(d2) || 0.0001;
          const f = (1 - d / repelR) * 0.9;
          x += (dx / d) * f; y += (dy / d) * f; z += (dz / d) * f;
        }
      }
      display[o] = x; display[o + 1] = y; display[o + 2] = z;
    }
    pGeo.attributes.position.needsUpdate = true;

    // kNN edges among node subset
    const K = state.topK;
    let w = 0;
    if (K > 0) {
      for (let a = 0; a < M; a++) {
        const ia = nodes[a] * 3;
        for (let b = 0; b < M; b++) {
          const ib = nodes[b] * 3;
          const dx = display[ia] - display[ib], dy = display[ia + 1] - display[ib + 1], dz = display[ia + 2] - display[ib + 2];
          nodeDist[b] = a === b ? 1e9 : dx * dx + dy * dy + dz * dz;
          order[b] = b;
        }
        // partial selection sort for the K closest
        for (let s = 0; s < K; s++) {
          let best = s;
          for (let c = s + 1; c < M; c++) if (nodeDist[order[c]] < nodeDist[order[best]]) best = c;
          const tmpI = order[s]; order[s] = order[best]; order[best] = tmpI;
          const nb = order[s];
          if (nb <= a && K > 1) continue; // avoid most duplicate pairs
          if (nodeDist[nb] > 2.6) continue;
          const ib = nodes[nb] * 3;
          ePos[w++] = display[ia]; ePos[w++] = display[ia + 1]; ePos[w++] = display[ia + 2];
          ePos[w++] = display[ib]; ePos[w++] = display[ib + 1]; ePos[w++] = display[ib + 2];
        }
      }
    }
    edgeCount = w / 6;
    eGeo.setDrawRange(0, edgeCount * 2);
    eGeo.attributes.position.needsUpdate = true;
    eMat.opacity = 0.16 + state.pulse * 0.5;

    // glass core + tokens
    core.rotation.x += dt * 0.25 * motion;
    core.rotation.y += dt * 0.35 * motion;
    const coreScale = 1 + Math.sin(t * 1.4) * 0.025 + state.pulse * 0.18;
    core.scale.setScalar(coreScale);
    ring.rotation.z += dt * 0.3 * motion;
    for (const m of tokens) {
      const u = m.userData;
      const a = t * u.s * motion + u.o;
      m.position.set(Math.cos(a) * u.r, Math.sin(a * 1.3) * 0.5 + u.tilt, Math.sin(a) * u.r);
      m.rotation.x += dt * 0.8;
      m.rotation.y += dt * 0.6;
    }

    state.pulse *= 0.94;
    pMat.uniforms.uPulse.value = state.pulse;

    renderer.render(scene, camera);

    frames++;
    fpsTime += dt;
    if (fpsTime > 0.5) {
      bus.emit('scene:stats', { fps: Math.round(frames / fpsTime), edges: edgeCount });
      frames = 0;
      fpsTime = 0;
    }
  }

  let running = true;
  renderer.setAnimationLoop(frame);
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    renderer.setAnimationLoop(running ? frame : null);
    if (running) clock.getDelta();
  });

  // first frame is ready: release the loader
  requestAnimationFrame(() => bus.emit('scene:ready'));

  function set(arr, o, x, y, z) { arr[o] = x; arr[o + 1] = y; arr[o + 2] = z; }
  function gauss(r) { return (r() + r() + r() + r() - 2) * 0.9; }
  function mulberry32(a) {
    return () => {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
})();
