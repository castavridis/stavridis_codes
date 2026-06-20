import TopNavigation from './TopNavigation.js';

type FrontMatterProps = {
  headline: string;
  introduction: string;
  tags?: string;
  onClose?: () => void;
  // When true, suppress the inner TopNavigation (tags + Close) — the
  // chrome row in MDXLayout already renders these sticky at the top
  // of the overlay scroll area, so rendering them again here would
  // produce a duplicate Close button just above the headline.
  // Authors / non-overlay hosts can still render FrontMatter standalone
  // (e.g. preview pages) and the navigation will appear by default.
  hideTopNavigation?: boolean;
};

export default function FrontMatter({
  headline,
  introduction,
  tags,
  onClose,
  hideTopNavigation = false,
}: FrontMatterProps) {
  return (
    <div className="flex w-[944px] flex-col items-start gap-[84px]">
      {hideTopNavigation ? null : (
        <TopNavigation tags={tags} onClose={onClose} />
      )}
      <div className="flex w-full flex-col items-start gap-[16px] text-confetti-black">
        <h1 className="font-kyoto m-0 w-full text-[48px] font-medium leading-[60px]">
          {headline}
        </h1>
        <p className="font-body m-0 max-w-[704px] text-[24px] font-normal leading-[32px]">
          {introduction}
        </p>
      </div>
    </div>
  );
}
