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

export default function Header({ onContactClick, onAboutClick, onExperimentsClick, onResumeClick }: HeaderProps) {
  return (
    <>
      <div className="absolute left-[16px] top-[16px] z-10 inline-flex items-center gap-[8px] text-confetti-black">
        <PaintbrushIcon />
        <span className="font-kyoto italic font-medium text-[20px] leading-[20px]">C Stavridis</span>
      </div>
      <nav className="absolute right-[16px] top-[16px] z-10 inline-flex items-center gap-[22px]">
        <a
          href="#about"
          onClick={onAboutClick}
          className="font-mono font-medium text-[12px] leading-[12px] text-black underline decoration-solid [text-underline-position:from-font]"
        >
          About
        </a>
        <a
          href="#experiments"
          onClick={onExperimentsClick}
          className="font-mono font-medium text-[12px] leading-[12px] text-black underline decoration-solid [text-underline-position:from-font]"
        >
          Experiments
        </a>
        <a
          href="#resume"
          onClick={onResumeClick}
          className="font-mono font-medium text-[12px] leading-[12px] text-black underline decoration-solid [text-underline-position:from-font]"
        >
          Resume
        </a>
        <Button variant="default" label="Contact Me" onClick={onContactClick} />
      </nav>
    </>
  );
}
