import Text from '../../../src/components/Text';
import Section from '../../../src/features/projects/components/Section';
import WashHighlight from '../../../src/features/projects/components/figures/WashHighlight';

import { CITATIONS } from './citations';
import { Citation, SectionHeading } from './shared';

export function Background() {
	return (
		<Section>
			<div className="flex w-full max-w-[705px] flex-col xl:ml-auto gap-[24px]">
				<SectionHeading id="background">Background</SectionHeading>
				<Text variant="copy-large" className="m-0 text-confetti-black">
					In a perfect world, providers would be able to deliver the right care
					to the right patients at the right time. In reality, providers see
					their patients during a 30-minute visit
					<Citation {...CITATIONS.visitLength} />, maybe four times a year
					<Citation {...CITATIONS.visitFrequency} />. Those visits may
					encompass a total of two hours a year.
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
			</div>
		</Section>
	);
}
