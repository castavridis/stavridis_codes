import Text from '../../../src/components/Text';
import Section from '../../../src/features/projects/components/Section';

import { CITATIONS } from './citations';
import { DropNumber } from './DropNumber';
import { Citation, SectionHeading } from './shared';

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
				<Citation {...CITATIONS.historicalData} /> Providers normally did
				not have up-to-date data about their patients. Nurses had to manually
				update patients’ current medical statuses during calls.
			</>
		),
	},
];

export function Opportunity() {
	return (
		<Section>
			<div className="flex w-full max-w-[705px] flex-col xl:ml-auto gap-[24px]">
				<SectionHeading id="opportunity">Opportunity</SectionHeading>
				<Text variant="copy-large" className="m-0 text-confetti-black">
					Centralized care management was created to address that gap. These
					care teams could follow up and render necessary care between visits,
					gaining more insight into their patients’ health. However, a standard
					implementation of this approach has downsides:
				</Text>
				{/* Watercolour drop numerals: a rose drop pools into each badge as
				    it scrolls in, drying with a darkened rim (DropNumber). */}
				<ol className="m-0 flex list-none flex-col gap-[24px] pl-[24px]">
					{DOWNSIDES.map((item, i) => (
						<li
							key={item.lead}
							className="grid grid-cols-[28px_minmax(0,1fr)] items-start gap-[16px]"
						>
							<DropNumber n={i + 1} index={i} />
							<Text variant="copy-large" className="m-0 text-confetti-black">
								<strong className="font-semibold text-confetti-black">
									{item.lead}
								</strong>
								{item.rest}
							</Text>
						</li>
					))}
				</ol>
				<Text variant="copy-large" className="m-0 text-confetti-black">
					<strong className="font-semibold text-confetti-black">
						Nurse care managers were able to manage 30 to 100 patients
					</strong>{' '}
					in a standard implementation.
					<Citation {...CITATIONS.standardCaseload} />
					<sup className="type-callout-meta text-confetti-black">,</sup>
					<Citation {...CITATIONS.standardCaseload2} />
				</Text>
			</div>
		</Section>
	);
}
