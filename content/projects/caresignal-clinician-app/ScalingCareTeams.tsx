import Text from '../../../src/components/Text';
import Section from '../../../src/features/projects/components/Section';
import AnatomyOfATextMessage from '../../../src/features/projects/components/figures/AnatomyOfATextMessage';

import {
	BackdropShot,
	FigCaption,
	IMG,
	NumBadge,
	SectionHeading,
} from './shared';

export function ScalingCareTeams() {
	return (
		<Section>
			<div className="flex w-full flex-col gap-[28px]">
				<div className="flex w-full max-w-[705px] flex-col ml-auto gap-[20px]">
					{/* Rule sits inside the reading column (design: 24px above,
					    36px below, 12% ink). */}
					<hr className="m-0 w-full border-0 border-t border-confetti-black/12 mt-[24px] mb-[16px]" />
					<SectionHeading id="scaling-care-teams">
						Scaling Care Teams
					</SectionHeading>
					<h3
						className="m-0 flex items-center gap-[14px] text-confetti-black"
						style={{
							fontFamily: 'var(--font-kyoto)',
							fontWeight: 500,
							fontSize: 28,
							lineHeight: 1.2,
						}}
					>
						<NumBadge n={3} />
						Visualize up-to-date risk stratification
					</h3>
					<p
						className="m-0 text-confetti-black [text-wrap:balance]"
						style={{
							fontFamily: 'var(--font-kyoto)',
							fontWeight: 500,
							fontSize: 'clamp(28px,3vw,36px)',
							lineHeight: 1.22,
						}}
					>
						I updated our dashboard to adapt to workflows that could be
						defined at the organization, clinician, and patient level.
					</p>
					<Text variant="copy-large" className="m-0 text-confetti-black">
						Focusing on urgent needs via alerts wasn’t the only way our
						customers wanted to support patients. Risk stratification could
						help providers catch patients before they had urgent needs. Our
						research center started to develop programs for conditions such
						as COPD and CHF that assessed risk and triggered alerts.
						Visualizing risk would turn CareSignal from a reactive tool to a
						preventative tool.
					</Text>
				</div>

				<figure className="m-0 flex w-full flex-col items-center gap-[16px]">
					<BackdropShot
						src={`${IMG}/fig-risk-dashboard.webp`}
						width={1506}
						height={947}
						alt="The redesigned dashboard: an overview row of totals — 1500 patients, 9 active alerts, 226 less-engaged, 1262 engaged, 11 paused, 21 snoozed — above a Patients list with high, medium and low risk badges and Snooze and Resolve actions, and an Alerts list sorted newest first."
					/>
					<FigCaption fig>
						A dashboard with patients stratified by risk and alerts sorted by
						recency.
					</FigCaption>
				</figure>

				<div className="flex w-full max-w-[705px] flex-col ml-auto gap-[20px]">
					<Text variant="copy-large" className="m-0 text-confetti-black">
						I collaborated with our research team to understand how risk was
						communicated in a clinical setting. This visualization itself was
						straightforward, most people understood red, yellow, and green to
						mean high-, medium-, and low-risk. Our clinical users worked
						within complex software environments, CareSignal needed to be
						easy to get in and out of.
					</Text>
				</div>

				<figure className="m-0 flex w-full flex-col items-center gap-[16px]">
					<BackdropShot
						src={`${IMG}/fig-patient-view.webp`}
						width={1492}
						height={940}
						alt="The risk dashboard with a grey placeholder panel labelled Patient View over the centre."
					/>
					<FigCaption fig>Patient view (placeholder)</FigCaption>
				</figure>

				<div className="flex w-full max-w-[705px] flex-col ml-auto gap-[20px]">
					<Text variant="copy-large" className="m-0 text-confetti-black">
						Knowing which patients were low-risk turned out to be as
						important as understanding patients who were high-risk,
						medium-risk, or had triggered alerts. The Zeigarnik effect
						affected our clinical users pretty strongly and reports from our
						Account Success team and my own research indicated that nurses
						had trouble leaving the system if they saw patients with
						unaddressed tasks.
					</Text>
				</div>

				<figure className="m-0 flex w-full flex-col items-center gap-[16px]">
					<BackdropShot
						src={`${IMG}/fig-tags-snooze.webp`}
						width={1492}
						height={941}
						alt="The risk dashboard with two grey placeholder panels labelled Tags / Patient Groups and Snooze / Resolve."
					/>
					<FigCaption fig>
						Tags, patient groups, snooze and resolve (placeholders)
					</FigCaption>
				</figure>

				<div className="flex w-full max-w-[705px] flex-col ml-auto gap-[20px]">
					<Text variant="copy-large" className="m-0 text-confetti-black">
						I designed additional ways for nurses to manage their tasks.
					</Text>
					<Text variant="copy-large" className="m-0 text-confetti-black">
						The layers that controlled task management could be customized at
						different levels, allowing for governance that could be set at
						the organization level with certain customization available down
						to the patient level. Every user action resulted in a note added
						to a patient’s history. Our clinical users were able to use their
						front-line judgement and the patient’s doctors could see their
						activity if they wanted to.
					</Text>
				</div>

				<AnatomyOfATextMessage />

				<div className="flex w-full max-w-[705px] flex-col ml-auto gap-[20px]">
					<Text variant="copy-large" className="m-0 text-confetti-black">
						Our analytics showed that users usually searched for patients and
						then viewed their detailed data. Users could click in to view
						patient data, leave notes, and extract data the way they needed
						to send to doctors.
					</Text>
				</div>

				<div
					className="flex w-full flex-col gap-[16px] rounded-[16px] bg-[#f7f6f5]"
					style={{ padding: 'clamp(28px,4vw,48px) clamp(20px,5vw,72px)' }}
				>
					<p
						className="m-0 text-confetti-black"
						style={{ fontFamily: 'var(--font-body)', fontSize: 20, lineHeight: 1.5 }}
					>
						Patient view complex data
					</p>
					<span
						className="tracking-[0.04em] text-confetti-black/55"
						style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
					>
						Placeholder — figure to come
					</span>
				</div>

				<div className="flex w-full max-w-[705px] flex-col ml-auto gap-[20px]">
					<Text variant="copy-large" className="m-0 text-confetti-black">
						Data was shared to downstream providers using the channels most
						convenient for them. I designed multiple ways to get patient data
						to those providers: plain text formatted for various EHRs, CSV,
						PDF that was downloadable and faxable.
					</Text>
				</div>
			</div>
		</Section>
	);
}
