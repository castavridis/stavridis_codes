// One nurse, before and after — react-three-fiber. Before: 100 unknown patients flock around him; he calls through the day.
// After: the list multiplies to 1,600 known patients. ~1,520 green/yellow settle into a lower disc (or wide rings); the 80 reds float
// close around him, alerts (blue) fire through the day and are called first; each resolved red turns green and sinks into the disc.
// Ink: a hidden 10×10 Washes.js sheet, one cell per patient (cells 80–99 shared by the green/yellow mass), mapped onto billboards.
import React from 'react';
import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';

const h = React.createElement;
const N = 100, M = 1600, REDS = 80, YELLOWS = 320, DAY = 480, LUNCH = [210, 270], GAP = 0.5; // 9am–5pm, lunch 12:30–1:30
const TILT = new THREE.Euler(0.38, 0, -0.16), CENTER = new THREE.Vector3(), TETHER = 40, DOT_R = 0.024; // 75% of the original 0.032
const IMPA = { blue: 1, red: 0.72, yellow: 0.72, green: 0.3, black: 0.12, grey: 0.12 }; // impact: ink weight by what the call could change
const impCol = (S, C, k) => { if (k === 'grey' || k === 'black') return C.grey3; const c = S.impC || (S.impC = {}), key = k + C.black + C.ground; return c[key] || (c[key] = new THREE.Color(C.ground).lerp(new THREE.Color(C.black), IMPA[k] ?? 0.12)); };
const OM = globalThis.OrbitMotion || { radial: (wb, t, ph) => wb * 0.07 * Math.sin(t * 1.3 + ph), lift: (wb, t, ph) => wb * 0.14 * Math.sin(t * 0.9 + ph * 1.7) }; // shared with the care-team figures (orbit-motion.js)
const rnd = Math.random, c01 = v => v < 0 ? 0 : v > 1 ? 1 : v;

const tok = (n, fb) => { let v = getComputedStyle(document.documentElement).getPropertyValue(n).trim(); if (/^#[0-9a-f]{8}$/i.test(v)) v = v.slice(0, 7); return /^#[0-9a-f]{6}$/i.test(v) ? v : fb; };
const palette = () => {
  const p = { red: tok('--color-grad-danger-start', '#e5562e'), yellow: tok('--color-grad-warning-start', '#f9ac31'), green: tok('--color-grad-success-start', '#b2d07f'), none: tok('--color-caresignal-none', '#706c69'), black: tok('--color-confetti-black', '#1d1b1a'), paper: tok('--color-washes-paper', '#fbf6ea'), blue: tok('--color-washes-cerulean-blue', '#108ba0'), rose: '#a50e53', hansa: tok('--color-washes-hansa-yellow', '#e3af08') };
  p.cerulean = p.blue; p.black0 = p.black;
  p.grey = '#' + new THREE.Color(p.none).lerp(new THREE.Color(p.paper), 0.55).getHexString();
  return p;
};
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
const mulberry = seed => { let a = (seed >>> 0) || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

const hex01 = x => ({ r: parseInt(x.slice(1, 3), 16) / 255, g: parseInt(x.slice(3, 5), 16) / 255, b: parseInt(x.slice(5, 7), 16) / 255 });
const kmR = (K, S, x, Rbg) => { const a = 1 + K / S, b = Math.sqrt(Math.max(0, a * a - 1)), e = Math.exp(Math.min(12, b * S * x)), d = (a + b) * e - (a - b) / e; if (d < 2e-9) return 0; const Rl = (e - 1 / e) / d, Tl = 2 * b / d; return Math.max(0, Math.min(1, Rl + Tl * Tl * Rbg / (1 - Rl * Rbg))); };
const kmInk = (color, paper, xref = 0.8) => { const t = hex01(color), p = hex01(paper), K = [0, 0, 0];
  ['r', 'g', 'b'].forEach((c, i) => { const tgt = Math.min(Math.max(0.02, t[c]), p[c] - 0.004); let lo = 0, hi = 80; for (let n = 0; n < 40; n++) { const m = (lo + hi) / 2; if (kmR(m, 3.3, xref, p[c]) > tgt) lo = m; else hi = m; } K[i] = hi; });
  return { color, K, S: [3.3, 3.3, 3.3], granulation: 0.3, density: 0.25, staining: 5 }; };
import './orbit-motion.js';
import WashHighlightFX from '../wash-highlight';
// Shared capture-safe loader — both engine generations assign window.Washes
// (see wash-highlight.js); never resolve the engine from the global.
const loadWashes = WashHighlightFX.loadWashes;
// The site's paint box (as in the DS login-form wash sheet): 0 quinacridone rose #a50e53, 1 hansa yellow, 2 cerulean blue. Status inks are mixed on the paper from these.
const MIX = { red: [[0, 1], [1, 0.55]], yellow: [[1, 0.85], [0, 0.04]], green: [[1, 0.55], [2, 0.3]], blue: [[2, 1]], grey: [[0, 0.19], [1, 0.03], [2, 0.08]] }; // same warm neutral as the impact trails
const SLOT = { red: 'red', yellow: 'yellow', green: 'green', blue: 'blue' }, GREY_INK = 'grey', LOAD = { red: 1, yellow: 0.8, green: 0.6, blue: 1 };
const MIX0 = { red: [1, 0.55, 0], yellow: [0.04, 0.85, 0], green: [0, 0.55, 0.3] }; // rose, hansa, cerulean parts per status
const setMix = p => { for (const st of ['red', 'yellow', 'green']) { const c = st.charAt(0).toUpperCase() + st.slice(1), w = [p['mix' + c + 'Rose'], p['mix' + c + 'Hansa'], p['mix' + c + 'Cerulean']].map((v, i) => v == null ? MIX0[st][i] : +v); MIX[st] = w.map((v, i) => [i, v]).filter(e => e[1] > 0); } }; // the mixer: each status ink is laid as these three paints together
let GOUACHE = false; // gouache needs body to read on dark ground: the thin grey mix gets 4× the pigment
const IMPMIX = [[0, 0.17], [1, 0.025], [2, 0.07]]; // rose cancels the hansa + cerulean green: a warm neutral grey
let IMPACT = false, STILL = false; const IMPK = { blue: 9, red: 6.5, yellow: 6.5, green: 2.6 }; // impact: every trail is the neutral mix, loaded by what the call could change
const ink = (wc, x, y, r, name, load = 1) => { const k = GOUACHE && name === GREY_INK ? 4 : 1, mx = IMPACT && IMPK[name] ? IMPMIX : MIX[name], f = IMPACT && IMPK[name] ? IMPK[name] : 1; for (const [p, w] of mx || []) wc.paint(x, y, r, p, Math.min(1, w * load * k * f)); };
// ink model, same as the DS template: 'pigment' — each paint keeps its Curtis et al. family scattering, so thin passes dry as pale tints and the hue builds with load;
// 'dye' — the engine's instant model (S ≈ 3.3: full hue from the first touch, no tonal build); 'glaze' — halfway, a geometric blend of the two. K is re-solved per channel
// so one full dried stamp (x ≈ 1.3) over the paper lands on the paint's hex
const KM_S = [[0.05, 0.003, 0.03], [0.5, 0.88, 0.009], [0.06, 0.26, 0.4]], DYE = { pigment: 0, glaze: 0.5, dye: 1 };
const kmPaint = (color, paper, Sfam, dye, props) => { const t = hex01(color), p = hex01(paper), S = Sfam.map(v => Math.pow(v, 1 - dye) * Math.pow(3.3, dye)), K = [0, 0, 0];
  ['r', 'g', 'b'].forEach((c, i) => { const tgt = Math.min(Math.max(0.02, t[c]), p[c] - 0.004); let lo = 0, hi = 80; for (let n = 0; n < 40; n++) { const m = (lo + hi) / 2; if (kmR(m, S[i], 1.3, p[c]) > tgt) lo = m; else hi = m; } K[i] = hi; });
  return Object.assign({ color, K, S }, props); };
const applyWash = (wc, p) => { try { wc.paperWetness(p.wetness || 'wetOnWet'); wc.paintLoad(p.pigmentLoad ?? 2.2); wc.waterLoad(p.waterLoad ?? 1.4); wc.edgeDarkening(p.edgeDarkening ?? true); } catch (e) {}
  try { let m = wc.evaporation(); if (wc.__evapSet != null && Math.abs(m - wc.__evapSet) < 1e-6) m = wc.__evapBase; if (isFinite(m)) { wc.__evapBase = m; wc.__evapSet = m * 2; wc.evaporation(m * 2); } } catch (e) {} }; // the sheet steps every other frame, so it evaporates twice as fast per step to dry on the same clock
const paints = (C, medium, gran = 0.9, glazeDye = 0.5) => [C.rose, C.hansa, C.cerulean].map((col, i) => kmPaint(col, C.paper, KM_S[i], medium === 'glaze' ? glazeDye : DYE[medium] ?? 0, { granulation: gran, density: 0.02, staining: 5 }));

// dark ground: the engine's own gouache set (high-scattering pigments that read on near-black paper) on the dark sheet; light: our KM paints solved against the paper
const inkUp = (wc, C, p, dye) => { try { if (p.dark) { wc.paperColor(C.ground); wc.palette(null); wc.gouacheMode(true); } else { wc.paperColor(C.paper); wc.gouacheMode('auto'); wc.palette(paints(C, p.medium, p.granulation, dye)); } } catch (e) {} };
const SV = { a: new THREE.Vector3(), b: new THREE.Vector3() };
const makeSeal = host => { // the activity, set like the system's rotating seal, round the outside of his photo
  const NS = 'http://www.w3.org/2000/svg', FS = 9, LS = 1.6, ADV = FS * 0.6 + LS, el = document.createElement('div'), id = 'seal-' + Math.random().toString(36).slice(2);
  el.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none;z-index:4;will-change:transform;color:var(--color-confetti-black)';
  el.innerHTML = '<svg xmlns="' + NS + '" style="display:block;overflow:visible"><circle fill="none" stroke="var(--color-washes-paper)" stroke-opacity="0.82"></circle><defs><path id="' + id + '" fill="none"></path></defs><g><text fill="currentColor" font-family="var(--font-mono)" font-size="' + FS + '" letter-spacing="' + LS + '" xml:space="preserve" style="text-transform:uppercase"><textPath href="#' + id + '"></textPath></text></g></svg>';
  host.appendChild(el); const svg = el.firstChild, band = svg.querySelector('circle'), path = svg.querySelector('path'), g = svg.querySelector('g'), tp = svg.querySelector('textPath');
  let label = '', lastR = -1, lastL = null;
  const curved = (name, rad) => { const max = Math.floor(2 * Math.PI * rad / ADV), n = name.length, copies = Math.max(1, Math.floor(max / (n + 3))); if (copies === 1) return name; const gap = max - copies * n, b = Math.floor(gap / copies), ex = gap % copies; let o = ''; for (let i = 0; i < copies; i++) { const w = b + (i < ex ? 1 : 0), l = Math.floor((w - 1) / 2); o += name + ' '.repeat(l) + '\u00b7' + ' '.repeat(w - 1 - l); } return o; };
  const setTone = t => { const dark = t !== 'light'; band.setAttribute('stroke', dark ? 'var(--color-confetti-black)' : 'var(--color-washes-paper)'); band.setAttribute('stroke-opacity', dark ? '1' : '0.82'); el.style.color = dark ? 'var(--color-washes-paper)' : 'var(--color-confetti-black)'; };
  return { setTone, setLabel(t) { label = t || ''; el.style.display = label ? '' : 'none'; },
    place(x, y, rAv, time) { const tr = rAv + 5, R = Math.ceil(rAv + 18), rk = Math.round(tr * 2) / 2;
      if (rk !== lastR || label !== lastL) { lastR = rk; lastL = label; svg.setAttribute('width', R * 2); svg.setAttribute('height', R * 2); svg.setAttribute('viewBox', '0 0 ' + R * 2 + ' ' + R * 2);
        band.setAttribute('cx', R); band.setAttribute('cy', R); band.setAttribute('r', rAv + 8.5); band.setAttribute('stroke-width', 15);
        path.setAttribute('d', 'M ' + R + ' ' + R + ' m -' + rk + ' 0 a ' + rk + ' ' + rk + ' 0 1 1 ' + rk * 2 + ' 0 a ' + rk + ' ' + rk + ' 0 1 1 -' + rk * 2 + ' 0'); tp.textContent = curved(label, rk); }
      g.setAttribute('transform', 'rotate(' + (STILL ? 0 : (time * 12) % 360).toFixed(2) + ' ' + R + ' ' + R + ')'); el.style.transform = 'translate(' + (x - R).toFixed(1) + 'px,' + (y - R).toFixed(1) + 'px)'; },
    destroy() { el.remove(); } };
};
function Photo({ before, after, lunch, S }) { // the before photo crossfades into the after one as the lights come up; an empty desk while he's at lunch
  const load = u => { const t = new THREE.TextureLoader().load(u); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  const texA = React.useMemo(() => load(after), [after]), texB = React.useMemo(() => load(before || after), [before, after]), texL = React.useMemo(() => lunch ? load(lunch) : null, [lunch]), top = React.useRef(), away = React.useRef(), grp = React.useRef(), base = React.useRef();
  useFrame((st, dt) => { const cam = st.camera, c = SV.a.set(0, 0, 0).project(cam), e = SV.b.setFromMatrixColumn(cam.matrixWorld, 0).multiplyScalar(0.75 * cam.position.length() / 9.05).project(cam), W = st.size.width, H = st.size.height, rr0 = Math.hypot((e.x - c.x) / 2 * W, (e.y - c.y) / 2 * H), AVR = 72, avK = rr0 > 0 ? AVR / rr0 : 1; // the photo is always 144px across on screen
    if (grp.current) { grp.current.quaternion.copy(cam.quaternion); grp.current.scale.setScalar(cam.position.length() / 9.05 * avK); }
    if (S.seal) { const x = (c.x + 1) / 2 * W, y = (1 - c.y) / 2 * H, rr = rr0 * avK; S.seal.place(x, y, rr, S.clockReal); S.av = { x: x / W, y: y / H, r: rr, W, H }; } const out = ((S.phase === 'before' || S.phase === 'after') && S.minute >= LUNCH[0] && S.minute < LUNCH[1]) || S.phase === 'beforeHold' || S.phase === 'afterHold' || (S.phase === 'morph' && S.camMix < 0.5) || (S.phase === 'before' && S.camMix > 0.5); // at lunch or off shift: he dims — and stays dimmed into the morph, so the before face only ever fades further out
    S.lunchMix = (S.lunchMix || 0) + ((out && !S.rest ? 1 : 0) - (S.lunchMix || 0)) * Math.min(1, dt * 3); const k = S.camMix, gone = c01(1 - Math.abs(k - 0.5) / 0.3); // between before and after he fades out fully, the photo swaps unseen, then he fades back in
    if (top.current) top.current.opacity = k < 0.5 ? 1 : 0;
    if (away.current) { const v = Math.max(0.7 * S.lunchMix, gone); away.current.opacity = v; away.current.visible = v > 0.002; away.current.color.set(S.C.ground); } }); // a paper veil over both photos, so they don't show through each other
  const geo = React.useMemo(() => new THREE.CircleGeometry(1, 128), []);
  const geoOld = React.useMemo(() => {
    const s = new THREE.Shape(), w = 2, r = 0.07, x = -1, y = -1;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + w - r); s.quadraticCurveTo(x + w, y + w, x + w - r, y + w);
    s.lineTo(x + r, y + w); s.quadraticCurveTo(x, y + w, x, y + w - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    const g = new THREE.ShapeGeometry(s, 8), uv = g.attributes.uv, pos = g.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + 1) / 2, (pos.getY(i) + 1) / 2);
    return g; }, []);
  return h('group', { ref: grp },
    h('mesh', { geometry: geo, scale: 0.75, renderOrder: 5 }, h('meshBasicMaterial', { ref: base, map: texA, toneMapped: false, transparent: true })),
    h('mesh', { geometry: geo, scale: 0.75, position: [0, 0, 0.001], renderOrder: 6 }, h('meshBasicMaterial', { ref: top, map: texB, toneMapped: false, transparent: true })),
    h('mesh', { geometry: geo, scale: 0.752, position: [0, 0, 0.002], renderOrder: 7 }, h('meshBasicMaterial', { ref: away, toneMapped: false, transparent: true, opacity: 0, depthWrite: false })));
}

const STAIN_VS = `attribute vec2 aCell; attribute vec2 aLook; attribute float aRot; uniform float uTime; varying vec2 vUv; varying vec2 vLocal; varying float vStr;
void main() { vec4 mv = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0); float a = aRot + uTime * 0.12; mat2 R = mat2(cos(a), -sin(a), sin(a), cos(a));
  mv.xy += (R * position.xy) * aLook.y; vLocal = uv; vStr = aLook.x; vUv = (aCell + 0.06 + uv * 0.88) / 10.0; gl_Position = projectionMatrix * mv; }`;
const DARK_GROUND = '#391f00', DARK_INK = '#fffbf0';
const STAIN_FS = `uniform sampler2D uTex; uniform float uFade; uniform float uDarken; varying vec2 vUv; varying vec2 vLocal; varying float vStr;
void main() { vec4 c = texture2D(uTex, vUv); float a = c.a * uFade * vStr * (1.0 - smoothstep(0.34, 0.5, length(vLocal - 0.5))); gl_FragColor = vec4(c.rgb, 1.0);
  #include <colorspace_fragment>
  gl_FragColor = vec4(gl_FragColor.rgb * a + uDarken * (1.0 - a), a);
}`;
const BLENDS = {
  multiply: { blendEquation: THREE.AddEquation, blendSrc: THREE.DstColorFactor, blendDst: THREE.OneMinusSrcAlphaFactor },
  normal: { blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor },
  screen: { blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcColorFactor },
  darken: { blendEquation: THREE.MinEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor },
  additive: { blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor } };
const CSS_BLEND = { multiply: 'multiply', normal: 'normal', screen: 'screen', darken: 'darken', additive: 'plus-lighter' };

function Stains({ S }) {
  const mesh = React.useRef(), m = React.useMemo(() => new THREE.Object3D(), []);
  const mat = React.useMemo(() => new THREE.ShaderMaterial({ uniforms: { uTex: { value: null }, uTime: { value: 0 }, uFade: { value: 1 }, uDarken: { value: 0 } }, vertexShader: STAIN_VS, fragmentShader: STAIN_FS, transparent: true, depthWrite: false, blending: THREE.CustomBlending }), []);
  const geo = React.useMemo(() => { const g = new THREE.PlaneGeometry(1, 1), r = mulberry(99), rot = new Float32Array(M);
    for (let i = 0; i < M; i++) rot[i] = r() * 6.283;
    g.setAttribute('aCell', new THREE.InstancedBufferAttribute(new Float32Array(M * 2), 2)); g.setAttribute('aLook', new THREE.InstancedBufferAttribute(new Float32Array(M * 2), 2)); g.setAttribute('aRot', new THREE.InstancedBufferAttribute(rot, 1)); return g; }, []);
  useFrame(() => {
    const el = mesh.current;
    if (S.atlasCanvas && (!S.tex || S.tex.image !== S.atlasCanvas)) { if (S.tex) S.tex.dispose(); S.tex = new THREE.CanvasTexture(S.atlasCanvas); S.tex.colorSpace = THREE.SRGBColorSpace; S.tex.premultiplyAlpha = false; mat.uniforms.uTex.value = S.tex; }
    el.visible = !!S.tex && S.mode === 'travel'; if (!el.visible) return;
    const b = S.params.dark ? 'normal' : S.params.blend || 'multiply'; if (mat.userData.blend !== b) { Object.assign(mat, BLENDS[b] || BLENDS.multiply, { blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor }); mat.uniforms.uDarken.value = b === 'darken' ? 1 : 0; mat.userData.blend = b; mat.needsUpdate = true; }
    S.tex.needsUpdate = true; mat.uniforms.uTime.value = S.clockReal; mat.uniforms.uFade.value = S.inkAlpha;
    if (S.stainDirty) { const cell = geo.attributes.aCell, look = geo.attributes.aLook;
      for (const d of S.dots) { cell.setXY(d.i, d.cell % 10, 9 - Math.floor(d.cell / 10)); look.setXY(d.i, d.mode === 'hidden' ? 0 : d.strength, d.size); }
      cell.needsUpdate = look.needsUpdate = true; S.stainDirty = false; }
    for (const d of S.dots) { m.position.copy(d.p); m.updateMatrix(); el.setMatrixAt(d.i, m.matrix); }
    el.instanceMatrix.needsUpdate = true;
  });
  return h('instancedMesh', { ref: mesh, args: [geo, mat, M], frustumCulled: false, renderOrder: 2 });
}

function Swarm({ S }) {
  const mesh = React.useRef(), line = React.useRef(), badge = React.useRef(), hot = React.useRef(), hotRing = React.useRef(), { camera, pointer, size, setDpr, gl } = useThree();
  const tmp = React.useMemo(() => ({ ax: new THREE.Vector3(), m: new THREE.Object3D(), t: new THREE.Vector3(), q: new THREE.Vector3(), look: new THREE.Vector3(), r: new THREE.Vector3(), u: new THREE.Vector3(), f: new THREE.Vector3(), qt: new THREE.Quaternion() }), []);
  React.useLayoutEffect(() => { for (let i = 0; i < M; i++) mesh.current.setColorAt(i, S.C.grey3); }, []);
  useFrame((_, raw) => {
    { const q = S.params.quality || 'high'; if (S.qApplied !== q) { S.qApplied = q; const dr = window.devicePixelRatio || 1; // quality tiers: render resolution, wash-sim grid, trail dab rate
      const px = q === 'low' ? 1 : q === 'medium' ? Math.min(dr, 1.25) : Math.min(dr, 1.5); try { setDpr(px); } catch (e) {} try { gl.setPixelRatio(px); gl.setSize(size.width, size.height, false); } catch (e) {} S.qPx = px;
      if (S.wc) try { if (q !== 'high' || S.qWash) { S.qWash = q !== 'high'; S.wc.quality(q === 'high' ? 'medium' : 'low'); } } catch (e) {} } }
    if (S.qPx && Math.abs(gl.getPixelRatio() - S.qPx) > 0.01) try { gl.setPixelRatio(S.qPx); gl.setSize(size.width, size.height, false); } catch (e) {} // R3F resets the ratio on resize; hold the tier's
    if (S.paused) { if (S.wc && !S.wcHeld) { S.wcHeld = true; try { S.wc.pause({ acceptInput: true }); } catch (e) {} } return; } // out of view / behind a panel: freeze the day and the paint where they are
    if (S.wc) { S.wcHeld = false; S.simOdd = !S.simOdd; try { S.simOdd ? S.wc.pause({ acceptInput: true }) : S.wc.resume(); } catch (e) {} } // the wash sheet simulates at half the frame rate; dots keep full rate, new dabs still land on paused frames
    const dt = Math.min(0.05, raw), P = S.params, C = S.C, D = S.dots, { m, t, q } = tmp;
    S.step(dt);
    const after = !(S.phase === 'before' || S.phase === 'beforeHold'); S.camMix += ((after ? 1 : 0) - S.camMix) * Math.min(1, dt * 0.9);
    const k = S.camMix; { const tx = P.tiltX ?? 22, ty = P.tiltY ?? 0, tz = P.tiltZ ?? -9, ax = P.tiltXAfter ?? tx, ay = P.tiltYAfter ?? ty, az = P.tiltZAfter ?? tz, D2R = Math.PI / 180; TILT.set((tx + (ax - tx) * k) * D2R, (ty + (ay - ty) * k) * D2R, (tz + (az - tz) * k) * D2R); } { const L = (b, f) => { const v0 = +(P[b] ?? 0), v1 = +(P[b + 'After'] ?? v0); return v0 + (v1 - v0) * k; }; CENTER.set(L('centerX'), L('centerY'), L('centerZ')); } // the center eases to its after position too // the tilt eases from the before setting to the after one
    S.birdMix = (S.birdMix ?? (P.view === 'birdseye' ? 1 : 0)); S.birdMix += ((P.view === 'birdseye' ? 1 : 0) - S.birdMix) * Math.min(1, dt * 2.2); const bm = S.birdMix * S.birdMix * (3 - 2 * S.birdMix), om = 1 - bm;
    const pf = P.mobile || P.still ? 0 : 1, fit = P.mobile ? Math.max(0, (4.3 + Math.hypot(P.centerX || 0, P.centerZ || 0)) / (Math.tan(camera.fov * Math.PI / 360) * Math.min(1, size.width / size.height)) - 0.35) : 0; // phone: no pointer drift, height that fits the outer ring in a narrow frame
    const tx = (om * 0.9 + bm * 0.5) * pointer.x * pf, ty = om * (0.35 + 1.3 * k + pointer.y * 0.5 * pf) + bm * Math.max(9.5 + 1.6 * k, fit), tz = om * (7.2 + 1.7 * k) + bm * (0.35 - pointer.y * 0.5 * pf);
    camera.position.x += (tx - camera.position.x) * 0.06; camera.position.y += (ty - camera.position.y) * 0.06; camera.position.z += (tz - camera.position.z) * 0.06;
    camera.lookAt(tmp.look.set(0, 0, 0));
    const kD = S.dotPx ? S.dotPx * 2 * camera.position.length() * Math.tan(camera.fov * Math.PI / 360) / size.height / DOT_R : 1; // dots match the 2D lists' radius at the nurse's depth
    const camD = camera.position.length(), hid = (x, y, p) => { const a = S.av; if (!a) return false; const dx = (x - a.x) * a.W, dy = (y - a.y) * a.H; if (dx * dx + dy * dy > a.r * a.r) return false; return !p || p.distanceTo(camera.position) > camD; }; // behind his photo: no ink
    const ord = P.arrangement === 'concentric', fl = ord ? 0 : P.flocking, time = S.clockReal, band = [], rings = ord || P.massShape === 'rings';
    for (const d of D) if (d.mode === 'band') band.push(d);
    if (ord) { const SP = 0.13, G = new Map(), rot = S.oRot || (S.oRot = {}), sp = P.orbitSpeed * (1 + ((P.afterSpeed ?? 0.7) - 1) * k); // orderly: snap each radius to a ring, spread each ring's dots evenly, turn the ring as one
      for (const d of D) { if (d.mode === 'hidden') continue; const ri = Math.max(0, Math.round(d.a / SP)); let g = G.get(ri); if (!g) G.set(ri, g = []); g.push(d); }
      for (const [ri, g] of G) { const a = ri * SP; rot[ri] = (rot[ri] || 0) + 0.12 * Math.pow(1.9 / Math.max(0.5, a), 1.5) * dt * sp;
        g.sort((p, q2) => (((p.theta % 6.2832) + 6.2832) % 6.2832) - (((q2.theta % 6.2832) + 6.2832) % 6.2832));
        const off = ri * 0.618 * 6.2832 + rot[ri]; g.forEach((d, n) => { d.oa = a; d.oth = off + n / g.length * 6.2832; }); } }
    for (const d of D) {
      if (d.mode !== 'hidden') {
        d.theta += d.w * dt * P.orbitSpeed * (1 + ((P.afterSpeed ?? 0.7) - 1) * k); // the after ring turns a little slower
        const isBand = d.mode === 'band';
        if (ord) t.set(Math.cos(d.oth) * d.oa, 0, Math.sin(d.oth) * d.oa).applyEuler(TILT).add(CENTER);
        else if (isBand) t.set(Math.cos(d.theta) * d.a, d.hgt + Math.sin(time * 0.7 + d.bob) * (P.still ? 0 : 0.06) * (1 + fl), Math.sin(d.theta) * d.a).applyEuler(TILT).add(CENTER);
        else if (rings) t.set(Math.cos(d.theta) * d.a, d.hgt + Math.sin(time * 0.5 + d.bob) * (P.still ? 0 : 0.03), Math.sin(d.theta) * d.a).applyEuler(TILT).add(CENTER);
        else t.set(Math.cos(d.theta) * d.a, -1.3 + d.hgt + Math.sin(time * 0.5 + d.bob) * (P.still ? 0 : 0.03), Math.sin(d.theta) * d.a).add(CENTER);
        if (P.wobble > 0 && !ord) { const wb = P.wobble, ph = d.bob * 3.1; q.copy(t).sub(CENTER).multiplyScalar(OM.radial(wb, time, ph)); t.add(q); t.addScaledVector(tmp.ax.set(0, 1, 0).applyEuler(TILT), OM.lift(wb, time, ph)); } // a little wobble off the ideal orbit
        if (d.pendingReveal && (t.distanceToSquared(d.p) < 0.02 || time > d.revealBy)) { d.pendingReveal = false; d.target = d.status; if (d.status === 'red') S.paint('bloom', d, 'red'); } // in place: the status shows
        if (d.budUntil > time) { const pp = D[d.parent]; t.copy(pp.p).sub(CENTER).applyAxisAngle(tmp.ax.set(0, 1, 0).applyEuler(TILT), -d.budTh * c01((time - d.budStart) / Math.max(0.01, d.budUntil - d.budStart))).multiplyScalar(d.budR).add(CENTER); d.p.lerp(t, 1 - Math.exp(-12 * dt)); d.v.copy(pp.v); } else {
        const acc = q.copy(t).sub(d.p).multiplyScalar((isBand ? 4.2 - 2.6 * fl : 1.8) * (S.phase === 'morph' ? 2.6 : 1));
        if (isBand) {
          let ax = 0, ay = 0, az = 0, vx = 0, vy = 0, vz = 0, n = 0;
          for (const o of band) { if (o === d) continue; const dx = d.p.x - o.p.x, dy = d.p.y - o.p.y, dz = d.p.z - o.p.z, dd = dx * dx + dy * dy + dz * dz;
            if (dd < 0.09 && dd > 1e-6) { const s = (0.3 - Math.sqrt(dd)) / 0.3; ax += dx * s; ay += dy * s; az += dz * s; }
            if (o.flock === d.flock && dd < 0.6) { vx += o.v.x; vy += o.v.y; vz += o.v.z; n++; } }
          acc.x += ax * 9 * fl; acc.y += ay * 9 * fl; acc.z += az * 9 * fl;
          if (n) { acc.x += (vx / n - d.v.x) * 2.2 * fl; acc.y += (vy / n - d.v.y) * 2.2 * fl; acc.z += (vz / n - d.v.z) * 2.2 * fl; }
        }
        d.v.addScaledVector(acc, dt).multiplyScalar(1 - (isBand ? 2.2 : 1.7) * dt); d.p.addScaledVector(d.v, dt); }
      }
      const goal = d.mode === 'hidden' ? 0 : 1; // one size; only perspective changes it
      d.scale += (goal - d.scale) * Math.min(1, dt * 6);
      m.position.copy(d.p); m.scale.setScalar(d.scale * kD); m.updateMatrix(); mesh.current.setMatrixAt(d.i, m.matrix);
      d.col.lerp(P.impact ? impCol(S, C, d.alert && !d.resolved ? 'blue' : d.target) : C[d.target + '3'], Math.min(1, dt * (d.target === 'grey' && !P.impact ? 1.6 : 4))); mesh.current.setColorAt(d.i, d.col);
    }
    mesh.current.instanceMatrix.needsUpdate = true; mesh.current.instanceColor.needsUpdate = true;
    // alert badges: a blue notification riding each alerting red
    tmp.r.setFromMatrixColumn(camera.matrixWorld, 0); tmp.u.setFromMatrixColumn(camera.matrixWorld, 1);
    let b = 0; for (const i of S.alertOpen) { if (b >= 40) break; const d = D[i], s = Math.max(0.6, d.scale);
      tmp.f.copy(camera.position).sub(d.p).normalize();
      m.position.copy(d.p).addScaledVector(tmp.r, DOT_R * 1.5 * s * kD).addScaledVector(tmp.u, DOT_R * 1.5 * s * kD).addScaledVector(tmp.f, 0.05); m.scale.setScalar((0.62 + (P.still ? 0 : 0.14) * Math.sin(time * 5 + i)) * kD); m.updateMatrix(); badge.current.setMatrixAt(b++, m.matrix); }
    badge.current.count = b; badge.current.instanceMatrix.needsUpdate = true;
    const g = line.current; if (S.active != null) { // a tether that sweeps back along the orbit, like a spiral arm
      const d = D[S.active], a = g.geometry.attributes.position, axis = d.mode === 'mass' && !rings ? tmp.u.set(0, 1, 0) : tmp.u.set(0, 1, 0).applyEuler(TILT), sweep = -1.1 * Math.sign(P.orbitSpeed || 1);
      for (let n = 0; n < TETHER; n++) { const s = n / (TETHER - 1); tmp.f.copy(d.p).multiplyScalar(s); a.setXYZ(n, tmp.f.x, tmp.f.y, tmp.f.z); } // straight, nurse to patient
      if (hot.current) { hot.current.visible = hotRing.current.visible = true; hotRing.current.material.color.set(S.C.black); hot.current.position.copy(d.p); hot.current.scale.setScalar(Math.max(0.6, d.scale) * kD); hot.current.material.color.copy(d.col); hotRing.current.position.copy(d.p); hotRing.current.quaternion.copy(camera.quaternion); hotRing.current.scale.setScalar(Math.max(0.6, d.scale) * kD); hotRing.current.material.opacity = S.talking ? 0.9 : 0.45 + 0.35 * Math.sin(time * 14); }
      a.needsUpdate = true; g.visible = true; g.material.opacity = S.talking ? 0.55 : 0.2 + 0.18 * Math.sin(time * 14); } else { g.visible = false; if (hot.current) hot.current.visible = hotRing.current.visible = false; }
    if (S.mode === 'connect' && after && S.wc && S.inkAlpha > 0.99 && S.phase !== 'final') { // after: a wash laid along the line from him to whoever he's talking to, in their colour before it resolves
      S.trailT = (S.trailT || 0) + dt;
      if (S.trailT > 0.08) { S.trailT = 0; const c = S.cur;
        if (S.talking && S.active != null && c) { const d = D[S.active], name = c.alert ? 'blue' : c.yellow ? 'yellow' : 'red', wc = S.wc, r = 0.003 * (P.trailWidth || 2);
          const o = q.copy(CENTER).multiplyScalar(0).project(camera), ox = (o.x + 1) / 2, oy = (1 - o.y) / 2, v = tmp.f.copy(d.p).project(camera), x = (v.x + 1) / 2, y = (1 - v.y) / 2;
          const n = Math.min(48, Math.max(2, Math.ceil(Math.hypot(x - ox, y - oy) / (r * 1.2))));
          for (let s = 1; s <= n; s++) { const t = s / n, px = ox + (x - ox) * t, py = oy + (y - oy) * t; if (!hid(px, py)) ink(wc, px, py, r * 0.7, name, 0.12); } } } /* the line runs behind him */
    } else if ((S.mode === 'trails' || S.mode === 'connect') && S.wc && S.inkAlpha > 0.99 && S.phase !== 'final' && !(S.rest && S.clockReal < S.restAt)) { // each coloured dot draws its path in its own ink
      S.trailT = (S.trailT || 0) + dt;
      if (S.trailT > (S.params.quality === 'low' ? 0.12 : 0.06)) { S.trailT = 0; S.trailN = (S.trailN || 0) + 1; const wc = S.wc, r = 0.0035 * (P.trailWidth || 2), G = C.green3;
        for (const d of D) { const calling = P.callTrail && S.active === d.i, c0 = S.cur, slot = calling ? (after && c0 ? (c0.alert ? 'blue' : c0.yellow ? 'yellow' : 'red') : GREY_INK) : SLOT[d.target]; // after: the call draws in the status they had when it began
          const busy = after && S.active === d.i && (S.talking || calling), bands = after && (P.afterWash ?? 'calls') === 'bands'; // bands: every known patient paints its orbit faintly by risk; the call on the line is the bold stroke
          const fslot = d.alert ? 'blue' : slot, field = bands && !busy && !d.today && !d.snoozed && d.mode !== 'hidden' && d.scale > 0.4 && fslot != null && fslot !== GREY_INK && (d.target !== 'green' || d.i % 4 === 0);
          if (field && d.i % 3 !== S.trailN % 3) continue; // the field paints a third of its dots per tick
          const ok = calling || field || (after ? ((S.talking && S.active === d.i) || d.today) && slot != null : slot != null && d.mode === 'band' && d.scale > 0.4);
          if (!ok) { d.lx = null; continue; }
          const v = q.copy(d.p).project(camera), x = (v.x + 1) / 2, y = (1 - v.y) / 2, FIELD = { blue: 0.45, red: P.loadRed ?? 0.35, yellow: P.loadYellow ?? 0.16, green: P.loadGreen ?? 0.06 };
          const ks = busy && bands ? 1.9 : field ? 0.8 : 1, load = busy && bands ? 0.9 : field ? FIELD[fslot] : 0.4, sl = field ? fslot : slot;
          const maxN = +P.maxTrail > 0 && !field ? Math.max(2, Math.round(+P.maxTrail / (r * ks * 1.1))) : 0; // max trail length (fraction of the frame's width): the oldest dabs are lifted back to paper
          if (maxN && d.tqE !== S.tqEpoch) { d.tq = []; d.tqE = S.tqEpoch; }
          const dab = (px, py) => { if (hid(px, py, d.p)) return; ink(wc, px, py, r * ks, sl, sl === GREY_INK ? 1 : load); if (!maxN) return; const tq = d.tq || (d.tq = []); tq.push(px, py, r * ks); while (tq.length / 3 > maxN) { const ex = tq.shift(), ey = tq.shift(), er = tq.shift(); try { wc.paint(ex, ey, er * 1.35, 'paper', 1); } catch (e) {} } };
          if (d.lx == null) dab(x, y);
          else { const dx = x - d.lx, dy = y - d.ly, n = Math.min(6, Math.max(1, Math.ceil(Math.hypot(dx, dy) / (r * 1.1)))); for (let s = 1; s <= n; s++) dab(d.lx + dx * s / n, d.ly + dy * s / n); }
          d.lx = x; d.ly = y; }
      }
    } else if (S.mode === 'trails') for (const d of D) d.lx = null;
    for (const e of S.paintQueue.splice(0)) {
      const wc = S.wc; if (!wc || (after && e.kind === 'bloom')) continue; /* after: nothing is painted when statuses appear — only when he calls */ let x, y, r;
      if (S.mode === 'travel') { x = (e.cell % 10 + 0.5) / 10; y = (Math.floor(e.cell / 10) + 0.5) / 10; r = 0.016; }
      else { if (e.kind === 'mass') continue; const v = q.copy(D[e.dot].p).project(camera); x = (v.x + 1) / 2; y = (1 - v.y) / 2; r = 0.03; }
      if (S.mode === 'trails' || S.mode === 'connect') { // a splotch 125% of the dot's own diameter, no feathering
        const d = D[e.dot], base = 1; if (hid(x, y, d.p)) continue;
        tmp.u.setFromMatrixColumn(camera.matrixWorld, 1); const v2 = tmp.f.copy(d.p).addScaledVector(tmp.u, DOT_R * base).project(camera);
        const rs = 1.25 * Math.hypot(((v2.x + 1) / 2 - x) * size.width, ((1 - v2.y) / 2 - y) * size.height) / Math.min(size.width, size.height);
        if (e.kind === 'bloom') ink(wc, x, y, rs, e.slot, LOAD[e.slot]);
        else if (e.kind === 'alert') ink(wc, x, y, rs, 'blue', 1);
        else if (e.kind === 'resolve') { wc.paint(x, y, rs * 1.1, 'paper', 1); ink(wc, x, y, rs, 'green', 0.8); }
        continue;
      }
      const j = () => (Math.random() - 0.5) * r;
      if (e.kind === 'bloom') { wc.rewet(x, y, r * 2.6); ink(wc, x, y, r * 1.6, e.slot, LOAD[e.slot]); ink(wc, x + j(), y + j(), r * 0.9, e.slot, 0.7); }
      else if (e.kind === 'mass') { wc.rewet(x, y, r * 2.2); ink(wc, x + j(), y + j(), r * 1.4, e.slot, 0.45); }
      else if (e.kind === 'alert') { const ox = x + r * 1.1, oy = y - r * 1.1; wc.rewet(ox, oy, r * 1.7); ink(wc, ox, oy, r * 0.95, 'blue', 1); }
      else if (e.kind === 'resolve') { wc.paint(x, y, r * 2.9, 'paper', 1); wc.rewet(x, y, r * 2.4); ink(wc, x, y, r * 1.5, 'green', 0.75); ink(wc, x + j(), y + j(), r * 0.8, 'green', 0.6); }
    }
  });
  return h(React.Fragment, null,
    h('instancedMesh', { ref: mesh, args: [null, null, M], frustumCulled: false }, h('sphereGeometry', { args: [DOT_R, 12, 9] }), h('meshBasicMaterial', { toneMapped: false })),
    h('instancedMesh', { ref: badge, args: [null, null, 40], frustumCulled: false, renderOrder: 3 }, h('sphereGeometry', { args: [DOT_R * 0.94, 12, 9] }), h('meshBasicMaterial', { color: S.C.blue, toneMapped: false })),
    h('line', { ref: line, frustumCulled: false, renderOrder: 1 }, h('bufferGeometry', null, h('bufferAttribute', { attach: 'attributes-position', args: [new Float32Array(TETHER * 3), 3] })), h('lineBasicMaterial', { color: S.C.black, transparent: true, opacity: 0.4, depthWrite: false, toneMapped: false })),
    h('mesh', { ref: hot, visible: false, renderOrder: 10, frustumCulled: false }, h('sphereGeometry', { args: [DOT_R, 16, 12] }), h('meshBasicMaterial', { depthTest: false, toneMapped: false })),
    h('mesh', { ref: hotRing, visible: false, renderOrder: 11, frustumCulled: false }, h('ringGeometry', { args: [DOT_R * 1.45, DOT_R * 1.75, 40] }), h('meshBasicMaterial', { color: S.C.black, transparent: true, depthTest: false, toneMapped: false })));
}

export function mount(stage, { params, onStats, photo, photoBefore, photoLunch }) {
  const C = palette(), bg = new THREE.Color();
  const tint = p => { // the paper and the three paints can be overridden; the 3D ground and the sheet follow
    for (const k of ['paper', 'rose', 'hansa', 'cerulean']) if (p[k] && /^#[0-9a-f]{6}$/i.test(p[k])) C[k] = p[k];
    const dk = !!p.dark; GOUACHE = dk; C.ground = dk ? DARK_GROUND : C.paper; C.black = dk ? DARK_INK : C.black0;
    C.blue = C.cerulean; C.grey = p.greyInk != null ? '#' + new THREE.Color(C.ground).lerp(new THREE.Color(C.black), +p.greyInk).getHexString() /* ink at greyInk alpha over the ground, solid */ : '#' + new THREE.Color(C.none).lerp(new THREE.Color(dk ? DARK_INK : C.paper), dk ? 0.25 : (p.greyMix ?? 0.55)).getHexString();
    for (const k of ['grey', 'red', 'yellow', 'green', 'black', 'blue']) (C[k + '3'] ||= new THREE.Color()).set(C[k]);
    for (const k of ['red', 'yellow']) (C['dim' + k + '3'] ||= new THREE.Color()).set(C[k]).lerp(new THREE.Color(C.ground), 0.72);
    bg.set(p.canvasBg || C.ground); };
  tint(params);
  const setTilt = p => { TILT.set((p.tiltX ?? 22) * Math.PI / 180, (p.tiltY ?? 0) * Math.PI / 180, (p.tiltZ ?? -9) * Math.PI / 180); CENTER.set(+(p.centerX ?? 0), +(p.centerY ?? 0), +(p.centerZ ?? 0)); }; setTilt(params);
  const S = { params, C, dots: [], paintQueue: [], alertOpen: [], resolved: [], redOrder: null, active: null, talking: false, clockReal: 0, camMix: params.startAt === 'after' || params.startAt === 'tuesday' ? 1 : 0, inkAlpha: 1, stainDirty: true, wc: null, mode: null, minute: 0 };
  for (let i = 0; i < M; i++) S.dots.push({ i, p: new THREE.Vector3(), v: new THREE.Vector3(), col: new THREE.Color(C.grey), target: 'grey', scale: 0, mode: 'hidden', a: 2, theta: rnd() * 6.283, w: 0.1, hgt: 0, bob: rnd() * 6.283, flock: i % 7, cell: i % 100, strength: 0, size: 0.46, status: 'green', spawnAt: 0, spawned: true, parent: 0, alert: false, resolved: false });
  const rangeOf = (w, P = S.params) => { const lo = +(w === 'a' ? (P.ringMinAfter ?? P.ringMin ?? 1.6) : (P.ringMin ?? 1.6)), hi = +(w === 'a' ? (P.ringMaxAfter ?? P.ringMax ?? 2.55) : (P.ringMax ?? 2.55)); return [lo, Math.max(lo + 0.05, hi)]; }; // before and after each have their own span
  const bandRange = () => rangeOf(S.phase === 'before' || S.phase === 'beforeHold' ? 'b' : 'a');
  const fitBand = d => { const [a0, a1] = bandRange(d.bandK); d.a = a0 + d.bandU * (a1 - a0); d.w = 0.16 * Math.pow(1.9 / d.a, 1.5) * (0.9 + d.bandW * 0.2); };
  const setBand = (d, k) => { d.bandK = k; d.bandU = rnd(); d.bandW = rnd(); fitBand(d); d.hgt = (rnd() - 0.5) * 0.34; };
  const setBandOld = (d, a0, a1) => { d.a = a0 + rnd() * (a1 - a0); d.w = 0.16 * Math.pow(1.9 / d.a, 1.5) * (0.9 + rnd() * 0.2); d.hgt = (rnd() - 0.5) * 0.34; };
  const STRAT = { alert: [0, 0.1], red: [0.1, 0.28], yellow: [0.28, 0.52], green: [0.52, 1] }; // risk sets the orbit: alerts innermost, then red, yellow, green
  const AREA = { alert: [0, 0.01], red: [0.01, 0.05], yellow: [0.05, 0.25], green: [0.25, 1] }; // after: each band holds its share of the ring's area — 5% red (alerts innermost), 20% yellow, 75% green
  const areaU = (F, w) => { const [lo, hi] = rangeOf(w); return (Math.sqrt(lo * lo + F * (hi * hi - lo * lo)) - lo) / (hi - lo); };
  const bandOf = (st, w) => { if (w !== 'a') return STRAT[st] || STRAT.green; const B = S.bandF || AREA, f = B[st] || B.green; return [areaU(f[0], 'a'), areaU(f[1], 'a')]; };
  const RANK = { red: 0, yellow: 1, green: 2 };
  const placeAfter = (list, key, apply) => { // the after's rings take only the room their patients need: each status gets area in proportion to its count, packed in order
    const vis = list.filter(d => RANK[d.status] != null).sort((x, y) => RANK[x.status] - RANK[y.status] || key(x) - key(y)), n = { red: 0, yellow: 0, green: 0 }; for (const d of vis) n[d.status]++;
    const T = vis.length || 1, fR = n.red / T, fY = n.yellow / T; S.bandF = { alert: [0, Math.max(0.004, fR * 0.4)], red: [0, Math.max(fR, 0.004)], yellow: [fR, fR + fY], green: [fR + fY, 1] };
    const [lo, hi] = rangeOf('a'), seen = { red: 0, yellow: 0, green: 0 };
    for (const d of vis) { const f = S.bandF[d.status], F = f[0] + (seen[d.status]++ + 0.5) / n[d.status] * (f[1] - f[0]); apply(d, lo + areaU(F, 'a') * (hi - lo)); } };
  const isBefore = () => S.phase === 'before' || S.phase === 'beforeHold';
  const stratU = (st, w = isBefore() ? 'b' : 'a') => { const b = bandOf(st, w); return b[0] + rnd() * (b[1] - b[0]); };
  const stratA = (st, w = isBefore() ? 'b' : 'a') => { const [lo, hi] = rangeOf(w); return lo + stratU(st, w) * (hi - lo); };
  const toAlertBand = d => { d.mode = 'band'; d.bandK = 'b'; d.bandU = stratU('alert'); d.bandW = rnd(); fitBand(d); };
  const keepRadius = (d, a) => { d.w = (S.params.massShape === 'rings' ? 0.12 * Math.pow(1.9 / a, 1.5) : 0.1 * Math.pow(2 / a, 1.5)) * (0.9 + rnd() * 0.2); d.a = a; };
  const setMass = d => { if (S.params.massShape === 'rings') { d.a = 2.4 + rnd() * 1.6; d.hgt = (rnd() - 0.5) * 0.32; d.w = 0.12 * Math.pow(1.9 / d.a, 1.5) * (0.9 + rnd() * 0.2); }
    else { d.a = 1.25 + Math.sqrt(rnd()) * 1.95; d.hgt = (rnd() - 0.5) * 0.12; d.w = 0.1 * Math.pow(2 / d.a, 1.5) * (0.9 + rnd() * 0.2); } };
  const paint = S.paint = (kind, d, slot) => S.paintQueue.push({ kind, dot: d.i, cell: d.cell, slot });

  const newLoop = startAt => { S.rest = null; S.phase = 'before'; S.settleUntil = S.clockReal + (S.dots.some(d => d.mode !== 'hidden') ? 2 : 0.6 + (+S.params.startDelay || 0)); // startDelay (s): extra hold before the very first day
    const pool = shuffle(Array.from({ length: M }, (_, i) => i < REDS ? 'red' : i < REDS + YELLOWS ? 'yellow' : 'green'));
    S.dots.forEach((d, i) => { d.snoozed = false; d.status = pool[i]; d.alert = d.resolved = d.today = d.pendingReveal = false; d.target = 'grey'; d.cell = i % 100; d.size = 0.46; d.strength = i < N ? 1 : 0; d.spawned = true;
      if (i < N) { const fresh = d.mode === 'hidden'; d.mode = 'band'; setBand(d, 'b'); d.bandU = stratU(d.status); fitBand(d); if (fresh) { d.theta = d.flock / 7 * 6.283 + (rnd() - 0.5) * 0.9; d.p.set(Math.cos(d.theta) * d.a, d.hgt, Math.sin(d.theta) * d.a).applyEuler(TILT); } }
      else d.mode = 'hidden'; });
    S.alertOpen = []; S.resolved = []; S.redOrder = null; S.stainDirty = true; S.inkAlpha = 1; if (S.wc) (S.wc.clearPaint(), S.tqEpoch = (S.tqEpoch || 0) + 1);
    if (startAt === 'after' || startAt === 'tuesday') startMorph(true, startAt === 'tuesday' ? 'tue' : 'mon'); else { S.phase = 'before'; startDay(); }
  };
  const startDay = () => { S.spans = [];
    S.minute = 0; S.cur = null; S.free = 0; S.hold = 0; S.callsDone = false; S.active = null; S.talking = false;
    if (S.phase === 'before') { S.queue = shuffle([...Array(N).keys()]); S.counts = { placed: 0, missed: 0, red: 0, yellow: 0, green: 0 }; S.log = []; S.bConn = 0; S.bIssue = false; S.bIssueAt = 1 + Math.floor(rnd() * 3); return; }
    const tue = S.scenario === 'tue', reds = S.dots.filter(d => d.status === 'red' && !d.resolved).map(d => d.i), n = Math.max(0, Math.round(M * S.params.alertRate / 100 / 5)), early = Math.ceil(n * 0.4);
    const pickFrom = tue ? S.dots.filter(d => d.status !== 'red' && d.status !== 'grey' && d.mode !== 'hidden').map(d => d.i) : reds, picks = shuffle(pickFrom.slice()).slice(0, n); // week 2: alerts are patients whose status changed since their check-in
    for (const d of S.dots) d.today = false;
    S.redOrder = shuffle(reds.slice()); S.resolved = []; S.alertOpen = []; S.done = []; S.redsOf = tue ? reds.length : REDS;
    S.yellowOrder = tue ? S.dots.filter(d => d.status === 'yellow' && !picks.includes(d.i)).map(d => d.i) : []; // in list order, left to right
    const used = new Set(reds.map(i => S.dots[i].cell)); S.freeCells = []; for (let c = 0; c < 80; c++) if (!used.has(c)) S.freeCells.push(c);
    S.alertPlan = picks.map((i, k) => ({ i, t: k < early ? 0.5 + k * 1.5 : 12 + rnd() * (DAY - 60) })).sort((a, b) => a.t - b.t); // ~40% came in overnight
    S.countsA = { placed: 0, missed: 0, alerts: 0, resolved: 0, yellows: 0 };
  };
  const nextCandidate = () => {
    if (S.phase === 'before') return S.queue.length ? { i: S.queue[0], alert: false } : null;
    if (S.alertOpen.length) return { i: S.alertOpen[0], alert: true };
    if (S.redOrder.length) return { i: S.redOrder[0], alert: false };
    return S.yellowOrder && S.yellowOrder.length ? { i: S.yellowOrder[0], alert: false, yellow: true } : null; // spare time: check in on the yellows
  };
  const startCall = t => {
    const c = nextCandidate(); if (!c) return 'empty';
    const p = c.alert ? S.params.alertConnect : S.phase !== 'before' && S.params.afterConnectRange ? 0.55 + rnd() * 0.2 : S.params.connectRate, connect = rnd() < p, ring = 1 + rnd() * 1.5;
    const yl = S.params.yellowMinutes ?? 12, talk = c.yellow ? yl * (0.8 + rnd() * 0.4) : 20 + rnd() * 10; // a yellow check-in is a shorter call
    const dur = connect ? ring + talk : S.params.missMinutes * (0.7 + rnd() * 0.6);
    if (t < LUNCH[1] && t + dur > LUNCH[0]) t = LUNCH[1];
    if (t + dur > DAY) return 'late';
    if (S.phase === 'before') { S.queue.shift(); S.counts.placed++; } else S.countsA.placed++;
    S.cur = { i: c.i, alert: c.alert, yellow: !!c.yellow, start: t, connectAt: connect ? t + ring : null, end: t + dur, connect }; return 'ok';
  };
  const snooze = (d, i) => { S.countsA.missed++; d.snoozed = true; d.alert = false; d.target = d.status === 'yellow' ? 'dimyellow' : 'dimred'; S.alertOpen = S.alertOpen.filter(x => x !== i); if (S.redOrder) S.redOrder = S.redOrder.filter(x => x !== i); S.done.push('k'); }; // unreachable: snoozed until tomorrow
  const finishCall = c => {
    const d = S.dots[c.i];
    if (S.phase === 'before' && c.connect) { // exactly one issue per before-day: the bIssueAt-th connected call (or the last chance) is red/yellow, every other answer is fine; statuses swap with an uncalled patient so totals hold
      S.bConn++; const issue = !S.bIssue && (S.bConn >= S.bIssueAt || c.end > DAY - 90), want = issue ? (d.status === 'red' || d.status === 'yellow' ? d.status : rnd() < 0.25 ? 'red' : 'yellow') : 'green'; if (issue) S.bIssue = true;
      if (d.status !== want) { const o = S.dots.find(x => x.status === want && S.queue.includes(x.i)) || S.dots.find(x => x.i >= N && x.status === want); if (o) { [o.status, d.status] = [d.status, o.status]; [o.bandU, d.bandU] = [d.bandU, o.bandU]; if (o.mode === 'band') fitBand(o); fitBand(d); } } }
    (S.spans ||= []).push([c.start, c.end, !c.connect ? 'k' : S.phase === 'before' ? d.status[0] : c.alert ? 'a' : c.yellow ? 'y' : 'r']);
    if (S.phase === 'before') { const st = c.connect ? d.status : 'black'; d.target = st; S.log.push(st); S.counts[c.connect ? st : 'missed']++; if (c.connect) paint('bloom', d, st); return; }
    if (c.yellow) { S.yellowOrder = S.yellowOrder.filter(x => x !== c.i);
      if (c.connect) { d.status = 'green'; d.target = 'green'; d.resolved = d.today = true; keepRadius(d, stratA('green')); S.done.push('v'); S.countsA.yellows++; if (S.mode === 'travel') { d.cell = 80 + (d.i % 10); S.stainDirty = true; } else paint('resolve', d); }
      else snooze(d, c.i);
      return; }
    if (c.connect) { d.resolved = d.today = true; d.alert = false; d.target = 'green'; S.done.push('g'); S.alertOpen = S.alertOpen.filter(x => x !== c.i); S.redOrder = S.redOrder.filter(x => x !== c.i); S.resolved.push(c.i); S.countsA.resolved++; { d.mode = 'mass'; setMass(d); keepRadius(d, stratA('green')); } paint('resolve', d); }
    else snooze(d, c.i);
  };
  const startMorph = (instant, scen) => {
    { const [b0, b1] = rangeOf('b'), [a0, a1] = rangeOf('a'), map = a => a0 + (a - b0) / (b1 - b0) * (a1 - a0);
      for (const d of S.dots) { const p = d.i < N ? d : S.dots[(d.i - N) % N]; d.aT = d.i < N ? map(d.a) : map(p.a) * (1 + (rnd() - 0.5) * 0.28); } } // same place in the after span, near its parent // each one's orbit, near its parent's
    [...S.dots].sort((x, y) => x.aT - y.aT).forEach((d, k) => { d.status = k < REDS ? 'red' : k < REDS + YELLOWS ? 'yellow' : 'green'; }); { const gs = shuffle(S.dots.filter(d => d.status === 'green')), nk = Math.round(M * (1 - Math.min(1, Math.max(0, +(S.params.engagement ?? 0.8))))); gs.slice(0, nk).forEach(d => { d.status = 'grey'; }); } // non-responders stay unknown // closest 80 red, next 320 yellow, the rest green
    S.scenario = scen || (S.params.afterDays === 'tuesday' ? 'tue' : 'mon');
    if (S.scenario === 'tue') { const reds = shuffle(S.dots.filter(d => d.status === 'red')); reds.slice(2).forEach(d => { d.status = 'green'; d.resolved = true; }); }
    placeAfter(S.dots, d => d.aT, (d, a) => { d.aT = a; }); // week 1 + Monday cleared all but 2
    S.phase = 'morph'; S.morphT = 0; S.morphLen = instant ? 2.5 : 5.4; S.inkAlpha = 1; if (S.wc) (S.wc.clearPaint(), S.tqEpoch = (S.tqEpoch || 0) + 1); S.alertOpen = []; S.redOrder = null; S.resolved = []; S.active = null; S.cur = null; S.minute = 0;
    let rk = 0;
    for (const d of S.dots) { d.snoozed = false; d.spawned = false; d.target = 'grey'; d.pendingReveal = false; d.spawnAt = instant ? rnd() * 0.6 : 0; d.budDur = 0; d.budUntil = d.swellUntil = 0; d.parent = d.i < N ? d.i : (d.i - N) % N;
      if (d.status === 'red') { d.cell = rk++; d.strength = 1; d.size = 0.46; } else if (d.resolved) { d.cell = 80 + (d.i % 10); d.strength = 0.4; d.size = 0.3; } else { d.cell = (d.status === 'green' ? 80 : 90) + (d.i % 10); d.strength = 0.4; d.size = 0.3; } }
    if (!instant) { const sj = Array.from({ length: N }, () => 0.2 + rnd() * 0.9), BUD = 1.0; // each before dot buds its 15 others along its own orbit, then they fly to place
      for (const d of S.dots) { const j = d.parent, s0 = sj[j];
        if (d.i < N) d.spawnAt = s0; // the parent takes its new orbit first
        else { const k = Math.floor((d.i - N) / N) + 1; const go = s0 + 0.7; d.spawnAt = go + k * 0.045; d.budDur = go + BUD - d.spawnAt + rnd() * 0.15; /* then its children sprout from where it settled */ } } }
    for (let c = 80; c < 100; c++) S.paintQueue.push({ kind: 'mass', cell: c, slot: c < 90 ? 'green' : 'yellow' });
    S.stainDirty = true;
  };
  const startTuesday = () => { // a week and a day later: the reds are cleared but for two carried over
    S.scenario = 'tue'; S.inkAlpha = 1; for (const d of S.dots) if (d.snoozed) { d.snoozed = false; d.target = d.status; } if (S.wc) (S.wc.clearPaint(), S.tqEpoch = (S.tqEpoch || 0) + 1);
    const open = shuffle(S.dots.filter(d => d.status === 'red' && !d.resolved)), carry = open.slice(0, 2);
    for (const d of S.dots) { d.alert = false; d.today = false; if (d.resolved && d.status === 'red') d.status = 'green'; }
    for (const d of open.slice(2)) { d.status = 'green'; d.resolved = true; d.target = 'green'; d.mode = 'mass'; setMass(d); keepRadius(d, stratA('green')); }
    for (const d of S.dots) if (d.mode === 'mass' && d.status === 'green' && d.resolved) { d.cell = 80 + (d.i % 10); d.strength = 0.4; d.size = 0.3; }
    for (let c = 80; c < 100; c++) S.paintQueue.push({ kind: 'mass', cell: c, slot: c < 90 ? 'green' : 'yellow' });
    for (const d of carry) paint('bloom', d, 'red');
    { const [lo, hi] = rangeOf('a'); placeAfter(S.dots.filter(d => d.mode !== 'hidden'), d => d.a, (d, a) => { if (d.mode === 'band' && d.bandK) { d.bandU = (a - lo) / (hi - lo); fitBand(d); } else if (d.mode === 'mass') keepRadius(d, a); }); } // fewer reds now: the rings close up
    S.stainDirty = true; S.phase = 'after'; S.settleUntil = S.clockReal + 1.8; startDay();
  };
  const spawn = d => {
    d.spawned = true;
    if (d.mode === 'hidden') { const p = S.dots[d.parent]; d.p.copy(p.p); d.v.copy(p.v); d.col.copy(p.col); }
    d.budUntil = d.budDur ? S.clockReal + d.budDur : 0; if (d.budDur) { const k = Math.floor((d.i - N) / N) + 1; d.budStart = S.clockReal; d.budTh = -(0.03 + k * 0.022 + rnd() * 0.02) * Math.sign(S.params.orbitSpeed || 1); /* left behind as it spins */ d.budR = 1 + (rnd() - 0.5) * 0.06; }
    d.target = 'grey'; d.pendingReveal = true; d.revealBy = S.clockReal + 3.5 + (d.budDur || 0);
    const src = S.dots[d.parent], a0 = (src.a || 2) * (d.budDur ? d.budR : 1), th0 = src.theta + (d.budDur ? d.budTh : 0); // settle near where it sprouted
    const a1 = d.aT ?? a0, w0 = src.w || d.w; // carry the parent's spin // stay on the parent's orbit, just spread out a little
    if (d.status === 'red') { d.mode = 'band'; setBand(d, 'b'); const [lo, hi] = bandRange('b'); d.bandU = (a1 - lo) / (hi - lo); fitBand(d); d.hgt = (rnd() - 0.5) * 0.42; }
    else { d.mode = 'mass'; setMass(d); keepRadius(d, a1); d.hgt = (rnd() - 0.5) * 0.42; }
    if (d.budDur) { d.theta = th0; d.w = w0 * (0.93 + rnd() * 0.05); } else if (d.i < N && w0) d.w = w0; // children keep the parent's momentum, only a hair slower so they trail // a touch slower, so they keep falling behind and spread
    S.stainDirty = true;
  };
  let last = '';
  const emit = () => {
    const ph = S.phase === 'before' || S.phase === 'beforeHold' ? 'before' : 'after';
    const onCall = S.phase === 'final' ? 'final' : S.phase === 'morph' ? 'morph' : S.phase.endsWith('Hold') ? 'done' : S.talking ? 'talking' : S.active != null ? 'ringing' : S.minute >= LUNCH[0] && S.minute < LUNCH[1] ? 'lunch' : 'idle';
    let st;
    if (ph === 'before') st = { phase: ph, minute: Math.floor(S.minute), onCall, ...S.counts, log: S.log.map(x => x === 'black' ? 'k' : x[0]).join('') };
    else { const A = S.countsA || { placed: 0, missed: 0, alerts: 0, resolved: 0 }, R = S.redOrder;
      const queue = R ? [...S.alertOpen.map(i => i === S.active ? 'A' : 'a'), ...R.filter(i => !S.dots[i].alert).map(i => i === S.active ? 'R' : 'r'), ...(S.done || [])].join('').slice(0, 100) : '';
      st = { phase: ph, minute: S.phase === 'morph' ? 0 : Math.floor(S.minute), onCall, ...A, open: S.alertOpen.length, redsLeft: R ? R.length : REDS, redsOf: S.redsOf || REDS, scenario: S.scenario, queue, active: S.active ?? -1,
        all: S.dots.map(d => d.mode === 'hidden' ? '-' : d.snoozed ? (d.status === 'yellow' ? 'w' : 'd') : d.alert ? 'a' : d.target === 'red' ? 'r' : d.target === 'yellow' ? 'y' : d.target === 'green' ? (d.today ? 'G' : 'g') : d.target === 'black' ? 'k' : 'u').join('') }; }
    { const c = S.cur, sp = (S.spans || []).slice(); if (c && S.phase !== 'morph') { const now = Math.min(S.minute, c.end), on = c.connectAt != null && S.minute >= c.connectAt, d = S.dots[c.i]; sp.push([c.start, Math.max(c.start, now), !on ? 'c' : S.phase === 'before' ? d.status[0] : c.alert ? 'a' : c.yellow ? 'y' : 'r']); }
      st.spans = S.phase === 'morph' ? '' : sp.map(x => Math.floor(x[0]) + ',' + Math.floor(x[1]) + x[2]).join(' '); }
    const key = JSON.stringify(st); if (key !== last) { last = key; onStats(st); }
  };
  const phaseInk = () => { if (!S.wc) return; const ph = isBefore() ? 'b' : 'a'; if (ph === S.inkPhase) return; S.inkPhase = ph; const p = S.params, aft = ph === 'a'; // before and after each have their own pigment load and glaze dye
    try { S.wc.paintLoad(aft ? (p.pigmentLoadAfter ?? p.pigmentLoad ?? 2.2) : (p.pigmentLoad ?? 2.2)); inkUp(S.wc, C, p, aft ? (p.glazeDyeAfter ?? p.glazeDye) : p.glazeDye); } catch (e) {} };
  S.step = dt => {
    S.clockReal += dt; const P = S.params; phaseInk();
    if ((S.phase === 'before' || S.phase === 'after') && S.clockReal < (S.settleUntil || 0)) { /* let the dots and camera settle before the day starts */ }
    else if (S.phase === 'before' || S.phase === 'after') {
      S.minute = Math.min(DAY, S.minute + dt * DAY / P.daySeconds * (S.minute >= LUNCH[0] && S.minute < LUNCH[1] && S.active == null ? 4 : 1)); // lunch plays 4× faster: an hour that feels like 15 minutes
      if (S.phase === 'after') while (S.alertPlan.length && S.alertPlan[0].t <= S.minute) { const a = S.alertPlan.shift(), d = S.dots[a.i]; if (d.resolved && d.status === 'red') continue;
        if (d.status !== 'red') { d.status = 'red'; d.resolved = false; d.target = 'red'; d.mode = 'band'; setBand(d, 'b'); d.cell = S.freeCells.length ? S.freeCells.shift() : d.cell; d.strength = 1; d.size = 0.46; S.stainDirty = true; S.redOrder.push(a.i); S.redsOf++; S.yellowOrder = S.yellowOrder.filter(x => x !== a.i); paint('bloom', d, 'red'); }
        d.alert = true; toAlertBand(d); d.p.set(Math.cos(d.theta) * d.a, d.hgt, Math.sin(d.theta) * d.a).applyEuler(TILT).add(CENTER); if (d.v) d.v.set(0, 0, 0); d.lx = null; /* teleport straight to the alert orbit by the nurse: no stray trail across the field */ S.alertOpen.push(a.i); S.countsA.alerts++; paint('alert', d); }
      for (let g = 0; g < 20; g++) {
        if (S.cur) { if (S.minute >= S.cur.end) { const c = S.cur; S.cur = null; S.free = c.end + GAP; finishCall(c); continue; } break; }
        if (S.callsDone || S.minute < S.free) break;
        const r = startCall(S.free); if (r === 'empty') { S.free = S.minute + 1; break; } if (r === 'late') { S.callsDone = true; break; }
      }
      const c = S.cur; S.active = c && S.minute >= c.start ? c.i : null; S.talking = !!(c && c.connectAt != null && S.minute >= c.connectAt);
      if (S.minute >= DAY) { S.phase += 'Hold'; S.hold = 0; S.cur = null; S.active = null; S.talking = false; }
    } else if (S.phase === 'beforeHold' || S.phase === 'afterHold') {
      if (S.rest) S.inkAlpha = 1; else { S.hold += dt; S.inkAlpha = c01((P.holdSeconds - S.hold) / 1.5); }
      if (!S.rest && S.hold > P.holdSeconds) { if (S.phase === 'beforeHold') startMorph(false); else if (S.scenario === 'mon' && P.afterDays === 'both') startTuesday(); else newLoop('before'); }
    } else if (S.phase === 'morph') {
      S.morphT += dt; for (const d of S.dots) if (!d.spawned && S.morphT >= d.spawnAt) spawn(d);
      if (S.morphT > S.morphLen) { S.phase = 'after'; S.settleUntil = S.clockReal + 1.6; startDay(); }
    }
    if (S.mode === 'paper' || S.mode === 'trails' || S.mode === 'connect') sheet.style.opacity = S.inkAlpha;
    emit();
  };

  const sheet = document.createElement('div'); stage.appendChild(sheet);
  const glHost = document.createElement('div'); glHost.style.cssText = 'position:absolute;inset:0;z-index:1'; stage.appendChild(glHost);
  newLoop(params.startAt);

  let sheetSeq = 0;
  const makeSheet = async () => {
    const seq = ++sheetSeq;
    if (S.wc) { try { S.wc.destroy(); } catch (e) {} S.wc = null; sheet.innerHTML = ''; }
    S.atlasCanvas = null; S.maskKey = null; S.inkPhase = null; S.mode = S.params.ink; const travel = S.mode === 'travel';
    if (S.mode === 'off') return;
    sheet.style.cssText = travel ? 'position:absolute;left:0;top:0;width:512px;height:512px;opacity:0;z-index:0;pointer-events:none' : 'position:absolute;inset:0;z-index:2;pointer-events:none;' + (S.params.dark ? 'mix-blend-mode:normal' : 'mix-blend-mode:' + (CSS_BLEND[S.params.blend] || 'multiply'));
    const gc = HTMLCanvasElement.prototype.getContext;
    try { const W = await loadWashes(), w = travel ? 512 : stage.clientWidth, ht = travel ? 512 : stage.clientHeight; if (!w || !ht || seq !== sheetSeq) return;
      if (travel) HTMLCanvasElement.prototype.getContext = function (t, o) { return gc.call(this, t, /webgl/.test(t) ? { ...(o || {}), preserveDrawingBuffer: true } : o); };
      const wc = W.create(sheet, { transparent: true, pointer: false, cursorPreview: false, mobile: false, seed: 7, size: { width: w, height: ht }, scale: Math.max(1.25, Math.sqrt(w * ht / 160000)), ...(S.params.dark ? { gouacheMode: true, paperColor: hex01(C.ground) } : { gouacheMode: 'auto', paperColor: hex01(C.paper), pigments: paints(C, S.params.medium, S.params.granulation, S.params.glazeDye) }) });
      wc.maskTint(false); wc.edgeFade(0); wc.gravityStrength(0); wc.edgeMode('closed'); wc.penUp(); applyWash(wc, S.params); wc.pressure(1); wc.run('always'); S.wc = wc;
      if (travel) { const cvs = [...sheet.querySelectorAll('canvas')]; S.atlasCanvas = cvs.sort((a, b) => b.width * b.height - a.width * a.height)[0] || null; }
      if (S.phase !== 'before') for (let c = 80; c < 100; c++) S.paintQueue.push({ kind: 'mass', cell: c, slot: c < 90 ? 'green' : 'yellow' });
    } catch (e) { console.warn('[nurse-orbit] washes unavailable', e); } finally { HTMLCanvasElement.prototype.getContext = gc; }
  };
  makeSheet();
  let rt; const ro = new ResizeObserver(() => { if (S.mode === 'travel') return; clearTimeout(rt); rt = setTimeout(makeSheet, 250); }); ro.observe(stage);

  IMPACT = !!params.impact; STILL = !!params.still; setMix(params); S.sheet = sheet; S.seal = makeSeal(stage); S.seal.setTone(params.sealTone);
  const root = createRoot(glHost);
  root.render(h(Canvas, { camera: { position: [0, 0.35 + 1.3 * S.camMix, 7.2 + 1.7 * S.camMix], fov: 34 }, dpr: [1, 1.5], flat: true, gl: { alpha: false, antialias: true }, scene: { background: bg }, style: { width: '100%', height: '100%' } },
    h(Photo, { before: photoBefore, after: photo, lunch: photoLunch, S }), h(Swarm, { S }), h(Stains, { S })));
  return {
    setPaused(v) { S.paused = !!v; },
    snapCam(v) { S.camMix = +v; }, // land on a day's camera and portrait at once (e.g. a host jumping straight to after: no portrait swap)
    setDotPx(px) { S.dotPx = px; },
    skip() { // run the whole story instantly, then rest on the finished picture: every status known, orbits turning, no calls
      if (S.phase === 'final') return;
      for (let n = 0; n < 60000; n++) { if (S.phase === 'afterHold' && S.scenario === 'tue') break;
        if (S.phase === 'afterHold' && S.scenario === 'mon') { startTuesday(); continue; }
        const wasBefore = S.phase === 'before'; S.step(0.05); if (wasBefore && S.phase !== 'before') emit(); }
      S.phase = 'final'; S.active = null; S.cur = null; S.talking = false; S.paintQueue.length = 0; S.inkAlpha = 1; S.lunchMix = 0; if (S.wc) try { (S.wc.clearPaint(), S.tqEpoch = (S.tqEpoch || 0) + 1); } catch (e) {} emit(); },
    setLabel(t) { if (S.seal) S.seal.setLabel(t); },
    setParams(p) { const prev = S.params; S.params = p; IMPACT = !!p.impact; STILL = !!p.still; setTilt(p); setMix(p); if (['pigmentLoad', 'pigmentLoadAfter', 'glazeDye', 'glazeDyeAfter', 'medium', 'granulation'].some(k => p[k] !== prev[k])) S.inkPhase = null; if (S.seal && p.sealTone !== prev.sealTone) S.seal.setTone(p.sealTone);
      if (['ringMin', 'ringMax', 'ringMinAfter', 'ringMaxAfter'].some(k => p[k] !== prev[k])) { const [o0, o1] = rangeOf('a', prev), [n0, n1] = rangeOf('a', p), aft = !(S.phase === 'before' || S.phase === 'beforeHold');
        for (const d of S.dots) { if (d.mode === 'band' && d.bandK) fitBand(d); else if (aft && d.mode === 'mass') { const na = n0 + (d.a - o0) / (o1 - o0) * (n1 - n0); d.w *= Math.pow(d.a / na, 1.5); d.a = na; } } }
      if (p.dark !== prev.dark && S.mode !== 'travel' && S.mode !== 'off') makeSheet();
      if (['paper', 'rose', 'hansa', 'cerulean', 'dark'].some(k => p[k] !== prev[k])) { tint(p); if (S.wc) inkUp(S.wc, C, p, p.glazeDye); }
      if (p.ink !== prev.ink) makeSheet(); else if ((p.medium !== prev.medium || p.granulation !== prev.granulation || p.glazeDye !== prev.glazeDye) && S.wc) S.inkPhase = null; /* phaseInk re-inks with this phase's dye */ else if (p.ink === 'paper' || p.ink === 'trails' || p.ink === 'connect') sheet.style.mixBlendMode = CSS_BLEND[p.blend] || 'multiply';
      if (S.wc && ['wetness', 'pigmentLoad', 'waterLoad', 'edgeDarkening'].some(k => p[k] !== prev[k])) applyWash(S.wc, p);
      if (p.massShape !== prev.massShape) for (const d of S.dots) if (d.mode === 'mass') setMass(d);
      if (p.startAt !== prev.startAt || p.afterDays !== prev.afterDays) newLoop(p.startAt); },
    restart() { newLoop(S.params.startAt); },
    rest(which) { // fast-forward to the end of one day and stay there: statuses as the day left them, orbits turning, trails still drawing
      const aft = which === 'after' || which === 'tuesday'; newLoop(which === 'tuesday' ? 'tuesday' : aft ? 'after' : 'before'); const goal = aft ? 'afterHold' : 'beforeHold';
      for (let n = 0; n < 60000 && S.phase !== goal; n++) S.step(0.05);
      S.camMix = aft ? 1 : 0; /* land on the day's own camera and portrait at once — no crossfade back from the other day */ S.rest = aft ? 'after' : 'before'; S.restAt = S.clockReal + 2.5; /* let the dots ease onto their orbits before any ink lands */ S.active = null; S.cur = null; S.talking = false; S.paintQueue.length = 0; S.inkAlpha = 1; S.lunchMix = 0;
      for (const d of S.dots) { d.lx = null; if (d.pendingReveal) { d.pendingReveal = false; d.target = d.status; } } S.stainDirty = true; if (S.wc) try { (S.wc.clearPaint(), S.tqEpoch = (S.tqEpoch || 0) + 1); } catch (e) {} emit(); },
    playFrom(at) { // jumping ahead mid-before: finish the before day instantly with the same algorithm so its record is complete
      if (at !== 'before' && S.phase === 'before') { for (let n = 0; n < 60000 && S.phase === 'before'; n++) S.step(0.05); emit(); S.paintQueue.length = 0; }
      newLoop(at); },
    destroy() { ro.disconnect(); clearTimeout(rt); root.unmount(); if (S.wc) try { S.wc.destroy(); } catch (e) {} stage.innerHTML = ''; }
  };
}
