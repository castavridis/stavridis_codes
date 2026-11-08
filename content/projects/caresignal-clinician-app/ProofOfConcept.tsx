import Text from '../../../src/components/Text';
import Section from '../../../src/features/projects/components/Section';
import DesignPrinciple from '../../../src/features/projects/components/figures/DesignPrinciple';

import { CITATIONS } from './citations';
import { DialysisFlowChart } from './DialysisFlowChart';
import {
	BackdropWindowShot,
	Citation,
	Figure,
	IMG,
	NumBadge,
	SectionHeading,
} from './shared';

export function ProofOfConcept() {
	return (
		<Section>
			<div className="flex w-full flex-col gap-[28px]">
				<div className="flex w-full max-w-[704px] flex-col ml-auto gap-[16px]">
					<SectionHeading id="starting-point">Proof of Concept</SectionHeading>
					<h3
						className="m-0 flex items-center gap-[14px] text-confetti-black"
						style={{
							fontFamily: 'var(--font-kyoto)',
							fontWeight: 500,
							fontSize: 28,
							lineHeight: 1.2,
						}}
					>
						<NumBadge n={1} />
						Automate nurses’ routine calls
					</h3>
					<Text variant="copy-large" className="m-0 text-confetti-black">
						Observing a dialysis clinic, our Chief Medical Officer identified
						an approach to improving access to health care and achieving better
						health outcomes: automate routine outreach and trigger an alert if
						a patient reports an urgent or emergent need.
						<Citation {...CITATIONS.dialysisProgram} />
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
						The prototype worked! In a randomized pilot, patients using it missed far fewer dialysis sessions, spent fewer days in the hospital, and recovered $36 in treatment revenue for every $1 the system cost.
						<Citation {...CITATIONS.prototypeRoi} /> The success prompted
						our CMO to create programs for a broad range of conditions and
						establish a research center to study them.
					</Text>
					<Text variant="copy-large" className="m-0 text-confetti-black">
						When I joined the founding team to lead product design and brand,
						my first goal was to design the web application for our
						researchers.
					</Text>
				</div>

				<div className="flex w-full max-w-[704px] flex-col ml-auto gap-[16px]">
					{/* Rule sits inside the reading column (design: 28px above,
					    36px below, 12% ink). */}
					<hr className="m-0 w-full border-0 border-t border-confetti-black/12 mt-[20px] mb-[16px]" />
					<h3
						className="m-0 flex items-center gap-[14px] text-confetti-black"
						style={{
							fontFamily: 'var(--font-kyoto)',
							fontWeight: 500,
							fontSize: 28,
							lineHeight: 1.2,
						}}
					>
						<NumBadge n={2} />
						Surface urgent and emergent needs
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
						I designed the web application that allowed researchers to
						complete alert-based workflows.
					</p>
					<Text variant="copy-large" className="m-0 text-confetti-black">
						Alerts were the most important signal for clinicians participating
						in our studies. They indicated if a patient reported that they had
						an urgent or emergent need. Clinicians would respond to the alert
						by contacting the patient and intervening if necessary.
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
						I designed an alert-based dashboard with the researchers studying
						different programs. After alerts, they were concerned about how
						many participants were enrolled in the program and of those
						enrolled, how many were responding.
					</Text>
				</div>

				<div className="flex w-full max-w-[704px] flex-col ml-auto gap-[16px]">
					<Text variant="copy-large" className="m-0 text-confetti-black">
						I owned it from concept to production and I was proud of the
						dashboard. It featured crisp typography, a mobile-first design,
						and responsive layout. But the process showed me that I held
						assumptions that needed to be corrected and led me to define
						design principles that I would carry through my time at
						CareSignal:
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
						The alert-based dashboard supported several trials, including one
						for the Dialysis program in a randomized controlled trial.
						<Citation {...CITATIONS.dialysisRct} /> The trial showed
						positive results
						<Citation {...CITATIONS.dialysisResults} /> and the automated
						workflow tested became the template for our other programs.
					</Text>
					<Text variant="copy-large" className="m-0 text-confetti-black">
						The research center would continue to generate compelling evidence
						about the efficacy of our programs designed for different quality
						measures. Ultimately, they’d publish 13 papers in peer-reviewed
						publications.
						<Citation {...CITATIONS.publications} /> This allowed
						CareSignal to be in a great position to sell a product clinicians
						would want to buy and adopt.
					</Text>
				</div>
			</div>
		</Section>
	);
}
