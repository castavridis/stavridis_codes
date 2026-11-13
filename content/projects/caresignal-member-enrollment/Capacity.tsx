import { useState } from 'react';

import Citation from '../../../src/features/projects/components/figures/Citation';

import { CITATIONS } from './citations';
import { Beat, Copy, Fig, Results, SectionHead } from './shared';

// Pickup rate across 76,619 leads in our calling data.
const P = 0.48;
const Q = 1 - P;

const NOTES: Record<number, string> = {
	1: 'One at a time: agents reach someone on fewer than half of dials and wait through the rest.',
	2: 'Two at a time: agents reach someone on about 73% of dials, and fewer than 1 in 4 dials leaves a second member on the line. This is what we built.',
	3: 'Three at a time: nearly half of dials would leave someone picking up to be placed on hold, a fast way to lose trust.',
	4: 'Four at a time: about two in three dials would drop a member. Connections barely improve.',
};

function DialerFigure() {
	const [n, setN] = useState(2);
	// Agent reaches someone: at least one pickup. On hold: two or more
	// pickups on the same dial (members pick up independently).
	const reach = 1 - Q ** n;
	const hold = 1 - Q ** n - n * P * Q ** (n - 1);

	return (
		<Fig
			id="fig-dialer"
			title="Dialing two members at once raised connections without breaking trust; three would not have"
			caption="Modeled from a 48% pickup rate across 76,619 leads in our calling data, assuming members pick up independently. “Picks up to be placed on hold” is the chance more than one member answers the same dial."
		>
			<div className="dial-controls" role="group" aria-label="Members dialed at once">
				<span className="dl">Members dialed at once</span>
				{[1, 2, 3, 4].map((k) => (
					<button key={k} type="button" aria-pressed={k === n} onClick={() => setN(k)}>
						{k}
					</button>
				))}
			</div>
			<div className="dial-bars">
				<Bar label="Agent reaches someone" value={reach} color="var(--cerulean)" />
				<Bar label="A member picks up to be placed on hold" value={hold} color="#a50e53" />
			</div>
			<p className="f2-note" aria-live="polite">
				{NOTES[n]}
			</p>
		</Fig>
	);
}

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
	return (
		<div className="db">
			<div className="db-l">{label}</div>
			<div className="db-t">
				<div className="db-f" style={{ ['--pc' as string]: color, width: `${value * 100}%` }} />
			</div>
			<div className="db-n">{Math.round(value * 100)}%</div>
		</div>
	);
}

export function Capacity() {
	return (
		<section className="dec" id="c1">
			<SectionHead
				label="Decision 1 · Operators"
				title="Improve capacity: make every agent hour count"
			/>
			<Beat label="The challenge">
				<Copy>
					Our CEO named agent idle time as the leading indicator of enrollment
					cost. We had few engineers and little time.
				</Copy>
			</Beat>
			<Beat label="What I did">
				<Copy>
					I shadowed agents on live calls and led a cross-departmental committee
					of enrollment, engineering, and account success leads and an analytics
					engineer. Then I audited every reporting page in our call-center app
					with our enrollment managers: most went unused. Instead of building
					another dashboard, I wrote requirements for exactly what they needed
					and defended them with our CTO and lead engineers:
				</Copy>
				<ul className="clean">
					<li>
						<strong>An agent performance export,</strong> one Excel sheet built
						by an engineer I delegated, in the format managers already reported
						in. Managers used it in one-on-ones to remove each agent’s barriers.
					</li>
					<li>
						<strong>Automatic voicemail drops</strong>, cutting the long gaps
						between calls.
					</li>
					<li>
						<strong>A two-line power dialer</strong> that moved to the next
						member on its own.
					</li>
				</ul>
			</Beat>
			<DialerFigure />
			<Beat label="The tradeoff">
				<Copy>
					Simultaneously dialing more than two lines meant more connections, but
					also more members picking up to be placed on hold. For a service asking
					strangers to trust automated calls, that cost was real, so I stopped at
					two.
				</Copy>
			</Beat>
			<Fig id="fig-capacity" className="res-fig" expandable={false} title="Capacity outcomes">
				<Results
					stats={[
						{
							n: '+37%',
							c: (
								<>
									Quarterly calls in three months, to 192,000+
									<Citation {...CITATIONS.kpi} />
								</>
							),
						},
						{
							n: '180→275',
							c: (
								<>
									A senior agent’s usual daily calls vs. her best day in her first
									week on the dialer
									<Citation {...CITATIONS.dialer} />
								</>
							),
						},
						{
							n: '+52%',
							c: (
								<>
									Enrollments per agent hour over the next year
									<Citation {...CITATIONS.kpi} />
								</>
							),
						},
						{
							n: '59→52%',
							c: (
								<>
									Agent idle time over the same period
									<Citation {...CITATIONS.kpi} />
								</>
							),
						},
					]}
				/>
			</Fig>
		</section>
	);
}
