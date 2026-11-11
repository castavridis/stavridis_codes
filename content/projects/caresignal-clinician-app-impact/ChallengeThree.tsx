import Text from '../../../src/components/Text';
import Section from '../../../src/features/projects/components/Section';
import AnatomyOfATextMessage from '../../../src/features/projects/components/figures/AnatomyOfATextMessage';
import ProgramGovernance from '../../../src/features/projects/components/figures/ProgramGovernance';

import { CITATIONS } from './citations';
import {
	BackdropWindowShot,
	ChallengeHeading,
	Citation,
	IMG,
	KeyDecision,
} from './shared';

export function ChallengeThree() {
	return (
		<Section>
			<div className="flex w-full flex-col gap-[28px]">
				<div className="flex w-full max-w-[704px] flex-col ml-auto gap-[16px]">
					<ChallengeHeading n={3}>Supporting different clinical workflows</ChallengeHeading>
					<KeyDecision>
						Build governance into the product: thresholds start from
						signed-off evidence, each change is scoped to fewer patients, and
						every change is documented.
					</KeyDecision>
					<Text variant="copy-large" className="m-0 text-confetti-black">
						Commercializing meant serving very different customers. Enterprise
						contracts took 18 months to close
						<Citation {...CITATIONS.salesCycle} />, so we first bet on small
						practices motivated by MACRA, MIPS and CCM. I designed what those
						early adopters asked for: Chronic Care Management reporting with a
						built-in timer, and ways to enroll patients without logging in.
					</Text>
				</div>

				<BackdropWindowShot
					src={`${IMG}/fig-enrollment-options.png`}
					width={2518}
					height={2286}
					insetX="17%"
					alt="Two paper enrollment forms overlapping. In front, an EpxDiabetes prescription pad: an internal-use half with message type, start date and frequency checkboxes, a verbal-consent box and the physician's signature, beside step-by-step admin instructions for enrolling the patient online; and a tear-off patient half explaining the text and phone service and how to opt out. Behind it, an Epharmix batch enrollment sheet with repeating rows for a patient's name, phone, MRN, delivery method, language, dialysis-day messaging schedule and start and end dates."
				>
					Ways to enroll patients without a screen. (before we re-branded as
					CareSignal).
				</BackdropWindowShot>

				<div className="flex w-full max-w-[704px] flex-col ml-auto gap-[16px]">
					<Text variant="copy-large" className="m-0 text-confetti-black">
						Small practices signed, but they needed as much training and
						support as enterprise customers, and the operational change cooled
						prospects. When our enterprise contracts closed, they proved the
						better fit, and I redesigned the product for scale.
					</Text>
					<Text variant="copy-large" className="m-0 text-confetti-black">
						At scale, one setting could reach thousands of patients, so I
						designed a settings cascade with a clear owner at each level. Our
						research center designs a program and its alert thresholds, and the
						Chief Medical Officer and Legal sign them off before they can go
						live. A manager then sets their team’s defaults, including
						thresholds, based on that sign-off. A nurse care manager can adjust
						one patient’s settings, such as their baseline weight or alert
						threshold, using clinical judgement of that patient. Every change is
						documented in the patient’s history and the audit log. Patients sit
						outside the cascade: STOP always wins.
					</Text>
				</div>

				<ProgramGovernance />

				<AnatomyOfATextMessage />

				<div className="flex w-full max-w-[704px] flex-col ml-auto gap-[16px]">
					<Text variant="copy-large" className="m-0 text-confetti-black">
						The same model shaped the rest of the workflow. Analytics showed
						nurses usually searched for a patient and then opened their
						details, so the patient view supports notes and exports.
						Downstream providers get data the way they can use it: plain text
						formatted for their EHR, CSV, or a PDF to download or fax.
					</Text>
				</div>

				<BackdropWindowShot
					src={`${IMG}/fig-patient-data-formats.png`}
					width={3562}
					height={2244}
					insetX="3.35%"
					alt="Two patient-data exports overlapping. In front, a CareSignal PDF for one patient: a two-week summary table of pre- and post-prandial readings, an EpxDiabetes response graph of blood sugar with out-of-range readings highlighted in orange, and a table of raw text-message responses. Behind it, a black-and-white faxed EpxDiabetes report for a physician listing patients' average fasting blood glucose as bar gauges against high- and rising-risk thresholds."
				>
					Sample PDF and fax representations of CareSignal data.
				</BackdropWindowShot>
			</div>
		</Section>
	);
}
