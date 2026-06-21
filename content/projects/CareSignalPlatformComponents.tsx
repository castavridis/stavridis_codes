import {
	MDXWrapper,
	MDXColumn,
} from '../../src/components/mdx/Layout';
import Callout from '../../src/features/projects/components/Callout';

export function Intro () {
	return (
		<MDXWrapper>
			<MDXColumn span={12}>
				<Callout
					title="Guiding Principle"
					content={
						<span style={{
							hangingPunctuation: 'first',
						}}>
							“You have to understand... Everybody is busy. All&nbsp;we’re doing is putting out fires and we just want to know if a fire is put out and move on to  the next one.”
						</span>
				}
					attribution={
						<span>
							<span className="font-bold">CareSignal User</span>, RN and Diabetes Educator
						</span>
					} />
			</MDXColumn>
		</MDXWrapper>
	)
}

export function Situation () {
	return (
		<div>
			<MDXWrapper gap={28}>
				<MDXColumn span={9}>
					<h2>
						Clinical users work within complex software environments with heightened scrutiny.
					</h2>
					<p>
						Many of our users had to toggle between several information-dense interfaces in order to outreach patients and document their work. Although CareSignal offered integration, our platform needed to be usable out of the box to onboard teams in days, not months.
					</p>
				</MDXColumn>
				<MDXColumn>
					<img
						className="object-contain mx-auto"
						src="/images/projects/caresignal-platform/Monitors.png"
						alt="Two monitors, side-by-side. Each monitor has two applications. The left monitor has EMR and spreadsheet applications open. The right monitor has email and company chat open."
					/>
				</MDXColumn>
				<MDXColumn>
					<caption className="block w-full">
						<span className="font-bold block">A typical workstation for clinical users</span>
						Our users (both in-office and remote) navigated two or more large monitors, and a slew of applications.
					</caption>
				</MDXColumn>
			</MDXWrapper>
		</div>
	)
}
