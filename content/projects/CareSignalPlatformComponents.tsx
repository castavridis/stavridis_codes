import {
	MDXWrapper,
	MDXColumn,
} from '../../src/components/mdx/Layout';
import Callout from '../../src/features/projects/components/Callout';
import Section from '../../src/features/projects/components/Section';

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

export function Situation () {
	return (
		<div>
			<MDXWrapper gap={28}>
				<MDXColumn span={9}>
					<h2>
						Clinical users work within complex software environments with heightened scrutiny.
					</h2>
					<p>
						Many of our users had to toggle between several information-dense interfaces in order to outreach patients and document their work. Although CareSignal offered integration, our platform needed to be usable out of the box to onboard teams in days, not months.
					</p>
				</MDXColumn>
				<MDXColumn>
					<img
						className="object-contain mx-auto"
						src="/images/projects/caresignal-platform/Monitors.png"
						alt="Two monitors, side-by-side. Each monitor has two applications. The left monitor has EMR and spreadsheet applications open. The right monitor has email and company chat open."
					/>
				</MDXColumn>
				<MDXColumn>
					<caption className="block w-full">
						<span className="font-bold block">A typical workstation for clinical users</span>
						Our users (both in-office and remote) navigated two or more large monitors, and a slew of applications.
					</caption>
				</MDXColumn>
			</MDXWrapper>
		</div>
	)
}

export function Solution () {}

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
}: {
	name: string;
	width: number;
	height: number;
	background: string;
}) {
	return (
		<div
			className="flex shrink-0 items-center justify-center overflow-hidden rounded-[12px] border border-dashed border-confetti-black/25"
			style={{ width, height, background }}
		>
			<span className="type-tag uppercase tracking-[0.08em] text-confetti-black/60">
				Illustration · {name}
			</span>
		</div>
	);
}

