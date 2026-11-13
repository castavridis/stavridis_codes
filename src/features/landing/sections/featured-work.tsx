// ---------------------------------------------------------------------------
// Featured Work — optional full-width hero cards (image side alternating),
// then a 2x2 grid of project cards.
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
  // right (stacked on phones). Driven by CompanyConfig.heroSlugs.
  layout?: 'card' | 'hero';
  // Hero only: which column the thumbnail sits in at md+. 'right' swaps the
  // columns (text left, image right). Phones always stack image-first.
  imageSide?: 'left' | 'right';
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
  imageSide = 'left',
}: ProjectOverviewProps): React.ReactElement {
  const hero = layout === 'hero';
  const imageRight = hero && imageSide === 'right';
  return (
    <div
      className={
        hero
          ? // A white card at the system's card radius (16px) and inset (24px).
            // The image column is always the wider (3fr) one.
            `relative grid grid-cols-1 gap-[16px] rounded-[16px] bg-white p-[24px] md:items-center md:gap-x-[40px] ${imageRight ? 'md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]' : 'md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]'}`
          : 'relative flex flex-col gap-[16px]'
      }
    >
      {/* Thumbnail + seal share a relative wrapper so the seal tracks the
          thumbnail whichever column it's in. The seal sits beside the
          button, NOT inside it — the button's overflow-hidden + hover
          transform would otherwise clip it. */}
      <div className={`relative ${imageRight ? 'md:order-2' : ''}`}>
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
        {stampCompanyName ? (
          <span
            className="pointer-events-none absolute left-[-16px] top-[24px] z-10"
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
      </div>
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
          // Hero (horizontal) cards: the filled button's own hover (ink at
          // 85%) barely reads, so it inverts to paper with an ink border
          // instead — the mirror of the outline buttons filling in. The
          // border is there at rest too so the size doesn't jump.
          className={`self-start ${hero ? 'mt-[12px] border border-confetti-black hover:!bg-washes-paper hover:!text-confetti-black focus-visible:!bg-washes-paper focus-visible:!text-confetti-black' : 'mt-[8px]'}`}
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
  // Opt-in projects render only when a company config names them in
  // `featuredSlugs` / `heroSlugs` — never in the default (no-company)
  // landing. Use for preview / noindex case studies.
  optIn?: boolean;
};

// Order here is the default (no-company) landing's order.
const PROJECTS: Project[] = [
  {
    slug: 'caresignal-member-enrollment',
    headline: 'Redesigning member enrollment to exceed a health plan’s 20% target',
    tags: 'Product Strategy · Service Design · Product Design · Design Engineering',
    thumbnailClassName: 'bg-[#fdfbf5]',
    image: '/images/projects/caresignal-member-enrollment/thumbnail.webp',
    imageAlt: 'A woman on the phone in her kitchen.',
  },
  {
    // Matches content/projects/caresignal-clinician-app/index.mdx (nested
    // {slug}/index.mdx layout).
    slug: 'caresignal-clinician-app',
    headline: 'Scaling centralized care teams to safely manage 15 to 20× as many patients',
    tags: 'Product Strategy · Product Design · Service Design · Design Engineering',
    thumbnailClassName: 'bg-[#fdfbf5]',
    image: '/images/projects/caresignal-clinician-app/thumbnail.webp',
    imageAlt:
      'CareSignal thumbnail: an Engaged Patients card (1262 patients: 63 high, 189 medium, 1011 low risk) on a sky-and-field backdrop.',
  },
  {
    // v3.5 handoff of the clinician app case study
    // (content/projects/caresignal-clinician-app-impact).
    slug: 'caresignal-clinician-app-impact',
    headline: 'Helping centralized care teams safely manage 15× as many patients',
    tags: 'Product Strategy · Product Design · Service Design · Design Engineering',
    thumbnailClassName: 'bg-[#fdfbf5]',
    image: '/images/projects/caresignal-clinician-app-impact/thumbnail.webp',
    imageAlt: 'A smiling care-team member in a headset at their workstation.',
    optIn: true,
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
  {
    slug: 'caresignal-ai',
    headline: 'Designing a novel marketing site  for a new predictive model',
    tags: 'Visual Design · Copywriting · Front-End Engineering',
    thumbnailClassName: 'bg-washes-cerulean-blue',
    image: '/images/projects/CareSignal%20AI%20Thumbnail.png',
    imageAlt: 'CareSignal AI thumbnail.',
    // Off the default landing; company pages that name it still show it.
    optIn: true,
  },
];

// `slugs` (optional) — when provided, FeaturedWork renders only those
// projects in the given order. Used by /for/:company pages to surface
// the most-relevant work for that audience. Unknown slugs are skipped
// silently so a stale config can't blow up the landing. When absent,
// renders the canonical PROJECTS list (minus `optIn` entries).
//
// `heroSlugs` (optional) — renders those projects first, in order, as
// full-width two-column hero cards and drops them from the grid so they
// never show twice. The image alternates sides: left at even indices, right
// at odd. Unknown slugs are skipped. See CompanyConfig.heroSlugs.
//
// `featuredProjectSlugs` + `stampCompanyName` — when both are set, any
// project whose slug is in `featuredProjectSlugs` renders a rotating
// "Featured Project" seal over its thumbnail with the company name
// curved around it. See CompanyConfig.featuredProjects.
export function FeaturedWork({
  onCardClick,
  slugs,
  heroSlugs,
  featuredProjectSlugs,
  stampCompanyName,
  stampSeal,
}: {
  onCardClick?: (slug: string) => void;
  slugs?: string[];
  heroSlugs?: string[];
  featuredProjectSlugs?: string[];
  stampCompanyName?: string;
  stampSeal?: SealColors;
}): React.ReactElement {
  const heroes = (heroSlugs ?? [])
    .map((s) => PROJECTS.find((p) => p.slug === s))
    .filter((p): p is Project => Boolean(p));
  const heroSet = new Set(heroes.map((p) => p.slug));
  const projects = (
    slugs
      ? slugs
          .map((s) => PROJECTS.find((p) => p.slug === s))
          .filter((p): p is Project => Boolean(p))
      : PROJECTS.filter((p) => !p.optIn)
  ).filter((p) => !heroSet.has(p.slug));

  const stampSlugs = new Set(featuredProjectSlugs ?? []);
  const stampFor = (slug: string) =>
    stampCompanyName && stampSlugs.has(slug) ? stampCompanyName : undefined;
  const offset = heroes.length;

  return (
    <section className="w-full max-w-[944px] px-[16px] md:px-0">
      <div className="mb-[24px]">
        <Text variant="headline-small" className="text-[#251900]">
          Featured Work
        </Text>
      </div>
      {heroes.length > 0 ? (
        <div className="mb-[40px] flex flex-col gap-[40px]">
          {heroes.map((hero, i) => (
            <FadeDown key={hero.slug} delay={i * 80}>
              <ProjectOverview
                layout="hero"
                imageSide={i % 2 === 0 ? 'left' : 'right'}
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
          ))}
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
