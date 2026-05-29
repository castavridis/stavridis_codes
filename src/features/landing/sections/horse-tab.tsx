// Annotation (Horse Tab): "On Hover — 1. Tab pulls out 2. Ends at a slight
// angle 3. Uses a spring." The tab pokes up from below the page; hovering its
// visible lip pulls the body up with a spring, finishing tilted.

import { useState } from "react";
import { animated, useSpring } from "@react-spring/web";

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
      className="absolute -bottom-[650px] left-1/2 z-40 flex w-[201px] origin-bottom flex-col items-center gap-[28px] rounded-t-[8px] bg-cream px-[20px] pt-[24px] pb-[144px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#fbf6ea]"
    >
      <div className="relative w-[154px] overflow-hidden rounded-[4px] border border-[#d4d4d4]">
        <div
          aria-hidden="true"
          className="h-full w-full"
          style={{
            background:
              "linear-gradient(160deg, #2b2b2b 0%, #4a4640 35%, #6b5f55 60%, #2a221c 100%)",
          }}
        />
        <img className="mix-blend-multiply" src="/images/Horse.png" aria-hidden="true" />
      </div>
      <p className="w-full -rotate-[0.5deg] text-center font-mono text-[12px] leading-[24px] text-black">
        “Let a horse whisper in your ear and breathe on your heart.
        <br />
        You will never regret&nbsp;it.”
        <br /><br />— Author Unknown
      </p>
    </animated.div>
  );
}
