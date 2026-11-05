import { useEffect, useRef } from 'react';

import WashHighlightFX from '../../../src/features/projects/components/figures/wash-highlight';
import { mount as mountDrop } from '../../../src/features/projects/components/figures/wash-drop';
import { prefersReducedMotion } from '../../../src/features/projects/components/figures/motion';

// A numbered badge whose rose watercolour drop lives in the shared, framework-
// agnostic wash-drop module (the same module the dc page can import, instead of
// re-implementing the interaction). This component is just the resting badge —
// a transparent 28px disc with an inset rose ring and a confetti-black numeral —
// plus a mount/destroy around wash-drop. `index` staggers the drops.
export function DropNumber({ n, index }: { n: number; index: number }) {
	const ref = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const handle = mountDrop(el, {
			index,
			reduced: prefersReducedMotion(),
			FX: WashHighlightFX,
		});
		return () => handle.destroy();
	}, [index]);

	return (
		<span
			ref={ref}
			aria-hidden="true"
			className="relative mt-[2px] inline-flex size-[28px] items-center justify-center rounded-full font-bold text-confetti-black"
			style={{
				isolation: 'isolate',
				background: 'transparent',
				boxShadow: 'inset 0 0 0 1.5px #a50e53',
				fontFamily: 'var(--font-body)',
				fontSize: 14,
				lineHeight: 1,
			}}
		>
			<span className="relative z-[1]">{n}</span>
		</span>
	);
}
