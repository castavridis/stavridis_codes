import { SectionTitle } from './shared';

const PRINCIPLES = [
	['Treat “no” as research', 'Decline reasons gave the journey its structure.'],
	['Operators are users', 'The agents’ experience set the ceiling on every member’s.'],
	['Measure the system, not just the campaign', 'Touchpoint-level data showed which pieces earned their cost.'],
	[
		'Keep measuring past the goal',
		'Once we passed 20%, we moved on before comparing our Medicare Advantage and commercial results.',
	],
];

export function Learned() {
	return (
		<section id="learned">
			<SectionTitle>What I Learned</SectionTitle>
			<div className="principles">
				{PRINCIPLES.map(([h, p]) => (
					<div key={h}>
						<h4>{h}</h4>
						<p>{p}</p>
					</div>
				))}
			</div>
		</section>
	);
}

export function Team() {
	return (
		<section id="team">
			<p className="team">
				<b>Team</b> C Stavridis (project lead, strategy, design, and engineering) ·
				Emily Fischer and Erika Halsey (Account Success) · Jamie Lawrence (Graphic
				Design) · Evan Huang, Nathan Beck, and Andrew Warshauer (Engineering and
				analytics) · Jordan Drury (Enrollment operations) · Joe McDonald (COO)
			</p>
			<div className="back">
				<button
					type="button"
					className="btn ghost"
					onClick={(e) => {
						// Top of the case study's sheet (MDXLayout's data-case root).
						e.currentTarget.closest('[data-case]')?.scrollIntoView({ behavior: 'smooth' });
					}}
				>
					Back to top ↑
				</button>
			</div>
		</section>
	);
}
