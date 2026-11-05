import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

import Text from '../../../src/components/Text';
import Figure from '../../../src/features/projects/components/figures/Figure';
import { prefersReducedMotion } from '../../../src/features/projects/components/figures/motion';

export { default as Citation } from '../../../src/features/projects/components/figures/Citation';
export { default as Figure } from '../../../src/features/projects/components/figures/Figure';

export const IMG = '/images/projects/caresignal-clinician-app';

// Interim stand-in for the animated watercolour figures (nurse orbit, care
// team orbits, design-principle swipes, text-message anatomy). Figure panel
// background per the handoff token sheet. Deliberately NOT
// IllustrationPlaceholder (src/features/projects/components/Illustration.tsx):
// that one is a dashed slot for a missing exported image; this is an
// accessible role="img" stand-in for an interactive figure, described by its
// label while the real figure is pending or lazy-loading.
export function FigPlaceholder({
	label,
	height = 420,
}: {
	label: string;
	height?: number;
}) {
	return (
		<div
			role="img"
			aria-label={`Placeholder for figure: ${label}`}
			className="flex w-full items-center justify-center rounded-[16px] bg-[#f7f6f5]"
			style={{ height }}
		>
			<Text variant="callout-meta" className="m-0 px-[24px] text-center text-confetti-black/50">
				Placeholder — {label}
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
				background: `#9fb6e8 url(${IMG}/fig-backdrop.webp) center / cover no-repeat`,
			}}
		>
			<FadeImg src={src} alt={alt} width={width} height={height} />
		</div>
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
		const img = ref.current;
		if (!img) return;
		const show = () => {
			img.style.opacity = '1';
		};
		if (prefersReducedMotion()) {
			img.style.transition = 'none';
			show();
			return;
		}
		let io: IntersectionObserver | null = new IntersectionObserver(
			(entries) => {
				for (const e of entries) {
					if (!e.isIntersecting) continue;
					io?.disconnect();
					io = null;
					if (img.complete && img.naturalWidth) requestAnimationFrame(show);
					else
						img.addEventListener('load', () => requestAnimationFrame(show), {
							once: true,
						});
				}
			},
			{ threshold: 0.15 },
		);
		io.observe(img);
		return () => io?.disconnect();
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
			className="inline-flex size-[32px] shrink-0 items-center justify-center rounded-full bg-[#6f9e17] font-bold text-white"
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
