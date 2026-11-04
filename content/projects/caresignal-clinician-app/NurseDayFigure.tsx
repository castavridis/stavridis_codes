import Text from '../../../src/components/Text';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import Figure from '../../../src/features/projects/components/figures/Figure';
import { prefersReducedMotion } from '../../../src/features/projects/components/figures/motion';
import {
	mount,
	type NurseOrbitHandle,
	type NurseOrbitParams,
	type NurseOrbitStats,
} from '../../../src/features/projects/components/figures/orbit/nurse-orbit.js';

import { Citation, IMG } from './shared';

// Figure 1 — "A centralized nurse care manager's shift before and after
// CareSignal", ported from the design handoff's "Nurse Day Complete.dc.html"
// dual-scene composition. Two nurse-orbit engines rest at their finished
// days side by side; the seam between the two sheets is feathered on a
// slant, each portrait wears its own BEFORE / AFTER seal (or, in
// ribbon="infinity day done", one figure-8 "DAY DONE" band runs round both
// portraits, crossing at the seam). play() re-runs the before day from the
// morning; playAfter() slides the after half to centre and replays it;
// stop() parts the portraits back to their places and the finished days
// fade in under them.

const PAPER = '#fdfbf5';
const GREEN_TEXT = '#5f8a2e';
const INK = 'var(--color-confetti-black)';
const INK_75 = 'color-mix(in srgb, var(--color-confetti-black) 75%, transparent)';
const INK_60 = 'color-mix(in srgb, var(--color-confetti-black) 60%, transparent)';
const INK_55 = 'color-mix(in srgb, var(--color-confetti-black) 55%, transparent)';
const INK_35 = 'color-mix(in srgb, var(--color-confetti-black) 35%, transparent)';

const ARIA_BEFORE =
	'Before CareSignal, end of day: most of his 100 patients are still unknown; the few he reached by phone keep drawing their orbits in their status colour.';
const ARIA_AFTER =
	'After CareSignal, end of day: every patient’s status is known; the patients whose status he resolved draw their orbits.';

// The activity ring around each portrait, keyed by the engine's onCall.
// The before half narrates the whole replay (it morphs into the after day);
// the after half, replaying alone, never announces the morph.
const ACT_BEFORE: Record<string, string> = {
	idle: 'Between calls',
	ringing: 'Ringing',
	talking: 'On a call',
	done: 'End of shift',
	lunch: 'At lunch',
	morph: 'Statuses up to date',
	final: 'Statuses up to date',
};
const ACT_AFTER: Record<string, string> = {
	idle: 'Between calls',
	ringing: 'Ringing',
	talking: 'On a call',
	done: 'End of shift',
	lunch: 'At lunch',
	morph: '',
	final: '',
};

const LEGEND: Array<[string, string]> = [
	['Alert', '#108ba0'],
	['High risk', '#e5562e'],
	['Medium risk', '#f9ac31'],
	['Low risk', '#b2d07f'],
	['No answer', INK],
	['Unknown', INK_35],
];

type Stat = { label: string; value: string; of: string; green?: boolean };
type StatsSource = Partial<NurseOrbitStats> | null;

const pct = (n: number, of: number) => `${of ? Math.round((n / of) * 100) : 0}%`;

function beforeStats(s: StatsSource): Stat[] {
	const red = s?.red ?? 0;
	const yellow = s?.yellow ?? 0;
	const green = s?.green ?? 0;
	const placed = s?.placed ?? 0;
	const known = red + yellow + green;
	return [
		{ label: 'Statuses known', value: String(known), of: ' / 100' },
		{ label: 'Issues resolved', value: String(red + yellow), of: '', green: true },
		{ label: 'Calls placed', value: String(placed), of: '' },
		{ label: 'Calls answered', value: pct(known, placed), of: '' },
	];
}

function afterStats(s: StatsSource): Stat[] {
	const known = ((s?.all ?? '').match(/[^-u]/g) ?? []).length;
	const res = (s?.resolved ?? 0) + (s?.yellows ?? 0);
	const placed = s?.placed ?? 0;
	return [
		{ label: 'Statuses known', value: known.toLocaleString('en-US'), of: ' / 1,600' },
		{ label: 'Issues resolved', value: String(res), of: '', green: true },
		{ label: 'Calls placed', value: String(placed), of: '' },
		{ label: 'Calls answered', value: pct(res, placed), of: '' },
	];
}

// liveStats() in the reference uses the same formulas, picked by phase.
const statsFor = (s: StatsSource): Stat[] => (s?.phase === 'after' ? afterStats(s) : beforeStats(s));

// The page data-props defaults run through the reference params0() builder
// (CareSignal Application Case Study.dc.html); day-complete shift length is
// 15 s. Mobile swaps to the bird's-eye tune, as the reference does.
function engineParams(daySeconds: number, mobile: boolean, reduced: boolean): NurseOrbitParams {
	const p: NurseOrbitParams = {
		greyMix: 0.64,
		arrangement: 'organic',
		afterConnectRange: true,
		daySeconds,
		connectRate: 0.35,
		alertConnect: 0.85,
		alertRate: 1.5,
		missMinutes: 2,
		holdSeconds: 4,
		flocking: 0.5,
		orbitSpeed: 0.6,
		massShape: 'rings',
		startAt: 'before',
		afterDays: 'tuesday',
		ink: 'trails',
		blend: 'multiply',
		greyInk: 0.35,
		startDelay: 0.3,
		trailWidth: 0.5,
		maxTrail: 0.6,
		callTrail: true,
		medium: 'glaze',
		yellowMinutes: 12,
		paper: PAPER,
		rose: '#a50e53',
		hansa: '#e3af08',
		cerulean: '#108ba0',
		glazeDye: 0.5,
		glazeDyeAfter: 0.4,
		pigmentLoad: 1,
		pigmentLoadAfter: 1.5,
		waterLoad: 0.9,
		granulation: 0.9,
		edgeDarkening: true,
		loadRed: 0.01,
		loadYellow: 0.03,
		loadGreen: 0.02,
		mixRedRose: 1,
		mixRedHansa: 0.3,
		mixRedCerulean: 0,
		mixYellowRose: 0.04,
		mixYellowHansa: 0.85,
		mixYellowCerulean: 0,
		mixGreenRose: 0,
		mixGreenHansa: 0.55,
		mixGreenCerulean: 0.3,
		afterWash: 'calls',
		afterSpeed: 0.5,
		wobble: 0.25,
		sealTone: 'light',
		dark: false,
		wetness: 'wetOnWet',
		quality: 'high',
		...(mobile
			? {
					view: 'birdseye',
					mobile: true,
					tiltX: 0,
					tiltY: 0,
					tiltZ: 0,
					tiltXAfter: 0,
					tiltYAfter: 0,
					tiltZAfter: 0,
					centerX: 0,
					centerY: 0,
					centerZ: 0,
					centerXAfter: 0,
					centerYAfter: 0,
					centerZAfter: 0,
					ringMin: 1.35,
					ringMax: 3.6,
					ringMinAfter: 3.05,
					ringMaxAfter: 4.45,
				}
			: {
					view: 'orbit',
					mobile: false,
					tiltX: 16,
					tiltY: 0,
					tiltZ: -18,
					tiltXAfter: 45,
					tiltYAfter: 0,
					tiltZAfter: 0,
					centerX: 0.25,
					centerY: 0.25,
					centerZ: -0.05,
					centerXAfter: 0,
					centerYAfter: 0,
					centerZAfter: 0,
					ringMin: 0.75,
					ringMax: 3.4,
					ringMinAfter: 1.2,
					ringMaxAfter: 5,
				}),
	};
	if (reduced) Object.assign(p, { still: true, orbitSpeed: 0, wobble: 0, flocking: 0 });
	return p;
}

// Inline pill button inside the heading ("before" / "after"). Active pill:
// ink fill, paper text; inactive: transparent with ink text.
function PillButton({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`pointer-events-auto inline-block cursor-pointer rounded-full border-[1.25px] border-confetti-black transition-colors duration-200 hover:bg-confetti-black hover:text-[#fdfbf5] ${
				active ? 'bg-confetti-black text-[#fdfbf5]' : 'bg-transparent text-confetti-black'
			}`}
			style={{ font: 'inherit', lineHeight: 1.15, margin: '0 0.08em', padding: '0 0.38em 0.06em' }}
		>
			{children}
		</button>
	);
}

function StatBlock({ stat, align }: { stat: Stat; align: 'start' | 'end' }) {
	return (
		<div className={`flex flex-col gap-[4px] ${align === 'end' ? 'items-end' : 'items-start'}`}>
			<span
				className="whitespace-nowrap text-[12px] leading-[16px] tracking-[0.04em]"
				style={{ fontFamily: 'var(--font-mono)', color: INK_75 }}
			>
				{stat.label}
			</span>
			<span
				className="whitespace-nowrap leading-none [font-variant-numeric:tabular-nums]"
				style={{
					fontFamily: 'var(--font-kyoto)',
					fontSize: 'clamp(22px, 3vw, 40px)',
					color: stat.green ? GREEN_TEXT : INK,
				}}
			>
				{stat.value}
				{stat.of ? <span style={{ color: INK_55 }}>{stat.of}</span> : null}
			</span>
		</div>
	);
}

const PlayIcon = () => (
	<svg aria-hidden="true" width="9" height="10" viewBox="0 0 9 10" className="block flex-none">
		<path d="M1 1.2v7.6a.6.6 0 0 0 .9.5l6.3-3.8a.6.6 0 0 0 0-1L1.9.7a.6.6 0 0 0-.9.5z" fill="currentColor" />
	</svg>
);
const FinishIcon = () => (
	<svg aria-hidden="true" width="12" height="10" viewBox="0 0 12 10" className="block flex-none">
		<path d="M.8 1.2v7.6a.6.6 0 0 0 .9.5l6.3-3.8a.6.6 0 0 0 0-1L1.7.7a.6.6 0 0 0-.9.5z" fill="currentColor" />
		<rect x="9.4" y=".6" width="1.8" height="8.8" rx=".6" fill="currentColor" />
	</svg>
);

// Internal machine: everything the imperative scene choreography mutates,
// mirroring the reference DCLogic instance fields.
type Machine = {
	dead: boolean;
	fx: { before?: NurseOrbitHandle; after?: NurseOrbitHandle };
	env: { mobile: boolean; reduced: boolean };
	p0: NurseOrbitParams;
	daySec: number;
	ribbon: 'infinity day done' | 'before and after';
	playing: boolean; // dc this.playing — true through the stop() fade-out
	playingS: boolean; // dc this.state.playing — false from the moment stop() starts
	afterCue: boolean;
	resting: boolean;
	aLive: boolean;
	aSlide: boolean;
	aMask: [string, string, string] | null;
	seq: number[];
	seqRunning: boolean;
	ending: boolean;
	endT: number | null;
	liveT: number | null;
	scT: number | null;
	lb: NurseOrbitStats | null;
	la: NurseOrbitStats | null;
	bDone: NurseOrbitStats | null;
	bLast: Partial<NurseOrbitStats> | null;
	act: string | null;
	actA: string | null;
	sJb: string;
	sJa: string;
	R: number;
	W: number;
	oB: number;
	oA: number;
	F: number;
	th: number;
	side: boolean;
	pAx: number;
	wB: number;
	wA: number;
	portY: number | null;
	sp: number;
	infK: string | null;
	infM: boolean | null;
	ribShown: boolean | null;
	lblK: string | null;
	infL: number;
	infS2: number;
	ringC: number;
	infRaf: number;
	revealAnim: Animation | null;
	fadeAnim: Animation | null;
};

type Api = {
	spread: () => void;
	play: () => void;
	playAfter: () => void;
	stop: () => void;
	skipAfter: () => void;
	drawRibbon: () => void;
	syncRibbon: () => void;
};

let uid = 0;

export function NurseDayFigure({
	onAssumptions,
	ribbon = 'before and after',
	distanceFromSeam = 220,
	offsetY = 26,
	seamAngle = 20,
	photoGap = -16,
}: {
	onAssumptions?: () => void;
	/** 'before and after': each portrait wears its own labelled seal with the
	 * slanted seam feather; 'infinity day done': one figure-8 "DAY DONE" band
	 * runs round both portraits, crossing at the seam. */
	ribbon?: 'infinity day done' | 'before and after';
	distanceFromSeam?: number;
	offsetY?: number;
	seamAngle?: number;
	photoGap?: number;
}) {
	const cardRef = useRef<HTMLDivElement>(null);
	const hdRef = useRef<HTMLDivElement>(null);
	const ftRef = useRef<HTMLDivElement>(null);
	const bRef = useRef<HTMLDivElement>(null); // before engine stage
	const aRef = useRef<HTMLDivElement>(null); // after engine stage
	const infRef = useRef<SVGSVGElement>(null); // the ∞ ribbon overlay
	const pbRef = useRef<HTMLImageElement>(null); // resting portrait, before face
	const paRef = useRef<HTMLImageElement>(null); // resting portrait, after face
	const viewRef = useRef<HTMLDivElement>(null); // clipping viewport around the grid

	const [idp] = useState(() => `ndf${uid++}`);
	const [playingS, setPlayingS] = useState(false);
	const [afterCueS, setAfterCueS] = useState(false);
	const [sb, setSb] = useState<NurseOrbitStats | null>(null);
	const [sa, setSa] = useState<NurseOrbitStats | null>(null);
	const [daySec, setDaySec] = useState(15);
	const [stacked, setStacked] = useState(false);
	const [pick, setPick] = useState<'b' | 'a'>('a'); // phones: which half shows at rest

	const m = useRef<Machine>({
		dead: false,
		fx: {},
		env: { mobile: false, reduced: false },
		p0: {},
		daySec: 15,
		ribbon,
		playing: false,
		playingS: false,
		afterCue: false,
		resting: false,
		aLive: false,
		aSlide: false,
		aMask: null,
		seq: [],
		seqRunning: false,
		ending: false,
		endT: null,
		liveT: null,
		scT: null,
		lb: null,
		la: null,
		bDone: null,
		bLast: null,
		act: null,
		actA: null,
		sJb: '',
		sJa: '',
		R: 0,
		W: 0,
		oB: 0,
		oA: 0,
		F: 0,
		th: 0,
		side: true,
		pAx: 0,
		wB: 0,
		wA: 0,
		portY: null,
		sp: 0,
		infK: null,
		infM: null,
		ribShown: null,
		lblK: null,
		infL: 0,
		infS2: 0,
		ringC: 0,
		infRaf: 0,
		revealAnim: null,
		fadeAnim: null,
	});
	const api = useRef<Api>(null as unknown as Api);
	const M = m.current;
	M.ribbon = ribbon;

	const clearSeq = () => {
		for (const t of M.seq) clearTimeout(t);
		M.seq = [];
		M.seqRunning = false;
	};
	// A pending end-of-day return to the finished view must not fire into a
	// freshly started run.
	const clearEnding = () => {
		M.ending = false;
		if (M.endT != null) {
			clearTimeout(M.endT);
			M.endT = null;
		}
	};
	const clearCue = () => {
		if (M.scT != null) {
			clearInterval(M.scT);
			M.scT = null;
		}
	};

	const posB = (x: number) => `${x - M.wB / 2}px`;
	const posA = (x: number) => `${x - M.pAx - M.wA / 2}px`;

	// Each nurse slides off the seam by its own distance: kissing portraits in
	// ∞ mode, distanceFromSeam apart in seals mode, centred per cell stacked.
	const spread = () => {
		if (M.seqRunning) return; // the finished-day sequence owns positions until it lands
		const b = bRef.current;
		const a = aRef.current;
		if (!b || !a) return;
		const sv = b.querySelector('svg[width]');
		const R = sv ? +(sv.getAttribute('width') ?? 0) / 2 - 18 : 0; // the seal is sized rAv + 18 round the photo
		if (!R) {
			if ((M.sp = (M.sp || 0) + 1) < 600) requestAnimationFrame(() => !M.dead && api.current.spread());
			return;
		}
		M.sp = 0;
		const pB = b.parentElement as HTMLElement;
		const pA = a.parentElement as HTMLElement;
		const inf = M.ribbon === 'infinity day done';
		const side = pB.offsetTop === pA.offsetTop;
		const g = photoGap / 2;
		const half = inf
			? 0
			: !side
				? pB.offsetWidth / 2 // stacked (phones): each nurse centred in its cell
				: distanceFromSeam || pB.offsetWidth / 2;
		const oB = half || (R + 8.5 + Math.max(8, 24 + g)); // ∞: the bands kiss right at the seam
		const W = pB.offsetWidth;
		const th = (seamAngle * Math.PI) / 180;
		const F = side ? Math.round(32 + (pB.offsetHeight / 2) * Math.tan(th)) : 0; // overlap sized so the slanted feather crosses the card's centre at mid-height
		M.F = F;
		M.W = W;
		M.side = side;
		M.pAx = W - F;
		M.wB = 2 * W;
		M.wA = 2 * W;
		M.oB = oB;
		M.oA = oB;
		M.th = th;
		M.R = R;
		b.style.top = a.style.top = `${offsetY}px`;
		b.style.width = side ? `${M.wB}px` : '200%';
		b.style.left = side ? posB(M.playing ? W : W - oB) : `${-oB}px`;
		pA.style.marginLeft = `${-F}px`; // the after half reaches F px over the before half and feathers in
		pA.style.height = side ? `${pB.offsetHeight}px` : '';
		a.style.width = side ? `${M.wA}px` : '200%';
		if (!M.aSlide) a.style.left = side ? posA(W + oB) : `calc(-100% + ${oB}px)`;
		if (!M.playing) {
			pB.style.overflow = side ? 'visible' : 'hidden';
			pB.style.zIndex = side ? '0' : '';
		}
		if (!side) {
			pA.style.maskImage = 'none';
			pA.style.setProperty('-webkit-mask-image', 'none');
			M.infK = null;
		} else if (!inf && !M.aSlide) {
			// seals mode: the ∞ loop doesn't run, so the slanted seam feather is set here
			const h = pA.offsetHeight;
			const sn = Math.sin(th);
			const cs = Math.cos(th);
			const mask = `linear-gradient(${90 + seamAngle}deg, transparent ${(h * sn).toFixed(1)}px, #000 ${(h * sn + 64 * cs).toFixed(1)}px)`;
			pA.style.maskImage = mask;
			pA.style.setProperty('-webkit-mask-image', mask);
			pA.style.maskComposite = '';
			pA.style.setProperty('-webkit-mask-composite', '');
		}
	};

	// Ribbon version: one continuous "DAY DONE" line round the ∞, or each
	// portrait labelled BEFORE / AFTER by its own engine seal.
	const syncRibbon = () => {
		const svg = infRef.current;
		if (!svg) return;
		const inf = M.ribbon === 'infinity day done';
		if (inf === M.infM) return;
		M.infM = inf;
		for (const t of svg.querySelectorAll('[data-inf]')) t.setAttribute('opacity', inf ? '1' : '0');
		const g = svg.querySelector('[data-rings]') as SVGGElement | null;
		if (g) g.style.display = inf ? 'none' : '';
		for (const u of svg.querySelectorAll('use'))
			if (!u.closest('defs') && !u.closest('[data-ringband]'))
				(u as SVGUseElement).style.display = inf ? '' : 'none';
		const rb = svg.querySelector('[data-ringband]') as SVGGElement | null;
		if (rb) rb.style.display = inf ? 'none' : '';
		const rv = svg.querySelector('[data-reveal]');
		if (rv) rv.setAttribute('href', inf ? `#${idp}-inf` : `#${idp}-rings`);
		M.ribShown = null;
	};

	// Bands stroke on along the figure 8, letters fade in behind them.
	const drawRibbon = () => {
		const svg = infRef.current;
		if (!svg) return;
		const L = M.infL;
		if (!L || prefersReducedMotion()) {
			svg.style.opacity = '1';
			return;
		}
		const mk = svg.querySelector('[data-reveal]') as SVGUseElement | null;
		const p = svg.querySelector(
			M.ribbon === 'infinity day done' ? `#${idp}-inf` : `#${idp}-rings`,
		) as SVGPathElement | null;
		const len = (p && p.getTotalLength && p.getTotalLength()) || L;
		if (!mk) {
			svg.style.opacity = '1';
			return;
		}
		M.revealAnim?.cancel();
		M.fadeAnim?.cancel();
		const da = `${len} ${len + 1}`;
		mk.style.strokeDasharray = da;
		mk.style.strokeDashoffset = String(len);
		svg.style.transition = 'none';
		svg.style.opacity = '1';
		M.fadeAnim = svg.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 350, easing: 'ease-out' });
		M.revealAnim = mk.animate(
			[
				{ strokeDasharray: da, strokeDashoffset: String(len) },
				{ strokeDasharray: da, strokeDashoffset: '0' },
			],
			{ duration: 1600, easing: 'cubic-bezier(.45,0,.25,1)' },
		);
		M.revealAnim.onfinish = () => {
			mk.style.strokeDasharray = '';
			mk.style.strokeDashoffset = '';
		};
	};

	// Leave the after-half replay so the before half can take the stage; the
	// after half goes back to its finished day, hidden.
	const exitALive = () => {
		const a = aRef.current;
		const fa = M.fx.after;
		if (!M.aLive || !a) return;
		M.aLive = false;
		M.aSlide = false;
		M.actA = '';
		if (M.liveT != null) clearTimeout(M.liveT);
		clearEnding();
		const pA = a.parentElement as HTMLElement;
		if (M.aMask) {
			pA.style.maskImage = M.aMask[0];
			pA.style.setProperty('-webkit-mask-image', M.aMask[1]);
			pA.style.overflow = M.aMask[2] || 'hidden';
			M.aMask = null;
		}
		a.style.transition = 'opacity 300ms ease';
		a.style.opacity = '0';
		a.style.pointerEvents = 'none';
		if (fa) {
			fa.setLabel('');
			fa.rest('tuesday');
		}
		M.fx.before?.setPaused(false);
		M.afterCue = false;
		setAfterCueS(false);
	};

	// The after half fades away; the before half slides to centre and its day
	// runs again from the morning.
	const play = () => {
		const b = bRef.current;
		const fb = M.fx.before;
		if (!b || !fb || !aRef.current || !infRef.current) return;
		exitALive();
		const pB = b.parentElement as HTMLElement;
		const pA = aRef.current.parentElement as HTMLElement;
		const ms = prefersReducedMotion() ? 0 : 600;
		if (M.liveT != null) clearTimeout(M.liveT);
		clearSeq();
		clearEnding();
		clearCue();
		for (const im of [pbRef.current, paRef.current])
			if (im) {
				im.style.display = 'none';
				im.style.opacity = '0';
			}
		b.style.opacity = '1';
		M.bLast = null;
		pA.style.zIndex = '8';
		M.playing = true;
		M.playingS = true;
		setPlayingS(true);
		for (const el of [aRef.current, infRef.current] as const) {
			(el as HTMLElement | SVGSVGElement).style.transition = `opacity ${ms}ms ease`;
			(el as HTMLElement | SVGSVGElement).style.opacity = '0';
			(el as HTMLElement | SVGSVGElement).style.pointerEvents = 'none';
		}
		pB.style.overflow = 'visible';
		pB.style.zIndex = '7';
		b.style.pointerEvents = '';
		b.style.transition = `left ${ms}ms cubic-bezier(.4,0,.2,1)`;
		b.style.left = M.side ? posB(M.W) : '0px';
		M.act = null;
		fb.restart();
		M.liveT = window.setTimeout(() => {
			if (M.playing) M.fx.after?.setPaused(true);
		}, ms);
	};

	// Skip link while the after replay runs: restart the after day.
	const restartALive = () => {
		const fa = M.fx.after;
		if (!fa || !M.aLive) return;
		clearEnding();
		M.la = { phase: 'after' } as NurseOrbitStats;
		fa.playFrom('tuesday');
		fa.snapCam?.(1);
	};

	const skipAfter = () => {
		if (M.aLive) {
			restartALive();
			return;
		}
		const fb = M.fx.before;
		if (!fb || !M.playing) return;
		clearEnding();
		M.bLast = { ...(M.bDone || M.lb || {}), phase: 'before' };
		fb.playFrom('tuesday');
	};

	// Stacked halves can't slide: run the whole story in the before cell and
	// jump it ahead to the after day as soon as it's going.
	const skipAfterSoon = () => {
		let n = 0;
		clearCue();
		M.scT = window.setInterval(() => {
			if (M.dead || ++n > 60) {
				clearCue();
				return;
			}
			if (M.playing) {
				clearCue();
				api.current.skipAfter();
			}
		}, 50);
	};

	// The finished after half slides left to centre and replays its own day
	// there; the before half is left untouched (faded), so its day and stats
	// stay exactly as generated on load.
	const playAfter = () => {
		const b = bRef.current;
		const a = aRef.current;
		const fa = M.fx.after;
		if (!b || !a || !fa || !infRef.current) return;
		if (!M.side) {
			play();
			skipAfterSoon();
			return;
		}
		const pA = a.parentElement as HTMLElement;
		const ms = prefersReducedMotion() ? 0 : 600;
		if (M.liveT != null) clearTimeout(M.liveT);
		clearSeq();
		clearEnding();
		clearCue();
		for (const im of [pbRef.current, paRef.current])
			if (im) {
				im.style.display = 'none';
				im.style.opacity = '0';
			}
		M.aSlide = true;
		M.aLive = true;
		M.aMask = [pA.style.maskImage, pA.style.getPropertyValue('-webkit-mask-image'), pA.style.overflow];
		pA.style.maskImage = 'none';
		pA.style.setProperty('-webkit-mask-image', 'none');
		pA.style.overflow = 'visible';
		pA.style.zIndex = '8';
		for (const el of [b, infRef.current] as const) {
			(el as HTMLElement | SVGSVGElement).style.transition = `opacity ${Math.min(ms, 400)}ms ease`;
			(el as HTMLElement | SVGSVGElement).style.opacity = '0';
			(el as HTMLElement | SVGSVGElement).style.pointerEvents = 'none';
		}
		a.style.opacity = '1';
		a.style.transition = `left ${ms}ms cubic-bezier(.4,0,.2,1)`;
		a.style.left = posA(M.W);
		M.bLast = { ...(M.bDone || M.lb || {}), phase: 'before' };
		M.la = { phase: 'after' } as NurseOrbitStats;
		M.playing = true;
		M.playingS = true;
		M.afterCue = true;
		setPlayingS(true);
		setAfterCueS(true);
		M.act = null;
		M.liveT = window.setTimeout(() => {
			if (!M.playing) return;
			M.fx.before?.setPaused(true);
			fa.playFrom('tuesday');
			fa.snapCam?.(1); // same nurse, no portrait swap
		}, ms);
	};

	// Back to the finished day: the live scene fades away leaving only the
	// portrait; the two portraits part from the centre to their places; both
	// days fade in under them; the ribbon draws itself.
	const stop = () => {
		const b = bRef.current;
		const a = aRef.current;
		const fb = M.fx.before;
		const fa = M.fx.after;
		const iB = pbRef.current;
		const iA = paRef.current;
		const svg = infRef.current;
		if (!b || !a || !fb || !iB || !iA || !svg) return;
		const R = prefersReducedMotion();
		clearSeq();
		clearEnding();
		clearCue();
		M.aSlide = false;
		if (M.aMask) {
			const pA0 = a.parentElement as HTMLElement;
			pA0.style.maskImage = M.aMask[0];
			pA0.style.setProperty('-webkit-mask-image', M.aMask[1]);
			pA0.style.overflow = M.aMask[2] || 'hidden';
			M.aMask = null;
		}
		M.seqRunning = true;
		M.playingS = false;
		M.afterCue = false;
		setPlayingS(false);
		setAfterCueS(false);
		fb.setLabel('');
		fa?.setPaused(false);
		const W = M.W || (b.parentElement as HTMLElement).offsetWidth;
		const r = M.R || 72;
		const y = M.portY ?? b.offsetTop + b.offsetHeight / 2;
		const at = (t: number, fn: () => void) =>
			M.seq.push(
				window.setTimeout(
					() => {
						if (!M.dead && !M.playingS) fn();
					},
					R ? 0 : t,
				),
			);
		const ease = 'cubic-bezier(.4,0,.2,1)';
		const put = (im: HTMLImageElement, x: number, ms: number) => {
			im.style.transition = ms ? `transform ${ms}ms ${ease}, opacity 250ms ease` : 'none';
			im.style.transform = `translate(${x - r}px,${y - r}px)`;
		};
		// Stacked cells never slid to the seam, so the portraits start (and the
		// before one stays) at the before cell's centre instead of the card's.
		const x0 = M.side ? W : W - M.oB;
		for (const im of [iB, iA]) {
			im.style.display = '';
			im.style.width = im.style.height = `${2 * r}px`;
			put(im, x0, 0);
		}
		const wasA = M.aLive;
		M.aLive = false;
		M.actA = '';
		if (wasA) fa?.setLabel('');
		const aftFace = wasA || M.lb?.phase === 'after';
		iB.style.zIndex = aftFace ? '9' : '10';
		iA.style.zIndex = aftFace ? '10' : '9';
		iB.style.opacity = iA.style.opacity = '1';
		for (const el of [b, a, svg] as const) {
			(el as HTMLElement | SVGSVGElement).style.transition = `opacity ${R ? 0 : 400}ms ease`;
			(el as HTMLElement | SVGSVGElement).style.opacity = '0';
			(el as HTMLElement | SVGSVGElement).style.pointerEvents = 'none';
		}
		at(420, () => {
			if (wasA) {
				fb.setPaused(false);
				fa?.rest('tuesday');
			} else fb.rest('before'); // the finished before day, regenerated
			b.style.transition = a.style.transition = 'none';
			M.seqRunning = false;
			M.playing = false;
			M.act = null;
			M.infK = null;
			(b.parentElement as HTMLElement).style.zIndex = '';
			(a.parentElement as HTMLElement).style.zIndex = '';
			api.current.spread();
			fb.setLabel('');
			put(iB, M.side ? W - M.oB : x0, R ? 0 : 650);
			put(iA, W + M.oA, R ? 0 : 650);
		});
		at(1100, () => {
			svg.style.pointerEvents = '';
			api.current.drawRibbon(); // the ribbon draws round the parted portraits first
		});
		at(2100, () => {
			for (const el of [b, a]) {
				el.style.transition = 'opacity 450ms ease';
				el.style.opacity = '1';
				el.style.pointerEvents = '';
			}
		});
		at(2600, () => {
			for (const im of [iB, iA]) im.style.opacity = '0';
		});
		at(2900, () => {
			for (const im of [iB, iA]) im.style.display = 'none';
			b.style.transition = a.style.transition = '';
		});
	};

	api.current = { spread, play, playAfter, stop, skipAfter, drawRibbon, syncRibbon };

	// Mount both engines, rest them at their finished days, and run the
	// ribbon loop.
	useEffect(() => {
		const b = bRef.current;
		const a = aRef.current;
		const viewport = viewRef.current;
		if (!b || !a || !viewport) return;
		// Effects re-run on the same machine (StrictMode): revive it.
		M.dead = false;
		M.playing = false;
		M.playingS = false;
		M.afterCue = false;
		M.aLive = false;
		M.aSlide = false;
		M.aMask = null;
		M.sp = 0;
		M.infK = null;
		M.ribShown = null;
		M.lblK = null;
		const mqMobile = window.matchMedia('(max-width: 700px)');
		const mqReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
		M.env = { mobile: mqMobile.matches, reduced: mqReduced.matches };
		M.p0 = engineParams(M.daySec, M.env.mobile, M.env.reduced);

		const onStats = (key: 'b' | 'a') => (s: NurseOrbitStats) => {
			if (key === 'a') {
				M.la = s;
				if (M.aLive && M.playing && !M.seqRunning) {
					if (!M.ending && s.phase === 'after' && (s.onCall === 'done' || s.onCall === 'final')) {
						M.ending = true;
						M.endT = window.setTimeout(() => {
							M.ending = false;
							M.endT = null;
							if (!M.dead && M.playing && !M.seqRunning) api.current.stop();
						}, 1200);
					}
					const act = ACT_AFTER[s.onCall] ?? '';
					if (act !== M.actA) {
						M.actA = act;
						M.fx.after?.setLabel(act);
					}
				}
			} else {
				M.lb = s;
				// The finished before day, as generated on load.
				if (!M.playing && s.phase !== 'after') M.bDone = s;
				// The replay reaches the end of the after day → back to the
				// finished, stopped view.
				if (
					M.playing &&
					!M.seqRunning &&
					!M.ending &&
					s.phase === 'after' &&
					(s.onCall === 'done' || s.onCall === 'final')
				) {
					M.ending = true;
					M.endT = window.setTimeout(() => {
						M.ending = false;
						M.endT = null;
						if (!M.dead && M.playing && !M.seqRunning) api.current.stop();
					}, 1200);
				}
				if (M.playing && s.phase === 'before') M.bLast = s;
				if (M.playing && !M.seqRunning) {
					const act = ACT_BEFORE[s.onCall] ?? '';
					if (act !== M.act) {
						M.act = act;
						M.fx.before?.setLabel(act);
					}
				}
			}
			if (M.dead || !M.resting) return;
			const j = JSON.stringify(s);
			if (key === 'b') {
				if (j === M.sJb) return;
				M.sJb = j;
				setSb(s);
			} else {
				if (j === M.sJa) return;
				M.sJa = j;
				setSa(s);
			}
		};

		const photos = {
			photo: `${IMG}/nurse-after-crop.webp`,
			photoBefore: `${IMG}/nurse-before-crop.webp`,
			photoLunch: `${IMG}/nurse-lunch-crop.webp`,
		};
		M.resting = false;
		const fxB = mount(b, { params: { ...M.p0, startAt: 'before' }, onStats: onStats('b'), ...photos });
		fxB.rest('before');
		M.fx.before = fxB;
		const fxA = mount(a, { params: { ...M.p0, startAt: 'tuesday' }, onStats: onStats('a'), ...photos });
		fxA.rest('tuesday');
		M.fx.after = fxA;
		M.resting = true;
		setSb(M.lb);
		setSa(M.la);
		api.current.syncRibbon();
		api.current.spread();

		// First time the figure is in view, the ∞ seal draws in.
		let ioInf: IntersectionObserver | null = null;
		const svgI = infRef.current;
		if (svgI && 'IntersectionObserver' in window && !prefersReducedMotion()) {
			svgI.style.opacity = '0';
			ioInf = new IntersectionObserver(
				(es) => {
					if (!es.some((e) => e.isIntersecting)) return;
					ioInf?.disconnect();
					ioInf = null;
					if (M.seqRunning) return;
					api.current.drawRibbon();
				},
				{ threshold: 0.5 },
			);
			ioInf.observe(viewport);
		}

		// Pause whichever half scrolls out of view (or is clipped away by the
		// stacked viewport), so each day resumes where it stopped.
		const io =
			'IntersectionObserver' in window
				? new IntersectionObserver(
						(es) =>
							es.forEach((e) => {
								const k = e.target === b ? 'before' : 'after';
								M.fx[k]?.setPaused(!e.isIntersecting);
							}),
						{ threshold: 0.05 },
					)
				: null;
		if (io) {
			io.observe(b);
			io.observe(a);
		}

		// The ∞ ribbon loop: path round both portraits, crossing at the seam;
		// the second crossing strand passes over the first, so its band hides
		// the letters beneath. (Only drawn in "infinity day done", side by
		// side; otherwise each portrait wears the standard seal.)
		const ADV = 9 * 0.6 + 1.6;
		const fill = (len: number, LBL = 'DAY DONE') => {
			const max = Math.floor(len / ADV);
			const n = LBL.length;
			const k = Math.max(1, Math.floor(max / (n + 3)));
			const gap = max - k * n;
			const base = Math.floor(gap / k);
			const ex = gap % k;
			let o = '';
			for (let i = 0; i < k; i++) {
				const w = base + (i < ex ? 1 : 0);
				const l = Math.floor((w - 1) / 2);
				o += LBL + ' '.repeat(l) + '·' + ' '.repeat(Math.max(0, w - 1 - l));
			}
			return o;
		};
		const NS = 'http://www.w3.org/2000/svg';
		const tick = (t: number) => {
			if (M.dead) return;
			M.infRaf = requestAnimationFrame(tick);
			const svg = infRef.current;
			const eb = bRef.current;
			const ea = aRef.current;
			if (!svg || !eb || !ea || !M.R) return;
			const pB = eb.parentElement as HTMLElement;
			const pA = ea.parentElement as HTMLElement;
			const side = pB.offsetTop === pA.offsetTop; // side by side; stacked halves keep their own seals
			const inf = M.ribbon === 'infinity day done';
			const rib = side && inf;
			if (rib !== M.ribShown) {
				M.ribShown = rib;
				svg.style.display = rib ? '' : 'none';
				M.lblK = null;
			}
			if (M.playing) M.lblK = null;
			else {
				const lk = rib ? 'r' : inf ? 'd' : 'ba';
				if (lk !== M.lblK) {
					M.lblK = lk;
					M.fx.before?.setLabel(rib ? '' : inf ? 'DAY DONE' : 'BEFORE');
					M.fx.after?.setLabel(rib ? '' : inf ? 'DAY DONE' : 'AFTER');
				}
			}
			if (!rib || M.playing) return;
			const seal = eb.querySelector('svg[width]') as SVGSVGElement | null;
			const sealEl = seal?.parentElement;
			const tm = sealEl ? /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(sealEl.style.transform) : null;
			if (!seal || !tm) return;
			const q = (sel: string) => svg.querySelector(sel) as SVGPathElement;
			const Rs = +(seal.getAttribute('width') ?? 0) / 2;
			const y = +tm[2] + Rs + eb.offsetTop;
			const jx = pB.offsetWidth;
			const rho = M.R + 8.5;
			const d = M.oB;
			const key = [jx, y.toFixed(1), rho, d, M.F].join('|');
			M.portY = y;
			if (key !== M.infK) {
				M.infK = key;
				const cb = rho / d;
				const sbn = Math.sqrt(1 - cb * cb);
				const ax = d - rho * cb;
				const by = rho * sbn;
				const P = (x: number, yy: number) => `${(jx + x).toFixed(2)} ${(y + yy).toFixed(2)}`;
				const arc = (2 * Math.PI - 2 * Math.acos(cb)) * rho;
				const l = 2 * Math.hypot(ax, by);
				q(`#${idp}-inf`).setAttribute(
					'd',
					`M ${P(ax, -by)} A ${rho} ${rho} 0 1 1 ${P(ax, by)} L ${P(-ax, -by)} A ${rho} ${rho} 0 1 0 ${P(-ax, by)} Z`,
				);
				const be = Math.acos(cb);
				const ep = 0.5;
				const E1 = P(-d + rho * Math.cos(be + ep), rho * Math.sin(be + ep));
				const E2 = P(d + rho * Math.cos(Math.PI + be + ep), rho * Math.sin(Math.PI + be + ep));
				// The over strand: its whole straight plus a little of each loop,
				// ribbon-width, so its ends sink into its own band and it covers
				// every letter the under strand runs beside.
				const over = `M ${E1} A ${rho} ${rho} 0 0 0 ${P(-ax, by)} L ${P(ax, -by)} A ${rho} ${rho} 0 0 1 ${E2}`;
				q(`#${idp}-over`).setAttribute('d', over);
				q(`#${idp}-overband`).setAttribute('d', over);
				const s = fill(2 * arc + 2 * l);
				for (const tp of svg.querySelectorAll('textPath')) tp.textContent = s + s;
				{
					const ms = document.createElementNS(NS, 'path') as SVGPathElement;
					const len = (dd: string) => {
						ms.setAttribute('d', dd);
						return ms.getTotalLength();
					};
					M.infS2 =
						len(
							`M ${P(ax, -by)} A ${rho} ${rho} 0 1 1 ${P(ax, by)} L ${P(-ax, -by)} A ${rho} ${rho} 0 1 0 ${P(-ax, by)}`,
						) - len(`M ${E1} A ${rho} ${rho} 0 0 0 ${P(-ax, by)}`);
					M.infL = q(`#${idp}-inf`).getTotalLength();
				}
				{
					// One unbroken line: each copy of the label is spaced to exactly
					// one lap, so the copies join seamlessly and the over letters land
					// exactly on the under ones.
					const ts = [...svg.querySelectorAll('text')] as SVGTextElement[];
					const mm = ts[0].cloneNode(false) as SVGTextElement;
					mm.removeAttribute('mask');
					mm.setAttribute('letter-spacing', '1.6');
					mm.style.visibility = 'hidden';
					mm.textContent = s;
					svg.appendChild(mm);
					const w = mm.getComputedTextLength();
					mm.remove();
					const ls = 1.6 + (w > 0 ? (M.infL - w) / s.length : 0);
					for (const tx of ts) tx.setAttribute('letter-spacing', ls.toFixed(3));
				}
				{
					// Each portrait's own BEFORE / AFTER ring (the alternative mode's
					// geometry rides along with the ∞).
					M.ringC = 2 * Math.PI * rho;
					for (const [k, cx, lbl] of [
						['b', -d, 'BEFORE'],
						['a', d, 'AFTER'],
					] as const) {
						const X = jx + cx;
						q(`#${idp}-c${k.toUpperCase()}`).setAttribute(
							'd',
							`M ${(X - rho).toFixed(2)} ${y.toFixed(2)} A ${rho} ${rho} 0 1 1 ${(X + rho).toFixed(2)} ${y.toFixed(2)} A ${rho} ${rho} 0 1 1 ${(X - rho).toFixed(2)} ${y.toFixed(2)}`,
						);
						const txt = svg.querySelector(`[data-ct="${k}"]`) as SVGTextElement;
						const s2 = fill(M.ringC, lbl);
						const mm = txt.cloneNode(false) as SVGTextElement;
						mm.setAttribute('letter-spacing', '1.6');
						mm.style.visibility = 'hidden';
						mm.textContent = s2;
						svg.appendChild(mm);
						const w2 = mm.getComputedTextLength();
						mm.remove();
						txt.setAttribute(
							'letter-spacing',
							(1.6 + (w2 > 0 ? (M.ringC - w2) / s2.length : 0)).toFixed(3),
						);
						const tp = txt.querySelector('textPath');
						if (tp) tp.textContent = s2 + s2;
					}
					q(`#${idp}-rings`).setAttribute(
						'd',
						`${q(`#${idp}-cB`).getAttribute('d')} ${q(`#${idp}-cA`).getAttribute('d')}`,
					);
				}
				{
					// The feather steps round the before portrait so it never ghosts;
					// it runs on a slant, leaning right toward the top.
					const F = M.F || 0;
					const cx = F - M.oB;
					const cy = y - pA.offsetTop;
					const rr = M.R + 17;
					const mask = `radial-gradient(circle at ${cx}px ${cy}px, transparent ${rr}px, #000 ${rr + 1}px), linear-gradient(${90 + (M.th * 180) / Math.PI}deg, transparent ${(pA.offsetHeight * Math.sin(M.th)).toFixed(1)}px, #000 ${(pA.offsetHeight * Math.sin(M.th) + 64 * Math.cos(M.th)).toFixed(1)}px)`;
					const v = F ? mask : 'none';
					pA.style.maskImage = v;
					pA.style.setProperty('-webkit-mask-image', v);
					pA.style.setProperty('-webkit-mask-composite', 'source-in');
					pA.style.maskComposite = 'intersect';
				}
			}
			const v = prefersReducedMotion() ? 0 : ((t / 1000) * 12 * (Math.PI / 180) * rho) % M.infL;
			const o = v - M.infL;
			svg.querySelector('[data-tp="all"]')?.setAttribute('startOffset', o.toFixed(1));
			svg.querySelector('[data-tp="over"]')?.setAttribute('startOffset', (o - M.infS2).toFixed(1));
			if (M.ringC) {
				const oc = ((v % M.ringC) - M.ringC).toFixed(1);
				for (const tp of svg.querySelectorAll('[data-tpc]')) tp.setAttribute('startOffset', oc);
			}
		};
		M.infRaf = requestAnimationFrame(tick);
		document.fonts?.ready.then(() => {
			M.infK = null; // measured letter-spacing again once the mono face is in
		}).catch(() => {});

		// Resize: re-derive the seam geometry; under ~two 400px columns the
		// cells stack and each nurse centres in its own cell.
		let rsT: number | undefined;
		const ro = new ResizeObserver((es) => {
			const w = es[0]?.contentRect.width ?? viewport.clientWidth;
			setStacked(w < 800);
			M.sp = 0;
			clearTimeout(rsT);
			rsT = window.setTimeout(() => !M.dead && api.current.spread(), 300);
		});
		ro.observe(viewport);

		const retune = () => {
			M.env = { mobile: mqMobile.matches, reduced: mqReduced.matches };
			M.p0 = engineParams(M.daySec, M.env.mobile, M.env.reduced);
			M.fx.before?.setParams({ ...M.p0, startAt: 'before' });
			M.fx.after?.setParams({ ...M.p0, startAt: 'tuesday' });
		};
		mqMobile.addEventListener('change', retune);
		mqReduced.addEventListener('change', retune);

		return () => {
			M.dead = true;
			cancelAnimationFrame(M.infRaf);
			clearTimeout(rsT);
			if (M.liveT != null) clearTimeout(M.liveT);
			clearEnding();
			clearCue();
			clearSeq();
			M.revealAnim?.cancel();
			M.fadeAnim?.cancel();
			mqMobile.removeEventListener('change', retune);
			mqReduced.removeEventListener('change', retune);
			ioInf?.disconnect();
			io?.disconnect();
			ro.disconnect();
			for (const k of ['before', 'after'] as const) {
				try {
					M.fx[k]?.destroy();
				} catch {
					/* engine already gone */
				}
			}
			M.fx = {};
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// componentDidUpdate of the reference: every state change re-syncs the
	// ribbon mode and the seam geometry.
	useEffect(() => {
		api.current.syncRibbon();
		api.current.spread();
	});

	// Header and footer heights feed --hd/--ft on the card: the stage fills
	// the band between them, re-measured whenever either wraps or fonts load.
	useEffect(() => {
		const card = cardRef.current;
		const hd = hdRef.current;
		const ft = ftRef.current;
		if (!card || !hd || !ft) return;
		const measure = () => {
			card.style.setProperty('--hd', `${hd.offsetHeight + 32}px`);
			card.style.setProperty('--ft', `${ft.offsetHeight + 24}px`);
		};
		measure();
		const ro = new ResizeObserver(() => requestAnimationFrame(measure));
		ro.observe(hd);
		ro.observe(ft);
		document.fonts?.ready.then(measure).catch(() => {});
		return () => ro.disconnect();
	}, []);

	const onDaySec = (v: number) => {
		setDaySec(v);
		M.daySec = v;
		M.p0 = engineParams(v, M.env.mobile, M.env.reduced);
		M.fx.before?.setParams({ ...M.p0, startAt: 'before' });
		M.fx.after?.setParams({ ...M.p0, startAt: 'tuesday' });
	};

	// Heading pills cue the scenes (dc syncScene semantics). On phones they
	// pick the visible half; a tap mid-replay ends it and shows that half.
	const cueBefore = () => {
		clearCue();
		if (stacked) {
			setPick('b');
			if (M.playingS && !M.seqRunning) stop();
			return;
		}
		if (!M.playingS) {
			play();
			return;
		}
		if (M.aLive && !M.seqRunning) {
			play();
			return;
		}
		if (M.playing && !M.seqRunning) {
			clearEnding();
			M.fx.before?.playFrom('before');
		}
	};
	const cueAfter = () => {
		clearCue();
		if (stacked) {
			setPick('a');
			if (M.playingS && !M.seqRunning) stop();
			return;
		}
		if (!M.playingS) {
			playAfter();
			return;
		}
		if (!M.seqRunning) skipAfter();
	};

	// Derived view state (renderVals of the reference).
	const bAfterish = playingS && ((sb?.phase === 'after') || afterCueS);
	const opB = bAfterish ? 0.35 : 1;
	const opA = playingS && !bAfterish ? 0.35 : 1;
	const statsB = playingS ? statsFor(bAfterish ? (M.bLast ?? null) : sb) : beforeStats(sb);
	const statsA = playingS
		? afterStats(M.aLive ? { ...(sa ?? {}), phase: 'after' } : sb?.phase === 'after' ? sb : null)
		: afterStats(sa);
	const canSkip = playingS && sb?.phase !== 'after';
	const playLabel = playingS ? 'Show the finished day' : 'Play the day';
	// Phones: one half at a time — a replay always runs in the before cell.
	const visHalf: 'b' | 'a' = playingS ? (sb?.phase === 'after' ? 'a' : 'b') : pick;
	const showBCol = !stacked || (playingS ? true : visHalf === 'b');
	const showACol = !stacked || (!playingS && visHalf === 'a');
	const activeHalf: 'b' | 'a' | null = playingS ? (bAfterish ? 'a' : 'b') : stacked ? pick : null;
	const gridTop = stacked && !playingS && pick === 'a' ? '-100%' : '0';

	const stageInset = { top: 'var(--hd, 0px)', bottom: 'var(--ft, 0px)' } as const;
	const sealText = {
		fill: INK,
		fontFamily: 'var(--font-mono)',
		fontSize: 9,
		letterSpacing: 1.6,
		dominantBaseline: 'central',
		xmlSpace: 'preserve',
		style: { textTransform: 'uppercase' },
	} as const;

	return (
		<figure className="m-0 w-full">
			<div
				ref={cardRef}
				className="relative box-content aspect-[4/3] min-h-[320px] w-full rounded-[16px] md:aspect-[1136/500] md:max-h-[500px]"
				style={{
					background: PAPER,
					paddingTop: 'var(--hd, 0px)',
					paddingBottom: 'var(--ft, 0px)',
					transform: 'rotate(-0.8deg) skew(0.6deg, -0.3deg)',
					transformOrigin: '50% 50%',
				}}
			>
				{/* Viewport: clips the dual-cell grid (which doubles in height on
				    phones, one cell shown at a time). */}
				<div
					ref={viewRef}
					className="absolute inset-x-0 z-[2] overflow-hidden rounded-[16px]"
					style={{ ...stageInset, background: PAPER }}
				>
					<div
						className="absolute inset-x-0 grid"
						style={{
							top: gridTop,
							height: stacked ? '200%' : '100%',
							gridTemplateColumns: stacked ? '1fr' : '1fr 1fr',
							gridAutoRows: stacked ? '50%' : '100%',
							background: PAPER,
						}}
					>
						{/* Resting portraits, used while the stop() choreography parts
						    the two days from the centre. */}
						<img
							ref={pbRef}
							src={`${IMG}/nurse-before-crop.webp`}
							alt=""
							aria-hidden="true"
							className="pointer-events-none absolute left-0 top-0 z-[9] rounded-full object-cover"
							style={{ display: 'none', opacity: 0 }}
						/>
						<img
							ref={paRef}
							src={`${IMG}/nurse-after-crop.webp`}
							alt=""
							aria-hidden="true"
							className="pointer-events-none absolute left-0 top-0 z-[9] rounded-full object-cover"
							style={{ display: 'none', opacity: 0 }}
						/>
						{/* Edge feather: the canvases fade into the paper on all sides. */}
						<div
							aria-hidden="true"
							className="pointer-events-none absolute inset-0 z-[4]"
							style={{
								background: `linear-gradient(to right, ${PAPER}, transparent 9%, transparent 91%, ${PAPER}), linear-gradient(to bottom, ${PAPER}, transparent 14%, transparent 86%, ${PAPER})`,
							}}
						/>
						{/* The ∞ "DAY DONE" ribbon (figure-8 textPath system); shown only
						    in ribbon="infinity day done", side by side. */}
						<svg
							ref={infRef}
							aria-hidden="true"
							className="pointer-events-none absolute left-0 top-0 z-[5] h-full w-full overflow-visible"
							style={{ display: 'none' }}
						>
							<defs>
								<path id={`${idp}-inf`} fill="none" />
								<path id={`${idp}-over`} fill="none" />
								<path id={`${idp}-overband`} fill="none" />
								<path id={`${idp}-rings`} fill="none" />
								<path id={`${idp}-cB`} fill="none" />
								<path id={`${idp}-cA`} fill="none" />
								<mask id={`${idp}-reveal`} maskUnits="userSpaceOnUse" x={-5000} y={-5000} width={10000} height={10000}>
									<use data-reveal="1" href={`#${idp}-inf`} fill="none" stroke="#fff" strokeWidth={44} />
								</mask>
							</defs>
							<g mask={`url(#${idp}-reveal)`}>
								<use href={`#${idp}-inf`} stroke="var(--color-washes-paper)" strokeWidth={15} />
								<text data-inf="1" opacity={0} {...sealText}>
									<textPath data-tp="all" href={`#${idp}-inf`} startOffset={0} />
								</text>
								<g data-ringband="1" style={{ display: 'none' }}>
									<use href={`#${idp}-cB`} fill="none" stroke="var(--color-washes-paper)" strokeWidth={15} />
									<use href={`#${idp}-cA`} fill="none" stroke="var(--color-washes-paper)" strokeWidth={15} />
								</g>
								<g data-rings="1">
									<text data-ct="b" {...sealText}>
										<textPath data-tpc="b" href={`#${idp}-cB`} startOffset={0} />
									</text>
									<text data-ct="a" {...sealText}>
										<textPath data-tpc="a" href={`#${idp}-cA`} startOffset={0} />
									</text>
								</g>
								<use href={`#${idp}-overband`} stroke="var(--color-washes-paper)" strokeWidth={15} />
								<text data-inf="1" opacity={0} {...sealText}>
									<textPath data-tp="over" href={`#${idp}-over`} startOffset={0} />
								</text>
							</g>
						</svg>
						{/* Before half-cell. */}
						<div className="relative min-w-0 overflow-hidden" style={{ height: '100%' }}>
							<div
								ref={bRef}
								role="img"
								aria-label={ARIA_BEFORE}
								className="absolute left-0 top-0 h-full w-[200%]"
							/>
						</div>
						{/* After half-cell (reaches F px over the before half; the seam
						    feathers in on a slant). */}
						<div className="relative min-w-0 overflow-hidden" style={{ height: '100%' }}>
							<div
								ref={aRef}
								role="img"
								aria-label={ARIA_AFTER}
								className="absolute top-0 h-full w-[200%]"
								style={{ left: '-100%' }}
							/>
						</div>
					</div>
				</div>

				{/* HUD stat columns: resting = each engine's finished day; playing =
				    the live half, the other column dimmed. */}
				{showBCol ? (
					<div
						aria-label="Before stats"
						className="pointer-events-none absolute left-[24px] z-[6] flex flex-col items-start gap-[24px] text-left"
						style={{
							top: 'calc(var(--hd, 0px) + 24px)',
							opacity: stacked ? 1 : opB,
							transition: 'opacity 400ms ease',
						}}
					>
						{statsB.map((st) => (
							<StatBlock key={st.label} stat={st} align="start" />
						))}
					</div>
				) : null}
				{showACol ? (
					<div
						aria-label="After stats"
						className="pointer-events-none absolute right-[24px] z-[6] flex flex-col items-end gap-[24px] text-right"
						style={{
							top: 'calc(var(--hd, 0px) + 24px)',
							opacity: stacked ? 1 : opA,
							transition: 'opacity 400ms ease',
						}}
					>
						{statsA.map((st) => (
							<StatBlock key={st.label} stat={st} align="end" />
						))}
					</div>
				) : null}

				{/* Play the day ↔ Show the finished day. Sits low so it never
				    covers the portraits. */}
				<button
					type="button"
					onClick={() => (M.playingS ? stop() : play())}
					aria-label={playLabel}
					className={`absolute left-1/2 z-[8] inline-flex min-h-[44px] -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center gap-[8px] whitespace-nowrap rounded-full border-[1.25px] text-[12px] leading-[16px] tracking-[0.04em] text-confetti-black transition-colors duration-200 ${
						playingS
							? 'border-transparent bg-transparent px-[8px] underline underline-offset-[3px] hover:[text-decoration-thickness:2px]'
							: 'border-confetti-black bg-[#fdfbf5] px-[20px] shadow-[0_2px_8px_rgba(57,31,0,0.08)] hover:bg-confetti-black hover:text-[#fdfbf5]'
					}`}
					style={{
						top: 'calc(100% - var(--ft, 0px) - 40px)',
						fontFamily: 'var(--font-mono)',
					}}
				>
					{playingS ? <FinishIcon /> : <PlayIcon />}
					{playLabel}
				</button>

				{/* Header: chip row, heading with the before/after pills, blurbs. */}
				<div
					ref={hdRef}
					className="pointer-events-none absolute left-[24px] right-[24px] top-[24px] z-[7] flex flex-col gap-[8px] text-left"
				>
					<div className="flex flex-wrap items-center justify-between gap-x-[16px] gap-y-[8px]">
						<Figure />
						<button
							type="button"
							onClick={() => {
								if (M.playingS) {
									if (!M.seqRunning) skipAfter();
								} else play();
							}}
							className="pointer-events-auto cursor-pointer border-0 bg-transparent p-0 text-[12px] leading-[16px] tracking-[0.04em] whitespace-nowrap text-confetti-black underline underline-offset-[3px] hover:[text-decoration-thickness:2px]"
							style={{
								fontFamily: 'var(--font-mono)',
								visibility: playingS && !canSkip ? 'hidden' : 'visible',
							}}
						>
							{playingS ? 'Skip animation' : 'Replay'}
						</button>
						<button
							type="button"
							onClick={onAssumptions}
							aria-label="Assumptions"
							title="Assumptions"
							className="pointer-events-auto ml-auto inline-flex size-[24px] flex-none cursor-pointer items-center justify-center rounded-full border-[1.25px] border-confetti-black bg-transparent italic text-confetti-black transition-colors duration-200 hover:bg-confetti-black hover:text-[#fdfbf5]"
							style={{ fontFamily: 'var(--font-kyoto)', fontSize: 13, lineHeight: 1 }}
						>
							i
						</button>
					</div>
					<Text variant="headline-small" as="h2" className="m-0 text-left text-confetti-black [text-wrap:balance]">
						A centralized nurse care manager’s shift{' '}
						<PillButton active={activeHalf === 'b'} onClick={cueBefore}>
							before
						</PillButton>{' '}
						and{' '}
						<PillButton active={activeHalf === 'a'} onClick={cueAfter}>
							after
						</PillButton>{' '}
						CareSignal
					</Text>
					<div className="pointer-events-auto mt-[8px] grid grid-cols-1 gap-[16px] md:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] md:gap-x-[24px] md:gap-y-[8px]">
						<div
							className="flex min-w-0 flex-col gap-[6px]"
							style={{ opacity: opB, transition: 'opacity 400ms ease' }}
						>
							<Text variant="eyebrow" as="span" className="block text-confetti-black">before</Text>
							<p
								className="m-0 text-left text-[15px] leading-[22px] text-confetti-black [text-wrap:pretty]"
								style={{ fontFamily: 'var(--font-body)' }}
							>
								A nurse works down a list of 100 patients, calling each one to find out how they
								are. Most don’t pick up.
							</p>
						</div>
						<div aria-hidden="true" className="hidden md:block" />
						<div
							className="flex min-w-0 flex-col gap-[6px]"
							style={{ opacity: opA, transition: 'opacity 400ms ease' }}
						>
							<Text variant="eyebrow" as="span" className="block text-confetti-black">after</Text>
							<p
								className="m-0 text-left text-[15px] leading-[22px] [text-wrap:pretty]"
								style={{
									fontFamily: 'var(--font-body)',
									color: !playingS || bAfterish ? INK : INK_60,
									transition: 'color 400ms ease',
								}}
							>
								About 80% of 1,600 patients answer a check-in.
								<Citation
									title="Patient engagement"
									source="Epharmix study, JMIR Formative Research (2017): at least 80% weekly patient engagement for nine consecutive months across 929 patients."
									href="https://www.caresignal.health/news/2017/09/21/study-sms-texting-phone-based-platform-epharmix-maintains-80-patient-engagement-during-9-month-study-while-collecting-patient-generated-health-data-alerting-pr"
								/>{' '}
								He starts with alerts and the sickest patients and skips the ones who are fine.
							</p>
						</div>
					</div>
				</div>

				{/* Footer: legend + shift length. */}
				<div
					ref={ftRef}
					className="absolute bottom-[24px] left-[24px] right-[24px] z-[7] flex flex-col gap-[20px]"
				>
					<div className="flex flex-wrap items-center justify-between gap-x-[24px] gap-y-[12px]">
						<div
							aria-label="Legend"
							className="flex min-w-0 flex-1 flex-wrap items-center gap-x-[16px] gap-y-[8px] text-[12px] leading-[16px] tracking-[0.04em]"
							style={{ fontFamily: 'var(--font-mono)', color: INK_75 }}
						>
							{LEGEND.map(([label, color]) => (
								<span key={label} className="flex min-w-0 items-center gap-[8px] whitespace-nowrap">
									<span
										className="inline-block size-[9px] flex-none rounded-full"
										style={{ background: color }}
									/>
									{label}
								</span>
							))}
						</div>
						<label
							className="ml-auto flex flex-none items-center gap-[10px] whitespace-nowrap text-[12px] leading-[16px] tracking-[0.04em]"
							style={{ fontFamily: 'var(--font-mono)', color: INK_75 }}
						>
							Shift length
							<input
								type="range"
								min={15}
								max={30}
								step={5}
								value={daySec}
								onChange={(e) => onDaySec(+e.target.value)}
								aria-label="Seconds per simulated shift"
								className="m-0 h-[24px] w-[96px] min-w-0 flex-none cursor-pointer bg-transparent"
								style={{ accentColor: 'var(--color-confetti-black)' }}
							/>
							<span
								className="min-w-[32px] text-right [font-variant-numeric:tabular-nums]"
								style={{ color: INK }}
							>
								{daySec} s
							</span>
						</label>
					</div>
				</div>
			</div>
		</figure>
	);
}
