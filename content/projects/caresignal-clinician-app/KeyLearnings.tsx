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

const groupTitle = {
	fontFamily: 'var(--font-kyoto)',
	fontWeight: 500,
	fontSize: 28,
	lineHeight: 1.2,
} as const;
const listStyle = {
	fontFamily: 'var(--font-body)',
	fontSize: 20,
	lineHeight: 1.5,
} as const;

function LearnList({ items }: { items: string[] }) {
	return (
		<ul
			className="m-0 flex list-disc flex-col gap-[8px] pl-[24px] text-confetti-black [text-wrap:pretty] marker:text-confetti-black"
			style={listStyle}
		>
			{items.map((it) => (
				<li key={it}>{it}</li>
			))}
		</ul>
	);
}

export function KeyLearnings() {
	return (
		<Section>
			<div className="flex w-full max-w-[704px] flex-col gap-[20px] ml-auto">
				<SectionHeading id="conclusion">Key Learnings</SectionHeading>
				<h3 className="m-0 text-confetti-black" style={groupTitle}>
					Challenges
				</h3>
				<LearnList items={CHALLENGES} />
				<h3 className="m-0 text-confetti-black" style={groupTitle}>
					Lessons Learned
				</h3>
				<LearnList items={LESSONS} />
			</div>
		</Section>
	);
}
