// ---------------------------------------------------------------------------
// RevealCard — shared Creative / Experiment recipe.
//
// Annotation (CreativeProjectCard & ExperimentProjectCard):
//   Inactive: only the title is visible.
//   On hover: title + description slide up until the description is in view,
//   AND the watercolor mask layers (Washes Multiplied, Noise, Desaturation)
//   fade out to reveal the "original project image" underneath.
//
// The image is one live Washes canvas; the three masks are CSS overlays
// matching the Figma's layer stack. react-spring drives the slide + fade.
// ---------------------------------------------------------------------------

import { useLayoutEffect, useRef, useState } from "react";
import { animated, useSpring } from "@react-spring/web";
import { CREAM } from "../lib/colors.js";

export type ProjectCard = {
  id: string;
  title: string;
  description: string;
  project_image: string;
  washes_image: string;
  link?: string;
};

export function RevealCard({
  width,
  height,
  card,
}: {
  width: number;
  height: number;
  card: ProjectCard;
}): React.ReactElement {
  const { title, description } = card;
  const descRef = useRef<HTMLParagraphElement | null>(null);
  const [hovered, setHovered] = useState(false);
  const [isMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches);

  // Distance the text block hides below the fold while inactive: the
  // description height + the 4px gap + the 12px bottom padding.
  const GAP_PX = 4;
  const PB_PX = 12;
  const [hideDistance, setHideDistance] = useState(24 + GAP_PX + PB_PX);

  useLayoutEffect(() => {
    if (descRef.current)
      setHideDistance(descRef.current.offsetHeight + GAP_PX + PB_PX);
  }, [description]);

  // Mask layers fade out together on hover; text slides up.
  const maskStyle = useSpring({
    opacity: hovered ? 1 : 0,
    config: { tension: 200, friction: 26 },
  });
  const textStyle = useSpring({
    transform: hovered
      ? `translateY(${hideDistance + PB_PX * 3.5}px)`
      : `translateY(${hideDistance}px)`,
    config: { tension: 220, friction: 22 },
  });

  const article = (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => !card.link && setHovered(true)}
      onBlur={() => !card.link && setHovered(false)}
      tabIndex={card.link ? undefined : 0}
      style={{ width, height }}
      className="relative isolate focus:outline-none focus-visible:ring-2 focus-visible:ring-[#fbf6ea]"
    >
      {/* Container project image */}
      <div className="absolute inset-0 overflow-hidden rounded-[12px]" style={{
        backgroundImage: `url('${card.project_image})`,
        backgroundSize: 'cover',
      }}>
        {/* Original project image */}
        <div
          className="absolute inset-0 mix-blend-color"
          style={{
            backgroundImage: `url('${card.project_image}')`,
            backgroundSize: 'cover',
          }}
        />

        {/* Desaturation layer — cream wash with color blend. */}
        <div
          className="absolute inset-0 mix-blend-color"
          style={{ backgroundColor: CREAM }}
        />

        {/* Washes Multiplied — accent wash multiplied over the image. */}
        <div className="absolute inset-0 opacity-70 mix-blend-multiply" style={{
          backgroundImage: `url('${card.washes_image}')`,
          backgroundSize: 'cover',
        }} />

        {
          isMobile && (
            <div className="absolute inset-0 mix-blend-multiply opacity-25" style={{
              backgroundColor: 'rgb(37,25,0)'
            }} />
          )
        }

        {/* Mask stack — Washes Multiplied + Noise + Desaturation. Fades on hover. */}
        <animated.div
          className="pointer-events-none absolute inset-0"
          style={{ opacity: isMobile ? 0 : maskStyle.opacity }}
        >
          {/* Original project image — vivid pigments, always visible underneath. */}
          <div className="absolute inset-0 overflow-hidden rounded-[12px]" style={{
            backgroundImage: `url('${card.project_image}')`,
            backgroundSize: 'cover',
          }} />
        </animated.div>
      </div>
      {/* Text — slides up so the description comes into view on hover. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 px-[12px] pb-[12px]">
        {
          isMobile
            ? <animated.div className="text-[#fbf6ae]">
                <h3 className="font-display text-[18px] leading-[36px]">{title}</h3>
                <p
                  className="font-mono text-[16px] leading-[24px] text-[#fbf6ea]"
                >
                  {description}
                </p>
              </animated.div>
            : <animated.div
                style={textStyle}
                className="flex flex-col text-[#fbf6ea]"
              >
                <h3 className="font-display text-[18px] leading-[36px]">{title}</h3>
                <animated.p
                  ref={descRef}
                  className="font-mono text-[16px] leading-[24px] text-[#fbf6ea]"
                  style={{ opacity: maskStyle.opacity }}
                >
                  {description}
                </animated.p>
              </animated.div>
        }
      </div>
    </article>
  );

  return card.link ? (
    <a href={card.link} target="_blank" rel="noreferrer" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocus={() => setHovered(true)} onBlur={() => setHovered(false)}>
      {article}
    </a>
  ) : (
    article
  );
}
