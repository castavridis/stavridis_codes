'use client';

import { ProjectPageShell, type OtherProject } from './ProjectPageShell.js';

// ---------------------------------------------------------------------------
// Project 03 — "Using ML to Conserve the Work of Sol LeWitt"
//
// Translated from Figma 4E0aMtVlzQGQBY5gqildyx, node 533:15596. The hero
// pigment is cerulean blue; the page sits on cream paper with black body
// copy. Each numbered section below mirrors the Figma stack from top to
// bottom — see the PR description for a section-by-section sketch.
// ---------------------------------------------------------------------------

const OTHER_PROJECTS: OtherProject[] = [
  {
    label: 'CareSignal AI',
    href: '/projects/caresignal-ai',
    pigment: 'yellow',
  },
  {
    label: 'CareSignal Design System',
    href: '/projects/caresignal-design-system',
    pigment: 'blue',
  },
];

export default function SolLewittProjectPage(): React.ReactElement {
  return (
    <ProjectPageShell
      title={'Using Machine Learning\nto Conserve the Work\nof Sol LeWitt'}
      tagline="Product Design · Front-End Engineering"
      pigment="blue"
      otherProjects={OTHER_PROJECTS}
    >
      <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-[80px]">
        <ContributorsBlock />
        <CommunicateBlock />
        <KeyTakeaway />
        <DrawingToolsSection />
        <SingleModelRow />
        <SketchBookSection />
        <WhereWeStartedSection />
        <ConceptualArtQuote />
        <OpenQuestion />
      </div>
    </ProjectPageShell>
  );
}

// ---------------------------------------------------------------------------
// 1. Contributors block — right-aligned, 280px wide.
// ---------------------------------------------------------------------------

function ContributorsBlock(): React.ReactElement {
  return (
    <div className="flex w-full justify-end">
      <div className="font-body flex w-[280px] flex-col gap-[16px] text-[16px] leading-[24px] text-black">
        <div>
          <p className="font-bold">C Stavridis</p>
          <p>Concept, Research, Front-end Engineering, Physical computing</p>
        </div>
        <div>
          <p className="font-bold">Jonathan King</p>
          <p>ML Engineering, Fabrication</p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. "What do I want to communicate?" — 560px column, mixed weight body copy.
// ---------------------------------------------------------------------------

function CommunicateBlock(): React.ReactElement {
  return (
    <div className="font-body flex w-[560px] flex-col gap-[16px] text-black">
      <h2 className="text-[24px] leading-[32px] font-bold">What do I want to communicate?</h2>
      <p className="text-[16px] leading-[24px]">
        Early in our explorations with Machine Learning, we thought we could re-create Sol
        LeWitt&rsquo;s work through style transfer. This project taught us about keeping humans in the
        loop by capturing the aesthetic of the craftspeople installing Sol&rsquo;s work so that they
        might be called up on to review installations for years to come.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. Key takeaway — single bold sentence, 560px column.
// ---------------------------------------------------------------------------

function KeyTakeaway(): React.ReactElement {
  return (
    <p className="font-body w-[560px] text-[24px] leading-[32px] font-bold text-black">
      Key Takeaway: Machine Learning could be used to learn and apply a craft person&rsquo;s
      aesthetic.
    </p>
  );
}

// ---------------------------------------------------------------------------
// 4. Drawing Tools — three diagonally-stacked card placeholders, a small ML
// preview card off to the right, and a body-copy + bulleted-link block.
// ---------------------------------------------------------------------------

function DrawingToolsSection(): React.ReactElement {
  return (
    <div className="flex flex-col gap-[32px]">
      <div className="flex items-baseline justify-between">
        <h2 className="font-body text-[24px] leading-[32px] font-bold text-black">Drawing Tools</h2>
        <p className="font-mono text-[16px] leading-[24px] text-[#7d7d7d]">paper.js · p5.js</p>
      </div>

      {/* Cards: three diagonally-stacked placeholders on the left, a small
          ML preview placeholder to the right. */}
      <div className="relative h-[745px] w-full">
        {/* Card 3 — backmost, top-left. Includes a CERTIFICATE label. */}
        <CertificateCard
          style={{ position: 'absolute', top: 0, left: 0 }}
          showCertificate
          centerLabel="p5.js canvas"
        />
        {/* Card 2 — middle layer, offset down/right ~67/58. */}
        <CertificateCard
          style={{ position: 'absolute', top: 67, left: 58 }}
          centerLabel="p5.js canvas"
        />
        {/* Card 1 — frontmost, offset further. */}
        <CertificateCard
          style={{ position: 'absolute', top: 135, left: 116 }}
          centerLabel="p5.js canvas"
        />

        {/* ML output preview to the right of the stack. */}
        <div
          className="absolute h-[148px] w-[176px] overflow-hidden rounded-[8px] border border-[#d4d4d4] bg-white shadow-[0_2px_8px_rgba(33,30,31,0.05)]"
          style={{ top: 0, right: 0 }}
        >
          {/* TODO swap in real ML output preview */}
          <div className="flex h-full w-full items-center justify-center">
            <p className="font-mono text-[10px] text-[#bfbfbf]">ML output preview</p>
          </div>
        </div>
      </div>

      <div className="font-body flex w-[560px] flex-col gap-[16px] text-[16px] leading-[24px] text-black">
        <p>
          Click-through and cycle through interactive tools. Show why important. e.g. Wall Drawing
          #797 &gt; ML
        </p>
        <ul className="ml-[20px] flex list-disc flex-col gap-[8px]">
          <li>
            <a className="underline" href="#wall-drawing-797">
              Wall Drawing #797 &gt; ML collaborating
            </a>
          </li>
          <li>
            <a className="underline" href="#washes">
              Washes &gt; pointing out what places are wrong
            </a>
          </li>
          <li>
            <a className="underline" href="#scribbles">
              Scribbles &gt; pen plotter
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}

// CertificateCard — a stylized white card with horizontal divider lines, an
// optional CERTIFICATE label at the top, and a centered label in the middle.
function CertificateCard({
  style,
  showCertificate = false,
  centerLabel,
}: {
  style?: React.CSSProperties;
  showCertificate?: boolean;
  centerLabel?: string;
}): React.ReactElement {
  return (
    <div
      style={{ width: 445, height: 610, ...style }}
      className="overflow-hidden rounded-[12px] border border-[#d4d4d4] bg-white shadow-[0_4px_24px_rgba(33,30,31,0.08)]"
      aria-hidden="true"
    >
      <div className="flex h-full w-full flex-col gap-[16px] px-[32px] py-[24px]">
        {showCertificate ? (
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#7d7d7d]">CERTIFICATE</p>
        ) : (
          <div className="h-[14px]" />
        )}
        {/* Divider lines representing copy. */}
        <div className="flex flex-col gap-[10px]">
          <div className="h-[1px] w-full bg-[#e6e3dc]" />
          <div className="h-[1px] w-[70%] bg-[#e6e3dc]" />
          <div className="h-[1px] w-[85%] bg-[#e6e3dc]" />
          <div className="h-[1px] w-[60%] bg-[#e6e3dc]" />
        </div>
        <div className="flex flex-1 items-center justify-center">
          {centerLabel ? <p className="font-mono text-[12px] text-[#bfbfbf]">{centerLabel}</p> : null}
        </div>
        <div className="flex flex-col gap-[10px]">
          <div className="h-[1px] w-[80%] bg-[#e6e3dc]" />
          <div className="h-[1px] w-[50%] bg-[#e6e3dc]" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. Three smaller "single model" card placeholders in a row.
// ---------------------------------------------------------------------------

function SingleModelRow(): React.ReactElement {
  return (
    <div className="flex flex-wrap items-start gap-[32px]">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col gap-[8px]">
          <p className="font-mono text-[12px] leading-[24px] text-[#7d7d7d]">
            Blurb about Single model here.
          </p>
          <div
            className="h-[224px] w-[272px] overflow-hidden rounded-[12px] border border-[#d4d4d4] bg-white shadow-[0_2px_8px_rgba(33,30,31,0.06)]"
            aria-hidden="true"
          />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 6. Sketch Book — bibliography + overlapping placeholder image row.
// ---------------------------------------------------------------------------

function SketchBookSection(): React.ReactElement {
  // Five overlapping cards: alternating portrait (272×360) and landscape
  // (360×240). A negative `marginLeft` on every card after the first pulls
  // each into the previous card's right edge to produce the overlap.
  const cards: Array<{ w: number; h: number; offset: number }> = [
    { w: 272, h: 360, offset: 0 },
    { w: 360, h: 240, offset: -32 },
    { w: 272, h: 360, offset: -32 },
    { w: 360, h: 240, offset: -32 },
    { w: 272, h: 360, offset: -32 },
  ];
  return (
    <div className="flex flex-col gap-[32px]">
      <div className="font-body flex w-[560px] flex-col gap-[16px] text-black">
        <h2 className="text-[24px] leading-[32px] font-bold">Sketch Book</h2>
        <p className="text-[16px] leading-[24px]">
          Select bibliography and picture of visiting Mass MOCA
        </p>
      </div>
      <div className="flex w-full items-center overflow-x-auto">
        {cards.map((c, i) => (
          <div
            key={i}
            style={{ width: c.w, height: c.h, marginLeft: c.offset }}
            className="shrink-0 overflow-hidden rounded-[12px] border border-[#d4d4d4] bg-white shadow-[0_4px_16px_rgba(33,30,31,0.08)]"
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 7. "Where we started: Generating New Wall Drawing Prompts" — header meta +
// three offset-stacked placeholders.
// ---------------------------------------------------------------------------

function WhereWeStartedSection(): React.ReactElement {
  return (
    <div className="flex flex-col gap-[32px]">
      <div className="flex flex-col gap-[8px]">
        <div className="flex items-baseline justify-between">
          <h2 className="font-body w-[560px] text-[24px] leading-[32px] font-bold text-black">
            Where we started: Generating New Wall Drawing Prompts
          </h2>
          <p className="font-mono text-[16px] leading-[24px] text-[#7d7d7d]">paper.js · p5.js</p>
        </div>
        <div className="flex items-center justify-between">
          <p className="font-mono text-[12px] leading-[24px] text-[#7d7d7d]">Top 5 ideas</p>
          <p className="font-mono text-[12px] leading-[24px] text-[#7d7d7d]">Commentary Here.</p>
        </div>
      </div>

      {/* Three stacked offset cards. */}
      <div className="relative h-[264px] w-[480px]">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{ top: i * 8, left: i * 8 }}
            className="absolute h-[240px] w-[464px] overflow-hidden rounded-[12px] border border-[#d4d4d4] bg-white shadow-[0_4px_16px_rgba(33,30,31,0.08)]"
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 8. Conceptual art quote — 752px column, mono-light type, with linked
// keyword and a citation line below.
// ---------------------------------------------------------------------------

function ConceptualArtQuote(): React.ReactElement {
  return (
    <div className="flex w-[752px] flex-col gap-[16px]">
      <blockquote className="font-mono text-[36px] leading-[44px] font-light text-black">
        In{' '}
        <a
          href="https://en.wikiquote.org/wiki/Conceptual_art"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          conceptual art
        </a>{' '}
        the idea or the concept is the most important aspect of the work...The idea becomes a machine
        that makes the art.
      </blockquote>
      <p className="font-body text-[12px] leading-[24px] font-light text-[#7d7d7d]">
        Art Forum citation here
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 9. Open question — bold rhetorical close.
// ---------------------------------------------------------------------------

function OpenQuestion(): React.ReactElement {
  return (
    <p className="font-body w-[464px] text-[24px] leading-[32px] font-bold text-black">
      Open Question:
      <br />
      Does the work we created count as a Sol LeWitt?
    </p>
  );
}
