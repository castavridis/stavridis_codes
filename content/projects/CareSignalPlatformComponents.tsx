import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { animated, easings, useTransition } from '@react-spring/web';
import { X } from 'lucide-react';

import {
	MDXWrapper,
	MDXColumn,
} from '../../src/components/mdx/Layout';
import Callout from '../../src/features/projects/components/Callout';
import OutcomeStat from '../../src/features/projects/components/OutcomeStat';
import Section from '../../src/features/projects/components/Section';
import Slides, { Slide } from '../../src/features/projects/components/Slides';
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
			<div className="flex w-full flex-col items-start gap-[24px] md:flex-row md:gap-[35px]">
				<div className="flex w-full flex-col gap-[24px] md:w-[349px] md:shrink-0 md:pt-[104px]">
					<h2 className="type-headline-small m-0 text-confetti-black">
						We designed a low-burden way to offer clinicians a snapshot of their patient panel
					</h2>
					<p className="type-copy m-0 text-confetti-black/80">
						Working with clinicians and buyers we designed a system aligned with value-based care and to signal urgent and emergent needs at-a-glance.
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

// Responsive slot sizing. A numeric width becomes a max-width with a
// width:100% base + aspect-ratio, so the slot scales down on narrow
// viewports instead of overflowing. String widths (e.g. "100%") already
// flex, so they keep their fixed height.
function slotStyle(
	width: number | string,
	height: number,
	background: string,
): React.CSSProperties {
	if (typeof width === 'number') {
		return {
			width: '100%',
			maxWidth: width,
			aspectRatio: `${width} / ${height}`,
			background,
		};
	}
	return { width, height, background };
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
			className={`flex items-center justify-center overflow-hidden rounded-[12px] border border-dashed ${dark ? 'border-white/20' : 'border-confetti-black/25'} ${className ?? ''}`}
			style={slotStyle(width, height, background)}
		>
			<span
				className={`type-tag uppercase tracking-[0.08em] ${dark ? 'text-white/60' : 'text-confetti-black/60'}`}
			>
				Illustration · {name}
			</span>
		</div>
	);
}

// Renders an exported Figma illustration inside the same sized + tinted
// slot the placeholder uses. Use `object-contain` so the image is bounded
// by the slot regardless of its native aspect; the slot's `background`
// shows around any letterboxed area, which matches the Figma frame.
function Illustration({
	src,
	alt,
	width,
	height,
	background,
	className,
}: {
	src: string;
	alt: string;
	width: number | string;
	height: number;
	background: string;
	className?: string;
}) {
	return (
		<div
			className={`overflow-hidden rounded-[12px] ${className ?? ''}`}
			style={slotStyle(width, height, background)}
		>
			<img src={src} alt={alt} className="block size-full object-contain" />
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
				<div className="flex w-full max-w-[705px] flex-col gap-[8px]">
					<h2 className="type-headline-small m-0 text-confetti-black">
						Clinical users work within complex software environments with heightened scrutiny.
					</h2>
					<p className="type-copy m-0 text-confetti-black/80">
						Many of our users had to toggle between several information-dense interfaces in order to outreach patients and document their work. Although CareSignal offered integration, our platform needed to be usable out of the box to onboard teams in days, not months.
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
					<span className="font-semibold">A typical workstation for clinical users.</span><br />
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
				<Illustration
					src="/images/projects/caresignal-platform/Alert Layout.png"
					alt="A diagonal stack of patient alert flags, each showing time-since, patient name, vital sign, and resolve / snooze controls."
					width="100%"
					height={504}
					background="#191716"
					className="p-[24px] md:p-[72px]"
				/>
				<Illustration
					src="/images/projects/caresignal-platform/Patient Layout.png"
					alt="A list of patient rows over a dark background — Patient Banner cards stacked with optional Program Banner sub-rows for high-priority patients."
					width="100%"
					height={484}
					background="#191716"
					className="p-[24px] md:p-[72px]"
				/>

			<Slides>
				<Slide
					caption={
						<>
							<span className="font-semibold">Patient summaries</span> give providers a more holistic perspective about their patients than an Alert can provide, and support them in prioritizing outreach.
						</>
					}
				>
					<SlideImage
						src="/images/projects/caresignal-platform/Task-Based%20Dashboard.png"
						alt="The task-based dashboard listing patient alerts and summaries with high-risk / medium-risk / low-risk badges and snooze / resolve actions."
					/>
				</Slide>
				<Slide
					caption={
						<>
							<span className="font-semibold">Hub and Spoke</span> — placeholder slide, real capture coming later.
						</>
					}
				>
					<SlideImage
						src="/images/projects/caresignal-platform/Hub%20and%20Spoke.png"
						alt="A care-team diagram showing one assistant routing patients to multiple nurses in a hub-and-spoke configuration."
					/>
				</Slide>
			</Slides>
			</div>
		</Section>
	);
}

// ---------------------------------------------------------------------------
// Screenshots — Figma section `Section: Screenshots` (node 2232:32360).
// A Slides carousel showing dashboard captures. Each Slide's children are
// wrapped in a fixed-aspect viewport so cycling between slides of different
// natural image dimensions doesn't cause the carousel to jump in height.
// Hub and Spoke is a placeholder slide — real screenshots will land later.
// ---------------------------------------------------------------------------
export function Screenshots() {
	return (
		<Section>
			<Slides>
				<Slide
					caption={
						<>
							<span className="font-semibold">Patient summaries</span> give providers a more holistic perspective about their patients than an Alert can provide, and support them in prioritizing outreach.
						</>
					}
				>
					<SlideImage
						src="/images/projects/caresignal-platform/Task-Based%20Dashboard.png"
						alt="The task-based dashboard listing patient alerts and summaries with high-risk / medium-risk / low-risk badges and snooze / resolve actions."
					/>
				</Slide>
				<Slide
					caption={
						<>
							<span className="font-semibold">Hub and Spoke</span> — placeholder slide, real capture coming later.
						</>
					}
				>
					<SlideImage
						src="/images/projects/caresignal-platform/Hub%20and%20Spoke.png"
						alt="A care-team diagram showing one assistant routing patients to multiple nurses in a hub-and-spoke configuration."
					/>
				</Slide>
			</Slides>
		</Section>
	);
}

function SlideImage({ src, alt }: { src: string; alt: string }) {
	const [expanded, setExpanded] = useState(false);

	// Close the lightbox on Escape while it's open.
	useEffect(() => {
		if (!expanded) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setExpanded(false);
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [expanded]);

	// Snappy in, gentler out — fast enter, slower leave.
	const transitions = useTransition(expanded, {
		from: { opacity: 0, scale: 0.96 },
		enter: { opacity: 1, scale: 1 },
		leave: { opacity: 0, scale: 0.96 },
		config: (_item, _index, phase) => ({
			duration: phase === 'leave' ? 320 : 130,
			easing: phase === 'leave' ? easings.easeInCubic : easings.easeOutCubic,
		}),
	});

	return (
		<>
			<button
				type="button"
				onClick={() => setExpanded(true)}
				aria-label={`Expand image: ${alt}`}
				className="block aspect-[770/463] w-full cursor-zoom-in bg-transparent"
			>
				<img src={src} alt={alt} className="block size-full object-contain" />
			</button>

			{/* Lightbox — translucent cream scrim, click anywhere or Esc to
			    close. Fades + zooms in fast, out slower. */}
			{transitions((style, open) =>
				open
					? createPortal(
							<animated.div
								role="dialog"
								aria-modal="true"
								aria-label={alt}
								onClick={() => setExpanded(false)}
								style={{ opacity: style.opacity }}
								className="bg-washes-paper/85 fixed inset-0 z-[70] flex cursor-zoom-out items-center justify-center p-[24px]"
							>
								<button
									type="button"
									aria-label="Close"
									onClick={() => setExpanded(false)}
									className="text-confetti-black/60 hover:text-confetti-black absolute right-[20px] top-[20px] inline-flex size-[40px] items-center justify-center"
								>
									<X size={28} strokeWidth={1.6} aria-hidden />
								</button>
								<animated.img
									src={src}
									alt={alt}
									style={{ scale: style.scale }}
									className="max-h-full max-w-[1400px] object-contain"
								/>
							</animated.div>,
							document.body,
						)
					: null,
			)}
		</>
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

				<div className="grid w-full grid-cols-1 gap-[16px] sm:grid-cols-3">
					<OutcomeStat stat="≥ 10x" caption="Growth in patients per clinical user" />
					<OutcomeStat stat="144%" caption="Net recurring revenue year over year" />
					<Illustration
						src="/images/projects/caresignal-platform/KLAS.png"
						alt="Best in KLAS 2024 and Best in KLAS 2025"
						width="100%"
						height={176}
						background="#f0eeeb"
					/>
				</div>
			</div>

			<div className="mt-[40px] flex w-full flex-col gap-[16px] p-[16px] bg-[#f0eeeb] rounded-lg">
				<p className="type-headline-small-italic my-[12px] text-confetti-black">
					One platform, many workflows
				</p>

				<WorkflowToggle
					src="/case-studies/caresignal/workflow/index.html"
					title="CareSignal care-models visualization"
				/>

			</div>
		</Section>
	);
}

