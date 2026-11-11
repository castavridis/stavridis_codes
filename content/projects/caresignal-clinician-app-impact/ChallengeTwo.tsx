import Text from '../../../src/components/Text';
import Section from '../../../src/features/projects/components/Section';

import { BackdropWindowShot, ChallengeHeading, IMG, KeyDecision } from './shared';

export function ChallengeTwo() {
	return (
		<Section>
			<div className="flex w-full flex-col gap-[28px]">
				<div className="flex w-full max-w-[704px] flex-col ml-auto gap-[16px]">
					<ChallengeHeading n={2}>Helping nurses prioritize care</ChallengeHeading>
					<KeyDecision>
						Stratify every patient by risk, and make “doing fine” as visible as
						“needs care.”
					</KeyDecision>
					<Text variant="copy-large" className="m-0 text-confetti-black">
						Alerts only react. To catch patients before they had urgent needs,
						our research center built programs for conditions such as COPD and
						CHF that assess risk as well as raise alerts. I worked with our
						researchers on how clinicians already talk about risk: red, yellow
						and green for high, medium and low risk needed no training.
					</Text>
				</div>

				<BackdropWindowShot
					src={`${IMG}/fig-risk-dashboard.png`}
					width={3404}
					height={2188}
					alt="The redesigned dashboard: an overview row of totals — 1500 patients, 9 active alerts, 226 less-engaged, 1262 engaged, 11 paused, 21 snoozed — above a Patients list with high, medium and low risk badges and Snooze and Resolve actions, and an Alerts list sorted newest first."
				>
					A dashboard with patients stratified by risk and alerts sorted by
					recency.
				</BackdropWindowShot>

				<div className="flex w-full max-w-[704px] flex-col ml-auto gap-[16px]">
					<Text variant="copy-large" className="m-0 text-confetti-black">
						Our clinical users already juggled complex software, so CareSignal
						had to be quick to get in and out of. Research with nurses, and
						reports from our Account Success team, showed that knowing who was
						low-risk mattered as much as knowing who was high-risk. Nurses
						struggled to leave the app while any patient looked unaddressed:
						the Zeigarnik effect.
					</Text>
					<Text variant="copy-large" className="m-0 text-confetti-black">
						So I designed ways to close the loop. Tags and patient groups
						organize the work, snooze defers a patient, and resolve marks an
						alert as handled. Every action is written to the patient’s
						history, so nurses can use their front-line judgement and doctors
						can see it.
					</Text>
				</div>
			</div>
		</Section>
	);
}
