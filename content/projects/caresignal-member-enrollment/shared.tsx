import {
	Children,
	isValidElement,
	useCallback,
	useEffect,
	useRef,
	useState,
	type CSSProperties,
	type ReactNode,
} from 'react';

import Text from '../../../src/components/Text';
import Figure from '../../../src/features/projects/components/figures/Figure';

// ── Figures ─────────────────────────────────────────────────

const ICON_IN = (
	<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
		<path d="M1.5 6V1.5H6M10 1.5h4.5V6M14.5 10v4.5H10M6 14.5H1.5V10" />
	</svg>
);
const ICON_OUT = (
	<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
		<path d="M6 1.5V6H1.5M14.5 6H10V1.5M10 14.5V10h4.5M1.5 10H6v4.5" />
	</svg>
);

// A case-study figure: auto-numbered "figure N" chip, title, body, caption,
// and an Expand button that fills the window (Escape collapses).
export function Fig({
	id,
	title,
	caption,
	children,
}: {
	id: string;
	title: ReactNode;
	caption: ReactNode;
	children: ReactNode;
}) {
	const [expanded, setExpanded] = useState(false);
	const btnRef = useRef<HTMLButtonElement>(null);
	const titleId = `${id}-t`;

	useEffect(() => {
		if (!expanded) return;
		document.body.classList.add('me-fs-lock');
		// Capture + stop: the sheet overlay also closes on Escape (on window).
		const onKey = (e: KeyboardEvent) => {
			if (e.key !== 'Escape') return;
			e.stopImmediatePropagation();
			setExpanded(false);
		};
		window.addEventListener('keydown', onKey, true);
		window.dispatchEvent(new Event('resize'));
		const btn = btnRef.current;
		return () => {
			document.body.classList.remove('me-fs-lock');
			window.removeEventListener('keydown', onKey, true);
			window.dispatchEvent(new Event('resize'));
			btn?.focus();
		};
	}, [expanded]);

	return (
		<figure id={id} aria-labelledby={titleId} className={expanded ? 'is-expanded' : undefined}>
			<button
				ref={btnRef}
				type="button"
				className="fs-btn"
				aria-pressed={expanded}
				aria-label={expanded ? 'Collapse figure' : 'Expand figure to fill the window'}
				onClick={() => setExpanded((v) => !v)}
			>
				{expanded ? ICON_OUT : ICON_IN}
				<span className="fs-l">{expanded ? 'Collapse' : 'Expand'}</span>
			</button>
			<Figure />
			<div className="fig-t" id={titleId}>
				{title}
			</div>
			{children}
			<figcaption>{caption}</figcaption>
		</figure>
	);
}

// ── Carousel ────────────────────────────────────────────────

// Scroll-snap carousel: arrows, dots, "n of N", ←/→ on the track. Each
// child is one slide; `titles` label the slides and their dots.
export function Carousel({
	label,
	titles,
	dotLabel,
	children,
}: {
	label: string;
	titles: string[];
	dotLabel: (i: number, title: string) => string;
	children: ReactNode;
}) {
	const trackRef = useRef<HTMLDivElement>(null);
	const [cur, setCur] = useState(0);
	const slides = Children.toArray(children).filter(isValidElement);
	const n = slides.length;

	const go = useCallback(
		(i: number) => {
			const track = trackRef.current;
			if (!track) return;
			const k = Math.max(0, Math.min(n - 1, i));
			const slide = track.children[k] as HTMLElement | undefined;
			if (slide) track.scrollTo({ left: slide.offsetLeft - track.offsetLeft, behavior: 'smooth' });
		},
		[n],
	);

	useEffect(() => {
		const track = trackRef.current;
		if (!track) return;
		let t: ReturnType<typeof setTimeout> | undefined;
		const onScroll = () => {
			clearTimeout(t);
			t = setTimeout(() => {
				const i = Math.round(track.scrollLeft / (track.clientWidth + 24));
				setCur(Math.max(0, Math.min(n - 1, i)));
			}, 60);
		};
		track.addEventListener('scroll', onScroll, { passive: true });
		return () => {
			clearTimeout(t);
			track.removeEventListener('scroll', onScroll);
		};
	}, [n]);

	return (
		<>
			<div
				ref={trackRef}
				className="carousel-track"
				tabIndex={0}
				role="group"
				aria-roledescription="carousel"
				aria-label={label}
				onKeyDown={(e) => {
					if (e.key === 'ArrowRight') {
						e.preventDefault();
						go(cur + 1);
					} else if (e.key === 'ArrowLeft') {
						e.preventDefault();
						go(cur - 1);
					}
				}}
			>
				{slides.map((s, i) => (
					<div
						key={i}
						role="group"
						aria-roledescription="slide"
						aria-label={`${i + 1} of ${n}: ${titles[i] ?? ''}`}
						aria-hidden={i !== cur}
						inert={i !== cur}
					>
						{s}
					</div>
				))}
			</div>
			<div className="pf-ctrl" aria-label="Carousel controls">
				<button
					type="button"
					className="pf-nav"
					aria-label="Previous"
					disabled={cur === 0}
					onClick={() => go(cur - 1)}
				>
					←
				</button>
				<div className="pf-dots">
					{slides.map((_, i) => (
						<button
							key={i}
							type="button"
							aria-label={dotLabel(i, titles[i] ?? '')}
							aria-current={i === cur}
							onClick={() => go(i)}
						/>
					))}
				</div>
				<span className="pf-count" aria-live="polite">
					{cur + 1} of {n}
				</span>
				<button
					type="button"
					className="pf-nav"
					aria-label="Next"
					disabled={cur === n - 1}
					onClick={() => go(cur + 1)}
				>
					→
				</button>
			</div>
		</>
	);
}

// ── Prose + decision scaffolding ────────────────────────────

export function Copy({ children, style }: { children: ReactNode; style?: CSSProperties }) {
	return (
		<Text variant="copy-large" className="copy" style={style}>
			{children}
		</Text>
	);
}

export function SectionTitle({ children }: { children: ReactNode }) {
	return (
		<Text as="h2" variant="headline-small">
			{children}
		</Text>
	);
}

export function DecisionHeader({ n, meta, title }: { n: number; meta: string; title: string }) {
	return (
		<>
			<div className="chal-n">
				<b>{n}</b>
				<span>{meta}</span>
			</div>
			<SectionTitle>{title}</SectionTitle>
		</>
	);
}

export function Beat({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="beat">
			<b>{label}</b>
			<div>{children}</div>
		</div>
	);
}

export type Stat = { n: string; c: string };

export function Results({ stats }: { stats: Stat[] }) {
	return (
		<div className="result">
			{stats.map((s) => (
				<div key={s.n}>
					<div className="n">{s.n}</div>
					<div className="c">{s.c}</div>
				</div>
			))}
		</div>
	);
}
