import Text from '../../../components/Text.js';
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
  // When true, a "Preview Only" tag renders above the headline — for case
  // studies still in draft/preview. Driven by the project's `preview` flag.
  previewOnly?: boolean;
};

export default function FrontMatter({
  headline,
  introduction,
  tags,
  onClose,
  hideTopNavigation = false,
  previewOnly = false,
}: FrontMatterProps) {
  return (
    <div className="flex w-full max-w-[944px] flex-col items-start gap-[48px] md:gap-[84px]">
      {hideTopNavigation ? null : (
        <TopNavigation tags={tags} onClose={onClose} />
      )}
      <div className="flex w-full flex-col items-start gap-[16px] text-confetti-black">
        {previewOnly ? (
          // "Preview Only" tag — Figma node 4140:10325. Dark pill above the
          // headline (inverse of the lighter card tag).
          <span className="border-confetti-black bg-confetti-black/75 inline-flex items-center rounded-[6px] border px-[12px] py-[8px]">
            <span className="text-washes-paper/75 font-mono text-[12px] font-medium italic leading-[12px]">
              Preview Only
            </span>
          </span>
        ) : null}
        <Text
          variant="headline"
          as="h1"
          className="m-0 w-full !text-[28px] !leading-[36px] md:!text-[48px] md:!leading-[60px]"
        >
          {headline}
        </Text>
        <Text
          variant="copy-large"
          className="m-0 w-full max-w-[704px] !text-[18px] !leading-[28px] md:!text-[24px] md:!leading-[32px]"
        >
          {introduction}
        </Text>
      </div>
    </div>
  );
}
