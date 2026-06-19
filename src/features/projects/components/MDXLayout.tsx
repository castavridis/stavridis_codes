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

export default function MDXLayout({ front, onClose, children }: MDXLayoutProps) {
  return (
    <div className="min-h-full w-full bg-washes-paper">
      <div className="relative mx-auto max-w-[1280px] px-[88px]">
        <div className="relative">
          <WashesCanvas className="absolute left-0 right-0 top-0 mx-auto h-[391px] w-[1104px] rounded-tl-[12px] rounded-tr-[12px] bg-gradient-to-b from-[#fbf6ea] to-transparent" />
          <div className="relative pt-[128px] pb-[64px]">
            <div className="mx-auto w-[944px]">
              <FrontMatter
                headline={front.headline}
                introduction={front.introduction}
                tags={front.tags}
                onClose={onClose}
              />
            </div>
          </div>
        </div>
        <div className="relative mx-auto w-[944px] pb-[128px]">{children}</div>
      </div>
    </div>
  );
}
