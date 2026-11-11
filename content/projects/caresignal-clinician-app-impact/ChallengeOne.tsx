import Text from '../../../src/components/Text';
import Section from '../../../src/features/projects/components/Section';
import DesignPrinciple from '../../../src/features/projects/components/figures/DesignPrinciple';

import { CITATIONS } from './citations';
import { DialysisFlowChart } from './DialysisFlowChart';
import {
	BackdropWindowShot,
	ChallengeHeading,
	Citation,
	Figure,
	IMG,
	isPlaceholderCitation,
	KeyDecision,
} from './shared';

export function ChallengeOne() {
	return (
		<Section>
			<div className="flex w-full flex-col gap-[28px]">
				<div className="flex w-full max-w-[704px] flex-col ml-auto gap-[16px]">
					<ChallengeHeading n={1}>Identifying which patients need attention</ChallengeHeading>
					<KeyDecision>
						Let patients’ own replies decide who needs a nurse, and turn an
						urgent reply into an alert.
					</KeyDecision>
					<Text variant="copy-large" className="m-0 text-confetti-black">
						Our Chief Medical Officer found the approach at a dialysis clinic:
						automate routine outreach, and alert the care team when a patient
						reports an urgent or emergent need.
						<Citation {...CITATIONS.dialysisProgram} /> We designed the program
						with patients and providers, and it became the template for every
						CareSignal program.
					</Text>
				</div>

				<figure className="m-0 flex w-full flex-col items-center gap-[32px] rounded-[16px] bg-washes-paper px-[20px] py-[32px] min-[600px]:p-[24px] md:p-[40px]">
					<div className="flex flex-col items-center gap-[8px] text-center">
						<Figure />
						<Text
							variant="headline-small"
							as="h3"
							className="m-0 max-w-[760px] text-confetti-black [text-wrap:balance]"
						>
							The dialysis program’s alert-based workflow: the template for
							CareSignal’s patient-facing programs
						</Text>
					</div>
					<DialysisFlowChart />
					<figcaption className="w-full max-w-[1070px] text-left text-[17px] leading-[1.45] text-confetti-black [text-wrap:pretty]">
						Our programs were created using human-centered design to build
						this prototype with patients and providers. It sent automated
						phone calls and text messages to collect data from patients. It
						sent alerts to the dialysis team when necessary.
					</figcaption>
				</figure>

				<div className="flex w-full max-w-[704px] flex-col ml-auto gap-[16px]">
					<Text variant="copy-large" className="m-0 text-confetti-black">
						The prototype worked! In a randomized pilot, patients using it
						missed far fewer dialysis sessions, spent fewer days in the
						hospital, and recovered $36 in treatment revenue for every $1 the
						system cost.
						<Citation {...CITATIONS.prototypeRoi} /> A randomized controlled
						trial of the Dialysis program confirmed it.
						<Citation {...CITATIONS.dialysisRct} />
						{/* The comma only separates two shown citations. */}
						{!isPlaceholderCitation(CITATIONS.dialysisRct.source) &&
						!isPlaceholderCitation(CITATIONS.dialysisResults.source) ? (
							<sup className="type-callout-meta text-confetti-black">,</sup>
						) : null}
						<Citation {...CITATIONS.dialysisResults} />
					</Text>
					<Text variant="copy-large" className="m-0 text-confetti-black">
						My first job on the founding team was the web application our
						researchers used to run these trials. I built an alert-first
						dashboard: alerts at the top, then how many patients were enrolled
						and how many were responding.
					</Text>
				</div>

				<BackdropWindowShot
					src={`${IMG}/fig-alert-dashboard.png`}
					width={3404}
					height={2188}
					alt="The Epharmix dashboard before the CareSignal rebrand: a blue header with enrolled and prescribed patient counts and Enroll Patient and Prescribe Patient buttons, above a Notification Center whose Unaddressed Alerts tab lists patients with their alert (blood pressure readings over threshold, or Unresponsive), the intervention, and a Mark as Addressed checkbox; Patient-Initiated Calls and Unresponsive Patients tabs sit beside it."
				>
					Alert-based dashboard designed for our researchers before I re-branded
					us to CareSignal.
				</BackdropWindowShot>

				<div className="flex w-full max-w-[704px] flex-col ml-auto gap-[16px]">
					<Text variant="copy-large" className="m-0 text-confetti-black">
						Watching researchers use it corrected my assumptions. They were
						rarely at a computer, worked in clinics and were constantly
						interrupted. That led to three principles I applied to every later
						decision:
					</Text>
				</div>

				{/* Design principles: full width, three across from 1024px
				    (stacked below: at tablet widths a third of the column is too
				    narrow for the 28px text); the cards share a row height. */}
				<div className="grid w-full grid-cols-1 gap-[16px] lg:grid-cols-3">
					<DesignPrinciple
						number={1}
						pigment="rose"
						text="Prioritize loginless experiences."
						startY={0.62}
						endY={0.43}
						arc={0.12}
					/>
					<DesignPrinciple
						number={2}
						pigment="hansa"
						text="Build for our users’ environments, not our own."
						startY={0.42}
						endY={0.57}
						arc={0.08}
					/>
					<DesignPrinciple
						number={3}
						pigment="cerulean"
						text="Assume users are busy, not wrong."
						startY={0.55}
						endY={0.44}
						arc={0.1}
					/>
				</div>

				<div className="flex w-full max-w-[704px] flex-col ml-auto gap-[16px]">
					<Text variant="copy-large" className="m-0 text-confetti-black">
						The research center went on to publish 13 peer-reviewed papers
						<Citation {...CITATIONS.publications} />, giving CareSignal
						evidence that clinicians wanted to buy.
					</Text>
				</div>
			</div>
		</Section>
	);
}
