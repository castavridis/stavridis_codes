import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { useMediaQuery, WIDE_NAV_PX } from '../../../src/features/projects/components/figures/breakpoints';
import { findScrollport } from '../../../src/features/projects/components/figures/scrollport';
import { activeSection, goToSection, ITEMS } from './SectionNav';

// Phones and tablets have no side nav (it shows from 1100px, as in the
// design), so the sticky chrome's title becomes the section menu: tap it to
// open a list of sections. Not in the design — added for the ~21,000px page.
// The button renders into MDXLayout's chrome slot; the list is portalled to
// <body> as a fixed panel (the chrome row clips, and the sheet's transform
// would otherwise capture position: fixed).
const TITLE = 'CareSignal Clinician Application: Scaling Care Teams';
const RED = '#e5562e';

export function SectionMenu() {
	const show = useMediaQuery(`(max-width: ${WIDE_NAV_PX - 0.02}px)`);
	const probeRef = useRef<HTMLSpanElement>(null);
	const btnRef = useRef<HTMLButtonElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);
	const [slot, setSlot] = useState<Element | null>(null);
	const [active, setActive] = useState(ITEMS[0].key);
	const [open, setOpen] = useState(false);
	const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
	const listId = useId();

	// Find this case study's chrome slot (MDXLayout renders it before the
	// MDX children, so it's there by the time this mounts).
	useLayoutEffect(() => {
		setSlot(probeRef.current?.closest('[data-case]')?.querySelector('[data-chrome-slot]') ?? null);
	}, []);

	// Scroll position of the page when the list opened; scrolling the page
	// more than 24px from there closes it (other elements' scroll events, or
	// a nudge while tapping, don't).
	const openY = useRef(0);
	const portRef = useRef<HTMLElement | null>(null);
	const pageY = () => portRef.current?.scrollTop ?? window.scrollY;

	// Track the current section, and close the open list on a real scroll.
	useEffect(() => {
		if (!show) return;
		let raf = 0;
		portRef.current = findScrollport(probeRef.current);
		const tick = () => {
			raf = 0;
			if (!portRef.current) portRef.current = findScrollport(probeRef.current);
			setActive(activeSection(portRef.current));
			if (Math.abs(pageY() - openY.current) > 24) setOpen(false);
		};
		const onScroll = () => {
			if (!raf) raf = requestAnimationFrame(tick);
		};
		window.addEventListener('scroll', onScroll, { passive: true, capture: true });
		tick();
		return () => {
			window.removeEventListener('scroll', onScroll, { capture: true });
			cancelAnimationFrame(raf);
		};
	}, [show]);

	// While open: place the panel under the button, close on outside tap,
	// Escape (without letting it reach the sheet, which would close the case
	// study) or resize.
	useLayoutEffect(() => {
		if (!open) return;
		const place = () => {
			const r = btnRef.current?.getBoundingClientRect();
			if (r) setPos({ top: Math.round(r.bottom + 8), left: Math.round(Math.max(16, r.left - 12)) });
		};
		place();
		const onDown = (e: PointerEvent) => {
			const t = e.target as Node;
			if (!panelRef.current?.contains(t) && !btnRef.current?.contains(t)) setOpen(false);
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key !== 'Escape') return;
			e.stopImmediatePropagation();
			setOpen(false);
			btnRef.current?.focus();
		};
		const onResize = () => setOpen(false);
		document.addEventListener('pointerdown', onDown, true);
		window.addEventListener('keydown', onKey, true);
		window.addEventListener('resize', onResize);
		return () => {
			document.removeEventListener('pointerdown', onDown, true);
			window.removeEventListener('keydown', onKey, true);
			window.removeEventListener('resize', onResize);
		};
	}, [open]);

	useEffect(() => {
		if (!show) setOpen(false);
	}, [show]);

	const label = ITEMS.find((it) => it.key === active)?.label ?? '';

	const button = (
		<button
			ref={btnRef}
			type="button"
			aria-expanded={open}
			aria-controls={listId}
			aria-label={`Sections. Current: ${label}`}
			onClick={() => {
				openY.current = pageY();
				setOpen((o) => !o);
			}}
			className="flex min-h-[44px] w-full min-w-0 cursor-pointer flex-col items-start justify-center gap-[2px] border-0 bg-transparent p-0 text-left text-confetti-black"
		>
			<span
				className="block w-full truncate"
				style={{ fontFamily: 'var(--font-kyoto)', fontWeight: 500, fontSize: 16, lineHeight: '22px' }}
			>
				{TITLE}
			</span>
			<span
				className="flex max-w-full items-center gap-[8px] text-[12px] font-bold leading-[16px] tracking-[0.02em]"
				style={{ fontFamily: 'var(--font-mono)' }}
			>
				<span aria-hidden className="inline-block size-[6px] flex-none rounded-full" style={{ background: RED }} />
				<span className="truncate">{label}</span>
				<svg
					aria-hidden
					width="10"
					height="6"
					viewBox="0 0 10 6"
					className="flex-none transition-transform duration-200"
					style={{ transform: open ? 'rotate(180deg)' : undefined }}
				>
					<path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
				</svg>
			</span>
		</button>
	);

	const panel =
		open && pos ? (
			<div
				ref={panelRef}
				className="fixed z-[var(--z-floating)] box-border overflow-y-auto rounded-[12px] border-[1.25px] border-confetti-black bg-white p-[6px] shadow-[0_8px_24px_rgba(57,31,0,0.12)]"
				style={{
					top: pos.top,
					left: pos.left,
					width: 'min(320px, calc(100vw - 32px))',
					maxHeight: `calc(100dvh - ${pos.top + 16}px)`,
				}}
			>
				<nav aria-label="Jump to section">
					<ul id={listId} className="m-0 flex list-none flex-col p-0">
						{ITEMS.map((it) => {
							const on = it.key === active;
							return (
								<li key={it.key}>
									<a
										href={`#${it.key}`}
										aria-current={on ? 'location' : undefined}
										onClick={(e) => {
											e.preventDefault();
											setOpen(false);
											goToSection(it.key, probeRef.current);
										}}
										className="no-underline flex min-h-[44px] items-center gap-[10px] rounded-[8px] px-[12px] text-[14px] font-bold leading-[20px] tracking-[0.02em] text-confetti-black hover:bg-confetti-black/5"
										style={{ fontFamily: 'var(--font-mono)' }}
									>
										<span
											aria-hidden
											className="inline-block size-[6px] flex-none rounded-full"
											style={{ background: on ? RED : 'color-mix(in srgb, var(--color-confetti-black) 25%, transparent)' }}
										/>
										{it.label}
									</a>
								</li>
							);
						})}
					</ul>
				</nav>
			</div>
		) : null;

	return (
		<>
			<span ref={probeRef} hidden />
			{show && slot ? createPortal(button, slot) : null}
			{panel ? createPortal(panel, document.body) : null}
		</>
	);
}
