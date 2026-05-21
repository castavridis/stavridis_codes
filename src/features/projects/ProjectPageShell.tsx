'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { Link } from 'wouter';
import type { PigmentOption } from '../../../lib/washes/washes.js';
import { Washes } from '../../../lib/washes/washes.js';

// ---------------------------------------------------------------------------
// Shared scaffolding for project-detail pages.
//
// Each project page wraps its body content in `<ProjectPageShell>`, which
// supplies:
//   - the full-bleed hero strip (cream brand mark + close button + title +
//     tagline) tinted by the project's pigment
//   - the "Other Projects" footer with two cards linking to siblings
//
// The shell is rendered at 1280px wide centered on a coffee-deep canvas
// and breaks out of the parent `<main>`'s `max-w-3xl` constraint by
// re-using the same `relative left-1/2 w-screen -translate-x-1/2` trick
// the landing page uses.
// ---------------------------------------------------------------------------

export type PigmentKey = 'rose' | 'yellow' | 'blue';

export const PIGMENTS: Record<PigmentKey, { label: string; color: string }> = {
  rose: { label: 'Quinacridone Magenta', color: '#a50e53' },
  yellow: { label: 'Hansa Yellow', color: '#e3af08' },
  blue: { label: 'Cerulean Blue', color: '#108ba0' },
};

export type OtherProject = {
  label: string;
  href: string;
  pigment: PigmentKey;
};

type ProjectPageShellProps = {
  title: string;
  tagline: string;
  pigment: PigmentKey;
  otherProjects: OtherProject[];
  children: ReactNode;
};

export function ProjectPageShell({
  title,
  tagline,
  pigment,
  otherProjects,
  children,
}: ProjectPageShellProps): React.ReactElement {
  return (
    <div className="bg-coffee-deep text-cream relative left-1/2 w-screen -translate-x-1/2 overflow-hidden">
      <div className="mx-auto w-full max-w-[1280px]">
        <ProjectHero title={title} tagline={tagline} pigment={pigment} />
        <div className="px-6 pt-[72px] pb-[120px]">{children}</div>
        <OtherProjectsFooter pigment={pigment} otherProjects={otherProjects} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hero strip — 1280×344 with a Washes wash tinted by the project pigment.
// ---------------------------------------------------------------------------

function ProjectHero({
  title,
  tagline,
  pigment,
}: {
  title: string;
  tagline: string;
  pigment: PigmentKey;
}): React.ReactElement {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const wash = Washes.create(host, { cursorPreview: false, pointer: false });

    if (wash.webglAvailable()) wash.webgl(false);
    wash.paperColor(14 / 255, 0, 0);
    wash.gouacheMode('auto');
    wash.scale(3);
    wash.paperWetness('damp');
    wash.fadePainting(0);
    wash.pigment(pigment as PigmentOption);

    const canvasEl = (wash as unknown as { canvas: HTMLCanvasElement }).canvas;
    if (canvasEl) canvasEl.style.backgroundColor = 'rgb(14,0,0)';

    const splashTimer = window.setTimeout(() => {
      const rect = host.getBoundingClientRect();
      wash.splash([{ x: rect.width / 2, y: rect.height * 0.6, velocity: 40 }], 'spray', {
        radius: rect.width * 0.55,
        pressure: 60,
        liftRate: 0.97,
      });
    }, 80);

    return () => {
      window.clearTimeout(splashTimer);
      try {
        wash.destroy();
      } catch {
        /* ignore */
      }
    };
  }, [pigment]);

  return (
    <section className="relative h-[344px] w-full overflow-hidden">
      <div ref={hostRef} className="absolute inset-0 opacity-40" aria-hidden="true" />

      {/* Top-left brand mark */}
      <div className="absolute top-[24px] left-[24px] flex items-center gap-[8px]">
        <span className="font-display text-cream text-[16px] leading-[24px]">c stavridis</span>
        <span aria-hidden="true" className="flex items-center gap-[4px]">
          <span className="bg-cream block h-[3px] w-[3px] rounded-full" />
          <span className="bg-cream block h-[3px] w-[3px] rounded-full" />
          <span className="bg-cream block h-[3px] w-[3px] rounded-full" />
        </span>
        <span
          className="text-cream font-body text-[16px] leading-[24px]"
          style={{ mixBlendMode: 'difference' }}
        >
          design engineer
        </span>
      </div>

      {/* Top-right close + pigment selector decoration */}
      <div className="absolute top-[24px] right-[24px] flex items-center gap-[16px]">
        <Link
          href="/"
          className="text-cream font-mono text-[12px] leading-[24px] hover:underline"
          style={{ mixBlendMode: 'difference' }}
        >
          Close Project
        </Link>
        <PigmentSelectorDecoration active={pigment} />
      </div>

      {/* Centered title + tagline */}
      <div className="absolute top-[200px] left-1/2 flex w-[560px] -translate-x-1/2 flex-col items-center gap-[12px] text-center">
        <h1 className="font-display text-cream text-[32px] leading-[36px]">{title}</h1>
        <p
          className="text-cream font-mono text-[12px] leading-[24px]"
          style={{ mixBlendMode: 'difference' }}
        >
          {tagline}
        </p>
      </div>
    </section>
  );
}

function PigmentSelectorDecoration({ active }: { active: PigmentKey }): React.ReactElement {
  const activeColor = PIGMENTS[active].color;
  return (
    <div
      className="flex h-[24px] items-center gap-[8px] rounded-[12px] px-[10px]"
      style={{ backgroundColor: `${activeColor}80` }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-cream h-[14px] w-[14px]"
        aria-hidden="true"
      >
        <path d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128zM18.42 5.547a4.498 4.498 0 0 0-3.187 2.137l-2.388 4.005a15.79 15.79 0 0 1 3.467 2.067l3.087-2.667a4.5 4.5 0 0 0-.98-5.542z" />
      </svg>
      {(Object.keys(PIGMENTS) as PigmentKey[]).map((key) => (
        <span
          key={key}
          className="block h-[10px] w-[10px] rounded-full"
          style={{
            backgroundColor: PIGMENTS[key].color,
            outline: active === key ? '2px solid #fbf6ea' : 'none',
            outlineOffset: active === key ? '2px' : '0',
          }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// "Other Projects" footer — low-opacity Washes wash with two link cards.
// ---------------------------------------------------------------------------

function OtherProjectsFooter({
  pigment,
  otherProjects,
}: {
  pigment: PigmentKey;
  otherProjects: OtherProject[];
}): React.ReactElement {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const wash = Washes.create(host, { cursorPreview: false, pointer: false });
    if (wash.webglAvailable()) wash.webgl(false);
    wash.paperColor(14 / 255, 0, 0);
    wash.gouacheMode('auto');
    wash.scale(3.5);
    wash.paperWetness('damp');
    wash.fadePainting(0);
    wash.pigment(pigment as PigmentOption);

    const canvasEl = (wash as unknown as { canvas: HTMLCanvasElement }).canvas;
    if (canvasEl) canvasEl.style.backgroundColor = 'rgb(14,0,0)';

    const t = window.setTimeout(() => {
      const rect = host.getBoundingClientRect();
      wash.splash([{ x: rect.width * 0.5, y: rect.height * 0.5, velocity: 30 }], 'spray', {
        radius: rect.width * 0.6,
        pressure: 45,
        liftRate: 0.96,
      });
    }, 80);

    return () => {
      window.clearTimeout(t);
      try {
        wash.destroy();
      } catch {
        /* ignore */
      }
    };
  }, [pigment]);

  return (
    <section className="relative w-full overflow-hidden px-6 pt-[72px] pb-[96px]">
      <div ref={hostRef} className="absolute inset-0 opacity-30" aria-hidden="true" />
      <div className="relative flex flex-col gap-[24px]">
        <h2 className="font-body text-cream text-[24px] leading-[32px] font-bold">Other Projects</h2>
        <div className="flex flex-wrap gap-[24px]">
          {otherProjects.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="relative block h-[224px] w-[368px] overflow-hidden rounded-[12px] bg-white transition-transform hover:scale-[1.02]"
            >
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(140deg, ${PIGMENTS[p.pigment].color}33 0%, #fbf6ea 60%, ${PIGMENTS[p.pigment].color}55 100%)`,
                }}
              />
              <div className="text-coffee-deep relative flex h-full w-full flex-col justify-end p-[20px]">
                <span className="font-display text-[24px] leading-[28px]">{p.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
