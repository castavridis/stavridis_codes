import type { ComponentProps, ReactNode } from 'react';
import Callout from './Callout.js';
import FrontMatter from './FrontMatter.js';
import OutcomeStat from './OutcomeStat.js';
import WashesCanvas from './WashesCanvas.js';

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
//     Washes Canvas       — x=72,  y=72,  1136 × 391       (overhangs the
//                                                          Project Detail
//                                                          card by 16px each
//                                                          side, mirroring
//                                                          the landing hero)
//     Project Detail      — x=88,  y=128, 1104 × 5065.6
//       Front Matter      — x=80,  y=72  (relative), 944 × 408
//       Callout (next)    — x=80,  y=552 (relative)       => 72px gap below
//                                                          Front Matter
//     Footer              — x=248, y=5457.6, 784 × 376    => ~264px bottom
//                                                          between Project
//                                                          Detail and Footer
//
// Page-edge horizontal padding works out to (1280 − 1136) / 2 = 72px around
// the washes; the 1104 Project Detail card is centered inside with 16px of
// washes overhang on each side. Inside Project Detail, the 944 content column
// sits with an 80px gutter.
export default function MDXLayout({ front, onClose, children }: MDXLayoutProps) {
  return (
    <div className="min-h-full w-full bg-washes-paper">
      <div className="relative mx-auto w-full max-w-[1280px] px-[72px]">
        {/* Washes header band: full 1136 width, overhanging the Project
            Detail card by 16px on each side. */}
        <div className="relative pt-[72px]">
          <WashesCanvas className="h-[391px] w-[1136px] rounded-tl-[12px] rounded-tr-[12px] bg-gradient-to-b from-[#fbf6ea] to-transparent" />
        </div>
        {/* Project Detail card content: 1104 wide, 16px narrower than the
            washes on each side. FrontMatter sits 72px below the washes. */}
        <div className="relative mx-auto w-full max-w-[1104px] px-[80px]">
          <div className="pt-[72px]">
            <FrontMatter
              headline={front.headline}
              introduction={front.introduction}
              tags={front.tags}
              onClose={onClose}
            />
          </div>
          <div className="pt-[72px] pb-[264px]">{children}</div>
        </div>
      </div>
    </div>
  );
}
