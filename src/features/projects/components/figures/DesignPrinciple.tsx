import { useEffect, useRef } from 'react';

import WashHighlightFX, { type WashPigment } from './wash-highlight';

type DesignPrincipleProps = {
	number: number;
	text: string;
	pigment: Extract<WashPigment, 'rose' | 'hansa' | 'cerulean'>;
	// Stroke start/end heights in card fractions, and the upward bow.
	startY?: number;
	endY?: number;
	arc?: number;
	// Stroke parameters (defaults match the case study's sw.* props).
	load?: number;
	width?: number;
	pressure?: number;
	variation?: number;
	landing?: number;
	lift?: number;
	runOut?: number;
	duration?: number;
	spatter?: boolean;
	gravity?: number;
	gravityAngle?: number;
};

// Gaussian jitter matching the reference's path-heat sampling: each mount
// draws the stroke's endpoints from soft hot spots (r = 0.12 card heights)
// around the configured start/end, so every visit paints a slightly
// different swipe.
function jitter(x: number, y: number, aspect: number) {
	const r = 0.12;
	const g = Math.sqrt(-2 * Math.log(Math.max(1e-9, Math.random())));
	const v = Math.random() * 6.2832;
	const s = r / Math.SQRT2;
	return {
		x: Math.max(-0.15, Math.min(1.15, x + (g * Math.cos(v) * s) / aspect)),
		y: Math.max(0.02, Math.min(0.98, y + g * Math.sin(v) * s)),
	};
}

// A numbered design principle over an animated watercolour brush swipe.
export default function DesignPrinciple({
	number,
	text,
	pigment,
	startY = 0.62,
	endY = 0.43,
	arc = 0.12,
	load = 2.6,
	width = 0.42,
	pressure = 1,
	variation = 0.35,
	landing = 0.3,
	lift = 0.2,
	runOut = 0.3,
	duration = 750,
	spatter = true,
	gravity = 0.08,
	gravityAngle = 0,
}: DesignPrincipleProps) {
	const washRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const el = washRef.current;
		if (!el) return;
		const r = el.getBoundingClientRect();
		const aspect = r.height > 0 ? r.width / r.height : 6;
		const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
		const handle = WashHighlightFX.swipe(el, {
			pigment,
			path: [jitter(0, startY, aspect), jitter(1, endY, aspect)],
			arc,
			load,
			width,
			pressure,
			variation,
			landing,
			lift,
			runOut,
			duration,
			spatter,
			gravity,
			gravityAngle,
			trigger: 'view',
			...(reduce ? { instant: true } : null),
		});
		return () => handle.destroy();
		// Attach-once by design; prop changes would replay the stroke.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<div className="grid w-full justify-center" style={{ gridTemplateColumns: 'minmax(0, 704px)' }}>
			<div
				className="relative isolate box-border flex w-full flex-col gap-[6px] overflow-hidden rounded-[12px] bg-[#f7f6f5] py-[24px] px-[clamp(20px,3vw,36px)]"
			>
				<div ref={washRef} aria-hidden className="pointer-events-none absolute inset-0 -z-10" />
				<span
					className="text-[14px] leading-[20px] tracking-[0.02em] text-confetti-black"
					style={{ fontFamily: 'var(--font-mono)' }}
				>
					Design Principle #{number}
				</span>
				<span
					className="text-[28px] font-medium leading-[1.2] text-confetti-black [text-wrap:pretty]"
					style={{ fontFamily: 'var(--font-kyoto)' }}
				>
					{text}
				</span>
			</div>
		</div>
	);
}
