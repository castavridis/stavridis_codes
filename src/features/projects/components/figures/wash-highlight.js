/* Wash highlight → window.WashHighlightFX.attach(el, opts) · a brush of watercolour swept behind a run of text (one stroke per line), left to right; it dries in place.
   opts: pigment 'hansa'|'rose'|'cerulean'|hex · duration ms · delay ms · load 0–2 · height (fraction of line height) · trigger 'view'|'load'|'hover' · onDone */
const WashHighlightFX = (() => {
// The v2 washes engine ships as a classic-script public asset (not the older
// ESM engine in lib/washes that the landing page uses — the figures need v2's
// normalized paint space, localized rewet and per-instance pigments). Loaded
// on demand the first time a wash fires. Both engines assign window.Washes,
// and the landing engine is always loaded first, so never trust the global:
// capture v2 off the script load and put the previous global back.
let lib = null, v2 = null;
const loadWashes = () => v2 ? Promise.resolve(v2) : (lib ||= new Promise((res, rej) => {
  const prevW = window.Washes, prevC = window.Watercolor;
  const s = document.createElement('script'); s.src = (import.meta.env?.BASE_URL ?? '/') + 'vendor/washes.standalone.js';
  s.onload = () => { v2 = window.Washes; window.Washes = prevW; window.Watercolor = prevC; res(v2); };
  s.onerror = () => { lib = null; rej(new Error('washes failed to load')); }; document.head.appendChild(s); }));
const rgba = (() => { let ctx; return css => { if (!css) return null; ctx ||= document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#010203'; ctx.fillStyle = css; if (ctx.fillStyle === '#010203' && css !== '#010203') return null; ctx.clearRect(0, 0, 1, 1); ctx.fillRect(0, 0, 1, 1); const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data; return { r, g, b, a: a / 255 }; }; })();
const hex = c => '#' + [c.r, c.g, c.b].map(v => v.toString(16).padStart(2, '0')).join('');
const cssVar = n => { let v = getComputedStyle(document.documentElement).getPropertyValue(n).trim(); if (/^#[0-9a-f]{8}$/i.test(v)) v = v.slice(0, 7); const c = rgba(v); return c && c.a > 0 ? hex(c) : null; };
const PIGMENT = { rose: '#a50e53', hansa: '--color-washes-hansa-yellow', cerulean: '--color-washes-cerulean-blue' };
const inkOf = n => { if (n === 'rainbow') n = 'hansa'; const v = PIGMENT[n] || n || PIGMENT.hansa; return (v[0] === '#' ? v : cssVar(v)) || '#e3af08'; };
const backdrop = el => { for (let n = el; n && n.nodeType === 1; n = n.parentElement) { const c = rgba(getComputedStyle(n).backgroundColor); if (c && c.a > 0.05) return hex(c); } return cssVar('--color-washes-paper') || '#fbf6ea'; };
const h01 = h => ({ r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255 });
const KM_S = { rose: [0.05, 0.003, 0.03], hansa: [0.5, 0.88, 0.009], cerulean: [0.06, 0.26, 0.4] };
const kmR = (K, S, x, Rbg) => { const a = 1 + K / S, b = Math.sqrt(Math.max(0, a * a - 1)), e = Math.exp(Math.min(12, b * S * x)), d = (a + b) * e - (a - b) / e; if (d < 2e-9) return 0; const Rl = (e - 1 / e) / d, Tl = 2 * b / d; return Math.max(0, Math.min(1, Rl + Tl * Tl * Rbg / (1 - Rl * Rbg))); };
const kmPigment = (color, paper, dye = 0.3) => { const t = h01(color), p = h01(paper), d2 = k => { const c = h01(inkOf(k)); return (c.r - t.r) ** 2 + (c.g - t.g) ** 2 + (c.b - t.b) ** 2; };
  const S = KM_S[['rose', 'hansa', 'cerulean'].sort((a, b) => d2(a) - d2(b))[0]].map(s => Math.pow(s, 1 - dye) * Math.pow(3.3, dye)), K = [0, 0, 0];
  ['r', 'g', 'b'].forEach((c, i) => { const tgt = Math.min(Math.max(0.02, t[c]), p[c] - 0.004); let lo = 0, hi = 80; for (let n = 0; n < 40; n++) { const m = (lo + hi) / 2; if (kmR(m, S[i], 1.3, p[c]) > tgt) lo = m; else hi = m; } K[i] = hi; });
  return { color, K, S, granulation: 0.6 }; };

// highlights that come due together are drawn one at a time, top of the page first, each starting after an uneven pause (a hand moving down the page)
const Q = { list: [], last: -1e9, gap: 0, t: 0 };
const pump = () => { Q.t = 0; Q.list = Q.list.filter(h => !h.dead); if (!Q.list.length) return; const now = performance.now(), wait = Q.last + Q.gap - now; if (wait > 0) { Q.t = setTimeout(pump, wait); return; }
  const at = h => { const r = h.el.getBoundingClientRect(); return [r.top, r.left]; }; Q.list.sort((x, y) => { const p = at(x), q = at(y); return Math.abs(p[0] - q[0]) > 4 ? p[0] - q[0] : p[1] - q[1]; });
  const h = Q.list.shift(); Q.last = now; Q.gap = 220 + Math.random() * 320 + (Math.random() < 0.2 ? 180 : 0); h.t0 = null; h.fire(false, true);
  if (h.o.pigment === 'rainbow' && h.t0 != null) { Q.last = h.t0; Q.gap = 1500 + Math.random() * 400; } /* rainbow waits for the colour cycle's rose stop, so count the pause from when its stroke really starts: the next one lands a cycle later */
  if (Q.list.length) Q.t = setTimeout(pump, Math.max(0, Q.last + Q.gap - now)); };
const queue = h => { if (!Q.list.includes(h)) Q.list.push(h); if (!Q.t) Q.t = setTimeout(pump, 60); }; // short window so highlights arriving in the same moment get sorted together
// a finished wash is swapped for a still copy of its canvas and the simulation is destroyed, so dried paint costs nothing per frame
const freeze = (wc, host) => { try { const cv = host && host.querySelector('canvas'); if (!cv || !cv.width || !cv.height) return false; const c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height; const x = c.getContext('2d'); x.drawImage(cv, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height).data; let any = false; for (let k = 3; k < d.length; k += 16) if (d[k] > 8) { any = true; break; } if (!any) return false;
  const r = cv.getBoundingClientRect(), hr = host.getBoundingClientRect(); c.setAttribute('aria-hidden', 'true'); c.style.cssText = 'position:absolute;pointer-events:none;left:' + (r.left - hr.left) + 'px;top:' + (r.top - hr.top) + 'px;width:' + r.width + 'px;height:' + r.height + 'px;opacity:' + (getComputedStyle(cv).opacity || 1) + ';mix-blend-mode:' + getComputedStyle(cv).mixBlendMode;
  try { wc.destroy(); } catch (e) {} host.replaceChildren(c); return true; } catch (e) { return false; } };
class WashHighlight {
  constructor(el, o) { this.el = el; this.o = Object.assign({ pigment: 'hansa', duration: 1100, delay: 200, load: 1, height: 0.62, trigger: 'view', pad: 11, mark: 'underline', hand: window.WashHighlightHand || 'right' }, o); this.seq = 0; }
  start() {
    const el = this.el; if (getComputedStyle(el).position === 'static') el.style.position = 'relative'; 
    const L = this.layer = document.createElement('span'); L.setAttribute('aria-hidden', 'true'); L.style.cssText = 'position:absolute;left:0;top:0;width:0;height:0;z-index:1;pointer-events:none;mix-blend-mode:multiply'; el.appendChild(L);
    const T = this.o.trigger;
    if (T === 'hover') { this.onEnter = () => this.sweep(); el.addEventListener('pointerenter', this.onEnter); this.build(); }
    else if (T === 'view' && window.IntersectionObserver) { this.io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { this.io.disconnect(); this.build().then(() => this.sweep(this.o.instant)); } }, { threshold: this.o.threshold ?? 0.6 }); this.io.observe(el); }
    else this.build().then(() => this.sweep(this.o.instant));
    if (window.ResizeObserver) { let w0 = 0; this.ro = new ResizeObserver(() => { const w = el.getBoundingClientRect().width; if (w0 && Math.abs(w - w0) > 1 && (this.wc || this.frozen)) { clearTimeout(this.rt); this.rt = setTimeout(() => this.build().then(() => this.sweep(true)), 200); } w0 = w; }); this.ro.observe(el); }
    return this;
  }
  measure() { // the text's line boxes, relative to the layer's containing block
    const el = this.el, cs = getComputedStyle(el), er = cs.display === 'inline' ? (el.getClientRects()[0] || el.getBoundingClientRect()) : el.getBoundingClientRect(), o = { left: er.left + parseFloat(cs.borderLeftWidth), top: er.top + parseFloat(cs.borderTopWidth) }, /* a wrapped inline element's containing block starts at its FIRST line fragment, not its bounding box */ P = this.o.pad, rs = [...this.el.getClientRects()].filter(r => r.width > 1);
    if (!rs.length) return null; const x0 = Math.min(...rs.map(r => r.left)) - P * 2, y0 = Math.min(...rs.map(r => r.top)) - P * 2, x1 = Math.max(...rs.map(r => r.right)) + P * 2, y1 = Math.max(...rs.map(r => r.bottom)) + P * 2;
    return { left: x0 - o.left, top: y0 - o.top, w: x1 - x0, h: y1 - y0, lines: rs.map(r => ({ x0: r.left - x0, x1: r.right - x0, cy: (r.top + r.bottom) / 2 - y0, lh: r.height })) };
  }
  async build() {
    const seq = ++this.seq; this.teardown(); this.frozen = false; const m = this.measure(); if (!m) return; this.m = m;
    const L = this.layer; Object.assign(L.style, { left: m.left + 'px', top: m.top + 'px', width: m.w + 'px', height: m.h + 'px' });
    let W; try { W = await loadWashes(); } catch (e) { console.warn('[wash-highlight]', e.message); return; } if (seq !== this.seq || this.dead) return;
    const paper = backdrop(this.el.parentElement || this.el), S = 1.25, k = Math.max(1, 80 * S / m.h, 120 * S / m.w);
    const host = document.createElement('div'); host.style.cssText = 'position:absolute;inset:0'; L.appendChild(host);
    const wc = this.wc = W.create(host, { transparent: true, pointer: false, cursorPreview: false, mobile: false, seed: 11, size: { width: Math.ceil(m.w * k), height: Math.ceil(m.h * k) }, scale: S, paperColor: h01(paper), pigments: this.o.pigment === 'rainbow' ? ['rose', 'hansa', 'cerulean'].map(k => kmPigment(inkOf(k), paper)) : [0, 1, 2].map(() => kmPigment(inkOf(this.o.pigment), paper)) }); // rainbow: rose → hansa → cerulean along the stroke, mixing wet where they meet
    try { wc.edgeDarkening(true); wc.gravityStrength(0); wc.edgeMode('closed'); wc.edgeFade(Math.min(10, this.o.pad)); } catch (e) {}
    wc.run('until-dry');
  }
  sweep(instant) { // wait out the delay, then re-check the text's bounds right as it fires: rebuild if the lines moved, and hold off while it's off screen
    clearTimeout(this.dt); if (instant) return this.fire(true);
    this.dt = setTimeout(() => { if (this.dead) return; const r = this.el.getBoundingClientRect(), on = r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
      if (!on && window.IntersectionObserver) { if (this.io) this.io.disconnect(); this.io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { this.io.disconnect(); this.o = Object.assign({}, this.o); const d = this.o.delay; this.o.delay = 0; this.sweep(); this.o.delay = d; } }, { threshold: this.o.threshold ?? 0.6 }); this.io.observe(this.el); return; }
      queue(this); }, Math.max(0, this.o.delay || 0)); }
  fire(instant, noDelay) {
    const n = this.measure(), m0 = this.m; if (n && (!m0 || Math.abs(n.w - m0.w) > 1 || Math.abs(n.h - m0.h) > 1 || Math.abs(n.left - m0.left) > 1 || Math.abs(n.top - m0.top) > 1)) { this.build().then(() => this.wc && this.m && this.fire(instant, noDelay)); return; }
    const wc = this.wc, m = this.m; if (!wc || !m) return; cancelAnimationFrame(this.raf); try { wc.clearPaint(); } catch (e) {}
    const O = this.o, ul = O.mark === 'underline', rOf = l => ul ? l.lh * 0.11 * (O.height / 0.62) : l.lh * O.height * 0.5, ov = l => ul ? [rOf(l) * 1.2, rOf(l) * 3.2] : [0, 0], span = l => l.x1 - l.x0 + ov(l)[0] + ov(l)[1], total = m.lines.reduce((s, l) => s + span(l), 0) || 1, mn = Math.min(m.w, m.h), t0 = (() => { const t = performance.now() + (instant || noDelay ? 0 : O.delay); return O.pigment === 'rainbow' && !instant ? t + (2250 - t % 2250) % 2250 : t; })(), dur = instant ? 1 : O.pigment === 'rainbow' ? 1500 : O.duration; // rainbow: start on the cycle's rose stop and take 1.5 s, so the stroke runs rose → yellow → blue end to end
    this.t0 = t0; const seedY = m.lines.map(() => Math.random() * 6.28), tilt = m.lines.map(() => 0.06 + Math.random() * 0.08), bow = m.lines.map(() => (Math.random() - 0.3) * 0.08); let done = 0;
    const rb = O.pigment === 'rainbow', pi = rb ? 'rainbow' : 0; let gpos = 0; const wet = +O.wet || 1; /* wet > 1: a wider wet bed, so neighbouring colours bleed into each other */ const lefty = O.hand === 'left' && ul, hook = O.hand === 'left-hook' && ul; /* left-hook: wrist curled above the line — a small downstroke tick on landing, then an arched swoop (up in the middle), steady pressure, no smudge */ let mx = 0; /* hand: 'left' — still left to right, but PUSHED: light start that builds, skips from nib friction, a slight downhill drift, a hard stop with a blot, and a soft lifted smudge under the first half where the hand trails over the wet stroke */ const droop = m.lines.map(() => 0.05 + Math.random() * 0.05), stut = m.lines.map(() => Math.random() * 6.28); const yL = (i, l, x, len, r) => { const u = x / len; return l.cy + l.lh * 0.42 + droop[i] * l.lh * u + Math.sin(x / (r * 7) + seedY[i]) * r * 0.3 + Math.sin(x / (r * 2.3) + seedY[i] * 3) * r * 0.1 + (u > 0.9 ? Math.pow((u - 0.9) / 0.1, 2) * l.lh * 0.04 : 0); }; const dab = (px, py, r, s) => { wc.rewet(px / m.w, py / m.h, r * 1.8 * wet / mn); wc.paint(px / m.w, py / m.h, r / mn, pi, s); }; // rainbow: the library's own brush — it blends rose → yellow → blue smoothly over time (750 ms per stop)
    const tick = t => { if (this.dead || this.wc !== wc) return; const f = Math.max(0, Math.min(1, (t - t0) / dur)), e = ul ? f * f * (3 - 2 * f) * 0.35 + (1 - Math.pow(1 - f, 2.6)) * 0.65 : 1 - Math.pow(1 - f, 2.2), upto = e * total;
      wc.pigment(rb ? 'rainbow' : 0); wc.paintLoad((ul ? 2.4 : 1.6) * O.load); wc.waterLoad(1.2 * wet); wc.pressure(0.85);
      let acc = 0; m.lines.forEach((l, i) => { const len = span(l), a = Math.max(0, Math.min(len, done - acc)), b = Math.max(0, Math.min(len, upto - acc)); acc += len; if (b <= a) return;
        const r = rOf(l), step = Math.max(1.2, r * 0.3), [o0] = ov(l);
        if (!ul) { const cy = l.cy + r * 0.12; for (let x = a; x <= b; x += step) { gpos = acc - len + x; const w = Math.sin(x / (r * 3.2) + seedY[i]) * r * 0.12, taper = Math.min(1, (x + r * 0.6) / (r * 1.6), (len - x + r * 0.6) / (r * 1.6));
          dab(l.x0 + x, cy + w, r * (0.75 + 0.25 * taper) * (0.9 + Math.random() * 0.2), (0.55 * taper + 0.15) * Math.min(1.5, O.load)); } return; }
        // a quick pen stroke: lands just left of the words with a blot, rises slightly to the right, sags or arcs a little, wavers, and flicks off past the end, thinning as it lifts
        const base = l.cy + l.lh * 0.42, lh = l.lh;
        if (hook) { for (let x = a; x <= b; x += step) { gpos = acc - len + x; const u = x / len, px = l.x0 - o0 + x,
            y = base - Math.sin(Math.PI * u) * lh * (0.28 + bow[i]) * 0.33 + Math.sin(x / (r * 7) + seedY[i]) * r * 0.25 + Math.sin(x / (r * 2.3) + seedY[i] * 3) * r * 0.08,
            press = (0.92 + 0.08 * Math.sin(u * 6 + seedY[i])) * (u > 0.9 ? Math.max(0.55, 1 - (u - 0.9) / 0.1 * 0.45) : 1);
            if (x === a && a === 0) for (let k = 2; k >= 1; k--) dab(px - r * 0.08 * k, y - r * 0.45 * k, r * (0.45 + 0.1 * (2 - k)), 0.55 * Math.min(1.5, O.load)); /* the entry tick, coming down from above */
            dab(px, y, r * press * (0.94 + Math.random() * 0.12), Math.min(1, 1.45 * press * Math.min(1.5, O.load))); } return; }
        if (lefty) { for (let x = a; x <= b; x += step) { gpos = acc - len + x; const u = x / len, px = l.x0 - o0 + x, y = yL(i, l, x, len, r),
            skip = Math.sin(x / (r * 1.7) + stut[i] * 5) * Math.sin(x / (r * 4.1) + stut[i]) > 0.8 || Math.random() < 0.025; const caught = skip && u > 0.08 && u < 0.88; /* friction: the pushed nib catches and stalls — pigment pools there instead of leaving a gap */
            const build = 0.5 + 0.5 * Math.min(1, u / 0.3), stop = u > 0.9 ? 1 + (u - 0.9) / 0.1 * 0.45 : 1, press = (0.88 + 0.12 * Math.sin(u * 7 + seedY[i])) * build * stop;
            dab(px, y, r * press * (caught ? 1.12 : 1) * (0.92 + Math.random() * 0.16), Math.min(1, 1.5 * press * (caught ? 1.45 : 1) * Math.min(1.5, O.load))); } return; }
        for (let x = a; x <= b; x += step) { gpos = acc - len + x; const u = x / len, px = l.x0 - o0 + x,
            y = base - tilt[i] * lh * u + bow[i] * lh * Math.sin(Math.PI * u) + Math.sin(x / (r * 7) + seedY[i]) * r * 0.35 + Math.sin(x / (r * 2.3) + seedY[i] * 3) * r * 0.1 - (u > 0.86 ? Math.pow((u - 0.86) / 0.14, 2) * lh * 0.16 : 0),
            land = u < 0.04 ? 1.25 - u * 6 : 1, lift = u > 0.84 ? Math.max(0.4, 1 - Math.pow((u - 0.84) / 0.16, 1.6) * 0.6) : 1, press = (0.85 + 0.15 * Math.sin(u * 9 + seedY[i])) * land * lift;
          dab(px, y, r * press * (0.92 + Math.random() * 0.16), Math.min(1, 1.6 * press * Math.min(1.5, O.load))); } });
      done = upto; if (f < 1) this.raf = requestAnimationFrame(tick); else { if (lefty && !instant) try { wc.penUp(); m.lines.forEach((l, i) => { const r = rOf(l), len = span(l), [o0] = ov(l); for (let x = r; x < len * 0.55; x += r * 0.7) { const px = l.x0 - o0 + x, y = yL(i, l, x, len, r) + r * 1.5; wc.paint(px / m.w, y / m.h, r * 1.3 / mn, 'lift', 0.22 * (1 - x / (len * 0.55))); } }); } catch (e) {} /* the side of the hand drags through the wet first half */ wc.penUp(); if (O.instantDry) { const dry = () => { if (this.wc === wc) try { wc.dry(); } catch (e) {} if (O.trigger !== 'hover') setTimeout(() => { if (this.wc === wc && !this.dead && freeze(wc, this.layer.firstElementChild)) { this.wc = null; this.frozen = true; } }, 400); }; if (instant) setTimeout(dry, 180); else dry(); } if (O.onDone) O.onDone(); } };
    this.raf = requestAnimationFrame(tick);
  }
  setParams(o) { const p = this.o; this.o = Object.assign({}, p, o); if (o.pigment !== p.pigment || o.pad !== p.pad) this.build().then(() => this.sweep(true)); }
  teardown() { cancelAnimationFrame(this.raf); try { if (this.wc) this.wc.destroy(); } catch (e) {} this.wc = null; if (this.layer) this.layer.replaceChildren(); }
  destroy() { this.dead = true; clearTimeout(this.dt); this.seq++; if (this.io) this.io.disconnect(); if (this.ro) this.ro.disconnect(); clearTimeout(this.rt); if (this.onEnter) this.el.removeEventListener('pointerenter', this.onEnter); this.teardown(); if (this.layer) this.layer.remove(); }
}

// Wash swipe → WashHighlightFX.swipe(el, opts): one loaded brush stroke dragged across el (left to right), clipped to it; pressure shapes both the width and the pigment laid down.
// opts: gravity (0–0.25) · gravityAngle (deg, 0 = right, 90 = down) · pigment · load · width (brush, × el height) · duration ms · pressure · variation · landing (blot) · lift (taper share) · runOut (pigment fading along the stroke) · x0 y0 s0 / x1 y1 s1 (start/end zones: centre in card fractions, spread in card heights) · arc · spatter · trigger 'view'|'load'|'hover' · delay · threshold · dryAfter ms · paper
const SW_DEF = { pigment: 'rose', load: 2.6, width: 0.42, duration: 750, pressure: 1, variation: 0.35, landing: 0.3, lift: 0.2, runOut: 0.3, arc: 0.1, rise: -0.12, y: 0.55, spatter: true, trigger: 'view', delay: 0, threshold: 0.5, dryAfter: 3500, passes: 16, gravity: 0.08, gravityAngle: 0 };
class WashSwipe {
  constructor(el, o) { this.el = el; this.o = Object.assign({}, SW_DEF, o); this.seq = 0; }
  start() { const O = this.o, tgt = this.el.parentElement || this.el; if (getComputedStyle(this.el).position === 'static') this.el.style.position = 'relative';
    if (O.trigger === 'hover') { this.onEnter = () => this.fire(); tgt.addEventListener('pointerenter', this.onEnter); }
    else if (O.trigger === 'view' && window.IntersectionObserver) { this.io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { this.io.disconnect(); this.io = null; this.dt = setTimeout(() => queue(this), O.delay || 0); } }, { threshold: O.threshold }); this.io.observe(tgt); }
    else this.dt = setTimeout(() => queue(this), O.delay || 0);
    return this; }
  async fire() { const seq = ++this.seq; this.teardown(); const el = this.el, r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
    let W; try { W = await loadWashes(); } catch (e) { return; } if (seq !== this.seq || this.dead) return;
    const O = this.o, paper = O.paper || backdrop(el), host = this.host = document.createElement('div'); host.style.cssText = 'position:absolute;inset:0;pointer-events:none'; el.appendChild(host);
    const k = Math.max(1, 160 / r.height) * 0.5, asp = r.width / r.height;
    const wc = this.wc = W.create(host, { transparent: true, pointer: false, cursorPreview: false, mobile: false, seed: O.seed ?? (7 + Math.floor(Math.random() * 90)), size: { width: Math.ceil(r.width * k), height: Math.ceil(r.height * k) }, scale: 1.25, paperColor: h01(paper), pigments: [0, 1, 2].map(() => kmPigment(inkOf(O.pigment), paper)) });
    try { wc.edgeDarkening(true); wc.edgeFade(0); if (O.gravity > 0) { wc.edgeMode('closed-gravity'); wc.gravityDirection(+O.gravityAngle || 0); wc.gravityStrength(+O.gravity); } else { wc.gravityStrength(0); wc.edgeMode('closed'); } } catch (e) {} wc.run('until-dry'); // gravity: the wet wash runs downhill (0° = to the right) and pools against the card's edge
    const still = O.instant || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches), N = 60, dur = still ? 1 : O.duration, t0 = performance.now() + 60, ph = [Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28];
    const gs = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5, sx = r.height / r.width; // start and end are zones, not points: each run samples a fresh spot (roughly normal, spread in card heights)
    const X0 = (O.x0 ?? -0.04) + gs() * (O.s0 || 0) * sx, Y0 = (O.y0 ?? O.y) + gs() * (O.s0 || 0), X1 = (O.x1 ?? 1.04) + gs() * (O.s1 || 0) * sx, Y1 = (O.y1 ?? (O.y + O.rise)) + gs() * (O.s1 || 0), dir = Math.sign(X1 - X0) || 1; // the arc bows the stroke up (positive) or down
    const PP = Array.isArray(O.path) && O.path.length >= 2 ? O.path : null, dir2 = PP ? (Math.sign(PP[PP.length - 1].x - PP[0].x) || 1) : dir; // path: [{x,y}…] in card fractions — a smooth (Catmull-Rom) stroke through every point, start → end
    const cr = u => { const n = PP.length - 1, f = Math.min(n - 1e-6, Math.max(0, u * n)), i = Math.floor(f), t = f - i, A = PP[Math.max(0, i - 1)], B = PP[i], C = PP[i + 1], D = PP[Math.min(n, i + 2)], c = (a, b, c2, d) => 0.5 * (2 * b + (-a + c2) * t + (2 * a - 5 * b + 4 * c2 - d) * t * t + (-a + 3 * b - 3 * c2 + d) * t * t * t); return { x: c(A.x, B.x, C.x, D.x), y: c(A.y, B.y, C.y, D.y) }; };
    const at = PP ? u => { const q = cr(u); return { x: q.x, y: q.y - O.arc * Math.sin(Math.PI * u) + Math.sin(u * 11 + ph[2]) * 0.012 }; } : u => ({ x: X0 + (X1 - X0) * u, y: Y0 + (Y1 - Y0) * u - O.arc * Math.sin(Math.PI * u) + Math.sin(u * 11 + ph[2]) * 0.012 });
    // a hand's pressure: presses down on landing (a blot), wavers while it travels, eases as the brush runs dry, and lifts off at the end
    const press = u => { const land = 1 + O.landing * Math.max(0, 1 - u / 0.07), wav = 1 + O.variation * 0.5 * (0.6 * Math.sin(u * 7 + ph[0]) + 0.4 * Math.sin(u * 17 + ph[1])), run = 1 - O.runOut * u, L = Math.max(0.01, O.lift), lift = u > 1 - L ? Math.max(0.12, 1 - Math.pow((u - (1 - L)) / L, 1.3)) : 1; return Math.max(0.05, O.pressure * land * wav * run * lift); };
    let done = 0, extra = 0;
    const tick = now => { if (this.dead || this.wc !== wc) return; const f = Math.max(0, Math.min(1, (now - t0) / dur)), e = 1 - Math.pow(1 - f, 1.8), upto = Math.round(e * N);
      try { wc.pigment(0); wc.paintLoad(O.load); wc.waterLoad(1.3);
        for (let s = 0; s < upto; s++) { const u = s / N, p = at(u), pr = press(u), hy = O.width * Math.pow(pr, 0.7) * (0.92 + Math.random() * 0.16), rx = hy / asp; wc.pressure(Math.min(1, pr)); if (s >= done) wc.rewet(p.x, p.y, rx * 1.6); wc.paint(p.x, p.y, rx, 0, Math.min(1, pr)); } } catch (e) {}
      done = upto; if (f < 1 || ++extra < O.passes) { this.raf = requestAnimationFrame(tick); return; }
      try { if (O.spatter) { const p = at(0.97); wc.splash([{ x: p.x - 0.03 * dir2, y: p.y, radius: 0.5 / asp, velocity: 5 }], 'bigSplash'); } wc.penUp(); } catch (e) {}
      this.ft = setTimeout(() => { if (this.wc !== wc || this.dead) return; try { wc.dry(); } catch (e) {} setTimeout(() => { if (this.wc === wc && !this.dead && freeze(wc, host)) this.wc = null; }, 400); }, O.dryAfter); };
    this.raf = requestAnimationFrame(tick); }
  setParams(o) { this.o = Object.assign({}, this.o, o); this.fire(); } // tweaking replays the stroke
  teardown() { cancelAnimationFrame(this.raf); clearTimeout(this.ft); try { if (this.wc) this.wc.destroy(); } catch (e) {} this.wc = null; if (this.host) this.host.remove(); this.host = null; }
  destroy() { this.dead = true; clearTimeout(this.dt); this.seq++; if (this.io) this.io.disconnect(); if (this.onEnter) (this.el.parentElement || this.el).removeEventListener('pointerenter', this.onEnter); this.teardown(); }
}
const FX = { attach: (el, o) => new WashHighlight(el, o).start(), swipe: (el, o) => new WashSwipe(el, o).start(), WashHighlight, WashSwipe, loadWashes, freeze, kmPigment, inkOf, backdrop, h01 };
window.WashHighlightFX = FX;
return FX;
})();
export default WashHighlightFX;
