import type { ReactNode } from 'react';

import type { CitationSource } from './citations';

export const IMG = '/images/projects/caresignal-clinician-app';

// Interim superscript source marker. Will be replaced by the auto-numbered
// Citation popover component (shared library) — keeping explicit numbers
// until then so every marker stays anchored to its sentence.
export function Cite({ n, cite }: { n: number; cite: CitationSource }) {
	return (
		<sup
			title={`${cite.title}: ${cite.source}`}
			className="type-callout-meta cursor-help text-confetti-black/60"
		>
			{n}
		</sup>
	);
}

// Interim stand-in for the animated watercolour figures (nurse orbit, care
// team orbits, design-principle swipes, text-message anatomy). Figure panel
// background per the handoff token sheet.
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
			<p className="type-callout-meta m-0 px-[24px] text-center text-confetti-black/50">
				Placeholder — {label}
			</p>
		</div>
	);
}

export function FigCaption({ children }: { children: ReactNode }) {
	return (
		<p className="type-callout-meta m-0 text-center text-confetti-black/70">
			{children}
		</p>
	);
}

// Screenshot presented on the blurred sky-and-field backdrop, as in the
// design reference.
export function BackdropShot({
	src,
	alt,
}: {
	src: string;
	alt: string;
}) {
	return (
		<div
			className="w-full overflow-clip rounded-[16px] p-[24px] md:p-[40px]"
			style={{
				backgroundImage: `url(${IMG}/fig-backdrop.webp)`,
				backgroundSize: 'cover',
				backgroundPosition: 'center',
			}}
		>
			<img
				src={src}
				alt={alt}
				className="block w-full rounded-[8px] shadow-[0_12px_32px_rgba(0,0,0,0.18)]"
			/>
		</div>
	);
}

// Numbered sub-principle badge (the green numbered chips on the h4s).
export function NumBadge({ n }: { n: number }) {
	return (
		<span className="mr-[10px] inline-flex size-[28px] items-center justify-center rounded-full bg-[#b2d07f] align-middle font-bold text-[#5f8a2e] type-callout-meta">
			{n}
		</span>
	);
}

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
			className="type-headline-small m-0 scroll-mt-[132px] text-confetti-black"
		>
			{children}
		</h2>
	);
}
