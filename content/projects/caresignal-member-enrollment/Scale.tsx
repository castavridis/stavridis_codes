import type { ReactNode } from 'react';

import { Email, EmailRedesign, PostcardBack, PostcardBackRedesign, SmsIntroLink, SmsRedesign } from './fernwood';
import { Beat, Carousel, Copy, DecisionHeader, Fig, Results } from './shared';

const SCORE: { p: 1 | 2; name: string; sent?: string; what: ReactNode; change: string }[] = [
	{
		p: 1,
		name: 'Invitation mailer',
		sent: '1,642 sent',
		what: '97% delivered, but only 3 of 1,642 recipients visited the portal.',
		change: 'Enlarge the deadline callout and reorder the “three ways to enroll” to lead with the portal and a pre-filled member code.',
	},
	{
		p: 1,
		name: 'Email 1',
		sent: '1,380 sent',
		what: (
			<>
				<strong>45.1% opened</strong>, about twice the roughly 21% industry
				benchmark for health and insurance email. 1.8% clicked.
			</>
		),
		change: 'Move the button above the fold and change it to “Check my eligibility.”',
	},
	{
		p: 1,
		name: 'Text 1',
		sent: '1,630 sent',
		what: '89 link clicks, 66 of them on the first day, but few finished enrolling.',
		change: 'Pre-fill each member’s portal code in the link so they don’t have to find it.',
	},
	{
		p: 1,
		name: 'Physician letter',
		sent: 'Mailer 2',
		what: '83% delivered within four days.',
		change: 'Print the member’s portal code on the letter and darken the call to action.',
	},
	{
		p: 2,
		name: 'Email 2',
		sent: '1,406 sent',
		what: '44.3% opened and 1.7% clicked, holding steady.',
		change: 'Remove bounced addresses before every later send.',
	},
	{
		p: 2,
		name: 'Agent calls',
		what: 'The caller ID and voicemail used a different program name than the mail and email.',
		change: 'Fixed in week 1, since it was in our own system: the caller ID and voicemail now matched the program’s name, so a call felt like the letter members already had.',
	},
];

function Scorecard() {
	return (
		<Fig
			id="fig-score"
			title="What each touchpoint did, and what I would change"
			caption="Cohort 1, March 4–18, 2022. The campaign hit its goal, so the plan kept its approved materials; I documented these recommendations instead."
		>
			<div className="tbl-scroll">
				<table className="score">
					<thead>
						<tr>
							<th scope="col">Touchpoint</th>
							<th scope="col">What happened</th>
							<th scope="col">What I would change</th>
						</tr>
					</thead>
					<tbody>
						{SCORE.map((r) => (
							<tr key={r.name}>
								<th scope="row">
									<span className="sw" style={{ ['--pc' as string]: `var(--p${r.p})` }} />
									{r.name}
									{r.sent ? <small>{r.sent}</small> : null}
								</th>
								<td>{r.what}</td>
								<td>{r.change}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</Fig>
	);
}

type Redesign = { title: string; why: string; before: ReactNode; after: ReactNode; notes: string[] };

const REDESIGNS: Redesign[] = [
	{
		title: 'Postcard: lead with the fastest way in',
		why: 'Only 3 of 1,642 recipients visited the portal. The postcard asked members to choose among three paths, and the online one came last.',
		before: <PostcardBack rounded />,
		after: <PostcardBackRedesign />,
		notes: [
			'The deadline moves to the top, where it can’t be missed.',
			'A personal link carries the member’s code, so enrolling takes one step.',
			'Phone options stay, second, for members who aren’t online.',
		],
	},
	{
		title: 'Email: put the button on the first screen',
		why: '45% opened it, about twice the industry rate, but only 1.8% clicked, below the roughly 2–3% average for health and insurance email. The button sat below the first screen on most phones.',
		before: <Email />,
		after: <EmailRedesign />,
		notes: [
			'The button and code move above the fold.',
			'“Join now” becomes “Check my eligibility,” a smaller first step.',
			'The headline names the benefit: a care team, at no cost.',
		],
	},
	{
		title: 'Text: make the link do the work',
		why: 'The first text drew 89 clicks, 66 of them on day one, but few of those members finished enrolling.',
		before: <SmsIntroLink />,
		after: <SmsRedesign />,
		notes: [
			'A personal link opens the portal with the code already filled in.',
			'The phone number and deadline move to a second message, so the first one has a single job.',
		],
	},
];

function RedesignFigure() {
	return (
		<Fig
			id="fig-redesign"
			title="What I would change, redesigned"
			caption="Recreated with a fictional brand. Left: as shipped in 2022. Right: a 2026 redesign applying the recommendations I documented after cohort 1, which the plan chose not to change mid-campaign."
		>
			<Carousel
				label="Three redesigned touchpoints"
				titles={REDESIGNS.map((r) => r.title)}
				dotLabel={(_, t) => `Go to ${t}`}
			>
				{REDESIGNS.map((r) => (
					<div key={r.title} className="ba-row">
						<h4>{r.title}</h4>
						<p>{r.why}</p>
						<div className="ba-pair">
							<div>
								<span>As shipped, 2022</span>
								{r.before}
							</div>
							<div>
								<span className="new">Redesign, 2026</span>
								{r.after}
							</div>
						</div>
						<ul className="ba-notes">
							{r.notes.map((n) => (
								<li key={n}>{n}</li>
							))}
						</ul>
					</div>
				))}
			</Carousel>
		</Fig>
	);
}

export function Scale() {
	return (
		<section className="chal" id="c3">
			<DecisionHeader
				n={3}
				meta="Decision 3 · Teams and systems · 2022"
				title="Scale the service: make it work beyond one client"
			/>
			<Beat label="The challenge">
				<Copy>
					Every client campaign had been built as a one-off. Touchpoints had never
					been measured one by one, our systems didn’t talk to each other, and the
					plan’s team was in the middle of open enrollment.
				</Copy>
			</Beat>
			<Beat label="What I did">
				<ul className="clean">
					<li>
						<strong>Analytics on every touchpoint:</strong> a phone number and
						tagged link for each, a Segment implementation I scoped and delegated,
						and results every Monday and Wednesday.
					</li>
					<li>
						<strong>A HIPAA-compliant email system</strong> I designed, developed,
						and procured.
					</li>
					<li>
						<strong>List reconciliation:</strong> our clients’ lists, the portal,
						and the call-center app were matched by hand every week. I pitched a
						tool to our CTO, so enrolled members weren’t called again.
					</li>
					<li>
						<strong>Work taken off the plan’s plate:</strong> we owned copy,
						design, mail, email, list cleaning, and reporting.
					</li>
					<li>
						<strong>An operating rhythm:</strong> monthly KPI reviews with
						Engineering, Account Success, Sales, and Marketing; weekly engineering
						meetings I led; and good or bad news reported early, with the tradeoff
						I recommended.
					</li>
				</ul>
			</Beat>
			<Scorecard />
			<RedesignFigure />
			<Results
				stats={[
					{ n: '3', c: 'More populations ran the playbook: Medicare Advantage members, another plan, a public health system' },
					{ n: '141', c: 'Self-enrollments in one week at the public health system' },
				]}
			/>
			<Copy style={{ marginTop: 28 }}>
				Today I build the same way, with less wait: I hand-code full-stack apps
				and prototype most experiments with Claude Code, so a bet like the portal
				can be tested in hours.
			</Copy>
		</section>
	);
}
