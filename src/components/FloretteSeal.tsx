import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react';

import BaileyPopover from './BaileyPopover.js';
import HoverPopover from './HoverPopover.js';
import { SEAL_DEFAULT_BACKGROUND, SEAL_DEFAULT_FOREGROUND } from './RotatingSeal.js';

// A special edition of RotatingSeal: the disc is the silhouette of a black
// florette (✿, U+273F) with the text set along its edge and a 🐶 in the
// middle. Static — unlike RotatingSeal it doesn't spin. Hovering (or
// focusing) it opens the Bailey popover — the same one the
// hero's "big Golden Retriever energy" phrase uses.

const FONT_SIZE = 9;
const LETTER_SPACING = 1.6;
// Mono advance heuristic (see RotatingSeal). Only used to decide how many
// copies fit; the exact fit is measured at runtime.
const CHAR_ADVANCE = FONT_SIZE * 0.6 + LETTER_SPACING;
const MIDDOT = '·';
const MIN_GAP = 3;

const PETALS = 5;
// Petal circles, as fractions of the seal's outer radius: centers sit at
// PETAL_DIST from the middle with radius PETAL_RADIUS. Together they reach
// the outer radius (minus EDGE_MARGIN) at the tips and leave a notch at
// ~0.6R between petals — close to the ✿ glyph's proportions.
const PETAL_DIST = 0.6;
const PETAL_RADIUS = 0.4;
// Room for the drop shadow / antialiasing inside the viewBox.
const EDGE_MARGIN = 2;
// Text baseline inset from the (smoothed) edge. Matches RotatingSeal's
// 12px inset on its circle.
const TEXT_INSET = 12;
// Angular samples for the text path. 1 sample per 2° is smooth enough that
// per-segment glyph rotation reads as a curve.
const SAMPLES = 180;
// Smoothing window (in samples, each side) applied to the edge before
// insetting, so the text rounds the notches instead of kinking into them.
const SMOOTH = 12;

type FloretteSealProps = {
  // Text that travels around the edge. Repeats when there's room.
  text?: string;
  // Stationary center glyph.
  centerText?: string;
  // Outer dimension in px.
  size?: number;
  foregroundColor?: string;
  backgroundColor?: string;
  // Wrap in the Bailey HoverPopover. On by default.
  withPopover?: boolean;
  className?: string;
};

type Pt = { x: number; y: number };

// Petal i's angle: petal 0 points straight up (SVG y-down coordinates).
const petalAngle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / PETALS;

function floretteGeometry(size: number) {
  const c = size / 2;
  const R = size / 2 - EDGE_MARGIN;
  const d = R * PETAL_DIST;
  const rp = R * PETAL_RADIUS;
  const centers: Pt[] = Array.from({ length: PETALS }, (_, i) => ({
    x: c + d * Math.cos(petalAngle(i)),
    y: c + d * Math.sin(petalAngle(i)),
  }));

  // Outer intersection of adjacent petal circles i and i+1 lies on the
  // bisector between their angles.
  const half = Math.PI / PETALS;
  const along = d * Math.cos(half) + Math.sqrt(rp * rp - (d * Math.sin(half)) ** 2);
  const notches: Pt[] = Array.from({ length: PETALS }, (_, i) => {
    const a = petalAngle(i) + half;
    return { x: c + along * Math.cos(a), y: c + along * Math.sin(a) };
  });

  // Silhouette: from notch (i-1,i) around petal i's outer arc to notch
  // (i,i+1). Each outer arc is more than half its circle, hence large-arc=1;
  // sweep=1 is clockwise on screen.
  const f = (n: number) => n.toFixed(3);
  const start = notches[PETALS - 1];
  let shape = `M ${f(start.x)} ${f(start.y)}`;
  for (let i = 0; i < PETALS; i++) {
    const n = notches[i];
    shape += ` A ${f(rp)} ${f(rp)} 0 1 1 ${f(n.x)} ${f(n.y)}`;
  }
  shape += ' Z';

  // Edge radius along a ray from the center at angle t: the farthest hit
  // among the petal circles.
  const edgeAt = (t: number) => {
    const ux = Math.cos(t);
    const uy = Math.sin(t);
    let best = 0;
    for (const p of centers) {
      const px = p.x - c;
      const py = p.y - c;
      const b = px * ux + py * uy;
      const disc = b * b - (px * px + py * py - rp * rp);
      if (disc >= 0) best = Math.max(best, b + Math.sqrt(disc));
    }
    return best;
  };

  // Text curve: edge radius → circular moving average → inset. Starts at
  // the leftmost point (like RotatingSeal) and runs clockwise.
  const t0 = Math.PI;
  const edge = Array.from({ length: SAMPLES }, (_, k) => edgeAt(t0 + (k * 2 * Math.PI) / SAMPLES));
  const pts: Pt[] = edge.map((_, k) => {
    let sum = 0;
    for (let j = -SMOOTH; j <= SMOOTH; j++) sum += edge[(k + j + SAMPLES) % SAMPLES];
    const r = sum / (2 * SMOOTH + 1) - TEXT_INSET;
    const t = t0 + (k * 2 * Math.PI) / SAMPLES;
    return { x: c + r * Math.cos(t), y: c + r * Math.sin(t) };
  });

  let lap = 0;
  for (let k = 0; k < SAMPLES; k++) {
    const a = pts[k];
    const b = pts[(k + 1) % SAMPLES];
    lap += Math.hypot(b.x - a.x, b.y - a.y);
  }

  const textPath = `M ${pts.map((p) => `${f(p.x)} ${f(p.y)}`).join(' L ')} Z`;

  return { shape, textPath, lap };
}

// One lap's worth of text: as many copies as fit, each followed by a
// middot gap (always — the seam where the text wraps needs one too).
function buildLapText(text: string, lap: number): string {
  const maxChars = Math.floor(lap / CHAR_ADVANCE);
  const copies = Math.max(1, Math.floor(maxChars / (text.length + MIN_GAP)));
  const gapSlots = Math.max(MIN_GAP, maxChars - copies * text.length);
  const base = Math.floor(gapSlots / copies);
  const extra = gapSlots % copies;
  let out = '';
  for (let i = 0; i < copies; i++) {
    const width = base + (i < extra ? 1 : 0);
    const left = Math.floor((width - 1) / 2);
    out += text + ' '.repeat(left) + MIDDOT + ' '.repeat(width - 1 - left);
  }
  return out;
}

export default function FloretteSeal({
  text = 'Big Golden Retriever energy ™',
  centerText = '🐶',
  size = 120,
  foregroundColor = SEAL_DEFAULT_FOREGROUND,
  backgroundColor = SEAL_DEFAULT_BACKGROUND,
  withPopover = true,
  className,
}: FloretteSealProps) {
  const rawId = useId();
  const pathId = `florette-${rawId.replace(/:/g, '')}`;

  const { shape, textPath, lap } = useMemo(() => floretteGeometry(size), [size]);
  // Shrink the type (never grow it) when one copy + its gap won't fit a
  // lap at the default size — small seals would otherwise overlap glyphs.
  const fontScale = Math.min(1, lap / ((text.length + MIN_GAP) * CHAR_ADVANCE));
  const lapText = useMemo(() => buildLapText(text, lap / fontScale), [text, lap, fontScale]);
  const chars = lapText.length;

  // Make lapText exactly one lap long so the closing middot gap matches
  // the others: measure the rendered run and spread the difference across every
  // glyph's letter-spacing. Re-measures once webfonts settle.
  const textRef = useRef<SVGTextElement | null>(null);
  const [spacing, setSpacing] = useState(LETTER_SPACING * fontScale);
  // Refinement passes so far; reset (before the fit effect runs) whenever
  // the text or size changes.
  const fitPasses = useRef(0);
  useLayoutEffect(() => {
    fitPasses.current = 0;
  }, [lap, lapText]);
  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    let cancelled = false;
    const fit = () => {
      if (cancelled) return;
      // Correct relative to whatever spacing is rendered right now, so a
      // re-fit (after fonts load) converges instead of resetting.
      const current = parseFloat(el.getAttribute('letter-spacing') ?? '') || 0;
      const measured = el.getComputedTextLength();
      // Re-runs after each spacing change (it's a dep) to refine; one pass
      // usually lands within ~1px since rendered length isn't perfectly
      // linear in spacing. Capped so it can never oscillate forever.
      if (measured > 0 && Math.abs(lap - measured) > 0.5 && fitPasses.current < 3) {
        fitPasses.current += 1;
        setSpacing(current + (lap - measured) / chars);
      }
    };
    fit();
    document.fonts?.ready.then(fit);
    return () => {
      cancelled = true;
    };
  }, [lap, chars, lapText, spacing]);

  const label = `${text} ${centerText}`.trim();

  const seal = (
    <span
      className={`relative inline-block align-middle outline-none focus-visible:ring-2 focus-visible:ring-confetti-black/40 focus-visible:rounded-full ${className ?? ''}`}
      style={{ width: size, height: size, color: foregroundColor }}
      role="img"
      aria-label={label}
      // Focusable so keyboard users can open the popover too.
      tabIndex={withPopover ? 0 : undefined}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 size-full overflow-visible" aria-hidden>
        <defs>
          <path id={pathId} d={textPath} fill="none" />
        </defs>
        {/* Florette silhouette. drop-shadow follows the shape (a box-shadow
            would draw a square/circle). Approximates shadow-md. */}
        <path
          d={shape}
          fill={backgroundColor}
          style={{ filter: 'drop-shadow(0 4px 3px rgb(0 0 0 / 0.1)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.08))' }}
        />
        <text
          ref={textRef}
          fill="currentColor"
          fontFamily="var(--font-mono)"
          fontSize={FONT_SIZE * fontScale}
          letterSpacing={spacing}
          xmlSpace="preserve"
          style={{ textTransform: 'uppercase' }}
        >
          <textPath href={`#${pathId}`}>{lapText}</textPath>
        </text>
      </svg>
      <span
        className="pointer-events-none absolute inset-0 flex items-center justify-center select-none"
        style={{ fontSize: size * 0.24, lineHeight: 1 }}
        aria-hidden
      >
        {centerText}
      </span>
    </span>
  );

  return withPopover ? <HoverPopover popover={<BaileyPopover />}>{seal}</HoverPopover> : seal;
}
