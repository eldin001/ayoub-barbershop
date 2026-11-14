// Corona 3D della copertina di King Barber, fatta con three.js.
// Il modello è costruito qui in codice (nessun file da scaricare): fascia, punte, sfere e pietre rosse.
// Sorgente: si compila in ../corona3d.js con
//   npx esbuild src/corona3d.js --bundle --minify --format=esm --outfile=corona3d.js
import * as THREE from 'three';

const PUNTE = 8, ALTEZZA = 1.2, FASCIA = 0.46, SPESSORE = 0.05;
const ORO = 0xc9a35a, ROSSO = 0xbf1b39;

// profilo del bordo alto: valli morbide e punte strette, come la corona del logo
function cima(u) {
  const t = (u * PUNTE) % 1;
  const p = 1 - Math.abs(2 * t - 1);
  return FASCIA + (ALTEZZA - FASCIA) * Math.pow(p, 1.7);
}
// la corona si apre leggermente verso l'alto
function raggio(y) { return 1 + 0.24 * Math.pow(y / ALTEZZA, 1.4); }

function parete(dentro) {
  const N = PUNTE * 40, M = 22, pos = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N, a = u * Math.PI * 2, top = cima(u);
    for (let j = 0; j <= M; j++) {
      const y = top * j / M, r = raggio(y) - (dentro ? SPESSORE : 0);
      pos.push(Math.cos(a) * r, y, Math.sin(a) * r);
    }
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) {
    const a = i * (M + 1) + j, b = a + M + 1;
    if (dentro) idx.push(a, b, a + 1, b, b + 1, a + 1); else idx.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
// bordo che chiude lo spessore lungo il profilo alto
function bordo() {
  const N = PUNTE * 40, pos = [];
  const p = (u, d) => { const a = u * Math.PI * 2, y = cima(u), r = raggio(y) - d; return [Math.cos(a) * r, y, Math.sin(a) * r]; };
  for (let i = 0; i < N; i++) {
    const u0 = i / N, u1 = (i + 1) / N;
    const A = p(u0, 0), B = p(u1, 0), C = p(u0, SPESSORE), D = p(u1, SPESSORE);
    pos.push(...A, ...C, ...B, ...B, ...C, ...D);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

function creaCorona() {
  const oro = new THREE.MeshStandardMaterial({ color: ORO, metalness: 1, roughness: 0.3, side: THREE.DoubleSide });
  const oroScuro = new THREE.MeshStandardMaterial({ color: 0x8a6a2e, metalness: 1, roughness: 0.42, side: THREE.DoubleSide });
  const pietra = new THREE.MeshStandardMaterial({ color: ROSSO, metalness: 0.25, roughness: 0.12, flatShading: true, emissive: 0x3a0410 });
  const g = new THREE.Group();
  g.add(new THREE.Mesh(parete(false), oro), new THREE.Mesh(parete(true), oroScuro), new THREE.Mesh(bordo(), oro));
  // due cordoni: base e limite della fascia
  [[0.02, 0.075], [FASCIA - 0.03, 0.045]].forEach(([y, tubo]) => {
    const t = new THREE.Mesh(new THREE.TorusGeometry(raggio(y), tubo, 20, 120), oro);
    t.rotation.x = Math.PI / 2; t.position.y = y; g.add(t);
  });
  const sfera = new THREE.SphereGeometry(0.1, 28, 20), gemma = new THREE.IcosahedronGeometry(0.095, 0);
  const castone = new THREE.TorusGeometry(0.105, 0.022, 10, 28);
  for (let k = 0; k < PUNTE; k++) {
    const a = (k + 0.5) / PUNTE * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    // sfera in cima a ogni punta
    const rT = raggio(ALTEZZA) - SPESSORE / 2;
    const b = new THREE.Mesh(sfera, oro); b.position.set(c * rT, ALTEZZA + 0.06, s * rT); g.add(b);
    // pietra rossa sulla fascia, con il suo castone
    const yG = FASCIA * 0.5, rG = raggio(yG) + 0.035;
    const j = new THREE.Mesh(gemma, pietra); j.position.set(c * rG, yG, s * rG); j.rotation.set(a, a * 2, 0); j.scale.z = 0.7; g.add(j);
    const o = new THREE.Mesh(castone, oro); o.position.set(c * (rG - 0.03), yG, s * (rG - 0.03)); o.lookAt(c * 9, yG, s * 9); g.add(o);
  }
  g.children.forEach(m => { m.position.y -= ALTEZZA / 2; });
  return g;
}

// Ambiente per i riflessi: una stanza scura con pochi pannelli luminosi, calcolata al volo (niente HDR da scaricare)
function ambiente(renderer) {
  const sc = new THREE.Scene();
  sc.add(new THREE.Mesh(new THREE.BoxGeometry(20, 20, 20), new THREE.MeshBasicMaterial({ color: 0x0b0c10, side: THREE.BackSide })));
  const pannello = (colore, forza, x, y, z, w, h) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(colore).multiplyScalar(forza), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.lookAt(0, 0, 0); sc.add(m);
  };
  pannello(0xfff1d6, 9, 0, 8, 2, 9, 5);      // luce calda dall'alto
  pannello(0xffffff, 5, -8, 2, 4, 3, 7);     // fianco sinistro
  pannello(0xffe2b0, 4, 8, 1, 3, 3, 6);      // fianco destro
  pannello(ROSSO, 6, 3, -3, -8, 7, 4);       // controluce rosso, il colore del marchio
  pannello(0xffe9c4, 2.6, 0, 2.5, 9, 14, 7); // luce larga di fronte: la faccia verso chi guarda resta dorata
  pannello(0xffe9c4, 1.2, 0, -8, 0, 12, 12); // rimbalzo dal basso
  const pmrem = new THREE.PMREMGenerator(renderer);
  const tex = pmrem.fromScene(sc, 0.03).texture;
  pmrem.dispose();
  return tex;
}

export function avvia(canvas) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' }); }
  catch (e) { canvas.hidden = true; return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scena = new THREE.Scene();
  scena.environment = ambiente(renderer);
  const luce = new THREE.DirectionalLight(0xfff0d8, 1.6); luce.position.set(2, 4, 3); scena.add(luce);
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  camera.position.set(0, 1.25, 6.6); camera.lookAt(0, 0.02, 0);

  const corona = creaCorona();
  const perno = new THREE.Group(); perno.add(corona); scena.add(perno);
  perno.rotation.x = 0.1;

  const fermo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let visibile = true, spinta = 0, premuto = false, ultimoX = 0, ultimoT = 0, nato = 0, inCorso = false;

  function misura() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // su schermi stretti e alti la corona resta intera: si allontana quanto serve
    camera.position.z = Math.max(6.6, 5.2 / Math.min(1, camera.aspect * 0.78));
    camera.updateProjectionMatrix();
    if (!inCorso) renderer.render(scena, camera);
  }
  function passo(ora) {
    inCorso = false;
    if (!nato) nato = ora;
    const dt = Math.min(0.05, (ora - (ultimoT || ora)) / 1000); ultimoT = ora;
    const k = Math.min(1, (ora - nato) / 1400), e = 1 - Math.pow(1 - k, 3);
    perno.scale.setScalar(0.72 + 0.28 * e);
    if (!premuto) {
      corona.rotation.y += (fermo ? 0 : 0.45) * dt + spinta * dt;
      spinta *= Math.pow(0.05, dt);
    }
    if (!fermo) perno.position.y = Math.sin(ora / 1400) * 0.05;
    renderer.render(scena, camera);
    chiedi();
  }
  function chiedi() {
    if (inCorso || !visibile || document.hidden) return;
    if (fermo && nato && !premuto && Math.abs(spinta) < 0.02 && performance.now() - nato > 1500) return;
    inCorso = true; requestAnimationFrame(passo);
  }

  // trascinamento orizzontale: gira la corona; quello verticale resta allo scorrimento della pagina
  canvas.addEventListener('pointerdown', e => { premuto = true; ultimoX = e.clientX; spinta = 0; canvas.classList.add('presa'); chiedi(); });
  window.addEventListener('pointermove', e => {
    if (!premuto) return;
    const dx = e.clientX - ultimoX; ultimoX = e.clientX;
    corona.rotation.y += dx * 0.012; spinta = dx * 0.6;
  });
  const lascia = () => { if (!premuto) return; premuto = false; ultimoT = 0; canvas.classList.remove('presa'); chiedi(); };
  window.addEventListener('pointerup', lascia); window.addEventListener('pointercancel', lascia);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(v => { visibile = v[0].isIntersecting; ultimoT = 0; chiedi(); }, { threshold: 0.05 }).observe(canvas);
  }
  document.addEventListener('visibilitychange', () => { ultimoT = 0; chiedi(); });
  if ('ResizeObserver' in window) new ResizeObserver(misura).observe(canvas); else window.addEventListener('resize', misura);
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); canvas.hidden = true; });

  misura();
  canvas.classList.add('pronto');
  chiedi();
}

const tela = document.querySelector('.corona3d');
if (tela) avvia(tela);
