// The case-study page scrolls inside the sheet overlay's inner container,
// not the window. Components that track scroll position share this walk
// instead of re-deriving it. Remember the other two sheet-overlay traps:
// scroll events don't bubble to window (listen with capture), and the
// sheet's transform makes it the containing block for fixed descendants
// (portal fixed elements to <body>).
export function findScrollport(from: Element | null): HTMLElement | null {
	for (let n = from?.parentElement ?? null; n; n = n.parentElement) {
		const cs = getComputedStyle(n);
		if (
			/(auto|scroll|overlay)/.test(cs.overflowY) &&
			n.scrollHeight > n.clientHeight
		) {
			return n as HTMLElement;
		}
	}
	return null;
}
