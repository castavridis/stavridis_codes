import Section from '../../../src/features/projects/components/Section';

import { CITATIONS } from './citations';
import { Citation, SectionHeading } from './shared';

export function Background() {
	return (
		<Section>
			<div className="flex w-full max-w-[705px] flex-col gap-[16px]">
				<SectionHeading id="background">Background</SectionHeading>
				<p className="type-copy m-0 text-confetti-black/80">
					In a perfect world, providers would be able to deliver the right care
					to the right patients at the right time. In reality, providers see
					their patients during a 30-minute visit
					<Citation {...CITATIONS.visitLength} />, maybe four times a year
					<Citation {...CITATIONS.visitFrequency} />. Those visits may
					encompass a total of two hours a year.
				</p>
				<p className="type-copy-large m-0 font-bold text-confetti-black">
					{/* "6,208 waking hours" gets the wash highlight once the
					    wash-highlight engine is ported */}
					What about care needed during the other 6,208 waking hours?
					<Citation {...CITATIONS.wakingHours} />
				</p>
			</div>
		</Section>
	);
}
