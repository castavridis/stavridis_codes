import type { ReactNode } from 'react';

import Figure from '../../../src/features/projects/components/figures/Figure';

export { default as Citation } from '../../../src/features/projects/components/figures/Citation';
export { default as Figure } from '../../../src/features/projects/components/figures/Figure';

export const IMG = '/images/projects/caresignal-clinician-app';

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
