import Text from '../../../src/components/Text';
import Section from '../../../src/features/projects/components/Section';

import { CITATIONS } from './citations';
import {
	BackdropWindowShot,
	Citation,
	IMG,
	SectionHeading,
} from './shared';

export function ProductMarketFit() {
	return (
		<Section>
			<div className="flex w-full flex-col gap-[28px]">
				<div className="flex w-full max-w-[704px] flex-col ml-auto gap-[16px]">
					<SectionHeading id="product-market-fit">
						Finding Product-Market Fit
					</SectionHeading>
					<p
						className="m-0 text-confetti-black [text-wrap:balance]"
						style={{
							fontFamily: 'var(--font-kyoto)',
							fontWeight: 500,
							fontSize: 'clamp(28px,3vw,36px)',
							lineHeight: 1.22,
						}}
					>
						I transitioned our clinician application from a research project
						to a commercial product.
					</p>
					<Text variant="copy-large" className="m-0 text-confetti-black">
						When we started commercializing CareSignal, we sold to
						organizations of different sizes. We had enterprise contracts in
						our pipeline but the average time to close was 18 months.
						<Citation {...CITATIONS.salesCycle} /> We bet we could
						acquire small practices faster at a lower cost with fewer updates
						to our current product.
					</Text>
					<Text variant="copy-large" className="m-0 text-confetti-black">
						Part of the motivation to target small practices was that we
						assumed that the doctors could control their budgets and were
						motivated to increase their upside through MACRA, MIPS, and CCM.
						Some of our early contracts supported that hypothesis. I designed
						flows our small-practice early adopters requested: support for
						Chronic Care Management.
					</Text>
				</div>

				<BackdropWindowShot
					src={`${IMG}/fig-enrollment-options.png`}
					width={2518}
					height={2286}
					insetX="17%"
					alt="Two paper enrollment forms overlapping. In front, an EpxDiabetes prescription pad: an internal-use half with message type, start date and frequency checkboxes, a verbal-consent box and the physician's signature, beside step-by-step admin instructions for enrolling the patient online; and a tear-off patient half explaining the text and phone service and how to opt out. Behind it, an Epharmix batch enrollment sheet with repeating rows for a patient's name, phone, MRN, delivery method, language, dialysis-day messaging schedule and start and end dates."
				>
					Ways to enroll patients without a screen.
				</BackdropWindowShot>

				<div className="flex w-full max-w-[704px] flex-col ml-auto gap-[16px]">
					<Text variant="copy-large" className="m-0 text-confetti-black">
						I also designed ways for our doctors to enroll patients without
						logging into the system. One of our early pricing models charged
						per patient, similar to other SaaS models. The small practices
						needed a way to fill those seats. But like our researchers, staff
						at our prospects were rarely at a computer and eschewed the notion
						of pulling up a screen in front of patients unless necessary.
					</Text>
				</div>

				<div className="flex w-full max-w-[704px] flex-col ml-auto gap-[16px]">
					<Text variant="copy-large" className="m-0 text-confetti-black">
						We were able to successfully close a few small practices before
						our enterprise contracts closed. However it became clear they
						could not be our target customer.
					</Text>
					<ul
						className="m-0 flex list-disc flex-col gap-[8px] pl-[24px] text-confetti-black [text-wrap:pretty] marker:text-confetti-black"
						style={{ fontFamily: 'var(--font-body)', fontSize: 20, lineHeight: 1.5 }}
					>
						<li>
							The perception of organizational updates needed to adopt new
							technology cooled prospects to buying CareSignal, despite the
							potential upside.
						</li>
						<li>
							Small practices that did adopt CareSignal needed the same amount
							of account management time to periodically train and support
							staff as our enterprise customers.
						</li>
					</ul>
					<Text variant="copy-large" className="m-0 text-confetti-black">
						After we closed our enterprise clients, we quickly found they were
						a better fit and I started to design our application for scale.
					</Text>
				</div>
			</div>
		</Section>
	);
}
