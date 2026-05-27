type ProjectNavigationProps = {
  closeElement?: React.ReactElement;
};

export function ProjectNavigation({ closeElement }: ProjectNavigationProps) {
  return (
    <nav className="flex col-span-12 md:col-start-3 md:col-span-6 items-center justify-between">
      <div className="inline-flex items-center">
        <span className="font-display text-[16px] leading-normal text-black">
          c stavridis
        </span>
        <span className="ml-1 mt-[3px] font-mono text-[12px] leading-normal text-[#7d7d7d] mix-blend-difference">
          design engineer
        </span>
      </div>
      <div className="mt-[2px]">
         { closeElement }
      </div>
    </nav>
  );
}
