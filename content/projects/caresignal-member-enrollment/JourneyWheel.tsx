import { useEffect, useRef } from 'react';

import Figure from '../../../src/features/projects/components/figures/Figure';

import './journey-wheel.css';
import { mountJourneyWheel } from './journey-wheel';

const LINDA = '/images/projects/caresignal-member-enrollment/linda.jpg';

const OBSTACLES: { c: string; text: string; stat?: string }[] = [
	{ c: 'var(--p1)', text: 'Happiness with existing resources', stat: '42.1% of past declines cited this reason' },
	{ c: 'var(--p2)', text: 'Belief their condition is not an issue', stat: '10.0% of past declines cited this reason' },
	{ c: 'var(--p3)', text: 'Desire to speak with a spouse or doctor first', stat: '7.7% of past declines cited this reason' },
	{ c: 'var(--p4)', text: 'Hard-to-reach members could take agents eight or more calls to reach' },
];

// Figure 1 — "vision": the four obstacles, the six-week journey that
// answered them (a watercolour wheel around the Linda persona), and
// "results": cohort 1's cumulative enrollment on the same calendar.
// Static markup here; journey-wheel.js draws the wheel and chart and wires
// the hovers and popovers.
export function JourneyWheel() {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const root = ref.current;
		if (!root) return;
		return mountJourneyWheel(root, { linda: LINDA });
	}, []);

	return (
		<div ref={ref} className="wh">
			<figure className="fig" aria-labelledby="wh-figh">
				<div className="fig-top">
					<Figure />
					<button
						type="button"
						className="info"
						aria-expanded="false"
						aria-controls="wh-pop"
						aria-label="Sources"
					>
						i
					</button>
				</div>
				<div className="pop src" id="wh-pop" role="dialog" aria-label="Sources" hidden>
					<b>Sources</b>
					<p>
						Decline reasons from all CareSignal outreach campaigns; the 8+ calls
						figure is from call-only campaigns. Touchpoint timing from the
						campaign schedule. The campaign followed my original strategy with one
						change: a one-to-four-week pause before phase 4, sized to call-center
						capacity. Weekly enrollment figures are from cohort 1. Phase colors
						match the campaign’s original phase palette, painted with Washes.js.
					</p>
				</div>
				<div className="split">
					<div className="chalwrap">
						<h2 className="fig-h" id="wh-figh">
							<em className="hl-label">vision</em> One journey designed to
							overcome the biggest barriers to enrollment.
						</h2>
						<ol className="chal">
							{OBSTACLES.map((o, i) => (
								<li key={o.text} data-state="idle" style={{ ['--c' as string]: o.c }}>
									<span className="cbadge">{i + 1}</span>
									<div className="ct">
										<b>
											<span className="vh">Obstacle {i + 1}: </span>
											{o.text}
										</b>
										{o.stat ? <span className="cs">{o.stat}</span> : null}
									</div>
								</li>
							))}
						</ol>
					</div>
					<div className="journeycol">
						<div className="stage" role="img" aria-labelledby="wh-figh" aria-describedby="wh-desc">
							<div className="wash ring-mask washA" />
							<div className="wash washD" />
							<svg className="wh-svg" viewBox="0 0 720 720" aria-hidden="true" />
							<div className="tip" />
							<button
								type="button"
								className="persona"
								aria-expanded="false"
								aria-controls="wh-ppop"
							>
								Linda, 68
								<span className="pi" aria-hidden="true">
									i
								</span>
								<span className="vh"> (about this persona)</span>
							</button>
							<div className="pop ppop" id="wh-ppop" role="dialog" aria-label="About Linda, 68" hidden>
								<b>About Linda, 68</b>
								<p>
									A persona drawn from the campaign’s population, members living
									with heart failure and COPD: an older adult who already uses her
									phone every day, including for her health, and texts daily.
								</p>
								<p>
									When a postcard arrives about a free program, her first question
									isn’t what it does. It’s “Is this really from my health plan?”
								</p>
								<p className="pstat">
									In 2017, 73% of adults aged 60–69 owned a smartphone, 88% of
									those owners used it to text, message, or email, and 1 in 3 spent
									their phone time on health-related tasks.
								</p>
								<p className="pnote last">
									Linda is a composite, not a real member. The portrait is
									illustrative.
								</p>
							</div>
							<div className="pop phpop" id="wh-phpop" role="dialog" aria-label="Why this phase" hidden />
						</div>
					</div>
				</div>
				<div className="wkc">
					<h3 className="wh-title">
						<em className="hl-label">results</em> Enrollments exceeded our goal in
						less than five weeks.
					</h3>
					<div className="wkc-stage">
						<svg className="csvgB" aria-hidden="true" />
						<div className="wash washC" />
						<svg
							className="csvg"
							role="img"
							aria-label="Cohort 1 cumulative enrollment by week, drawn on the same six-week calendar as the journey: 6.1% after week 1, 12.3% after week 2, 16.1% after week 3, 19.2% after week 4, and 21.2% after week 5, against a 20% goal and a 5% benchmark for a similar member population."
						/>
					</div>
				</div>
				<p id="wh-desc" hidden>
					A six-week enrollment journey drawn as a ring around a photo of a member
					on the phone. Phase 1 (two weeks) answers members happy with existing
					resources, 42.1% of those who declined; phase 2 (two weeks) answers the
					10% who didn’t see their condition as an issue; phase 3 (one week)
					answers the 7.7% who wanted to speak with a spouse or doctor first,
					ending with a last-chance deadline. After one to four weeks of silence,
					phase 4 (one week) picks up members who just missed that deadline,
					including the hardest to reach, who could take eight or more calls.
					Sixteen touchpoints by mail, email, call, and text radiate from the ring
					at the time each was sent.
				</p>
			</figure>
		</div>
	);
}
