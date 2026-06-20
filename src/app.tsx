import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { routes } from './routes.js';
import { getProject } from './features/projects/projects.js';
import { Analytics } from '@vercel/analytics/react';
import LandingPage from './features/landing/index.js';
import SheetOverlay from './components/anim/SheetOverlay.js';
import { getCompany, type CompanyConfig } from './features/companies/companies.js';
import { getStoredCompany, setStoredCompany, clearStoredCompany } from './features/companies/company-context.js';
import { usePaintStore } from './lib/paint-store.js';

// Height of the landing's wash-shell section (logo + nav + Contact Me +
// washes canvas). Matches the inline `height: 660px` in landing-page.tsx
// (the `<section>` that wraps the wash + glass card). The project
// SheetOverlay starts BELOW this band so the wash shell remains visible
// at the top of the viewport while a case study is open — see Path A
// in the project-overlay arch (single source of truth for the wash
// shell; the SheetOverlay leaves the area above it untouched).
const LANDING_WASH_SHELL_HEIGHT = 660;
// Click-project chain step 1 duration: window scrolls to top + the
// intro glass card fades down to opacity 0. We wait for that to settle
// before kicking off the SheetOverlay slide-up (step 2). Matches the
// glass-card spring (~280-300ms to land) so step 2 starts as step 1
// finishes — no overlap, no gap.
const PROJECT_CHAIN_STEP1_MS = 300;

const ProjectPost = lazy(() =>
  import('./features/projects/project-post.js').then((m) => ({ default: m.ProjectPost })),
);

const BlogIndex = lazy(() =>
  import('./features/blog/index.js').then((m) => ({ default: m.BlogIndex })),
);

const BlogPost = lazy(() =>
  import('./features/blog/index.js').then((m) => ({ default: m.BlogPost })),
);


export function App() {
  const [, navigate] = useLocation();
  const [matchForCompany, params] = useRoute(routes.forCompany.path);
  const [matchProject, projectParams] = useRoute(routes.project.path);
  const [matchBlogPost, blogPostParams] = useRoute(routes.blogPost.path);
  const [matchBlogIndex] = useRoute(routes.blogIndex.path);

  // Route-matched config (visitor is on /for/:company right now).
  const routeCompany: CompanyConfig | null = matchForCompany && params?.company
    ? getCompany(params.company)
    : null;

  // Persisted config (visitor was on /for/:company in a previous session).
  const [storedCompany, setStoredCompanyState] = useState<CompanyConfig | null>(() => {
    const stored = getStoredCompany();
    if (!stored) return null;
    return getCompany(stored.slug);
  });

  // On each /for/:company visit: write to localStorage (resets TTL).
  useEffect(() => {
    if (routeCompany && params?.company) {
      setStoredCompany(params.company, routeCompany.name);
      setStoredCompanyState(routeCompany);
    }
  }, [routeCompany, params?.company]);

  const company = routeCompany ?? storedCompany;

  const handleDismiss = useCallback(() => {
    clearStoredCompany();
    setStoredCompanyState(null);
    if (matchForCompany) navigate(routes.home.href());
  }, [matchForCompany, navigate]);

  // The FeaturedWork cards pass v2 project slugs directly (`caresignal-
  // platform`, `fracta`, `sqshbook`, `caresignal-ai`), so we route on the
  // slug verbatim. No id → slug map needed in v2.
  const handleCardHover = useCallback((slug: string) => {
    void import('./features/projects/project-post.js').then(({ prefetchProject }) => {
      prefetchProject(slug);
    });
  }, []);

  const setProjectOpenInStore = usePaintStore((s) => s.setProjectOpen);
  const setPaintActiveInStore = usePaintStore((s) => s.setPaintActive);

  // Click-project transition chain (see tmp/click-project-transition/):
  //   Step 1 — scroll window to top + glass card fades to opacity 0.
  //            Driven by setting `projectOpen` in the paint store BEFORE
  //            navigating; landing-page reads the flag and runs the same
  //            fade/translate spring it uses for paint mode (the
  //            visual is shared; paint mode itself is NOT activated).
  //   Step 2 — once step 1 has had time to settle (300ms), navigate to
  //            the project route. wouter route match flips on, the
  //            SheetOverlay opens, and react-spring slides it up.
  //
  // We pre-arm the store flag before the actual route change so the
  // fade starts immediately on click — without waiting for the
  // ProjectPost lazy chunk to load. If the user was painting when
  // they clicked the card, we also close paint mode so the project
  // sheet can slide up without contending with the paint-sheet-down
  // animation gate (sheetOpen = projectOpen && !paintActive).
  const handleCardClick = useCallback(
    (slug: string) => {
      setProjectOpenInStore(true);
      setPaintActiveInStore(false);
      // Scroll the window, not via scrollIntoView (same reasoning as
      // PresetWidget): the landing root has overflow-hidden, so a
      // scrollIntoView would shift content within the clip instead of
      // moving the page viewport.
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.setTimeout(() => {
        navigate(routes.project.href({ slug }));
      }, PROJECT_CHAIN_STEP1_MS);
    },
    [navigate, setProjectOpenInStore, setPaintActiveInStore],
  );

  const projectSlug = matchProject ? projectParams?.slug ?? null : null;
  const projectOpen = projectSlug !== null;
  const paintActive = usePaintStore((s) => s.paintActive);
  // The project sheet is visually open ONLY when there's a project
  // route AND paint mode is off. Entering paint mode while a project
  // is open slides the sheet down (useTransition's leave animation)
  // to expose the wash for painting; closing paint mode (X) slides
  // the sheet back up. The actual route + renderedProjectSlug bridge
  // keep the content mounted across both transitions.
  const sheetOpen = projectOpen && !paintActive;

  // Keep the most recent non-null slug rendered while the SheetOverlay
  // is animating its close (slide down + fade out). Without this, the
  // moment the route flips back to `/`, `projectSlug` is null and the
  // sheet's children are unmounted instantly — so the leave animation
  // would slide an empty box down. We bridge `projectSlug` with a
  // delayed-null pattern: keep the prior slug rendered for the duration
  // of the sheet's close animation (600ms + small buffer), then drop it.
  const [renderedProjectSlug, setRenderedProjectSlug] = useState(projectSlug);
  useEffect(() => {
    if (projectSlug) {
      setRenderedProjectSlug(projectSlug);
      return;
    }
    const t = window.setTimeout(() => setRenderedProjectSlug(null), 700);
    return () => window.clearTimeout(t);
  }, [projectSlug]);

  // Mirror projectOpen into the paint store so downstream consumers
  // (PaintBrush, glass card, Header PaintToggle) gate themselves
  // uniformly. The `handleCardClick` path pre-arms this BEFORE the
  // route flips so step 1 of the chain starts immediately; this effect
  // covers the reverse direction (close, back-button, direct URL).
  useEffect(() => {
    setProjectOpenInStore(projectOpen);
  }, [projectOpen, setProjectOpenInStore]);

  const handleCloseProject = useCallback(() => {
    navigate(routes.home.href());
  }, [navigate]);

  // Blog routes ride the same SheetOverlay as projects so the landing stays
  // mounted beneath. Either the index (/blog) or a single post (/blog/:slug)
  // triggers the sheet; the inner content branches on which matched.
  const blogPostSlug = matchBlogPost ? blogPostParams?.slug ?? null : null;
  const blogOpen = Boolean(matchBlogIndex) || blogPostSlug !== null;

  const handleCloseBlog = useCallback(() => {
    navigate(routes.home.href());
  }, [navigate]);

  const handleCloseBlogPost = useCallback(() => {
    navigate(routes.blogIndex.href());
  }, [navigate]);

  return (
    <main className="font-light color-[#251900] overflow-x-hidden">
      {/* Landing page — always mounted beneath the project sheet overlay. */}
      <div className="w-full">
        <LandingPage
          paused={projectOpen}
          transitioning={projectOpen}
          onCardHover={handleCardHover}
          onCardClick={handleCardClick}
          company={company?.name}
          blurb={company?.blurb}
          onDismiss={company ? handleDismiss : undefined}
          featuredSlugs={company?.featuredSlugs}
        />
      </div>

      {/* Project sheet — Path A: opens BELOW the landing wash shell so
          the cream-rounded-wash header (logo + nav + Contact Me) stays
          visible and interactive at the top of the viewport while a
          case study is open. Only the v2 case study chrome (MDXLayout)
          assumes the visible-landing-header context; the v1 chrome
          carries its own gradient header and is fine sitting under
          the same offset (it just gets clipped at the top edge by the
          remaining viewport — both shapes scroll cleanly within the
          inner scroll container). */}
      <SheetOverlay
        open={sheetOpen}
        onClose={handleCloseProject}
        topOffset={135}
      >
        {renderedProjectSlug ? <ProjectSheetContent slug={renderedProjectSlug} onBack={handleCloseProject} /> : null}
      </SheetOverlay>

      {/* Blog sheet — full-viewport (no topOffset). The blog index/post
          covers the full landing including the wash shell, per the spec
          non-goal "don't change SheetOverlay semantics for the BLOG
          overlay". */}
      <SheetOverlay open={blogOpen} onClose={handleCloseBlog}>
        <BlogSheetContent
          postSlug={blogPostSlug}
          onBackToIndex={handleCloseBlogPost}
        />
      </SheetOverlay>

      <Analytics />
    </main>
  );
}

// Wraps ProjectPost with a Suspense boundary. The backdrop branches on the
// project shape:
//
// - v1 posts (legacy chrome — gradient header + prose column) assume a full
//   cream surface as their chrome, so we paint the cream backdrop here so
//   there's no flash on lazy load.
// - v2 posts (frontmatter has `headline` + `introduction`, rendered through
//   MDXLayout) own their own in-page cream-paper background. The sheet
//   backdrop here is left transparent so the landing wash beneath the sheet
//   stays visible as the project slides up.
function ProjectSheetContent({ slug, onBack }: { slug: string; onBack: () => void }) {
  const project = getProject(slug);
  // Mirrors `isV2Project` in project-post.tsx.
  const isV2 = Boolean(project?.headline && project?.introduction);
  const backgroundColor = isV2 ? 'transparent' : (project?.background ?? '#fbf6ea');
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'auto',
        backgroundColor,
      }}
    >
      <Suspense fallback={<RoutePending />}>
        <ProjectPost slug={slug} onBack={onBack} />
      </Suspense>
    </div>
  );
}

// Mirrors ProjectSheetContent but for the blog: cream-paper backdrop, lazy
// boundary around BlogIndex/BlogPost. `postSlug === null` renders the index
// (/blog); a slug renders the single post (/blog/:slug). The sheet is opened
// by the parent for either route, so this just branches on payload.
function BlogSheetContent({
  postSlug,
  onBackToIndex,
}: {
  postSlug: string | null;
  onBackToIndex: () => void;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'auto',
        backgroundColor: '#fbf6ea',
      }}
    >
      <Suspense fallback={<RoutePending />}>
        {postSlug ? <BlogPost slug={postSlug} onBack={onBackToIndex} /> : <BlogIndex />}
      </Suspense>
    </div>
  );
}

function RoutePending() {
  return <p className="text-sm text-gray-500 p-8">Loading...</p>;
}
