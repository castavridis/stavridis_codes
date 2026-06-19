// ---------------------------------------------------------------------------
// Featured Work — 2x2 grid of placeholder project cards.
// Inner card visuals from Figma (Engaged Widget, Heat Exchanger UI, SQSHBook
// form, IBM Watson cursor) are intentionally NOT reconstructed here; each
// thumbnail is a solid/gradient placeholder so the layout can land first.
// ---------------------------------------------------------------------------

import FadeDown from '../../../components/anim/FadeDown.js';

type ProjectOverviewProps = {
  slug: string;
  headline: React.ReactNode;
  tags: string;
  onClick?: (slug: string) => void;
  thumbnailClassName?: string;
};

function ProjectOverview({
  slug,
  headline,
  tags,
  onClick,
  thumbnailClassName,
}: ProjectOverviewProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-[16px]">
      <button
        type="button"
        onClick={() => onClick?.(slug)}
        className={`outline-confetti-black relative flex h-[304.03px] w-[463px] items-center justify-center overflow-hidden rounded-[8px] ${thumbnailClassName ?? ''}`}
      >
        <span className="font-mono text-[12px] leading-[20px] text-white/30 select-none">{slug}</span>
      </button>
      <div className="flex flex-col gap-[8px]">
        <p className="font-body w-full text-[24px] leading-[32px] text-[#251900]">{headline}</p>
        <p className="text-caresignal-none font-mono text-[12px] leading-[20px]">{tags}</p>
      </div>
    </div>
  );
}

type Project = {
  slug: string;
  headline: React.ReactNode;
  tags: string;
  thumbnailClassName: string;
};

const PROJECTS: Project[] = [
  {
    slug: 'caresignal',
    headline: (
      <>
        Creating a design system to make
        <br />
        health care automation human.
      </>
    ),
    tags: 'Design System · Front-End Engineering',
    thumbnailClassName: 'bg-washes-hansa-yellow',
  },
  {
    slug: 'fracta',
    headline: 'Developing a consistent way to comply with manufacturing standards.',
    tags: 'Product Design · User Research · Full-Stack Engineering',
    // Dark teal from Figma — no design token yet, inline for now.
    thumbnailClassName: 'bg-[#101e1e]',
  },
  {
    slug: 'sqshbook',
    headline: 'Crafting a joyful experience to increase community access through engagement.',
    tags: 'Design System · User Research · Front-End Engineering',
    thumbnailClassName: 'bg-gradient-to-br from-[#eeeead] via-[#d3e6e5] to-[#ecc6d4]',
  },
  {
    slug: 'caresignal-ai',
    headline: 'Expressing a the value of a novel predictive model in healthcare.',
    tags: 'Visual Design · Copywriting · Front-End Engineering',
    thumbnailClassName: 'bg-washes-cerulean-blue',
  },
];

// `slugs` (optional) — when provided, FeaturedWork renders only those
// projects in the given order. Used by /for/:company pages to surface
// the most-relevant work for that audience. Unknown slugs are skipped
// silently so a stale config can't blow up the landing. When absent,
// renders the canonical PROJECTS list.
export function FeaturedWork({
  onCardClick,
  slugs,
}: {
  onCardClick?: (slug: string) => void;
  slugs?: string[];
}): React.ReactElement {
  const projects = slugs
    ? slugs
        .map((s) => PROJECTS.find((p) => p.slug === s))
        .filter((p): p is Project => Boolean(p))
    : PROJECTS;

  return (
    <section className="w-[944px]">
      <div className="mb-[40px]">
        <p className="font-kyoto text-[24px] leading-[28px] font-medium text-[#251900]">
          Featured Work
        </p>
      </div>
      <div className="grid grid-cols-2 gap-x-[16px] gap-y-[40px]">
        {projects.map((project, i) => (
          <FadeDown key={project.slug} delay={i * 80}>
            <ProjectOverview
              slug={project.slug}
              headline={project.headline}
              tags={project.tags}
              thumbnailClassName={project.thumbnailClassName}
              onClick={onCardClick}
            />
          </FadeDown>
        ))}
      </div>
    </section>
  );
}
