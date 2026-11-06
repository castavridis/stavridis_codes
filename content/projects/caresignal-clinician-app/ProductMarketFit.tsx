import Text from '../../../src/components/Text';
import Section from '../../../src/features/projects/components/Section';

import { CITATIONS } from './citations';
import {
	BackdropShot,
	Citation,
	FigCaption,
	IMG,
	SectionHeading,
} from './shared';

export function ProductMarketFit() {
	return (
		<Section>
			<div className="flex w-full flex-col gap-[28px]">
				<div className="flex w-full max-w-[704px] flex-col ml-auto gap-[20px]">
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

				<figure className="m-0 flex w-full flex-col items-center gap-[16px]">
					<BackdropShot
						src={`${IMG}/fig-ccm-report-timer.webp`}
						width={1506}
						height={722}
						alt="A Chronic Care Management activity log report for a patient, listing call logs and call notes with durations, beside the Time Tracker modal with minute and second fields, optional notes and a Change Patient button."
					/>
					<FigCaption fig>Chronic Care Management Report and Timer</FigCaption>
				</figure>

				<div className="flex w-full max-w-[704px] flex-col ml-auto gap-[20px]">
					<Text variant="copy-large" className="m-0 text-confetti-black">
						I also designed ways for our doctors to enroll patients without
						logging into the system. One of our early pricing models charged
						per patient, similar to other SaaS models. The small practices
						needed a way to fill those seats. But like our researchers, staff
						at our prospects were rarely at a computer and eschewed the notion
						of pulling up a screen in front of patients unless necessary.
					</Text>
				</div>

				{/* <div
					className="flex w-full flex-col gap-[16px] rounded-[16px] bg-[#f7f6f5]"
					style={{ padding: 'clamp(28px,4vw,48px) clamp(20px,5vw,72px)' }}
				>
					<p
						className="m-0 text-confetti-black"
						style={{ fontFamily: 'var(--font-body)', fontSize: 20, lineHeight: 1.5 }}
					>
						<strong className="font-semibold">
							Prescription pads and Excel sheets
						</strong>{' '}
						Ways to input patient data without logging in.
					</p>
					<span
						className="tracking-[0.04em] text-confetti-black/55"
						style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
					>
						Placeholder — imagery to come
					</span>
				</div> */}

				<div className="flex w-full max-w-[704px] flex-col ml-auto gap-[20px]">
					<Text variant="copy-large" className="m-0 text-confetti-black">
						We were able to successfully close a few small practices before
						our enterprise contracts closed. However it became clear they
						could not be our target customer.
					</Text>
					<ol
						className="m-0 flex list-none flex-col gap-[8px] pl-[24px] text-confetti-black [text-wrap:pretty]"
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
					</ol>
					<Text variant="copy-large" className="m-0 text-confetti-black">
						After we closed our enterprise clients, we quickly found they were
						a better fit and I started to design our application for scale.
					</Text>
				</div>
			</div>
		</Section>
	);
}
