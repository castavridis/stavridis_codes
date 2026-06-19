import Button from '../../../components/Button.js';

type TopNavigationProps = {
  tags?: string;
  onClose?: () => void;
};

// Sticky band: pins the close button + tags to the top of the project sheet
// scroll container as the case study scrolls past.
//
// Interpretation note — the user asked to "make the top-navigation sticky
// with the washes and everything". Figma `CareSignal Platform` does not
// show a repeated/condensed header band lower in the page, so we go with
// the simplest interpretation: pin the TopNavigation alone (option A from
// the planning brief). The Washes Canvas remains absolutely positioned at
// the top of the layout and scrolls away with the rest of the chrome.
// Follow-ups (option B: sticky the whole washes band; option C: collapsing
// header that morphs the washes into a thin strip) are deferred — they
// need a Figma spec before they're worth the engineering cost.
//
// Mechanics:
//   - `position: sticky; top: 0` on the 944px column wrapper. Sticky works
//     because the scrollable ancestor is `ProjectSheetContent`
//     (overflow: auto) and no intermediate parent in MDXLayout sets
//     `overflow: hidden`/`clip`. The previous `overflow-clip` on this
//     element was removed — sticky inside an overflow-clip container would
//     never escape.
//   - The band paints a translucent washes-paper backdrop with a soft
//     backdrop-blur so content scrolling underneath reads through without
//     fighting the close button.
//   - z-10 keeps the band above the WashesCanvas (`top-[72px]` of the
//     MDXLayout content area) and any MDX content beneath.
//   - Inner row keeps the original 944px column + 24px gap layout so the
//     band aligns with the rest of the FrontMatter.
export default function TopNavigation({ tags, onClose }: TopNavigationProps) {
  return (
    <div className="sticky top-0 z-10 w-[944px] bg-washes-paper/85 py-[16px] backdrop-blur-sm">
      <div className="flex w-[944px] items-center gap-[24px]">
        <p className="font-mono flex-1 min-w-0 text-[12px] leading-[20px] text-confetti-black opacity-50">
          {tags ?? ''}
        </p>
        <Button variant="outline" label="Close" onClick={onClose} />
      </div>
    </div>
  );
}
