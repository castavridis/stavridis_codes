import { goToSection } from './SectionNav';
import { Copy, SectionHead } from './shared';

const DECISIONS = [
	{
		id: 'c1',
		lead: 'Improve capacity',
		rest: ' by cutting agent downtime with better reporting, automatic voicemails, and a two-line dialer.',
	},
	{
		id: 'c2',
		lead: 'Build trust',
		rest: ' by turning member rejection data into one coordinated journey across mail, phone, email, and text.',
	},
	{
		id: 'c3',
		lead: 'Scale the service',
		rest: ' by connecting internal workflows and making the new touchpoints the standard for future implementations.',
	},
];

export function Problem() {
	return (
		<section id="problem">
			<SectionHead
				label="The problem"
				title="Enrollment was the bottleneck, and our channels looked like spam."
			/>
			<Copy>
				CareSignal checked in on people with chronic conditions through
				automated texts and calls on the phones they already had. No device
				meant a health plan could reach far more members, but it made enrollment
				the bottleneck. Trust is hard won in healthcare, and communications from
				our channels could easily look like spam. Our agents spent nearly 60% of
				their shifts idle, only 40% of the team stayed over eight months, and
				our last campaign for this population converted 5%.
			</Copy>
			<Copy>
				Then a health plan’s Chief Medical Officer wrote a 20% enrollment goal
				into our contract, and our COO made it a company mandate. Enrollment was
				already a quarterly priority on the roadmap I owned, and it came down to
				one question:{' '}
				<strong>
					how might we enroll more members without additional staff or
					compromising members’ trust?
				</strong>{' '}
				I answered it with three decisions:
			</Copy>
			<ol className="overview">
				{DECISIONS.map((d, i) => (
					<li key={d.id}>
						<b>{i + 1}</b>
						<a
							href={`#${d.id}`}
							onClick={(e) => {
								e.preventDefault();
								goToSection(d.id);
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
