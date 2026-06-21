import { Children, isValidElement, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Text from '../../../components/Text.js';

type SlideProps = {
  caption?: ReactNode;
  children: ReactNode;
};

export function Slide(_props: SlideProps): null {
  return null;
}

type SlidesProps = {
  children: ReactNode;
};

export default function Slides({ children }: SlidesProps) {
  const slides = Children.toArray(children).filter(
    (child): child is ReactElement<SlideProps> =>
      isValidElement(child) && child.type === Slide,
  );

  const [index, setIndex] = useState(0);
  const active = slides[index];
  const hasMultiple = slides.length > 1;

  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setIndex((i) => (i + 1) % slides.length);

  if (!active) return null;

  return (
    <div className="flex w-full flex-col gap-[16px]">
      <div className="relative w-full overflow-hidden rounded-[16px] bg-confetti-black p-[72px]">
        <div className="overflow-hidden rounded-[12px] bg-white shadow-lg">
          <div className="flex items-center gap-[8px] bg-[#1f1f1f] px-[16px] py-[12px]">
            <span className="size-[13px] rounded-full bg-[#ff5f57]" />
            <span className="size-[13px] rounded-full bg-[#febc2e]" />
            <span className="size-[13px] rounded-full bg-[#28c840]" />
          </div>
          <div>{active.props.children}</div>
        </div>

        {hasMultiple ? (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous slide"
              className="absolute left-[24px] top-1/2 grid size-[48px] -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next slide"
              className="absolute right-[24px] top-1/2 grid size-[48px] -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <ChevronRight size={24} />
            </button>
          </>
        ) : null}
      </div>

      {active.props.caption ? (
        <div className="px-[16px]">
          <Text variant="callout-meta">{active.props.caption}</Text>
        </div>
      ) : null}
    </div>
  );
}
