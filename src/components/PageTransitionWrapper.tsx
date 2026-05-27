'use client';

import LandingPage from './LandingPage';
import { routes } from '../routes.js';
import { useTransition } from './RadialTransition';

const PROJECT_HREFS: Record<string, string> = {
  'proj-careSignal-ds': routes.project.href({ slug: 'caresignal-design-system' }),
  'proj-careSignal-ai': routes.project.href({ slug: 'caresignal-ai' }),
  'proj-sol-lewitt': routes.project.href({ slug: 'sol-lewitt' }),
};

export default function PageTransitionWrapper({
  paused = false,
}: {
  paused?: boolean;
}): React.ReactElement {
  const { start } = useTransition();
  return (
    <LandingPage
      paused={paused}
      onCardClick={(id) => {
        const href = PROJECT_HREFS[id];
        if (href) start(href);
      }}
    />
  );
}
