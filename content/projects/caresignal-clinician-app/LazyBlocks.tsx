import { useEffect } from 'react';

// dc lazyBlocks(): 2.5 s after mount, every 704px reading-column block that
// holds no figure, canvas or watercolour drop gets `content-visibility: auto`
// with its measured height as the intrinsic size, so off-screen prose skips
// rendering. Hover or focus inside a block turns it back to visible (text
// selection, find-in-page and focus rings stay exact). Renders nothing.
const BLOCKS =
	'[data-case="caresignal-clinician-app"] div.max-w-\\[704px\\]';

export function LazyBlocks() {
	useEffect(() => {
		if (!('contentVisibility' in document.documentElement.style)) return;
		const cleanups: (() => void)[] = [];
		const t = window.setTimeout(() => {
			document.querySelectorAll<HTMLElement>(BLOCKS).forEach((b) => {
				// Also skip blocks holding a section heading: the section nav
				// measures those on every scroll, which would force the skipped
				// subtree back through layout (the design's anchors are the
				// blocks themselves, so it doesn't hit this).
				if (b.dataset.cv || b.querySelector('canvas,figure,[data-sec]')) return;
				if (!b.offsetHeight) return;
				b.dataset.cv = '';
				// Measure while still visible, then contain.
				const on = () => {
					if (b.style.contentVisibility === 'auto') return;
					const h = b.offsetHeight;
					if (!h) return;
					b.style.containIntrinsicSize = `auto ${h}px`;
					b.style.contentVisibility = 'auto';
				};
				const off = () => {
					b.style.contentVisibility = 'visible';
				};
				const leave = () => {
					if (!b.contains(document.activeElement)) on();
				};
				const blur = (e: FocusEvent) => {
					if (!b.contains(e.relatedTarget as Node | null) && !b.matches(':hover')) on();
				};
				on();
				b.addEventListener('pointerenter', off);
				b.addEventListener('focusin', off);
				b.addEventListener('pointerleave', leave);
				b.addEventListener('focusout', blur);
				cleanups.push(() => {
					b.removeEventListener('pointerenter', off);
					b.removeEventListener('focusin', off);
					b.removeEventListener('pointerleave', leave);
					b.removeEventListener('focusout', blur);
					b.style.contentVisibility = '';
					b.style.containIntrinsicSize = '';
					delete b.dataset.cv;
				});
			});
		}, 2500);
		return () => {
			clearTimeout(t);
			cleanups.forEach((c) => c());
		};
	}, []);
	return null;
}
