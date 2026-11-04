import Section from '../../../src/features/projects/components/Section';
import AnatomyOfATextMessage from '../../../src/features/projects/components/figures/AnatomyOfATextMessage';

import {
	FigCaption,
	FigPlaceholder,
	IMG,
	NumBadge,
	SectionHeading,
} from './shared';

export function ScalingCareTeams() {
	return (
		<Section>
			<div className="flex w-full flex-col gap-[28px]">
				<hr className="w-full border-confetti-black/15" />

				<div className="flex w-full max-w-[705px] flex-col gap-[16px]">
					<SectionHeading id="scaling-care-teams">
						Scaling Care Teams
					</SectionHeading>
					<h3 className="type-callout-title m-0 text-confetti-black">
						<NumBadge n={3} />
						Visualize up-to-date risk stratification
					</h3>
					<p className="type-headline-small m-0 text-confetti-black">
						I updated our dashboard to adapt to workflows that could be
						defined at the organization, clinician, and patient level.
					</p>
					<p className="type-copy m-0 text-confetti-black/80">
						Focusing on urgent needs via alerts wasn’t the only way our
						customers wanted to support patients. Risk stratification could
						help providers catch patients before they had urgent needs. Our
						research center started to develop programs for conditions such
						as COPD and CHF that assessed risk and triggered alerts.
						Visualizing risk would turn CareSignal from a reactive tool to a
						preventative tool.
					</p>
				</div>

				<figure className="m-0 flex w-full flex-col gap-[12px]">
					<img
						src={`${IMG}/fig-risk-dashboard.webp`}
						alt="The redesigned dashboard: an overview row of totals — 1500 patients, 9 active alerts, 226 less-engaged, 1262 engaged, 11 paused, 21 snoozed — above a Patients list with high, medium and low risk badges and Snooze and Resolve actions, and an Alerts list sorted newest first."
						className="block w-full rounded-[16px]"
					/>
					<FigCaption fig>
						A dashboard with patients stratified by risk and alerts sorted by
						recency.
					</FigCaption>
				</figure>

				<div className="flex w-full max-w-[705px] flex-col gap-[16px]">
					<p className="type-copy m-0 text-confetti-black/80">
						I collaborated with our research team to understand how risk was
						communicated in a clinical setting. This visualization itself was
						straightforward, most people understood red, yellow, and green to
						mean high-, medium-, and low-risk. Our clinical users worked
						within complex software environments, CareSignal needed to be
						easy to get in and out of.
					</p>
				</div>

				<figure className="m-0 flex w-full flex-col gap-[12px]">
					<img
						src={`${IMG}/fig-patient-view.webp`}
						alt="The risk dashboard with a grey placeholder panel labelled Patient View over the centre."
						className="block w-full rounded-[16px]"
					/>
					<FigCaption fig>Patient view (placeholder)</FigCaption>
				</figure>

				<div className="flex w-full max-w-[705px] flex-col gap-[16px]">
					<p className="type-copy m-0 text-confetti-black/80">
						Knowing which patients were low-risk turned out to be as
						important as understanding patients who were high-risk,
						medium-risk, or had triggered alerts. The Zeigarnik effect
						affected our clinical users pretty strongly and reports from our
						Account Success team and my own research indicated that nurses
						had trouble leaving the system if they saw patients with
						unaddressed tasks.
					</p>
				</div>

				<figure className="m-0 flex w-full flex-col gap-[12px]">
					<img
						src={`${IMG}/fig-tags-snooze.webp`}
						alt="The risk dashboard with two grey placeholder panels labelled Tags / Patient Groups and Snooze / Resolve."
						className="block w-full rounded-[16px]"
					/>
					<FigCaption fig>
						Tags, patient groups, snooze and resolve (placeholders)
					</FigCaption>
				</figure>

				<div className="flex w-full max-w-[705px] flex-col gap-[16px]">
					<p className="type-copy m-0 text-confetti-black/80">
						I designed additional ways for nurses to manage their tasks.
					</p>
					<p className="type-copy m-0 text-confetti-black/80">
						The layers that controlled task management could be customized at
						different levels, allowing for governance that could be set at
						the organization level with certain customization available down
						to the patient level. Every user action resulted in a note added
						to a patient’s history. Our clinical users were able to use their
						front-line judgement and the patient’s doctors could see their
						activity if they wanted to.
					</p>
				</div>

				<AnatomyOfATextMessage />

				<div className="flex w-full max-w-[705px] flex-col gap-[16px]">
					<p className="type-copy m-0 text-confetti-black/80">
						Our analytics showed that users usually searched for patients and
						then viewed their detailed data. Users could click in to view
						patient data, leave notes, and extract data the way they needed
						to send to doctors.
					</p>
				</div>

				<FigPlaceholder
					label="Patient view complex data (figure to come)"
					height={280}
				/>

				<div className="flex w-full max-w-[705px] flex-col gap-[16px]">
					<p className="type-copy m-0 text-confetti-black/80">
						Data was shared to downstream providers using the channels most
						convenient for them. I designed multiple ways to get patient data
						to those providers: plain text formatted for various EHRs, CSV,
						PDF that was downloadable and faxable.
					</p>
				</div>
			</div>
		</Section>
	);
}
