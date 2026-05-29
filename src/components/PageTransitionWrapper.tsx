'use client';

import { useCallback } from 'react';
import LandingPage from '../features/landing';
import { routes } from '../routes.js';
import { useTransition } from './RadialTransition';

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
}: {
  paused?: boolean;
}): React.ReactElement {
  const { start, phase } = useTransition();
  const transitioning = phase.kind === 'opening' || phase.kind === 'open';

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
    />
  );
}
