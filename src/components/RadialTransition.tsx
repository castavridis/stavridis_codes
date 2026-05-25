'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';

const CREAM = '#fbf6ea';
const EXPAND_MS = 850; // cream grows from the cursor until it fills the viewport
const REVEAL_MS = 650; // cream holds, then fades to reveal the destination

type Phase =
  | { kind: 'idle' }
  | { kind: 'cover'; x: number; y: number; radius: number; href: string }
  | { kind: 'reveal' };

type TransitionApi = { start: (href: string) => void };

const TransitionContext = createContext<TransitionApi>({ start: () => {} });

export function useTransition(): TransitionApi {
  return useContext(TransitionContext);
}

// Provides the Figma "cream radial light" page transition globally. The overlay
// lives above the router so it persists across the route change — the cream
// holds over the destination until it has painted, eliminating the content
// flash. `start(href)` expands a cream disc from the cursor, navigates beneath
// it, then fades the cream away.
export function TransitionProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [, navigate] = useLocation();
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  // Last pointer-down position — the origin of the radial. Captured on the
  // window (capture phase) so it's fresh by the time a click handler fires.
  const pointer = useRef({ x: 0, y: 0, seen: false });

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      pointer.current = { x: e.clientX, y: e.clientY, seen: true };
    };
    window.addEventListener('pointerdown', onDown, true);
    return () => window.removeEventListener('pointerdown', onDown, true);
  }, []);

  const start = useCallback(
    (href: string) => {
      if (phase.kind !== 'idle') return;
      const p = pointer.current;
      const x = p.seen ? p.x : window.innerWidth / 2;
      const y = p.seen ? p.y : window.innerHeight / 2;
      // Oversize past the viewport diagonal so the gradient's solid core covers
      // every corner once the animation completes, from any origin.
      const radius = Math.hypot(window.innerWidth, window.innerHeight) * 1.5;
      setPhase({ kind: 'cover', x, y, radius, href });
    },
    [phase]
  );

  // When the expand finishes, the screen is full cream: navigate beneath it and
  // hand off to the fade-out phase.
  const onExpandEnd = useCallback(() => {
    if (phase.kind !== 'cover') return;
    navigate(phase.href);
    setPhase({ kind: 'reveal' });
  }, [phase, navigate]);

  const onRevealEnd = useCallback(() => {
    setPhase({ kind: 'idle' });
  }, []);

  // Safety nets if an animation-end event never fires (e.g. backgrounded tab).
  useEffect(() => {
    if (phase.kind === 'cover') {
      const t = window.setTimeout(onExpandEnd, EXPAND_MS + 250);
      return () => window.clearTimeout(t);
    }
    if (phase.kind === 'reveal') {
      const t = window.setTimeout(onRevealEnd, REVEAL_MS + 250);
      return () => window.clearTimeout(t);
    }
  }, [phase, onExpandEnd, onRevealEnd]);

  return (
    <TransitionContext.Provider value={{ start }}>
      {children}
      {phase.kind === 'cover' && (
        <div
          aria-hidden="true"
          style={{ position: 'fixed', inset: 0, zIndex: 100, overflow: 'hidden', pointerEvents: 'all' }}
        >
          <div
            onAnimationEnd={onExpandEnd}
            style={{
              position: 'absolute',
              left: phase.x,
              top: phase.y,
              width: phase.radius * 2,
              height: phase.radius * 2,
              marginLeft: -phase.radius,
              marginTop: -phase.radius,
              transform: 'scale(0)',
              transformOrigin: 'center',
              // Soft-edged cream disc: solid core (covers the viewport at full
              // scale) feathering to transparent at the growing rim.
              background: `radial-gradient(circle ${phase.radius}px at center, ${CREAM} 0%, ${CREAM} 72%, rgba(251,246,234,0) 100%)`,
              animation: `radial-reveal ${EXPAND_MS}ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards`,
              willChange: 'transform',
            }}
          />
        </div>
      )}
      {phase.kind === 'reveal' && (
        <div
          aria-hidden="true"
          onAnimationEnd={onRevealEnd}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: CREAM,
            pointerEvents: 'all',
            animation: `cream-fade-out ${REVEAL_MS}ms ease-out forwards`,
            willChange: 'opacity',
          }}
        />
      )}
    </TransitionContext.Provider>
  );
}
