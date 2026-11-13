import type { ReactNode } from 'react';

import { CohortsFigure } from './CohortsFigure';
import { Email, EmailRedesign, PostcardBack, PostcardBackRedesign, SmsIntroLink, SmsRedesign } from './fernwood';
import { Beat, Carousel, Copy, Fig, Results, SectionHead } from './shared';

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
		name: 'Emails 1–2',
		sent: '1,380 and 1,406 sent',
		what: (
			<>
				<strong>45.1% and 44.3% opened</strong>, about twice the roughly 21%
				industry benchmark for health and insurance email, but only 1.8% and
				1.7% clicked.
			</>
		),
		change: 'Move the button above the fold and change it to “Check my eligibility,” and remove bounced addresses before every later send.',
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
		name: 'Agent calls',
		what: 'The caller ID and voicemail used a different program name than the mail and email.',
		change: 'Fixed in week 1, since it was in our own system: the caller ID and voicemail now matched the program’s name, so a call felt like the letter members already had.',
	},
];

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

// Figure 10 — the touchpoint scorecard, then the three redesigns it led to.
function Scorecard() {
	return (
		<Fig
			id="fig-score"
			title="What each touchpoint did, and what I would change"
			caption="Cohort 1. The campaign hit its goal, so the plan kept its approved materials; I documented these recommendations instead. The redesigns apply them to the postcard, email, and text, recreated with a fictional brand: as shipped on the left, redesigned on the right."
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
			<div className="sub-h">Redesigned</div>
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
								<span>As shipped</span>
								{r.before}
							</div>
							<div>
								<span className="new">Redesign</span>
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
		<section className="dec" id="c3">
			<SectionHead
				label="Decision 3 · Teams and systems"
				title="Scale the service: make what worked the standard"
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
						<strong>Automated list scrubbing:</strong> an engineer scrubbed our
						clients’ lists against the portal and the call-center app by hand,
						about an hour a day, a step on our service blueprints for years. I
						automated it, so enrolled members weren’t called again.
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
			<CohortsFigure />
			<Scorecard />
			<Fig id="fig-scale" className="res-fig" expandable={false} title="Scale outcomes">
				<Results
					stats={[
						{
							n: 'Standard',
							c: 'Several of the campaign’s new touchpoints became the default for future implementations',
						},
						{
							n: 'Up to ~6 wks',
							c: 'Engineering time saved a year: a daily hour of matching patient lists by hand, usually by our analytics engineer and sometimes escalated to our lead engineer or CTO, became one repeatable query',
						},
					]}
				/>
			</Fig>
			<Copy style={{ marginTop: 28 }}>
				Today I build the same way, with less wait: I hand-code full-stack apps
				and prototype most experiments with Claude Code, so a bet like the portal
				can be tested in hours.
			</Copy>
		</section>
	);
}
