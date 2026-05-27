'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type ReactElement,
} from 'react';

// ---------------------------------------------------------------------------
// Radial mask transition
//
// The project page sits in a fixed overlay above the landing page and is
// revealed / hidden via an animated CSS mask-image radial gradient.
//
// Opening: an opaque radial disc grows from the click point, revealing the
//          project content with a soft feathered edge.
// Closing: a transparent radial disc grows from the click point, erasing the
//          project content outward to reveal the landing page beneath.
// ---------------------------------------------------------------------------

const EXPAND_MS = 850;
const CONTRACT_MS = 750;

type Phase =
  | { kind: 'idle' }
  | { kind: 'opening'; x: number; y: number; href: string }
  | { kind: 'open' }
  | { kind: 'closing'; x: number; y: number };

type TransitionApi = {
  start: (href: string) => void;
  close: () => void;
  advanceOpen: () => void;
  advanceClose: () => void;
  phase: Phase;
};

const TransitionContext = createContext<TransitionApi>({
  start: () => {},
  close: () => {},
  advanceOpen: () => {},
  advanceClose: () => {},
  phase: { kind: 'idle' },
});

export function useTransition(): TransitionApi {
  return useContext(TransitionContext);
}

export function TransitionProvider({
  children,
}: {
  children: (phase: Phase) => ReactNode;
}): ReactElement {
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
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
      setPhase({ kind: 'opening', x, y, href });
    },
    [phase],
  );

  const close = useCallback(() => {
    if (phase.kind !== 'open') return;
    const p = pointer.current;
    const x = p.seen ? p.x : window.innerWidth / 2;
    const y = p.seen ? p.y : window.innerHeight / 2;
    setPhase({ kind: 'closing', x, y });
  }, [phase]);

  const advanceOpen = useCallback(() => {
    setPhase((prev) => (prev.kind === 'opening' ? { kind: 'open' } : prev));
  }, []);

  const advanceClose = useCallback(() => {
    setPhase((prev) => (prev.kind === 'closing' ? { kind: 'idle' } : prev));
  }, []);

  // Safety timeouts for backgrounded tabs.
  useEffect(() => {
    if (phase.kind === 'opening') {
      const t = window.setTimeout(advanceOpen, EXPAND_MS + 250);
      return () => window.clearTimeout(t);
    }
    if (phase.kind === 'closing') {
      const t = window.setTimeout(advanceClose, CONTRACT_MS + 250);
      return () => window.clearTimeout(t);
    }
  }, [phase, advanceOpen, advanceClose]);

  return (
    <TransitionContext.Provider value={{ start, close, advanceOpen, advanceClose, phase }}>
      {children(phase)}
    </TransitionContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// ProjectOverlay — the masked layer that holds the project page content.
// Opening uses an opaque-core radial mask that grows outward.
// Closing uses a transparent-core radial mask that grows outward.
// Both are driven by rAF for smooth, cross-browser gradient animation.
// ---------------------------------------------------------------------------

function maxRadius() {
  return Math.hypot(window.innerWidth, window.innerHeight);
}

// Easing: cubic-bezier(0.22, 0.61, 0.36, 1) — sampled as a JS function.
function ease(t: number): number {
  // cubic-bezier(0.22, 0.61, 0.36, 1) via Newton-Raphson root finding.
  const p1x = 0.22, p1y = 0.61, p2x = 0.36, p2y = 1.0;
  // Newton-Raphson to find parameter u for a given t (x-axis):
  let u = t;
  for (let i = 0; i < 8; i++) {
    const cx = 3 * p1x * u * (1 - u) * (1 - u) + 3 * p2x * u * u * (1 - u) + u * u * u - t;
    const dx = 3 * p1x * (1 - u) * (1 - u) - 6 * p1x * u * (1 - u) + 6 * p2x * u * (1 - u) - 3 * p2x * u * u + 3 * u * u;
    if (Math.abs(dx) < 1e-6) break;
    u -= cx / dx;
  }
  u = Math.max(0, Math.min(1, u));
  return 3 * p1y * u * (1 - u) * (1 - u) + 3 * p2y * u * u * (1 - u) + u * u * u;
}

// ---------------------------------------------------------------------------
// ProjectOverlay — single persistent container whose mask is driven by a ref.
//
// Children stay mounted across all phase transitions (opening → open →
// closing) so there is never a remount flash.
//
// "reveal"  (opening):  opaque disc grows outward → content appears.
// "dissolve" (closing):  transparent disc grows outward → content vanishes.
// "open":               mask cleared — fully visible, no animation cost.
// ---------------------------------------------------------------------------

const FEATHER_PX = 80;

// Background color endpoints — the overlay bg blends between the landing
// page's dark tone and the project page's cream during the mask animation.
const DARK_RGB = [37, 25, 0] as const;   // rgb(37,25,0)  — #251900
const CREAM_RGB = [251, 246, 234] as const; // rgb(251,246,234) — #fbf6ea

function lerpRgb(a: readonly number[], b: readonly number[], t: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgba(${r},${g},${bl},0.75)`;
}

export function ProjectOverlay({
  children,
}: {
  children: ReactNode;
}): ReactElement | null {
  const { phase, advanceOpen, advanceClose } = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const onEndRef = useRef<(() => void) | null>(null);

  const isVisible =
    phase.kind === 'opening' || phase.kind === 'open' || phase.kind === 'closing';

  // Track the click origin across phases. Updated when we enter opening or
  // closing; preserved through the open phase in between.
  const originRef = useRef({ x: 0, y: 0 });
  if (phase.kind === 'opening' || phase.kind === 'closing') {
    originRef.current = { x: phase.x, y: phase.y };
  }

  // Run / stop the rAF mask animation whenever the phase changes.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Cancel any in-flight animation from a prior phase.
    cancelAnimationFrame(rafRef.current);

    if (phase.kind === 'open') {
      // Fully open — clear the mask, ensure cream background.
      el.style.maskImage = 'none';
      el.style.webkitMaskImage = 'none';
      // el.style.backgroundColor = '#fbf6ea';
      return;
    }

    if (phase.kind !== 'opening' && phase.kind !== 'closing') return;

    const { x, y } = originRef.current;
    const maxR = maxRadius();
    const mode = phase.kind === 'opening' ? 'reveal' : 'dissolve';
    const durationMs = phase.kind === 'opening' ? EXPAND_MS : CONTRACT_MS;
    const endCb = phase.kind === 'opening' ? advanceOpen : advanceClose;
    onEndRef.current = endCb;

    // Set the initial mask so there's no unmasked flash before the first tick.
    applyMask(el, x, y, 0, mode, 0);

    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / durationMs, 1);
      const eased = ease(t);
      const r = eased * maxR;

      applyMask(el, x, y, r, mode, eased);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        onEndRef.current?.();
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [phase.kind]); // intentionally keyed on kind only — x/y are in originRef

  if (!isVisible) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        overflow: 'auto',
        backgroundColor: '#fbf6ea',
        willChange: phase.kind === 'open' ? 'auto' : 'mask-image',
      }}
    >
      {children}
    </div>
  );
}

function applyMask(
  el: HTMLElement,
  x: number,
  y: number,
  r: number,
  mode: 'reveal' | 'dissolve',
  progress: number,
) {
  let mask: string;
  if (mode === 'reveal') {
    const inner = Math.max(0, r - FEATHER_PX);
    mask = `radial-gradient(circle at ${x}px ${y}px, black ${inner}px, transparent ${r}px)`;
    // Dark → cream as the project page reveals.
    el.style.backgroundColor = lerpRgb(DARK_RGB, CREAM_RGB, progress);
  } else {
    const outer = r + FEATHER_PX;
    mask = `radial-gradient(circle at ${x}px ${y}px, transparent ${r}px, black ${outer}px)`;
    // Cream → dark as the project page dissolves.
    el.style.backgroundColor = lerpRgb(CREAM_RGB, DARK_RGB, progress);
  }
  el.style.maskImage = mask;
  el.style.webkitMaskImage = mask;
}

export { EXPAND_MS, CONTRACT_MS };
export type { Phase };
