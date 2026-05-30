'use client';

import { useCallback, useMemo } from 'react';
import LandingPage from '../features/landing';
import { routes } from '../routes.js';
import { useTransition } from './RadialTransition';
import type { CompanyConfig } from '../features/companies/companies.js';
import { HERO_PROJECTS } from '../features/landing/hero/hero-projects.data.js';

const PROJECT_HREFS: Record<string, string> = {
  'proj-careSignal-ds': routes.project.href({ slug: 'caresignal-design-system' }),
  'proj-careSignal-ai': routes.project.href({ slug: 'caresignal-ai' }),
  'proj-sol-lewitt': routes.project.href({ slug: 'sol-lewitt' }),
};

function slugFromHref(href: string): string | null {
  return href.match(/\/project\/(.+)/)?.[1] ?? null;
}

export default function PageTransitionWrapper({
  paused = false,
  company,
  onDismiss,
}: {
  paused?: boolean;
  company?: CompanyConfig | null;
  onDismiss?: () => void;
}): React.ReactElement {
  const { start, phase } = useTransition();
  const transitioning = phase.kind === 'opening' || phase.kind === 'open';

  const heroProjects = useMemo(() => {
    if (!company?.heroProjectIds?.length) return undefined;
    const byId = Object.fromEntries(HERO_PROJECTS.map((p) => [p.id, p]));
    const ordered = company.heroProjectIds.map((id) => byId[id]).filter(Boolean);
    return ordered.length ? ordered : undefined;
  }, [company?.heroProjectIds]);

  const handleCardHover = useCallback((id: string) => {
    const href = PROJECT_HREFS[id];
    const slug = href ? slugFromHref(href) : null;
    if (!slug) return;
    // Prefetch the ProjectPost chunk; once resolved, prime the MDX promise cache.
    void import('../features/projects/project-post.js').then(({ prefetchProject }) => {
      prefetchProject(slug);
    });
  }, []);

  return (
    <LandingPage
      paused={paused}
      transitioning={transitioning}
      onCardHover={handleCardHover}
      onCardClick={(id) => {
        const href = PROJECT_HREFS[id];
        if (href) start(href);
      }}
      company={company?.name}
      blurb={company?.blurb}
      onDismiss={onDismiss}
      heroProjects={heroProjects}
    />
  );
}
