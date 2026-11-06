import { lazy, Suspense } from 'react';

import Text from '../../../src/components/Text';
import Section from '../../../src/features/projects/components/Section';
import type { CareTeamOrbitProps } from '../../../src/features/projects/components/figures/CareTeamOrbit';
import { useInView } from '../../../src/features/projects/components/figures/useInView';

import { FigEmptyState, FigureLink, SectionHeading } from './shared';

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

// Labelled stat lists (20px body), matching the design's plain labelled
// lists rather than big stat tiles.
const statList = {
	fontFamily: 'var(--font-body)',
	fontSize: 20,
	lineHeight: 1.5,
} as const;

// Every Outcomes card: the case study's figure paper, 12px radius, the
// Design Principle cards' padding, so all the cards read as one family.
const card =
	'box-border flex h-full w-full flex-col gap-[16px] rounded-[12px] bg-washes-paper py-[24px] px-[clamp(20px,3vw,36px)] text-confetti-black';

// A workflow outcome card. The title is set like the figure headings
// (headline-small), and `figure` links to the figure that shows the workflow.
function StatPanel({ title, stats, figure }: { title: string; stats: string[]; figure: string }) {
	return (
		<div className={card}>
			<Text variant="headline-small" as="h3" className="m-0 text-confetti-black [text-wrap:pretty]">
				{title}
			</Text>
			<ul className="m-0 flex list-disc flex-col gap-[8px] pl-[1.25em] [text-wrap:pretty]" style={statList}>
				{stats.map((s) => (
					<li key={s}>{s}</li>
				))}
			</ul>
			<FigureLink anchor={figure} />
		</div>
	);
}

function OrbitSlot({ label, anchor, ...props }: CareTeamOrbitProps & { label: string; anchor: string }) {
	const { ref, inView } = useInView();
	const fallback = <FigEmptyState label={label} height={520} loading figure />;
	return (
		<div ref={ref} className="w-full" data-figure-anchor={anchor}>
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

// The NRR figure: the outcome size and weight (type-outcome, 64/64 500), in
// the body sans, upright.
const nrrFigure = {
	fontFamily: 'var(--font-body)',
	fontWeight: 500,
	fontSize: 64,
	lineHeight: '64px',
} as const;

// KLAS.png (606×352) holds both award lockups side by side; each is a
// 234×197 box at (35, 87) and (313, 87). A lockup shows its half by
// sizing/positioning the PNG as a mask over the page ink, which also
// recolours the marks to confetti-black.
const KLAS = '/images/projects/caresignal-platform/KLAS.png';
const KLAS_CROP = { w: 234, h: 197, y: 87, x: { left: 35, right: 313 } };

function KlasLockup({ year, half }: { year: number; half: 'left' | 'right' }) {
	const { w, h, y, x } = KLAS_CROP;
	const pct = (offset: number, box: number, img: number) => `${(offset / (img - box)) * 100}%`;
	const mask = `url(${KLAS}) ${pct(x[half], w, 606)} ${pct(y, h, 352)} / ${(606 / w) * 100}% ${(352 / h) * 100}% no-repeat`;
	return (
		<div
			role="img"
			aria-label={`Best in KLAS ${year}`}
			className="w-full max-w-[120px] bg-confetti-black"
			style={{ aspectRatio: `${w} / ${h}`, mask, WebkitMask: mask }}
		/>
	);
}

export function Outcomes() {
	return (
		<Section>
			<div className="flex w-full flex-col gap-[28px]">
				<div className="flex w-full max-w-[704px] flex-col ml-auto">
					<SectionHeading id="outcomes">Outcomes</SectionHeading>
				</div>

				{/* Business outcomes, ported from the CareSignal Platform case
				    study: NRR stat + Best in KLAS awards, on the same paper and
				    ink as the workflow cards below. */}
				<div className="grid w-full grid-cols-1 gap-[16px] md:grid-cols-3">
					{/* Set like the workflow cards: title, then the figure in
					    the body sans at the outcome size and weight. */}
					<div className={card}>
						<Text variant="headline-small" as="h3" className="m-0 text-confetti-black [text-wrap:pretty]">
							Net Recurring Revenue
						</Text>
						{/* Figure and its qualifier as one unit: tighter than the
						    card's 16px gap. */}
						<div className="flex flex-col gap-[4px]">
							<p className="m-0" style={nrrFigure}>
								144%
							</p>
							<p className="m-0" style={statList}>
								Year over year
							</p>
						</div>
					</div>
					<div className={`${card} md:col-span-2`}>
						<Text variant="headline-small" as="h3" className="m-0 text-confetti-black [text-wrap:pretty]">
							Select
							<br />
							Accolades
						</Text>
						<div className="grid grid-cols-2 gap-[16px]">
							<KlasLockup year={2024} half="left" />
							<KlasLockup year={2025} half="right" />
						</div>
					</div>
				</div>

				{/* The workflow outcomes: full width, three across (stacked on
				    phones), like the design principles; the cards share a row
				    height. Each links to its figure. */}
				<div className="grid w-full grid-cols-1 gap-[16px] md:grid-cols-3">
					<StatPanel
						title="Acute Patient Panel"
						stats={['Providers: 3', 'Patients: 3,250']}
						figure="acute-team"
					/>
					<StatPanel
						title="Hub and Spoke Model"
						stats={['Providers: 2', 'Patients: 300']}
						figure="hub-team"
					/>
					<StatPanel
						title="Centralized Care Management"
						stats={['Before: 100 pts/RN', 'After: 1,500 pts/RN']}
						figure="nurse-day"
					/>
				</div>

				{/* Care Team Orbit, model="acute" */}
				<OrbitSlot
					anchor="acute-team"
					label="Care Team Orbit (acute): a team of three — an assistant, a nurse and a physician — covers 3,250 patients around the clock. About 80% answer a check-in, and alerts are called first."
					model="acute"
					patients={3250}
					alertRate={0.5}
					escalateRate={15}
					{...TEAM}
				/>

				{/* Care Team Orbit, model="hub" */}
				<OrbitSlot
					anchor="hub-team"
					label="Care Team Orbit (hub and spoke): an assistant (the hub) and a nurse (the spoke) share 300 patients. About 80% answer a check-in, and the assistant routes each critical patient to the nurse."
					model="hub"
					patients={300}
					nurses={1}
					{...TEAM}
				/>
			</div>
		</Section>
	);
}
