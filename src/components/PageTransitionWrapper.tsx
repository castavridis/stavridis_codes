'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import LandingPage from './LandingPage';
import { routes } from '../routes.js';

// Which hero project card links where. As a test of the transition, Project 01
// ("Building CareSignal's Design System") links to the hello-world post; the
// others have no destination yet and simply paint their canvas on click.
const PROJECT_HREFS: Record<string, string> = {
  'proj-careSignal-ds': routes.blogPost.href({ slug: 'hello-world' }),
};

const CREAM = '#fbf6ea';
const REVEAL_MS = 850;

type Reveal = { x: number; y: number; radius: number; href: string };

// Wraps the landing page with the Figma page transition: clicking a linked
// project card expands a soft cream light outward from the cursor until it
// fills the viewport, then navigates. The wrapper (and overlay) unmount with
// the route change, so the destination appears beneath the filled-in light.
export default function PageTransitionWrapper() {
  const [, navigate] = useLocation();
  const [reveal, setReveal] = useState<Reveal | null>(null);
  // Last pointer-down position — the origin of the radial. Captured on the
  // window (capture phase) so it's fresh by the time the card's click fires.
  const pointer = useRef({ x: 0, y: 0, seen: false });
  const navigated = useRef(false);

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      pointer.current = { x: e.clientX, y: e.clientY, seen: true };
    };
    window.addEventListener('pointerdown', onDown, true);
    return () => window.removeEventListener('pointerdown', onDown, true);
  }, []);

  const handleCardClick = useCallback(
    (id: string) => {
      if (reveal) return;
      const href = PROJECT_HREFS[id];
      if (!href) return;
      const p = pointer.current;
      const x = p.seen ? p.x : window.innerWidth / 2;
      const y = p.seen ? p.y : window.innerHeight / 2;
      // Oversize past the viewport diagonal so the gradient's solid core covers
      // every corner once the animation completes, from any click origin.
      const radius = Math.hypot(window.innerWidth, window.innerHeight) * 1.5;
      navigated.current = false;
      setReveal({ x, y, radius, href });
    },
    [reveal]
  );

  const finish = useCallback(() => {
    if (navigated.current || !reveal) return;
    navigated.current = true;
    navigate(reveal.href);
  }, [navigate, reveal]);

  // Safety net in case the animation's end event never fires (e.g. the tab is
  // backgrounded mid-transition).
  useEffect(() => {
    if (!reveal) return;
    const t = window.setTimeout(finish, REVEAL_MS + 150);
    return () => window.clearTimeout(t);
  }, [reveal, finish]);

  return (
    <>
      <LandingPage onCardClick={handleCardClick} />
      {reveal && (
        <div
          aria-hidden="true"
          style={{ position: 'fixed', inset: 0, zIndex: 50, overflow: 'hidden', pointerEvents: 'all' }}
        >
          <div
            onAnimationEnd={finish}
            style={{
              position: 'absolute',
              left: reveal.x,
              top: reveal.y,
              width: reveal.radius * 2,
              height: reveal.radius * 2,
              marginLeft: -reveal.radius,
              marginTop: -reveal.radius,
              transform: 'scale(0)',
              transformOrigin: 'center',
              // Soft-edged cream disc: solid core (covers the viewport at full
              // scale) feathering to transparent at the growing rim.
              background: `radial-gradient(circle ${reveal.radius}px at center, ${CREAM} 0%, ${CREAM} 72%, rgba(251,246,234,0) 100%)`,
              animation: `radial-reveal ${REVEAL_MS}ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards`,
              willChange: 'transform',
            }}
          />
        </div>
      )}
    </>
  );
}
