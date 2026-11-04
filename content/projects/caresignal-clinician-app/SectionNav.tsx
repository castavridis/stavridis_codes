import { useEffect, useRef, useState } from 'react';

import { findScrollport } from '../../../src/features/projects/components/figures/scrollport';

// Desktop-only sticky section nav, per the reference: a card pinned at
// 96px in the left column, mono labels with a 6px dot, the active section
// highlighted on scroll. Collapsed it shows the first four sections; the
// caret ("Show all sections") expands the rest, and scrolling into a hidden
// section expands it too. BackToTop keys off nav[aria-label="Sections"].
const ITEMS = [
	{ key: 'introduction', label: 'Impact' },
	{ key: 'contribution', label: 'Contribution' },
	{ key: 'background', label: 'Background' },
	{ key: 'opportunity', label: 'Opportunity' },
	{ key: 'starting-point', label: 'Proof of Concept' },
	{ key: 'product-market-fit', label: 'Product-Market Fit' },
	{ key: 'scaling-care-teams', label: 'Scaling Care Teams' },
	{ key: 'outcomes', label: 'Outcomes' },
	{ key: 'conclusion', label: 'Key Learnings' },
	{ key: 'team-and-tools', label: 'Team and Tools' },
];

const COLLAPSED_COUNT = 4;
const INK = 'var(--color-confetti-black)';

export function SectionNav() {
	const cardRef = useRef<HTMLDivElement>(null);
	const [active, setActive] = useState('introduction');
	const [open, setOpen] = useState(false);
	const [stuck, setStuck] = useState(false);

	useEffect(() => {
		let raf = 0;
		const tick = () => {
			raf = 0;
			// Active = the last section whose anchor is above the reading line.
			// The line sits 145px into the scrollport (anchors land at 132 via
			// scroll-margin-top); the scrollport is the sheet's inner scroller,
			// not the viewport, so offset by its top.
			const sp = findScrollport(cardRef.current);
			const line = Math.max(0, sp?.getBoundingClientRect().top ?? 0) + 145;
			let current = ITEMS[0].key;
			for (const it of ITEMS) {
				const el = document.getElementById(it.key);
				if (el && el.getBoundingClientRect().top <= line) current = it.key;
			}
			setActive(current);
			const card = cardRef.current;
			if (card) {
				// Container-relative: the card has separated from the top of its
				// (absolutely positioned) nav column once sticky engages. The
				// page scrolls inside the sheet overlay, so viewport offsets
				// can't be compared against the sticky `top` value directly.
				const r = card.getBoundingClientRect();
				const pr = card.parentElement?.getBoundingClientRect();
				setStuck(!!pr && r.top - pr.top > 2);
			}
		};
		const onScroll = () => {
			if (!raf) raf = requestAnimationFrame(tick);
		};
		// capture: the case study scrolls inside the sheet overlay, and scroll
		// events don't bubble — only the capture phase sees them on window.
		window.addEventListener('scroll', onScroll, { passive: true, capture: true });
		window.addEventListener('resize', onScroll);
		onScroll();
		return () => {
			window.removeEventListener('scroll', onScroll, { capture: true });
			window.removeEventListener('resize', onScroll);
			cancelAnimationFrame(raf);
		};
	}, []);

	const activeIndex = ITEMS.findIndex((it) => it.key === active);
	const expanded = open || activeIndex >= COLLAPSED_COUNT;

	return (
		<nav
			aria-label="Sections"
			className="pointer-events-none absolute bottom-0 left-0 top-0 z-20 hidden w-[228px] xl:block"
			style={{ contain: 'size' }}
		>
			<div
				ref={cardRef}
				className="pointer-events-auto sticky top-[96px] box-border flex flex-col rounded-[16px] px-[18px] py-[16px] transition-[border-color,background-color,box-shadow] duration-[260ms]"
				style={{
					border: `1.25px solid ${stuck ? 'color-mix(in srgb, var(--color-confetti-black) 15%, transparent)' : 'transparent'}`,
					background: stuck ? 'var(--color-washes-paper, #fbf6ea)' : 'transparent',
					boxShadow: stuck ? '0 10px 30px rgba(57,31,0,0.08)' : 'none',
					position: 'sticky',
				}}
			>
				<p
					className="m-0 mb-[12px] text-[15px] font-bold italic leading-[20px] text-confetti-black/65"
					style={{ fontFamily: 'var(--font-kyoto)' }}
				>
					section
				</p>
				{ITEMS.map((it, i) => {
					const hidden = !expanded && i >= COLLAPSED_COUNT;
					const isActive = it.key === active;
					return (
						<a
							key={it.key}
							href={`#${it.key}`}
							aria-current={isActive ? 'true' : undefined}
							aria-hidden={hidden || undefined}
							tabIndex={hidden ? -1 : 0}
							onClick={(e) => {
								const el = document.getElementById(it.key);
								if (!el) return;
								e.preventDefault();
								el.scrollIntoView({
									behavior: matchMedia('(prefers-reduced-motion: reduce)')
										.matches
										? 'auto'
										: 'smooth',
								});
								history.replaceState(null, '', `#${it.key}`);
							}}
							className="box-content flex items-center gap-[10px] overflow-hidden text-[14px] font-bold leading-[20px] tracking-[0.02em] no-underline transition-[color,height,padding] duration-200 hover:text-confetti-black"
							style={{
								fontFamily: 'var(--font-mono)',
								height: hidden ? 0 : 24,
								paddingTop: hidden ? 0 : 12,
								color: isActive
									? INK
									: 'color-mix(in srgb, var(--color-confetti-black) 55%, transparent)',
							}}
						>
							<span
								aria-hidden
								className="size-[6px] flex-none rounded-full transition-colors duration-200"
								style={{
									background: isActive
										? INK
										: 'color-mix(in srgb, var(--color-confetti-black) 25%, transparent)',
								}}
							/>
							<span className="min-w-0 flex-1 whitespace-nowrap">
								{it.label}
							</span>
						</a>
					);
				})}
				<button
					type="button"
					onClick={() => setOpen((v) => !v)}
					aria-expanded={expanded}
					aria-label="Show all sections"
					className="absolute right-[12px] top-[16px] flex size-[24px] cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-confetti-black"
					style={{
						opacity: activeIndex >= COLLAPSED_COUNT ? 0 : 1,
						pointerEvents: activeIndex >= COLLAPSED_COUNT ? 'none' : 'auto',
					}}
				>
					<span
						aria-hidden
						className="block size-[7px] border-b-[1.5px] border-r-[1.5px] border-current transition-transform duration-[260ms]"
						style={{
							transform: expanded
								? 'rotate(-135deg) translate(-1px,-1px)'
								: 'rotate(45deg)',
							transitionTimingFunction: 'cubic-bezier(.3,1.6,.5,1)',
						}}
					/>
				</button>
			</div>
		</nav>
	);
}
