import Text from '../../../src/components/Text';
import Section from '../../../src/features/projects/components/Section';

import { SectionHeading } from './shared';

const CHALLENGES = [
	'We could not directly influence every person who could block adoption.',
	'A small engineering team forced hard prioritization and sequencing.',
	'Customers needed to realize value quickly despite long sales cycles and uncertain implementation environments.',
];

const LESSONS = [
	'Shadow users early because the real environment changed major product assumptions.',
	'Design for adoption before integration. The product still needed to work independently on day one.',
	'Build governance and decision-making into the product, not just the UI.',
];

export function KeyLearnings() {
	return (
		<Section>
			<div className="flex w-full max-w-[705px] flex-col xl:ml-auto gap-[20px]">
				<SectionHeading id="conclusion">Key Learnings</SectionHeading>
				<div className="flex flex-col gap-[8px]">
					<Text variant="callout-title" as="h3" className="m-0 text-confetti-black">
						Challenges
					</Text>
					<ul className="m-0 flex flex-col gap-[8px] pl-[20px]">
						{CHALLENGES.map((item) => (
							<Text variant="copy" as="li" key={item} className="text-confetti-black/80">
								{item}
							</Text>
						))}
					</ul>
				</div>
				<div className="flex flex-col gap-[8px]">
					<Text variant="callout-title" as="h3" className="m-0 text-confetti-black">
						Lessons Learned
					</Text>
					<ul className="m-0 flex flex-col gap-[8px] pl-[20px]">
						{LESSONS.map((item) => (
							<Text variant="copy" as="li" key={item} className="text-confetti-black/80">
								{item}
							</Text>
						))}
					</ul>
				</div>
			</div>
		</Section>
	);
}
