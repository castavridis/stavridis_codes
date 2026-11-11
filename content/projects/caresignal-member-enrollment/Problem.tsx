import { Copy, SectionTitle } from './shared';

const DECISIONS = [
	{
		href: '#c1',
		lead: 'Improve capacity',
		rest: ' by cutting agent downtime with better reporting, automatic voicemails, and a two-line dialer.',
	},
	{
		href: '#c2',
		lead: 'Build trust',
		rest: ' by turning member rejection data into one coordinated journey across mail, phone, email, and text.',
	},
	{
		href: '#c3',
		lead: 'Scale the service',
		rest: ' by connecting internal workflows and making the approach repeatable for other populations.',
	},
];

export function Problem() {
	return (
		<section id="problem">
			<SectionTitle>The Problem</SectionTitle>
			<Copy>
				CareSignal checked in on people with chronic conditions through
				automated texts and calls on the phones they already had. No device
				meant a health plan could reach far more members, but it made enrollment
				the bottleneck. Trust is hard won in healthcare, and our channels looked
				like spam. Our agents spent nearly 60% of their shifts idle, only 40% of
				the team stayed from January to August, and our last campaign for this
				population converted 5%.
			</Copy>
			<Copy>
				Then a health plan’s Chief Medical Officer wrote a 20% enrollment goal
				into our contract, and our COO made it a company mandate. Enrollment was
				already a quarterly priority on the roadmap I owned, and it came down to
				one question:{' '}
				<strong>
					how could we enroll more members without adding staff or compromising
					members’ trust?
				</strong>{' '}
				I answered it with three decisions:
			</Copy>
			<ol className="overview">
				{DECISIONS.map((d, i) => (
					<li key={d.href}>
						<b>{i + 1}</b>
						<a
							href={d.href}
							onClick={(e) => {
								// In-page jump inside the sheet's own scrollport, without
								// touching the route's URL.
								const el = document.getElementById(d.href.slice(1));
								if (!el) return;
								e.preventDefault();
								el.scrollIntoView({ behavior: 'smooth' });
							}}
						>
							<strong>{d.lead}</strong>
							{d.rest}
						</a>
					</li>
				))}
			</ol>
		</section>
	);
}
