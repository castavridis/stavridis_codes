import { lazy, Suspense, useEffect, useRef, useState } from 'react';

import Section from '../../../src/features/projects/components/Section';

import { openAssumptions } from './AssumptionsModal';
import { FigPlaceholder } from './shared';

// Figure 1 — "A centralized nurse care manager's shift before and after
// CareSignal": the nurse-orbit R3F simulation, lazy-mounted so the three.js
// chunk stays out of the first load. The Figure chip and heading live inside
// NurseDayFigure (the design puts them in the figure card's header).
const NurseDaySim = lazy(() =>
	import('./NurseDayFigure').then((m) => ({ default: m.NurseDayFigure })),
);

const PLACEHOLDER_LABEL =
	'animated figure: one nurse’s 7-hour day. Before: he phones down a list of 100 patients whose status is unknown; most calls go unanswered. After CareSignal: 1,600 patients check in by text, about 80% reply, and he starts with alerts and high-risk patients.';

// Mount-once in-view gate: start loading the simulation chunk shortly before
// the figure scrolls into view.
function useInView<T extends HTMLElement>(rootMargin = '400px') {
	const ref = useRef<T>(null);
	const [inView, setInView] = useState(false);
	useEffect(() => {
		const el = ref.current;
		if (!el || inView) return;
		if (!('IntersectionObserver' in window)) {
			setInView(true);
			return;
		}
		const io = new IntersectionObserver(
			(es) => {
				if (es.some((e) => e.isIntersecting)) {
					setInView(true);
					io.disconnect();
				}
			},
			{ rootMargin },
		);
		io.observe(el);
		return () => io.disconnect();
	}, [inView, rootMargin]);
	return { ref, inView };
}

export function HeroFigure() {
	const { ref, inView } = useInView<HTMLDivElement>();
	const fallback = <FigPlaceholder label={PLACEHOLDER_LABEL} height={520} />;
	return (
		<Section>
			<div ref={ref}>
				{inView ? (
					<Suspense fallback={fallback}>
						<NurseDaySim onAssumptions={openAssumptions} />
					</Suspense>
				) : (
					fallback
				)}
			</div>
		</Section>
	);
}
