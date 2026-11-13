import { Fragment, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';

import { Fig } from './shared';

// Figure 9 — eight cohorts, each running the same six-week journey, launched
// a week apart. A slider scrubs the weeks; the iteration loop (on by
// default) boxes the two cohorts whose early weeks informed the one
// launching now.

const WEEKS = 14;
const COHORTS = 8;
const LABELS = Array.from({ length: WEEKS }, (_, i) => `Wk ${i + 1}`);

type Cell = { kind: 'empty' } | { kind: 'pause' } | { kind: 'week'; phase: 1 | 2 | 3 | 4; wk: number };

// Weeks 1–5, a capacity pause, then week 6.
function cellAt(c: number, w: number): Cell {
	const k = w - c;
	if (k === 5) return { kind: 'pause' };
	if (k >= 0 && k < 7) {
		const phase = k < 2 ? 1 : k < 4 ? 2 : k < 5 ? 3 : 4;
		return { kind: 'week', phase, wk: k < 5 ? k + 1 : 6 };
	}
	return { kind: 'empty' };
}

function weekNote(w: number) {
	const active: string[] = [];
	for (let c = 0; c < COHORTS; c++) {
		const k = w - c;
		if (k >= 0 && k < 5) active.push(`cohort ${c + 1} in week ${k + 1}`);
		else if (k === 5) active.push(`cohort ${c + 1} pausing`);
		else if (k === 6) active.push(`cohort ${c + 1} in week 6`);
	}
	const finished = Math.max(0, Math.min(COHORTS, w - 6));
	return `Week ${w + 1}: ${active.join(', ')}.${finished ? ` ${finished} cohort${finished > 1 ? 's have' : ' has'} finished.` : ''}`;
}

type Box = { left: number; top: number; width: number; height: number };
type Loop = { src: Box; cur: Box; d: string; w: number; h: number };

const boxStyle = (b: Box): CSSProperties => ({ left: b.left, top: b.top, width: b.width, height: b.height });

export function CohortsFigure() {
	const [week, setWeek] = useState(2);
	const [loopOn, setLoopOn] = useState(true);
	const [infoOpen, setInfoOpen] = useState(false);
	const [geo, setGeo] = useState<Loop | null>(null);
	const gridRef = useRef<HTMLDivElement>(null);
	const infoRef = useRef<HTMLButtonElement>(null);
	const popRef = useRef<HTMLDivElement>(null);

	// The cohort launching this week (cohort 3 at the earliest).
	const cur = Math.max(2, Math.min(7, week));
	const rowClass = (r: number) => {
		if (!loopOn) return '';
		if (r === cur) return ' lp-cur';
		if (r === cur - 1 || r === cur - 2) return '';
		return ' lp-dim';
	};

	// Measure the loop: a box around the source cohorts' cells, one around
	// the current cohort's, and an elbow arrow between them.
	useLayoutEffect(() => {
		const grid = gridRef.current;
		if (!grid || !loopOn) {
			setGeo(null);
			return;
		}
		const measure = () => {
			const bounds = (rows: number[]): Box | null => {
				let L = Infinity, T = Infinity, R = -Infinity, B = -Infinity;
				rows.forEach((r) =>
					grid.querySelectorAll<HTMLElement>(`.cell[data-r="${r}"]`).forEach((el) => {
						L = Math.min(L, el.offsetLeft);
						T = Math.min(T, el.offsetTop);
						R = Math.max(R, el.offsetLeft + el.offsetWidth);
						B = Math.max(B, el.offsetTop + el.offsetHeight);
					}),
				);
				if (!Number.isFinite(L)) return null;
				const pad = 4;
				return { left: L - pad, top: T - pad, width: R - L + pad * 2, height: B - T + pad * 2 };
			};
			const src = bounds([cur - 2, cur - 1]);
			const curB = bounds([cur]);
			if (!src || !curB) return;
			const x0 = src.left, y0 = src.top + src.height / 2, xl = src.left - 16;
			const y1 = curB.top + curB.height / 2, x1 = curB.left - 4;
			setGeo({ src, cur: curB, d: `M${x0} ${y0}H${xl}V${y1}H${x1}`, w: grid.scrollWidth, h: grid.scrollHeight });
		};
		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(grid);
		document.fonts?.ready.then(measure).catch(() => {});
		return () => ro.disconnect();
	}, [loopOn, cur]);

	// Notes popover: outside click or Escape closes it. Escape is captured
	// and stopped so the sheet overlay doesn't close too.
	useEffect(() => {
		if (!infoOpen) return;
		const onDown = (e: PointerEvent) => {
			const t = e.target as Node;
			if (!popRef.current?.contains(t) && !infoRef.current?.contains(t)) setInfoOpen(false);
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key !== 'Escape') return;
			e.stopImmediatePropagation();
			setInfoOpen(false);
			infoRef.current?.focus();
		};
		document.addEventListener('pointerdown', onDown);
		window.addEventListener('keydown', onKey, true);
		return () => {
			document.removeEventListener('pointerdown', onDown);
			window.removeEventListener('keydown', onKey, true);
		};
	}, [infoOpen]);

	const note = loopOn
		? `Cohort ${cur + 1} launches with updated materials based on what cohorts ${cur - 1} and ${cur} showed. From week 3 on, every new cohort starts from the latest learnings.`
		: weekNote(week);

	return (
		<Fig
			id="fig-weeks"
			titleWrap="coh-head"
			title={
				<>
					Intention: Stagger cohorts to accommodate quick iterations in order to
					reach 20% enrollment within three months of launch
					<button
						ref={infoRef}
						type="button"
						className="coh-info"
						aria-expanded={infoOpen}
						aria-controls="me-cohpop"
						aria-label="Notes and assumptions"
						onClick={() => setInfoOpen((o) => !o)}
					>
						i
					</button>
				</>
			}
		>
			<div
				ref={popRef}
				className="coh-pop"
				id="me-cohpop"
				role="dialog"
				aria-label="Notes and assumptions"
				hidden={!infoOpen}
			>
				<b>Notes and assumptions</b>
				<p>
					Each cohort ran the same six-week journey, launched a week apart; the
					actual schedule depended on list sizes.
				</p>
				<p>
					Between weeks 5 and 6, each cohort paused for one to four weeks, sized
					to call-center capacity. It’s drawn here as one week.
				</p>
				<p>
					The approved materials stayed fixed, so what earlier cohorts showed went
					into what we controlled, like calls and voicemail, and the rest became
					documented recommendations.
				</p>
			</div>
			<div className="coh-ctl">
				<label className="coh-wk" htmlFor="me-week">
					Week <b>{LABELS[week]}</b>
				</label>
				<input
					type="range"
					id="me-week"
					min={0}
					max={WEEKS - 1}
					step={1}
					value={week}
					aria-describedby="me-cohnote"
					onChange={(e) => setWeek(+e.target.value)}
				/>
				<button
					type="button"
					className="coh-loop"
					aria-pressed={loopOn}
					onClick={() => {
						const on = !loopOn;
						setLoopOn(on);
						if (on && week < 2) setWeek(2);
					}}
				>
					Show the iteration loop
				</button>
			</div>
			<div className="coh-scroll">
				<div
					ref={gridRef}
					className={loopOn ? 'cohorts loop2' : 'cohorts'}
					role="img"
					aria-label="Eight cohorts, each running the same six-week journey, launched one week apart across thirteen weeks"
				>
					<div className="h" />
					{LABELS.map((d, i) => (
						<div key={d} className={i === week ? 'h now' : 'h'}>
							{d}
						</div>
					))}
					{Array.from({ length: COHORTS }, (_, c) => (
						<Fragment key={c}>
							<div className={`rl${rowClass(c)}`}>Cohort {c + 1}</div>
							{LABELS.map((_, w) => {
								const cell = cellAt(c, w);
								const now = w === week ? ' now' : '';
								if (cell.kind === 'empty') return <div key={w} />;
								if (cell.kind === 'pause')
									return <div key={w} className={`cell pz${now}${rowClass(c)}`} data-r={c} aria-hidden="true" />;
								return (
									<div key={w} className={`cell p${cell.phase}${now}${rowClass(c)}`} data-r={c}>
										{cell.wk}
									</div>
								);
							})}
						</Fragment>
					))}
					{geo ? (
						<>
							<div className="loop-box" style={boxStyle(geo.src)} />
							<div className="loop-box" style={boxStyle(geo.cur)} />
							<svg className="loop-arrow" width={geo.w} height={geo.h} aria-hidden="true">
								<defs>
									<marker
										id="me-loopHead"
										viewBox="0 0 10 10"
										refX="8"
										refY="5"
										markerWidth="7"
										markerHeight="7"
										orient="auto-start-reverse"
									>
										<path d="M0 0L10 5L0 10z" fill="currentColor" stroke="none" />
									</marker>
								</defs>
								<path d={geo.d} markerEnd="url(#me-loopHead)" />
							</svg>
						</>
					) : null}
				</div>
			</div>
			<p className="coh-note" id="me-cohnote" aria-live="polite">
				{note}
			</p>
			<ul className="coh-key" aria-label="Phases">
				<li style={{ ['--pc' as string]: 'var(--p1)' }}>Phase 1 · weeks 1–2</li>
				<li style={{ ['--pc' as string]: 'var(--p2)' }}>Phase 2 · weeks 3–4</li>
				<li style={{ ['--pc' as string]: 'var(--p3)' }}>Phase 3 · week 5</li>
				<li style={{ ['--pc' as string]: 'var(--p4)' }}>Phase 4 · week 6</li>
				<li className="coh-key-pz">Pause · 1–4 weeks</li>
			</ul>
		</Fig>
	);
}
