import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { routes } from './routes.js';
import {
  TransitionProvider,
  ProjectOverlay,
  useTransition,
  type Phase,
} from './components/RadialTransition';
import { getProject } from './features/projects/projects.js';
import { Analytics } from '@vercel/analytics/react';
import PageTransitionWrapper from './components/PageTransitionWrapper';
import { getCompany, type CompanyConfig } from './features/companies/companies.js';
import { getStoredCompany, setStoredCompany, clearStoredCompany } from './features/companies/company-context.js';

const ProjectPost = lazy(() =>
  import('./features/projects/project-post.js').then((m) => ({ default: m.ProjectPost })),
);

export function App() {
  return (
    <TransitionProvider>
      {(phase) => <AppInner phase={phase} />}
    </TransitionProvider>
  );
}

function AppInner({ phase }: { phase: Phase }) {
  const [matchForCompany, params] = useRoute(routes.forCompany.path);

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
  }, []);

  return (
    <main className="font-light color-[#251900] overflow-x-hidden">
      <ScrollLock active={phase.kind !== 'idle'} />
      {/* Landing page — always mounted, paused when project is fully open. */}
      <div className="w-full">
        <PageTransitionWrapper
          paused={phase.kind === 'open'}
          company={company}
          onDismiss={company ? handleDismiss : undefined}
        />
      </div>

      <ProjectRouter phase={phase} />
      <Analytics />
    </main>
  );
}

// ---------------------------------------------------------------------------
// ProjectRouter — tracks the active project slug and renders it inside the
// radial clip-path overlay. Syncs the browser URL.
// ---------------------------------------------------------------------------

function ProjectRouter({ phase }: { phase: Phase }) {
  const { close } = useTransition();
  const [, navigate] = useLocation();
  const [slug, setSlug] = useState<string | null>(null);
  const slugRef = useRef(slug);
  slugRef.current = slug;

  // When a transition starts, extract slug from href and push the URL.
  useEffect(() => {
    if (phase.kind === 'opening') {
      const match = (phase as { href: string }).href.match(/\/project\/(.+)/);
      if (match) {
        setSlug(match[1]);
        navigate((phase as { href: string }).href, { replace: false });
      }
    }
  }, [phase, navigate]);

  // When the close animation finishes (phase → idle), navigate home and clear
  // the slug. Uses a ref so this only re-runs on phase changes — not when slug
  // is set by a direct URL load, which would falsely trigger a home redirect.
  useEffect(() => {
    if (phase.kind === 'idle' && slugRef.current !== null) {
      navigate(routes.home.href(), { replace: false });
      setSlug(null);
      window.scrollTo(0, 0);
    }
  }, [phase.kind, navigate]);

  // Reset scroll when the open animation completes.
  useEffect(() => {
    if (phase.kind === 'open') {
      window.scrollTo(0, 0);
    }
  }, [phase.kind]);

  // Close on Escape.
  useEffect(() => {
    if (phase.kind !== 'open') return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase.kind, close]);

  // Handle browser back while overlay is open.
  const [location] = useLocation();
  useEffect(() => {
    if (location === '/' && phase.kind === 'open' && slug) {
      close();
    }
  }, [location, phase.kind, slug, close]);

  // Support direct navigation to /project/:slug on page load.
  useEffect(() => {
    const match = window.location.pathname.match(/\/project\/(.+)/);
    if (match && !slug && phase.kind === 'idle') {
      setSlug(match[1]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isDirectLoad = phase.kind === 'idle' && slug !== null;

  if (!slug) return null;

  const project = getProject(slug);
  const background = project?.background ?? '#fbf6ea';

  // Direct-load (e.g. shared link): show project without animation.
  if (isDirectLoad) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          overflow: 'auto',
          backgroundColor: background,
        }}
      >
        <Suspense fallback={<RoutePending />}>
          <ProjectPost
            slug={slug}
            onBack={() => {
              setSlug(null);
              navigate(routes.home.href(), { replace: false });
            }}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <ProjectOverlay background={background}>
      <Suspense fallback={<RoutePending />}>
        <ProjectPost slug={slug} onBack={close} />
      </Suspense>
    </ProjectOverlay>
  );
}

// Lock body scroll while the project overlay is visible so the landing page
// doesn't scroll behind it.
function ScrollLock({ active }: { active: boolean }) {
  useLayoutEffect(() => {
    if (!active) return;
    const scrollY = window.scrollY;
    const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.paddingRight = `${scrollbarW}px`;
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.paddingRight = '';
      window.scrollTo(0, scrollY);
    };
  }, [active]);
  return null;
}

function RoutePending() {
  return <p className="text-sm text-gray-500 p-8">Loading...</p>;
}
