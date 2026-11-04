import {
	Component as ReactComponent,
	createRef,
	type ChangeEvent,
	type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

import Button from '../../../../components/Button';

import Citation from './Citation';
import Figure from './Figure';
import WashHighlightFX from './wash-highlight';

// Figure — "Care Team Orbit": one simulated day of a CareSignal care team.
// Acute: assistant monitors → nurse calls → physician treats; hub-and-spoke:
// assistant routes → nurse(s) resolve. Ported 1:1 from the design-handoff
// prototype (Care Team Orbit.dc.html); the simulation methods below keep the
// prototype's shape and comments, typed loosely on purpose — the physics
// predates the port. Washes are stained into the shared watercolour-orbit
// wash sheet (lazy-loaded; it pulls the full engine chunk).

export type CareTeamOrbitProps = {
	model?: 'acute' | 'hub';
	nurses?: number;
	patients?: number | null;
	alertRate?: number;
	escalateRate?: number;
	daySeconds?: number;
	tilt?: number;
	queueSpeed?: number;
	servedSpeed?: number;
	poolSpeed?: number;
	wobble?: number;
	eccentricity?: number;
	breathe?: number;
	alternate?: boolean;
	avatarSize?: number;
	avatarSmall?: number;
	colorblind?: boolean;
	motion?: 'auto' | 'reduced';
	showImpact?: boolean;
	nursePhoto?: string;
	doctorPhoto?: string;
	assistantPhoto?: string;
	highlightPigment?: string;
	citeSource?: string;
};

type Sim = { min?: number; p?: number[][] };

type EngineState = {
	phase: number;
	manual: number | null;
	final: boolean;
	sim: Sim;
	daySec: number | null;
	assumOpen: boolean;
	narrow: boolean;
};

const IMG = '/images/projects/caresignal-clinician-app';

const PAL: { std: Record<string, string>; cb: Record<string, string> } = {
	std: { a: '#108ba0', r: '#e5562e', y: '#f9ac31', g: '#b2d07f', aT: '#0b6f80', rT: '#c4421f', yT: '#a86a00', gT: '#5f8a2e' },
	cb: { a: '#0072b2', r: '#d55e00', y: '#e69f00', g: '#56b4e9', aT: '#005a8c', rT: '#a84a00', yT: '#8a5f00', gT: '#1f6e9c' },
};
const INK: Record<string, string> = { a: 'blue', r: 'red', y: 'yellow', g: 'green' };
const V: Record<string, number> = { a: 5, r: 4, y: 3, g: 1 };
const LEAN = -9;
const AR = 40; // avatar radius when in focus — about the size of figure 1's nurse; others sit at 60%
const LIC: Record<string, string> = { ma: 'CERTIFIED MEDICAL ASSISTANT · CMA', rn: 'REGISTERED NURSE · RN', md: 'PHYSICIAN · MD' };
const DIR_POOL = 1;

const DIM75 = 'color-mix(in srgb,var(--color-confetti-black) 75%,transparent)';
const DIM45 = 'color-mix(in srgb,var(--color-confetti-black) 45%,transparent)';
const STAGE_MASK =
	'linear-gradient(to right,transparent,#000 4%,#000 96%,transparent),linear-gradient(to bottom,transparent,#000 14%,#000 86%,transparent)';

// Hand-off line dash march, the day-length slider chrome, and the headline
// pills' hover fill (the pills' resting colours are inline, so the hover
// needs !important to win).
const CSS = `
@keyframes ctdash{to{stroke-dashoffset:-20}}
.ct-pill:hover{background:var(--color-confetti-black) !important;color:var(--color-washes-paper) !important}
input[data-day-slider]{-webkit-appearance:none;appearance:none;height:16px}
input[data-day-slider]::-webkit-slider-runnable-track{height:1.25px;background:var(--color-confetti-black)}
input[data-day-slider]::-moz-range-track{height:1.25px;background:var(--color-confetti-black)}
input[data-day-slider]::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;margin-top:-5.4px;border-radius:50%;border:1.25px solid var(--color-confetti-black);background:var(--color-washes-paper)}
input[data-day-slider]::-moz-range-thumb{width:10px;height:10px;border-radius:50%;border:1.25px solid var(--color-confetti-black);background:var(--color-washes-paper)}
input[data-day-slider]:hover::-webkit-slider-thumb,input[data-day-slider]:focus-visible::-webkit-slider-thumb{background:var(--color-confetti-black)}
`;

function Pill({
	p,
	onClick,
	children,
}: {
	p: { on: boolean; bg: string; fg: string };
	onClick: () => void;
	children: ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-pressed={p.on}
			className="ct-pill mx-[0.08em] inline-block cursor-pointer rounded-full border-[1.25px] border-confetti-black"
			style={{
				padding: '0 0.38em 0.06em',
				background: p.bg,
				color: p.fg,
				font: 'inherit',
				lineHeight: 1.15,
				transition: 'background 200ms ease,color 200ms ease',
			}}
		>
			{children}
		</button>
	);
}

export default class CareTeamOrbit extends ReactComponent<CareTeamOrbitProps, EngineState> {
	state: EngineState = { phase: 0, manual: null, final: false, sim: {}, daySec: null, assumOpen: false, narrow: false };
	rootRef = createRef<HTMLDivElement>();
	stageRef = createRef<HTMLDivElement>();
	dayCv: Array<HTMLCanvasElement | null> = [];
	eqCv: Array<HTMLCanvasElement | null> = [];

	private uid = '';
	private still = false;
	private built = false;
	private started = false;
	private paused = true;
	private inView = false;
	private dead = false;
	private hlReady = false;
	private ff = false;
	private final = false;
	private t = 0;
	private minute = 0;
	private raf = 0;
	private last = 0;
	private trailT = 0;
	private workT = 0;
	private lastEmit = 0;
	private washQ = 1;
	private washSeq = 0;
	private washSize = '';
	private lastVb = '';
	private lastFocus = '';
	private inkC = '';
	private lastKey: string | null = null;
	private startT: ReturnType<typeof setTimeout> | undefined;
	private hlT: ReturnType<typeof setTimeout> | undefined;
	private washT: ReturnType<typeof setTimeout> | undefined;
	private io: IntersectionObserver | null = null;
	private ro: ResizeObserver | null = null;
	private onKey: ((e: KeyboardEvent) => void) | null = null;
	// Simulation internals (ported verbatim from the prototype).
	private washHost: HTMLDivElement | null = null;
	private svgU: any;
	private svgO: any;
	private cv: HTMLCanvasElement | null = null;
	private chG: any;
	private wash: any = null;
	private cam: any = null;
	private G: any;
	private P: Record<string, string> = PAL.std;
	private provs: any[] = [];
	private pool: any[] = [];
	private away = new Set<any>();
	private dots: any[] = [];
	private ev: Array<{ at: number; fn: () => void }> = [];
	private colA: number[] = [];
	private colEls: Array<{ el: any; col: number; veil?: boolean }> = [];
	private eb: Record<string, any> | null = null;
	private refFns: Record<string, (el: HTMLCanvasElement | null) => void> = {};

	avStep(dt?: number) { if (!this.provs) return; const f = this.focusCols(); this.provs.forEach(p => { if (!p.av) return; const m = p.av.parentNode && p.av.parentNode.getScreenCTM && p.av.parentNode.getScreenCTM(), u = m ? Math.hypot(m.a, m.b) : 0, px = !f || f.includes(p.i) ? +(this.props.avatarSize ?? 120) : +(this.props.avatarSmall ?? 100); /* 120px across by default and in focus, 100px while another provider has the focus, at any figure width */ const tg = (u > 0 ? px / (2 * AR * u) : 1.93) * (1 + (p.kick || 0)); p.kick = Math.max(0, (p.kick || 0) - (dt || 0) * 0.6); p.sc += (tg - p.sc) * (dt == null ? 1 : Math.min(1, dt * 4)); if (!this.still && dt) p.rot += dt * 9 * (p.dir || 1); p.av.setAttribute('transform', 'scale(' + p.sc.toFixed(3) + ')'); p.seal.setAttribute('transform', 'rotate(' + p.rot.toFixed(1) + ')'); }); }
	model() { return this.props.model === 'hub' ? 'hub' : 'acute'; }
	pal() { return this.props.colorblind ? PAL.cb : PAL.std; }
	cfg() { const P = this.props; return this.model() === 'hub'
		? { N: Math.max(50, +(P.patients ?? 330)), nurses: Math.min(3, Math.max(1, Math.round(+(P.nurses ?? 1)))), dayMin: 480, startMin: 540, crit: 9, resolveP: 0.25, newPerNurse: 4.5, alertPct: 0, escPct: 0 }
		: { N: Math.max(200, +(P.patients ?? 3500)), alertPct: +(P.alertRate ?? 0.5), escPct: +(P.escalateRate ?? 15), dayMin: 1440, startMin: 0, crit: 0, resolveP: 0, newPerNurse: 0, nurses: 1 }; }
	roles() { const C = this.cfg(); return this.model() === 'hub' ? ['ma'].concat(Array.from({ length: C.nurses }, () => 'rn')) : ['ma', 'rn', 'md']; }
	daySec() { return +(this.state.daySec ?? this.props.daySeconds ?? 30); }
	mps() { return this.cfg().dayMin / this.daySec(); } // simulated minutes per real second
	isReduced() { const m = this.props.motion ?? 'auto'; return m === 'reduced' || (m === 'auto' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
	tiltK() { return Math.cos((+(this.props.tilt ?? 40)) * Math.PI / 180); }
	geo() { const n = this.roles().length, g = 30, cw = (1400 - (n - 1) * g) / n, k = this.tiltK(), st = this.stageRef && this.stageRef.current, W = (st && st.clientWidth) || 1088, H = (st && st.clientHeight) || W * 400 / 1400, cwN = Math.min(cw * 1.12, 560), u = this.state.narrow ? Math.min(W / cwN, H / (cwN * 0.75)) : Math.min(W / 1400, H / 400), A = +(this.props.avatarSize ?? 120) / 2 / u /* the photo's radius in scene units */, RA = (A + 8) / k, RQ = RA + 12, rIn = Math.max(RQ + 16, (A * 1.3 + 3) / k) /* the pool clears photo + seal */; return { n, cw, cx: (i: number) => -700 + i * (cw + g) + cw / 2, y: -14, RA, RQ, rIn, r: Math.max(Math.min(cw / 2 - 10, 235), rIn + 40) }; }

	// ---------- helpers ----------
	mk(tag: string, attrs: Record<string, string | number>, parent?: Element): any { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const k in attrs) e.setAttribute(k, String(attrs[k])); if (parent) parent.appendChild(e); return e; }
	later(sec: number, fn: () => void) { this.ev.push({ at: this.t + sec, fn }); }
	fill(d: any, k: string) { d.k = k; }
	pop(d: any) { d.sc = 1.7; }
	// ---------- organic orbits: every patient keeps its own radius, speed and drift round a provider; the plane is tilted like the opening figure, but dots stay round ----------
	proj(o: any, lx: number, ly: number) { const y = ly * o.k, a = LEAN * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return { x: o.cx + lx * c - y * s, y: o.cy + lx * s + y * c }; }
	unproj(o: any, ax: number, ay: number) { const dx = ax - o.cx, dy = ay - o.cy, a = -LEAN * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return { x: dx * c - dy * s, y: (dx * s + dy * c) / o.k }; }
	// like the opening figure: each path is a slightly eccentric loop whose long axis slowly precesses, the radius wavers on two beats, and the whole orbit breathes in and out
	orbMod(d: any) { const t = this.t, P = this.props, ec = (d.ec ?? 0) * +(P.eccentricity ?? 1), ph = d.ph, wb = +(P.wobble ?? 1), br = +(P.breathe ?? 4.5) / 100; return { add: wb * (d.wa * Math.sin(t * d.wf + ph) + d.wa * 0.45 * Math.sin(t * d.wf * 2.3 + ph * 1.7)), mul: (1 + ec * Math.cos(d.th - (d.pw ?? 0) - t * 0.06)) * (1 + br * Math.sin(t * 1.3 + ph * 3.1)) }; }
	pos(d: any) { const m = this.orbMod(d), r = (d.rho + m.add) * m.mul; return this.proj(d.o, Math.cos(d.th) * r, Math.sin(d.th) * r); }
	setOrbit(d: any, o: any, rhoT: number, om: number) { const p = this.pos(d), l = this.unproj(o, p.x, p.y); d.o = o; d.th = Math.atan2(l.y, l.x); { const m = this.orbMod(d); d.rho = Math.hypot(l.x, l.y) / m.mul - m.add; } d.rhoT = rhoT; d.om = om; } // continuous from where it is now; it then eases in (or out) to its new radius
	poolSpot(d: any) { const G = this.G, r = Math.sqrt(G.rIn * G.rIn + Math.random() * (G.r * G.r - G.rIn * G.rIn)); return { rho: r, om: DIR_POOL * +(this.props.poolSpeed ?? 0.09) * (G.rIn + 30) / r * (0.75 + Math.random() * 0.5) }; }
	relay(p: any) { const G = this.G; p.queue.forEach((d: any, i: number) => { d.rhoT = G.RQ + (i % 3) * 12 + d.jit; }); }
	pulse(a: any, b: any, k: string) { const ln = this.mk('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: this.P[k], 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-dasharray': '2 8' }, this.chG); ln.style.opacity = '0.9'; ln.style.transition = 'opacity 400ms ease'; if (!this.still) ln.style.animation = 'ctdash 1s linear infinite'; this.later(1.4, () => { ln.style.opacity = '0'; }); this.later(1.9, () => ln.remove()); }

	// ---------- camera: the whole team on desktop; on a phone it frames one provider at a time and glides to whoever is in focus ----------
	camTarget() { if (!this.state.narrow || !this.G) return { x0: -700, y0: -200, w: 1400, h: 400 }; const f = this.focusCols(), i = f ? f[0] : 0, p = this.provs && this.provs[i], G = this.G, w = Math.min(G.cw * 1.12, 560), h = w * 3 / 4; return { x0: (p ? p.x : 0) - w / 2, y0: (p ? p.y : 0) - h / 2 + 12, w, h }; }
	camStep(dt?: number) { const T: any = this.camTarget(); if (!this.cam || dt == null || this.still) { this.cam = { ...T }; } else { const e = 1 - Math.exp(-dt * 2.6); for (const k in T) this.cam[k] += (T[k] - this.cam[k]) * e; } this.applyCam(); }
	view() { const st = this.stageRef.current!, W = st.clientWidth, H = st.clientHeight, c = this.cam || this.camTarget(), sc = Math.min(W / c.w, H / c.h); return { W, H, s: sc, ox: (W - c.w * sc) / 2 - c.x0 * sc, oy: (H - c.h * sc) / 2 - c.y0 * sc }; } // screen = scene * s + (ox, oy)
	applyCam() { const c = this.cam; if (!c || !this.svgU) return; const vb = c.x0.toFixed(1) + ' ' + c.y0.toFixed(1) + ' ' + c.w.toFixed(1) + ' ' + c.h.toFixed(1); if (vb !== this.lastVb) { this.lastVb = vb; this.svgU.setAttribute('viewBox', vb); this.svgO.setAttribute('viewBox', vb); }
		if (this.washHost && this.washQ) { const v = this.view(), k = v.s / this.washQ; this.washHost.style.transform = 'translate(' + (v.ox - 700 * v.s).toFixed(1) + 'px,' + (v.oy - 200 * v.s).toFixed(1) + 'px) scale(' + k.toFixed(4) + ')'; } }
	// ---------- washes: travelling patients and the one each provider is working with stain the sheet ----------
	toSheet(x: number, y: number, r: number) { return [(x + 700) / 1400, (y + 200) / 400, r / 400]; }
	stain(d: any, kind: string) { if (!this.wash || this.ff) return; const p = this.pos(d), [x, y, r] = this.toSheet(p.x, p.y, d.rq * 1.6);
		try { if (kind === 'resolve') { this.wash.paper(x, y, r * 1.6); this.wash.rewet(x, y, r * 1.8); this.wash.ink(x, y, r * 1.2, 'green', 0.75); } else { this.wash.rewet(x, y, r * 2); this.wash.ink(x, y, r * 1.3, INK[d.k], 0.9); } } catch { /* sheet gone */ } }
	trail() { if (!this.wash || this.ff) return; const dab = (d: any, load: number) => { const p = this.pos(d), [x, y, r] = this.toSheet(p.x, p.y, d.rq * 0.6); try { this.wash.ink(x, y, r, INK[d.k], load); } catch { /* sheet gone */ } };
		this.away.forEach(d => { if (Math.abs(d.rho - d.rhoT) > 10) dab(d, 0.12); });
		if (this.final || this.t - (this.workT || 0) < 0.2) return; this.workT = this.t; this.provs.forEach(p => { const d = p.busy; if (d && d.o && !d.review && Math.abs(d.rho - d.rhoT) < 10) dab(d, 0.06); }); }
	async makeWash() { const st = this.stageRef.current; if (!st || this.dead || !this.washHost) return; if (!st.clientWidth || !st.clientHeight) return; const T = this.camTarget(), q = Math.min(st.clientWidth / T.w, st.clientHeight / T.h), W = Math.round(1400 * q), H = Math.round(400 * q); const seq = this.washSeq = (this.washSeq || 0) + 1;
		if (this.wash) { try { this.wash.destroy(); } catch { /* already gone */ } this.wash = null; } this.washHost.innerHTML = ''; this.washSize = st.clientWidth + 'x' + st.clientHeight + (this.state.narrow ? 'n' : ''); this.washQ = q; this.washHost.style.width = W + 'px'; this.washHost.style.height = H + 'px'; this.applyCam();
		try { const m = await import('./orbit/watercolour-orbit'); if (seq !== this.washSeq || this.dead) return; const w = await m.washSheet(this.washHost, { width: W, height: H, colorblind: !!this.props.colorblind }); if (seq !== this.washSeq || this.dead) { w.destroy(); return; } this.wash = w; if (this.paused) try { w.pause(); } catch { /* noop */ } } catch (e) { console.warn('[care-team] washes unavailable', e); } }

	// ---------- patients ----------
	takePatient(pred?: (d: any) => boolean) { const p = this.pool; for (let n = 0; n < 40 && p.length; n++) { const i = Math.floor(Math.random() * p.length), d = p[i]; if (d.rev || (pred && !pred(d))) continue; p.splice(i, 1); d.inPool = false; this.away.add(d); return d; } return null; }
	goHome(d: any) { this.fill(d, 'g'); const sp = this.poolSpot(d); this.setOrbit(d, this.provs[0].o, sp.rho, sp.om); d.wa = 1.5 + Math.random() * 3;
		d.onArrive = () => { this.stain(d, 'resolve'); d.inPool = true; this.away.delete(d); this.pool.push(d); this.later(2.4 * this.daySec() / 30, () => { if (d.inPool) this.fill(d, d.base); }); }; }
	// hand a patient to a provider: it drifts over and joins the ring of people waiting for them
	enqueue(p: any, d: any, job: any) { d.job = job; d.waiting = false; p.queue.push(d); d.sd = (this.props.alternate ?? true) ? ((p.alt = (p.alt || 0) + 1) % 2 ? 1 : -1) * p.dir : p.dir; /* every other alert circles the other way, so the two streams meet like a barrier round each provider */ this.setOrbit(d, p.o, this.G.RQ, d.sd * +(this.props.queueSpeed ?? 0.1) * (1 + Math.random() * 0.5)); d.wa = 3 + Math.random() * 3; this.relay(p);
		d.onArrive = () => { p.bump(); this.stain(d, 'bloom'); d.waiting = true; this.serve(p); }; }
	// one patient at a time: the next waiting patient moves in close and circles fast while the provider works with them
	serve(p: any) { if (p.busy || this.final) return; const j = p.queue.findIndex((d: any) => d.waiting); if (j < 0) return; const d = p.queue.splice(j, 1)[0]; this.relay(p);
		p.busy = d; d.waiting = false; d.rhoT = this.G.RA; d.om = (d.sd || p.dir) * +(this.props.servedSpeed ?? 0.6); d.wa = 1; d.ring = true;
		const job = d.job, dur = job.min[0] + Math.random() * (job.min[1] - job.min[0]);
		d.onArrive = () => { if (this.final || p.busy !== d) return; p.cur = { s: this.minute, c: job.code }; this.later(dur / this.mps(), () => this.finish(p, d, job)); }; } // the clock on their care starts only once they're on the provider's close orbit
	finish(p: any, d: any, job: any) { if (p.cur) { p.spans.push([p.cur.s, this.minute, p.cur.c]); p.busyMin += this.minute - p.cur.s; } p.cur = null; p.busy = null; d.ring = false; d.wa = 3; job.done(d); this.serve(p); }
	// between patients the assistant reviews medium-risk check-ins where they are
	nextReview(first?: number) { const C = this.cfg(), perDay = Math.max(2, Math.round(C.N * 0.2 / 14)); this.later(first ?? (this.daySec() / perDay) * (0.5 + Math.random()), () => { if (this.final) return; const ma = this.provs[0];
		if (!ma.busy && !ma.queue.length) { const cand = this.pool.filter((d: any) => d.k === 'y' && !d.rev), d = cand[Math.floor(Math.random() * cand.length)]; if (d) { d.rev = true; d.ring = true; ma.busy = { review: d }; ma.cur = { s: this.minute, c: 'y' };
			this.later((3 + Math.random() * 3) / this.mps(), () => { d.ring = false; d.rev = false; if (ma.cur) { ma.spans.push([ma.cur.s, this.minute, 'y']); ma.busyMin += this.minute - ma.cur.s; } ma.cur = null; ma.busy = null; this.serve(ma); }); } }
		this.nextReview(); }); }
	newDot(o: any, rho: number, th: number, om: number, r0: number, k: string) { const d = { o, rho, rhoT: rho, th, om, wa: 1.5 + Math.random() * 3.5, wf: 0.3 + Math.random() * 0.6, ph: Math.random() * 6.283, ec: 0.03 + Math.random() * 0.07, pw: Math.random() * 6.283, sv: 0.15 + Math.random() * 0.25, sf: 0.15 + Math.random() * 0.35, r0, rq: Math.max(r0, 3.2), sc: 1, k, base: k, inPool: true, jit: Math.random() * 4 }; this.dots.push(d); return d; }

	// ---------- build ----------
	build() {
		const m = this.model(), C = this.cfg(), G = this.G = this.geo(), P = this.P = this.pal(), roles = this.roles(), k = this.tiltK();
		this.svgU.textContent = ''; this.svgO.textContent = ''; this.t = 0; this.ev = []; this.dots = []; this.away = new Set(); this.minute = 0; this.final = false; this.colEls = []; this.lastKey = null;
		this.colA = roles.map(() => 1);
		if (this.wash) try { this.wash.clear(); } catch { /* noop */ }
		this.chG = this.mk('g', {}, this.svgU); const nodesG = this.mk('g', {}, this.svgO);
		const ink = 'var(--color-confetti-black)';
		this.provs = roles.map((role, i) => ({ role, i, x: G.cx(i), y: G.y, dir: i % 2 ? -1 : 1, queue: [], busy: null, cur: null, spans: [], busyMin: 0, n1: 0, n2: 0, o: { cx: G.cx(i), cy: G.y, k, col: i } }));
		const ma = this.provs[0];
		this.provs.slice(1).forEach(p => { const from = m === 'acute' && p.role === 'md' ? this.provs[1] : ma, ln = this.mk('line', { x1: from.x, y1: from.y, x2: p.x, y2: p.y, stroke: 'color-mix(in srgb,var(--color-confetti-black) 18%,transparent)', 'stroke-width': 1.25, 'stroke-linecap': 'round' }, this.chG); ln.style.transition = 'opacity 600ms ease'; this.colEls.push({ el: ln, col: p.i }); });
		this.cam = null; this.provs.forEach(p => { const g = this.mk('g', { transform: 'translate(' + p.x + ',' + p.y + ')' }, nodesG); g.style.transition = 'opacity 600ms ease'; const c = this.mk('g', {}, g); c.style.transition = 'transform 200ms ease';
			const cid = this.uid + '-clip-' + p.i, cp = this.mk('clipPath', { id: cid }, c); this.mk('circle', { r: AR }, cp); this.mk('circle', { r: AR, fill: 'var(--color-washes-paper)' }, c);
			const im = this.mk('image', { x: -AR, y: -AR, width: AR * 2, height: AR * 2, 'clip-path': 'url(#' + cid + ')', preserveAspectRatio: 'xMidYMid slice' }, c); im.setAttribute('href', p.role === 'rn' ? (this.props.nursePhoto || IMG + '/nurse-team-v3.webp') : p.role === 'md' ? (this.props.doctorPhoto || IMG + '/doctor-v7.webp') : (this.props.assistantPhoto || IMG + '/assistant-v3.webp'));
			const SR = AR + 3.5, pid = this.uid + '-seal-' + p.i; this.mk('circle', { r: AR + 6.5, fill: 'none', stroke: 'var(--color-washes-paper)', 'stroke-width': 11 }, c); /* the seal's light band round the photo, as in figure 1's light tone */ const sg = this.mk('g', {}, c), defs = this.mk('defs', {}, sg); this.mk('path', { id: pid, d: 'M 0 ' + (-SR) + ' A ' + SR + ' ' + SR + ' 0 1 1 0 ' + SR + ' A ' + SR + ' ' + SR + ' 0 1 1 0 ' + (-SR) }, defs);
			const lab = LIC[p.role], adv = 6.5 * 0.6 + 1.1, max = Math.floor(2 * Math.PI * SR / adv), unit = lab + ' · ', reps = Math.max(1, Math.floor(max / unit.length)), txt = unit.repeat(reps);
			const st = this.mk('text', { fill: ink, 'font-family': 'var(--font-mono)', 'font-size': 6.5, 'letter-spacing': (1.1 + (max - txt.length) * adv / txt.length).toFixed(2) }, sg), tp = this.mk('textPath', { href: '#' + pid, startOffset: '0' }, st); tp.textContent = txt;
			p.av = c; p.seal = sg; p.sc = 0.6; p.rot = Math.random() * 360;
			const veil = this.mk('circle', { r: AR + 12, fill: 'var(--color-washes-paper)' }, p.av); veil.style.opacity = '0'; veil.style.transition = 'opacity 600ms ease'; /* dims an out-of-focus provider without making the photo see-through */ this.colEls.push({ el: veil, col: p.i, veil: true }); p.bump = () => { p.kick = 0.12; }; });
		// the assistant's panel: each patient on its own path — inner ones faster, every one breathing in and out a little
		const sp = Math.sqrt(Math.PI * (G.r * G.r - G.rIn * G.rIn) / C.N), dot = Math.max(1.2, Math.min(3.2, sp * 0.26)), pts = this.ringLayout(C.N, G.rIn + sp * 0.5, sp); this.pool = [];
		pts.forEach(pt => { const rho = Math.hypot(pt.x, pt.y), d = this.newDot(ma.o, rho, Math.atan2(pt.y, pt.x), +(this.props.poolSpeed ?? 0.09) * (G.rIn + 30) / rho * (0.75 + Math.random() * 0.5), dot * (0.85 + Math.random() * 0.3), Math.random() < 0.22 ? 'y' : 'g'); this.pool.push(d); });
		if (m === 'acute') this.nextAlert(0.6);
		else { this.provs.slice(1).forEach(n => { for (let i = 0; i < C.crit; i++) { const d = this.takePatient(); if (!d) break; this.fill(d, 'r'); d.o = n.o; d.th = Math.random() * 6.283; d.om = n.dir * (0.1 + Math.random() * 0.05); d.wa = 3 + Math.random() * 3; d.job = this.critJob(n); d.waiting = true; n.queue.push(d); }
				this.relay(n); n.queue.forEach((d: any) => { d.rho = d.rhoT; }); this.later(0.4 + n.i * 0.5, () => this.serve(n)); });
			this.nextCrit(1.2); }
		this.nextReview(2);
		this.camStep(); this.avStep(); this.applyFocus(true);
	}
	ringLayout(n: number, r0: number, dr: number) { const pts = []; let ring = 0, placed = 0; while (placed < n) { const r = r0 + ring * dr, count = Math.min(Math.max(3, Math.floor(2 * Math.PI * r / dr)), n - placed), step = 2 * Math.PI / count, off = Math.random() * 6.283; for (let i = 0; i < count; i++) { const a = off + i * step + (Math.random() - 0.5) * step * 0.3, rr = r + (Math.random() - 0.5) * dr * 0.5; pts.push({ x: Math.cos(a) * rr, y: Math.sin(a) * rr }); } placed += count; ring++; } return pts; }

	// ---------- 24/7 acute: alert → assistant reviews → nurse calls → (physician) → back to monitoring ----------
	nextAlert(first?: number) { const C = this.cfg(), perDay = Math.max(1, Math.round(C.N * C.alertPct / 100)); this.later(first ?? (this.daySec() / perDay) * (0.5 + Math.random()), () => { if (this.final) return; if (this.minute < C.dayMin - 90) this.emitAlert(); this.nextAlert(); }); } // no new alerts in the last 90 minutes, so the team can clear the board before the day closes
	emitAlert() { const d = this.takePatient(); if (!d) return; const [ma, rn, md] = this.provs, C = this.cfg(); this.fill(d, 'a'); this.pop(d); ma.n2++;
		this.enqueue(ma, d, { code: 'a', min: [5, 10], done: (d: any) => { this.pulse(ma, rn, 'a'); this.enqueue(rn, d, { code: 'a', min: [20, 30], done: (d: any) => { rn.n1++;
			if (Math.random() * 100 < C.escPct) { this.fill(d, 'r'); this.pop(d); this.pulse(rn, md, 'r'); this.enqueue(md, d, { code: 'r', min: [30, 45], done: (d: any) => { md.n1++; this.goHome(d); } }); }
			else { rn.n2++; this.goHome(d); } } }); } }); }

	// ---------- hub and spoke: the assistant flags new criticals and routes them; each nurse works through her critical patients in turn ----------
	critJob(n: any): any { return { code: 'r', min: [20, 30], done: (d: any) => { n.n1++; if (Math.random() < this.cfg().resolveP) { n.n2++; this.goHome(d); } else { d.job = this.critJob(n); d.om = n.dir * (0.1 + Math.random() * 0.05); d.wa = 3 + Math.random() * 3; n.queue.push(d); d.waiting = true; this.relay(n); } } }; }
	nextCrit(first?: number) { const C = this.cfg(), perDay = C.newPerNurse * C.nurses; this.later(first ?? (this.daySec() / perDay) * (0.5 + Math.random()), () => { if (this.final) return; const ma = this.provs[0], nurses = this.provs.slice(1), load = (x: any) => x.queue.length + (x.busy ? 1 : 0), tot = nurses.reduce((a, n) => a + load(n), 0);
		if (tot < C.crit * C.nurses + 4) { const d = this.takePatient(); if (d) { this.fill(d, 'r'); this.pop(d); ma.n2++;
			this.enqueue(ma, d, { code: 'r', min: [5, 10], done: (d: any) => { let n = nurses[0]; nurses.forEach(x => { if (load(x) < load(n)) n = x; }); this.pulse(ma, n, 'r'); this.enqueue(n, d, this.critJob(n)); } }); } }
		this.nextCrit(); }); }

	// ---------- clock ----------
	step(dt: number) { this.t += dt; if (!this.ff) { this.camStep(dt); this.avStep(dt); }
		for (let i = 0; i < this.ev.length;) { if (this.ev[i].at <= this.t) this.ev.splice(i, 1)[0].fn(); else i++; }
		const ease = 1 - Math.exp(-dt * 2.2), sEase = 1 - Math.exp(-dt * 10), mv = !this.still;
		for (const d of this.dots) { if (mv) d.th += d.om * (1 + (d.sv || 0) * Math.sin(this.t * (d.sf || 0) + d.ph)) * dt; /* each patient surges and lags a little, never a fixed clock speed */ const dr = d.rhoT - d.rho; if (dr) d.rho += Math.abs(dr) < 0.05 ? dr : dr * ease; if (d.sc !== 1) d.sc += (1 - d.sc) * sEase; if (d.onArrive && Math.abs(d.rhoT - d.rho) < 8) { const f = d.onArrive; d.onArrive = null; f(); } }
		const f = this.focusCols(); this.colA = this.colA.map((a, i) => { const tg = !f || f.includes(i) ? 1 : 0.35; return a + (tg - a) * Math.min(1, dt * 4); });
		this.trailT = (this.trailT || 0) + dt; if (this.trailT > 0.08) { this.trailT = 0; this.trail(); }
		if (!this.final) { const L = this.cfg().dayMin, busy = this.model() === 'acute' && this.provs && this.provs.some(p => p.busy || p.queue.length); this.minute = Math.min(busy ? L - 1 : L, this.minute + dt * this.mps()); if (this.minute >= L) this.endDay(); } } // acute: the shift can't close on open alerts; the clock holds at its last minute until the team clears them
	endDay() { this.final = true; this.provs.forEach(p => { if (p.cur) { p.spans.push([p.cur.s, this.minute, p.cur.c]); p.busyMin += this.minute - p.cur.s; p.cur = null; } }); this.setState({ final: true }); }
	wake() { if (this.dead) return; if (this.started) this.paused = !this.inView || !!this.state.assumOpen; /* hold while the assumptions panel covers it */ if (this.wash) try { this.paused ? this.wash.pause() : this.wash.resume(); } catch { /* noop */ } if (!this.paused && !this.raf) this.raf = requestAnimationFrame(this.frame); }
	frame = (now: number) => { if (this.dead) return; if (this.paused && this.started) { this.raf = 0; this.last = 0; return; } /* off screen: stop the loop entirely; wake() restarts it */ this.raf = requestAnimationFrame(this.frame); const dt = Math.min(0.05, (now - (this.last || now)) / 1000); this.last = now; if (this.paused || !this.cv || !this.built) return; this.step(dt); this.paint(now); };
	// dots: one canvas, batched by colour and focus; drawn as true circles at their projected positions
	drawDots() { const cv = this.cv, st = this.stageRef.current; if (!cv || !st || !this.dots) return; const W = st.clientWidth, H = st.clientHeight; if (!W || !H) return; const dpr = Math.min(1.5, window.devicePixelRatio || 1);
		if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
		const g = cv.getContext('2d')!, v = this.view(), s = v.s, ox = v.ox, oy = v.oy; g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
		const buckets = new Map<string, { c: string; a: number; path: Path2D }>(), rings: Array<[number, number, number, number]> = [], add = (d: any, p: { x: number; y: number }) => { const a = this.colA[d.o.col] ?? 1, key = d.k + '|' + a.toFixed(2); let b = buckets.get(key); if (!b) { b = { c: this.P[d.k], a, path: new Path2D() }; buckets.set(key, b); } const r = (d.inPool ? d.r0 : d.rq) * d.sc * s, x = ox + p.x * s, y = oy + p.y * s; b.path.moveTo(x + r, y); b.path.arc(x, y, r, 0, 6.2832); if (d.ring) rings.push([x, y, r + 2.5, a]); };
		for (const d of this.dots) if (d.inPool) add(d, this.pos(d)); for (const d of this.away) add(d, this.pos(d));
		buckets.forEach(b => { g.globalAlpha = b.a; g.fillStyle = b.c; g.fill(b.path); });
		g.strokeStyle = this.inkC || (this.inkC = getComputedStyle(document.documentElement).getPropertyValue('--color-confetti-black').trim() || '#391f00'); g.lineWidth = 1.25; rings.forEach(([x, y, r, a]) => { g.globalAlpha = a; g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.stroke(); }); g.globalAlpha = 1; }
	paint(now?: number) { this.drawDots();
		const C = this.cfg(), np = this.model() === 'hub' ? 2 : 3, auto = Math.min(np - 1, Math.floor(this.minute / C.dayMin * np));
		const sim = { min: Math.floor(this.minute), p: this.provs.map(p => [p.n1, p.n2, p.queue.length + (p.busy && !p.busy.review ? 1 : 0), Math.round(p.busyMin + (p.cur ? this.minute - p.cur.s : 0)), p.spans.length]) }, key = JSON.stringify(sim);
		if (key !== this.lastKey && (!now || now - (this.lastEmit || 0) > 125)) { this.lastKey = key; this.lastEmit = now || 0; this.setState({ sim }); } // stats + time strips: at most 8 updates a second
		if (auto !== this.state.phase) this.setState({ phase: auto }); }
	focusCols() { if (this.state.final && this.state.manual == null) return null; const ph = this.state.manual ?? this.state.phase, roles = this.roles(); if (this.model() === 'hub') return ph === 0 ? [0] : roles.map((r, i) => i).filter(i => i > 0); return [ph]; }
	applyFocus(force?: boolean) { const f = this.focusCols(), k = f ? f.join() : '*'; if (!force && k === this.lastFocus) return; this.lastFocus = k; (this.colEls || []).forEach(r => { const on = !f || f.includes(r.col); r.el.style.opacity = r.veil ? (on ? '0' : '0.65') : (on ? '1' : '0.35'); }); if (this.still && this.colA) { this.colA = this.colA.map((a, i) => !f || f.includes(i) ? 1 : 0.35); this.drawDots(); } }
	fastForward() { if (!this.built) return; this.ff = true; for (let n = 0; n < 200000 && !this.final; n++) this.step(0.05); for (let n = 0; n < 200; n++) this.step(0.05); this.ff = false; this.avStep(); this.paint(0); }
	restart() { this.setState({ final: false, manual: null, phase: 0 }, () => { if (!this.built) return; this.build(); this.paint(0); if (this.still) this.fastForward(); }); }

	// ---------- time strips ----------
	spansOf(i: number) { const p = this.provs && this.provs[i]; if (!p) return []; return p.cur ? p.spans.concat([[p.cur.s, this.minute, p.cur.c]]) : p.spans; }
	drawStrips() { if (!this.provs) return; const C = this.cfg(), ink = (getComputedStyle(document.documentElement).getPropertyValue('--color-confetti-black').trim() || '#391f00').slice(0, 7), P = this.pal();
		this.provs.forEach((p, i) => { const sp = this.spansOf(i), end = this.minute, D = C.dayMin;
			const prep = (cv: HTMLCanvasElement | null) => { if (!cv) return null; const W = cv.clientWidth, H = cv.clientHeight; if (!W || !H) return null; const dpr = Math.min(1.5, window.devicePixelRatio || 1); if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); } const g = cv.getContext('2d')!; g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H); return { g, W, H }; };
			const a = prep(this.dayCv[i] ?? null); if (a) { const { g, W, H } = a, n = 50, px = W / n, r = Math.max(1.5, Math.min(px * 0.36, H * 0.4)); // one dot per 1/50th of the day: coloured while they're with a patient
				for (let k = 0; k < n; k++) { const t = (k + 0.5) * D / n, hit = sp.find((s: any) => t >= s[0] && t < Math.max(s[1], s[0] + D / n)), past = t < end; let f = '#e4ded2', al = 0.18; if (hit) { f = P[hit[2]]; al = 1; } else if (past) { f = ink; al = 0.16; } g.globalAlpha = al; g.fillStyle = f; g.beginPath(); g.arc((k + 0.5) * px, H / 2, r, 0, 6.2832); g.fill(); } g.globalAlpha = 1; }
			const b = prep(this.eqCv[i] ?? null); if (b) { const { g, W, H } = b, NB = 50, BK = D / NB, slot = W / NB, x0 = 0, dH = (this.dayCv[i] && this.dayCv[i]!.clientHeight) || 10, bw = 2 * Math.max(1.5, Math.min(slot * 0.36, dH * 0.4)), gap = 1.5, sh = (H - gap * 4) / 5, col = (v: number) => v >= 4.5 ? P.a : v >= 3.5 ? P.r : v >= 2 ? P.y : P.g; // equalizer: 0–5 lit segments per stretch, by what the time could change
				for (let j = 0; j < NB; j++) { const b0 = j * BK, b1 = Math.min(b0 + BK, end); let sum = 0; if (b1 > b0) for (const [s0, s1, c] of sp) { const o = Math.min(s1, b1) - Math.max(s0, b0); if (o > 0) sum += o * V[c]; } const v = sum / BK, lit = Math.min(5, Math.round(v)), c = col(v), cx = x0 + (j + 0.5) * slot - bw / 2;
					for (let s = 0; s < 5; s++) { const y = H - (s + 1) * sh - s * gap; g.globalAlpha = s < lit ? 1 : 0.07; g.fillStyle = s < lit ? c : ink; g.beginPath(); if (g.roundRect) g.roundRect(cx, y, bw, sh, 1); else g.rect(cx, y, bw, sh); g.fill(); } } g.globalAlpha = 1; } }); }

	// ---------- lifecycle ----------
	componentDidMount() {
		this.uid = 'ct' + Math.random().toString(36).slice(2, 8); this.still = this.isReduced();
		const st = this.stageRef.current!; this.washHost = document.createElement('div'); this.washHost.style.cssText = 'position:absolute;left:0;top:0;z-index:0;pointer-events:none;mix-blend-mode:multiply;transform-origin:0 0'; st.appendChild(this.washHost);
		const mkSvg = () => { const v = this.mk('svg', { viewBox: '-700 -200 1400 400', preserveAspectRatio: 'xMidYMid meet' }, st); v.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;overflow:visible;pointer-events:none'; return v; };
		this.svgU = mkSvg(); this.svgU.style.zIndex = '1'; this.cv = document.createElement('canvas'); this.cv.style.cssText = 'position:absolute;inset:0;z-index:2;width:100%;height:100%;display:block;pointer-events:none'; st.appendChild(this.cv); this.svgO = mkSvg(); this.svgO.style.zIndex = '3'; /* paint, then hand-off lines, then dots and their rings, and the avatars always on top */
		this.built = false; this.paused = true; this.startT = setTimeout(() => { this.paused = !this.inView; this.started = true; this.wake(); }, 500); this.raf = requestAnimationFrame(this.frame);
		this.io = new IntersectionObserver(es => { this.inView = es[es.length - 1].isIntersecting; if (this.inView && !this.built) { this.built = true; this.build(); this.paint(0); if (this.still) this.fastForward(); this.makeWash(); } if (this.started) { this.paused = !this.inView; this.wake(); } }, { threshold: 0.15 }); this.io.observe(this.rootRef.current!); // nothing is built until the figure first scrolls into view
		this.ro = new ResizeObserver(() => requestAnimationFrame(() => { if (this.dead) return; const w = this.rootRef.current ? this.rootRef.current.offsetWidth : 0, n = w > 0 && w < 700; if (n !== this.state.narrow) this.setState({ narrow: n }, () => { if (this.built) { this.camStep(); this.drawDots(); } }); this.drawStrips(); if (this.built) { this.applyCam(); this.drawDots(); } const s2 = this.stageRef.current; if (this.built && s2 && s2.clientWidth && this.washSize !== s2.clientWidth + 'x' + s2.clientHeight + (this.state.narrow ? 'n' : '')) { clearTimeout(this.washT); this.washT = setTimeout(() => this.makeWash(), 300); } })); this.ro.observe(this.rootRef.current!);
		this.onKey = e => { if (e.key === 'Escape' && this.state.assumOpen) this.setState({ assumOpen: false }, () => this.wake()); }; window.addEventListener('keydown', this.onKey);
		const go = () => { this.hlT = setTimeout(() => { this.hlReady = true; this.syncEb(); }, 500); }; if (document.readyState === 'complete') go(); else window.addEventListener('load', go, { once: true });
	}
	componentDidUpdate(prev: Readonly<CareTeamOrbitProps>) { const p = this.props; if (!!p.colorblind !== !!prev.colorblind && this.built) this.makeWash(); if (p.model !== prev.model || p.patients !== prev.patients || p.nurses !== prev.nurses || !!p.colorblind !== !!prev.colorblind || p.motion !== prev.motion || p.tilt !== prev.tilt) { this.still = this.isReduced(); this.restart(); } this.applyFocus(); this.drawStrips(); this.syncEb(); if (this.built && (this.paused || this.still)) { this.camStep(); this.avStep(); this.drawDots(); } }
	componentWillUnmount() { this.dead = true; cancelAnimationFrame(this.raf); clearTimeout(this.startT); clearTimeout(this.hlT); clearTimeout(this.washT); if (this.wash) try { this.wash.destroy(); } catch { /* noop */ } if (this.io) this.io.disconnect(); if (this.ro) this.ro.disconnect(); if (this.onKey) window.removeEventListener('keydown', this.onKey); if (this.eb) for (const k in this.eb) this.eb[k] && this.eb[k].destroy();
		// Remove the imperatively appended stage layers, or a StrictMode dev
		// remount stacks a second orphaned set under the live sim.
		for (const el of [this.washHost, this.svgU, this.cv, this.svgO]) el && el.remove(); }
	syncEb() { if (!this.hlReady || this.dead || !this.rootRef.current) return; this.eb = this.eb || {}; const f = this.focusCols();
		this.roles().forEach((r, i) => { const k = String(i), on = !f || f.includes(i), el = this.rootRef.current!.querySelector<HTMLElement>('[data-eb="' + k + '"]'), cur = this.eb![k];
			if (on && el && el.offsetParent && (!cur || cur.el !== el)) { if (cur) cur.destroy(); this.eb![k] = WashHighlightFX.attach(el, { pigment: this.props.highlightPigment ?? 'hansa', trigger: 'view', threshold: 1, delay: 64, duration: this.isReduced() ? 1 : 650, mark: 'highlight', instantDry: true, instant: this.isReduced() }); if (this.eb![k]) this.eb![k].el = el; }
			else if (!on && cur) { this.eb![k] = null; const Ly = cur.layer; if (Ly) { Ly.style.transition = 'opacity 400ms ease'; Ly.style.opacity = '0'; } setTimeout(() => cur.destroy(), 450); } }); }

	renderVals() {
		const s = this.state, m = this.model(), hub = m === 'hub', C = this.cfg(), P = this.pal(), sim = s.sim || {}, roles = this.roles(), ink = 'var(--color-confetti-black)', dim = 'color-mix(in srgb,var(--color-confetti-black) 40%,transparent)';
		const fmtN = (n: number) => Number(n).toLocaleString('en-US'), f = this.focusCols(), narrow = s.narrow, n = roles.length;
		const L = narrow ? { aspect: '4/3', cols: 'minmax(0,1fr)', tap: '44px', tapOutline: '12px solid transparent', dayFlex: '1 1 100%' } : { cols: 'repeat(' + n + ',minmax(0,1fr))', tap: 'auto', tapOutline: 'none', dayFlex: 'none', aspect: '1400/400' };
		const hm = (mins: number) => { mins = Math.round(mins || 0); return Math.floor(mins / 60) + 'h ' + String(mins % 60).padStart(2, '0') + 'm'; };
		const perDay = Math.max(1, Math.round(C.N * (C.alertPct || 0) / 100)), pv = (i: number) => (sim.p && sim.p[i]) || [0, 0, 0, 0, 0];
		this.refFns = this.refFns || {}; const ref = (kind: 'd' | 'e', i: number) => this.refFns[kind + i] || (this.refFns[kind + i] = (el: HTMLCanvasElement | null) => { (kind === 'd' ? this.dayCv : this.eqCv)[i] = el; });
		const COPY: Record<string, [string, string, boolean]> = hub ? {
			ma: ['routes', 'Monitors ' + fmtN(C.N) + ' patients’ check-ins, reviews each one turning critical and routes it to the ' + (C.nurses === 1 ? 'nurse' : 'nurse with the fewest') + '. In between, she reviews medium-risk check-ins.', true],
			rn: [C.nurses === 1 ? 'resolves' : 'resolve', 'Actively manages about ' + C.crit + ' critical patients, calling each in turn, 20–30 minutes a call. Once stable, a patient goes back to monitoring.', false] } : {
			ma: ['monitors', 'Watches ' + fmtN(C.N) + ' patients around the clock. About ' + C.alertPct + '% send an alert each day; she reviews each one, then passes it to the nurse.', true],
			rn: ['calls', 'Calls each alert, 20–30 minutes a call, and clears about ' + (100 - C.escPct) + '% on the spot.', false],
			md: ['treats', 'Sees the ' + C.escPct + '% the nurse escalates, 30–45 minutes each. Most of the day stays free for them.', false] };
		const WHO: Record<string, string> = { ma: 'the assistant’s', rn: 'the nurse’s', md: 'the physician’s' };
		const cols = roles.map((r, i) => { const [word, text, cite] = COPY[r], v = pv(i), on = !f || f.includes(i), shown = narrow ? (f ? f[0] === i || (hub && f.includes(i) && i === f[0]) : i === 0) : true;
			const stats = r === 'ma' ? [{ label: 'Patients monitored', value: fmtN(C.N), of: '', color: ink }, { label: hub ? 'Criticals routed' : 'Alerts reviewed', value: String(v[1]), of: hub ? '' : ' / ' + perDay, color: hub ? P.rT : P.aT }]
				: r === 'md' ? [{ label: 'Escalations seen', value: String(v[0]), of: '', color: P.rT }, { label: 'Waiting', value: String(v[2]), of: '', color: ink }]
				: hub ? [{ label: 'Critical in care', value: String(v[2] + (v[0] ? 0 : 0)), of: '', color: P.rT }, { label: 'Resolved', value: String(v[1]), of: '', color: P.gT }]
				: [{ label: 'Alerts called', value: String(v[0]), of: '', color: P.aT }, { label: 'Cleared', value: String(v[1]), of: '', color: P.gT }];
			return { k: String(i), word, text, cite, color: on ? ink : dim, display: shown ? 'flex' : 'none', pDisplay: shown ? 'block' : 'none', stats, who: WHO[r] + (hub && C.nurses > 1 && r === 'rn' ? ' (' + i + ')' : ''), busy: hm(v[3]) + ' busy', dayRef: ref('d', i), eqRef: ref('e', i), dayAria: 'Where ' + WHO[r] + ' time went today', eqAria: 'Impactful work through ' + WHO[r] + ' day, 0 to 5' }; });
		const pill = (i: number) => { const on = f != null && f.includes(hub && i === 1 ? 1 : i) && !(s.final && s.manual == null); return { on, bg: on ? ink : 'transparent', fg: on ? 'var(--color-washes-paper)' : ink }; };
		const pick = (i: number) => () => this.setState({ manual: i });
		const legend = [{ c: P.a, l: 'Alert' }, { c: P.r, l: hub ? 'Critical' : 'High risk' }, { c: P.y, l: 'Medium risk' }, { c: P.g, l: 'Low risk' }, { c: 'color-mix(in srgb,var(--color-confetti-black) 16%,transparent)', l: 'Idle' }];
		if (hub) legend.shift();
		const mn = C.startMin + (sim.min || 0), H = Math.floor(mn / 60) % 24, clock = s.final ? (hub ? 'End of shift' : 'End of day') : ((H + 11) % 12 + 1) + ':' + String(mn % 60).padStart(2, '0') + (H < 12 ? ' am' : ' pm');
		const assumptions = hub ? [
			{ title: 'The team', items: ['One medical assistant (the hub) and ' + ['one nurse', 'two nurses', 'three nurses'][C.nurses - 1] + ' (the spokes), 9 am to 5 pm.', fmtN(C.N) + ' patients in routine monitoring; about 22% medium risk, the rest low.'] },
			{ title: 'The assistant', items: ['Reviews each patient turning critical, 5–10 minutes, then routes them to a nurse.', 'About ' + Math.round(C.newPerNurse * C.nurses) + ' patients turn critical a day.', 'Between those, reviews medium-risk check-ins in place, 3–6 minutes each.'] },
			{ title: 'The nurse', items: ['Starts the day with ' + C.crit + ' critical patients and calls them in turn, 20–30 minutes a call, one at a time.', 'After a call, about ' + Math.round(C.resolveP * 100) + '% are stable enough to go back to monitoring.'] }]
			: [
			{ title: 'The team', items: ['One medical assistant, one nurse and one physician, covering 24 hours.', fmtN(C.N) + ' patients in routine monitoring; about 22% medium risk, the rest low.'] },
			{ title: 'The assistant', items: ['About ' + C.alertPct + '% of patients send an alert each day (' + perDay + ').', 'Reviews each alert, 5–10 minutes, then passes it to the nurse; in between, reviews medium-risk check-ins in place, 3–6 minutes each.'] },
			{ title: 'The nurse and physician', items: ['The nurse calls each alert, 20–30 minutes, one at a time, and escalates ' + C.escPct + '%.', 'The physician sees each escalation, 30–45 minutes. Everyone else goes back to monitoring as low risk.'] }];
		assumptions.push({ title: 'Reading the figure', items: ['Each provider works with one patient at a time; that patient circles them closely, and the dots and bars below fill in as the time is spent.', 'Impactful work scores time by what it could change: alert 5, critical or high 4, medium 3, low 1, idle 0.', 'One simulated day lasts ' + this.daySec() + ' seconds (adjustable).'] });
		const aria = hub ? 'Animated figure: an assistant monitors ' + fmtN(C.N) + ' patients and routes new critical patients to ' + C.nurses + (C.nurses === 1 ? ' nurse' : ' nurses') + ', who call them one at a time. Below each provider, a strip shows how their day was spent.' : 'Animated figure: an assistant monitors ' + fmtN(C.N) + ' patients around the clock; alerts go to a nurse, who escalates about ' + C.escPct + '% to a physician. Below each provider, a strip shows how their day was spent.';
		return { showImpact: !!this.props.showImpact, L, isAcute: !hub, isHub: hub, nurseWord: ['a nurse', 'two nurses', 'three nurses'][(C.nurses || 1) - 1], resolveWord: hub && C.nurses === 1 ? 'resolves' : 'resolve', p0: pill(0), p1: pill(1), p2: pill(2), pick0: pick(0), pick1: pick(1), pick2: pick(2), cols, legend, clock, aria, assumptions,
			citeTitle: hub ? 'Hub-and-spoke panel' : 'Acute patient panel', citeSource: this.props.citeSource ?? 'Panel sizes and staffing from CareSignal’s care-model outcomes (see Outcomes). Call lengths and rates are modelling assumptions.', citeKey: 'care-team-' + m,
			skipLabel: s.final ? 'Replay' : 'Skip animation', skip: () => { if (!this.built) return; if (this.state.final) this.restart(); else { this.setState({ manual: null }); this.fastForward(); } },
			daySec: this.daySec(), daySecLabel: this.daySec() + ' s', setDaySec: (e: ChangeEvent<HTMLInputElement>) => this.setState({ daySec: +e.target.value }),
			assumOpen: !!s.assumOpen, openAssum: () => this.setState({ assumOpen: true }, () => this.wake()), closeAssum: () => this.setState({ assumOpen: false }, () => this.wake()) };
	}

	render() {
		const v = this.renderVals(), L = v.L;
		const mono12 = 'text-[12px] leading-[16px] tracking-[0.04em]';
		return (
			<div
				ref={this.rootRef}
				className="box-border flex w-full justify-center text-confetti-black"
				style={{ fontFamily: 'var(--font-body)' }}
			>
				<style>{CSS}</style>
				<figure className="m-0 box-border flex w-full max-w-[1136px] flex-col rounded-[16px] bg-washes-paper p-[24px]">
					<div className="flex flex-wrap items-center justify-between gap-x-[16px] gap-y-[8px]">
						<div className="flex items-center gap-[8px]">
							<Figure />
							<button
								type="button"
								onClick={v.openAssum}
								aria-label="Assumptions"
								title="Assumptions"
								className="inline-flex size-[20px] flex-none cursor-pointer items-center justify-center rounded-full border-[1.25px] border-confetti-black bg-transparent p-0 text-[13px] italic leading-none text-confetti-black hover:bg-confetti-black hover:text-washes-paper"
								style={{ outline: L.tapOutline, fontFamily: 'var(--font-kyoto)' }}
							>
								i
							</button>
						</div>
						<button
							type="button"
							onClick={v.skip}
							className={`cursor-pointer whitespace-nowrap border-0 bg-transparent p-0 text-confetti-black underline underline-offset-[3px] hover:decoration-2 ${mono12}`}
							style={{ minHeight: L.tap, fontFamily: 'var(--font-mono)' }}
						>
							{v.skipLabel}
						</button>
					</div>

					{v.isAcute ? (
						<h2 className="type-headline-small m-0 mt-[8px] max-w-full text-left text-confetti-black [text-wrap:balance]">
							A 24/7 acute team’s day:
							<br />
							an assistant{' '}
							<span className="whitespace-nowrap">
								<Pill p={v.p0} onClick={v.pick0}>monitors</Pill>,
							</span>{' '}
							a nurse{' '}
							<span className="whitespace-nowrap">
								<Pill p={v.p1} onClick={v.pick1}>calls</Pill>,
							</span>{' '}
							and a physician <Pill p={v.p2} onClick={v.pick2}>treats</Pill>
						</h2>
					) : (
						<h2 className="type-headline-small m-0 mt-[8px] max-w-full text-left text-confetti-black [text-wrap:balance]">
							A hub-and-spoke team’s day:
							<br />
							an assistant{' '}
							<span className="whitespace-nowrap">
								<Pill p={v.p0} onClick={v.pick0}>routes</Pill>,
							</span>{' '}
							{v.nurseWord}{' '}
							<span className="whitespace-nowrap">
								<Pill p={v.p1} onClick={v.pick1}>{v.resolveWord}</Pill>
							</span>
						</h2>
					)}

					<div className="mt-[20px] grid" style={{ gridTemplateColumns: L.cols, gap: '8px 24px' }}>
						{v.cols.map(c => (
							<p
								key={c.k}
								className="m-0 text-left text-[15px] leading-[22px] [text-wrap:pretty]"
								style={{ display: c.pDisplay, fontFamily: 'var(--font-body)', color: c.color, transition: 'color 400ms ease' }}
							>
								<span className="type-eyebrow mb-[4px] block text-confetti-black">
									<span data-eb={c.k}>{c.word}</span>
								</span>
								{c.text}
								{c.cite ? (
									<Citation title={v.citeTitle} source={v.citeSource} citeKey={v.citeKey} />
								) : null}
							</p>
						))}
					</div>

					<div
						ref={this.stageRef}
						role="img"
						aria-label={v.aria}
						className="relative mt-[12px] w-full overflow-hidden"
						style={{
							aspectRatio: L.aspect,
							WebkitMaskImage: STAGE_MASK,
							WebkitMaskComposite: 'source-in',
							maskImage: STAGE_MASK,
							maskComposite: 'intersect',
						}}
					/>

					<div className="mt-[12px] grid" style={{ gridTemplateColumns: L.cols, gap: '20px 24px' }}>
						{v.cols.map(c => (
							<div
								key={c.k}
								className="min-w-0 flex-col gap-[16px]"
								style={{ display: c.display, color: c.color, transition: 'color 400ms ease' }}
							>
								<div className="flex flex-wrap" style={{ gap: '12px 24px' }}>
									{c.stats.map(st => (
										<div key={st.label} className="flex min-w-0 flex-col gap-[6px]">
											<span className={`whitespace-nowrap ${mono12}`} style={{ fontFamily: 'var(--font-mono)', color: DIM75 }}>
												{st.label}
											</span>
											<span
												className="whitespace-nowrap leading-none [font-variant-numeric:tabular-nums]"
												style={{ fontFamily: 'var(--font-kyoto)', fontSize: 'clamp(22px,3vw,40px)', color: st.color }}
											>
												{st.value}
												<span style={{ color: DIM45 }}>{st.of}</span>
											</span>
										</div>
									))}
								</div>
								<div className="flex flex-col gap-[6px]">
									<div className="flex flex-wrap items-baseline justify-between" style={{ gap: '2px 12px' }}>
										<span className={mono12} style={{ fontFamily: 'var(--font-mono)', color: DIM75 }}>
											Where time went
										</span>
										<span className={`whitespace-nowrap [font-variant-numeric:tabular-nums] ${mono12}`} style={{ fontFamily: 'var(--font-mono)', color: DIM75 }}>
											{c.busy}
										</span>
									</div>
									<canvas ref={c.dayRef} aria-label={c.dayAria} className="block h-[10px] w-full" />
								</div>
								{v.showImpact ? (
									<div className="flex flex-col gap-[6px]">
										<span className={`whitespace-nowrap ${mono12}`} style={{ fontFamily: 'var(--font-mono)', color: DIM75 }}>
											Impact over time
										</span>
										<canvas ref={c.eqRef} aria-label={c.eqAria} className="block h-[32px] w-full" />
									</div>
								) : null}
							</div>
						))}
					</div>

					<div className="mt-[20px] flex flex-wrap items-center justify-between" style={{ gap: '12px 24px' }}>
						<div
							aria-label="Legend"
							className={`flex flex-wrap items-center ${mono12}`}
							style={{ gap: '8px 20px', fontFamily: 'var(--font-mono)', color: DIM75 }}
						>
							{v.legend.map(lg => (
								<span key={lg.l} className="inline-flex items-center gap-[8px] whitespace-nowrap">
									<span className="inline-block size-[9px] flex-none rounded-full" style={{ background: lg.c }} />
									{lg.l}
								</span>
							))}
						</div>
						<div
							className={`flex flex-wrap items-center ${mono12}`}
							style={{ gap: '12px 24px', flex: L.dayFlex, fontFamily: 'var(--font-mono)', color: DIM75 }}
						>
							<span className="whitespace-nowrap text-confetti-black [font-variant-numeric:tabular-nums]">{v.clock}</span>
							<label
								className="flex items-center gap-[10px] whitespace-nowrap"
								style={{ flex: L.dayFlex, minHeight: L.tap }}
							>
								Day length
								<input
									type="range"
									data-day-slider=""
									min={15}
									max={90}
									step={5}
									value={v.daySec}
									onChange={v.setDaySec}
									aria-label="Seconds per simulated day"
									className="m-0 w-[120px] min-w-0 cursor-pointer bg-transparent"
									style={{ flex: L.dayFlex }}
								/>
								<span className="min-w-[32px] text-right text-confetti-black [font-variant-numeric:tabular-nums]">
									{v.daySecLabel}
								</span>
							</label>
						</div>
					</div>
				</figure>

				{/* Portaled to <body>: the sheet overlay's transform would otherwise
				    make the sheet the fixed containing block, confining the
				    backdrop and clipping the panel. */}
				{v.assumOpen ? createPortal(
					<div
						role="dialog"
						aria-modal="true"
						aria-label="Assumptions"
						onClick={v.closeAssum}
						className="fixed inset-0 z-[100] flex items-center justify-center p-[24px] text-confetti-black"
						style={{ background: 'color-mix(in srgb,var(--color-confetti-black) 25%,transparent)', fontFamily: 'var(--font-body)' }}
					>
						<div
							onClick={e => e.stopPropagation()}
							className="box-border w-full max-w-[944px] overflow-auto rounded-[16px] bg-white p-[40px]"
							style={{ maxHeight: 'calc(100vh - 48px)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
						>
							<div className="flex flex-col gap-[32px]">
								<div className="flex items-center justify-between gap-[16px]">
									<h2 className="m-0 text-[32px] font-normal leading-[1.1]" style={{ fontFamily: 'var(--font-kyoto)' }}>
										Assumptions
									</h2>
									<Button variant="outline" label="Close" onClick={v.closeAssum} />
								</div>
								<div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,260px),1fr))', gap: '40px 56px' }}>
									{v.assumptions.map(grp => (
										<div key={grp.title} className="flex flex-col gap-[14px]">
											<span className={mono12} style={{ fontFamily: 'var(--font-mono)', color: DIM75 }}>
												{grp.title}
											</span>
											<ul className="m-0 flex flex-col gap-[8px] p-0 pl-[18px] text-[16px] leading-[24px] [text-wrap:pretty]">
												{grp.items.map(it => (
													<li key={it}>{it}</li>
												))}
											</ul>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>,
					document.body,
				) : null}
			</div>
		);
	}
}
