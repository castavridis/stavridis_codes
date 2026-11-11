import Text from '../../../src/components/Text';

import { PostcardBack, PostcardFront } from './fernwood';

const STATS = [
	{ n: '21%', c: 'Enrollment conversion, exceeding the client’s 20% target, up from 5% in a comparable campaign' },
	{ n: '192K+', c: 'Quarterly outbound calls, up 37% within three months' },
	{ n: '+52%', c: 'Enrollments per agent hour' },
	{ n: '3', c: 'More populations reused the approach, including 141 self-enrollments in one week' },
];

// Role line, summary, headline stats, and the invitation postcard. The h1
// comes from MDXLayout's FrontMatter (frontmatter `headline`).
export function Introduction() {
	return (
		<div className="mt-[16px]">
			<div className="role">
				VP of Product &amp; enrollment lead · Product design, service design, design
				engineering · 2021–2022
			</div>
			<Text variant="copy-large" className="summary" style={{ marginTop: 24 }}>
				Remote monitoring only helps people who enroll. As CareSignal’s product
				roadmap owner and “enrollment czar,” I redesigned how members joined,
				from the tools our call center used to the outreach a health plan’s
				members received, and exceeded the client’s 20% enrollment target.
			</Text>

			<div className="stats">
				{STATS.map((s) => (
					<div key={s.n}>
						<div className="n">{s.n}</div>
						<div className="c">{s.c}</div>
					</div>
				))}
			</div>

			<div className="hero-img">
				<div
					className="mk mk-pc"
					role="img"
					aria-label="The campaign’s invitation postcard, front and back, recreated with a fictional brand."
				>
					<PostcardFront />
					<PostcardBack />
				</div>
			</div>
		</div>
	);
}
