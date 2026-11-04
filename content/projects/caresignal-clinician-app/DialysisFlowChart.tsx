import type { CSSProperties, ReactNode } from 'react';

import { IMG } from './shared';

// The dialysis program's alert-based workflow, rebuilt as DOM per the
// handoff ("keep it as DOM, not an image"). Layout and copy match the
// reference prototype; the whole chart reads as one image to AT via the
// aria-label, with the DOM text hidden from the tree.

const INK45 = 'color-mix(in srgb, var(--color-confetti-black) 45%, transparent)';
const HANSA = 'var(--color-washes-hansa-yellow, #f6c445)';
const CERULEAN = 'var(--color-washes-cerulean-blue, #108ba0)';
const GREEN = 'var(--color-grad-success-start, #b2d07f)';
const ROSE = '#a50e53';

const ARIA_LABEL =
	'Flow chart. CareSignal messages the patient: ‘Will you be able to come to [date]’s treatment? Press 1 if yes, 2 if no, 3 if you are going to be late.’ The patient presses 2. CareSignal asks why — feeling sick, no ride, in the hospital, or other reasons — and the patient presses 2. CareSignal thanks them and gives a number to call, or 911 in an emergency. CareSignal reviews the replies and alerts the nurse that the patient indicated difficulty attending treatment, and the nurse calls the patient.';

function Pill({
	tone,
	avatar,
	avatarSize = 32,
	children,
}: {
	tone: string;
	avatar?: string;
	avatarSize?: number;
	children: ReactNode;
}) {
	return (
		<div
			className="box-border flex w-full items-center gap-[10px] rounded-full px-[14px] py-[10px]"
			style={{
				background: `color-mix(in srgb, ${tone} 26%, var(--color-white, #fff))`,
				border: `1px solid color-mix(in srgb, ${tone} 60%, transparent)`,
			}}
		>
			{avatar ? (
				<img
					src={avatar}
					alt=""
					width={192}
					height={192}
					className="flex-none rounded-full object-cover"
					style={{ width: avatarSize, height: avatarSize }}
				/>
			) : null}
			<span
				className="relative -top-[2px] text-[18px] font-medium leading-[22px] text-confetti-black"
				style={{ fontFamily: 'var(--font-kyoto)' }}
			>
				{children}
			</span>
		</div>
	);
}

function ChipLabel({ dot, children }: { dot: string; children: ReactNode }) {
	return (
		<span
			className="inline-flex items-center gap-[6px] text-[12px] leading-[16px] tracking-[.04em]"
			style={{
				fontFamily: 'var(--font-mono)',
				color: 'color-mix(in srgb, var(--color-confetti-black) 60%, transparent)',
			}}
		>
			<span className="size-[8px] rounded-full" style={{ background: dot }} />
			{children}
		</span>
	);
}

function Token({ children }: { children: ReactNode }) {
	return (
		<span
			className="rounded-[3px] px-[3px] text-[12.5px]"
			style={{
				fontFamily: 'var(--font-mono)',
				background: 'color-mix(in srgb, var(--color-confetti-black) 7%, transparent)',
			}}
		>
			{children}
		</span>
	);
}

function MsgCard({
	chipDot,
	chipLabel,
	borderColor,
	children,
}: {
	chipDot: string;
	chipLabel: string;
	borderColor?: string;
	children: ReactNode;
}) {
	return (
		<div
			className="box-border flex w-full flex-col gap-[6px] rounded-[8px] bg-white px-[14px] py-[12px]"
			style={{
				border: `1px solid ${borderColor ?? 'color-mix(in srgb, var(--color-confetti-black) 15%, transparent)'}`,
			}}
		>
			<ChipLabel dot={chipDot}>{chipLabel}</ChipLabel>
			<span className="text-[15px] leading-[22px] text-confetti-black [text-wrap:pretty]">
				{children}
			</span>
		</div>
	);
}

function PressRow() {
	return (
		<div className="flex items-center justify-end gap-[10px] pr-[8px]">
			<ChipLabel dot={CERULEAN}>Patient presses</ChipLabel>
			<span
				className="flex size-[34px] items-center justify-center rounded-[6px] bg-white text-[15px] text-confetti-black"
				style={{ fontFamily: 'var(--font-mono)', border: `1.5px solid ${CERULEAN}` }}
			>
				2
			</span>
		</div>
	);
}

// Dashed connector arrows (purely decorative).
function ArrowRight() {
	return (
		<div aria-hidden className="flex w-full items-center">
			<span className="flex-1" style={{ borderTop: `1.5px dashed ${INK45}` }} />
			<span
				className="size-0"
				style={{
					borderTop: '5px solid transparent',
					borderBottom: '5px solid transparent',
					borderLeft: `7px solid ${INK45}`,
				}}
			/>
		</div>
	);
}

function ArrowDown({ height, stretch }: { height?: number; stretch?: boolean }) {
	return (
		<div
			aria-hidden
			className="flex flex-col items-center"
			style={stretch ? { flex: '1px', height: 'auto' } : { height: height ?? 24 }}
		>
			<span className="flex-1" style={{ borderLeft: `1.5px dashed ${INK45}` }} />
			<span
				className="size-0"
				style={{
					borderLeft: '5px solid transparent',
					borderRight: '5px solid transparent',
					borderTop: `7px solid ${INK45}`,
				}}
			/>
		</div>
	);
}

const COLS: CSSProperties = {
	gridTemplateColumns: 'minmax(260px, 1.25fr) 72px minmax(220px, 1fr)',
};

export function DialysisFlowChart() {
	return (
		<div
			role="img"
			aria-label={ARIA_LABEL}
			className="w-full max-w-[1000px] overflow-x-auto text-left text-confetti-black"
			style={{ fontFamily: 'var(--font-body)' }}
		>
			<div aria-hidden className="grid min-w-[600px] items-center" style={COLS}>
				<div style={{ gridColumn: 1, gridRow: 1 }}>
					<Pill tone={HANSA} avatar={`${IMG}/fig2-avatar-phone.png`}>
						CareSignal messages patient
					</Pill>
				</div>
				<div className="px-[6px]" style={{ gridColumn: 2, gridRow: 1 }}>
					<ArrowRight />
				</div>
				<div style={{ gridColumn: 3, gridRow: 1 }}>
					<Pill tone={HANSA}>CareSignal reviews replies</Pill>
				</div>

				<div style={{ gridColumn: 1, gridRow: 2 }}>
					<ArrowDown />
				</div>
				<div
					className="flex flex-col items-center self-stretch"
					style={{ gridColumn: 3, gridRow: '2 / span 3' }}
				>
					<ArrowDown stretch />
				</div>

				<div style={{ gridColumn: 1, gridRow: 3 }}>
					<MsgCard chipDot={HANSA} chipLabel="CareSignal · call or text">
						Will you be able to come to <Token>{'#{date}'}</Token>’s treatment?
						Please press 1 if yes, press 2 if no, or press 3 if you are going
						to be late.
					</MsgCard>
				</div>
				<div className="py-[10px]" style={{ gridColumn: 1, gridRow: 4 }}>
					<PressRow />
				</div>

				<div style={{ gridColumn: 1, gridRow: 5 }}>
					<MsgCard chipDot={HANSA} chipLabel="CareSignal">
						OK. Would you let us know why? Please press 1 if you are feeling
						sick, press 2 if you cannot get a ride, press 3 if you are in the
						hospital, press 4 if you cannot make it for other reasons.
					</MsgCard>
				</div>
				<div className="flex flex-col gap-[10px]" style={{ gridColumn: 3, gridRow: 5 }}>
					<Pill tone={HANSA}>CareSignal alerts nurse</Pill>
					<MsgCard
						chipDot={ROSE}
						chipLabel="Alert · dialysis team"
						borderColor={`color-mix(in srgb, ${ROSE} 45%, transparent)`}
					>
						Patient <Token>{'#{patient.firstName}'}</Token> indicated
						difficulty with attending the treatment.
					</MsgCard>
				</div>

				<div className="py-[10px]" style={{ gridColumn: 1, gridRow: 6 }}>
					<PressRow />
				</div>
				<div className="flex justify-center" style={{ gridColumn: 3, gridRow: 6 }}>
					<ArrowDown height={40} />
				</div>

				<div style={{ gridColumn: 1, gridRow: 7 }}>
					<MsgCard chipDot={HANSA} chipLabel="CareSignal">
						Thanks for letting us know! We will try to contact you soon. You
						can also call <Token>{'#{number}'}</Token> if you would like to
						talk to someone sooner! If emergency, call 911.
					</MsgCard>
				</div>
				<div style={{ gridColumn: 3, gridRow: 7 }}>
					<Pill tone={GREEN} avatar={`${IMG}/fig2-avatar-nurse.png`}>
						Nurse calls patient
					</Pill>
				</div>

				<div
					className="mt-[18px] grid items-center"
					style={{ gridColumn: '1 / span 3', gridRow: 8, ...COLS }}
				>
					<div className="flex items-center justify-end gap-[10px] pr-[8px]">
						<ChipLabel dot={CERULEAN}>Patient</ChipLabel>
						<img
							src={`${IMG}/fig2-avatar-patient.png`}
							alt=""
							width={192}
							height={192}
							className="size-[40px] flex-none rounded-full object-cover"
						/>
					</div>
					<div
						className="flex flex-row-reverse items-center pr-[40%]"
						style={{ gridColumn: '2 / span 2' }}
					>
						<span className="flex-1" style={{ borderTop: `1.5px dashed ${GREEN}` }} />
						<span
							className="size-0"
							style={{
								borderTop: '5px solid transparent',
								borderBottom: '5px solid transparent',
								borderRight: `7px solid ${GREEN}`,
							}}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
