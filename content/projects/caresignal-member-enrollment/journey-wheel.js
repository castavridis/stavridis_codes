// Figure 1 engine: the six-week enrollment journey as a watercolour wheel,
// with cohort 1's cumulative enrollment charted on the same calendar.
//
// Ported from the design's figure-1/index.html (Claude Design export,
// tmp/enrollment-case-study), as embedded in its case study: the figure
// paints its finished state once it scrolls into view (`drawStill`). The
// design's step-by-step sequencer only ran from a Replay pill that the
// embedded copy hides, so it isn't ported.
//
// Changes from the design, all for running inside the site:
// - The vendored Washes.js is replaced by the site's own engine
//   (`WashHighlightFX.loadWashes`, which also registers the sims for the
//   site's GPU pause), and its private Kubelka–Munk helper by the shared
//   `kmPigment` (same maths; `glaze` is its `dye`).
// - Lookups are scoped to the figure root (no document.getElementById);
//   SVG ids are prefixed `wh-`.
// - Escape closes the open popover without also closing the case-study
//   sheet (capture + stopImmediatePropagation, as AssumptionsModal does).
// - Everything it adds (listeners, observers, sims) is torn down by the
//   returned `destroy()`.

import WashHighlightFX from '../../../src/features/projects/components/figures/wash-highlight';

const NS = 'http://www.w3.org/2000/svg';

// Geometry (720-unit wheel).
const S = 720, C = 360, R_PHOTO = 112, R_IN = 128, R_OUT = 176;
// Lowest cost per touch at the centre (text), highest at the edge (call).
const CH = [{ name: 'Text', r: 206 }, { name: 'Email', r: 234 }, { name: 'Mail', r: 262 }, { name: 'Call', r: 290 }];
const R_WEEK = 303, R_PHASE = 336, GAP = 18;
// Weeks 0–5 for phases 1–3, then a pause (drawn as one unit; it ran 1–4
// weeks), then phase 4.
const PAUSE_AT = 5, PAUSE = 1, TOTAL = 7;

const COLOR = { '--p1': '#f9ac31', '--p2': '#f06a41', '--p3': '#79b315', '--p4': '#457cbb' };
const PAPER = '#fdfbf5';

// A primary triad on the brush: 0 lemon, 1 red, 2 blue. Phase 1's
// yellow-orange and phase 3's green are mixed on the paper.
const GREEN = [[0, 1], [2, 0.38]];
const AMBER = [[0, 1], [1, 0.16]];
const PHASES = [
	{ n: 1, weeks: 2, title: 'Introducing enhanced care', color: '--p1', mix: AMBER },
	{ n: 2, weeks: 2, title: 'Need more information?', color: '--p2', mix: [[1, 1]] },
	{ n: 3, weeks: 1, title: 'Last chance to enroll', color: '--p3', mix: GREEN },
	{ n: 4, weeks: 1, title: 'We saved you a spot', color: '--p4', mix: [[2, 1]] },
];
const TP = [
	['Mail', 0.45, 'Formal invitation'], ['Mail', 1.5, 'Condition letter'], ['Mail', 4.5, 'Reminder postcard'],
	['Email', 0.5, 'Email 1'], ['Email', 1.55, 'Email 2'], ['Email', 2.4, 'Email 3'], ['Email', 4.25, 'Email 4'], ['Email', 4.8, 'Email 5'],
	['Call', 2.95, 'First agent call'], ['Call', 4.5, 'Agent call'], ['Call', 6.2, 'Agent call'], ['Call', 6.82, 'Final agent call'],
	['Text', 1.05, 'Text 1'], ['Text', 3.45, 'Text 2'], ['Text', 4.55, 'Text 3'], ['Text', 6.5, 'Text 4'],
];
// Why each phase existed: the barrier it answers and the behavioural
// science behind it (from the strategy deck and copy drafts).
const PH_INFO = [
	{ answers: 'Answers obstacle 1: happiness with existing resources (42.1% of past declines)',
		pts: ['Framed as an enhancement to benefits members already have (“part of your plan benefits”), so joining adds to their care instead of replacing it.',
			'A letter from the plan’s physician leader, the plan’s brand, and one program name on every touchpoint, so it reads as their plan, not a stranger.',
			'Free, nothing to download, and no new passwords, with each member’s code built into every touchpoint.'],
		tech: 'Additive framing · Trusted messenger · Familiarity · Less friction' },
	{ answers: 'Answers obstacle 2: belief their condition is not an issue (10.0% of past declines)',
		pts: ['A condition-specific letter connects the program to what members already live with, like trouble breathing and not being sure it’s an issue.',
			'Testimonials from members with the same conditions answer “Why should I believe it?”',
			'The first agent calls begin, so members can ask questions of a person.'],
		tech: 'Personal relevance · Social proof · Conversation, not broadcast' },
	{ answers: 'Answers obstacle 3: desire to speak with a spouse or doctor first (7.7% of past declines)',
		pts: ['A reminder postcard with a clear deadline (“Space is limited. Enroll by…”) gives the household something to discuss and a date to decide by.',
			'One-pagers at provider offices meant doctors could answer when members asked.',
			'Agent calls ran into the evening, until 6:30 pm, when family was more likely home.'],
		tech: 'Deadlines · Scarcity · Involving trusted others' },
	{ answers: 'Reaches obstacle 4: hard-to-reach members who could take eight or more calls',
		pts: ['After one to four weeks of silence, the message framed a spot as already held for them, for members who had just missed the deadline.',
			'Most of the phase’s touches are agent calls, to reach people who hadn’t picked up.',
			'Capped at five call rounds, with a pause, so persistence never turned into pressure.'],
		tech: 'Endowment framing (loss aversion) · A fresh start after a pause · Respectful persistence' },
];
// Cohort 1's cumulative enrollment after weeks 1–5.
const WK = [6.1, 12.3, 16.1, 19.2, 21.2];

const phaseOfWeek = w => w < 2 ? 0 : w < 4 ? 1 : w < PAUSE_AT ? 2 : 3;
const pt = (deg, r) => { const a = (deg - 90) * Math.PI / 180; return [C + r * Math.cos(a), C + r * Math.sin(a)]; };
const weekDeg = w => GAP / 2 + (w / TOTAL) * (360 - GAP);
const arcPath = (d0, d1, r, ccw) => { const [x0, y0] = pt(d0, r), [x1, y1] = pt(d1, r), la = d1 - d0 > 180 ? 1 : 0;
	return ccw ? `M${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 ${la} 0 ${x0.toFixed(1)} ${y0.toFixed(1)}` : `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 ${la} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`; };
const h01 = hex => ({ r: parseInt(hex.slice(1, 3), 16) / 255, g: parseInt(hex.slice(3, 5), 16) / 255, b: parseInt(hex.slice(5, 7), 16) / 255 });

/**
 * Mount the figure's behaviour on its rendered markup (JourneyWheel.tsx).
 * @param {HTMLElement} root the .wh wrapper
 * @param {{ linda: string }} opts
 * @returns {() => void} destroy
 */
export function mountJourneyWheel(root, { linda }) {
	const q = sel => root.querySelector(sel);
	const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
	const cleanups = [];
	const listen = (target, type, fn, opts) => { target.addEventListener(type, fn, opts); cleanups.push(() => target.removeEventListener(type, fn, opts)); };
	let dead = false;

	// ---------- Wheel SVG ----------
	const svg = q('.wh-svg');
	const el = (tag, attrs = {}, parent = svg) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };
	const defs = el('defs');
	const clip = el('clipPath', { id: 'wh-photoClip' }, defs); el('circle', { cx: C, cy: C, r: R_PHOTO }, clip);
	const f = el('filter', { id: 'wh-wc', x: '-10%', y: '-10%', width: '120%', height: '120%' }, defs);
	el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.035', numOctaves: '3', seed: '4', result: 'n' }, f);
	el('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: '9' }, f);
	const gTrack = el('g');
	el('circle', { class: 'track', cx: C, cy: C, r: R_IN }, gTrack); el('circle', { class: 'track', cx: C, cy: C, r: R_OUT }, gTrack);
	// Flat rings: shown without the sim, and as the print version (WebGL
	// canvases often print blank).
	const gFallback = el('g', { filter: 'url(#wh-wc)', opacity: '0.62' });
	const gDim = el('g', {}); // paper veils that dim unfocused phases on the ring
	const gStage2 = el('g', { class: 'layer' });
	const gPhoto = el('g');
	el('image', { href: linda, x: C - R_PHOTO, y: C - R_PHOTO, width: R_PHOTO * 2, height: R_PHOTO * 2, 'clip-path': 'url(#wh-photoClip)', preserveAspectRatio: 'xMidYMid slice' }, gPhoto);
	el('circle', { class: 'photo-ring', cx: C, cy: C, r: R_PHOTO + 3 }, gPhoto);

	CH.forEach(ch => { el('path', { class: 'chan', d: arcPath(weekDeg(0) - 2, weekDeg(TOTAL) + 2, ch.r) }, gStage2);
		const [lx, ly] = pt(0, ch.r); const t = el('text', { class: 'chan-label', x: lx, y: ly + 4, 'text-anchor': 'middle' }, gStage2); t.textContent = ch.name; });
	{ const [cx0, cy0] = pt(0, 312); const t = el('text', { class: 'chan-label', x: cx0, y: cy0 + 4, 'text-anchor': 'middle' }, gStage2); t.textContent = 'COST ↑'; }
	// Labels that follow the curve of their arc, flipped on the lower half so
	// they read left to right.
	const curveText = (d0, d1, r, txt, cls, idp) => { const mid = (d0 + d1) / 2, flip = mid > 100 && mid < 255; el('path', { id: idp, d: arcPath(d0, d1, flip ? r + 4 : r, flip), fill: 'none' }, defs); const t = el('text', { class: cls }, gStage2), tp = el('textPath', { href: '#' + idp, startOffset: '50%', 'text-anchor': 'middle' }, t); tp.textContent = txt; return t; };
	for (let w = 0; w <= TOTAL; w++) { const d = weekDeg(w); const [a, b] = pt(d, R_OUT + 6), [c2, d2] = pt(d, R_WEEK - 10); el('line', { class: 'tick', x1: a, y1: b, x2: c2, y2: d2, 'stroke-dasharray': '1 4' }, gStage2);
		// week 5 shifts toward its start: phase 3's title is centred on that week
		if (w < PAUSE_AT) curveText(weekDeg(w) + 1, weekDeg(w + (w === PAUSE_AT - 1 ? 0.45 : 1)) - 1, R_WEEK, 'WK ' + (w + 1), 'wk', 'wh-wkp' + w); }
	curveText(weekDeg(PAUSE_AT) + 1, weekDeg(PAUSE_AT + PAUSE) - 1, R_WEEK, 'PAUSE · 1–4 WKS', 'wk', 'wh-wkpz');
	let w0 = 0;
	const phases = PHASES.map((p, i) => {
		if (i === 3) w0 += PAUSE;
		const P = { ...p, w0 }, d0 = weekDeg(w0), d1 = weekDeg(w0 + p.weeks); P.d0 = d0; P.d1 = d1; w0 += p.weeks;
		const mid = (d0 + d1) / 2, flip = mid > 100 && mid < 255, id = 'wh-pp' + i;
		// the title outside the ring; "PHASE n" on the outer edge
		el('path', { id: id + 't', d: arcPath(d0 + 1, d1 - 1, flip ? R_PHASE - 6 : R_PHASE - 13, flip), fill: 'none' }, defs);
		el('path', { id: id + 'k', d: arcPath(d0 + 1, d1 - 1, flip ? R_PHASE + 16 : R_PHASE + 10, flip), fill: 'none' }, defs);
		const tg = el('g', {}, gStage2); P.tEl = tg; tg.style.transition = 'opacity .25s'; tg.style.cursor = 'default';
		const tk = el('text', { class: 'phase-k' }, tg), tpk = el('textPath', { href: '#' + id + 'k', startOffset: '50%', 'text-anchor': 'middle' }, tk);
		const dot = el('tspan', {}, tpk); dot.textContent = '● '; dot.style.fill = COLOR[p.color]; const k = el('tspan', {}, tpk); k.textContent = 'PHASE ' + p.n;
		const tt = el('text', { class: 'phase-title2' }, tg), tpt = el('textPath', { href: '#' + id + 't', startOffset: '50%', 'text-anchor': 'middle' }, tt); tpt.textContent = p.title;
		return P;
	});

	// ---------- Popovers ----------
	const stage = q('.stage'), php = q('.phpop'), tip = q('.tip');
	const info = q('.info'), pop = q('.pop.src');
	const persona = q('.persona'), ppop = q('.ppop');
	const phBtns = [];
	let openI = -1;
	const closePh = () => { php.hidden = true; openI = -1; phBtns.forEach(b => b.setAttribute('aria-expanded', 'false')); focusPhase(null); };
	const setPop = (btn, panel, open) => { panel.hidden = !open; btn.setAttribute('aria-expanded', String(open)); };
	// Each phase's info button sits just past the end of its title, on its line.
	const placePh = () => phases.forEach((p, i) => {
		const tt = p.tEl && p.tEl.querySelector('.phase-title2'); let len = 170; try { len = tt.getComputedTextLength() || len; } catch (e) { /* not laid out */ }
		const mid = (p.d0 + p.d1) / 2, nm = ((mid % 360) + 360) % 360, flip = nm > 100 && nm < 255, r = flip ? R_PHASE - 13 : R_PHASE - 7;
		const sc = (stage.clientWidth || S) / S, pad = (phBtns[i].offsetWidth || 18) / 2 / sc + 6;
		const off = ((len / 2 + pad) / r) * 180 / Math.PI * (flip ? -1 : 1), [x, y] = pt(mid + off, r);
		phBtns[i].style.left = (x / S * 100) + '%'; phBtns[i].style.top = (y / S * 100) + '%';
		phBtns[i].style.transform = 'translate(-50%,-50%) rotate(' + ((mid + off) - (flip ? 180 : 0)).toFixed(1) + 'deg)'; });
	phases.forEach((p, i) => {
		const b = document.createElement('button'); b.type = 'button'; b.className = 'phinfo'; b.textContent = 'i'; phBtns[i] = b;
		b.setAttribute('aria-label', 'Why phase ' + p.n + ', ' + p.title); b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-controls', php.id);
		b.addEventListener('click', e => { e.stopPropagation(); if (openI === i) { closePh(); return; }
			const d = PH_INFO[i];
			php.replaceChildren();
			const h = document.createElement('b'); h.textContent = 'Phase ' + p.n + ' · ' + p.title;
			const st = document.createElement('p'); st.className = 'pstat'; st.textContent = d.answers;
			const ul = document.createElement('ul'); d.pts.forEach(t => { const li = document.createElement('li'); li.textContent = t; ul.appendChild(li); });
			const tc = document.createElement('p'); tc.className = 'ptech'; tc.textContent = d.tech;
			php.append(h, st, ul, tc);
			setPop(info, pop, false); setPop(persona, ppop, false);
			phBtns.forEach(x2 => x2.setAttribute('aria-expanded', 'false')); b.setAttribute('aria-expanded', 'true');
			php.hidden = false; openI = i; focusPhase(i); });
		stage.appendChild(b); });
	placePh();
	if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!dead) placePh(); });
	listen(window, 'resize', placePh);

	listen(info, 'click', () => { const open = pop.hidden; setPop(persona, ppop, false); if (!php.hidden) closePh(); setPop(info, pop, open); });
	listen(persona, 'click', e => { e.stopPropagation(); const open = ppop.hidden; setPop(info, pop, false); if (!php.hidden) closePh(); setPop(persona, ppop, open); });
	listen(document, 'click', e => {
		if (!php.hidden && !php.contains(e.target)) closePh();
		if (!ppop.hidden && !ppop.contains(e.target) && e.target !== persona) setPop(persona, ppop, false);
	});
	// Capture + stop: the sheet overlay also closes on Escape (on window).
	listen(window, 'keydown', e => {
		if (e.key !== 'Escape') return;
		let handled = false;
		if (!php.hidden) { const b = phBtns[openI]; closePh(); if (b) b.focus(); handled = true; }
		if (!pop.hidden) { setPop(info, pop, false); info.focus(); handled = true; }
		if (!ppop.hidden) { setPop(persona, ppop, false); persona.focus(); handled = true; }
		if (handled) e.stopImmediatePropagation();
	}, true);

	// ---------- Touchpoints ----------
	const tps = TP.map(([chName, w, name]) => {
		const ch = CH.find(c => c.name === chName), d = weekDeg(w), phIdx = phaseOfWeek(w), ph = phases[phIdx], col = COLOR[ph.color];
		const g = el('g', { class: 'tp', tabindex: '0', role: 'img', 'aria-label': `${name}, ${chName.toLowerCase()}, week ${Math.floor(w) + 1}` }, gStage2);
		const [sx, sy] = pt(d, R_OUT + 2), [ex, ey] = pt(d, ch.r - 8);
		const spoke = el('line', { class: 'spoke', x1: sx, y1: sy, x2: ex, y2: ey, stroke: col }, g);
		const len = Math.hypot(ex - sx, ey - sy); spoke.style.strokeDasharray = len; spoke.style.strokeDashoffset = len; spoke.style.transition = 'stroke-dashoffset .5s ease-out, opacity .25s';
		const [cx, cy] = pt(d, ch.r);
		const fb = el('circle', { class: 'dotf', cx, cy, r: 7, fill: col, filter: 'url(#wh-wc)', opacity: 0 }, g); // used only without the sim
		el('circle', { class: 'ring', cx, cy, r: 11 }, g); const hit = el('circle', { class: 'hit', cx, cy, r: 13 }, g);
		const show = () => { const sr = stage.getBoundingClientRect(); tip.textContent = `${name} · ${chName} · ${w >= PAUSE_AT + PAUSE ? 'After the pause' : 'Week ' + (Math.floor(w) + 1)}`; tip.style.left = (cx / S * sr.width) + 'px'; tip.style.top = (cy / S * sr.height) + 'px'; tip.classList.add('on'); };
		const hide = () => tip.classList.remove('on');
		g.addEventListener('mouseenter', () => { show(); focusPhase(phIdx); }); g.addEventListener('mouseleave', () => { focusPhase(null); hide(); }); g.addEventListener('focus', show); g.addEventListener('blur', hide);
		const veil = el('circle', { cx, cy, r: 10, fill: 'var(--paper)', opacity: 0 }, g); veil.style.transition = 'opacity .25s';
		g.appendChild(hit);
		return { g, spoke, d, cx, cy, mix: ph.mix, fb, phIdx, veil };
	});
	svg.appendChild(gPhoto);
	phases.forEach((p, i) => {
		const v = el('path', { d: arcPath(p.d0 - (i === 0 ? GAP / 2 : 1.5), p.d1 + (i === phases.length - 1 ? GAP / 2 : 1.5), (R_IN + R_OUT) / 2), fill: 'none', stroke: 'var(--paper)', 'stroke-width': R_OUT - R_IN + 2, opacity: 0 }, gDim); v.style.transition = 'opacity .25s'; p.veil = v;
		const h = el('path', { d: arcPath(p.d0 + 0.6, p.d1 - 0.6, (R_IN + R_OUT) / 2), fill: 'none', stroke: 'transparent', 'stroke-width': R_OUT - R_IN, 'pointer-events': 'stroke' }, gStage2);
		[h, p.tEl].forEach(n => { n.addEventListener('mouseenter', () => focusPhase(i)); n.addEventListener('mouseleave', () => focusPhase(null)); });
	});

	// ---------- Washes helpers ----------
	const GLAZE = 0.55;
	const pigment = (c, glaze) => ({ ...WashHighlightFX.kmPigment(c, PAPER, glaze), granulation: 0.35 });
	{ const w = q('.washA'); w.style.setProperty('--rin', (R_IN / (S / 2) * 100) + '%'); w.style.setProperty('--rout', (R_OUT / (S / 2) * 100) + '%'); }
	let A = null, D = null, CC = null;
	const make = (W, host, Wd = S, H = S, SC = 1.75, PIGS = null, GL = GLAZE) => {
		const wc = W.create(host, { transparent: true, pointer: false, cursorPreview: false, mobile: false, seed: 11, size: { width: Wd, height: H }, scale: SC, gouacheMode: 'auto', paperColor: h01(PAPER), pigments: (PIGS || ['#ecc81a', '#f06a41', '#457cbb']).map(c => pigment(c, GL)) });
		try { wc.edgeDarkening(true); wc.gravityStrength(0); wc.edgeMode('closed'); wc.edgeFade(0); } catch (e) { /* older engine */ }
		wc.run('always'); return wc; };
	const brush = wc => { wc.penUp(); wc.paintLoad(2.6); wc.waterLoad(1.1); wc.pressure(1); };
	const RM = (R_IN + R_OUT) / 2 / S, DAB = (R_OUT - R_IN) / 2 / S;
	const STEP = (DAB * 0.33 / RM) * 180 / Math.PI, INSET = (DAB * 0.8 / RM) * 180 / Math.PI;
	const dab = (wc, deg, mix) => { const a = (deg - 90) * Math.PI / 180, jr = (Math.random() - 0.5) * DAB * 0.18, r = RM + jr, x = 0.5 + r * Math.cos(a), y = 0.5 + r * Math.sin(a), rad = DAB * 2.1 * (0.92 + Math.random() * 0.16);
		wc.rewet(x, y, rad * 1.15); const k = 0.85 + Math.random() * 0.15; for (const [pig, amt] of mix) wc.paint(x, y, rad, pig, amt * k); };
	// A touchpoint: one loaded drop, dried on contact so it keeps a crisp
	// watercolour edge instead of blooming.
	const DOT = 15 / S;
	const dot = t => { if (!D) return; const x = t.cx / S, y = t.cy / S; D.rewet(x, y, DOT * 0.9); for (const [pig, amt] of t.mix) D.paint(x, y, DOT, pig, amt);
		requestAnimationFrame(() => requestAnimationFrame(() => { try { if (D) D.dry(x, y, DOT * 1.6); } catch (e) { /* torn down */ } })); };
	const fallbackArcs = segs => { gFallback.replaceChildren(); segs.forEach(([d0, d1, col]) => { const p = document.createElementNS(NS, 'path'); p.setAttribute('d', arcPath(d0, d1 - 0.01, (R_IN + R_OUT) / 2)); p.setAttribute('fill', 'none'); p.setAttribute('stroke', COLOR[col]); p.setAttribute('stroke-width', R_OUT - R_IN); gFallback.appendChild(p); }); };
	const paintArcNow = (wc, from, to, mix, inset = INSET) => { for (let d = from + inset; d <= Math.max(from + inset, to - inset); d += STEP) dab(wc, d, mix); };

	// ---------- Week-over-week chart (same calendar as the wheel) ----------
	const CHH = 184, VMAX = 25;
	const cstage = q('.wkc-stage');
	const CW = Math.max(300, Math.round(cstage.clientWidth || 900)); // laid out at its real width, so strokes and type stay fine
	const NARROW = CW < 520; // phones: shorter axis labels, no pause caption
	const PX0 = 50, PX1 = CW - 28, PY0 = CHH - 36, PY1 = 22;
	const PTS = [[0, 0]].concat(WK.map((v, i) => [i + 1, v])); // cumulative: 0 at the start of week 1
	const cxw = w => PX0 + w / TOTAL * (PX1 - PX0), cyv = v => PY0 - v / VMAX * (PY0 - PY1);
	const csvg = q('.csvg'); csvg.setAttribute('viewBox', `0 0 ${CW} ${CHH}`);
	const csvgB = q('.csvgB'); csvgB.setAttribute('viewBox', `0 0 ${CW} ${CHH}`); // guides sit under the paint
	const cel = (tag, attrs = {}, parent = csvg) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };
	const tx = (x, y, t, a = 'middle', cls, parent) => { const e = cel('text', { x, y, 'text-anchor': a }, parent); if (cls) e.setAttribute('class', cls); e.textContent = t; return e; };
	// static frame: axis, week labels, y labels
	cel('line', { class: 'axis', x1: PX0, y1: PY0, x2: PX1, y2: PY0 });
	for (let w = 0; w <= TOTAL; w++) cel('line', { class: 'axis', x1: cxw(w), y1: PY0, x2: cxw(w), y2: PY0 + 4 });
	for (let w = 0; w <= PAUSE_AT; w++) tx(cxw(w), PY0 + 20, NARROW ? String(w) : 'WK ' + w);
	if (NARROW) tx(PX0 - 10, PY0 + 20, 'WK', 'end');
	tx(PX0 - 10, cyv(20) + 4, '20%', 'end'); tx(PX0 - 10, cyv(5) + 4, '5%', 'end'); tx(PX0 - 10, PY0 + 4, '0', 'end');
	// goal, benchmark, pause band and a thin phase band on the axis
	const creveal = cel('g', {}, csvgB);
	cel('line', { x1: PX0, y1: cyv(20), x2: PX1, y2: cyv(20), stroke: 'var(--ink55)', 'stroke-width': 1.2, 'stroke-dasharray': '6 5' }, creveal);
	cel('line', { x1: PX0, y1: cyv(5), x2: PX1, y2: cyv(5), stroke: 'var(--ink55)', 'stroke-width': 1.5, 'stroke-dasharray': '0.1 4.5', 'stroke-linecap': 'round' }, creveal);
	tx(PX1, cyv(20) - 7, 'goal', 'end', null, creveal); tx(PX1, cyv(5) - 7, 'benchmark', 'end', null, creveal);
	cel('rect', { x: cxw(PAUSE_AT) + 1, y: PY1 - 14, width: cxw(PAUSE_AT + PAUSE) - cxw(PAUSE_AT) - 2, height: PY0 - PY1 + 12, fill: 'var(--ink)', opacity: 0.035 }, creveal); // the silence
	if (!NARROW) { tx(cxw(PAUSE_AT + PAUSE / 2), PY1 - 2, 'PAUSE', 'middle', null, creveal); tx(cxw(PAUSE_AT + PAUSE / 2), PY1 + 12, '1–4 WKS', 'middle', null, creveal); }
	[2, 4, PAUSE_AT, PAUSE_AT + PAUSE].forEach(w => cel('line', { x1: cxw(w), y1: PY1 - 14, x2: cxw(w), y2: PY0, stroke: 'var(--ink55)', 'stroke-width': 1, 'stroke-dasharray': '1 4', 'stroke-linecap': 'round', opacity: 0.6 }, creveal));
	phases.forEach(p => { cel('line', { x1: cxw(p.w0) + 1, y1: PY0, x2: cxw(p.w0 + p.weeks) - 1, y2: PY0, stroke: COLOR[p.color], 'stroke-width': 2.5 }, creveal); });
	// print / no-sim version of the line
	const cfb = cel('g', { filter: 'url(#wh-wc)' });
	const pointPhase = k => k === 0 ? 0 : phaseOfWeek(k - 0.5);
	for (let k = 1; k < PTS.length; k++) { const x1 = cxw(PTS[k - 1][0]), y1 = cyv(PTS[k - 1][1]), x2 = cxw(PTS[k][0]), y2 = cyv(PTS[k][1]), a = pointPhase(k - 1), b = pointPhase(k); let stroke = COLOR[phases[b].color];
		if (a !== b) { const g = cel('linearGradient', { id: 'wh-cg' + k, gradientUnits: 'userSpaceOnUse', x1, y1, x2, y2 }, csvg); cel('stop', { offset: '0', 'stop-color': COLOR[phases[a].color] }, g); cel('stop', { offset: '1', 'stop-color': COLOR[phases[b].color] }, g); stroke = 'url(#wh-cg' + k + ')'; }
		cel('line', { x1, y1, x2, y2, stroke, 'stroke-width': 2.4, 'stroke-linecap': 'round' }, cfb); }
	// hover: veils and hit lines per segment
	const cveils = [];
	for (let k = 1; k < PTS.length; k++) { const ph = phaseOfWeek(k - 0.5), a = [cxw(PTS[k - 1][0]), cyv(PTS[k - 1][1]), cxw(PTS[k][0]), cyv(PTS[k][1])];
		const v = cel('line', { x1: a[0], y1: a[1], x2: a[2], y2: a[3], stroke: 'var(--paper)', 'stroke-width': 14, 'stroke-linecap': 'round', opacity: 0 }); v.style.transition = 'opacity .25s'; cveils.push([ph, v]);
		const h = cel('line', { x1: a[0], y1: a[1], x2: a[2], y2: a[3], stroke: 'transparent', 'stroke-width': 16, 'pointer-events': 'stroke' });
		h.addEventListener('mouseenter', () => focusPhase(ph)); h.addEventListener('mouseleave', () => focusPhase(null)); }
	// ink circles and value labels at each data point
	const cdotEls = WK.map((v, i) => { const c = cel('circle', { cx: cxw(i + 1), cy: cyv(v), r: 3.2, fill: 'var(--ink)' }); c.style.transition = 'opacity .35s'; return c; });
	cel('circle', { cx: cxw(0), cy: cyv(0), r: 3.2, fill: 'var(--ink)' }); // the line starts at 0 on WK 0
	const cvals = WK.map((v, i) => tx(cxw(i + 1), cyv(v) - 11, String(v) + '%', 'middle', 'cv on' + (i === 4 ? ' last' : '')));
	// a flag on week 1: already past the benchmark
	{ const g = cel('g', {}), fx = cxw(5 / WK[0]), fy = cyv(5), ty = PY0 - 15;
		cel('line', { x1: fx, y1: fy + 4, x2: fx, y2: ty - 9, stroke: 'var(--ink55)', 'stroke-width': 1 }, g);
		cel('circle', { cx: fx, cy: fy, r: 3.5, fill: 'var(--paper)', stroke: 'var(--ink)', 'stroke-width': 1.25 }, g);
		const r = cel('rect', { x: fx, y: ty - 9, width: 220, height: 18, rx: 4, fill: 'var(--ink)', opacity: 0.07 }, g);
		const t = cel('text', { x: fx + 8, y: ty + 4, 'text-anchor': 'start', class: 'cflag' }, g); t.textContent = 'Exceeded 5% benchmark within one week';
		try { const w = t.getComputedTextLength(); if (w > 0) r.setAttribute('width', w + 16); } catch (e) { /* not laid out */ } }
	// a flag on week 5: the goal, passed with only two rounds of agent calls
	{ const g = cel('g', {}), cw = 4 + (20 - WK[3]) / (WK[4] - WK[3]), fx = cxw(cw), fy = cyv(20), right = NARROW, lines = NARROW ? ['≤2 calls for 20%'] : ['2 or fewer calls needed', 'to reach 20% conversion'];
		const lh = 14, h = lines.length * lh + 6, ty = NARROW ? cyv(10.5) - h / 2 : cyv(12.5) - h / 2;
		cel('line', { x1: fx, y1: fy + 4, x2: fx, y2: ty, stroke: 'var(--ink55)', 'stroke-width': 1 }, g);
		cel('circle', { cx: fx, cy: fy, r: 3.5, fill: 'var(--paper)', stroke: 'var(--ink)', 'stroke-width': 1.25 }, g);
		const r = cel('rect', { x: fx - 200, y: ty, width: 200, height: h, rx: 4, fill: 'var(--ink)', opacity: 0.07 }, g);
		let maxw = 0; lines.forEach((ln, k) => { const t = cel('text', { x: right ? fx + 8 : fx - 8, y: ty + lh * (k + 1), 'text-anchor': right ? 'start' : 'end', class: 'cflag' }, g); t.textContent = ln; try { maxw = Math.max(maxw, t.getComputedTextLength()); } catch (e) { /* not laid out */ } });
		if (maxw > 0) { r.setAttribute('x', right ? fx : fx - maxw - 16); r.setAttribute('width', maxw + 16); } }
	// mask the chart's paint to a thin corridor along the line
	{ const d = PTS.map(([w, v], i) => (i ? 'L' : 'M') + cxw(w).toFixed(1) + ' ' + cyv(v).toFixed(1)).join(' ');
		const m = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${CW} ${CHH}' preserveAspectRatio='none'><path d='${d}' fill='none' stroke='white' stroke-width='4.6' stroke-linecap='round' stroke-linejoin='round'/></svg>`;
		const url = 'url("data:image/svg+xml;utf8,' + encodeURIComponent(m) + '")', host = q('.washC');
		host.style.maskImage = host.style.webkitMaskImage = url; host.style.maskSize = host.style.webkitMaskSize = '100% 100%'; host.style.maskRepeat = host.style.webkitMaskRepeat = 'no-repeat'; }
	// Between points of different phases the brush trades one pigment for the
	// next; red into green would mix to mud, so the hue travels through yellow.
	const segMix = (k, t) => { const a = pointPhase(k), b = pointPhase(k + 1); if (a === b) return [[a, 1]]; const e = t * t * (3 - 2 * t), comp = a !== 0 && b !== 0, mix = comp ? [[a, (1 - e) * (1 - e)], [b, e * e]] : [[a, 1 - e], [b, e]];
		if (comp) mix.push([0, 5.6 * e * (1 - e)]); return mix; };
	const DW = 1.1 / ((PX1 - PX0) / TOTAL); // ~1px of line per dab
	const cdab = (x, y, mix, r) => { const nx = x / CW, ny = y / CHH; CC.rewet(nx, ny, r * 0.55); for (const [pg, amt] of mix) CC.paint(nx, ny, r, pg, amt); };
	const posAt = w => { const k = Math.min(PTS.length - 2, Math.floor(w)), t = w - k; return [cxw(PTS[k][0] + t), cyv(PTS[k][1] + (PTS[k + 1][1] - PTS[k][1]) * t), k]; };
	const paintChart = () => { if (!CC) return; const dried = [];
		for (let x = 0; x <= 5; x += DW) { const [px, py, k] = posAt(x), mix = segMix(k, x - k); cdab(px, py, mix, 4 / CW); cdab(px, py, mix, 3.4 / CW); dried.push([px, py]); }
		setTimeout(() => { try { if (CC) dried.forEach(([x, y]) => CC.dry(x / CW, y / CHH, 8 / CW)); } catch (e) { /* torn down */ } }, 60); };

	// ---------- Focus: keep one phase at full strength, fade the rest ----------
	const chalItems = [...root.querySelectorAll('.chal li')];
	function focusPhase(i) {
		const on = j => i == null || j === i;
		chalItems.forEach((li, j) => { li.dataset.focus = i == null ? '' : (j === i ? 'on' : 'off'); });
		phases.forEach((p, j) => { if (p.veil) p.veil.setAttribute('opacity', on(j) ? 0 : 0.72); if (p.tEl) p.tEl.style.opacity = on(j) ? 1 : 0.3; });
		tps.forEach(t => { const keep = on(t.phIdx); t.veil.setAttribute('opacity', keep ? 0 : 0.75); t.spoke.style.opacity = keep ? '' : 0.15; });
		cveils.forEach(([ph, v]) => v.setAttribute('opacity', on(ph) ? 0 : 0.78));
		WK.forEach((v, k) => { const keep = on(phaseOfWeek(k + 0.5)); cdotEls[k].style.opacity = keep ? 1 : 0.25; cvals[k].style.opacity = keep ? '' : 0.3; });
	}
	chalItems.forEach((li, i) => { li.tabIndex = 0; li.addEventListener('mouseenter', () => focusPhase(i)); li.addEventListener('mouseleave', () => focusPhase(null)); li.addEventListener('focus', () => focusPhase(i)); li.addEventListener('blur', () => focusPhase(null)); });

	// ---------- The finished journey, painted at once ----------
	let painted = false;
	function drawStill() {
		painted = true;
		if (A) { brush(A); phases.forEach(p => paintArcNow(A, p.d0, p.d1, p.mix, INSET * 0.9)); }
		tps.forEach(t => { t.spoke.style.strokeDashoffset = 0; if (D) dot(t); else t.fb.setAttribute('opacity', 0.8); });
		fallbackArcs(phases.map(p => [p.d0, p.d1, p.color]));
		if (CC) { brush(CC); paintChart(); }
		chalItems.forEach(li => { li.dataset.state = 'done'; });
	}

	// Engine: the site's shared Washes. Without it (no WebGL) the flat rings,
	// SVG dots and the SVG line stand in, as in the design.
	const figEl = q('.fig');
	const timers = [];
	let io = null;
	const go = () => {
		if (reduce) { drawStill(); return; }
		requestAnimationFrame(() => requestAnimationFrame(() => figEl.classList.remove('pre'))); // ~500ms entrance, then the journey paints
		timers.push(setTimeout(() => { figEl.classList.remove('intro'); drawStill(); }, 520));
	};
	if (!reduce) { figEl.classList.add('pre', 'intro'); void figEl.offsetWidth; }
	WashHighlightFX.loadWashes()
		.then(W => {
			if (dead) return;
			try { A = make(W, q('.washA')); D = make(W, q('.washD')); CC = make(W, q('.washC'), CW, CHH, 1, ['#f87923', '#e25633', '#5a8815'], 0.9); } catch (e) { A = D = CC = null; }
		})
		.catch(() => { A = D = CC = null; })
		.then(() => {
			if (dead) return;
			if (CC) cfb.classList.add('printonly');
			if (A) gFallback.classList.add('printonly'); // with the sim running, the flat rings are for print only
			if ('IntersectionObserver' in window) {
				io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); go(); } }, { threshold: 0.35 });
				io.observe(stage);
			} else go();
		});
	listen(window, 'beforeprint', () => { if (!painted) drawStill(); });

	return () => {
		dead = true;
		if (io) io.disconnect();
		timers.forEach(clearTimeout);
		cleanups.forEach(fn => fn());
		phBtns.forEach(b => b.remove());
		for (const wc of [A, D, CC]) { try { if (wc) wc.destroy(); } catch (e) { /* already gone */ } }
		A = D = CC = null;
		svg.replaceChildren(); csvg.replaceChildren(); csvgB.replaceChildren();
	};
}
