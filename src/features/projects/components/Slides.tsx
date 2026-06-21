import { Children, isValidElement, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { animated, useSpring } from '@react-spring/web';
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
  // Render the macOS-style window chrome (dark titlebar + 3 traffic-light
  // dots) above each slide. Off by default — most case-study slides are
  // already image exports of windowed UIs and don't need a second chrome.
  // Opt in with `windowChrome` when the slide content is a raw mockup
  // that should be presented as if it lives in an app window.
  windowChrome?: boolean;
};

export default function Slides({ children, windowChrome = false }: SlidesProps) {
  const slides = Children.toArray(children).filter(
    (child): child is ReactElement<SlideProps> =>
      isValidElement(child) && child.type === Slide,
  );

  const [index, setIndex] = useState(0);
  const active = slides[index];
  const hasMultiple = slides.length > 1;

  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setIndex((i) => (i + 1) % slides.length);

  // Carousel track translates horizontally to expose the active slide. Each
  // slide is laid out side-by-side inside the track at the viewport's width,
  // so translating by `-index * 100%` snaps it into view.
  const trackSpring = useSpring({
    x: -index * 100,
    config: { tension: 220, friction: 28 },
  });

  if (!active) return null;

  return (
    <div className="flex w-full flex-col gap-[16px]">
      <div className="relative w-full overflow-hidden rounded-[16px] bg-confetti-black p-[72px]">
        <div className="overflow-hidden rounded-[12px] bg-white shadow-lg">
          {windowChrome ? (
            <div className="flex items-center gap-[8px] bg-[#1f1f1f] px-[16px] py-[12px]">
              <span className="size-[13px] rounded-full bg-[#ff5f57]" />
              <span className="size-[13px] rounded-full bg-[#febc2e]" />
              <span className="size-[13px] rounded-full bg-[#28c840]" />
            </div>
          ) : null}
          <div className="overflow-hidden">
            <animated.div
              className="flex"
              style={{ transform: trackSpring.x.to((x) => `translate3d(${x}%, 0, 0)`) }}
            >
              {slides.map((slide, i) => (
                <div key={i} className="w-full shrink-0">
                  {slide.props.children}
                </div>
              ))}
            </animated.div>
          </div>
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
