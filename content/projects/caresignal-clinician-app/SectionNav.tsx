import { useEffect, useRef, useState } from 'react';

import * as gum from '../../../src/features/projects/components/nav-gum';
import { prefersReducedMotion } from '../../../src/features/projects/components/figures/motion';
import { findScrollport } from '../../../src/features/projects/components/figures/scrollport';

// Desktop-only sticky section nav, per the design. A white card pinned at
// 96px in the left column; mono labels with a 6px dot (red on the active
// one). For the first sections the full list shows; from "Proof of Concept"
// on it collapses to just the current item plus a caret that expands the
// rest. The card's border + shadow "peel" in like chewed gum once it sticks.
// BackToTop keys off nav[aria-label="Sections"].
export const ITEMS = [
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

// The list collapses to the current item once the active section reaches
// "Proof of Concept"; before that the whole list is shown.
const COLLAPSE_FROM = ITEMS.findIndex((it) => it.key === 'starting-point');
const INK = 'var(--color-confetti-black)';

// The current section: the last one whose top has passed 40% down the
// visible scroll area (dc onSecScan: scrollY + innerHeight × 0.4). Shared
// with the phone/tablet SectionMenu.
export function activeSection(port: HTMLElement | null | undefined): string {
	const pr = port?.getBoundingClientRect();
	const visTop = Math.max(0, pr?.top ?? 0);
	const visBottom = Math.min(window.innerHeight, pr?.bottom ?? window.innerHeight);
	const line = visTop + (visBottom - visTop) * 0.4;
	let current = ITEMS[0].key;
	for (const it of ITEMS) {
		const el = document.getElementById(it.key);
		if (el && el.getBoundingClientRect().top <= line) current = it.key;
	}
	return current;
}

// Scroll to a section ("Impact" is the top of the page, dc href '#') and
// mirror it in the URL hash. `from` is any element inside the scrollport.
export function goToSection(id: string, from: Element | null) {
	const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
	if (id === ITEMS[0].key) {
		const port = findScrollport(from);
		(port ?? window).scrollTo({ top: 0, behavior });
		history.replaceState(null, '', location.pathname + location.search);
		return;
	}
	const el = document.getElementById(id);
	if (el) el.scrollIntoView({ behavior });
	history.replaceState(null, '', `#${id}`);
}
// The card's left padding + border. The card hangs this far left of the nav
// column so its text (the "section" eyebrow, the dots) sits on the content
// column's left edge, while the card's border — visible once it peels —
// lines up with BackToTop's pill, which tracks the card's left edge.
const CARD_INSET = 18 + 1.25;

export function SectionNav() {
	const cardRef = useRef<HTMLDivElement>(null);
	const [active, setActive] = useState('introduction');
	const [navOpen, setNavOpen] = useState(false);
	const [stuck, setStuck] = useState(false);
	const stuckRef = useRef(false);
	stuckRef.current = stuck;

	useEffect(() => {
		let raf = 0;
		let port: HTMLElement | null | undefined;
		const tick = () => {
			raf = 0;
			if (port === undefined) port = findScrollport(cardRef.current);
			const current = activeSection(port);
			setActive(current);
			// Leaving the collapse range resets the expanded state.
			if (ITEMS.findIndex((it) => it.key === current) < COLLAPSE_FROM) {
				setNavOpen((o) => (o ? false : o));
			}
			const card = cardRef.current;
			if (card) {
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
		const onResize = () => {
			port = undefined;
			onScroll();
		};
		window.addEventListener('resize', onResize);
		onScroll();
		return () => {
			window.removeEventListener('scroll', onScroll, { capture: true });
			window.removeEventListener('resize', onResize);
			cancelAnimationFrame(raf);
		};
	}, []);

	// Expanding the list before the card has stuck still draws its border +
	// shadow, so the open list reads as a card (dc navCard: stuck || open).
	useEffect(() => {
		const card = cardRef.current;
		if (!card || stuck) return;
		gum.set(card, navOpen, { animate: true });
	}, [navOpen, stuck]);

	// A pointer down anywhere outside the nav closes the expanded list.
	useEffect(() => {
		if (!navOpen) return;
		const onDown = (e: PointerEvent) => {
			const t = e.target as Element | null;
			if (!t?.closest?.('nav[aria-label="Sections"]')) setNavOpen(false);
		};
		document.addEventListener('pointerdown', onDown);
		return () => document.removeEventListener('pointerdown', onDown);
	}, [navOpen]);

	// dc alignNav(): while resting, not stuck, sit the "section" eyebrow on
	// the Background heading's baseline. (Horizontal alignment is static —
	// see CARD_INSET.) Re-run on resize and as fonts and the hero settle.
	useEffect(() => {
		const align = () => {
			const card = cardRef.current;
			const nav = card?.parentElement;
			if (!card || !nav || getComputedStyle(nav).display === 'none') return;
			const eb = card.querySelector<HTMLElement>('[data-nav-eb]');
			const bh = document.getElementById('background');
			if (!eb || !bh || stuckRef.current) return;
			const base = (el: HTMLElement) => {
				const probe = document.createElement('span');
				probe.style.cssText =
					'display:inline-block;width:0;height:0;vertical-align:baseline';
				el.appendChild(probe);
				const y = probe.getBoundingClientRect().top;
				probe.remove();
				return y;
			};
			const d = base(bh) - base(eb);
			if (Math.abs(d) > 0.5 && Math.abs(d) < 200) {
				card.style.marginTop = `${((parseFloat(card.style.marginTop) || 0) + d).toFixed(1)}px`;
			}
		};
		let raf = 0;
		const onAlign = () => {
			cancelAnimationFrame(raf);
			raf = requestAnimationFrame(align);
		};
		window.addEventListener('resize', onAlign);
		const timers = [0, 300, 1200].map((d) => window.setTimeout(onAlign, d));
		document.fonts?.ready.then(onAlign).catch(() => {});
		return () => {
			window.removeEventListener('resize', onAlign);
			timers.forEach(clearTimeout);
			cancelAnimationFrame(raf);
		};
	}, []);

	// Drive the gum-peel / press off the stuck transition (not on first run).
	const firstStuck = useRef(true);
	useEffect(() => {
		const card = cardRef.current;
		if (!card) return;
		if (firstStuck.current) {
			firstStuck.current = false;
			gum.set(card, stuck);
			return;
		}
		if (prefersReducedMotion()) {
			gum.set(card, stuck, { animate: true });
			return;
		}
		if (stuck) gum.peel(card, findScrollport(card) ?? null);
		else gum.press(card);
	}, [stuck]);

	// Stop any running gum animation on unmount.
	useEffect(() => {
		const card = cardRef.current;
		return () => {
			if (card) gum.end(card);
		};
	}, []);

	const activeIndex = ITEMS.findIndex((it) => it.key === active);
	const collapsed = activeIndex >= COLLAPSE_FROM;
	const open = collapsed && navOpen;
	const shut = collapsed && !navOpen;

	const onItemClick = (
		e: React.MouseEvent,
		id: string,
		isActive: boolean,
	) => {
		e.preventDefault();
		// In collapsed mode the current item is the caret: it toggles the list.
		if (collapsed && isActive) {
			setNavOpen((o) => !o);
			return;
		}
		if (navOpen) setNavOpen(false);
		goToSection(id, cardRef.current);
	};

	return (
		<nav
			aria-label="Sections"
			// The design's left grid column: minmax(140px, 1fr) beside the 704px
			// reading column with a 48px gap, shown from 1100px wide.
			className="pointer-events-none absolute bottom-0 left-0 top-0 z-20 hidden min-[1100px]:block"
			style={{ contain: 'size', width: 'max(140px, calc(100% - 704px - 48px))' }}
		>
			<div
				ref={cardRef}
				className="pointer-events-auto sticky top-[96px] box-border flex flex-col rounded-[16px] px-[18px] py-[16px]"
				style={{
					width: `calc(100% + ${CARD_INSET}px)`,
					// Never narrower than its longest label: at narrow desktop
					// widths the nav column is tighter than "Scaling Care Teams",
					// and the links' overflow-hidden would clip it. The card grows
					// into the 48px gutter instead.
					minWidth: 'max-content',
					marginLeft: -CARD_INSET,
					marginTop: -29,
					background: '#fff',
					borderWidth: '1.25px',
					borderStyle: 'solid',
					borderColor: 'var(--nav-border, transparent)',
					boxShadow: 'var(--nav-shadow, 0 4px 14px rgba(57,31,0,0))',
				}}
			>
				<p
					data-nav-eb=""
					className="m-0 mb-[12px] text-[15px] font-bold italic leading-[20px] text-confetti-black/65"
					style={{ fontFamily: 'var(--font-kyoto)' }}
				>
					section
				</p>
				{ITEMS.map((it, i) => {
					const isActive = it.key === active;
					const hide = shut && !isActive;
					const isFirstVisible = shut ? isActive : i === 0;
					return (
						<a
							key={it.key}
							href={i === 0 ? '#' : `#${it.key}`}
							aria-current={isActive ? 'true' : undefined}
							aria-hidden={hide || undefined}
							tabIndex={hide ? -1 : 0}
							onClick={(e) => onItemClick(e, it.key, isActive)}
							className="box-content flex items-center gap-[10px] overflow-hidden text-[14px] font-bold leading-[20px] tracking-[0.02em] no-underline transition-[color,height,padding] duration-200 hover:text-confetti-black"
							style={{
								fontFamily: 'var(--font-mono)',
								height: hide ? 0 : 24,
								paddingTop: hide || isFirstVisible ? 0 : 12,
								color: isActive
									? INK
									: 'color-mix(in srgb, var(--color-confetti-black) 65%, transparent)',
							}}
						>
							<span
								aria-hidden
								className="size-[6px] flex-none rounded-full transition-colors duration-200"
								style={{ background: isActive ? '#e5562e' : 'transparent' }}
							/>
							<span className="min-w-0 flex-1 whitespace-nowrap">
								{it.label}
							</span>
						</a>
					);
				})}
				<button
					type="button"
					onClick={() => setNavOpen((v) => !v)}
					aria-expanded={open}
					aria-hidden={collapsed ? undefined : true}
					tabIndex={collapsed ? 0 : -1}
					aria-label="Show all sections"
					className="absolute right-[12px] top-[16px] flex size-[24px] cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-confetti-black transition-opacity duration-200"
					style={{
						opacity: collapsed ? 1 : 0,
						pointerEvents: collapsed ? 'auto' : 'none',
					}}
				>
					<span
						aria-hidden
						className="block size-[7px] border-b-[1.5px] border-r-[1.5px] border-current"
						style={{
							transform: open
								? 'translateY(2px) rotate(-135deg)'
								: 'translateY(-2px) rotate(45deg)',
							transition: 'transform 260ms cubic-bezier(.3,1.6,.5,1)',
						}}
					/>
				</button>
			</div>
		</nav>
	);
}
