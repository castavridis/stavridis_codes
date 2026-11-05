import { useEffect, useRef, useState } from 'react';

import { prefersReducedMotion } from '../../../src/features/projects/components/figures/motion';
import { findScrollport } from '../../../src/features/projects/components/figures/scrollport';

// Desktop-only sticky section nav, per the design. A white card pinned at
// 96px in the left column; mono labels with a 6px dot (red on the active
// one). For the first sections the full list shows; from "Proof of Concept"
// on it collapses to just the current item plus a caret that expands the
// rest. The card's border + shadow "peel" in like chewed gum once it sticks.
// BackToTop keys off nav[aria-label="Sections"].
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

// The list collapses to the current item once the active section reaches
// "Proof of Concept"; before that the whole list is shown.
const COLLAPSE_FROM = ITEMS.findIndex((it) => it.key === 'starting-point');
const INK = 'var(--color-confetti-black)';
const STUCK_SHADOW = '0 4px 14px rgba(57,31,0,0.10)';
const CLEAR_SHADOW = '0 4px 14px rgba(57,31,0,0)';
const GUM_TRANSITION =
	'border-color 260ms ease, background-color 260ms ease, box-shadow 260ms ease';

// ---- the gum-peel: the card strains up on invisible strands that snap one
// by one (border + shadow building in), then springs free; un-sticking plays
// a squish back down. State is keyed off the card element via a WeakMap so it
// survives React re-renders; border/shadow ride CSS vars so React's static
// style never clobbers the running animation.
type GumState = {
	raf: number;
	lift: number;
	kick: number;
	last: number;
	t0: number;
	sprung: boolean;
	done: () => void;
};
const gums = new WeakMap<HTMLElement, GumState>();

function setChrome(card: HTMLElement, border: string, shadow: string) {
	card.style.setProperty('--nav-border', border);
	card.style.setProperty('--nav-shadow', shadow);
}

function gumEnd(card: HTMLElement) {
	const g = gums.get(card);
	if (!g) return;
	cancelAnimationFrame(g.raf);
	gums.delete(card);
}

function gumPeel(card: HTMLElement, scroller: HTMLElement | null) {
	if (gums.has(card)) return;
	const n = 3 + Math.floor(Math.random() * 2);
	const strands = Array.from({ length: n }, () => ({
		snap: 34 + Math.random() * 70,
		at: 0,
	}));
	const sy0 = scroller ? scroller.scrollTop : window.scrollY;
	card.style.transition = 'none';
	const look = (lift: number, k: number) => {
		const L = Math.max(0, Math.min(1.15, lift));
		setChrome(
			card,
			`color-mix(in srgb, var(--color-confetti-black) ${Math.round(Math.min(1, L) * 100)}%, transparent)`,
			`0 ${(1 + 3 * L + 3 * k).toFixed(1)}px ${(4 + 10 * L + 8 * k).toFixed(1)}px rgba(57,31,0,${(0.1 * L + 0.04 * k).toFixed(3)})`,
		);
	};
	const done = () => {
		card.style.transition = GUM_TRANSITION;
		setChrome(card, INK, STUCK_SHADOW);
		card.style.transform = '';
		card.style.transformOrigin = '';
	};
	const g: GumState = { raf: 0, lift: 0, kick: 0, last: 0, t0: 0, sprung: false, done };
	gums.set(card, g);
	const tick = (now: number) => {
		if (gums.get(card) !== g) return;
		if (!g.t0) g.t0 = now;
		const cur = scroller ? scroller.scrollTop : window.scrollY;
		const Lp = Math.max(0, cur - sy0);
		const age = now - g.t0;
		const dt = Math.min(0.05, (now - (g.last || now)) / 1000);
		g.last = now;
		let held = 0;
		let k = 0;
		for (const s of strands) {
			if (!s.at && (Lp >= s.snap || age > 1100 + s.snap * 6 || cur < sy0 - 4)) {
				s.at = now;
				g.kick += 0.35;
			}
			if (!s.at) {
				held++;
				k = Math.max(k, Math.min(1, Lp / s.snap));
			}
		}
		const target = (n - held) / n;
		g.lift += (target + g.kick - g.lift) * (1 - Math.exp(-dt * 14));
		g.kick *= Math.exp(-dt * 9);
		look(g.lift, held ? k : 0);
		if (held) {
			card.style.transformOrigin = '50% 100%';
			card.style.transform = `translateY(${(-k * 6).toFixed(2)}px) scaleY(${(1 + k * 0.025).toFixed(4)})`;
		} else if (!g.sprung) {
			g.sprung = true;
			card.style.transform = '';
			card.animate?.(
				[
					{ transform: `translateY(${-k * 6}px)`, transformOrigin: '50% 100%' },
					{ transform: 'translateY(3px) scaleY(0.985)', transformOrigin: '50% 100%', offset: 0.45 },
					{ transform: 'translateY(-1px) scaleY(1.004)', transformOrigin: '50% 100%', offset: 0.75 },
					{ transform: 'none', transformOrigin: '50% 100%' },
				],
				{ duration: 480, easing: 'cubic-bezier(.2,.7,.3,1)' },
			);
		}
		if (!held && Math.abs(g.lift - 1) < 0.01 && g.kick < 0.01) {
			gums.delete(card);
			done();
			return;
		}
		g.raf = requestAnimationFrame(tick);
	};
	g.raf = requestAnimationFrame(tick);
}

function gumPress(card: HTMLElement) {
	gumEnd(card);
	card.style.transition = GUM_TRANSITION;
	setChrome(card, 'transparent', CLEAR_SHADOW);
	card.animate?.(
		[
			{ transform: 'scaleY(1)', transformOrigin: '50% 0' },
			{ transform: 'scaleY(0.975) scaleX(1.01)', transformOrigin: '50% 0', offset: 0.4 },
			{ transform: 'none', transformOrigin: '50% 0' },
		],
		{ duration: 320, easing: 'ease-out' },
	);
}

export function SectionNav() {
	const cardRef = useRef<HTMLDivElement>(null);
	const [active, setActive] = useState('introduction');
	const [navOpen, setNavOpen] = useState(false);
	const [stuck, setStuck] = useState(false);

	useEffect(() => {
		let raf = 0;
		let port: HTMLElement | null | undefined;
		const tick = () => {
			raf = 0;
			if (port === undefined) port = findScrollport(cardRef.current);
			const line = Math.max(0, port?.getBoundingClientRect().top ?? 0) + 145;
			let current = ITEMS[0].key;
			for (const it of ITEMS) {
				const el = document.getElementById(it.key);
				if (el && el.getBoundingClientRect().top <= line) current = it.key;
			}
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

	// Drive the gum-peel / press off the stuck transition (not on first run).
	const firstStuck = useRef(true);
	useEffect(() => {
		const card = cardRef.current;
		if (!card) return;
		if (firstStuck.current) {
			firstStuck.current = false;
			setChrome(card, stuck ? INK : 'transparent', stuck ? STUCK_SHADOW : CLEAR_SHADOW);
			return;
		}
		if (prefersReducedMotion()) {
			card.style.transition = GUM_TRANSITION;
			setChrome(card, stuck ? INK : 'transparent', stuck ? STUCK_SHADOW : CLEAR_SHADOW);
			return;
		}
		if (stuck) gumPeel(card, findScrollport(card) ?? null);
		else gumPress(card);
	}, [stuck]);

	// Stop any running gum animation on unmount.
	useEffect(() => {
		const card = cardRef.current;
		return () => {
			if (card) gumEnd(card);
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
		const el = document.getElementById(id);
		if (el) {
			el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
		}
		history.replaceState(null, '', `#${id}`);
	};

	return (
		<nav
			aria-label="Sections"
			className="pointer-events-none absolute bottom-0 left-0 top-0 z-20 hidden w-[228px] xl:block"
			style={{ contain: 'size' }}
		>
			<div
				ref={cardRef}
				className="pointer-events-auto sticky top-[96px] box-border flex flex-col rounded-[16px] px-[18px] py-[16px]"
				style={{
					background: '#fff',
					borderWidth: '1.25px',
					borderStyle: 'solid',
					borderColor: 'var(--nav-border, transparent)',
					boxShadow: 'var(--nav-shadow, 0 4px 14px rgba(57,31,0,0))',
				}}
			>
				<p
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
							href={`#${it.key}`}
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
