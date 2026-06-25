import { useEffect, useId, useRef, useState } from 'react';

// Mono char advance heuristic. SVG <text> doesn't trivially give us the
// rendered string length at the time we build the markup, so we
// approximate from the font metrics: mono glyphs typically advance
// ~0.6em + the explicit letter-spacing per character.
const FONT_SIZE = 9;
const LETTER_SPACING = 1.6;
const CHAR_ADVANCE = FONT_SIZE * 0.6 + LETTER_SPACING;
// Middot glyph placed between repetitions. The surrounding spacing is
// computed per-seal in buildCurvedText so the names + middots spread
// evenly around the full circle.
const MIDDOT = '·';
// Minimum character slots between a name and the next middot (" · ").
const MIN_GAP = 3;

type RotatingSealProps = {
  // Curved perimeter text. Repeats automatically — see buildCurvedText.
  companyName: string;
  // Stationary text in the center of the seal.
  centerText?: string;
  // Outer dimension in px. The curved text sits ~12px in from the edge.
  size?: number;
  // Full rotation duration in seconds. Lower = faster spin.
  durationSeconds?: number;
  // Curved + center text color. Defaults to confetti-black. Driven by
  // CompanyConfig.seal.foreground_color.
  foregroundColor?: string;
  // Disc fill color. Defaults to Hansa Yellow. Driven by
  // CompanyConfig.seal.background_color.
  backgroundColor?: string;
  // Optional extra class names applied to the wrapper.
  className?: string;
};

// Defaults match the original Tailwind classes: confetti-black text on a
// Hansa Yellow disc (see src/globals.css). Exported so other surfaces
// (e.g. the landing greeting chip) can default to the same colors.
export const SEAL_DEFAULT_FOREGROUND = '#391f00'; // confetti-black
export const SEAL_DEFAULT_BACKGROUND = '#e3af08'; // washes-hansa-yellow

// Build the curved perimeter text.
//
//   - 1 copy fits  → just the name, no middots.
//   - N copies fit → N names + N middots (one trailing each copy, so the
//     seam where the text wraps back to the start also gets a middot),
//     with the leftover character slots distributed evenly across all N
//     gaps so the names + middots spread evenly around the full circle.
//
// Names are NEVER cut mid-word — we take the floor of the copy count so
// partial names don't render. NOTE: the multi-space padding only renders
// if the <text> sets xml:space="preserve" (SVG collapses runs of
// whitespace otherwise).
function buildCurvedText(companyName: string, radius: number): string {
  const circumference = 2 * Math.PI * radius;
  const maxChars = Math.floor(circumference / CHAR_ADVANCE);
  const nameLen = companyName.length;

  // Most copies that fit with at least MIN_GAP slots after each (every
  // copy gets a trailing gap since the text wraps a full circle).
  const copies = Math.max(1, Math.floor(maxChars / (nameLen + MIN_GAP)));

  // A single copy reads as a plain name — no middots, no forced spread.
  if (copies === 1) return companyName;

  // Distribute the leftover slots evenly across the `copies` gaps. base is
  // ≥ MIN_GAP by construction; the first `extra` gaps get one more slot.
  const gapSlots = maxChars - copies * nameLen;
  const base = Math.floor(gapSlots / copies);
  const extra = gapSlots % copies;

  let out = '';
  for (let i = 0; i < copies; i++) {
    const width = base + (i < extra ? 1 : 0);
    const left = Math.floor((width - 1) / 2);
    const right = width - 1 - left;
    out += companyName + ' '.repeat(left) + MIDDOT + ' '.repeat(right);
  }
  return out;
}

export default function RotatingSeal({
  companyName,
  centerText = 'Featured Project',
  size = 120,
  durationSeconds = 30,
  foregroundColor = SEAL_DEFAULT_FOREGROUND,
  backgroundColor = SEAL_DEFAULT_BACKGROUND,
  className,
}: RotatingSealProps) {
  // useId returns a string like `:r0:` — strip the colons so the
  // resulting SVG id is a valid URI fragment identifier.
  const rawId = useId();
  const pathId = `seal-${rawId.replace(/:/g, '')}`;

  const center = size / 2;
  const radius = size / 2 - 12;
  const curved = buildCurvedText(companyName, radius);

  // Pause the spin while the seal is scrolled out of view so it costs
  // nothing offscreen. Defaults to running so it animates even if
  // IntersectionObserver is unavailable.
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [onscreen, setOnscreen] = useState(true);
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([entry]) => setOnscreen(entry.isIntersecting),
      { rootMargin: '64px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={`relative inline-block rounded-full shadow-md ${className ?? ''}`}
      style={{
        width: size,
        height: size,
        // `color` drives both the curved <text fill="currentColor"> and the
        // center label (which inherits), so foreground_color covers both.
        color: foregroundColor,
        backgroundColor,
      }}
      aria-label={`${centerText}: ${companyName}`}
      role="img"
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        // will-change promotes the SVG to its own GPU layer so the rotation
        // composites (text rasterized once) instead of repainting the vector
        // text on the main thread every frame. play-state pauses it offscreen.
        className="absolute inset-0 size-full motion-safe:will-change-transform motion-safe:[animation:seal-spin_var(--seal-duration)_linear_infinite]"
        style={{
          '--seal-duration': `${durationSeconds}s`,
          animationPlayState: onscreen ? 'running' : 'paused',
        } as React.CSSProperties}
        aria-hidden
      >
        <defs>
          {/* A full circle drawn as two arcs. textPath wraps along this
              path starting from the leftmost point (m -r 0). */}
          <path
            id={pathId}
            d={`M ${center} ${center} m -${radius} 0 a ${radius} ${radius} 0 1 1 ${radius * 2} 0 a ${radius} ${radius} 0 1 1 -${radius * 2} 0`}
            fill="none"
          />
        </defs>
        <text
          fill="currentColor"
          fontFamily="var(--font-mono)"
          fontSize={FONT_SIZE}
          letterSpacing={LETTER_SPACING}
          // preserve so the multi-space gap padding from buildCurvedText
          // isn't collapsed (SVG collapses whitespace runs by default).
          xmlSpace="preserve"
          style={{ textTransform: 'uppercase' }}
        >
          <textPath href={`#${pathId}`}>{curved}</textPath>
        </text>
      </svg>

      {/* Stationary center label. Sits OUTSIDE the rotating SVG, so it
          stays upright regardless of seal rotation. */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center">
        <span
          className="font-mono uppercase"
          style={{
            fontSize: 9,
            letterSpacing: '0.08em',
            lineHeight: 1.2,
            maxWidth: size * 0.5,
          }}
        >
          {centerText}
        </span>
      </div>

      <style>{`
        @keyframes seal-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
