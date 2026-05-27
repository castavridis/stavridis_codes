import { lazy, Suspense, useEffect, useLayoutEffect, useState } from 'react';
import { useLocation } from 'wouter';
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

const ProjectPost = lazy(() =>
  import('./features/projects/project-post.js').then((m) => ({ default: m.ProjectPost })),
);

export function App() {
  return (
    <TransitionProvider>
      {(phase) => (
        <main className="font-light color-[#251900] overflow-x-hidden">
          <ScrollLock active={phase.kind !== 'idle'} />
          {/* Landing page — always mounted, paused when project is fully open. */}
          <div className="w-full">
            <PageTransitionWrapper paused={phase.kind === 'open'} />
          </div>

          <ProjectRouter phase={phase} />
          <Analytics />
        </main>
      )}
    </TransitionProvider>
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

  // When the close animation finishes (phase → idle), navigate home and
  // clear the slug.
  useEffect(() => {
    if (phase.kind === 'idle' && slug !== null) {
      navigate(routes.home.href(), { replace: false });
      setSlug(null);
      window.scrollTo(0, 0);
    }
  }, [phase.kind, slug, navigate]);

  // Reset scroll when the open animation completes.
  useEffect(() => {
    if (phase.kind === 'open') {
      window.scrollTo(0, 0);
    }
  }, [phase.kind]);

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
