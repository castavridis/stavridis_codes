import Button from './Button.js';

type HeaderProps = {
  onContactClick?: () => void;
  onAboutClick?: () => void;
  onExperimentsClick?: () => void;
  onResumeClick?: () => void;
  // v2 paint mode (Figma `Landing Page – Paint 00/01/02`, nodes 4003:23338,
  // 4008:30723, 4008:32853). When true:
  //   - Name text ("C Stavridis"), About/Experiments/Resume links fade to 0.
  //   - "Contact Me" stays solid in place.
  //   - 4 Paintbrush Control swatches (pigment indicators) fade in to the
  //     LEFT where the name text was.
  // The annotation on Figma node 4006:30719 reads "Paint brushes animate in
  // while name and links, 'About, Experiments, and Resume' disappear".
  paintActive?: boolean;
};

// Placeholder paintbrush icon — real asset lands in a later PR.
function PaintbrushIcon() {
  return <svg width="24" height="24" aria-hidden fill="currentColor" />;
}

// Paint mode swatches — read-only visual indicators for now. The 4 controls
// from the Figma frame, left-to-right: brush icon, rose pigment, hansa
// yellow pigment, cerulean blue pigment. Each is a 24px circle. Wiring them
// to setBrushColor is flagged as a follow-up.
function BrushControl({
  bg,
  ariaLabel,
}: {
  bg: string;
  ariaLabel: string;
}) {
  return (
    <span
      role="img"
      aria-label={ariaLabel}
      data-paint-skip
      className="block size-[24px] rounded-[12px]"
      style={{ backgroundColor: bg }}
    />
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
// (opacity 1 → 0, ~240ms) and a row of paintbrush control swatches fades in
// in their place. The fade duration matches the glass card animation in
// landing-page.tsx so the whole header transitions in concert with the
// "card slides out, paint surface takes over" moment.
export default function Header({
  onContactClick,
  onAboutClick,
  onExperimentsClick,
  onResumeClick,
  paintActive = false,
}: HeaderProps) {
  const fadeOutStyle: React.CSSProperties = {
    opacity: paintActive ? 0 : 1,
    pointerEvents: paintActive ? 'none' : 'auto',
    transition: 'opacity 240ms ease-out',
  };
  const fadeInStyle: React.CSSProperties = {
    opacity: paintActive ? 1 : 0,
    pointerEvents: paintActive ? 'auto' : 'none',
    transition: 'opacity 240ms ease-out',
  };
  return (
    <>
      <div className="relative inline-flex items-center">
        {/* Resting: paintbrush placeholder + name. Fades out in paint mode. */}
        <div
          className="text-confetti-black inline-flex items-center gap-[8px]"
          style={fadeOutStyle}
        >
          <PaintbrushIcon />
          <span className="font-kyoto text-[20px] leading-[20px] font-medium italic">
            C Stavridis
          </span>
        </div>
        {/* Paint mode: 4 brush control swatches. Absolutely positioned over
            the name slot so the row stays anchored to the left edge. */}
        <div
          aria-hidden={!paintActive}
          className="absolute top-1/2 left-0 inline-flex -translate-y-1/2 items-center gap-[4px]"
          style={fadeInStyle}
        >
          <BrushControl bg="var(--color-washes-rose, #a50e53)" ariaLabel="Rose pigment" />
          <BrushControl bg="var(--color-confetti-black, #391f00)" ariaLabel="Brush" />
          <BrushControl
            bg="var(--color-washes-hansa-yellow, #e3af08)"
            ariaLabel="Hansa yellow pigment"
          />
          <BrushControl
            bg="var(--color-washes-cerulean-blue, #108ba0)"
            ariaLabel="Cerulean blue pigment"
          />
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
