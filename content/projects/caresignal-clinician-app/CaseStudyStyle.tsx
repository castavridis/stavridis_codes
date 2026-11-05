// Case-study-scoped style overrides, ported from the design's `#nurse-case`
// helmet block. Scoped to this case study via the `data-case` attribute
// MDXLayout sets from the project slug, so the shared FrontMatter / chrome
// row pick these up here without affecting other case studies.
const SCOPE = '[data-case="caresignal-clinician-app"]';

const CSS = `
/* Title line above the tag row in the sticky chrome (design adds it via a
   ::before on the tag paragraph). */
${SCOPE} p.type-tag {
	opacity: 1;
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

/* Opening headline: slightly smaller + tighter than the default 48/60. */
@media (min-width: 768px) {
	${SCOPE} h1.type-headline {
		font-size: 42px !important;
		line-height: 1.14 !important;
	}
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

export function CaseStudyStyle() {
	return <style dangerouslySetInnerHTML={{ __html: CSS }} />;
}
