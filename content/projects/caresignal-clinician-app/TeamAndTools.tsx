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

export function TeamAndTools() {
	return (
		<Section>
			<div className="flex w-full max-w-[705px] flex-col xl:ml-auto gap-[16px]">
				<SectionHeading id="team-and-tools">Team and Tools</SectionHeading>
				<p className="type-copy m-0 text-confetti-black/80">
					<strong className="text-confetti-black">Tools</strong> Sketch,
					Figma, React, TypeScript, CoffeeScript, Pug, SCSS, Blueprint.js,
					Storybook, axe-core, Node.js, Sequelize
				</p>
				<div className="flex flex-col gap-[8px]">
					<p className="type-copy m-0 font-bold text-confetti-black">Teams</p>
					<ul className="m-0 flex flex-col gap-[8px] pl-[20px]">
						{TEAMS.map((team) => (
							<li key={team.label} className="type-copy text-confetti-black/80">
								<strong className="text-confetti-black">{team.label}:</strong>{' '}
								{team.people}
							</li>
						))}
					</ul>
				</div>
			</div>
		</Section>
	);
}
