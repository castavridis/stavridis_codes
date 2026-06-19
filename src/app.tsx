import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { routes } from './routes.js';
import { Analytics } from '@vercel/analytics/react';
import LandingPage from './features/landing/index.js';
import SheetOverlay from './components/anim/SheetOverlay.js';
import { getCompany, type CompanyConfig } from './features/companies/companies.js';
import { getStoredCompany, setStoredCompany, clearStoredCompany } from './features/companies/company-context.js';

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

  const handleCardClick = useCallback(
    (slug: string) => {
      navigate(routes.project.href({ slug }));
    },
    [navigate],
  );

  const projectSlug = matchProject ? projectParams?.slug ?? null : null;
  const projectOpen = projectSlug !== null;

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

      <SheetOverlay open={projectOpen} onClose={handleCloseProject}>
        {projectSlug ? <ProjectSheetContent slug={projectSlug} onBack={handleCloseProject} /> : null}
      </SheetOverlay>

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

// Wraps ProjectPost with a Suspense boundary and provides the scroll
// container the sheet slides up over. The container itself is transparent so
// the landing wash beneath remains visible during the slide-up transition —
// the v2 MDXLayout supplies its own washes-paper backdrop once mounted, and
// any v1 posts paint their own `project.background` on their inner article.
function ProjectSheetContent({ slug, onBack }: { slug: string; onBack: () => void }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'auto',
        backgroundColor: 'transparent',
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
