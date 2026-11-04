import OutcomeStat from '../../../src/features/projects/components/OutcomeStat';
import Section from '../../../src/features/projects/components/Section';

import { FigPlaceholder, SectionHeading } from './shared';

export function Outcomes() {
	return (
		<Section>
			<div className="flex w-full flex-col gap-[28px]">
				<div className="flex w-full max-w-[705px] flex-col gap-[16px]">
					<SectionHeading id="outcomes">Outcomes</SectionHeading>
					<h3 className="type-callout-title m-0 text-confetti-black">
						Centralized Care Management Nurse Panel Size
					</h3>
					<div className="flex flex-wrap gap-[24px]">
						<OutcomeStat stat="100" caption="Patients per nurse, before" />
						<OutcomeStat stat="1,500" caption="Patients per nurse, after" />
					</div>
				</div>

				<div className="flex w-full max-w-[705px] flex-col gap-[16px]">
					<h3 className="type-callout-title m-0 text-confetti-black">
						Acute Patient Panel
					</h3>
					<div className="flex flex-wrap gap-[24px]">
						<OutcomeStat stat="3" caption="Providers" />
						<OutcomeStat stat="3,500" caption="Patients" />
					</div>
				</div>

				{/* Care Team Orbit, model="acute" — watercolour-orbit engine,
				    ported separately */}
				<FigPlaceholder
					label="Care Team Orbit (acute): a team of three — an assistant, a nurse and a physician — covers 3,500 patients around the clock. About 80% answer a check-in, and alerts are called first."
					height={520}
				/>

				<div className="flex w-full max-w-[705px] flex-col gap-[16px]">
					<h3 className="type-callout-title m-0 text-confetti-black">
						Hub and Spoke Model
					</h3>
					<div className="flex flex-wrap gap-[24px]">
						<OutcomeStat stat="2" caption="Providers" />
						<OutcomeStat stat="330" caption="Patients" />
					</div>
				</div>

				{/* Care Team Orbit, model="hub" */}
				<FigPlaceholder
					label="Care Team Orbit (hub and spoke): an assistant (the hub) and a nurse (the spoke) share 330 patients. About 80% answer a check-in, and the assistant routes each critical patient to the nurse."
					height={520}
				/>
			</div>
		</Section>
	);
}
