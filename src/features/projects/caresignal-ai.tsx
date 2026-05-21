'use client';

import { ProjectPageShell, type OtherProject } from './ProjectPageShell.js';

// ---------------------------------------------------------------------------
// CareSignal AI project page.
//
// Figma node 533:13680 — "Showcasing the value of a new predictive model
// for CareSignal." The page lives on a coffee-deep canvas, opens with a
// magenta-tinted hero, then drops into a vertical stack of:
//   1. a 560-wide cream paragraph block ("What do I want to communicate?")
//   2. three CSS-gradient dashboard placeholders (real screenshots TODO)
//   3. three purple dashed-border principle cards laid out diagonally
//   4. the "engaged (n)" definition section with a blue + green pair
//   5. the shared "Other Projects" footer (handled by ProjectPageShell)
// ---------------------------------------------------------------------------

const OTHER_PROJECTS: OtherProject[] = [
  { label: 'Sol LeWitt', href: '/projects/sol-lewitt', pigment: 'rose' },
  { label: 'CareSignal Design System', href: '/projects/caresignal-design-system', pigment: 'blue' },
];

export default function CareSignalAiPage(): React.ReactElement {
  return (
    <ProjectPageShell
      title="Showcasing the value of a new predictive model for CareSignal."
      tagline="Brand Design • Front-End Engineering"
      pigment="rose"
      otherProjects={OTHER_PROJECTS}
    >
      <div className="flex flex-col items-center gap-[72px]">
        <WhatSection />
        <DashboardScreenshots />
        <PrinciplesRow />
        <EngagedSection />
      </div>
    </ProjectPageShell>
  );
}

// ---------------------------------------------------------------------------
// 1. "What do I want to communicate?" — 560-wide cream paragraph block.
// ---------------------------------------------------------------------------

function WhatSection(): React.ReactElement {
  return (
    <section className="w-[560px] max-w-full">
      <h2 className="text-cream font-body mb-[16px] text-[24px] leading-[32px] font-bold">
        What do I want to communicate?
      </h2>
      <p className="text-cream font-body text-[16px] leading-[26px]">
        Early in our explorations with Machine Learning, we thought we could re-create Sol
        LeWitt&rsquo;s work through style transfer. This project taught us about keeping humans in the
        loop by capturing the aesthetic of the craftspeople installing Sol&rsquo;s work so that they
        might be called up on to review installations for years to come.
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 2. Dashboard screenshots — CSS-gradient placeholders. The Figma asset URLs
// expire after 7 days, so we ship gradients labeled with the intended image
// and a TODO comment for the real swap-in.
// ---------------------------------------------------------------------------

function DashboardScreenshots(): React.ReactElement {
  return (
    <section className="flex w-full max-w-[1040px] flex-col items-center gap-[24px]">
      {/* TODO swap in real screenshot */}
      <div
        className="flex h-[48px] w-[1040px] max-w-full items-center gap-[8px] rounded-t-[8px] bg-[#1c1c1c] px-[16px]"
        aria-label="Browser chrome"
      >
        <span className="block h-[12px] w-[12px] rounded-full bg-[#ff5f56]" />
        <span className="block h-[12px] w-[12px] rounded-full bg-[#ffbd2e]" />
        <span className="block h-[12px] w-[12px] rounded-full bg-[#27c93f]" />
        <span className="text-cream/60 ml-[16px] font-mono text-[12px]">
          dashboard.caresignal.health
        </span>
      </div>
      {/* TODO swap in real screenshot */}
      <div
        className="flex h-[693px] w-[1040px] max-w-full items-center justify-center rounded-[8px]"
        style={{
          background: 'linear-gradient(135deg, #4f1d6b 0%, #a50e53 35%, #e3af08 70%, #fbf6ea 100%)',
        }}
        aria-label="CareSignal AI dashboard screenshot placeholder"
      >
        <span className="font-display text-cream rounded-[8px] bg-black/40 px-[16px] py-[8px] text-[20px]">
          CareSignal AI dashboard
        </span>
      </div>
      {/* TODO swap in real screenshot */}
      <div
        className="flex h-[220px] w-[1003px] max-w-full items-center justify-center rounded-[8px]"
        style={{
          background: 'linear-gradient(120deg, #108ba0 0%, #4f1d6b 50%, #a50e53 100%)',
        }}
        aria-label="CareSignal AI metrics row placeholder"
      >
        <span className="font-display text-cream rounded-[8px] bg-black/40 px-[16px] py-[8px] text-[18px]">
          Predictive metrics
        </span>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 3. Three principle cards — purple #cf9fc5 dashed cards laid out diagonally.
// Card 1 sits left, card 2 mid-right offset down ~158px, card 3 far-right
// offset down ~315px. Each shows a numbered shape, headline (Ultra 32, stroke
// fill), and body (font-mono, black).
// ---------------------------------------------------------------------------

type Principle = {
  num: number;
  headline: string;
  body: string;
  shape: 'square' | 'diamond';
  offsetX: number;
  offsetY: number;
};

const PRINCIPLES: Principle[] = [
  {
    num: 1,
    headline: 'Extreme / scarcity.',
    body: 'Rare data includes clinically-relevant, condition-specific sign and symptom data. It can even include the metadata from a patient’s interaction with technology over time.',
    shape: 'square',
    offsetX: 0,
    offsetY: 0,
  },
  {
    num: 2,
    headline: 'Brief / actionability.',
    body: "Rare data's window of opportunity to inform clinical care or power predictive models is often less than ten days.",
    shape: 'square',
    offsetX: 220,
    offsetY: 158,
  },
  {
    num: 3,
    headline: 'Proven / efficacy.',
    body: 'Rare data, if used correctly, impact outcomes on their own. They become more powerful when assimilated into predictive models, delivering better outcomes and higher ROI.',
    shape: 'diamond',
    offsetX: 440,
    offsetY: 315,
  },
];

function PrinciplesRow(): React.ReactElement {
  // The diagonal stagger spans ~440px horizontally and 315px vertically,
  // so the container needs enough room to hold the third card at its
  // offset without clipping. Width = 368 (card) + 440 (offset) = 808.
  // Height = 368 (card height-ish) + 315 = ~700.
  return (
    <section className="relative w-full max-w-[1040px]">
      <div className="relative mx-auto h-[700px] w-[808px] max-w-full">
        {PRINCIPLES.map((p) => (
          <PrincipleCard key={p.num} principle={p} />
        ))}
      </div>
    </section>
  );
}

function PrincipleCard({ principle }: { principle: Principle }): React.ReactElement {
  return (
    <article
      className="absolute top-0 left-0 flex w-[368px] flex-col gap-[24px] rounded-[12px] border-2 border-dashed border-black bg-[#cf9fc5] p-[32px]"
      style={{ transform: `translate(${principle.offsetX}px, ${principle.offsetY}px)` }}
    >
      <NumberShape num={principle.num} shape={principle.shape} />
      <h3
        className="font-display text-[32px] leading-[36px] whitespace-pre-line"
        style={{
          color: 'transparent',
          WebkitTextStroke: '1.5px #100e08',
        }}
      >
        {principle.headline}
      </h3>
      <p className="text-coffee-deep font-mono text-[16px] leading-[24px]">{principle.body}</p>
    </article>
  );
}

function NumberShape({
  num,
  shape,
}: {
  num: number;
  shape: 'square' | 'diamond';
}): React.ReactElement {
  if (shape === 'diamond') {
    return (
      <div className="relative h-[48px] w-[48px]" aria-hidden="true">
        <div className="absolute inset-0 rotate-45 bg-[#100e08]" />
        <span className="text-cream absolute inset-0 flex items-center justify-center font-mono text-[18px] font-bold">
          {num}
        </span>
      </div>
    );
  }
  return (
    <div
      className="text-cream flex h-[48px] w-[48px] items-center justify-center bg-[#100e08] font-mono text-[18px] font-bold"
      aria-hidden="true"
    >
      {num}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. "engaged (n)" definition — two-card layout. Left (752w) blue card with
// gradient strip + inset cream definition. Right (364w) light-green card with
// a cursor-image placeholder.
// ---------------------------------------------------------------------------

function EngagedSection(): React.ReactElement {
  return (
    <section className="flex w-full max-w-[1140px] flex-wrap gap-[24px]">
      <article className="flex w-[752px] max-w-full flex-col gap-[24px] overflow-hidden rounded-[12px] bg-[#5187a8] p-[24px]">
        <div
          aria-hidden="true"
          className="h-[64px] w-full rounded-[8px]"
          style={{
            background: 'linear-gradient(90deg, #a50e53 0%, #e3af08 50%, #108ba0 100%)',
          }}
        />
        <div className="rounded-[12px] bg-[#fffbef] p-[32px]">
          <p className="text-coffee-deep font-body text-[20px] leading-[28px]">
            <span className="font-bold">engaged (n):</span> Providing clinically-relevant and
            actionable data.
          </p>
          <p className="text-coffee-deep mt-[16px] font-mono text-[14px] leading-[22px] italic">
            e.g.) &ldquo;CareSignal really keeps patients engaged! The average clinically-relevant
            engagement duration is over a year!&rdquo;
          </p>
        </div>
      </article>

      <article className="flex w-[364px] max-w-full flex-col gap-[16px] overflow-hidden rounded-[12px] bg-[#b2d07f] p-[24px]">
        {/* TODO swap in real cursor screenshot */}
        <div
          aria-hidden="true"
          className="flex h-[280px] w-full items-center justify-center rounded-[8px]"
          style={{
            background: 'linear-gradient(160deg, #fffbef 0%, #cae7ed 50%, #5187a8 100%)',
          }}
        >
          <span className="font-mono text-[12px] text-[#100e08]">cursor / interaction</span>
        </div>
        <p className="text-coffee-deep font-mono text-[14px] leading-[22px]">
          Patient engagement happens through small moments — a tap, a reply, a check-in.
        </p>
      </article>
    </section>
  );
}
