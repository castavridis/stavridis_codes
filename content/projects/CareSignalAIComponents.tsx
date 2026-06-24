import { ArrowUpRight } from 'lucide-react';

import { ProjectImage } from '../../src/components/mdx/Layout';
import Section from '../../src/features/projects/components/Section';
import Text from '../../src/components/Text';

// ---------------------------------------------------------------------------
// CareSignal AI — v2 case study (Figma node 4014:47015). Each section is a
// flattened panel asset from /public/images/projects/caresignal-ai laid out
// responsively (full-bleed images stack; two-column rows collapse to one
// column below md). FrontMatter (headline + intro) and the wash hero are
// rendered by MDXLayout, so the body starts at the iPad mockup.
//
// NOTE: the text-bearing panels (the three principle cards, the "engaged (n)"
// definition) ship as images with the copy baked in, so the descriptive
// `alt` carries that content for assistive tech. If we want them selectable /
// indexable later, they can be rebuilt as live markup.
// ---------------------------------------------------------------------------

const BASE = '/images/projects/caresignal-ai';

// Live demo the hero CTA links out to (carried over from the v1 case study).
const LIVE_SITE = 'https://caresignal-ai.vercel.app';

// Hero — iPad mockup + "View Live Site" link (Figma `Mockup + CTA`).
export function Hero() {
  return (
    <Section>
      <div className="flex flex-col items-center gap-[24px]">
        <ProjectImage
          src={`${BASE}/iPad%20Mockup.png`}
          alt="CareSignal AI on an iPad — a dark hero reading “There’s a lot of noise around Artificial Intelligence. Healthcare…”"
          className="w-full [filter:drop-shadow(0_6px_16px_rgba(0,0,0,0.18))]"
        />
        <a
          href={LIVE_SITE}
          target="_blank"
          rel="noreferrer noopener"
          className="type-copy text-confetti-black decoration-from-font [text-underline-position:from-font] inline-flex items-center gap-[4px] underline decoration-dotted"
        >
          View Live Site
          <ArrowUpRight size={16} strokeWidth={1.6} aria-hidden />
        </a>
      </div>
    </Section>
  );
}

// Design Details title + the four AI-stack cursor stickers (Figma `Group 63`).
export function Stickers() {
  return (
    <Section>
      <div className="flex flex-col gap-[24px]">
        <Text variant="headline-small" as="h2" className="m-0 text-confetti-black">
          Design Details
        </Text>
        <ProjectImage
          src={`${BASE}/Stickers.png`}
          alt="Four AI-stack cursor stickers in a row — “found rare data”, “use while hot”, “catch if you can”, and “actually powers models”."
        />
      </div>
    </Section>
  );
}

// IBM Watson sticker + engagement chart (Figma `Group 68`). Two columns at
// md+ (sticker ~1/3, chart ~2/3), stacked below.
export function DataChart() {
  return (
    <Section>
      <div className="flex flex-col items-start gap-[16px] md:flex-row">
        <div className="w-full md:w-[303px] md:shrink-0">
          <ProjectImage
            src={`${BASE}/IBM%20Sticker.png`}
            alt="A round sticker reading “We see you, IBM Watson!” with cartoon googly eyes."
          />
        </div>
        <div className="w-full min-w-0 md:flex-1">
          <ProjectImage
            src={`${BASE}/Graphs.png`}
            alt="A line chart showing trained patient engagement decaying over time."
          />
        </div>
      </div>
    </Section>
  );
}

// Three rare-data principles (Figma `Frame 137`). Stacked on mobile, three
// across at sm+.
export function Principles() {
  return (
    <Section>
      <div className="grid grid-cols-1 gap-[16px] sm:grid-cols-3">
        <ProjectImage
          src={`${BASE}/Data%201.png`}
          alt="Principle 1 — Extreme scarcity: rare data includes clinically-relevant, condition-specific sign and symptom data, even the metadata from a patient’s interaction with technology over time."
        />
        <ProjectImage
          src={`${BASE}/Data%202.png`}
          alt="Principle 2 — Brief actionability: rare data’s window of opportunity to inform clinical care or power predictive models is often less than ten days."
        />
        <ProjectImage
          src={`${BASE}/Data%203.png`}
          alt="Principle 3 — Proven efficacy: rare data, used correctly, impacts outcomes on its own — and becomes more powerful assimilated into predictive models, delivering better outcomes and higher ROI."
        />
      </div>
    </Section>
  );
}

// Gradient line-art illustration panel (Figma `Group 64`).
export function Illustrations() {
  return (
    <Section>
      <ProjectImage
        src={`${BASE}/Illustrations.png`}
        alt="A panel of line-art illustrations visualizing rare clinical data feeding predictive models."
      />
    </Section>
  );
}

// Closing definition + stacked-cards card (Figma `Group 66`). Definition
// panel ~2/3, stacked-cards card ~1/3 at md+, stacked below.
export function Close() {
  return (
    <Section>
      <div className="flex flex-col items-start gap-[16px] md:flex-row">
        <div className="w-full min-w-0 md:flex-1">
          <ProjectImage
            src={`${BASE}/Index%20Card.png`}
            alt="A definition card — engaged (n): providing clinically-relevant and actionable data. “CareSignal really keeps patients engaged! The average clinically-relevant engagement duration is over a year!”"
          />
        </div>
        <div className="w-full md:w-[303px] md:shrink-0">
          <ProjectImage
            src={`${BASE}/AI%20Stacks.png`}
            alt="A stack of index cards representing accumulated rare data."
          />
        </div>
      </div>
    </Section>
  );
}
