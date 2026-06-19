import type { ComponentProps, ReactNode } from 'react';
import Callout from '../../projects/components/Callout.js';
import OutcomeStat from '../../projects/components/OutcomeStat.js';
import WashesCanvas from '../../projects/components/WashesCanvas.js';
import BlogFrontMatter from './BlogFrontMatter.js';

type Front = {
  title: string;
  dek: string;
  date: string;
  readingTime: string;
  tags?: string;
};

type BlogLayoutProps = {
  front: Front;
  onBack?: () => void;
  children: ReactNode;
};

// MDX overrides for blog posts. These mirror the project chrome's overrides
// for visual continuity but with two changes for a text-first reading
// surface:
//   1. Body copy is 18/30 (vs. 20/32 on projects) — comfortable for longer
//      essays at the 704px column width.
//   2. The h1 override is omitted intentionally — posts get their title from
//      frontmatter (via BlogFrontMatter), and stray h1s inside MDX bodies
//      should render as h2-equivalents. If a legacy post repeats its title
//      as a first-line `#`, it'll just render as a section header; cosmetic
//      only.
//
// Authors can still opt into <Callout> and <OutcomeStat> by spelling them in
// MDX — the overrides re-expose those tags here so no per-file import is
// needed.
export const blogMdxComponents = {
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
  h3: (props: ComponentProps<'h3'>) => (
    <h3
      {...props}
      className="font-kyoto mt-[32px] mb-[12px] text-[24px] font-medium leading-[32px] text-confetti-black"
    />
  ),
  p: (props: ComponentProps<'p'>) => (
    <p
      {...props}
      className="font-body my-[16px] text-[18px] font-normal leading-[30px] text-confetti-black"
    />
  ),
  a: (props: ComponentProps<'a'>) => (
    <a
      {...props}
      className="font-body text-confetti-black underline decoration-dotted decoration-from-font [text-underline-position:from-font]"
    />
  ),
  ul: (props: ComponentProps<'ul'>) => (
    <ul
      {...props}
      className="font-body my-[16px] list-disc pl-[24px] text-[18px] font-normal leading-[30px] text-confetti-black marker:text-confetti-black/40"
    />
  ),
  ol: (props: ComponentProps<'ol'>) => (
    <ol
      {...props}
      className="font-body my-[16px] list-decimal pl-[24px] text-[18px] font-normal leading-[30px] text-confetti-black marker:text-confetti-black/40"
    />
  ),
  li: (props: ComponentProps<'li'>) => <li {...props} className="my-[6px]" />,
  blockquote: (props: ComponentProps<'blockquote'>) => (
    <blockquote
      {...props}
      className="font-kyoto my-[32px] border-l-2 border-confetti-black/30 pl-[24px] text-[22px] font-medium italic leading-[32px] text-confetti-black"
    />
  ),
  code: (props: ComponentProps<'code'>) => (
    <code
      {...props}
      className="font-mono rounded-[4px] bg-confetti-black/[0.06] px-[6px] py-[2px] text-[14px] leading-[24px] text-confetti-black"
    />
  ),
  pre: (props: ComponentProps<'pre'>) => (
    <pre
      {...props}
      className="font-mono my-[24px] overflow-x-auto rounded-[8px] bg-confetti-black/[0.04] p-[20px] text-[14px] leading-[24px] text-confetti-black"
    />
  ),
  hr: (props: ComponentProps<'hr'>) => (
    <hr {...props} className="my-[48px] border-0 border-t border-confetti-black/15" />
  ),
  img: (props: ComponentProps<'img'>) => (
    <img {...props} className="my-[32px] block w-full rounded-[8px]" />
  ),
  Callout,
  OutcomeStat,
};

// The blog's MDX layout. Same outer chrome and washes wash as the project
// overlay (so navigating from project to blog feels continuous), but the
// content column drops from 944px to 704px — text-first reading is most
// comfortable at ~65-75ch.
export default function BlogLayout({ front, onBack, children }: BlogLayoutProps) {
  return (
    <div className="min-h-full w-full bg-washes-paper">
      <div className="relative mx-auto max-w-[1280px] px-[88px]">
        <div className="relative">
          <WashesCanvas className="absolute left-0 right-0 top-0 mx-auto h-[391px] w-[1104px] rounded-tl-[12px] rounded-tr-[12px] bg-gradient-to-b from-[#fbf6ea] to-transparent" />
          <div className="relative pt-[128px] pb-[64px]">
            <div className="mx-auto w-[944px]">
              <BlogFrontMatter
                title={front.title}
                dek={front.dek}
                date={front.date}
                readingTime={front.readingTime}
                tags={front.tags}
                onBack={onBack}
              />
            </div>
          </div>
        </div>
        <div className="relative mx-auto max-w-[704px] pb-[128px]">{children}</div>
      </div>
    </div>
  );
}
