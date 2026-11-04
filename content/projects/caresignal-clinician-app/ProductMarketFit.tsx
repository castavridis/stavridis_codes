import Section from '../../../src/features/projects/components/Section';

import { CITATIONS } from './citations';
import {
	Citation,
	FigCaption,
	FigPlaceholder,
	IMG,
	SectionHeading,
} from './shared';

export function ProductMarketFit() {
	return (
		<Section>
			<div className="flex w-full flex-col gap-[28px]">
				<div className="flex w-full max-w-[705px] flex-col xl:ml-auto gap-[16px]">
					<SectionHeading id="product-market-fit">
						Finding Product-Market Fit
					</SectionHeading>
					<p className="type-headline-small m-0 text-confetti-black">
						I transitioned our clinician application from a research project
						to a commercial product.
					</p>
					<p className="type-copy m-0 text-confetti-black/80">
						When we started commercializing CareSignal, we sold to
						organizations of different sizes. We had enterprise contracts in
						our pipeline but the average time to close was 18 months.
						<Citation {...CITATIONS.salesCycle} /> We bet we could
						acquire small practices faster at a lower cost with fewer updates
						to our current product.
					</p>
					<p className="type-copy m-0 text-confetti-black/80">
						Part of the motivation to target small practices was that we
						assumed that the doctors could control their budgets and were
						motivated to increase their upside through MACRA, MIPS, and CCM.
						Some of our early contracts supported that hypothesis. I designed
						flows our small-practice early adopters requested: support for
						Chronic Care Management.
					</p>
				</div>

				<figure className="m-0 flex w-full flex-col gap-[12px]">
					<img
						src={`${IMG}/fig-ccm-report-timer.webp`}
						alt="A Chronic Care Management activity log report for a patient, listing call logs and call notes with durations, beside the Time Tracker modal with minute and second fields, optional notes and a Change Patient button."
						className="block w-full rounded-[16px]"
					/>
					<FigCaption fig>Chronic Care Management Report and Timer</FigCaption>
				</figure>

				<div className="flex w-full max-w-[705px] flex-col xl:ml-auto gap-[16px]">
					<p className="type-copy m-0 text-confetti-black/80">
						I also designed ways for our doctors to enroll patients without
						logging into the system. One of our early pricing models charged
						per patient, similar to other SaaS models. The small practices
						needed a way to fill those seats. But like our researchers, staff
						at our prospects were rarely at a computer and eschewed the notion
						of pulling up a screen in front of patients unless necessary.
					</p>
				</div>

				<figure className="m-0 flex w-full flex-col gap-[12px]">
					<FigPlaceholder
						label="“Prescription pads and Excel sheets” — ways to input patient data without logging in (imagery to come)"
						height={280}
					/>
				</figure>

				<div className="flex w-full max-w-[705px] flex-col xl:ml-auto gap-[16px]">
					<p className="type-copy m-0 text-confetti-black/80">
						We were able to successfully close a few small practices before
						our enterprise contracts closed. However it became clear they
						could not be our target customer.
					</p>
					<ol className="m-0 flex flex-col gap-[12px] pl-[24px]">
						<li className="type-copy text-confetti-black/80">
							The perception of organizational updates needed to adopt new
							technology cooled prospects to buying CareSignal, despite the
							potential upside.
						</li>
						<li className="type-copy text-confetti-black/80">
							Small practices that did adopt CareSignal needed the same amount
							of account management time to periodically train and support
							staff as our enterprise customers.
						</li>
					</ol>
					<p className="type-copy m-0 text-confetti-black/80">
						After we closed our enterprise clients, we quickly found they were
						a better fit and I started to design our application for scale.
					</p>
				</div>
			</div>
		</Section>
	);
}
