import type { ReactNode } from 'react';

import Citation from '../../../src/features/projects/components/figures/Citation';

import { CITATIONS } from './citations';
import {
	Email,
	Letter,
	PortalForm,
	PortalHelp,
	PortalSettings,
	PostcardBack,
	PostcardFront,
	SmsIntro,
} from './fernwood';
import { ServiceBlueprint } from './ServiceBlueprint';
import { Beat, Carousel, Copy, Fig, Results, SectionHead } from './shared';

function TouchpointStrip() {
	return (
		<Fig
			id="fig-strip"
			title="The first touchpoints a member received"
			caption="Recreated with a fictional brand, Fernwood Health, from the materials as approved."
		>
			<div className="strip-pc">
				<div className="mk mk-pc" role="img" aria-label="Invitation postcard, front and back.">
					<PostcardFront />
					<PostcardBack />
				</div>
				<span>Invitation postcard with three ways to enroll</span>
			</div>
			<div className="strip">
				<div>
					<Email />
					<span>Email with Quick Access Code</span>
				</div>
				<div>
					<Letter />
					<span>Physician leader’s letter</span>
				</div>
				<div>
					<SmsIntro />
					<span>Texts under 160 characters</span>
				</div>
			</div>
		</Fig>
	);
}

type Screen = { title: string; img: ReactNode; two?: boolean; friction: string; fix: string };

const SCREENS: Screen[] = [
	{
		title: 'One tap from the email',
		two: true,
		img: (
			<>
				<Email short />
				<PortalForm url="fhp.link/join?c=07BH6L9K" />
			</>
		),
		friction: 'Copying a code from an email into a form, often on a phone.',
		fix: 'The email’s button carries the member’s code into the portal, so the form arrives filled in. Codes are printed with a space (“07BH 6L9K”) to make them easier to read, and members can type them with or without it.',
	},
	{
		title: 'No account, no password',
		img: <PortalForm url="fhp.link/join" tip />,
		friction: 'Creating an account and remembering a password are extra steps where people give up.',
		fix: 'Members verify with what they already know: their name as it appears on their card, date of birth, ZIP Code, and code. Every field has plain-language help.',
	},
	{
		title: 'A way back for lost letters',
		img: <PortalHelp />,
		friction: 'Letters and emails get lost, and without the code a member is stuck.',
		fix: 'Members can use their Member ID instead, and “Can’t find your unique code?” shows exactly where to find it on their card.',
	},
	{
		title: 'Settings that feel like a choice, not a commitment',
		img: <PortalSettings />,
		friction: 'Our agents heard members worry the program would be a “strait jacket,” with check-ins every day.',
		fix: 'Members choose calls or texts, English or Spanish, a time, and two days a week. Their program is pre-selected from their eligibility, with optional help for housing, food, or transportation, and choosing texts shows a plain notice that texts aren’t encrypted.',
	},
	{
		title: 'Catch mistakes before they cost a check-in',
		img: <PortalSettings confirm />,
		friction: 'A mistyped phone number means a member never hears from their care team.',
		fix: 'A confirmation dialog asks members to double-check, and the final screen gives a number to call to update their details.',
	},
];

function PortalFigure() {
	return (
		<Fig
			id="fig-portal"
			title="The self-enrollment portal: each screen removes one reason to give up"
			caption="Recreated with a fictional brand from the self-enrollment portal I designed, which each health plan client co-branded. Sample member data."
		>
			<Carousel
				label="Self-enrollment portal, five screens"
				titles={SCREENS.map((s) => s.title)}
				dotLabel={(i, t) => `Go to screen ${i + 1}: ${t}`}
			>
				{SCREENS.map((s) => (
					<div key={s.title} className="pf-row">
						<div className={s.two ? 'pf-img two' : 'pf-img'}>{s.img}</div>
						<div className="pf-txt">
							<h4>{s.title}</h4>
							<p>
								<b>Friction</b>
								{s.friction}
							</p>
							<p>
								<b>Fix</b>
								{s.fix}
							</p>
						</div>
					</div>
				))}
			</Carousel>
		</Fig>
	);
}

export function Trust() {
	return (
		<section className="dec" id="c2">
			<SectionHead
				label="Decision 2 · Members and families"
				title="Build trust: earn a stranger’s yes, fast"
			/>
			<Beat label="The challenge">
				<Copy>
					We couldn’t keep adding agents. The plan’s commercial and Medicare
					Advantage members had never heard of us, and they declined for reasons
					that had nothing to do with technology: 42.1% were happy with what they
					had, 10% didn’t see their condition as a problem, and 7.7% wanted to ask
					a spouse or doctor first.
				</Copy>
			</Beat>
			<Beat label="What I did">
				<Copy>
					I had designed and engineered nearly all of our enrollment touchpoints,
					but they were deployed one at a time, or in combinations chosen by gut
					rather than by a strategy anyone could explain. I connected them into
					one journey, with each phase answering one obstacle to enrollment.
				</Copy>
				<ul className="clean">
					<li>
						<strong>Familiar names:</strong> the plan’s brand, a letter from its
						physician leader, and one program name across mail, email, and caller
						ID.
					</li>
					<li>
						<strong>A clear difference:</strong> unlike the plan’s other programs,
						every member got a dedicated nurse care manager.
					</li>
					<li>
						<strong>One step to yes:</strong> a co-branded portal I prototyped and
						built (WCAG 2.1 AA), a personal Quick Access Code on every touchpoint,
						and a phone number for members who weren’t online. Every word was
						written at a sixth-grade level and approved by CMS.
					</li>
					<li>
						<strong>Answers at the doctor’s office:</strong> one-pagers for
						providers and front desks, for the members who asked there first.
					</li>
				</ul>
			</Beat>
			<Beat label="The tradeoff">
				<Copy>
					Persistence versus annoyance. Some members took eight or more calls, but
					I capped outreach at five rounds and added a pause so final calls landed
					when agents had room for them.
				</Copy>
			</Beat>
			<TouchpointStrip />
			<PortalFigure />
			<Fig id="fig-trust" className="res-fig" expandable={false} title="Trust outcomes">
				<Results
					stats={[
						{
							n: '$79→$19',
							c: (
								<>
									Cost per enrollment once agent calls reached members who had
									already heard from us by mail, email, and text
									<Citation {...CITATIONS.cost} />
								</>
							),
						},
						{
							n: '45%',
							c: (
								<>
									Email open rate, about twice the average for health and insurance
									email
									<Citation {...CITATIONS.email} />
								</>
							),
						},
					]}
				/>
			</Fig>
			<Copy style={{ marginTop: 28 }}>
				<strong>What contributed most.</strong> Our touchpoint tracking points to
				three decisions: the one-step portal (24 of the first 33 enrollments came
				through it before any agent called), agent calls layered onto members who
				had already heard from us (cost per enrollment fell from about $79 to $19
				once calls began), and the email (45% opens). The best benchmark is an
				earlier campaign I designed for another payer in the same region, reaching
				a similar population that was also partly covered by CMS programs: it
				converted 5%. We never ran a controlled comparison, so I credit the
				coordinated journey as a whole rather than any single piece. Some past
				campaigns without educational outreach also reached 21%, but for different
				clients and populations.
			</Copy>
			<details className="more">
				<summary>View the full service blueprint</summary>
				<ServiceBlueprint />
			</details>
		</section>
	);
}
