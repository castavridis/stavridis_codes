import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { routes } from './routes.js';
import { getProject } from './features/projects/projects.js';
import { Analytics } from '@vercel/analytics/react';
import LandingPage from './features/landing/index.js';
import SheetOverlay from './components/anim/SheetOverlay.js';
import { getCompany, type CompanyConfig } from './features/companies/companies.js';
import { getStoredCompany, setStoredCompany, clearStoredCompany } from './features/companies/company-context.js';
import { HERO_PROJECTS } from './features/landing/hero/hero-projects.data.js';

const ProjectPost = lazy(() =>
  import('./features/projects/project-post.js').then((m) => ({ default: m.ProjectPost })),
);

const PROJECT_HREFS: Record<string, string> = {
  'proj-careSignal-ds': routes.project.href({ slug: 'caresignal-design-system' }),
  'proj-careSignal-ai': routes.project.href({ slug: 'caresignal-ai' }),
  'proj-sol-lewitt': routes.project.href({ slug: 'sol-lewitt' }),
};

export function App() {
  const [, navigate] = useLocation();
  const [matchForCompany, params] = useRoute(routes.forCompany.path);
  const [matchProject, projectParams] = useRoute(routes.project.path);

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

  // heroProjectIds order: [center/featured, left, right]
  // HERO_PROJECTS slot order: [left(0), right(1), center(2)]
  const heroProjects = useMemo(() => {
    if (!company?.heroProjectIds?.length) return undefined;
    const byId = Object.fromEntries(HERO_PROJECTS.map((p) => [p.id, p]));
    const [centerId, leftId, rightId] = company.heroProjectIds;
    const fill = (slotIdx: number, id: string | undefined) => {
      const slot = HERO_PROJECTS[slotIdx];
      if (!id) return slot;
      const c = byId[id];
      if (!c) return slot;
      return { ...slot, id: c.id, title: c.title, image: c.image, pigment: c.pigment, cta: c.cta };
    };
    return [fill(0, leftId), fill(1, rightId), fill(2, centerId)];
  }, [company?.heroProjectIds]);

  const handleCardHover = useCallback((id: string) => {
    const href = PROJECT_HREFS[id];
    const slug = href?.match(/\/project\/(.+)/)?.[1] ?? null;
    if (!slug) return;
    // Prefetch the ProjectPost chunk; once resolved, prime the MDX promise cache.
    void import('./features/projects/project-post.js').then(({ prefetchProject }) => {
      prefetchProject(slug);
    });
  }, []);

  const handleCardClick = useCallback(
    (id: string) => {
      const href = PROJECT_HREFS[id];
      if (href) navigate(href);
    },
    [navigate],
  );

  const projectSlug = matchProject ? projectParams?.slug ?? null : null;
  const projectOpen = projectSlug !== null;

  const handleCloseProject = useCallback(() => {
    navigate(routes.home.href());
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
          heroProjects={heroProjects}
        />
      </div>

      <SheetOverlay open={projectOpen} onClose={handleCloseProject}>
        {projectSlug ? <ProjectSheetContent slug={projectSlug} onBack={handleCloseProject} /> : null}
      </SheetOverlay>

      <Analytics />
    </main>
  );
}

// Wraps ProjectPost with a Suspense boundary and the cream-paper backdrop the
// sheet slides up over. Background color matches the project so there's no
// flash on lazy load.
function ProjectSheetContent({ slug, onBack }: { slug: string; onBack: () => void }) {
  const project = getProject(slug);
  const background = project?.background ?? '#fbf6ea';
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'auto',
        backgroundColor: background,
      }}
    >
      <Suspense fallback={<RoutePending />}>
        <ProjectPost slug={slug} onBack={onBack} />
      </Suspense>
    </div>
  );
}

function RoutePending() {
  return <p className="text-sm text-gray-500 p-8">Loading...</p>;
}
