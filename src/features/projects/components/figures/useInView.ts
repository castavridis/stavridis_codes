import { useEffect, useRef, useState } from 'react';

// Mount-once in-view gate for lazy figures: flips true as the element
// approaches the viewport (rootMargin ahead of it) and stays true, so the
// heavy figure chunk loads just before it's needed and never unloads.
export function useInView<T extends HTMLElement = HTMLDivElement>(
	rootMargin = '400px',
) {
	const ref = useRef<T>(null);
	const [inView, setInView] = useState(false);

	useEffect(() => {
		if (inView) return;
		const el = ref.current;
		if (!el || typeof IntersectionObserver === 'undefined') {
			setInView(true);
			return;
		}
		const io = new IntersectionObserver(
			(es) => {
				if (es.some((e) => e.isIntersecting)) {
					setInView(true);
					io.disconnect();
				}
			},
			{ rootMargin },
		);
		io.observe(el);
		return () => io.disconnect();
	}, [rootMargin, inView]);

	return { ref, inView };
}
