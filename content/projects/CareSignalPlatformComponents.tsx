import {
	MDXWrapper,
	MDXColumn,
} from '../../src/components/mdx/Layout';
import Callout from '../../src/features/projects/components/Callout';
import OutcomeStat from '../../src/features/projects/components/OutcomeStat';
import Section from '../../src/features/projects/components/Section';
import WorkflowToggle from '../../src/features/projects/components/WorkflowToggle';

export function Intro () {
	return (
		<MDXWrapper>
			<MDXColumn span={12}>
				<Callout
					title="Guiding Principle"
					content={
						<span style={{
							hangingPunctuation: 'first',
						}}>
							“You have to understand... Everybody is busy. All&nbsp;we’re doing is putting out fires and we just want to know if a fire is put out and move on to  the next one.”
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
// Design Intro — Figma section `Section: Design Intro` (node 2232:32309).
// Layout: 349w title block (left) + 560w illustration slot (right) inside
// the 944w content column. The illustration itself ships as an exported
// Figma asset; this renders a placeholder at the right size with the
// section's tinted paper background until the asset lands.
// ---------------------------------------------------------------------------
export function DesignIntro() {
	return (
		<Section>
			<div className="flex w-full items-start gap-[35px]">
				<div className="flex w-[349px] shrink-0 flex-col gap-[24px] pt-[104px]">
					<h2 className="type-headline-small m-0 text-confetti-black">
						We designed a low-burden way to offer clinicians a snapshot of their patient panel
					</h2>
					<p className="type-copy m-0 text-confetti-black/80">
						Working with clinicians and buyers we designed a system aligned with value-based care and to signal urgent and emergent needs at-a-glance.
					</p>
				</div>

				<IllustrationPlaceholder
					name="Triage Statuses Illustration"
					width={560}
					height={424}
					background="#f0eeeb"
				/>
			</div>
		</Section>
	);
}

function IllustrationPlaceholder({
	name,
	width,
	height,
	background,
	dark,
	className,
}: {
	name: string;
	width: number | string;
	height: number;
	background: string;
	dark?: boolean;
	className?: string;
}) {
	return (
		<div
			className={`flex shrink-0 items-center justify-center overflow-hidden rounded-[12px] border border-dashed ${dark ? 'border-white/20' : 'border-confetti-black/25'} ${className ?? ''}`}
			style={{ width, height, background }}
		>
			<span
				className={`type-tag uppercase tracking-[0.08em] ${dark ? 'text-white/60' : 'text-confetti-black/60'}`}
			>
				Illustration · {name}
			</span>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Monitors — Figma section `Section: Monitors` (node 2232:32291).
// Layout: title + blurb stacked at top, 944×409 monitors illustration slot
// below, attribution caption at the bottom. The illustration sits on the
// case study's cream paper so no tinted container — placeholder uses the
// same paper tone with the dashed border.
// ---------------------------------------------------------------------------
export function Monitors() {
	return (
		<Section>
			<div className="flex w-full flex-col gap-[28px]">
				<div className="flex w-[705px] flex-col gap-[8px]">
					<h2 className="type-headline-small m-0 text-confetti-black">
						Clinical users work within complex software environments with heightened scrutiny.
					</h2>
					<p className="type-copy m-0 text-confetti-black/80">
						Many of our users had to toggle between several information-dense interfaces in order to outreach patients and document their work. Although CareSignal offered integration, our platform needed to be usable out of the box to onboard teams in days, not months.
					</p>
				</div>

				<IllustrationPlaceholder
					name="Sample Monitors"
					width="100%"
					height={409}
					background="#fbf6ea"
				/>

				<p className="type-callout-meta m-0 text-confetti-black/70">
					<span className="font-semibold">A typical workstation for clinical users.</span>{' '}
					Our users (both in-office and remote) navigated two or more large monitors, and a slew of applications.
				</p>
			</div>
		</Section>
	);
}

// ---------------------------------------------------------------------------
// Key Objects — Figma section `Section: Key Objects` (node 2232:32342).
// No section-level title/blurb; two stacked illustration slots (Alerts and
// Patients) on near-black backgrounds. The dark bg is part of each
// illustration container, not the section itself.
// ---------------------------------------------------------------------------
export function KeyObjects() {
	return (
		<Section>
			<div className="flex w-full flex-col gap-[16px]">
				<IllustrationPlaceholder
					name="Alerts Illustration"
					width="100%"
					height={504}
					background="#191716"
					dark
				/>
				<IllustrationPlaceholder
					name="Patients Illustration"
					width="100%"
					height={484}
					background="#191716"
					dark
				/>
			</div>
		</Section>
	);
}

// ---------------------------------------------------------------------------
// Outcomes — Figma section `Section: Outcomes` (node 2232:32449).
// Two stacked sub-blocks:
//   1. "Select Outcomes" eyebrow + a 3-column row (2 OutcomeStats + a KLAS
//      awards block). Each card is 303w x 176h.
//   2. "One platform, many workflows" intro + WorkflowToggle (the embedded
//      Claude Design care-models artifact) + caption describing the toggle
//      states inside the iframe.
// ---------------------------------------------------------------------------
export function Outcomes() {
	return (
		<Section>
			<div className="flex w-full flex-col gap-[24px]">
				<p className="type-eyebrow m-0 text-confetti-black">Select Outcomes</p>

				<div className="grid w-full grid-cols-3 gap-[16px]">
					<OutcomeStat stat="≥ 10x" caption="Growth in patients per clinical user" />
					<OutcomeStat stat="144%" caption="Net recurring revenue year over year" />
					<IllustrationPlaceholder
						name="Best in KLAS 2024 + 2025"
						width="100%"
						height={176}
						background="#f0eeeb"
					/>
				</div>
			</div>

			<div className="mt-[40px] flex w-full flex-col gap-[24px]">
				<p className="type-headline-small-italic m-0 text-confetti-black">
					One platform, many workflows
				</p>

				<WorkflowToggle
					src="/case-studies/caresignal/workflow/index.html"
					title="CareSignal care-models visualization"
				/>

				<p className="type-callout-meta m-0 text-confetti-black/70">
					Without CareSignal &middot; With CareSignal &middot; Standard Model &middot; Hub and Spoke &middot; 24/7 Acute Model
				</p>
			</div>
		</Section>
	);
}

