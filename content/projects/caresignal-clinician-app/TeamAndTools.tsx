import Section from '../../../src/features/projects/components/Section';

import { SectionHeading } from './shared';

const TEAMS = [
	{
		label: 'Sales',
		people: 'Joe McDonald (President & COO), Blake Marggraff (CEO)',
	},
	{
		label: 'Account Success',
		people: 'Emily Fischer (VP, Account Success), Erika Halsey (Account Manager)',
	},
	{
		label: 'Clinical',
		people: 'Dr. Avik Som (CMO), Robert Peters (Director, Clinical Operations)',
	},
	{
		label: 'Engineering',
		people:
			'Evan Huang (CTO), Nathan Beck (Engineering Lead), Andy Garvin (Software Engineer), Darius Calliet (Software Engineer)',
	},
];

// A full-width mono colophon under a top rule, per the design.
export function TeamAndTools() {
	return (
		<Section>
			<div className="w-full border-t border-confetti-black/12 pt-[32px]">
				<SectionHeading id="team-and-tools">Team and Tools</SectionHeading>
				<div
					className="mt-[16px] flex flex-col gap-[4px] text-confetti-black"
					style={{
						fontFamily: 'var(--font-mono)',
						fontSize: 14,
						lineHeight: 1.6,
						letterSpacing: '0.01em',
					}}
				>
					<p className="m-0">
						<strong className="font-bold">Tools</strong> Sketch, Figma, React,
						TypeScript, CoffeeScript, Pug, SCSS, Blueprint.js, Storybook,
						axe-core, Node.js, Sequelize
					</p>
					<p className="m-0">
						<strong className="font-bold">Teams</strong>
					</p>
					<ul className="m-0" style={{ padding: '0 0 0 18px', listStyleType: "'· '" }}>
						{TEAMS.map((team) => (
							<li key={team.label}>
								{team.label}: {team.people}
							</li>
						))}
					</ul>
				</div>
			</div>
		</Section>
	);
}
