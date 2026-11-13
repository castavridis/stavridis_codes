import { Fragment } from 'react';

import { SectionHead } from './shared';

const LEARNINGS: [string, string][] = [
	['Treat “no” as research.', 'Decline reasons gave the journey its structure.'],
	[
		'Automate the work around the conversation.',
		'Voicemail drops, a two-line dialer, and a report in the format managers already used gave agents time back for the calls that earned members’ trust.',
	],
	[
		'Measure the system, not just the campaign.',
		'Touchpoint-level data showed which pieces earned their cost.',
	],
	[
		'Build the handoff before the finish line.',
		'Soon after we passed 20%, the work lost its owner. We had collected rich touchpoint data in Segment, but no one was assigned to review it and turn it into changes, and the conversion reporting lived in my own SQL queries, so the campaigns that followed ran without anyone measuring them. The journey still needed refining with Account Success and Enrollment before it could become the standard. Next time I’d name an owner for the data and the decisions it drives, make the measurement a shared tool, and plan the handoff before launch.',
	],
];

export function Learned() {
	return (
		<section id="learnings">
			<SectionHead label="Key Learnings" title="What I carry forward" />
			<ul className="clean">
				{LEARNINGS.map(([lead, rest]) => (
					<li key={lead}>
						<strong>{lead}</strong> {rest}
					</li>
				))}
			</ul>
		</section>
	);
}

const TEAM: [string, string][] = [
	['Project lead, strategy, design, and engineering', 'C Stavridis (VP of Product and Co-Founder)'],
	['Account Success', 'Emily Fischer (VP, Account Success), Erika Halsey (Senior Account Manager)'],
	['Design', 'Jamie Lawrence (Graphic Designer)'],
	[
		'Engineering and analytics',
		'Evan Huang (CTO), Nathan Beck (Engineering Lead), Andrew Warshauer (Software Engineer)',
	],
	['Enrollment operations', 'Jordan Drury (Enrollment Team Co-Lead)'],
	['Leadership', 'Joe McDonald (President, COO, and Co-Founder)'],
];

export function Team() {
	return (
		<section id="team">
			<div className="label">Team</div>
			<p className="team">
				{TEAM.map(([role, people], i) => (
					<Fragment key={role}>
						{i ? <br /> : null}
						<b>{role}</b> {people}
					</Fragment>
				))}
			</p>
		</section>
	);
}
