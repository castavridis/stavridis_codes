import Button from './Button.js';

type HeaderProps = {
  onContactClick?: () => void;
  onAboutClick?: () => void;
  onExperimentsClick?: () => void;
  onResumeClick?: () => void;
};

// Placeholder paintbrush icon — real asset lands in a later PR.
function PaintbrushIcon() {
  return <svg width="24" height="24" aria-hidden fill="currentColor" />;
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
export default function Header({ onContactClick, onAboutClick, onExperimentsClick, onResumeClick }: HeaderProps) {
  return (
    <>
      <div className="text-confetti-black inline-flex items-center gap-[8px]">
        <PaintbrushIcon />
        <span className="font-kyoto text-[20px] leading-[20px] font-medium italic">
          C Stavridis
        </span>
      </div>
      <nav className="inline-flex items-center gap-[22px]">
        <a
          href="#about"
          onClick={onAboutClick}
          className="font-mono text-[12px] leading-[12px] font-medium text-black underline decoration-solid [text-underline-position:from-font]"
        >
          About
        </a>
        <a
          href="#experiments"
          onClick={onExperimentsClick}
          className="font-mono text-[12px] leading-[12px] font-medium text-black underline decoration-solid [text-underline-position:from-font]"
        >
          Experiments
        </a>
        <a
          href="#resume"
          onClick={onResumeClick}
          className="font-mono text-[12px] leading-[12px] font-medium text-black underline decoration-solid [text-underline-position:from-font]"
        >
          Resume
        </a>
        <Button variant="default" label="Contact Me" onClick={onContactClick} />
      </nav>
    </>
  );
}
