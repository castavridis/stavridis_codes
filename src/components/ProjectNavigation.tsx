type ProjectNavigationProps = {
  closeElement?: React.ReactElement;
  color?: string;
};

export function ProjectNavigation({ closeElement, color }: ProjectNavigationProps) {
  return (
    <nav className="flex col-span-12 md:col-start-3 md:col-span-6 items-center justify-between" style={{ color }}>
      <div className="inline-flex items-center">
        <span className="font-display font-thin text-[16px] leading-normal" style={{ color }}>
          c stavridis
        </span>
        <span className="ml-2 mt-[3px] font-mono text-[12px] leading-normal text-[#7d7d7d] mix-blend-difference">
          design engineer
        </span>
      </div>
      <div className="mt-[2px]">
         { closeElement }
      </div>
    </nav>
  );
}
