// ---------------------------------------------------------------------------
// Featured Work — an optional full-width hero card, then a 2x2 grid of
// project cards.
// Inner card visuals from Figma (Engaged Widget, Heat Exchanger UI, SQSHBook
// form, IBM Watson cursor) are intentionally NOT reconstructed here; each
// thumbnail is a solid/gradient placeholder so the layout can land first.
// ---------------------------------------------------------------------------

import FadeDown from '../../../components/anim/FadeDown.js';
import Button from '../../../components/Button.js';
import RotatingSeal from '../../../components/RotatingSeal.js';
import Text from '../../../components/Text.js';
import type { SealColors } from '../../companies/companies.js';
import { getProject } from '../../projects/projects.js';

type ProjectOverviewProps = {
  slug: string;
  headline: React.ReactNode;
  tags: string;
  onClick?: (slug: string) => void;
  thumbnailClassName?: string;
  // Optional thumbnail image. When present the card renders the image
  // (object-cover) inside the tinted slot; absent → the slug-name
  // placeholder used as a layout aid before assets land.
  image?: string;
  imageAlt?: string;
  // When set, renders a rotating "Featured Project" seal over the
  // top-right of the thumbnail with the company name curved on the
  // perimeter. Driven by CompanyConfig.featuredProjects.
  stampCompanyName?: string;
  // Seal colors for this company (CompanyConfig.seal). Undefined → the
  // seal uses its Hansa Yellow / confetti-black defaults.
  stampSeal?: SealColors;
  // When true, overlays a "Preview Only" tag on the thumbnail — for case
  // studies that are still drafts/previews. Driven by the project's own
  // `preview` frontmatter flag (see ProjectFrontmatter).
  previewOnly?: boolean;
  // 'card' (default): thumbnail over title + tags, one grid cell.
  // 'hero': a full-width two-column card — thumbnail left, title + tags
  // right (stacked on phones). Driven by CompanyConfig.heroSlug.
  layout?: 'card' | 'hero';
};

function ProjectOverview({
  slug,
  headline,
  tags,
  onClick,
  thumbnailClassName,
  image,
  imageAlt,
  stampCompanyName,
  stampSeal,
  previewOnly,
  layout = 'card',
}: ProjectOverviewProps): React.ReactElement {
  const hero = layout === 'hero';
  return (
    <div
      className={
        hero
          ? // A white card at the system's card radius (16px) and inset (24px).
            'relative grid grid-cols-1 gap-[16px] rounded-[16px] bg-white p-[24px] md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:items-center md:gap-x-[40px]'
          : 'relative flex flex-col gap-[16px]'
      }
    >
      <button
        type="button"
        onClick={() => onClick?.(slug)}
        // Golden-retriever "perk up" on hover — an eager lift + grow + shadow
        // (motion-safe). Reduced-motion users get a gentle brightness lift
        // instead. Transition covers both.
        className={`outline-confetti-black relative flex aspect-[463/304] cursor-pointer w-full items-center justify-center overflow-hidden rounded-[8px] transition-[transform,box-shadow,filter] duration-300 ease-out motion-safe:hover:[transform:translateY(-10px)_scale(1.03)] motion-safe:hover:shadow-[0_20px_44px_rgba(57,31,0,0.18)] motion-reduce:hover:brightness-[1.05] ${hero ? '' : 'md:aspect-auto md:h-[304.03px]'} ${thumbnailClassName ?? ''}`}
      >
        {image ? (
          <img
            src={image}
            alt={imageAlt ?? ''}
            loading="lazy"
            decoding="async"
            className="block size-full object-cover"
          />
        ) : (
          <span className="font-mono text-[12px] leading-[20px] text-white/30 select-none">{slug}</span>
        )}
        {previewOnly ? (
          // "Preview Only" tag — Figma node 4140:10216. Paper-tinted pill at
          // the thumbnail's top-left.
          <span className="border-washes-paper bg-washes-paper/90 pointer-events-none absolute left-[12px] top-[12px] z-10 inline-flex items-center rounded-[6px] border px-[12px] py-[8px]">
            <span className="text-confetti-black/75 font-mono text-[12px] font-medium italic leading-[12px]">
              Preview
            </span>
          </span>
        ) : null}
      </button>
      {/* Seal sits on the (relative) card wrapper, NOT inside the
          overflow-hidden button — otherwise the button's hover transform
          turns it into the containing block and clips the seal. */}
      {stampCompanyName ? (
        <span
          // Same spot relative to the thumbnail on both layouts: the hero's
          // 24px card inset shifts it in by that much.
          className={`pointer-events-none absolute z-10 ${hero ? 'left-[8px] top-[48px]' : 'left-[-16px] top-[24px]'}`}
          style={{ isolation: 'isolate' }}
        >
          <RotatingSeal
            companyName={stampCompanyName}
            size={104}
            foregroundColor={stampSeal?.foreground_color}
            backgroundColor={stampSeal?.background_color}
          />
        </span>
      ) : null}
      <div className={hero ? 'flex flex-col gap-[12px]' : 'flex flex-col gap-[8px]'}>
        <Text
          variant="copy-large"
          className={`w-full text-[#251900] [text-wrap:pretty] ${hero ? 'md:text-[32px] md:leading-[40px]' : ''}`}
        >
          {headline}
        </Text>
        <Text variant="tag" className="text-caresignal-none">{tags}</Text>
        {/* An explicit way in besides the thumbnail: filled on the hero
            (the primary action), outline on grid cards. */}
        <Button
          variant={hero ? 'default' : 'outline'}
          onClick={() => onClick?.(slug)}
          aria-label={`View case study: ${typeof headline === 'string' ? headline : slug}`}
          className={`self-start ${hero ? 'mt-[12px]' : 'mt-[8px]'}`}
        >
          View case study
        </Button>
      </div>
    </div>
  );
}

type Project = {
  slug: string;
  headline: React.ReactNode;
  tags: string;
  thumbnailClassName: string;
  image?: string;
  imageAlt?: string;
};

const PROJECTS: Project[] = [
  {
    // Matches content/projects/caresignal-clinician-app/index.mdx (nested
    // {slug}/index.mdx layout). Interim thumbnail: the risk dashboard
    // screenshot until a dedicated card asset is exported.
    slug: 'caresignal-clinician-app',
    headline: 'Scaling centralized care teams to safely manage 15 to 20× as many patients',
    tags: 'Product Strategy · Product Design · Service Design · Design Engineering',
    thumbnailClassName: 'bg-[#fdfbf5]',
    image: '/images/projects/caresignal-clinician-app/fig-risk-dashboard.webp',
    imageAlt: 'CareSignal risk-stratified dashboard thumbnail.',
  },
  {
    slug: 'caresignal-ai',
    headline: 'Designing a novel marketing site  for a new predictive model',
    tags: 'Visual Design · Copywriting · Front-End Engineering',
    thumbnailClassName: 'bg-washes-cerulean-blue',
    image: '/images/projects/CareSignal%20AI%20Thumbnail.png',
    imageAlt: 'CareSignal AI thumbnail.',
  },
  {
    slug: 'sqshbook',
    headline: 'Crafting a joyful experience to increase community submissions to a non-profit',
    tags: 'Design System · User Research · Front-End Engineering',
    thumbnailClassName: 'bg-gradient-to-br from-[#eeeead] via-[#d3e6e5] to-[#ecc6d4]',
    image: '/images/projects/SQSHBook%20Thumbnail.png',
    imageAlt: 'SQSHBook thumbnail.',
  },
  {
    slug: 'fracta',
    headline: 'Developing a consistent way to comply with manufacturing standards',
    tags: 'Product Design · User Research · Full-Stack Engineering',
    // Dark teal from Figma — no design token yet, inline for now.
    thumbnailClassName: 'bg-[#101e1e]',
    image: '/images/projects/Fracta%20Thumbnail.png',
    imageAlt: 'Fracta thumbnail.',
  },
];

// `slugs` (optional) — when provided, FeaturedWork renders only those
// projects in the given order. Used by /for/:company pages to surface
// the most-relevant work for that audience. Unknown slugs are skipped
// silently so a stale config can't blow up the landing. When absent,
// renders the canonical PROJECTS list.
//
// `heroSlug` (optional) — renders that project first as a full-width,
// two-column hero card and drops it from the grid so it never shows twice.
// An unknown slug renders no hero. See CompanyConfig.heroSlug.
//
// `featuredProjectSlugs` + `stampCompanyName` — when both are set, any
// project whose slug is in `featuredProjectSlugs` renders a rotating
// "Featured Project" seal over its thumbnail with the company name
// curved around it. See CompanyConfig.featuredProjects.
export function FeaturedWork({
  onCardClick,
  slugs,
  heroSlug,
  featuredProjectSlugs,
  stampCompanyName,
  stampSeal,
}: {
  onCardClick?: (slug: string) => void;
  slugs?: string[];
  heroSlug?: string;
  featuredProjectSlugs?: string[];
  stampCompanyName?: string;
  stampSeal?: SealColors;
}): React.ReactElement {
  const hero = heroSlug ? PROJECTS.find((p) => p.slug === heroSlug) : undefined;
  const projects = (
    slugs
      ? slugs
          .map((s) => PROJECTS.find((p) => p.slug === s))
          .filter((p): p is Project => Boolean(p))
      : PROJECTS
  ).filter((p) => p.slug !== hero?.slug);

  const stampSlugs = new Set(featuredProjectSlugs ?? []);
  const stampFor = (slug: string) =>
    stampCompanyName && stampSlugs.has(slug) ? stampCompanyName : undefined;
  const offset = hero ? 1 : 0;

  return (
    <section className="w-full max-w-[944px] px-[16px] md:px-0">
      <div className="mb-[24px]">
        <Text variant="headline-small" className="text-[#251900]">
          Featured Work
        </Text>
      </div>
      {hero ? (
        <div className="mb-[40px]">
          <FadeDown delay={0}>
            <ProjectOverview
              layout="hero"
              slug={hero.slug}
              headline={hero.headline}
              tags={hero.tags}
              thumbnailClassName={hero.thumbnailClassName}
              image={hero.image}
              imageAlt={hero.imageAlt}
              stampCompanyName={stampFor(hero.slug)}
              stampSeal={stampSeal}
              previewOnly={Boolean(getProject(hero.slug)?.preview)}
              onClick={onCardClick}
            />
          </FadeDown>
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-x-[16px] gap-y-[40px] md:grid-cols-2">
        {projects.map((project, i) => (
          <FadeDown key={project.slug} delay={(i + offset) * 80}>
            <ProjectOverview
              slug={project.slug}
              headline={project.headline}
              tags={project.tags}
              thumbnailClassName={project.thumbnailClassName}
              image={project.image}
              imageAlt={project.imageAlt}
              stampCompanyName={stampFor(project.slug)}
              stampSeal={stampSeal}
              previewOnly={Boolean(getProject(project.slug)?.preview)}
              onClick={onCardClick}
            />
          </FadeDown>
        ))}
      </div>
    </section>
  );
}
