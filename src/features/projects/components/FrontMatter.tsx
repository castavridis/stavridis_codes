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
  // Optional credits block rendered below the introduction. Each is a plain
  // string; absent fields are skipped and the block is omitted entirely when
  // all three are empty. Mirrors the Figma "Front Matter" Roles block.
  roles?: string;
  team?: string;
  tools?: string;
};

// Split an introduction on blank lines so a multi-paragraph intro (stored as
// a YAML block scalar in frontmatter) renders as separate paragraphs rather
// than one run-on block. Single-paragraph intros pass through unchanged.
function toParagraphs(introduction: string): string[] {
  return introduction
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function CreditLine({ label, value }: { label: string; value: string }) {
  return (
    <Text variant="tag" className="m-0 w-full text-confetti-black/70">
      <span className="font-bold text-confetti-black">{label}</span> {value}
    </Text>
  );
}

export default function FrontMatter({
  headline,
  introduction,
  tags,
  onClose,
  hideTopNavigation = false,
  previewOnly = false,
  roles,
  team,
  tools,
}: FrontMatterProps) {
  const paragraphs = toParagraphs(introduction);
  const hasCredits = Boolean(roles || team || tools);

  return (
    <div className="flex w-full max-w-[944px] flex-col items-start gap-[48px] md:gap-[84px]">
      {hideTopNavigation ? null : (
        <TopNavigation tags={tags} onClose={onClose} />
      )}
      <div className="flex w-full flex-col items-start gap-[16px] text-confetti-black">
        {previewOnly ? (
          // "Preview Only" tag — Figma node 4014:46487 (4140:10325). Light
          // tinted pill above the headline.
          <span className="border-confetti-black/25 bg-confetti-black/5 inline-flex items-center rounded-[6px] border px-[12px] py-[8px]">
            <span className="text-confetti-black font-mono text-[12px] font-medium italic leading-[12px]">
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
        <div className="flex w-full max-w-[704px] flex-col gap-[16px]">
          {paragraphs.map((paragraph, index) => (
            <Text
              key={index}
              variant="copy-large"
              className="m-0 w-full !text-[18px] !leading-[28px] md:!text-[24px] md:!leading-[32px]"
            >
              {paragraph}
            </Text>
          ))}
        </div>
        {hasCredits ? (
          // Roles / Team / Tools credits block — Figma "Roles" frame. A hair
          // rule then labelled lines in the mono tag style.
          <div className="mt-[24px] flex w-full max-w-[704px] flex-col gap-[16px]">
            <div className="h-px w-full bg-confetti-black/15" />
            <div className="flex flex-col gap-[8px]">
              {roles ? <CreditLine label="Roles" value={roles} /> : null}
              {team ? <CreditLine label="Team" value={team} /> : null}
              {tools ? <CreditLine label="Tools" value={tools} /> : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
