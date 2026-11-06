import { useEffect } from 'react';

// Case-study-scoped style overrides, ported from the design's `#nurse-case`
// helmet block. Scoped to this case study via the `data-case` attribute
// MDXLayout sets from the project slug, so the shared FrontMatter / chrome
// row pick these up here without affecting other case studies.
const SCOPE = '[data-case="caresignal-clinician-app"]';

const CSS = `
/* Paper for every figure, placeholder and principle card: Figure 1's light
   cream (#fdfbf5). The design overrides the washes paper token for this case
   study; the site-wide value (#fbf6ea) stays everywhere else. */
${SCOPE} {
	--color-washes-paper: #fdfbf5;
}

/* Body copy: 20px / 1.45 here (the site-wide type-copy-large stays 24/32).
   Paragraph gaps are 16px on the prose columns themselves. */
${SCOPE} .type-copy-large {
	font-size: 20px;
	line-height: 1.45;
}

/* Title line above the tag row in the sticky chrome (design adds it via a
   ::before on the tag paragraph). !important beats MDXLayout's inline
   scroll-linked opacity, as in the design. */
${SCOPE} p.type-tag {
	opacity: 1 !important;
	color: var(--color-confetti-black);
}
${SCOPE} p.type-tag::before {
	content: "CareSignal Clinician Application: Scaling Care Teams";
	display: block;
	font-family: var(--font-kyoto);
	font-weight: 500;
	font-size: 16px;
	line-height: 22px;
	margin-bottom: 2px;
	color: var(--color-confetti-black);
}
/* The scroll-reveal headline-meta is hidden; the chrome row keeps the title
   + tags. */
${SCOPE} p.type-headline-meta.absolute {
	display: none;
}

/* Keyboard focus: a 3px ink ring, offset 3px, on every focusable control. */
${SCOPE} :is(button, a, input, summary, [tabindex]):focus-visible {
	outline: 3px solid var(--focus-ink, var(--color-confetti-black)) !important;
	outline-offset: 3px !important;
	border-radius: 4px;
}

/* In-copy links: dotted underline, solid on hover (citation markers and
   nav links opt out with .no-underline, as the design does inline). */
${SCOPE} section a:not(.no-underline) {
	text-decoration: underline dotted;
	text-underline-position: from-font;
}
${SCOPE} section a:not(.no-underline):hover {
	text-decoration-style: solid;
}

/* Figure 1 "shift length" slider: thin rule track + a small round paper
   thumb, matching the workflow diagrams rather than the native control. */
${SCOPE} input[data-day-slider] {
	-webkit-appearance: none;
	appearance: none;
	height: 16px;
}
${SCOPE} input[data-day-slider]::-webkit-slider-runnable-track {
	height: 1.25px;
	background: var(--viz-ink, var(--color-confetti-black));
}
${SCOPE} input[data-day-slider]::-moz-range-track {
	height: 1.25px;
	background: var(--viz-ink, var(--color-confetti-black));
}
${SCOPE} input[data-day-slider]::-webkit-slider-thumb {
	-webkit-appearance: none;
	width: 12px;
	height: 12px;
	margin-top: -5.4px;
	border-radius: 50%;
	border: 1.25px solid var(--viz-ink, var(--color-confetti-black));
	background: var(--color-washes-paper);
}
${SCOPE} input[data-day-slider]::-moz-range-thumb {
	width: 10px;
	height: 10px;
	border-radius: 50%;
	border: 1.25px solid var(--viz-ink, var(--color-confetti-black));
	background: var(--color-washes-paper);
}
${SCOPE} input[data-day-slider]:hover::-webkit-slider-thumb,
${SCOPE} input[data-day-slider]:focus-visible::-webkit-slider-thumb {
	background: var(--viz-ink, var(--color-confetti-black));
}
${SCOPE} input[data-day-slider]:focus {
	outline: none;
}
`;

type HandWindow = typeof window & { WashHighlightHand?: 'left' | 'left-hook' | 'right' };

export function CaseStudyStyle() {
	// The design draws every wash highlight on this page left-handed
	// (window.WashHighlightHand = 'left'); the engine reads it at attach time
	// for calls that don't pass `hand`. This component is first in the MDX,
	// so its effect runs before any later sibling's highlight attaches.
	useEffect(() => {
		const w = window as HandWindow;
		w.WashHighlightHand = 'left';
		return () => {
			if (w.WashHighlightHand === 'left') delete w.WashHighlightHand;
		};
	}, []);
	return <style dangerouslySetInnerHTML={{ __html: CSS }} />;
}
