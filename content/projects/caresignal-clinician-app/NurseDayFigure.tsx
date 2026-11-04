import { useEffect, useRef, useState, type ReactNode } from 'react';

import Figure from '../../../src/features/projects/components/figures/Figure';
import {
	mount,
	type NurseOrbitHandle,
	type NurseOrbitParams,
	type NurseOrbitStats,
} from '../../../src/features/projects/components/figures/orbit/nurse-orbit.js';

import { Citation, IMG } from './shared';

// Figure 1 — "A centralized nurse care manager's shift before and after
// CareSignal", ported from the design handoff ("CareSignal Application Case
// Study.dc.html" hero figure + "Nurse Day Complete.dc.html"), day-complete
// variant. One nurse-orbit engine plays the before day, morphs, plays the
// after (tuesday) day, then settles on the finished picture via skip().

const PAPER = '#fdfbf5';
const GREEN_TEXT = '#5f8a2e';
const INK = 'var(--color-confetti-black)';
const INK_75 = 'color-mix(in srgb, var(--color-confetti-black) 75%, transparent)';
const INK_60 = 'color-mix(in srgb, var(--color-confetti-black) 60%, transparent)';
const INK_55 = 'color-mix(in srgb, var(--color-confetti-black) 55%, transparent)';
const INK_35 = 'color-mix(in srgb, var(--color-confetti-black) 35%, transparent)';

const STAGE_ARIA =
	'Animated figure: one nurse’s 7-hour day. Before: he phones down a list of 100 patients whose status is unknown; most calls go unanswered. After CareSignal: 1,600 patients check in by text, about 80% reply, and he starts with alerts and high-risk patients. Numbers and sources are in Assumptions.';

// The activity ring around the portrait, keyed by the engine's onCall.
const ACTIVITY: Record<string, string> = {
	idle: 'Between calls',
	ringing: 'Ringing',
	talking: 'On a call',
	done: 'End of shift',
	lunch: 'At lunch',
	morph: '',
	final: 'Statuses up to date',
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
type View = { phase: 'before' | 'after'; done: boolean; b: Stat[]; a: Stat[] };

const pct = (n: number, of: number) => `${of ? Math.round((n / of) * 100) : 0}%`;

function beforeStats(s: NurseOrbitStats | null): Stat[] {
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

function afterStats(s: NurseOrbitStats | null): Stat[] {
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
const SkipIcon = () => (
	<svg aria-hidden="true" width="14" height="10" viewBox="0 0 14 10" className="block flex-none">
		<path
			d="M.5 1.2v7.6a.6.6 0 0 0 .9.5L7 5.5a.6.6 0 0 0 0-1L1.4.7a.6.6 0 0 0-.9.5zM6.8 1.2v7.6a.6.6 0 0 0 .9.5l5.6-3.8a.6.6 0 0 0 0-1L7.7.7a.6.6 0 0 0-.9.5z"
			fill="currentColor"
		/>
	</svg>
);
const FinishIcon = () => (
	<svg aria-hidden="true" width="12" height="10" viewBox="0 0 12 10" className="block flex-none">
		<path d="M.8 1.2v7.6a.6.6 0 0 0 .9.5l6.3-3.8a.6.6 0 0 0 0-1L1.7.7a.6.6 0 0 0-.9.5z" fill="currentColor" />
		<rect x="9.4" y=".6" width="1.8" height="8.8" rx=".6" fill="currentColor" />
	</svg>
);

export function NurseDayFigure({ onAssumptions }: { onAssumptions?: () => void }) {
	const cardRef = useRef<HTMLDivElement>(null);
	const stageRef = useRef<HTMLDivElement>(null);
	const hdRef = useRef<HTMLDivElement>(null);
	const ftRef = useRef<HTMLDivElement>(null);
	const fxRef = useRef<NurseOrbitHandle | null>(null);
	const lastBeforeRef = useRef<NurseOrbitStats | null>(null);
	const endTimerRef = useRef<number | null>(null);
	const actRef = useRef<string | null>(null);
	const viewJsonRef = useRef('');
	const daySecRef = useRef(15);
	const envRef = useRef({ mobile: false, reduced: false });

	const [daySec, setDaySec] = useState(15);
	const [view, setView] = useState<View>({
		phase: 'before',
		done: false,
		b: beforeStats(null),
		a: afterStats(null),
	});

	// The engine owns everything inside the stage div; we just feed it params
	// and portraits, and read its stats stream back.
	useEffect(() => {
		const stage = stageRef.current;
		if (!stage) return;
		const mqMobile = window.matchMedia('(max-width: 700px)');
		const mqReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
		envRef.current = { mobile: mqMobile.matches, reduced: mqReduced.matches };

		const onStats = (s: NurseOrbitStats) => {
			if (s.phase === 'before') lastBeforeRef.current = s;
			const act = ACTIVITY[s.onCall] ?? '';
			if (act !== actRef.current) {
				actRef.current = act;
				fxRef.current?.setLabel(act);
			}
			// After day over → settle on the finished picture, like the
			// reference's return to the finished view (1.2 s later).
			if (s.phase === 'after' && s.onCall === 'done' && endTimerRef.current == null) {
				endTimerRef.current = window.setTimeout(() => {
					endTimerRef.current = null;
					fxRef.current?.skip();
				}, 1200);
			}
			const next: View = {
				phase: s.phase,
				done: s.onCall === 'final',
				b: beforeStats(s.phase === 'before' ? s : lastBeforeRef.current),
				a: s.phase === 'after' ? afterStats(s) : afterStats(null),
			};
			const j = JSON.stringify(next);
			if (j !== viewJsonRef.current) {
				viewJsonRef.current = j;
				setView(next);
			}
		};

		const fx = mount(stage, {
			params: engineParams(daySecRef.current, envRef.current.mobile, envRef.current.reduced),
			onStats,
			photo: `${IMG}/nurse-after-crop.webp`,
			photoBefore: `${IMG}/nurse-before-crop.webp`,
			photoLunch: `${IMG}/nurse-lunch-crop.webp`,
		});
		fxRef.current = fx;

		// Hold the day until the stage scrolls into view; pause again whenever
		// it leaves, so the day resumes where it stopped.
		fx.setPaused(true);
		if (envRef.current.reduced) window.setTimeout(() => fxRef.current?.skip(), 120);
		const io =
			'IntersectionObserver' in window
				? new IntersectionObserver(
						(es) => es.forEach((e) => fxRef.current?.setPaused(!e.isIntersecting)),
						{ threshold: 0.15 },
					)
				: null;
		if (io) io.observe(stage);
		else fx.setPaused(false);

		const retune = () => {
			envRef.current = { mobile: mqMobile.matches, reduced: mqReduced.matches };
			fxRef.current?.setParams(
				engineParams(daySecRef.current, envRef.current.mobile, envRef.current.reduced),
			);
			if (envRef.current.reduced) fxRef.current?.skip();
		};
		mqMobile.addEventListener('change', retune);
		mqReduced.addEventListener('change', retune);

		return () => {
			mqMobile.removeEventListener('change', retune);
			mqReduced.removeEventListener('change', retune);
			if (endTimerRef.current != null) {
				clearTimeout(endTimerRef.current);
				endTimerRef.current = null;
			}
			io?.disconnect();
			fxRef.current = null;
			fx.destroy();
		};
	}, []);

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

	// A pending end-of-day skip() must not fire into a freshly started run.
	const clearEndTimer = () => {
		if (endTimerRef.current != null) {
			clearTimeout(endTimerRef.current);
			endTimerRef.current = null;
		}
	};

	const playFromPhase = (at: 'before' | 'tuesday') => {
		const fx = fxRef.current;
		if (!fx) return;
		clearEndTimer();
		fx.setPaused(false);
		fx.playFrom(at);
	};

	const playSt: 'play' | 'next' | 'finish' = view.done
		? 'play'
		: view.phase === 'before'
			? 'next'
			: 'finish';
	const playLabel = { play: 'Play Simulation', next: 'Next', finish: 'Finish' }[playSt];
	const playAct = () => {
		const fx = fxRef.current;
		if (!fx) return;
		clearEndTimer();
		fx.setPaused(false);
		if (view.done) fx.restart();
		else if (view.phase === 'before') fx.playFrom('tuesday');
		else fx.skip();
	};

	const skipAct = () => {
		const fx = fxRef.current;
		if (!fx) return;
		clearEndTimer();
		fx.setPaused(false);
		if (view.done) fx.restart();
		else fx.skip();
	};

	const onDaySec = (v: number) => {
		setDaySec(v);
		daySecRef.current = v;
		fxRef.current?.setParams(engineParams(v, envRef.current.mobile, envRef.current.reduced));
	};

	const stageInset = { top: 'var(--hd, 0px)', bottom: 'var(--ft, 0px)' } as const;

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
				{/* Stage: the engine mounts its canvases inside this div. */}
				<div
					ref={stageRef}
					role="img"
					aria-label={STAGE_ARIA}
					className="absolute inset-x-0 overflow-hidden rounded-[16px]"
					style={stageInset}
				/>
				{/* Edge feather: the canvas fades into the paper on all sides. */}
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-x-0 z-[1] rounded-[16px]"
					style={{
						...stageInset,
						background: `linear-gradient(to right, ${PAPER}, transparent 9%, transparent 91%, ${PAPER}), linear-gradient(to bottom, ${PAPER}, transparent 14%, transparent 86%, ${PAPER})`,
					}}
				/>

				{/* HUD stat columns. */}
				<div
					aria-label="Before stats"
					className="pointer-events-none absolute left-[24px] z-[6] flex flex-col items-start gap-[24px] text-left"
					style={{ top: 'calc(var(--hd, 0px) + 24px)' }}
				>
					{view.b.map((st) => (
						<StatBlock key={st.label} stat={st} align="start" />
					))}
				</div>
				<div
					aria-label="After stats"
					className="pointer-events-none absolute right-[24px] z-[6] flex flex-col items-end gap-[24px] text-right"
					style={{
						top: 'calc(var(--hd, 0px) + 24px)',
						opacity: view.done || view.phase === 'after' ? 1 : 0.4,
						transition: 'opacity 600ms ease',
					}}
				>
					{view.a.map((st) => (
						<StatBlock key={st.label} stat={st} align="end" />
					))}
				</div>

				{/* Play Simulation → Next → Finish. Sits low so it never covers
				    the portrait (single-scene adaptation of the reference). */}
				<button
					type="button"
					onClick={playAct}
					aria-label={playLabel}
					className={`absolute left-1/2 z-[8] inline-flex min-h-[44px] -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center gap-[8px] whitespace-nowrap rounded-full border-[1.25px] text-[12px] leading-[16px] tracking-[0.04em] text-confetti-black transition-colors duration-200 ${
						playSt === 'play'
							? 'border-confetti-black bg-[#fdfbf5] px-[20px] shadow-[0_2px_8px_rgba(57,31,0,0.08)] hover:bg-confetti-black hover:text-[#fdfbf5]'
							: 'border-transparent bg-transparent px-[8px] underline underline-offset-[3px] hover:[text-decoration-thickness:2px]'
					}`}
					style={{
						top: 'calc(100% - var(--ft, 0px) - 40px)',
						fontFamily: 'var(--font-mono)',
					}}
				>
					{playSt === 'play' ? <PlayIcon /> : playSt === 'next' ? <SkipIcon /> : <FinishIcon />}
					{playLabel}
				</button>

				{/* Header: chip row, heading with phase pills, blurbs. */}
				<div
					ref={hdRef}
					className="pointer-events-none absolute left-[24px] right-[24px] top-[24px] z-[7] flex flex-col gap-[8px] text-left"
				>
					<div className="flex flex-wrap items-center justify-between gap-x-[16px] gap-y-[8px]">
						<Figure />
						<button
							type="button"
							onClick={skipAct}
							className="pointer-events-auto cursor-pointer border-0 bg-transparent p-0 text-[12px] leading-[16px] tracking-[0.04em] whitespace-nowrap text-confetti-black underline underline-offset-[3px] hover:[text-decoration-thickness:2px]"
							style={{ fontFamily: 'var(--font-mono)' }}
						>
							{view.done ? 'Replay' : 'Skip animation'}
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
					<h2 className="type-headline-small m-0 text-left text-confetti-black [text-wrap:balance]">
						A centralized nurse care manager’s shift{' '}
						<PillButton
							active={!view.done && view.phase === 'before'}
							onClick={() => playFromPhase('before')}
						>
							before
						</PillButton>{' '}
						and{' '}
						<PillButton
							active={!view.done && view.phase === 'after'}
							onClick={() => playFromPhase('tuesday')}
						>
							after
						</PillButton>{' '}
						CareSignal
					</h2>
					<div className="pointer-events-auto mt-[8px] grid grid-cols-1 gap-[16px] md:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] md:gap-x-[24px] md:gap-y-[8px]">
						<div
							className="flex min-w-0 flex-col gap-[6px]"
							style={{
								opacity: !view.done && view.phase === 'after' ? 0.35 : 1,
								transition: 'opacity 400ms ease',
							}}
						>
							<span className="type-eyebrow block text-confetti-black">before</span>
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
							style={{
								opacity: !view.done && view.phase === 'before' ? 0.35 : 1,
								transition: 'opacity 400ms ease',
							}}
						>
							<span className="type-eyebrow block text-confetti-black">after</span>
							<p
								className="m-0 text-left text-[15px] leading-[22px] [text-wrap:pretty]"
								style={{
									fontFamily: 'var(--font-body)',
									color: view.done || view.phase === 'after' ? INK : INK_60,
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
