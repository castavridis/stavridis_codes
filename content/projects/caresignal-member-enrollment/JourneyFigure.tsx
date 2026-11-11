import { useEffect, useRef, useState, type CSSProperties } from 'react';

import { Fig } from './shared';

type Phase = 1 | 2 | 3 | 4;

const pc = (p: Phase | string) => ({ ['--pc' as string]: `var(--p${p})` }) as CSSProperties;

const REASONS: { p: Phase; big: string; why: string }[] = [
	{ p: 1, big: '42.1%', why: 'were happy with their existing resources' },
	{ p: 2, big: '10%', why: 'believed their condition wasn’t an issue' },
	{ p: 3, big: '7.7%', why: 'wanted to talk with a spouse or doctor first' },
	{ p: 4, big: '8+', why: 'calls were sometimes needed to reach a member' },
];

const PHASES: { p: Phase; b: string; em: string }[] = [
	{ p: 1, b: 'Phase 1 · 2 weeks', em: 'Introducing enhanced care' },
	{ p: 2, b: 'Phase 2 · 2 weeks', em: 'Need more information?' },
	{ p: 3, b: 'Phase 3 · 1 week', em: 'Last chance to enroll' },
	{ p: 4, b: 'Phase 4 · 1 week', em: 'We saved you a spot' },
];

// Position in weeks (0–6), label, phase.
const LANES: { name: string; items: [number, string, Phase][] }[] = [
	{ name: 'Mail', items: [[0.45, 'Formal invitation', 1], [1.5, 'Condition letter', 1], [4.5, 'Reminder postcard', 3]] },
	{ name: 'Email', items: [[0.5, 'Email', 1], [1.55, 'Email', 1], [2.4, 'Email', 2], [4.25, 'Email', 3], [4.8, 'Email', 3]] },
	{ name: 'Call', items: [[2.95, 'Call', 2], [4.5, 'Call', 3], [5.2, 'Call', 4], [5.82, 'Call', 4]] },
	{ name: 'Text', items: [[1.05, 'Text', 1], [3.45, 'Text', 2], [4.55, 'Text', 3], [5.5, 'Text', 4]] },
];

const DETAILS: Record<Phase, [string, string]> = {
	1: [
		'Phase 1 · Introducing enhanced care',
		'For the 42.1% happy with what they had: CareSignal arrives as part of their plan benefits, by formal invitation and a condition-specific letter, then emails and a text.',
	],
	2: [
		'Phase 2 · Need more information?',
		'For the 10% who didn’t see their condition as an issue: education first, so an agent’s first call reaches someone who has already heard from us.',
	],
	3: [
		'Phase 3 · Last chance to enroll',
		'For the 7.7% who wanted to ask a spouse or doctor: a deadline gives a reason to talk now, backed by a reminder postcard and materials for provider offices.',
	],
	4: [
		'Phase 4 · We saved you a spot',
		'For members who took eight or more calls to reach: after a pause sized to call-center capacity, a final round concentrates calls, with evening hours, plus a text.',
	],
};

const IDLE: [string, string] = [
	'Choose a reason to see the phase built for it',
	'Each phase’s message, channel mix, and timing answers one of the most common reasons members declined across CareSignal’s outreach campaigns.',
];

const DURATION = 9000;
const phaseAt = (w: number): Phase => (w < 2 ? 1 : w < 4 ? 2 : w < 5 ? 3 : 4);

export function JourneyFigure() {
	const [current, setCurrent] = useState<Phase | 0>(0);
	// Playback: `k` is progress 0–1 while the playhead runs; `playing` stays
	// on for a beat after the end so the last chips linger.
	const [playing, setPlaying] = useState(false);
	const [running, setRunning] = useState(false);
	const [k, setK] = useState(0);
	const [played, setPlayed] = useState(false);
	const [detail, setDetail] = useState<[string, string]>(IDLE);
	const raf = useRef<number | null>(null);
	const linger = useRef<ReturnType<typeof setTimeout> | null>(null);

	const stop = () => {
		if (raf.current != null) cancelAnimationFrame(raf.current);
		raf.current = null;
		if (linger.current) clearTimeout(linger.current);
		linger.current = null;
		setRunning(false);
		setPlaying(false);
		setPlayed(false);
		setK(0);
	};

	useEffect(
		() => () => {
			if (raf.current != null) cancelAnimationFrame(raf.current);
			if (linger.current) clearTimeout(linger.current);
		},
		[],
	);

	const select = (p: Phase | 0) => {
		stop();
		const next = current === p ? 0 : p;
		setCurrent(next);
		setDetail(next ? DETAILS[next] : IDLE);
	};

	const play = () => {
		if (running) {
			stop();
			return;
		}
		stop();
		setCurrent(0);
		if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
			setCurrent(1);
			setDetail(DETAILS[1]);
			return;
		}
		setPlaying(true);
		setRunning(true);
		let start: number | null = null;
		const frame = (t: number) => {
			if (start == null) start = t;
			const kk = Math.min((t - start) / DURATION, 1);
			const w = kk * 6;
			const p = phaseAt(Math.min(w, 5.99));
			setK(kk);
			setDetail([`Week ${Math.min(Math.floor(w) + 1, 6)} · ${DETAILS[p][0]}`, DETAILS[p][1]]);
			if (kk < 1) {
				raf.current = requestAnimationFrame(frame);
			} else {
				raf.current = null;
				setRunning(false);
				setPlayed(true);
				linger.current = setTimeout(() => {
					setPlaying(false);
					setK(0);
				}, 1600);
			}
		};
		raf.current = requestAnimationFrame(frame);
	};

	const week = k * 6;
	const tlClass = ['timeline', current ? 'focus' : '', playing ? 'playing' : ''].filter(Boolean).join(' ');

	return (
		<Fig
			id="fig-journey"
			title="Why members said no, and the six weeks I designed to answer each reason"
			caption="Campaign flow from my December 2021 strategy. It launched the week of March 7, 2022, with one change: a one-to-four-week pause before Phase 4, sized to call-center capacity. Decline reasons are from all CareSignal outreach campaigns; the 8+ calls figure is from call-only campaigns."
		>
			<div className={current ? 'reasons dim' : 'reasons'} role="group" aria-label="Reasons members declined">
				{REASONS.map((r) => (
					<button
						key={r.p}
						type="button"
						className="reason"
						aria-pressed={current === r.p}
						style={pc(r.p)}
						onClick={() => select(r.p)}
					>
						<span className="r-top">
							<span className="sw" />
							Phase {r.p}
						</span>
						<span className="big">{r.big}</span>
						<span className="why">{r.why}</span>
					</button>
				))}
			</div>

			<div className="tl-scroll">
				<div className={tlClass}>
					<div className="tl-head" aria-hidden="true">
						<span />
						{[1, 2, 3, 4, 5, 6].map((w) => (
							<span key={w}>Week {w}</span>
						))}
					</div>
					<div className="phases">
						<span />
						{PHASES.map((ph) => (
							<button
								key={ph.p}
								type="button"
								className={current === ph.p ? 'phase on' : 'phase'}
								style={pc(ph.p)}
								onClick={() => select(ph.p)}
							>
								<b>{ph.b}</b>
								<em>{ph.em}</em>
							</button>
						))}
					</div>
					<div className="rows">
						{LANES.map((lane) => (
							<div key={lane.name} className="row">
								<div className="rl">{lane.name}</div>
								<div className="lane">
									{lane.items.map(([w, label, p]) => {
										const cls = ['chip', current === p ? 'on' : '', playing && w <= week ? 'shown' : '']
											.filter(Boolean)
											.join(' ');
										return (
											<span key={`${w}-${label}`} className={cls} style={{ ...pc(p), left: `${(w / 6) * 100}%` }}>
												{label}
											</span>
										);
									})}
								</div>
							</div>
						))}
					</div>
					<div
						className="playhead"
						aria-hidden="true"
						style={{ left: `calc(72px + (100% - 72px) * ${k})` }}
					/>
				</div>
			</div>
			<div className="always">
				<b>Every phase:</b> engagement specialists, a self-enrollment portal,
				website pages, the plan’s member services and care teams, provider
				offices, and social posts.
			</div>

			<div className="detail" aria-live="polite">
				<h4>{detail[0]}</h4>
				<p>{detail[1]}</p>
			</div>

			<div className="f1-controls">
				<button className="btn ghost" type="button" onClick={play}>
					{running ? '■ Stop' : played ? '▶ Play again' : '▶ Play the six weeks'}
				</button>
				<button
					className="btn ghost"
					type="button"
					onClick={() => {
						stop();
						setCurrent(0);
						setDetail(IDLE);
					}}
				>
					Show all phases
				</button>
			</div>
		</Fig>
	);
}
