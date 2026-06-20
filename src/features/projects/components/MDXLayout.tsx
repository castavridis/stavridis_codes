import type { ComponentProps, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import Button from '../../../components/Button.js';
import Callout from './Callout.js';
import FrontMatter from './FrontMatter.js';
import OutcomeStat from './OutcomeStat.js';

type Front = {
  headline: string;
  introduction: string;
  tags?: string;
};

type MDXLayoutProps = {
  front: Front;
  onClose?: () => void;
  children: ReactNode;
};

// MDX overrides — exposed via the `components` prop on the rendered MDX
// component so authors can write plain markdown alongside <Callout /> and
// <OutcomeStat /> tags without importing them per file.
export const mdxComponents = {
  h1: (props: ComponentProps<'h1'>) => (
    <h1
      {...props}
      className="font-kyoto mt-[64px] mb-[24px] text-[40px] font-medium leading-[48px] text-confetti-black"
    />
  ),
  h2: (props: ComponentProps<'h2'>) => (
    <h2
      {...props}
      className="font-kyoto mt-[48px] mb-[16px] text-[32px] font-medium leading-[40px] text-confetti-black"
    />
  ),
  p: (props: ComponentProps<'p'>) => (
    <p
      {...props}
      className="font-body my-[16px] text-[20px] font-normal leading-[32px] text-confetti-black"
    />
  ),
  a: (props: ComponentProps<'a'>) => (
    <a
      {...props}
      className="font-body text-confetti-black underline decoration-dotted decoration-from-font [text-underline-position:from-font]"
    />
  ),
  blockquote: (props: ComponentProps<'blockquote'>) => (
    <blockquote
      {...props}
      className="font-kyoto my-[32px] border-l-2 border-confetti-black/30 pl-[24px] text-[24px] font-medium italic leading-[32px] text-confetti-black"
    />
  ),
  Callout,
  OutcomeStat,
};

// Layout values are taken from the CareSignal Platform Project Detail frame
// in Figma (file `fWYYke3w9yQdqU0j5HD4Yh`, node `2232:32241`):
//
//   CareSignal Platform   — 1280 × 5833.6
//     Project Detail      — x=88,  y=128, 1104 × 5065.6
//       Front Matter      — x=80,  y=72  (relative), 944 × 408
//       Callout (next)    — x=80,  y=552 (relative)       => 72px gap below
//                                                          Front Matter
//     Footer              — x=248, y=5457.6, 784 × 376    => ~264px bottom
//                                                          between Project
//                                                          Detail and Footer
//
// Page-edge horizontal padding works out to (1280 − 1136) / 2 = 72px. The
// 1104 Project Detail card is centered inside; the 944 content column sits
// with an 80px gutter inside the card.
//
// Path A in the project-overlay arch: the landing wash shell (660px) sits
// above the SheetOverlay, so the overlay's scroll content starts BELOW it.
// The decorative WashesCanvas band that previously sat above FrontMatter
// in v2 chrome is intentionally removed — the wash treatment at the top
// of the viewport comes from the still-visible landing wash shell.

// Sticky chrome row at the top of the overlay's inner scroll area. Two
// display modes driven by scroll position (see tmp/project-overlay-
// transition frames):
//
//   default — tags row on the left, Close button on the right.
//   scrolled — truncated title on the left (where tags were), Close
//              button on the right.
//
// The swap is a sequenced fade: tags fade to 0 first, then the
// truncated title fades in. A gradient mask at the bottom edge fades
// out content as it scrolls UNDER the row (the mask line sits at the
// chrome row's bottom edge — frames 03/04).
//
// Mode is computed from the scroll container's scrollTop:
//   tagsFadeProgress: 0 → 1 over [TAGS_FADE_START, TAGS_FADE_END]
//   titleFadeProgress: 0 → 1 over [TITLE_FADE_START, TITLE_FADE_END]
// The second window starts after the first ends so the fades don't
// overlap (frame 05 — tags at 0 — sits between the two windows).
const TAGS_FADE_START = 24;
const TAGS_FADE_END = 96;
const TITLE_FADE_START = 96;
const TITLE_FADE_END = 168;

// Walk up from `el` to find the nearest scrollable ancestor — the
// element whose `overflow-y` is `auto` or `scroll`. The project sheet
// uses `ProjectSheetContent` (in app.tsx) which wraps content in a
// `position: absolute; inset: 0; overflow: auto` div — that's the
// scroll container we need to bind to so the sticky chrome row reads
// the correct scrollTop.
function findScrollableAncestor(el: HTMLElement | null): HTMLElement | null {
  let node: HTMLElement | null = el?.parentElement ?? null;
  while (node) {
    const overflowY = window.getComputedStyle(node).overflowY;
    if (overflowY === 'auto' || overflowY === 'scroll') return node;
    node = node.parentElement;
  }
  return null;
}

function ChromeRow({
  tags,
  headline,
  onClose,
  anchorRef,
}: {
  tags?: string;
  headline: string;
  onClose?: () => void;
  // Anchor element used to resolve the nearest scrollable ancestor at
  // mount time. We can't bind to `window` because the project sheet has
  // its own scroll context (ProjectSheetContent's absolute wrapper).
  anchorRef: React.RefObject<HTMLElement | null>;
}) {
  // Use scrollTop to drive the two fade windows. A scroll listener
  // (passive) is cheaper than IntersectionObserver here since we need
  // continuous progress values, not threshold crossings.
  const [scrollTop, setScrollTop] = useState(0);
  useEffect(() => {
    const anchor = anchorRef.current;
    const el = findScrollableAncestor(anchor);
    if (!el) return;
    let rafId = 0;
    let latest = el.scrollTop;
    const onScroll = () => {
      latest = el.scrollTop;
      if (!rafId)
        rafId = window.requestAnimationFrame(() => {
          rafId = 0;
          setScrollTop(latest);
        });
    };
    // Set initial in case we mounted partway down (e.g. browser
    // restored scroll position).
    setScrollTop(el.scrollTop);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [anchorRef]);

  const tagsOpacity =
    1 -
    Math.max(
      0,
      Math.min(
        1,
        (scrollTop - TAGS_FADE_START) / (TAGS_FADE_END - TAGS_FADE_START),
      ),
    );
  const titleOpacity = Math.max(
    0,
    Math.min(
      1,
      (scrollTop - TITLE_FADE_START) / (TITLE_FADE_END - TITLE_FADE_START),
    ),
  );

  return (
    // Sticky so it pins to the top of the scroll container as the user
    // scrolls past the FrontMatter title. z-10 keeps it above the
    // body content; the gradient mask below extends downward from the
    // bottom edge of this row across the full overlay width.
    <div
      className="sticky top-0 z-10"
      style={{
        // Cream backdrop so content that scrolls UNDER the row reads
        // cleanly. Matches the page bg-washes-paper. `position: sticky`
        // counts as a positioned context, so the absolute gradient
        // mask below positions against this element without an
        // explicit `relative`.
        backgroundColor: 'transparent',
      }}
    >
      <div className="relative mx-auto w-full max-w-[1110px] px-[72px]">
        <div className="mx-auto w-full max-w-[1104px]">
          {/* The two-mode chrome row. Two children share the left slot
              via absolute overlap: the tags paragraph and the
              truncated title sit in the same grid cell, each
              opacity-controlled. The Close button stays put on the
              right at full opacity at all times. */}
          <div className="flex w-[944px] items-center gap-[24px] overflow-clip py-[32px]">
            <div className="relative min-w-0 flex-1">
              <p
                className="font-mono text-[12px] leading-[20px] text-confetti-black"
                style={{
                  opacity: tagsOpacity * 0.5,
                  transition: 'opacity 80ms linear',
                }}
                aria-hidden={tagsOpacity === 0}
              >
                {tags ?? ''}
              </p>
              {/* Truncated title — same row, absolute over the tags
                  paragraph. Single-line, ellipsis on overflow, color
                  #391F00 per frame 08. */}
              <p
                className="font-kyoto absolute inset-0 m-0 truncate text-[14px] leading-[20px] font-medium"
                style={{
                  color: '#391F00',
                  opacity: titleOpacity,
                  transition: 'opacity 80ms linear',
                  pointerEvents: 'none',
                }}
                aria-hidden={titleOpacity === 0}
              >
                {headline}
              </p>
            </div>
            {/* Close button — same outline Button as the previous
                TopNavigation inside FrontMatter. */}
            <div className="flex shrink-0 items-center">
              <Button variant="outline" label="Close" onClick={onClose} />
            </div>
          </div>
        </div>
      </div>
      {/* Gradient mask — the soft fade that pulls scrolling content
          into the cream backdrop as it crosses the chrome row's
          bottom edge (frames 03/04). Sits OUTSIDE the centered
          1280-max wrapper so it spans the full overlay width across
          the scroll container, not just the centered chrome strip. */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-full h-[24px]"
        style={{
          background:
            'linear-gradient(to bottom, #FFFFFF 0%, rgba(255, 255, 255, 0) 100%)',
        }}
        aria-hidden
      />
    </div>
  );
}

export default function MDXLayout({ front, onClose, children }: MDXLayoutProps) {
  // Anchor used by ChromeRow to find the nearest scrollable ancestor
  // at mount. The project SheetOverlay's `ProjectSheetContent` wraps
  // content with `position: absolute; inset: 0; overflow: auto` (in
  // app.tsx) — that's the scroll container the sticky chrome row pins
  // against and the scroll listener reads from.
  const anchorRef = useRef<HTMLDivElement | null>(null);

  return (
    // Cream wash backdrop — Path A keeps the landing wash shell visible
    // above; the overlay's own surface is the cream "paper" that the
    // case study chrome sits on. Restored after the brief experiment
    // with a transparent backdrop made the body text unreadable over
    // the wash strip showing through.
    <div ref={anchorRef} className="min-h-full w-full bg-white">
      <ChromeRow
        tags={front.tags}
        headline={front.headline}
        onClose={onClose}
        anchorRef={anchorRef}
      />
      <div className="relative mx-auto w-full max-w-[1280px] px-[72px]">
        {/* Project Detail card content: 1104 wide, centered. The
            chrome row above already carries the tags + Close, so
            FrontMatter renders just the headline + introduction
            block (its TopNavigation is suppressed — passing
            `hideTopNavigation` keeps the component as the
            FrontMatter source-of-truth without a second Close
            button). */}
        <div className="relative mx-auto w-full max-w-[1104px]">
          <div className="pt-[84px]">
            <FrontMatter
              headline={front.headline}
              introduction={front.introduction}
              hideTopNavigation
            />
          </div>
          <div className="pt-[72px] pb-[264px]">{children}</div>
        </div>
      </div>
    </div>
  );
}
