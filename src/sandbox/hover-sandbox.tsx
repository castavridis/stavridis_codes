import { useState } from 'react';

import Text from '../components/Text.js';

// ---------------------------------------------------------------------------
// Project Overview hover-effect sandbox. A playground for "golden retriever"
// energy on the FeaturedWork cards — eager, happy, waggy motion, with a
// non-motion fallback for reduced-motion users (glow + ring + paw).
//
// The reduced-motion experience is driven by a `.reduce` class on the stage
// (toggle below), initialized from the OS `prefers-reduced-motion` setting so
// the default is honest. Real components should gate with the
// `prefers-reduced-motion` media query / Tailwind `motion-reduce:` variant —
// the class here is just so the sandbox can preview both without touching OS
// settings.
//
// Visit /sandbox/hover (dev only).
// ---------------------------------------------------------------------------

type Effect = {
  id: string;
  name: string;
  blurb: string;
  // Thumbnail tint so the cards read like the real FeaturedWork grid.
  tint: string;
};

const EFFECTS: Effect[] = [
  {
    id: 'perk',
    name: 'Perk up',
    blurb: 'Eager lift + grow, like ears pricking at the door.',
    tint: 'bg-washes-hansa-yellow',
  },
  {
    id: 'tilt',
    name: 'Head tilt',
    blurb: 'The curious “what’s that?” cock of the head.',
    tint: 'bg-[#101e1e]',
  },
  {
    id: 'wag',
    name: 'Tail wag',
    blurb: 'Whole-body wag — pivots from the bottom, loops while hovered.',
    tint: 'bg-washes-cerulean-blue',
  },
  {
    id: 'bounce',
    name: 'Happy bounce',
    blurb: '“You’re home!” spring — a settling vertical bounce on loop.',
    tint: 'bg-[#a50e53]',
  },
  {
    id: 'zoomies',
    name: 'Zoomies',
    blurb: 'A quick one-shot wiggle of pure excitement.',
    tint: 'bg-[#6FCA37]',
  },
  {
    id: 'pounce',
    name: 'Pounce',
    blurb: 'Crouch, then leap — anticipation into a play bow.',
    tint: 'bg-[#ED8B00]',
  },
];

function DemoCard({ effect }: { effect: Effect }) {
  return (
    <div className="flex flex-col gap-[16px]">
      <button
        type="button"
        className={`fx-card fx-${effect.id} outline-confetti-black relative flex aspect-[463/304] w-full items-center justify-center overflow-hidden rounded-[8px] ${effect.tint}`}
      >
        {/* Paw accent — fades in on hover. Opacity isn't motion, so it stays
            on in both the animated and reduced-motion experiences. */}
        <span className="fx-paw pointer-events-none absolute right-[12px] top-[12px] text-[20px] opacity-0 select-none">
          🐾
        </span>
        <span className="font-mono text-[12px] leading-[20px] text-white/40 select-none">
          {effect.name}
        </span>
      </button>
      <div className="flex flex-col gap-[8px]">
        <Text variant="copy-large" className="text-[#251900]">
          {effect.name}
        </Text>
        <Text variant="tag" className="text-caresignal-none">
          {effect.blurb}
        </Text>
      </div>
    </div>
  );
}

export default function HoverSandbox() {
  // Initialize from the OS setting so the default reflects reality; the toggle
  // then lets you preview either experience.
  const [reduce, setReduce] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  return (
    <div className="bg-washes-paper min-h-screen w-full px-[88px] py-[64px]">
      <div className="mx-auto max-w-[944px]">
        <Text variant="headline" as="h1" className="mb-[8px] text-confetti-black">
          Project Overview hover effects
        </Text>
        <Text variant="copy" as="p" className="mb-[24px] text-confetti-black/70">
          Golden-retriever energy for the FeaturedWork cards — hover each to
          feel it. Reduced-motion users get a non-motion fallback (glow + ring +
          paw) instead.
        </Text>

        {/* Reduced-motion toggle. Drives the `.reduce` class on the stage. */}
        <button
          type="button"
          onClick={() => setReduce((r) => !r)}
          aria-pressed={reduce}
          className="border-confetti-black/30 text-confetti-black mb-[48px] inline-flex items-center gap-[10px] rounded-full border px-[16px] py-[8px] font-mono text-[12px]"
        >
          <span
            aria-hidden
            className={`inline-block size-[10px] rounded-full ${reduce ? 'bg-[#6FCA37]' : 'bg-confetti-black/25'}`}
          />
          Simulate prefers-reduced-motion: {reduce ? 'on' : 'off'}
        </button>

        <div
          className={`fx-stage grid grid-cols-1 gap-x-[16px] gap-y-[40px] md:grid-cols-2 ${reduce ? 'reduce' : ''}`}
        >
          {EFFECTS.map((effect) => (
            <DemoCard key={effect.id} effect={effect} />
          ))}
        </div>
      </div>

      <style>{`
        .fx-card {
          transition: transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1),
            box-shadow 260ms ease, filter 200ms ease;
          will-change: transform;
        }
        .fx-paw { transition: opacity 200ms ease, transform 200ms ease; }
        .fx-card:hover .fx-paw { opacity: 1; transform: rotate(-12deg) scale(1.1); }

        /* ---- Non-motion fallback (reduced motion) ----
           Glow + ring + the paw. No transforms, no keyframes. */
        .fx-stage.reduce .fx-card:hover {
          filter: brightness(1.05);
          box-shadow: 0 0 0 2px rgba(57, 31, 0, 0.25),
            0 12px 28px rgba(57, 31, 0, 0.14);
        }

        /* ---- Motion effects ----
           Only when the stage is NOT in reduced-motion mode. */
        .fx-stage:not(.reduce) .fx-perk:hover {
          transform: translateY(-10px) scale(1.03);
          box-shadow: 0 20px 44px rgba(57, 31, 0, 0.18);
        }

        .fx-stage:not(.reduce) .fx-tilt:hover {
          transform: rotate(-3deg) scale(1.02);
          box-shadow: 0 14px 32px rgba(57, 31, 0, 0.16);
        }

        .fx-wag { transform-origin: bottom center; }
        .fx-stage:not(.reduce) .fx-wag:hover {
          animation: fx-wag 560ms ease-in-out infinite;
        }
        @keyframes fx-wag {
          0%, 100% { transform: rotate(-2.5deg); }
          50% { transform: rotate(2.5deg); }
        }

        .fx-stage:not(.reduce) .fx-bounce:hover {
          animation: fx-bounce 760ms cubic-bezier(0.28, 0.84, 0.42, 1) infinite;
        }
        @keyframes fx-bounce {
          0%, 100% { transform: translateY(0); }
          28% { transform: translateY(-16px); }
          48% { transform: translateY(0); }
          64% { transform: translateY(-7px); }
          82% { transform: translateY(0); }
        }

        .fx-stage:not(.reduce) .fx-zoomies:hover {
          animation: fx-zoomies 520ms ease-in-out;
        }
        @keyframes fx-zoomies {
          0%, 100% { transform: translateX(0) rotate(0); }
          18% { transform: translateX(-7px) rotate(-1.5deg); }
          38% { transform: translateX(7px) rotate(1.5deg); }
          58% { transform: translateX(-5px) rotate(-1deg); }
          78% { transform: translateX(5px) rotate(1deg); }
        }

        .fx-stage:not(.reduce) .fx-pounce:hover {
          animation: fx-pounce 480ms cubic-bezier(0.3, 0.9, 0.4, 1.3);
          /* Hold the lifted play-bow pose while still hovered. */
          transform: scale(1.04) translateY(-8px);
        }
        @keyframes fx-pounce {
          0% { transform: scale(1) translateY(0); }
          32% { transform: scale(0.96) translateY(5px); }
          100% { transform: scale(1.04) translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
