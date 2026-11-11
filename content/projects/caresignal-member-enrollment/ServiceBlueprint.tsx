import { Fragment, useState } from 'react';

import { Fig } from './shared';

type FlagKind = 'pain' | 'fix' | 'opp';
type Card = string | { text: string; flags: [FlagKind, string][] };
type Lane = { lane: [string, string]; quote?: boolean; cells: Card[][] };
type Row = Lane | { line: string };

// Column: phase label, title, dates, accent.
const COLS: [string, string, string, string][] = [
	['Before launch', 'Prep', 'Dec–Feb', 'var(--ink-50)'],
	['Phase 1', 'Introducing enhanced benefits', 'Mar 7–20', 'var(--p1)'],
	['Phase 2', 'Need more information?', 'Mar 21–Apr 3', 'var(--p2)'],
	['Phase 3', 'Last chance', 'Apr 4–11', 'var(--p3)'],
	['Pause', 'Capacity pause', '1–4 weeks', 'var(--ink-15)'],
	['Phase 4', 'We saved you a spot', 'Apr 18–30', 'var(--p4)'],
	['Enrolled', 'Welcome', 'First check-in', 'var(--cerulean)'],
];

// Member feeling per column: -2..2 (null = no reading), label.
const EMO: [number | null, string][] = [
	[null, ''],
	[-1, 'Skeptical'],
	[0, 'Curious'],
	[1, 'Deciding'],
	[null, ''],
	[1, 'Relieved'],
	[2, 'Connected'],
];

const ROWS: Row[] = [
	{
		lane: ['Member thinking', 'Questions from research'],
		quote: true,
		cells: [
			[],
			['“Is this really from my health plan?”', '“Why should I do this?”'],
			['“I’m fine. Do I need this?”', '“What would I have to do?”'],
			['“Let me ask my spouse or doctor.”'],
			[],
			['“I missed it. Can I still join?”'],
			['“What am I supposed to do again?”', '“Will it be annoying?”'],
		],
	},
	{
		lane: ['Member actions', 'What members did'],
		cells: [
			['Asks their doctor’s office about a letter'],
			[
				'Reads the postcard; 45% open the email',
				{ text: 'Taps the text link: 66 clicks on day one', flags: [['pain', 'Few finished enrolling']] },
			],
			['Enrolls on the portal with a Quick Access Code', 'Calls the number on the mailer'],
			['Answers an agent’s call and enrolls by phone'],
			[],
			['Enrolls late, by call, text, or portal'],
			['Confirms birth date; picks call or text, days, and time', 'Answers the first check-in'],
		],
	},
	{ line: 'Line of interaction' },
	{
		lane: ['Frontstage', 'What members saw and heard'],
		cells: [
			['One-pagers for providers and clinic front desks'],
			[
				{
					text: 'Invitation postcard with three ways to enroll',
					flags: [
						['pain', '3 of 1,642 visited the portal'],
						['opp', 'Lead with portal + code'],
					],
				},
				'HIPAA-compliant email with Quick Access Code',
				'Intro texts, each under 160 characters',
				'Letter from the plan’s physician leader',
			],
			['“Time is running out” mailer with testimonials', 'Care-team email; “Comfort. Cost. Convenience.” text', 'First agent calls'],
			['“Enrollment is closing” email and last-chance text', 'Agent calls, evenings until 6:30 pm'],
			['No outreach while agents catch up'],
			['“We saved you a spot” email and text', 'Final round of calls'],
			['Agent script: assumes yes, offers call or text', 'Messages from an 800 number marked “Confidential Message”'],
		],
	},
	{ line: 'Line of visibility' },
	{
		lane: ['Backstage', 'CareSignal people'],
		cells: [
			[
				'Strategy, copy, and sequencing (me)',
				'Mailers produced by our graphic designer',
				'List split into weekly cohorts',
				{ text: 'Legal and CMS review', flags: [['pain', 'Batch approvals slowed polish']] },
			],
			[
				'Monday and Wednesday analytics reviews',
				{ text: 'Caller ID and voicemail renamed to match the program', flags: [['fix', 'Fixed in week 1']] },
			],
			[
				'Agents call each cohort; managers coach from weekly performance exports',
				{ text: 'Touchpoint changes documented', flags: [['opp', 'Plan kept materials as approved']] },
			],
			['Extended calling hours; up to five rounds of calls'],
			['Agents work the backlog; queue sized to capacity'],
			['Last-round campaign for members not yet reached'],
			['Care team watches responses and risk levels', 'Re-engagement call if a member stops replying'],
		],
	},
	{ line: 'Line of internal interaction' },
	{
		lane: ['Support systems', 'Tools and processes'],
		cells: [
			[
				'Co-branded self-enrollment portal, WCAG 2.1 AA',
				'HIPAA-compliant email service',
				'A phone number and tagged link per touchpoint; Segment events',
			],
			['Mail fulfillment, email sends, shortcode texts', 'Twice-weekly analytics pulls'],
			['Call-center app with a two-line power dialer'],
			[
				{
					text: 'Client list, portal, and call center reconciled',
					flags: [
						['pain', 'Matched by hand each week'],
						['fix', 'Tool I pitched to our CTO'],
					],
				},
			],
			['Campaign-sizing model: 1,250–2,000 calls a week'],
			['Bounced addresses and enrolled members removed'],
			['Monitoring platform with risk stratification'],
		],
	},
];

export function ServiceBlueprint() {
	const [focus, setFocus] = useState(-1);
	const [flags, setFlags] = useState(true);
	const on = (i: number) => (focus === i ? ' on' : '');

	return (
		<Fig
			id="fig-bp"
			title="Service blueprint of the enrollment campaign, from launch prep to a member’s first check-in"
			caption="Reconstructed in 2026 from the 2021–22 campaign plan, communication schedule, scripts, touchpoint tracking, and meeting notes. Member feelings are inferred from research and decline reasons, not measured."
		>
			<div className="bp-controls">
				<button className="btn ghost" type="button" aria-pressed={flags} onClick={() => setFlags((v) => !v)}>
					Pain points and fixes: {flags ? 'on' : 'off'}
				</button>
				<span className="bp-hint">Select a phase to focus it.</span>
			</div>
			<div className="bp-scroll">
				<div className={['bp', focus >= 0 ? 'focus' : '', flags ? '' : 'noflags'].filter(Boolean).join(' ')}>
					<div className="corner">Phase</div>
					{COLS.map(([label, title, dates, color], i) => (
						<button
							key={label}
							className="hd"
							type="button"
							aria-pressed={focus === i}
							style={{ ['--pc' as string]: color }}
							onClick={() => setFocus((f) => (f === i ? -1 : i))}
						>
							<b>{label}</b>
							<strong>{title}</strong>
							<small>{dates}</small>
						</button>
					))}

					<div className="bpl">
						<strong>Member feeling</strong>
						<span>Inferred, not measured</span>
					</div>
					{EMO.map(([v, label], i) => (
						<div key={i} className={`emo${on(i)}`}>
							{v === null ? null : (
								<>
									<i
										style={{
											top: 36 - v * 13,
											background: v < 0 ? '#a50e53' : v > 0 ? 'var(--cerulean)' : 'var(--ink-50)',
										}}
									/>
									<em>{label}</em>
								</>
							)}
						</div>
					))}

					{ROWS.map((r) =>
						'line' in r ? (
							<div key={r.line} className="bpln">
								{r.line}
							</div>
						) : (
							<Fragment key={r.lane[0]}>
								<div className="bpl">
									<strong>{r.lane[0]}</strong>
									<span>{r.lane[1]}</span>
								</div>
								{r.cells.map((cards, i) => (
									<div key={i} className={`bpx${on(i)}`}>
										{cards.map((card, j) => {
											const c = typeof card === 'string' ? { text: card, flags: [] } : card;
											return (
												<div key={j} className={r.quote ? 'bpc q' : 'bpc'}>
													{c.text}
													{c.flags.map(([kind, txt]) => (
														<span key={txt} className={`flag f-${kind}`}>
															{txt}
														</span>
													))}
												</div>
											);
										})}
									</div>
								))}
							</Fragment>
						),
					)}
				</div>
			</div>
			<div className="legend" aria-hidden="true">
				<span>
					<i className="f-pain" />
					Pain point
				</span>
				<span>
					<i className="f-fix" />
					Fixed
				</span>
				<span>
					<i className="f-opp" />
					Recommended next
				</span>
				<span>
					<i style={{ background: 'var(--cerulean)', borderRadius: '50%' }} />
					Feeling better
				</span>
				<span>
					<i style={{ background: '#a50e53', borderRadius: '50%' }} />
					Feeling worse
				</span>
			</div>
		</Fig>
	);
}
