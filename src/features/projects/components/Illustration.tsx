import type { CSSProperties } from 'react';

// Shared case-study illustration slots. Case studies pull exported Figma
// artwork into fixed-aspect, tinted containers; until an asset lands the same
// slot renders a labelled dashed placeholder at the identical size/background.
// Extracted from the CareSignal Platform components so every case study
// (Platform, Brand, …) shares one "placeholder now, real asset later" flow.

// Responsive slot sizing. A numeric width becomes a max-width with a
// width:100% base + aspect-ratio, so the slot scales down on narrow
// viewports instead of overflowing. String widths (e.g. "100%") already
// flex, so they keep their fixed height.
export function slotStyle(
	width: number | string,
	height: number,
	background: string,
	fill = false,
): CSSProperties {
	if (typeof width === 'number') {
		return {
			width: '100%',
			// `fill` drops the natural-size cap so the slot spans the full
			// content column (aspect ratio is still driven by width/height).
			...(fill ? {} : { maxWidth: width }),
			aspectRatio: `${width} / ${height}`,
			background,
		};
	}
	return { width, height, background };
}

export function IllustrationPlaceholder({
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
// slot the placeholder uses. `fit` defaults to `object-contain` so the image
// is bounded by the slot and the slot's `background` shows around any
// letterboxed area (right for logos/marks that must not crop). Pass
// `fit="cover"` for photos/screenshots that should fill the slot edge-to-edge,
// and `fill` to let the slot span the full content column instead of capping
// at its natural width.
export function Illustration({
	src,
	alt,
	width,
	height,
	background,
	fit = 'contain',
	fill = false,
	className,
}: {
	src: string;
	alt: string;
	width: number | string;
	height: number;
	background: string;
	fit?: 'contain' | 'cover';
	fill?: boolean;
	className?: string;
}) {
	const objectFit = fit === 'cover' ? 'object-cover' : 'object-contain';
	return (
		<div
			className={`overflow-hidden rounded-[12px] ${className ?? ''}`}
			style={slotStyle(width, height, background, fill)}
		>
			<img src={src} alt={alt} className={`block size-full ${objectFit}`} />
		</div>
	);
}
