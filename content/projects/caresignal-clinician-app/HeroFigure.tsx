import { lazy, Suspense, useEffect, useState } from 'react';

import Section from '../../../src/features/projects/components/Section';
import { useInView } from '../../../src/features/projects/components/figures/useInView';

import { openAssumptions } from './AssumptionsModal';
import { FigPlaceholder } from './shared';

// Hold the heavy WebGL mount until the browser is idle, so the three.js
// chunk + canvas don't contend with the project sheet's open transition
// (the figure sits near the top, so it would otherwise mount mid-animation).
// requestIdleCallback with a timeout bounds the wait; a plain timeout is the
// fallback where it's unavailable.
function useIdleReady(timeout = 500) {
	const [ready, setReady] = useState(false);
	useEffect(() => {
		const ric = (
			window as typeof window & {
				requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
				cancelIdleCallback?: (id: number) => void;
			}
		);
		if (ric.requestIdleCallback) {
			const id = ric.requestIdleCallback(() => setReady(true), { timeout });
			return () => ric.cancelIdleCallback?.(id);
		}
		const id = window.setTimeout(() => setReady(true), timeout);
		return () => clearTimeout(id);
	}, [timeout]);
	return ready;
}

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
	const idle = useIdleReady();
	const fallback = <FigPlaceholder label={PLACEHOLDER_LABEL} height={520} />;

	{/* FIXME: This margin-top should not have to be forced. Need to update components. */}	
	return (
		<Section className="!mt-[36px]">
			<div ref={ref}>
				{inView && idle ? (
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
