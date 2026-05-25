'use client';

import { useRef, useState } from 'react';
import { useLocation } from 'wouter';
import LandingPage from './LandingPage';
import { routes } from '../routes.js';

// Which hero project card links where. As a test of the transition, Project 01
// ("Building CareSignal's Design System") links to the hello-world post; the
// others have no destination yet and simply paint their canvas on click.
const PROJECT_HREFS: Record<string, string> = {
  'proj-careSignal-ds': routes.blogPost.href({ slug: 'hello-world' }),
};

// Wraps the landing page with a fade-to-color transition. Clicking a linked
// project card fades a cover in; once it's fully opaque we navigate to the
// linked route. The wrapper (and the cover) unmount with that route change, so
// the destination appears right where the cover was.
export default function PageTransitionWrapper() {
  const [, navigate] = useLocation();
  const [fading, setFading] = useState(false);
  const pendingHref = useRef<string | null>(null);

  function handleCardClick(id: string) {
    if (fading) return;
    const href = PROJECT_HREFS[id];
    if (!href) return;
    pendingHref.current = href;
    setFading(true);
  }

  function handleTransitionEnd() {
    if (fading && pendingHref.current) {
      const href = pendingHref.current;
      pendingHref.current = null;
      setFading(false);
      navigate(href);
    }
  }

  return (
    <>
      <LandingPage onCardClick={handleCardClick} />
      <div
        aria-hidden="true"
        onTransitionEnd={handleTransitionEnd}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          backgroundColor: '#6b1212',
          opacity: fading ? 1 : 0,
          transition: 'opacity 600ms ease',
          pointerEvents: fading ? 'all' : 'none',
        }}
      />
    </>
  );
}
