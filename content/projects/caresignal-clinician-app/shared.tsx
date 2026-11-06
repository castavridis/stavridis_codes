import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

import Text from '../../../src/components/Text';
import Figure from '../../../src/features/projects/components/figures/Figure';
import { observe as fadeInObserve } from '../../../src/features/projects/components/fade-in';
import { prefersReducedMotion } from '../../../src/features/projects/components/figures/motion';

export {
	default as Citation,
	isPlaceholderCitation,
} from '../../../src/features/projects/components/figures/Citation';
export { default as Figure } from '../../../src/features/projects/components/figures/Figure';

export const IMG = '/images/projects/caresignal-clinician-app';

// A figure-shaped empty panel on the figure-card paper. Used both as the
// Suspense / lazy-mount fallback while an interactive figure (nurse orbit,
// care team orbits…) loads, and as a plain empty state where a figure has
// nothing to show. `label` is the accessible name, used verbatim — callers
// say what the panel stands for; nothing is prepended. Visible content is
// `children` when given, otherwise the label. `loading` marks the panel
// aria-busy so assistive tech knows the real figure is on its way.
// Deliberately NOT IllustrationPlaceholder
// (src/features/projects/components/Illustration.tsx): that one is a dashed
// slot for a missing exported image.
export function FigEmptyState({
	label,
	children,
	loading = false,
	height = 420,
}: {
	label: string;
	children?: ReactNode;
	loading?: boolean;
	height?: number;
}) {
	return (
		<div
			role="img"
			aria-label={label}
			aria-busy={loading || undefined}
			className="flex w-full items-center justify-center rounded-[16px] bg-washes-paper"
			style={{ height }}
		>
			<Text variant="callout-meta" className="m-0 px-[24px] text-center text-confetti-black/50">
				{children ?? label}
			</Text>
		</div>
	);
}

export function FigCaption({
	children,
	fig = false,
}: {
	children: ReactNode;
	// Lead the caption with the auto-numbered "figure N" chip.
	fig?: boolean;
}) {
	if (fig) {
		return (
			<figcaption className="flex flex-wrap items-baseline justify-center gap-[10px] text-center">
				<Figure />
				<span
					className="text-[14px] leading-[20px] tracking-[0.02em] text-confetti-black"
					style={{ fontFamily: 'var(--font-mono)' }}
				>
					{children}
				</span>
			</figcaption>
		);
	}
	return (
		<Text variant="callout-meta" className="m-0 text-center text-confetti-black/70">
			{children}
		</Text>
	);
}

// A product screenshot, full-bleed in an aspect-locked 16px frame that fades
// up over a blurred sky-and-field backdrop once it has loaded and scrolled
// into view (the design's `data-fade`). `width`/`height` are the shot's
// natural pixels, used to lock the frame's aspect ratio.
export function BackdropShot({
	src,
	alt,
	width,
	height,
}: {
	src: string;
	alt: string;
	width: number;
	height: number;
}) {
	return (
		<div
			className="block w-full overflow-hidden rounded-[16px]"
			style={{
				aspectRatio: `${width} / ${height}`,
				background: `var(--color-screenshot-sky) url(${IMG}/fig-backdrop.jpeg) center / cover no-repeat`,
			}}
		>
			<FadeImg src={src} alt={alt} width={width} height={height} />
		</div>
	);
}

// A whole app window (an exported PNG with its own chrome and transparent
// rounded corners) inset on the sky-and-field backdrop, with the figure
// caption set in white on the field below it — the "Dashboard Mockup" layout.
// Insets are % of the frame's width (padding % resolves against width), so
// the composition scales as one piece; the caption band grows if it wraps.
export function BackdropWindowShot({
	src,
	alt,
	width,
	height,
	insetX = '5.6%',
	children,
}: {
	src: string;
	alt: string;
	width: number;
	height: number;
	// Side inset, as a % of the frame width. Default fits a single app
	// window; edge-to-edge composites (e.g. overlapping pages) go tighter.
	insetX?: string;
	// Caption text, led by the auto-numbered figure chip.
	children: ReactNode;
}) {
	return (
		<figure
			className="m-0 flex w-full flex-col overflow-hidden rounded-[16px]"
			style={{
				padding: `5.1% ${insetX} 0`,
				background: `var(--color-screenshot-sky) url(${IMG}/fig-backdrop.jpeg) center / cover no-repeat`,
			}}
		>
			<FadeImg src={src} alt={alt} width={width} height={height} />
			<figcaption
				className="flex flex-wrap items-baseline justify-center gap-x-[10px] text-center text-white [&_[data-figure-chip]]:text-white"
				style={{ padding: '2.1% 0 3.8%', textShadow: '0 1px 6px rgb(0 0 0 / 0.25)' }}
			>
				<Figure />
				<span
					className="text-[14px] leading-[20px] tracking-[0.02em]"
					style={{ fontFamily: 'var(--font-mono)' }}
				>
					{children}
				</span>
			</figcaption>
		</figure>
	);
}

// Fade an image up from transparent once it is both loaded and on screen;
// reduced motion shows it immediately.
function FadeImg({
	src,
	alt,
	width,
	height,
}: {
	src: string;
	alt: string;
	width: number;
	height: number;
}) {
	const ref = useRef<HTMLImageElement>(null);
	useEffect(() => {
		const handle = fadeInObserve(ref.current, {
			reduced: prefersReducedMotion(),
		});
		return () => handle.destroy();
	}, []);
	return (
		<img
			ref={ref}
			src={src}
			alt={alt}
			width={width}
			height={height}
			loading="lazy"
			decoding="async"
			className="block w-full"
			style={{ opacity: 0, transition: 'opacity 450ms ease' }}
		/>
	);
}

// The pillar numeral on the goal h4s: a 32px solid-green disc with a white
// numeral (decorative — the heading text carries the meaning).
export function NumBadge({ n }: { n: number }) {
	return (
		<span
			aria-hidden="true"
			className="bg-care-green inline-flex size-[32px] shrink-0 items-center justify-center rounded-full font-bold text-white"
			style={{ fontFamily: 'var(--font-body)', fontSize: 16, lineHeight: 1 }}
		>
			{n}
		</span>
	);
}

// Section headings are small mono labels in the reference (the big serif
// statements inside sections are pull quotes, not headings).
export function SectionHeading({
	id,
	children,
}: {
	id: string;
	children: ReactNode;
}) {
	return (
		<h2
			id={id}
			data-sec=""
			className="m-0 scroll-mt-[132px] text-[14px] font-bold leading-[20px] tracking-[0.02em] text-confetti-black/65"
			style={{ fontFamily: 'var(--font-mono)' }}
		>
			{children}
		</h2>
	);
}
