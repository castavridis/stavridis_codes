import { useId } from 'react';

// Mono char advance heuristic. SVG <text> doesn't trivially give us the
// rendered string length at the time we build the markup, so we
// approximate from the font metrics: mono glyphs typically advance
// ~0.6em + the explicit letter-spacing per character.
const FONT_SIZE = 9;
const LETTER_SPACING = 1.6;
const CHAR_ADVANCE = FONT_SIZE * 0.6 + LETTER_SPACING;
// Separator placed between repetitions only — never leading or trailing.
const SEPARATOR = ' · ';

type RotatingSealProps = {
  // Curved perimeter text. Repeats automatically — see buildCurvedText.
  companyName: string;
  // Stationary text in the center of the seal.
  centerText?: string;
  // Outer dimension in px. The curved text sits ~12px in from the edge.
  size?: number;
  // Full rotation duration in seconds. Lower = faster spin.
  durationSeconds?: number;
  // Optional extra class names applied to the wrapper.
  className?: string;
};

// Compute how many whole repetitions of `companyName` fit on the
// circumference, separated by SEPARATOR between each repetition (no
// leading or trailing separator). Names are NEVER cut mid-word — we
// take the floor of the repetition count so partial names don't render.
function buildCurvedText(companyName: string, radius: number): string {
  const circumference = 2 * Math.PI * radius;
  const maxChars = Math.floor(circumference / CHAR_ADVANCE);
  const nameLen = companyName.length;
  const sepLen = SEPARATOR.length;
  // N copies of name + (N-1) separators ≤ maxChars
  // ⇒ N ≤ (maxChars + sepLen) / (nameLen + sepLen)
  const repetitions = Math.max(
    1,
    Math.floor((maxChars + sepLen) / (nameLen + sepLen)),
  );
  return Array.from({ length: repetitions }, () => companyName).join(SEPARATOR);
}

export default function RotatingSeal({
  companyName,
  centerText = 'Featured Project',
  size = 120,
  durationSeconds = 30,
  className,
}: RotatingSealProps) {
  // useId returns a string like `:r0:` — strip the colons so the
  // resulting SVG id is a valid URI fragment identifier.
  const rawId = useId();
  const pathId = `seal-${rawId.replace(/:/g, '')}`;

  const center = size / 2;
  const radius = size / 2 - 12;
  const curved = buildCurvedText(companyName, radius);

  return (
    <div
      className={`bg-washes-hansa-yellow text-confetti-black relative inline-block rounded-full ${className ?? ''}`}
      style={{ width: size, height: size }}
      aria-label={`${centerText}: ${companyName}`}
      role="img"
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 size-full motion-safe:[animation:seal-spin_var(--seal-duration)_linear_infinite]"
        style={{ '--seal-duration': `${durationSeconds}s` } as React.CSSProperties}
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
