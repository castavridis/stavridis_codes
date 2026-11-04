import Section from '../../../src/features/projects/components/Section';
import DesignPrinciple from '../../../src/features/projects/components/figures/DesignPrinciple';

import { CITATIONS } from './citations';
import { DialysisFlowChart } from './DialysisFlowChart';
import {
	BackdropShot,
	Citation,
	FigCaption,
	FigPlaceholder,
	Figure,
	IMG,
	NumBadge,
	SectionHeading,
} from './shared';

export function ProofOfConcept() {
	return (
		<Section>
			<div className="flex w-full flex-col gap-[28px]">
				<div className="flex w-full max-w-[705px] flex-col gap-[16px]">
					<SectionHeading id="starting-point">Proof of Concept</SectionHeading>
					<h3 className="type-callout-title m-0 text-confetti-black">
						<NumBadge n={1} />
						Automate nurses’ routine calls
					</h3>
					<p className="type-copy m-0 text-confetti-black/80">
						Observing a dialysis clinic, our Chief Medical Officer identified
						an approach to improving access to health care and achieving better
						health outcomes: automate routine outreach and trigger an alert if
						a patient reports an urgent or emergent need.
						<Citation {...CITATIONS.dialysisProgram} />
					</p>
				</div>

				<figure className="m-0 flex w-full flex-col items-start gap-[16px] rounded-[16px] bg-[#f7f6f5] p-[24px] md:p-[40px]">
					<Figure />
					<h3 className="type-callout-title m-0 text-confetti-black">
						The dialysis program’s alert-based workflow: the template for
						CareSignal’s patient-facing programs
					</h3>
					<DialysisFlowChart />
					<figcaption className="w-full max-w-[1070px] text-left text-[17px] leading-[1.45] text-confetti-black [text-wrap:pretty]">
						Our programs were created using human-centered design to build
						this prototype with patients and providers. It sent automated
						phone calls and text messages to collect data from patients. It
						sent alerts to the dialysis team when necessary.
					</figcaption>
				</figure>

				<div className="flex w-full max-w-[705px] flex-col gap-[16px]">
					<p className="type-copy m-0 text-confetti-black/80">
						The prototype worked! It reduced hospitalizations, connected
						patients to needed resources, and had an ROI of ____.
						<Citation {...CITATIONS.prototypeRoi} /> The success prompted
						our CMO to create programs for a broad range of conditions and
						establish a research center to study them.
					</p>
					<p className="type-copy m-0 text-confetti-black/80">
						When I joined the founding team to lead product design and brand,
						my first goal was to design the web application for our
						researchers.
					</p>
				</div>

				<hr className="w-full border-confetti-black/15" />

				<div className="flex w-full max-w-[705px] flex-col gap-[16px]">
					<h3 className="type-callout-title m-0 text-confetti-black">
						<NumBadge n={2} />
						Surface urgent and emergent needs
					</h3>
					<p className="type-headline-small m-0 text-confetti-black">
						I designed the web application that allowed researchers to
						complete alert-based workflows.
					</p>
					<p className="type-copy m-0 text-confetti-black/80">
						Alerts were the most important signal for clinicians participating
						in our studies. They indicated if a patient reported that they had
						an urgent or emergent need. Clinicians would respond to the alert
						by contacting the patient and intervening if necessary.
					</p>
					<p className="type-copy m-0 text-confetti-black/80">
						I designed an alert-based dashboard with the researchers studying
						different programs. After alerts, they were concerned about how
						many participants were enrolled in the program and of those
						enrolled, how many were responding.
					</p>
				</div>

				<figure className="m-0 flex w-full flex-col gap-[12px]">
					<BackdropShot
						src={`${IMG}/fig3-alert-dashboard.webp`}
						alt="The alert-based dashboard in a browser window: a blue navigation bar with Dashboard, Patients, Programs and Alerts; tiles for Enrolled Patients (525) and Prescribed Patients (9); Hide PHI, Enroll Patient and Prescribe Patient actions; and a list of rows below, shown on a blurred sky-and-field backdrop."
					/>
					<FigCaption fig>An alert-based dashboard</FigCaption>
				</figure>

				<div className="flex w-full max-w-[705px] flex-col gap-[16px]">
					<p className="type-copy m-0 text-confetti-black/80">
						I owned it from concept to production and I was proud of the
						dashboard. It featured crisp typography, a mobile-first design,
						and responsive layout. But the process showed me that I held
						assumptions that needed to be corrected and led me to define
						design principles that I would carry through my time at
						CareSignal:
					</p>
				</div>

				<div className="flex w-full flex-col gap-[16px]">
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

				<div className="flex w-full max-w-[705px] flex-col gap-[16px]">
					<p className="type-copy m-0 text-confetti-black/80">
						The alert-based dashboard supported several trials, including one
						for the Dialysis program in a randomized controlled trial.
						<Citation {...CITATIONS.dialysisRct} /> The trial showed
						positive results
						<Citation {...CITATIONS.dialysisResults} /> and the automated
						workflow tested became the template for our other programs.
					</p>
					<p className="type-copy m-0 text-confetti-black/80">
						The research center would continue to generate compelling evidence
						about the efficacy of our programs designed for different quality
						measures. Ultimately, they’d publish 13 papers in peer-reviewed
						publications.
						<Citation {...CITATIONS.publications} /> This allowed
						CareSignal to be in a great position to sell a product clinicians
						would want to buy and adopt.
					</p>
				</div>
			</div>
		</Section>
	);
}
