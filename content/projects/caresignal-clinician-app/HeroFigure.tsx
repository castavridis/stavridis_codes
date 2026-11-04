import Section from '../../../src/features/projects/components/Section';

import { FigPlaceholder, Figure } from './shared';

// Figure 1 — "A centralized nurse care manager's shift before and after
// CareSignal". The real figure is the nurse-orbit R3F simulation
// (tmp bundle: nurse-orbit.js + Nurse Day Complete.dc.html); ported
// separately. Placeholder keeps the slot, heading, and aria contract.
export function HeroFigure() {
	return (
		<Section>
			<figure className="m-0 flex w-full flex-col gap-[16px]">
				<Figure />
				<h2 className="type-headline-small m-0 text-confetti-black [text-wrap:balance]">
					A centralized nurse care manager’s shift before and after CareSignal
				</h2>
				<FigPlaceholder
					label="animated figure: one nurse’s 7-hour day. Before: he phones down a list of 100 patients whose status is unknown; most calls go unanswered. After CareSignal: 1,600 patients check in by text, about 80% reply, and he starts with alerts and high-risk patients."
					height={520}
				/>
			</figure>
		</Section>
	);
}
