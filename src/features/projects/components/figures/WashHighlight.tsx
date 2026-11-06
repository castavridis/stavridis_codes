import { useEffect, useRef } from 'react';

import WashHighlightFX, { type WashHighlightOptions } from './wash-highlight';
import { afterPageLoad, prefersReducedMotion } from './motion';

type WashHighlightProps = WashHighlightOptions & {
	children: React.ReactNode;
	className?: string;
};

// A watercolour underline or highlighter swept behind a run of text once it
// scrolls into view. Wraps the text in a span the engine draws under
// (mix-blend multiply, aria-hidden); reduced-motion renders instantly via
// the engine's own handling.
export default function WashHighlight({
	children,
	className,
	...opts
}: WashHighlightProps) {
	const ref = useRef<HTMLSpanElement>(null);
	// Engine options only matter at attach time; re-attaching on every
	// options-object identity change would replay the stroke.
	const optsRef = useRef(opts);
	optsRef.current = opts;

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const reduce = prefersReducedMotion();
		// Highlights wait until 500 ms after page load (design / figure style
		// recipe §5), then fire when fully in view.
		let handle: ReturnType<typeof WashHighlightFX.attach> | null = null;
		let dead = false;
		afterPageLoad(500).then(() => {
			if (dead) return;
			handle = WashHighlightFX.attach(el, {
				...optsRef.current,
				...(reduce ? { instant: true } : null),
			});
		});
		return () => {
			dead = true;
			handle?.destroy();
		};
	}, []);

	return (
		<span ref={ref} className={className}>
			{children}
		</span>
	);
}
