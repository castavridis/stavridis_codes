import { useEffect } from 'react';

import WashHighlightFX, {
	type WashHandle,
} from '../../../src/features/projects/components/figures/wash-highlight';
import {
	afterPageLoad,
	prefersReducedMotion,
} from '../../../src/features/projects/components/figures/motion';

// The reference draws wash underlines on two phrases inside the front
// matter, which MDXLayout renders from frontmatter strings — so (as the
// prototype does) the phrases are found and wrapped at runtime rather than
// authored as spans. Renders nothing itself.
const TARGETS = [
	{ text: '15 to 20× as many patients', selector: 'h1', wet: 1 },
	{ text: 'sole Product Designer', selector: 'p' },
];

function wrapPhrase(root: HTMLElement, phrase: string): HTMLElement | null {
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
	for (let node = walker.nextNode(); node; node = walker.nextNode()) {
		const text = node.textContent ?? '';
		const i = text.indexOf(phrase);
		if (i < 0) continue;
		const range = document.createRange();
		range.setStart(node, i);
		range.setEnd(node, i + phrase.length);
		const span = document.createElement('span');
		try {
			range.surroundContents(span);
		} catch {
			return null;
		}
		return span;
	}
	return null;
}

export function FrontMatterWashes() {
	useEffect(() => {
		const reduce = prefersReducedMotion();
		const handles: WashHandle[] = [];
		// Defer the underlines until the browser is idle so they don't paint
		// during the project sheet's open transition (bounded by the timeout).
		let cancelled = false;
		const draw = () => {
			if (cancelled) return;
			for (const t of TARGETS) {
				const el = [...document.querySelectorAll<HTMLElement>(t.selector)].find(
					(n) => n.textContent?.includes(t.text),
				);
				if (!el) continue;
				// Reuse a span left by a previous mount (the wrap survives this
				// component's unmount) — skipping attach entirely would leave
				// the underline undrawn after HMR or a re-reveal.
				const span =
					el.querySelector<HTMLElement>('[data-wash-underline]') ??
					wrapPhrase(el, t.text);
				if (!span) continue;
				span.setAttribute('data-wash-underline', '');
				handles.push(
					WashHighlightFX.attach(span, {
						mark: 'underline',
						pigment: 'hansa',
						delay: 64,
						threshold: 1,
						duration: reduce ? 1 : 650,
						instantDry: true,
						...('wet' in t ? { wet: t.wet } : null),
						...(reduce ? { instant: true } : null),
					}),
				);
			}
		};
		const w = window as typeof window & {
			requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
			cancelIdleCallback?: (id: number) => void;
		};
		// Wait until 500 ms after page load (as the design does), then an idle
		// moment so nothing paints during the sheet's open transition.
		let idleId: number | undefined;
		let rafId: number | undefined;
		afterPageLoad(500).then(() => {
			if (cancelled) return;
			idleId = w.requestIdleCallback?.(draw, { timeout: 600 });
			if (idleId === undefined) rafId = requestAnimationFrame(draw);
		});
		return () => {
			cancelled = true;
			if (idleId !== undefined) w.cancelIdleCallback?.(idleId);
			if (rafId !== undefined) cancelAnimationFrame(rafId);
			handles.forEach((h) => h.destroy());
		};
	}, []);

	return null;
}
