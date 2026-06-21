// Annotation (Horse Tab, Figma 4020:50099): "On Hover — 1. Tab pulls out
// 2. Ends at a slight angle 3. Uses a spring." The tab pokes up from below
// the page; hovering its visible lip pulls the body up with a spring,
// finishing slightly rotated.

import { useState } from "react";
import { animated, useSpring } from "@react-spring/web";

import Text from "../../../components/Text.js";

export function HorseTab(): React.ReactElement {
  const [hovered, setHovered] = useState(false);
  const tabStyle = useSpring({
    transform: hovered
      ? "translateX(-50%) translateY(-550px) rotate(-3deg)"
      : "translateX(-50%) translateY(0px) rotate(0deg)",
    config: { tension: 180, friction: 15 },
  });
  return (
    <animated.div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      tabIndex={0}
      style={tabStyle}
      className="bg-washes-paper absolute -bottom-[650px] left-1/2 z-40 flex w-[201px] origin-bottom flex-col items-center gap-[16px] overflow-clip rounded-t-[8px] px-[20px] pt-[24px] pb-[144px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#fbf6ea]"
    >
      {/* BTS photo — confetti-black border, 4px radius. The actual frame
          is 161×339 (the parent's w-full inside px-[20px] of 201px container).
          The original Figma uses an oversized 405px image shifted left to
          crop to that aspect; an `object-cover` background does the same
          job with less DOM. The translucent paper noise filter on top
          mutes the photo so it reads as part of the page rather than a
          dominant visual. */}
      <div className="border-confetti-black relative h-[339.163px] w-full overflow-clip rounded-[4px] border border-solid">
        <img
          alt=""
          aria-hidden="true"
          src="/images/horse-bts.png"
          className="absolute inset-0 size-full object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ backgroundColor: "rgba(251, 246, 234, 0.2)" }}
        />
      </div>

      {/* Title — PP Kyoto Medium Italic 24/32 confetti-black, slight tilt. */}
      <div className="-rotate-[0.51deg]">
        <Text variant="headline-small-italic" className="text-confetti-black w-[161px]">
          My Favorite BTS Snap
        </Text>
      </div>

      {/* Quote — Spline Sans Mono 12/20 confetti-black, matching the
          Figma line breaks. */}
      <div className="-rotate-[0.51deg] w-full">
        <Text variant="tag" className="text-confetti-black w-full whitespace-pre-wrap">
          {`"Let a horse whisper`}
          <br aria-hidden />
          {`in your ear and breathe on your heart.`}
          <br aria-hidden />
          {`You will never regret it."`}
          <br aria-hidden />— Author Unknown
        </Text>
      </div>
    </animated.div>
  );
}
