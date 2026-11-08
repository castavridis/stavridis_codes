import type { ReactNode } from 'react';

import Text from '../../../../components/Text';
import Figure from './Figure';

// "How CareSignal programs are governed" — ported from the case-study design
// canvas (Program Governance.dc.html). Three tiers of who may set a program's
// thresholds and settings, each indented one step further: CareSignal
// defaults (research + client evidence), organization customizations (CMO &
// legal → manager → care manager), and patient settings — all resting on
// patient consent. A dashed rail on the right notes that settings may be
// iterated on. Static markup; no engine.
//
// Colours: CareSignal orange for defaults, CareSignal green for the
// organization, CareSignal purple for the patient (the same patient colour
// as Figure 2's flow chart; the design used a pink here).

const ORANGE = 'var(--color-cs-orange, #f9ac31)';
const GREEN = 'var(--color-cs-green, #b2d07f)';
const PATIENT = 'var(--color-cs-purple, #cf9fc5)';
const ROSE = '#a50e53';

const BODY = 'm-0 text-[15px] leading-[22px] [text-wrap:pretty]';
const BODY_FONT = { fontFamily: 'var(--font-body)' } as const;
const MONO = { fontFamily: 'var(--font-mono)' } as const;

// Indent steps: 8px on phones, 32px from md up (the design's `indent` prop).
const IND = [
	'',
	'ml-[8px] md:ml-[32px]',
	'ml-[16px] md:ml-[64px]',
	'ml-[24px] md:ml-[96px]',
	'ml-[32px] md:ml-[128px]',
	'ml-[40px] md:ml-[160px]',
] as const;

// Italic Kyoto outcome label ("Legal Sign-Off", "Changes Recorded" …).
function Outcome({ children, wrap = false }: { children: ReactNode; wrap?: boolean }) {
	return (
		<span
			className={`ml-auto text-right text-[15px] font-bold italic leading-[20px] ${wrap ? 'self-end [text-wrap:balance]' : 'flex-none whitespace-nowrap'}`}
			style={{ fontFamily: 'var(--font-kyoto)' }}
		>
			{children}
		</span>
	);
}

// A tier heading: a 20px colour swatch beside a sentence.
function Tier({ color, className = '', children }: { color: string; className?: string; children: ReactNode }) {
	return (
		<div className={`grid grid-cols-[20px_minmax(0,1fr)] items-start gap-[12px] ${className}`}>
			<span aria-hidden className="mt-px size-[20px] rounded-[4px]" style={{ background: color }} />
			<p className={BODY} style={BODY_FONT}>
				{children}
			</p>
		</div>
	);
}

// A filled role row: description left, outcome label right.
function Row({ color, className = '', outcome, children }: { color: string; className?: string; outcome: string; children: ReactNode }) {
	return (
		<div
			className={`flex flex-wrap items-center gap-x-[24px] gap-y-[8px] rounded-[12px] px-[24px] py-[16px] ${className}`}
			style={{ background: color }}
		>
			<p className={`${BODY} flex-[1_1_300px]`} style={BODY_FONT}>
				{children}
			</p>
			<Outcome>{outcome}</Outcome>
		</div>
	);
}

// One of the two evidence cards under CareSignal defaults.
function Evidence({ outcome, children }: { outcome: string; children: ReactNode }) {
	return (
		<div className="flex flex-col justify-between gap-[16px] rounded-[12px] px-[24px] py-[20px]" style={{ background: ORANGE }}>
			<p className={BODY} style={BODY_FONT}>
				{children}
			</p>
			<Outcome wrap>{outcome}</Outcome>
		</div>
	);
}

export default function ProgramGovernance() {
	return (
		<figure
			data-screen-label="Program governance"
			className="m-0 flex flex-col gap-[20px] rounded-[16px] p-[24px] text-confetti-black"
			style={{ background: 'var(--color-washes-paper)' }}
		>
			<div className="flex flex-col gap-[8px]">
				<Figure />
				<Text as="h2" variant="headline-small" className="m-0 max-w-[860px] [text-wrap:balance]">
					How CareSignal programs are governed through research, organizations, and individuals
				</Text>
			</div>

			<div className="mt-[12px] grid grid-cols-[minmax(0,1fr)] gap-x-[20px] md:grid-cols-[minmax(0,1fr)_24px]">
				<div className="flex min-w-0 flex-col gap-[16px]">
					<Tier color={ORANGE}>
						<strong>CareSignal defaults</strong> are based on evidence collected in research
						settings or successful implementations. Defaults are treated as strong
						recommendations for an organization’s settings.
					</Tier>
					{/* min(260px, 100%): at phone widths the cards take the row
					    instead of overflowing it. */}
					<div className="ml-[8px] grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-[16px] md:ml-[32px]">
						<Evidence outcome="Published Evidence, Literature Review">
							<strong>Research Center</strong> develops thresholds for condition-specific programs
							and often implements a study
						</Evidence>
						<Evidence outcome="Published Case Studies, Internal Knowledge">
							<strong>Clients</strong> achieve real-world outcomes with their thresholds, informing
							future implementations
						</Evidence>
					</div>

					<Tier color={GREEN} className={`mt-[24px] ${IND[1]}`}>
						<strong>Organization customizations</strong> can happen at different levels; however,
						organization-level changes are usually vetted and approved by a Chief Medical Officer
						and legal team.
					</Tier>
					<Row color={GREEN} className={IND[2]} outcome="Legal Sign-Off">
						<strong>Chief Medical Officer &amp; Legal Team</strong> review defaults and set
						organization-wide thresholds
					</Row>
					<Row color={GREEN} className={IND[3]} outcome="Application Defaults Set">
						<strong>Manager</strong> sets account defaults and educates team on organization
						thresholds and makes recommendations for iterations to CMO and CareSignal account
						manager
					</Row>

					<div className={`flex items-center gap-[16px] py-[4px] ${IND[3]}`}>
						<span aria-hidden className="min-w-[24px] flex-1 border-t-[1.25px] border-dashed border-confetti-black" />
						<span className="flex-[0_1_auto] text-center text-[12px] leading-[16px] tracking-[.04em] [text-wrap:balance]" style={MONO}>
							Implementations can go live at this point
						</span>
						<span aria-hidden className="min-w-[24px] flex-1 border-t-[1.25px] border-dashed border-confetti-black" />
					</div>

					<Row color={GREEN} className={IND[4]} outcome="Adjustments Recorded">
						<strong>Care Manager</strong> makes patient-specific threshold adjustments based on
						their knowledge of the patient and their clinical judgment
					</Row>

					<Tier color={PATIENT} className={`mt-[24px] ${IND[4]}`}>
						<strong>Patient settings</strong> are limited to certain non-clinical adjustments.
					</Tier>
					<Row color={PATIENT} className={IND[5]} outcome="Changes Recorded">
						<strong>Patient</strong> can control non-clinical settings such as time of message or
						opting out
					</Row>
				</div>

				{/* Side rail: "Settings may be iterated on" (hidden on phones). */}
				<div
					aria-label="Settings may be iterated on"
					className="hidden flex-col items-center gap-[10px] pt-px md:flex"
				>
					<span aria-hidden className="-mb-[10px] size-0 border-x-[5px] border-t-[8px] border-x-transparent border-t-confetti-black" />
					<span aria-hidden className="flex-1 border-l-[1.25px] border-dashed border-confetti-black" />
					<span className="whitespace-nowrap text-[12px] leading-[16px] tracking-[.04em] [writing-mode:vertical-rl]" style={MONO}>
						Settings may be iterated on
					</span>
					<span aria-hidden className="text-[20px] leading-[20px]" style={BODY_FONT}>
						↻
					</span>
					<span aria-hidden className="flex-1 border-l-[1.25px] border-dashed border-confetti-black" />
					<span aria-hidden className="-mt-[10px] size-0 border-x-[5px] border-b-[8px] border-x-transparent border-b-confetti-black" />
				</div>
			</div>

			{/* Phones: the side rail's note, set across the foot instead. */}
			<p
				className="m-0 mt-[20px] flex items-center gap-[10px] text-[12px] leading-[16px] tracking-[.04em] text-confetti-black md:hidden"
				style={MONO}
			>
				<span aria-hidden className="flex-1 border-t-[1.25px] border-dashed border-confetti-black" />
				<span aria-hidden className="text-[18px] leading-[16px]" style={BODY_FONT}>
					↻
				</span>
				Settings may be iterated on
				<span aria-hidden className="flex-1 border-t-[1.25px] border-dashed border-confetti-black" />
			</p>

			<div
				className="mt-[4px] flex flex-wrap items-center gap-x-[24px] gap-y-[8px] rounded-[12px] px-[24px] py-[16px]"
				style={{ border: `1.25px solid ${ROSE}` }}
			>
				<p className={`${BODY} flex-[1_1_300px]`} style={BODY_FONT}>
					<strong>Patient Consent</strong> undergirds the entire flow. Without their consent,
					thresholds and settings are moot.
				</p>
				<Outcome>Opt-In Recorded</Outcome>
			</div>
		</figure>
	);
}
