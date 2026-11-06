import { lazy, Suspense } from 'react';

import { Illustration } from '../../../src/features/projects/components/Illustration';
import OutcomeStat from '../../../src/features/projects/components/OutcomeStat';
import Section from '../../../src/features/projects/components/Section';
import type { CareTeamOrbitProps } from '../../../src/features/projects/components/figures/CareTeamOrbit';
import { useInView } from '../../../src/features/projects/components/figures/useInView';

import { FigEmptyState, SectionHeading } from './shared';

const CareTeamOrbit = lazy(
	() => import('../../../src/features/projects/components/figures/CareTeamOrbit'),
);

// Shared orbit/motion tuning for both Care Team Orbit instances, per the
// handoff (Care Team Orbit.dc.html prop defaults).
const TEAM = {
	tilt: 40,
	queueSpeed: 0.1,
	servedSpeed: 0.6,
	poolSpeed: 0.09,
	wobble: 1,
	eccentricity: 1,
	breathe: 4.5,
	alternate: true,
	avatarSize: 120,
	avatarSmall: 100,
	daySeconds: 30,
} satisfies Partial<CareTeamOrbitProps>;

// The panel titles (Kyoto 500 28px) and their labelled stat lists (20px body),
// matching the design's plain labelled lists rather than big stat tiles.
const panelTitle = {
	fontFamily: 'var(--font-kyoto)',
	fontWeight: 500,
	fontSize: 28,
	lineHeight: 1.2,
} as const;
const statList = {
	fontFamily: 'var(--font-body)',
	fontSize: 20,
	lineHeight: 1.5,
} as const;

// A stat panel card, shaped like the Design Principle cards (paper, 12px
// radius, same padding) so the three panels read as one row of three.
function StatPanel({ title, stats }: { title: string; stats: string[] }) {
	return (
		<div className="box-border flex h-full w-full flex-col gap-[16px] rounded-[12px] bg-washes-paper py-[24px] px-[clamp(20px,3vw,36px)]">
			<h3 className="m-0 text-confetti-black [text-wrap:pretty]" style={panelTitle}>
				{title}
			</h3>
			<ul
				className="m-0 flex list-none flex-col gap-[8px] p-0 text-confetti-black [text-wrap:pretty]"
				style={statList}
			>
				{stats.map((s) => (
					<li key={s}>{s}</li>
				))}
			</ul>
		</div>
	);
}

function OrbitSlot({ label, ...props }: CareTeamOrbitProps & { label: string }) {
	const { ref, inView } = useInView();
	const fallback = <FigEmptyState label={label} height={520} loading />;
	return (
		<div ref={ref} className="w-full">
			{inView ? (
				<Suspense fallback={fallback}>
					<CareTeamOrbit {...props} />
				</Suspense>
			) : (
				fallback
			)}
		</div>
	);
}

export function Outcomes() {
	return (
		<Section>
			<div className="flex w-full flex-col gap-[28px]">
				<div className="flex w-full max-w-[704px] flex-col ml-auto">
					<SectionHeading id="outcomes">Outcomes</SectionHeading>
				</div>

				{/* The three panels: full width, three across (stacked on
				    phones), like the design principles; the cards share a row
				    height. The orbits follow in panel order. */}
				<div className="grid w-full grid-cols-1 gap-[16px] md:grid-cols-3">
					<StatPanel
						title="Centralized Care Management Nurse Panel Size"
						stats={['Before: 100', 'After: 1,500']}
					/>
					<StatPanel
						title="Acute Patient Panel"
						stats={['Providers: 3', 'Patients: 3,250']}
					/>
					<StatPanel
						title="Hub and Spoke Model"
						stats={['Providers: 2', 'Patients: 300']}
					/>
				</div>

				{/* Care Team Orbit, model="acute" */}
				<OrbitSlot
					label="Care Team Orbit (acute): a team of three — an assistant, a nurse and a physician — covers 3,250 patients around the clock. About 80% answer a check-in, and alerts are called first."
					model="acute"
					patients={3250}
					alertRate={0.5}
					escalateRate={15}
					{...TEAM}
				/>

				{/* Care Team Orbit, model="hub" */}
				<OrbitSlot
					label="Care Team Orbit (hub and spoke): an assistant (the hub) and a nurse (the spoke) share 300 patients. About 80% answer a check-in, and the assistant routes each critical patient to the nurse."
					model="hub"
					patients={300}
					nurses={1}
					{...TEAM}
				/>

				{/* Business outcomes, ported from the CareSignal Platform case
				    study's Outcomes row: NRR stat + Best in KLAS awards. */}
				<div className="grid w-full grid-cols-1 gap-[16px] sm:grid-cols-2">
					<OutcomeStat stat="144%" caption="Net recurring revenue year over year" />
					<Illustration
						src="/images/projects/caresignal-platform/KLAS.png"
						alt="Best in KLAS 2024 and Best in KLAS 2025"
						width="100%"
						height={176}
						background="#f0eeeb"
						className="text-left md:text-center"
					/>
				</div>
			</div>
		</Section>
	);
}
