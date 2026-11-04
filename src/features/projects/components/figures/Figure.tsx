import { useRef } from 'react';

import { useDomOrderNumber } from './dom-order';

// Auto-numbered "figure N" eyebrow chip. Numbers follow DOM order across the
// whole page; `id="figure-N"` makes each one linkable.
export default function Figure({ label = 'figure' }: { label?: string }) {
	const ref = useRef<HTMLSpanElement>(null);
	const { n, ready } = useDomOrderNumber(ref, 'data-figure-chip');

	return (
		<span
			ref={ref}
			data-figure-chip=""
			// No id until numbered — pre-sync every chip would claim figure-1.
			id={ready ? `figure-${n}` : undefined}
			className="type-eyebrow inline-block scroll-mt-[96px] whitespace-nowrap text-confetti-black"
		>
			{label} {n}
		</span>
	);
}
