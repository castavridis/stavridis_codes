import { lazy, Suspense } from 'react';

import OutcomeStat from '../../../src/features/projects/components/OutcomeStat';
import Section from '../../../src/features/projects/components/Section';
import type { CareTeamOrbitProps } from '../../../src/features/projects/components/figures/CareTeamOrbit';
import { useInView } from '../../../src/features/projects/components/figures/useInView';

import { FigPlaceholder, SectionHeading } from './shared';

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

function OrbitSlot({ label, ...props }: CareTeamOrbitProps & { label: string }) {
	const { ref, inView } = useInView();
	const fallback = <FigPlaceholder label={label} height={520} />;
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
				<div className="flex w-full max-w-[705px] flex-col xl:ml-auto gap-[16px]">
					<SectionHeading id="outcomes">Outcomes</SectionHeading>
					<h3 className="type-callout-title m-0 text-confetti-black">
						Centralized Care Management Nurse Panel Size
					</h3>
					<div className="flex flex-wrap gap-[24px]">
						<OutcomeStat stat="100" caption="Patients per nurse, before" />
						<OutcomeStat stat="1,500" caption="Patients per nurse, after" />
					</div>
				</div>

				<div className="flex w-full max-w-[705px] flex-col xl:ml-auto gap-[16px]">
					<h3 className="type-callout-title m-0 text-confetti-black">
						Acute Patient Panel
					</h3>
					<div className="flex flex-wrap gap-[24px]">
						<OutcomeStat stat="3" caption="Providers" />
						<OutcomeStat stat="3,500" caption="Patients" />
					</div>
				</div>

				{/* Care Team Orbit, model="acute" */}
				<OrbitSlot
					label="Care Team Orbit (acute): a team of three — an assistant, a nurse and a physician — covers 3,500 patients around the clock. About 80% answer a check-in, and alerts are called first."
					model="acute"
					patients={3500}
					alertRate={0.5}
					escalateRate={15}
					{...TEAM}
				/>

				<div className="flex w-full max-w-[705px] flex-col xl:ml-auto gap-[16px]">
					<h3 className="type-callout-title m-0 text-confetti-black">
						Hub and Spoke Model
					</h3>
					<div className="flex flex-wrap gap-[24px]">
						<OutcomeStat stat="2" caption="Providers" />
						<OutcomeStat stat="330" caption="Patients" />
					</div>
				</div>

				{/* Care Team Orbit, model="hub" */}
				<OrbitSlot
					label="Care Team Orbit (hub and spoke): an assistant (the hub) and a nurse (the spoke) share 330 patients. About 80% answer a check-in, and the assistant routes each critical patient to the nurse."
					model="hub"
					patients={330}
					nurses={1}
					{...TEAM}
				/>
			</div>
		</Section>
	);
}
