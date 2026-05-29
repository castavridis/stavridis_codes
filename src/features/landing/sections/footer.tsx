// ---------------------------------------------------------------------------
// Footer — testimonial band above the "horse tab" that pulls out of the
// bottom edge (see HorseTab).
// ---------------------------------------------------------------------------

import { DARK } from "../lib/colors.js";

export function Footer(): React.ReactElement {
  return (
    <footer
      className="relative w-full overflow-hidden pt-0  md:pt-[128px] pb-[144px] text-[#fbf6ea]"
      style={{ backgroundColor: DARK }}
    >
      <div className="mx-auto flex max-w-[560px] flex-col items-center gap-[16px] text-center">
        <p className="w-[504px] md:px-8 max-w-full">
          <span className="font-display block text-[24px] leading-[32px] pb-1">
            I love working with&nbsp;you,&nbsp;C.
          </span>
          <span className="font-body block text-[24px] leading-[32px]">
            You have an infectious energy and passion for what you do and you
            know how to push people in the right directions or advise them to
            get the best out of them.
          </span>
        </p>
        <p className="font-mono text-[16px] leading-[24px] opacity-75">
          <span className="block font-mono font-bold">
            Georgiana Ramona Turcsanyi
          </span>
          <span className="block">Senior Software Engineer</span>
        </p>
      </div>
    </footer>
  );
}
