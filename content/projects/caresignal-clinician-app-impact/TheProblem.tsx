import Text from '../../../src/components/Text';
import Section from '../../../src/features/projects/components/Section';
import WashHighlight from '../../../src/features/projects/components/figures/WashHighlight';

import { CITATIONS } from './citations';
import { Citation, isPlaceholderCitation, SectionHeading } from './shared';

const CHALLENGES: Array<{ lead: string; rest: string }> = [
	{
		lead: 'Identifying which patients need attention.',
		rest: ' Patient replies had to become signals a nurse could trust at a glance.',
	},
	{
		lead: 'Helping nurses prioritize care.',
		rest: ' With a panel of 1,500, nurses needed to know where to start, and when they were done.',
	},
	{
		lead: 'Supporting different clinical workflows.',
		rest: ' Every customer, team and patient needed different rules, without bypassing clinical sign-off.',
	},
];

// How the product grew, as a row of mono pills joined by arrows.
const STAGES = ['Research tool', 'Small practices', 'Enterprise care teams'];

export function TheProblem() {
	return (
		<Section>
			<div className="flex w-full max-w-[704px] flex-col ml-auto gap-[16px]">
				{/* Keeps the `background` id: the nav aligns to #background h3. */}
				<SectionHeading id="background">The Problem</SectionHeading>
				<Text variant="copy-large" className="m-0 text-confetti-black">
					Providers see a patient for a 30-minute visit
					<Citation {...CITATIONS.visitLength} />, maybe four times a year
					<Citation {...CITATIONS.visitFrequency} />: about two hours of care a
					year.
				</Text>
				<Text variant="copy-large" className="m-0 font-semibold text-confetti-black">
					What about care needed during the other{' '}
					<WashHighlight
						mark="highlight"
						pigment="hansa"
						delay={64}
						threshold={1}
						duration={650}
						instantDry
					>
						6,208 waking hours
					</WashHighlight>
					?
					<Citation {...CITATIONS.wakingHours} />
				</Text>
				<Text variant="copy-large" className="m-0 text-confetti-black">
					Centralized care management teams were created to follow up between
					visits. But their panels were built from historical data
					<Citation {...CITATIONS.historicalData} />, and nurses learned how
					patients were doing by calling down a list. Most calls went
					unanswered, urgent needs still slipped through, and{' '}
					<strong className="font-semibold text-confetti-black">
						a nurse could manage only 30 to 100 patients.
					</strong>
					<Citation {...CITATIONS.standardCaseload} />
					{/* The comma only separates two shown citations. */}
					{!isPlaceholderCitation(CITATIONS.standardCaseload.source) &&
					!isPlaceholderCitation(CITATIONS.standardCaseload2.source) ? (
						<sup className="type-callout-meta text-confetti-black">,</sup>
					) : null}
					<Citation {...CITATIONS.standardCaseload2} />
				</Text>
				<Text variant="copy-large" className="m-0 text-confetti-black">
					CareSignal replaced the call list with automated, evidence-based
					check-ins by text and phone. As CareSignal’s sole Product Designer
					through acquisition, I designed the application that turns those
					replies into a nurse’s day. Three challenges shaped it:
				</Text>
				<ol className="m-0 flex list-none flex-col gap-[16px] pl-0 min-[600px]:pl-[24px]">
					{CHALLENGES.map((item, i) => (
						<li
							key={item.lead}
							className="grid grid-cols-[28px_minmax(0,1fr)] items-start gap-[12px] min-[600px]:gap-[16px]"
						>
							<span
								aria-hidden="true"
								className="bg-cs-red mt-[2px] inline-flex size-[28px] items-center justify-center rounded-full font-bold text-white"
								style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1 }}
							>
								{i + 1}
							</span>
							<Text variant="copy-large" className="m-0 text-confetti-black">
								<strong className="font-semibold text-confetti-black">
									<a href={`#challenge-${i + 1}`} className="text-inherit">
										{item.lead}
									</a>
								</strong>
								{item.rest}
							</Text>
						</li>
					))}
				</ol>
				<div
					aria-label="How the product grew"
					className="flex flex-wrap items-center gap-[8px] text-[12px] leading-[16px] tracking-[0.04em] text-confetti-black min-[600px]:pl-[24px]"
					style={{ fontFamily: 'var(--font-mono)' }}
				>
					{STAGES.map((stage, i) => (
						<span key={stage} className="inline-flex items-center gap-[8px] whitespace-nowrap">
							<span
								className="rounded-full px-[12px] py-[4px]"
								style={{ border: '1.25px solid var(--color-confetti-black)' }}
							>
								{stage}
							</span>
							{i < STAGES.length - 1 ? <span aria-hidden="true">→</span> : null}
						</span>
					))}
				</div>
			</div>
		</Section>
	);
}
