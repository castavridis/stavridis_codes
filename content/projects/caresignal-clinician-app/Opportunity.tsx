import Section from '../../../src/features/projects/components/Section';

import { CITATIONS } from './citations';
import { Cite, SectionHeading } from './shared';

const DOWNSIDES: Array<{ lead: string; rest: React.ReactNode }> = [
	{
		lead: 'Nurses had to manually call down their patient lists.',
		rest: ' While nurses’ calls sometimes reached a patient, most of the time the calls didn’t. It was rare to find patients who both answered and required clinical intervention.',
	},
	{
		lead: 'Patients with urgent needs still fell through the cracks.',
		rest: ' There were still gaps between the care teams’ touch points resulting in missed opportunities to prevent unnecessary utilization.',
	},
	{
		lead: 'Patient panels were created using historical data.',
		rest: (
			<>
				<Cite n={5} cite={CITATIONS.historicalData} /> Providers normally did
				not have up-to-date data about their patients. Nurses had to manually
				update patients’ current medical statuses during calls.
			</>
		),
	},
];

export function Opportunity() {
	return (
		<Section>
			<div className="flex w-full max-w-[705px] flex-col gap-[16px]">
				<SectionHeading id="opportunity">Opportunity</SectionHeading>
				<p className="type-copy m-0 text-confetti-black/80">
					Centralized care management was created to address that gap. These
					care teams could follow up and render necessary care between visits,
					gaining more insight into their patients’ health. However, a standard
					implementation of this approach has downsides:
				</p>
				{/* Watercolour drop numerals come with the wash engine; plain
				    numbered badges until then */}
				<ol className="m-0 flex list-none flex-col gap-[16px] p-0">
					{DOWNSIDES.map((item, i) => (
						<li key={item.lead} className="flex gap-[14px]">
							<span className="type-callout-title mt-[2px] flex size-[32px] shrink-0 items-center justify-center rounded-full bg-[#a50e53]/10 font-bold text-[#a50e53]">
								{i + 1}
							</span>
							<p className="type-copy m-0 text-confetti-black/80">
								<strong className="text-confetti-black">{item.lead}</strong>
								{item.rest}
							</p>
						</li>
					))}
				</ol>
				<p className="type-copy m-0 text-confetti-black/80">
					<strong className="text-confetti-black">
						Nurse care managers were able to manage 30 to 100 patients
					</strong>{' '}
					in a standard implementation.
					<Cite n={6} cite={CITATIONS.standardCaseload} />
					<sup className="type-callout-meta text-confetti-black/60">,</sup>
					<Cite n={7} cite={CITATIONS.standardCaseload2} />
				</p>
			</div>
		</Section>
	);
}
