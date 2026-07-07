import { Clock } from 'lucide-react';

import {
	MDXWrapper,
	MDXColumn,
} from '../../src/components/mdx/Layout';
import Callout from '../../src/features/projects/components/Callout';
import OutcomeStat from '../../src/features/projects/components/OutcomeStat';
import Section from '../../src/features/projects/components/Section';
import WorkflowToggle from '../../src/features/projects/components/WorkflowToggle';
import { Illustration } from '../../src/features/projects/components/Illustration';

export function Intro () {
	return (
		<MDXWrapper>
			<MDXColumn span={12}>
				<Callout
					title="Quote from the field"
					content={
						<span style={{
							hangingPunctuation: 'first',
						}}>
							“You have to understand... Everybody is busy. All&nbsp;we’re doing is putting out fires and we just want to know if a fire is put out and move on to  the next one.”
						</span>
				}
					attribution={
						<span>
							<span className="font-bold">CareSignal User</span>, RN and Diabetes Educator
						</span>
					} />
			</MDXColumn>
		</MDXWrapper>
	)
}

// ---------------------------------------------------------------------------
// Monitors — Figma section `Frame 226` (Sample Monitors). Sits near the top,
// right after the pull-quote. Title + blurb stacked, a 944×409 monitors
// illustration below, then a centered attribution caption. The illustration
// sits on the case study's cream paper so no tinted container.
// ---------------------------------------------------------------------------
export function Monitors() {
	return (
		<Section>
			<div className="flex w-full flex-col gap-[28px]">
				<div className="flex w-full max-w-[705px] flex-col gap-[8px]">
					<h2 className="type-headline-small m-0 text-confetti-black">
						Our clinical users worked within complex software environments with heightened scrutiny.
					</h2>
					<p className="type-copy m-0 text-confetti-black/80">
						Many of our users had to toggle between several information-dense interfaces to call patients and document their work. Although CareSignal offered integration, our platform needed to be usable out of the box to onboard teams in days, not months. It also needed to be easy to use.
					</p>
				</div>

				<Illustration
					src="/images/projects/caresignal-platform/Monitors.png"
					alt="Two Dell monitors side-by-side. The left monitor shows Epic and a spreadsheet; the right shows Microsoft Outlook and Teams."
					width="100%"
					height={409}
					background="transparent"
					className="p-[16px]"
				/>

				<p className="type-callout-meta m-0 text-confetti-black/70 text-center">
					<span className="font-semibold">A Typical Workstation for Clinical Users</span><br />
					Our users (both in-office and remote) navigated at least two large monitors, and a slew of applications.
				</p>
			</div>
		</Section>
	);
}

// ---------------------------------------------------------------------------
// Design Intro — Figma `Section: Design Intro`. A 349w title block (left) +
// 560w illustration slot (right) inside the 944w content column.
// ---------------------------------------------------------------------------
export function DesignIntro() {
	return (
		<Section>
			<div className="flex w-full flex-col items-start gap-[24px] md:flex-row md:gap-[35px]">
				<div className="flex w-full flex-col gap-[24px] md:w-[349px] md:shrink-0 md:pt-[104px]">
					<h2 className="type-headline-small m-0 text-confetti-black">
						I designed low-burden ways to offer clinicians a snapshot of their patients’ statuses.
					</h2>
					<p className="type-copy m-0 text-confetti-black/80">
						Working with our clinical staff, external clinicians and buyers, I designed a system aligned with value-based care and to signal urgent and emergent needs at-a-glance.
					</p>
				</div>

				<Illustration
					src="/images/projects/caresignal-platform/Triage%20Statuses%20Illustration.png"
					alt="Three triage status pills — High-risk, Medium-risk, Low-risk — connected by alert bell badges along a vertical reference grid."
					width={560}
					height={424}
					background="#f0eeeb"
				/>
			</div>
		</Section>
	);
}

// Dark illustration panel with a side caption — the Alerts and Statuses
// "key object" features from Figma `Frame 228`. The illustration and its
// white caption share one near-black panel; `reverse` swaps their sides so
// Alerts reads illustration→caption and Statuses reads caption→illustration,
// matching the alternating Figma layout.
function DarkFeature({
	src,
	alt,
	title,
	blurb,
	resolution,
	reverse,
}: {
	src: string;
	alt: string;
	title: string;
	blurb: string;
	resolution: string;
	reverse?: boolean;
}) {
	return (
		<div className="overflow-hidden rounded-[12px] bg-[#191716] p-[24px] md:p-[56px]">
			<div
				className={`flex flex-col gap-[32px] md:items-center md:gap-[56px] ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'}`}
			>
				<img
					src={src}
					alt={alt}
					className="block w-full object-contain md:min-w-0 md:flex-1"
				/>
				<div className="flex w-full flex-col gap-[16px] text-white md:w-[303px] md:shrink-0">
					<h3 className="type-headline-small m-0">{title}</h3>
					<p className="type-copy m-0 text-white/80">{blurb}</p>
					<div className="flex items-start gap-[8px] text-white/70">
						<Clock size={16} strokeWidth={1.6} className="mt-[3px] shrink-0" aria-hidden />
						<span className="type-callout-meta">
							<span className="font-semibold">Recommended Resolution Time</span>
							<br />
							{resolution}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Key Objects — Figma `Frame 228` (Alerts → Statuses → Dashboard Overview).
// Two dark feature panels (Alerts, Statuses) each pairing artwork with a
// side caption, then a single light Dashboard Overview window with a caption
// below. (The earlier draft's 3-slide carousel is dropped — the final design
// shows one dashboard.)
// ---------------------------------------------------------------------------
export function KeyObjects() {
	return (
		<Section>
			<div className="flex w-full flex-col gap-[16px]">
				<DarkFeature
					src="/images/projects/caresignal-platform/Alert Layout.png"
					alt="A diagonal stack of patient alert flags, each showing time-since, patient name, vital sign, and resolve / snooze controls."
					title="Alerts"
					blurb="When patients trigger an alert, they’ve reported an acute need that requires attention."
					resolution="24 – 72 Hours"
				/>
				<DarkFeature
					src="/images/projects/caresignal-platform/Patient Layout.png"
					alt="A list of patient rows over a dark background — Patient Banner cards stacked with optional Program Banner sub-rows for high-priority patients."
					title="Statuses"
					blurb="In addition to Alerts, Statuses help clinical users intervene before a patient’s conditions worsen to a hospitalization or preventable ED admission."
					resolution="1 – 4+ Weeks"
					reverse
				/>

				<div className="mt-[16px] flex w-full flex-col gap-[28px]">
					<Illustration
						src="/images/projects/caresignal-platform/Dashboard Overview.png"
						alt="The dashboard overview: alerts and statuses across all patients with high-risk / medium-risk / low-risk badges and patient summary stats."
						width="100%"
						height={500}
						background="#f0eeeb"
						className="p-[16px] md:p-[24px]"
					/>
					<div className="mx-auto flex w-full max-w-[784px] flex-col gap-[8px] text-center">
						<h3 className="type-headline-small m-0 text-confetti-black">Dashboard Overview</h3>
						<p className="type-copy m-0 text-confetti-black/80">
							The overview shows Alerts and Statuses for All Patients or pre-defined groups of patients defined by each clinical user. Clinicians may group patients by condition, associated doctors, or custom tags. This view remained largely unchanged while we developed other features and led to significant outcomes.
						</p>
					</div>
				</div>
			</div>
		</Section>
	);
}

// ---------------------------------------------------------------------------
// Outcomes — Figma `Section: Outcomes`. "Select Outcomes" eyebrow + a
// 3-column row (2 OutcomeStats + a KLAS awards block), then a workflows
// block with the embedded Claude Design care-models artifact.
// ---------------------------------------------------------------------------
export function Outcomes() {
	return (
		<Section>
			<div className="flex w-full flex-col gap-[24px]">
				<p className="type-eyebrow m-0 text-confetti-black">Select Outcomes</p>

				<div className="grid w-full grid-cols-1 gap-[16px] sm:grid-cols-3">
					<OutcomeStat stat="≥ 10x" caption="Growth in patients per clinical user" />
					<OutcomeStat stat="144%" caption="Net recurring revenue year over year" />
					<Illustration
						src="/images/projects/caresignal-platform/KLAS.png"
						alt="Best in KLAS 2024 and Best in KLAS 2025"
						width="100%"
						height={176}
						background="#f0eeeb"
						className="text-left md:text-center"
					/>
				</div>
			</div>

			<div className="mt-[40px] flex w-full flex-col gap-[16px] p-[16px] bg-[#f0eeeb] rounded-lg">
				<p className="type-headline-small-italic my-[12px] text-confetti-black">
					CareSignal’s platform supports many workflows
				</p>

				<WorkflowToggle
					src="/case-studies/caresignal/workflow/index.html"
					title="CareSignal care-models visualization"
				/>

			</div>
		</Section>
	);
}

// Single phase column inside the "General Design Phases" card.
function PhaseColumn({ title, items }: { title: string; items: string[] }) {
	return (
		<div className="flex flex-col gap-[8px]">
			<p className="type-copy m-0 font-bold text-confetti-black">{title}</p>
			<ul className="m-0 flex list-none flex-col gap-[4px] p-0">
				{items.map((item) => (
					<li key={item} className="type-copy text-confetti-black/80">
						{item}
					</li>
				))}
			</ul>
		</div>
	);
}

// ---------------------------------------------------------------------------
// High-Level Process — Figma frame `Section: Monitors` (mislabeled; its
// content is the design-process narrative). Intro + a "General Design Phases"
// card (Research / Prototype / Launch / Iteration) + closing paragraphs.
// ---------------------------------------------------------------------------
export function Process() {
	return (
		<Section>
			<div className="flex w-full flex-col gap-[28px]">
				<div className="flex w-full max-w-[704px] flex-col gap-[16px]">
					<h2 className="type-headline-small m-0 text-confetti-black">High-Level Process</h2>
					<p className="type-copy m-0 text-confetti-black/80">
						The CareSignal platform was iterated on for a number of years but the core process remains the same. I use my intuition to guide the beginning of projects to connect the needs of users to those of the business. My core philosophy is that if the needs of a product’s core users are met, we can increase adoption. I also believe a strong brand can support product touch points.
					</p>
				</div>

				<div className="rounded-[12px] bg-[#f0eeeb] p-[24px] md:p-[48px]">
					<p className="type-headline-small-italic m-0 mb-[24px] text-confetti-black">
						General Design Phases
					</p>
					<div className="grid grid-cols-1 gap-[24px] sm:grid-cols-2 md:grid-cols-4">
						<PhaseColumn
							title="Research"
							items={['Shadowing', 'User interviews', 'Persona development', 'Business opportunity', 'Roadmapping']}
						/>
						<PhaseColumn
							title="Prototype"
							items={['Paper prototypes', 'Functional prototypes', 'Feasibility prototypes', 'Live-data prototypes']}
						/>
						<PhaseColumn
							title="Launch"
							items={['Product marketing', 'Internal education', 'External education', 'Support articles']}
						/>
						<PhaseColumn
							title="Iteration"
							items={['Bug fixes', 'Note areas for improvement']}
						/>
					</div>
				</div>

				<div className="flex w-full max-w-[704px] flex-col gap-[16px]">
					<p className="type-copy m-0 text-confetti-black/80">
						Although I use my intuition to guide the beginning of a project, there are certain questions that must be answered by users. I try to conduct research with as little bias as possible to surface what our users actually need and to question the foundation of a product hypothesis or proposal.
					</p>
					<p className="type-copy m-0 text-confetti-black/80">
						After conducting initial research I will synthesize my findings and create prototypes against which I’ll generally try to test with a new group of users. After that user testing is done I usually feel confident enough to move forward with the feature to completion. I’ll have different people within the organization or my company, as well as friends and family or users with time to test the flows. After the flows are in production I pay close attention to support tickets to understand how we might iterate on the feature and if that iteration is necessary.
					</p>
					<p className="type-copy m-0 text-confetti-black/80">
						This approach has helped me develop a strong intuition about the needs of clinical users while building rapport with our buyers and daily users.
					</p>
				</div>
			</div>
		</Section>
	);
}
