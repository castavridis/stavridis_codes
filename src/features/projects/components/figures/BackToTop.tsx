import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { findScrollport } from './scrollport';

const reducedMotion = () =>
	!!window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

type BackToTopProps = {
	label?: string;
	// Appears once this element is pinned (position: sticky, stuck to its
	// top offset) — the case-study section nav. Without a match it falls
	// back to "scrolled past one viewport".
	stickySelector?: string;
	// Horizontal alignment target: the button hugs this element's left edge
	// (the nav column), else 24px from the viewport edge.
	alignSelector?: string;
};

// Fixed "Back to top" pill, bottom-left, aligned with the section nav.
// Wags when it appears.
export default function BackToTop({
	label = 'Back to top',
	// The sticky element is the card inside the nav, not the nav itself.
	stickySelector = 'nav[aria-label="Sections"] > div',
	alignSelector = 'nav[aria-label="Sections"]',
}: BackToTopProps) {
	const btnRef = useRef<HTMLButtonElement>(null);
	const [shown, setShown] = useState(false);
	const [left, setLeft] = useState(24);

	useEffect(() => {
		let raf = 0;
		let wagT: ReturnType<typeof setTimeout>;
		let wasShown = false;

		const wag = () => {
			const b = btnRef.current;
			if (!b || !b.animate || reducedMotion()) return;
			clearTimeout(wagT);
			// After the fade-in lands: a happy little wag, pivoting from the
			// bottom-left corner — a new wag each time.
			wagT = setTimeout(() => {
				b.style.transformOrigin = '18px 100%';
				const R = (a: number, c: number) => a + Math.random() * (c - a);
				const n = Math.random() < 0.35 ? 5 : 4;
				const amp = R(3.5, 6.5);
				const dir = Math.random() < 0.5 ? -1 : 1;
				const decay = R(0.5, 0.68);
				const kf: Keyframe[] = [{ rotate: '0deg' }];
				for (let i = 0; i < n; i++) {
					kf.push({
						rotate:
							(dir * (i % 2 ? -1 : 1) * amp * Math.pow(decay, i) * R(0.85, 1.15)).toFixed(2) +
							'deg',
					});
				}
				kf.push({ rotate: '0deg' });
				b.animate(kf, {
					duration: Math.round(R(160, 200) * (n + 1) / 1.25),
					easing: 'ease-in-out',
				});
			}, 160 + Math.random() * 100);
		};

		const tick = () => {
			raf = 0;
			const m = 24;
			const el = document.querySelector(stickySelector);
			const r = el?.getBoundingClientRect();
			let nextShown: boolean;
			if (el && r && r.width > 0) {
				// Container-relative: sticky has engaged once the element has
				// separated from the top of its parent. (The case study scrolls
				// inside the sheet overlay, so a viewport comparison against the
				// sticky `top` offset would never match.)
				const cs = getComputedStyle(el);
				const pr = el.parentElement?.getBoundingClientRect() ?? r;
				nextShown = cs.position === 'sticky' && r.top - pr.top > 2;
			} else {
				// Nav absent or hidden (sub-xl viewports render it display:none,
				// where its rects are all zero) — fall back to scroll distance,
				// read from the sheet's inner scroller when there is one.
				const sp = findScrollport(el);
				nextShown = (sp ? sp.scrollTop : window.scrollY) > window.innerHeight;
			}

			let nextLeft = m;
			const a = document.querySelector(alignSelector);
			if (a) {
				const ar = (a.firstElementChild ?? a).getBoundingClientRect();
				if (ar.width > 0 && getComputedStyle(a).display !== 'none') {
					nextLeft = Math.round(ar.left);
				}
			}

			if (nextShown && !wasShown) wag();
			wasShown = nextShown;
			setShown(nextShown);
			setLeft(nextLeft);
		};

		const onScroll = () => {
			if (!raf) raf = requestAnimationFrame(tick);
		};
		// capture: scroll events from the sheet overlay's inner scroller don't
		// bubble to window; only the capture phase sees them.
		window.addEventListener('scroll', onScroll, { passive: true, capture: true });
		window.addEventListener('resize', onScroll);
		const poll = setInterval(onScroll, 1000);
		onScroll();
		return () => {
			clearTimeout(wagT);
			window.removeEventListener('scroll', onScroll, { capture: true });
			window.removeEventListener('resize', onScroll);
			clearInterval(poll);
			cancelAnimationFrame(raf);
		};
	}, [stickySelector, alignSelector]);

	const toTop = () => {
		const behavior: ScrollBehavior = reducedMotion() ? 'auto' : 'smooth';
		// The page may scroll in an inner container (sheet overlay) — send
		// both it and the window home.
		const scroller = findScrollport(document.querySelector(stickySelector));
		scroller?.scrollTo({ top: 0, behavior });
		window.scrollTo({ top: 0, behavior });
		// Lazy figures re-mounting on the way up shift layout: they cancel a
		// smooth scroll mid-flight, and scroll anchoring drags a finished
		// scroll back down. Disable anchoring for the trip and keep snapping
		// until the position holds at 0.
		if (scroller && behavior === 'smooth') {
			const sc = scroller as HTMLElement;
			const prevAnchor = sc.style.overflowAnchor;
			sc.style.overflowAnchor = 'none';
			let ticks = 0;
			let zeros = 0;
			const done = () => {
				clearInterval(iv);
				sc.style.overflowAnchor = prevAnchor;
			};
			const iv = setInterval(() => {
				const v = sc.scrollTop;
				if (v <= 1) {
					if (++zeros >= 2) done();
					return;
				}
				zeros = 0;
				// One grace tick for the smooth animation, then force the rest
				// instantly — figure mounts starve/cancel long smooth scrolls.
				if (++ticks >= 2) sc.scrollTop = 0;
			}, 400);
			setTimeout(done, 8000);
		}
	};

	// Portaled to <body>: an ancestor with a transform (the sheet overlay)
	// would otherwise become the fixed-position containing block and shift
	// the button by the sheet's offset.
	return createPortal(
		<button
			ref={btnRef}
			type="button"
			onClick={toTop}
			aria-hidden={!shown}
			tabIndex={shown ? 0 : -1}
			className="fixed bottom-[32px] z-[150] inline-flex h-[40px] items-center gap-[8px] rounded-full border-[1.25px] border-confetti-black bg-white px-[18px] text-[16px] font-medium italic leading-none text-confetti-black shadow-[0_4px_14px_rgba(57,31,0,0.10)] transition-[opacity,transform,background,color] duration-[260ms] ease-out hover:bg-confetti-black hover:text-[#fdfbf5]"
			style={{
				left,
				fontFamily: 'var(--font-kyoto)',
				opacity: shown ? 1 : 0,
				transform: `translateY(${shown ? 0 : 8}px)`,
				pointerEvents: shown ? 'auto' : 'none',
			}}
		>
			{label}{' '}
			<span aria-hidden className="text-[15px] not-italic">
				⇡
			</span>
		</button>,
		document.body,
	);
}
