'use client';

import LandingPage from './LandingPage';
import { routes } from '../routes.js';
import { useRadialReveal } from './useRadialReveal';

// Which hero project card links where. As a test of the transition, Project 01
// ("Building CareSignal's Design System") links to the hello-world post; the
// others have no destination yet and simply paint their canvas on click.
const PROJECT_HREFS: Record<string, string> = {
  'proj-careSignal-ds': routes.blogPost.href({ slug: 'hello-world' }),
};

// Wraps the landing page with the Figma page transition: clicking a linked
// project card expands a soft cream light from the cursor, then navigates.
export default function PageTransitionWrapper() {
  const { start, overlay } = useRadialReveal();
  return (
    <>
      <LandingPage
        onCardClick={(id) => {
          const href = PROJECT_HREFS[id];
          if (href) start(href);
        }}
      />
      {overlay}
    </>
  );
}
