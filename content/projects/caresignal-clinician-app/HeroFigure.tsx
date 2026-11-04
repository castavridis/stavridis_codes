import { lazy, Suspense } from 'react';

import Section from '../../../src/features/projects/components/Section';
import { useInView } from '../../../src/features/projects/components/figures/useInView';

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

export function HeroFigure() {
	const { ref, inView } = useInView();
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
