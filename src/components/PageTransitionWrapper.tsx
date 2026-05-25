'use client';

import LandingPage from './LandingPage';
import { routes } from '../routes.js';
import { useTransition } from './RadialTransition';

// Which hero project card links where. As a test of the transition, Project 01
// ("Building CareSignal's Design System") links to the hello-world post; the
// others have no destination yet and simply paint their canvas on click.
const PROJECT_HREFS: Record<string, string> = {
  'proj-careSignal-ds': routes.blogPost.href({ slug: 'caresignal-design-system' }),
  'proj-careSignal-ai': routes.blogPost.href({ slug: 'caresignal-ai' }),
  'proj-sol-lewitt': routes.blogPost.href({ slug: 'sol-lewitt' }),
};

// Bridges the landing page's project cards to the global page transition.
export default function PageTransitionWrapper(): React.ReactElement {
  const { start } = useTransition();
  return (
    <LandingPage
      onCardClick={(id) => {
        const href = PROJECT_HREFS[id];
        if (href) start(href);
      }}
    />
  );
}
