import { useEffect } from 'react';

import Text from '../../../src/components/Text';
import Citation from '../../../src/features/projects/components/figures/Citation';
import WashHighlight from '../../../src/features/projects/components/figures/WashHighlight';
import WashHighlightFX, {
	type WashHandle,
} from '../../../src/features/projects/components/figures/wash-highlight';
import {
	afterPageLoad,
	prefersReducedMotion,
} from '../../../src/features/projects/components/figures/motion';

import { CITATIONS } from './citations';
import { Fig } from './shared';

// The headline's result gets a wash underline, as in the clinician case
// study. MDXLayout renders the headline from a frontmatter string, so the
// phrase is found and wrapped at runtime (FrontMatterWashes' approach).
const HEADLINE_PHRASE = 'quadrupled our 5% benchmark to 21%';

function wrapPhrase(root: HTMLElement, phrase: string): HTMLElement | null {
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
	for (let node = walker.nextNode(); node; node = walker.nextNode()) {
		const i = (node.textContent ?? '').indexOf(phrase);
		if (i < 0) continue;
		const range = document.createRange();
		range.setStart(node, i);
		range.setEnd(node, i + phrase.length);
		const span = document.createElement('span');
		try {
			range.surroundContents(span);
		} catch {
			return null;
		}
		return span;
	}
	return null;
}

function HeadlineWash() {
	useEffect(() => {
		let handle: WashHandle | null = null;
		let cancelled = false;
		afterPageLoad(500).then(() => {
			if (cancelled) return;
			const h1 = [...document.querySelectorAll<HTMLElement>('h1')].find((n) =>
				n.textContent?.includes(HEADLINE_PHRASE),
			);
			if (!h1) return;
			// Reuse the span a previous mount left behind (HMR, re-reveal).
			const span =
				h1.querySelector<HTMLElement>('[data-wash-underline]') ?? wrapPhrase(h1, HEADLINE_PHRASE);
			if (!span) return;
			span.setAttribute('data-wash-underline', '');
			const reduce = prefersReducedMotion();
			handle = WashHighlightFX.attach(span, {
				mark: 'underline',
				pigment: 'hansa',
				delay: 64,
				threshold: 1,
				duration: reduce ? 1 : 650,
				instantDry: true,
				...(reduce ? { instant: true } : null),
			});
		});
		return () => {
			cancelled = true;
			handle?.destroy();
		};
	}, []);
	return null;
}

// The lead below the headline (frontmatter `introduction` is the plain-text
// version; introBelowHero keeps FrontMatter from rendering it).
export function Introduction() {
	return (
		<div className="mt-[20px]" id="impact">
			<HeadlineWash />
			<Text variant="copy-large" className="lead">
				As CareSignal’s VP of Product and its “enrollment czar,”{' '}
				<strong>
					<WashHighlight
						mark="underline"
						pigment="hansa"
						delay={360}
						threshold={1}
						duration={650}
						instantDry
					>
						I owned enrollment and our product roadmap.
					</WashHighlight>
				</strong>{' '}
				When we were challenged to meet a health plan CMO’s imperative to enroll
				20% of eligible members, it came down to this:{' '}
				<strong>
					How might we enroll more members without additional staff or
					compromising members’ trust?
				</strong>
			</Text>
		</div>
	);
}

// Figure 2 — the outcomes beyond the headline result.
export function AdditionalOutcomes() {
	return (
		<Fig id="fig-outcomes" className="res-fig" expandable={false} title="Additional outcomes">
			<div className="stats">
				<div>
					<div className="n">+52%</div>
					<div className="c">
						Enrollments per agent hour, so the same team enrolled more members
						<Citation {...CITATIONS.kpi} />
					</div>
				</div>
				<div>
					<div className="n">−33%</div>
					<div className="c">
						Cost per enrollment, from $7.05 to $4.71 over the following year
						<Citation {...CITATIONS.kpi} />
					</div>
				</div>
				<div>
					<div className="n">24 of 33</div>
					<div className="c">
						First enrollments came through the self-enrollment portal, before any
						agent called
						<Citation {...CITATIONS.touch} />
					</div>
				</div>
				<div>
					<div className="n">≤2 calls</div>
					<div className="c">
						Needed to reach 20% conversion, at least 75% fewer than the 8+ it took
						to reach the hardest-to-reach members
						<Citation {...CITATIONS.sched} />
					</div>
				</div>
			</div>
		</Fig>
	);
}
