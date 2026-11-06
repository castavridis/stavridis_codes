import { useEffect, useState, type RefObject } from 'react';

// Figures and citations are numbered by their order in the document, not
// their order of mounting — late-mounting (lazy) figures renumber the ones
// already on the page. Every numbered element re-syncs on this event, and
// mount/unmount of any of them fires it.
const EVT = 'stavridis-renumber';

function notifyRenumber() {
	window.dispatchEvent(new Event(EVT));
}

// Subscribe to renumbering (any numbered element mounting or unmounting), for
// things that point at a numbered element rather than being one — e.g. a
// "View Figure N" link. Returns the unsubscribe.
export function onRenumber(cb: () => void) {
	window.addEventListener(EVT, cb);
	return () => window.removeEventListener(EVT, cb);
}

// Returns this element's 1-based number among all `[attr]` elements in DOM
// order, plus a `ready` flag that stays false until the first real count —
// before that every element reports 1, so id/anchor derivation must wait.
// With `dedupeByValue`, elements sharing the same attribute value share a
// number (repeat citations of one source), and numbers count unique values
// instead of elements.
export function useDomOrderNumber(
	ref: RefObject<Element | null>,
	attr: string,
	dedupeByValue = false,
) {
	const [state, setState] = useState({ n: 1, ready: false });

	useEffect(() => {
		const sync = () => {
			const el = ref.current;
			if (!el) return;
			const els = [...document.querySelectorAll(`[${attr}]`)];
			let next: number;
			if (dedupeByValue) {
				const keys: string[] = [];
				for (const c of els) {
					const k = c.getAttribute(attr) ?? '';
					if (!keys.includes(k)) keys.push(k);
				}
				next = keys.indexOf(el.getAttribute(attr) ?? '') + 1;
			} else {
				next = els.indexOf(el) + 1;
			}
			if (next > 0)
				setState((prev) =>
					prev.n !== next || !prev.ready ? { n: next, ready: true } : prev,
				);
		};
		window.addEventListener(EVT, sync);
		notifyRenumber();
		const raf = requestAnimationFrame(sync);
		return () => {
			window.removeEventListener(EVT, sync);
			cancelAnimationFrame(raf);
			// After this element is gone, let the survivors close the gap.
			requestAnimationFrame(notifyRenumber);
		};
	}, [ref, attr, dedupeByValue]);

	return state;
}
