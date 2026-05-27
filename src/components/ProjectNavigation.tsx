type ProjectNavigationProps = {
  closeElement?: React.ReactElement;
};

export function ProjectNavigation({ closeElement }: ProjectNavigationProps) {
  return (
    <nav className="flex items-center justify-between">
      <div className="inline-flex items-baseline">
        <span className="font-display text-[16px] leading-normal text-black">
          c stavridis
        </span>
        <span className="ml-[13px] font-mono text-[12px] leading-normal text-[#7d7d7d] mix-blend-difference">
          design engineer
        </span>
      </div>
      { closeElement }
    </nav>
  );
}
