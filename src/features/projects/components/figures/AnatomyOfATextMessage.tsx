import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type ReactNode,
} from 'react';

import Text from '../../../../components/Text';
import Figure from './Figure';
import { prefersReducedMotion } from './motion';

// "Anatomy of a text message" — one SMS check-in annotated with the six
// decisions behind it. Hovering or pinning a numbered marker (on the message
// or in the decision list) highlights its counterpart and draws a connector
// between them; everything else dims. Ported from the case-study handoff
// prototype (Anatomy of a Text Message.dc.html).

const DEFAULT_ASSET_BASE = '/images/projects/caresignal-clinician-app';
const INK = 'var(--color-confetti-black)';
const DIM = 'color-mix(in srgb, var(--color-confetti-black) 40%, transparent)';
const PAPER = 'var(--color-washes-paper)';
const MONO = { fontFamily: 'var(--font-mono)' } as const;
const BODY = { fontFamily: 'var(--font-body)' } as const;

const avFor = (
	base: string,
): Record<number, Array<{ src: string; alt: string }>> => ({
	2: [
		{ src: `${base}/doctor-v7.webp`, alt: 'Chief Medical Officer' },
		{ src: `${base}/legal.webp`, alt: 'Legal' },
	],
	5: [{ src: `${base}/nurse-team-v3.webp`, alt: 'Noel, care manager' }],
	6: [{ src: `${base}/patient-phone.webp`, alt: 'Pat, patient' }],
});

const STEPS: Array<[string, string, string, string, string]> = [
	[
		'Research Center',
		'Evidence',
		'The weight check-in, word for word',
		'The module’s questions, their order, and their copy, including the 153.76 example, were designed and studied by the Research Center before any customer used them.',
		'Defines the question Pat receives',
	],
	[
		'Chief Medical Officer and Legal',
		'Signed off',
		'A 3 lb rise over baseline raises Pat’s risk status',
		'The care team is alerted at this threshold. Alert and risk-status thresholds can’t go live anywhere until they’re signed off; the platform enforces it.',
		'Authorizes the care team alert',
	],
	[
		'Platform default',
		'Default',
		'Check-ins go out at 7:30 AM in the patient’s time zone',
		'CareSignal applies the signed-off settings to every program until someone with the authority to change them does.',
		'Sets when the conversation starts',
	],
	[
		'Manager, whole team',
		'Logged',
		'This team added symptom questions to the weight check-in',
		'A manager can change any program setting for the entire team, in program settings. Each change is written to the audit log.',
		'Logged: J. Okafor · Feb 3, 9:40 AM',
	],
	[
		'Care manager, one patient',
		'Logged',
		'Noel set Pat’s baseline at 184 lb at enrollment',
		'A care manager can change any program setting for a single patient, from their profile. Each change is written to the audit log.',
		'Logged: N. Whitfield, RN · Mar 12, 2:14 PM',
	],
	[
		'Patient',
		'Outside the cascade',
		'Pat’s replies are the only input. Pat can text STOP or START at any time.',
		'No reading is taken without the patient. STOP ends messaging; no layer above can override that choice. START lets Pat resume.',
		'',
	],
];

// Per-decision derived styling (ink/dim/fill states for the active number).
type DecisionStyle = { c: string; b: string; t: string; o: number; l: string };

// These stay at module scope: defined inside the component they'd get a new
// identity every render, and React would remount (not update) them on each
// hover change — killing the 200ms transitions and dropping keyboard focus.
function Marker({
	n,
	s,
	onEnter,
	onPin,
	onBlur,
	style,
}: {
	n: number;
	s: DecisionStyle;
	onEnter: () => void;
	onPin: () => void;
	onBlur: () => void;
	style?: React.CSSProperties;
}) {
	return (
		<button
			type="button"
			onMouseEnter={onEnter}
			onFocus={onEnter}
			onBlur={onBlur}
			onClick={onPin}
			aria-label={`Decision ${n}`}
			data-mk={n}
			className="box-border inline-flex size-[20px] flex-none cursor-pointer items-center justify-center rounded-full border-[1.25px] border-confetti-black p-0 text-[11px] transition-[background,color] duration-200"
			style={{ ...MONO, background: s.b, color: s.t, ...style }}
		>
			{n}
		</button>
	);
}

function Lead({ line, style }: { line: string; style?: React.CSSProperties }) {
	return (
		<span
			aria-hidden
			className="h-0 min-w-[8px] flex-[1_1_8px] transition-[border-color] duration-200"
			style={{ borderTop: `1px solid ${line}`, ...style }}
		/>
	);
}

function Bubble({ color, children }: { color: string; children: ReactNode }) {
	return (
		<div
			className="max-w-[82%] rounded-[16px_16px_16px_4px] bg-[#efece4] p-[10px_12px] text-[14px] leading-[20px] transition-colors duration-200 [text-wrap:pretty]"
			style={{ ...BODY, color }}
		>
			{children}
		</div>
	);
}

function Reply({ opacity, children }: { opacity: number; children: ReactNode }) {
	return (
		<div
			className="rounded-[16px_16px_4px_16px] bg-confetti-black p-[10px_12px] text-[14px] leading-[20px] transition-opacity duration-200"
			style={{ ...BODY, color: PAPER, opacity }}
		>
			{children}
		</div>
	);
}

export default function AnatomyOfATextMessage({
	// Avatar/photo directory — override to reuse outside this case study.
	assetBase = DEFAULT_ASSET_BASE,
}: {
	assetBase?: string;
} = {}) {
	const AV = avFor(assetBase);
	const figRef = useRef<HTMLElement>(null);
	const rafRef = useRef(0);
	const prevKey = useRef('');
	const [hover, setHover] = useState(0);
	const [pinned, setPinned] = useState(0);
	const [side, setSide] = useState<'L' | 'R'>('L');
	const [conn, setConn] = useState({ d: '', off: 1, t: 'none' });

	const active = pinned || hover;

	// A connector from the decision's number to its marker on the message.
	const measure = useCallback(
		(keep: boolean, a: number, drawSide: 'L' | 'R') => {
			const f = figRef.current;
			if (!f) return;
			const m = a && f.querySelector(`[data-mk="${a}"]`);
			const l = a && f.querySelector(`[data-ln="${a}"]`);
			let d = '';
			if (m && l) {
				const F = f.getBoundingClientRect();
				const M = m.getBoundingClientRect();
				const L = l.getBoundingClientRect();
				const sx = M.right - F.left + 3;
				const sy = M.top + M.height / 2 - F.top;
				const tx = L.left - F.left - 4;
				const ty = L.top + L.height / 2 - F.top;
				if (tx - sx > 16) {
					const mx = (sx + tx) / 2;
					// Drawn away from the side being pointed at.
					d =
						drawSide === 'R'
							? `M${tx} ${ty} C${mx} ${ty} ${mx} ${sy} ${sx} ${sy}`
							: `M${sx} ${sy} C${mx} ${sy} ${mx} ${ty} ${tx} ${ty}`;
				}
			}
			if (keep) {
				setConn((c) => (d !== c.d ? { d, off: 0, t: 'none' } : c));
				return;
			}
			const rm = prefersReducedMotion();
			cancelAnimationFrame(rafRef.current);
			setConn({ d, off: rm ? 0 : 1, t: 'none' });
			if (!rm && d) {
				rafRef.current = requestAnimationFrame(() => {
					rafRef.current = requestAnimationFrame(() =>
						setConn({
							d,
							off: 0,
							t: 'stroke-dashoffset 420ms cubic-bezier(.4,0,.2,1)',
						}),
					);
				});
			}
		},
		[],
	);

	useEffect(() => {
		const f = figRef.current;
		if (!f) return;
		const ro = new ResizeObserver(() => measure(true, pinned || hover, side));
		ro.observe(f);
		return () => {
			ro.disconnect();
			cancelAnimationFrame(rafRef.current);
		};
	}, [measure, pinned, hover, side]);

	useEffect(() => {
		const k = active + side;
		if (k !== prevKey.current) {
			// Only the side changed for the same number → keep the drawn line.
			const same =
				active &&
				prevKey.current &&
				prevKey.current.slice(0, -1) === String(active);
			prevKey.current = k;
			if (!same) measure(false, active, side);
		}
	}, [active, side, measure]);

	const enter = (n: number, from: 'L' | 'R') => () => {
		setHover(n);
		if (!pinned) setSide(from);
	};
	const pin = (n: number, from: 'L' | 'R') => () => {
		setPinned((p) => (p === n ? 0 : n));
		// Clear hover alongside, or a touch tap-to-unpin (and the synthetic
		// mouseenter it fires) leaves the figure permanently dimmed.
		setHover(0);
		setSide(from);
	};
	// Keyboard: focus leaving a marker must clear the highlight — there is
	// no mouseleave for Tab navigation.
	const clearHover = () => setHover(0);

	const sOf = (n: number) => {
		const on = active === n;
		const dim = active !== 0 && !on;
		return {
			c: dim ? DIM : INK,
			b: on ? INK : PAPER,
			t: on ? PAPER : INK,
			o: dim ? 0.4 : 1,
			l: on
				? INK
				: 'color-mix(in srgb, var(--color-confetti-black) 30%, transparent)',
		};
	};

	// Shorthand props for the hoisted decision elements.
	const mk = (n: number, from: 'L' | 'R' = 'L') => ({
		n,
		s: sOf(n),
		onEnter: enter(n, from),
		onPin: pin(n, from),
		onBlur: clearHover,
	});

	return (
		<figure
			ref={figRef}
			onMouseLeave={() => setHover(0)}
			className="relative m-0 flex flex-col gap-[20px] rounded-[16px] p-[24px] shadow-[0_4px_6px_-1px_rgb(0_0_0/.1),0_2px_4px_-2px_rgb(0_0_0/.1)]"
			style={{ background: PAPER }}
		>
			<div className="flex flex-col gap-[8px]">
				<div className="flex flex-wrap items-center gap-[12px]">
					<Figure />
					<span
						className="text-[12px] leading-[16px] tracking-[.04em] text-confetti-black/75"
						style={MONO}
					>
						Governance / Alerts and risk
					</span>
				</div>
				<Text variant="headline-small" as="h2" className="m-0 [text-wrap:balance]">
					Anatomy of a text message
				</Text>
				<p
					className="m-0 max-w-[704px] text-[15px] leading-[22px] [text-wrap:pretty]"
					style={BODY}
				>
					One check-in is the product of six decisions, made by six different
					people. Our clinical team defined who may make each one, engineering
					enforced it, and I designed where each is configured and audited.
					Pat sees a conversation. Noel sees an alert.
				</p>
			</div>

			<div className="grid items-start gap-x-[24px] gap-y-[32px] [grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr))]">
				{/* Left column — the patient experience */}
				<div className="flex min-w-0 flex-col gap-[20px]">
					<div className="flex flex-col gap-[4px]">
						<Text variant="eyebrow" as="span" className="block">the patient experience</Text>
						<span className="text-[15px] leading-[22px]" style={BODY}>
							A simple check-in for Pat
						</span>
					</div>
					<div className="box-border flex w-full max-w-[380px] flex-col gap-[12px] rounded-[28px] border-[1.25px] border-confetti-black bg-white p-[16px_14px_20px]">
						<div className="flex items-center gap-[10px] border-b border-confetti-black/12 p-[0_4px_10px]">
							<span
								aria-hidden
								className="inline-flex size-[32px] flex-none items-center justify-center rounded-full bg-confetti-black text-[16px]"
								style={{ fontFamily: 'var(--font-kyoto)', color: PAPER }}
							>
								C
							</span>
							<div className="flex min-w-0 flex-col">
								<span className="text-[14px] font-semibold leading-[18px]" style={BODY}>
									CareSignal
								</span>
								<span
									className="text-[11px] leading-[14px] text-confetti-black/75"
									style={MONO}
								>
									Congestive heart failure program
								</span>
							</div>
						</div>
						<div
							className="relative flex items-center text-[11px] leading-[14px] tracking-[.04em] transition-colors duration-200"
							style={{ ...MONO, color: sOf(3).c }}
						>
							<span aria-hidden className="min-w-[8px] flex-[1_1_8px]" />
							<span className="text-center">
								Thursday 7:30 AM · patient’s time zone
							</span>
							<Lead line={sOf(3).l} style={{ margin: '0 -15px 0 6px' }} />
							<Marker
								{...mk(3)}
								style={{
									position: 'absolute',
									right: -25,
									top: '50%',
									marginTop: -10,
								}}
							/>
						</div>
						<div className="relative flex items-start">
							<Bubble color={sOf(1).c}>
								What is your weight today? <br />
								<br />
								Please enter it in lbs. If the scale shows 153.76 lbs, reply
								153.
							</Bubble>
							<Lead line={sOf(1).l} style={{ margin: '19px -15px 0 6px' }} />
							<Marker {...mk(1)} style={{ position: 'absolute', right: -25, top: 10 }} />
						</div>
						<div className="relative flex items-start justify-end">
							<Reply opacity={sOf(6).o}>187</Reply>
							<Marker {...mk(6)} style={{ position: 'absolute', right: -25, top: 10 }} />
						</div>
						<Bubble color={sOf(1).c}>
							You entered a weight of 187 lbs. Is this correct? <br />
							<br />
							Reply YES or NO.
						</Bubble>
						<div className="flex justify-end">
							<Reply opacity={sOf(6).o}>Yes</Reply>
						</div>
						<div className="relative flex items-start">
							<Bubble color={sOf(4).c}>
								Is the breathing or swelling in your legs better, worse, or
								the same compared to normal?
								<br />
								<br />
								1 = better
								<br />
								2 = worse
								<br />
								3 = same
								<br />
								<br />
								Reply 1, 2, or 3.
							</Bubble>
							<Lead line={sOf(4).l} style={{ margin: '19px -15px 0 6px' }} />
							<Marker {...mk(4)} style={{ position: 'absolute', right: -25, top: 10 }} />
						</div>
						<div className="flex justify-end">
							<Reply opacity={sOf(6).o}>2</Reply>
						</div>
					</div>

					{/* What Noel sees */}
					<div className="flex w-full max-w-[380px] flex-col gap-[10px]">
						<Text variant="eyebrow" as="span" className="block">what Noel sees</Text>
						<div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-[12px] gap-y-[4px] rounded-[12px] border-[1.25px] border-confetti-black bg-white p-[12px_14px]">
							<img
								src={`${assetBase}/nurse-team-v3.webp`}
								alt=""
								className="row-span-2 size-[36px] rounded-full object-cover"
							/>
							<div className="flex min-w-0 items-center gap-[8px]">
								<span className="size-[10px] flex-none rounded-full bg-[#108ba0]" />
								<span
									className="text-[14px] font-semibold leading-[20px] transition-colors duration-200"
									style={{ ...BODY, color: sOf(2).c }}
								>
									Weight alert · Pat
								</span>
							</div>
							<Marker {...mk(2)} style={{ marginRight: -30 }} />
							<span
								className="text-[12px] leading-[16px] tracking-[.04em] transition-colors duration-200"
								style={{ ...MONO, color: sOf(5).c }}
							>
								187 lb · +3 lb over baseline 184 lb · symptoms worse
							</span>
							<Marker {...mk(5)} style={{ marginRight: -30 }} />
						</div>
					</div>
				</div>

				{/* Right column — the decisions behind it */}
				<div className="flex min-w-0 flex-col gap-[20px]">
					<div className="flex flex-col gap-[4px]">
						<Text variant="eyebrow" as="span" className="block">the decisions behind it</Text>
						<span className="text-[15px] leading-[22px]" style={BODY}>
							Who may decide, where it’s configured, and how it’s audited
						</span>
					</div>
					<ol className="m-0 flex list-none flex-col p-0">
						{STEPS.map(([who, tag, title, body, meta], i) => {
							const n = i + 1;
							const s = sOf(n);
							const av = AV[n] ?? [];
							return (
								<li
									key={n}
									onMouseEnter={enter(n, 'R')}
									onClick={pin(n, 'R')}
									className="grid cursor-pointer grid-cols-[20px_minmax(0,1fr)] gap-[14px] border-t border-confetti-black/12 py-[14px] transition-colors duration-200"
									style={{ color: s.c }}
								>
									<span
										data-ln={n}
										className="mt-px box-border inline-flex size-[20px] items-center justify-center rounded-full border-[1.25px] border-confetti-black text-[11px] transition-[background,color] duration-200"
										style={{ ...MONO, background: s.b, color: s.t }}
									>
										{n}
									</span>
									<div className="flex min-w-0 flex-col gap-[6px]">
										<div className="flex flex-wrap items-center gap-x-[10px] gap-y-[6px]">
											{av.length > 0 ? (
												<div className="flex">
													{av.map((p, j) => (
														<span
															key={p.alt}
															role="img"
															aria-label={p.alt}
															title={p.alt}
															className="block size-[32px] rounded-full border-[1.5px] bg-[#eee] bg-cover bg-center transition-opacity duration-200"
															style={{
																backgroundImage: `url("${p.src}")`,
																borderColor: PAPER,
																marginLeft: j ? -8 : 0,
																opacity: active && active !== n ? 0.4 : 1,
															}}
														/>
													))}
												</div>
											) : null}
											<span
												className="text-[12px] leading-[16px] tracking-[.04em]"
												style={MONO}
											>
												{who}
											</span>
											<span
												className="rounded-full border border-current px-[8px] py-px text-[11px] leading-[14px] tracking-[.04em]"
												style={MONO}
											>
												{tag}
											</span>
										</div>
										<span
											className="text-[15px] font-semibold leading-[22px] [text-wrap:pretty]"
											style={BODY}
										>
											{title}
										</span>
										<span
											className="text-[15px] leading-[22px] [text-wrap:pretty]"
											style={BODY}
										>
											{body}
										</span>
										{meta ? (
											<span
												className="text-[12px] leading-[16px] tracking-[.04em] opacity-75"
												style={MONO}
											>
												{meta}
											</span>
										) : null}
									</div>
								</li>
							);
						})}
					</ol>
				</div>
			</div>

			<svg
				aria-hidden
				className="pointer-events-none absolute inset-0 size-full overflow-visible"
			>
				<path
					d={conn.d}
					pathLength={1}
					fill="none"
					stroke={INK}
					strokeWidth={1.25}
					strokeLinecap="round"
					style={{
						strokeDasharray: 1,
						strokeDashoffset: conn.off,
						transition: conn.t,
					}}
				/>
			</svg>
		</figure>
	);
}
