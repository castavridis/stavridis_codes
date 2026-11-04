import {
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';
import { createPortal } from 'react-dom';

import { useDomOrderNumber } from './dom-order';

type CitationProps = {
	title: string;
	source: string;
	href?: string;
	// Explicit dedupe key; repeats of one source share a number. Defaults to
	// href, falling back to title+source.
	citeKey?: string;
};

const reducedMotion = () =>
	!!window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

// Auto-numbered superscript source marker with a hover/focus tooltip.
// Numbered in DOM order; citations sharing a source share a number.
export default function Citation({ title, source, href, citeKey }: CitationProps) {
	const anchorRef = useRef<HTMLSpanElement>(null);
	const tipRef = useRef<HTMLSpanElement>(null);
	const closeTimer = useRef<ReturnType<typeof setTimeout>>(null);
	const outAnim = useRef<Animation>(null);
	const [open, setOpen] = useState(false);
	const [placed, setPlaced] = useState(false);
	const [pos, setPos] = useState({ x: 0, y: 0 });

	const key = citeKey || href || `${title}|${source}`;
	const { n } = useDomOrderNumber(anchorRef, 'data-cite', true);

	// A happy little wag while it fades in, pivoting on the citation link —
	// new amplitude, count and damping each time.
	const popIn = useCallback((t: HTMLElement) => {
		if (!t.animate) return;
		const still = reducedMotion();
		t.animate(
			still
				? [{ opacity: 0 }, { opacity: 1 }]
				: [
						{ opacity: 0, transform: 'scale(0.9)' },
						{ opacity: 1, transform: 'scale(1)' },
					],
			{ duration: still ? 120 : 220, easing: 'cubic-bezier(.2,.8,.2,1)' },
		);
		if (still) return;
		const R = (a: number, b: number) => a + Math.random() * (b - a);
		const count = Math.random() < 0.35 ? 5 : 4;
		const amp = R(2.5, 4.5);
		const dir = Math.random() < 0.5 ? -1 : 1;
		const decay = R(0.5, 0.68);
		const kf: Keyframe[] = [{ rotate: '0deg' }];
		for (let i = 0; i < count; i++) {
			kf.push({
				rotate:
					(dir * (i % 2 ? -1 : 1) * amp * Math.pow(decay, i) * R(0.85, 1.15)).toFixed(2) +
					'deg',
			});
		}
		kf.push({ rotate: '0deg' });
		t.animate(kf, {
			duration: Math.round(R(160, 200) * (count + 1) / 1.25),
			easing: 'ease-in-out',
		});
	}, []);

	const place = useCallback(() => {
		const a = anchorRef.current;
		const t = tipRef.current;
		if (!a || !t) return;
		const r = a.getBoundingClientRect();
		const w = t.offsetWidth;
		const h = t.offsetHeight;
		const m = 16;
		const gap = 10;
		let x = r.left + r.width / 2 - w / 2;
		x = Math.max(m, Math.min(x, window.innerWidth - m - w));
		let y = r.top - gap - h;
		if (y < m) y = Math.min(r.bottom + gap, window.innerHeight - m - h);
		setPos((prev) =>
			Math.abs(x - prev.x) > 0.5 || Math.abs(y - prev.y) > 0.5 ? { x, y } : prev,
		);
		return { x, y };
	}, []);

	// First placement once the tooltip exists: grows and wags from the link.
	useEffect(() => {
		if (!open || placed) return;
		const a = anchorRef.current;
		const t = tipRef.current;
		if (!a || !t) return;
		const at = place();
		if (!at) return;
		const link = a.querySelector('a');
		const lr = (link ?? a).getBoundingClientRect();
		t.style.transformOrigin = `${(lr.left + lr.width / 2 - at.x).toFixed(1)}px ${(lr.top + lr.height / 2 - at.y).toFixed(1)}px`;
		setPlaced(true);
		popIn(t);
	}, [open, placed, place, popIn]);

	// Track the anchor while open.
	useEffect(() => {
		if (!open) return;
		const onMove = () => place();
		window.addEventListener('scroll', onMove, true);
		window.addEventListener('resize', onMove);
		return () => {
			window.removeEventListener('scroll', onMove, true);
			window.removeEventListener('resize', onMove);
		};
	}, [open, place]);

	useEffect(
		() => () => {
			if (closeTimer.current) clearTimeout(closeTimer.current);
		},
		[],
	);

	const show = () => {
		if (closeTimer.current) clearTimeout(closeTimer.current);
		if (outAnim.current) {
			// Pointer came back mid-fade: keep it open.
			outAnim.current.cancel();
			outAnim.current = null;
		}
		if (!open) {
			setPlaced(false);
			setOpen(true);
		}
	};

	const fadeOut = () => {
		const t = tipRef.current;
		const done = () => {
			outAnim.current = null;
			setOpen(false);
			setPlaced(false);
		};
		if (!t || !t.animate || !placed) return done();
		const still = reducedMotion();
		outAnim.current?.cancel();
		// Shrinks a little back toward where it came from as it fades.
		const anim = t.animate(
			still
				? [{ opacity: 1 }, { opacity: 0 }]
				: [
						{ opacity: 1, transform: 'translateY(0) rotate(0deg) scale(1)' },
						{
							opacity: 0,
							transform: `translateY(14px) rotate(${Math.random() < 0.5 ? -1.5 : 1.5}deg) scale(0.97)`,
						},
					],
			{ duration: still ? 120 : 280, easing: 'cubic-bezier(.5,0,.75,.4)', fill: 'forwards' },
		);
		outAnim.current = anim;
		anim.onfinish = () => {
			if (outAnim.current === anim) done();
		};
	};

	const scheduleClose = () => {
		if (closeTimer.current) clearTimeout(closeTimer.current);
		closeTimer.current = setTimeout(fadeOut, 150);
	};

	return (
		<span
			ref={anchorRef}
			data-cite={key}
			onMouseEnter={show}
			onMouseLeave={scheduleClose}
			className="pointer-events-auto relative -top-[0.55em] ml-px inline-block align-baseline leading-none"
		>
			<a
				href={href || '#'}
				target={href ? '_blank' : undefined}
				rel="noopener"
				aria-label={`Source ${n}: ${title}`}
				onFocus={show}
				onBlur={scheduleClose}
				onClick={(e) => {
					if (!href) e.preventDefault();
				}}
				className="relative inline-block cursor-pointer px-px text-[0.6em] font-bold text-[#d18f00] no-underline [font-variant-numeric:tabular-nums] hover:text-[#a86a00]"
				style={{ fontFamily: 'var(--font-body)' }}
			>
				{n}
				{/* Generous hit area around the tiny superscript */}
				<span
					aria-hidden
					className="absolute left-1/2 top-1/2 h-[44px] w-[max(22px,100%)] -translate-x-1/2 -translate-y-1/2"
				/>
			</a>
			{open
				? createPortal(
						<span
							role="tooltip"
							ref={tipRef}
							onMouseEnter={show}
							onMouseLeave={scheduleClose}
							className="fixed z-[200] box-border flex w-[min(380px,calc(100vw-32px))] flex-col gap-[14px] rounded-[12px] bg-[#fffbf0] px-[24px] pb-[26px] pt-[22px] text-left align-baseline font-normal not-italic tracking-normal whitespace-normal text-confetti-black shadow-[0_10px_30px_rgba(57,31,0,0.12),0_1px_3px_rgba(57,31,0,0.08)]"
							style={{
								left: pos.x,
								top: pos.y,
								visibility: placed ? 'visible' : 'hidden',
							}}
						>
							<span
								className="flex items-center gap-[10px] pb-[12px]"
								style={{
									borderBottom:
										'1.25px solid color-mix(in srgb, #e3af08 35%, transparent)',
								}}
							>
								<span
									className="inline-flex size-[22px] flex-none items-center justify-center rounded-full bg-[#d18f00] text-[12px] font-bold leading-none text-white [font-variant-numeric:tabular-nums]"
									style={{ fontFamily: 'var(--font-body)' }}
								>
									{n}
								</span>
								<span
									className="min-w-0 flex-auto text-[18px] font-medium italic leading-[22px] whitespace-normal"
									style={{ fontFamily: 'var(--font-kyoto)' }}
								>
									{title}
								</span>
							</span>
							<span
								className="text-[16px] leading-[21px] [text-wrap:pretty]"
								style={{ fontFamily: 'var(--font-kyoto)' }}
							>
								{source}
							</span>
						</span>,
						document.body,
					)
				: null}
		</span>
	);
}
