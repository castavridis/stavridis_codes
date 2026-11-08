import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import Button from '../../../src/components/Button';

import { CITATIONS } from './citations';
import { Citation } from './shared';

// The Assumptions dialog: every figure's round "i" button opens it. Opened
// via a window event so figure components (some lazy-mounted) don't need a
// shared context.
const OPEN_EVT = 'cs-assumptions-open';

export function openAssumptions() {
	window.dispatchEvent(new Event(OPEN_EVT));
}

// Broadcast while the dialog is up so figures can hold their simulations
// behind it (dc holdFx). detail: true on open, false on close.
export const ASSUMPTIONS_STATE_EVT = 'cs-assumptions-state';

const EYEBROW =
	'text-[12px] leading-[16px] tracking-[0.04em] text-confetti-black/75';

function Group({ label, items }: { label: string; items: React.ReactNode[] }) {
	return (
		<div className="flex flex-col gap-[14px]">
			<span className={EYEBROW} style={{ fontFamily: 'var(--font-mono)' }}>
				{label}
			</span>
			<ul className="m-0 flex flex-col gap-[8px] pl-[18px] text-[16px] leading-[24px] [text-wrap:pretty]">
				{items.map((item, i) => (
					<li key={i}>{item}</li>
				))}
			</ul>
		</div>
	);
}

export function AssumptionsModal() {
	const [open, setOpen] = useState(false);
	const closeRef = useRef<HTMLDivElement>(null);
	const returnFocus = useRef<HTMLElement>(null);

	useEffect(() => {
		const onOpen = () => {
			returnFocus.current =
				document.activeElement instanceof HTMLElement
					? document.activeElement
					: null;
			setOpen(true);
		};
		window.addEventListener(OPEN_EVT, onOpen);
		return () => window.removeEventListener(OPEN_EVT, onOpen);
	}, []);

	useEffect(() => {
		window.dispatchEvent(new CustomEvent(ASSUMPTIONS_STATE_EVT, { detail: open }));
	}, [open]);

	useEffect(() => {
		if (!open) return;
		// Capture + stop: the sheet overlay also closes on Escape (on window),
		// so without this one press closed the modal AND the case study.
		const onKey = (e: KeyboardEvent) => {
			if (e.key !== 'Escape') return;
			e.stopImmediatePropagation();
			setOpen(false);
		};
		window.addEventListener('keydown', onKey, true);
		closeRef.current?.querySelector('button')?.focus();
		return () => {
			window.removeEventListener('keydown', onKey, true);
			returnFocus.current?.focus();
		};
	}, [open]);

	if (!open) return null;

	// Portaled to <body>: the sheet overlay's transform would otherwise make
	// the sheet the fixed-position containing block, confining the backdrop
	// to the sheet box and clipping the panel.
	return createPortal(
		<div
			role="dialog"
			aria-modal="true"
			aria-label="Assumptions"
			onClick={() => setOpen(false)}
			className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-[8px] text-confetti-black min-[600px]:p-[24px]"
			style={{
				background:
					'color-mix(in srgb, var(--color-confetti-black) 25%, transparent)',
				fontFamily: 'var(--font-body)',
			}}
		>
			<div
				onClick={(e) => e.stopPropagation()}
				// Phones: 8px from the screen edge, 20px inside; the header
				// sticks so Close stays in reach while the list scrolls.
				className="box-border max-h-[calc(100dvh-16px)] w-full max-w-[944px] overflow-auto overscroll-contain rounded-[16px] bg-white px-[20px] pb-[24px] min-[600px]:max-h-[calc(100dvh-48px)] min-[600px]:px-[40px] min-[600px]:pb-[40px] shadow-[0_20px_25px_-5px_rgb(0_0_0_/_0.1),0_8px_10px_-6px_rgb(0_0_0_/_0.1)]"
			>
				<div className="flex flex-col gap-[32px]">
					<div
						ref={closeRef}
						className="sticky top-0 z-[1] -mb-[12px] flex items-center justify-between gap-[16px] bg-white pt-[20px] pb-[12px] min-[600px]:pt-[40px]"
					>
						<h2
							className="m-0 text-[28px] font-normal leading-[1.1] min-[600px]:text-[32px]"
							style={{ fontFamily: 'var(--font-kyoto)' }}
						>
							Assumptions
						</h2>
						<Button
							variant="outline"
							label="Close"
							className="min-h-[44px]"
							onClick={() => setOpen(false)}
						/>
					</div>
					<div className="grid gap-x-[56px] gap-y-[40px] [grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))]">
						<Group
							label="His day"
							items={[
								'9 am to 5 pm, with lunch from 12:30 to 1:30. Seven working hours.',
								'A connected call takes 20–30 minutes.',
								'An unanswered call takes about 2 minutes; 30 seconds between calls.',
								'He won’t start a call that would run into lunch or past 5 pm.',
							]}
						/>
						<Group
							label="Before"
							items={[
								'100 patients, no status until someone picks up.',
								'Calls connect 35% of the time.',
								'Of those who pick up: 5% need care, 20% to watch, 75% doing fine.',
								'An unanswered call leaves the patient unknown (black).',
							]}
						/>
						<Group
							label="After · An average day post-adoption"
							items={[
								<>
									1,600 patients, each sent a check-in every two weeks,
									staggered so a share go out every weekday. About 80% reply
									(CareSignal’s reported weekly engagement
									<Citation {...CITATIONS.engagement} />
									); the other 20% stay unknown.
								</>,
								'Of those who reply: 80 red, 320 yellow, the rest green. Reds are worked down day by day, so on an average day only a couple are left open from earlier in the week.',
								'New reds come from alerts — patients whose status changed since they last replied. Alerts: 1.5% of patients a week over a 5-day week, about 5 a day; 40% are waiting at 9 am.',
								'Alerts connect 85% of the time; reds and yellows 55–75%, since they know who’s calling and why. Order: alerts, open reds, then yellows. An unanswered patient goes to the back of their line.',
								'A yellow check-in is shorter, about 10–14 minutes; a connected yellow becomes green and stays green until their next check-in.',
							]}
						/>
					</div>
				</div>
			</div>
		</div>,
		document.body,
	);
}
