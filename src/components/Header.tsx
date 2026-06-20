import Button from './Button.js';
import { usePaintStore, type BrushColor } from '../lib/paint-store.js';

type HeaderProps = {
  onContactClick?: () => void;
  onAboutClick?: () => void;
  onExperimentsClick?: () => void;
  onResumeClick?: () => void;
  // v2 paint mode (Figma `Landing Page – Paint 00/01/02`, nodes 4003:23338,
  // 4008:30723, 4008:32853). When true:
  //   - Name text ("C Stavridis"), About/Experiments/Resume links fade to 0.
  //   - "Contact Me" stays solid in place.
  //   - 4 Paintbrush Controls fade in to the LEFT where the name text was:
  //       1. Paint-mode toggle (brush icon at rest / X while painting)
  //       2..4. Color swatches (rose, hansa yellow, cerulean blue) — selected
  //         swatch shows a white brush icon overlay.
  paintActive?: boolean;
};

// 3 brush colors. Sourced from Figma `Landing Page – Paint 00/01/02` (the
// `Name` row at top-left). Values match `--washes-*` design tokens.
const ROSE: BrushColor = { r: 165, g: 14, b: 83 };       // #a50e53
const HANSA_YELLOW: BrushColor = { r: 227, g: 175, b: 8 }; // #e3af08
const CERULEAN_BLUE: BrushColor = { r: 16, g: 139, b: 160 }; // #108ba0

const SWATCHES: ReadonlyArray<{ color: BrushColor; hex: string; label: string }> = [
  { color: ROSE, hex: '#a50e53', label: 'Rose pigment' },
  { color: HANSA_YELLOW, hex: '#e3af08', label: 'Hansa yellow pigment' },
  { color: CERULEAN_BLUE, hex: '#108ba0', label: 'Cerulean blue pigment' },
];

function colorsEqual(a: BrushColor, b: BrushColor): boolean {
  return a.r === b.r && a.g === b.g && a.b === b.b;
}

// Inline paintbrush glyph — small palette-knife-style mark. Sized to fit
// inside the 24px swatch. Stroke uses currentColor so it inherits white when
// overlaid on a colored swatch and the brush-fill color on the toggle's
// resting state.
function BrushGlyph({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Brush ferrule + handle running corner-to-corner. */}
      <path d="M11.2 2.8 L8.2 5.8" />
      <path d="M8.6 5.4 L10 6.8" />
      {/* Brush head / paint blob — a soft teardrop pointing down-left. */}
      <path d="M8.6 5.4 C6.4 7.6 5.4 8.6 4.1 9.9 C3.4 10.6 2.6 10.8 2.2 10.4 C1.8 10 2 9.2 2.7 8.5 C4 7.2 5 6.2 7.2 4 Z" />
    </svg>
  );
}

// Small X glyph used by the paint-mode toggle while painting.
function CloseGlyph({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <path d="M3 3 L9 9" />
      <path d="M9 3 L3 9" />
    </svg>
  );
}

// Paint-mode toggle (leftmost control). Resting: a circle filled with the
// current brush color + a brush glyph in the same dark tone. While painting:
// a darker circle with a white X. Click flips `paintActive` in the store.
function PaintToggle({
  paintActive,
  brushColor,
  onToggle,
}: {
  paintActive: boolean;
  brushColor: BrushColor;
  onToggle: () => void;
}) {
  const bg = paintActive
    ? '#391f00'
    : `rgb(${brushColor.r}, ${brushColor.g}, ${brushColor.b})`;
  const fg = '#ffffff';
  return (
    <button
      type="button"
      onClick={onToggle}
      data-paint-skip
      aria-label={paintActive ? 'Stop painting' : 'Start painting'}
      aria-pressed={paintActive}
      className="inline-flex size-[24px] items-center justify-center rounded-[12px]"
      style={{ backgroundColor: bg, color: fg }}
    >
      {paintActive ? <CloseGlyph /> : <BrushGlyph />}
    </button>
  );
}

// Color swatch. Selected (current brushColor matches): brush glyph in white
// overlaid on the colored circle. Not selected: just the circle.
function ColorSwatch({
  color,
  hex,
  label,
  selected,
  onSelect,
}: {
  color: BrushColor;
  hex: string;
  label: string;
  selected: boolean;
  onSelect: (c: BrushColor) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(color)}
      data-paint-skip
      aria-label={label}
      aria-pressed={selected}
      className="inline-flex size-[24px] items-center justify-center rounded-[12px]"
      style={{ backgroundColor: hex, color: '#ffffff' }}
    >
      {selected ? <BrushGlyph /> : null}
    </button>
  );
}

// Header is composed inside the Washes Canvas shell on the landing page (see
// `landing-page.tsx`). The Figma frame `4002:21177` positions the Name group at
// `left-[16px] top-[16.17px]` and the Links group at `right-[16px] top-[16.17px]`
// relative to the Washes Canvas — so the Header itself doesn't position; it
// expects the caller to drop it into an absolutely-positioned slot.
//
// The render here uses a React fragment so the caller can wrap the two halves
// (Name + Links) in their own slots. For a generic page composition, the
// caller can place the whole fragment inside a `relative` container.
//
// v2 paint mode: when `paintActive` is true, the name + nav links fade out
// (opacity 1 → 0, ~240ms) and a row of 4 paintbrush controls fades in in
// their place. The fade duration matches the glass card animation in
// landing-page.tsx so the whole header transitions in concert with the
// "card slides out, paint surface takes over" moment.
export default function Header({
  onContactClick,
  onAboutClick,
  onExperimentsClick,
  onResumeClick,
  paintActive = false,
}: HeaderProps) {
  const brushColor = usePaintStore((s) => s.brushColor);
  const setBrushColor = usePaintStore((s) => s.setBrushColor);
  const setPaintActive = usePaintStore((s) => s.setPaintActive);

  const fadeOutStyle: React.CSSProperties = {
    opacity: paintActive ? 0 : 1,
    pointerEvents: paintActive ? 'none' : 'auto',
    transition: 'opacity 240ms ease-out',
  };
  // Color swatches fade IN with paintActive. They're not interactive at
  // rest (pointer-events: none); only the paint-mode toggle (Control 1)
  // is always visible + clickable so the user can ENTER paint mode from
  // the header. PR 4c-paint-4.
  const swatchesStyle: React.CSSProperties = {
    opacity: paintActive ? 1 : 0,
    pointerEvents: paintActive ? 'auto' : 'none',
    transition: 'opacity 240ms ease-out',
  };
  return (
    <>
      <div className="relative inline-flex items-center">
        {/* Resting: "C Stavridis" name with a small paintbrush glyph. The
            name fades out in paint mode; the brush-toggle button below
            stays put and morphs (color circle ↔ X). */}
        <div
          className="text-confetti-black inline-flex items-center gap-[8px]"
          style={fadeOutStyle}
          aria-hidden={paintActive}
        >
          {/* Spacer matching the PaintToggle slot so the C Stavridis label
              doesn't visually collide with the toggle once it overlays. */}
          <span className="inline-block size-[24px]" aria-hidden />
          <span
            className="font-kyoto text-[20px] leading-[20px] font-medium italic"
            // Cream halo so the dark text reads on dynamic wash colors
            // (esp. night-phase navy washes where #391f00 would disappear).
            style={{ textShadow: "0 0 8px rgba(251, 246, 234, 0.7)" }}
          >
            C Stavridis
          </span>
        </div>
        {/* Paint controls row. The leftmost slot — the PaintToggle — is
            always visible + clickable: it's the entry point into paint
            mode. The three color swatches fade in once `paintActive` is
            true (controlsStyle wraps just them). */}
        <div className="absolute top-1/2 left-0 inline-flex -translate-y-1/2 items-center gap-[4px]">
          <PaintToggle
            paintActive={paintActive}
            brushColor={brushColor}
            onToggle={() => setPaintActive(!paintActive)}
          />
          <div
            aria-hidden={!paintActive}
            className="inline-flex items-center gap-[4px]"
            style={swatchesStyle}
          >
            {SWATCHES.map((s) => (
              <ColorSwatch
                key={s.hex}
                color={s.color}
                hex={s.hex}
                label={s.label}
                selected={colorsEqual(brushColor, s.color)}
                onSelect={setBrushColor}
              />
            ))}
          </div>
        </div>
      </div>
      <nav className="inline-flex items-center gap-[22px]">
        <a
          href="#about"
          onClick={onAboutClick}
          style={fadeOutStyle}
          className="font-mono text-[12px] leading-[12px] font-medium text-black underline decoration-solid [text-underline-position:from-font]"
        >
          About
        </a>
        <a
          href="#experiments"
          onClick={onExperimentsClick}
          style={fadeOutStyle}
          className="font-mono text-[12px] leading-[12px] font-medium text-black underline decoration-solid [text-underline-position:from-font]"
        >
          Experiments
        </a>
        <a
          href="#resume"
          onClick={onResumeClick}
          style={fadeOutStyle}
          className="font-mono text-[12px] leading-[12px] font-medium text-black underline decoration-solid [text-underline-position:from-font]"
        >
          Resume
        </a>
        <Button variant="default" label="Contact Me" onClick={onContactClick} />
      </nav>
    </>
  );
}
