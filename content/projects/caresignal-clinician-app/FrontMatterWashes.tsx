import { useEffect } from 'react';

import WashHighlightFX, {
	type WashHandle,
} from '../../../src/features/projects/components/figures/wash-highlight';

// The reference draws wash underlines on two phrases inside the front
// matter, which MDXLayout renders from frontmatter strings — so (as the
// prototype does) the phrases are found and wrapped at runtime rather than
// authored as spans. Renders nothing itself.
const TARGETS = [
	{ text: '15 to 20× as many patients', selector: 'h1' },
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
		const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
		const handles: WashHandle[] = [];
		// The front matter is painted by the time the MDX body mounts, but a
		// frame of settling avoids racing MDXLayout's own layout effects.
		const raf = requestAnimationFrame(() => {
			for (const t of TARGETS) {
				const el = [...document.querySelectorAll<HTMLElement>(t.selector)].find(
					(n) => n.textContent?.includes(t.text),
				);
				if (!el || el.querySelector('[data-wash-underline]')) continue;
				const span = wrapPhrase(el, t.text);
				if (!span) continue;
				span.setAttribute('data-wash-underline', '');
				handles.push(
					WashHighlightFX.attach(span, {
						mark: 'underline',
						pigment: 'hansa',
						delay: 64,
						threshold: 1,
						...(reduce ? { instant: true } : null),
					}),
				);
			}
		});
		return () => {
			cancelAnimationFrame(raf);
			handles.forEach((h) => h.destroy());
		};
	}, []);

	return null;
}
