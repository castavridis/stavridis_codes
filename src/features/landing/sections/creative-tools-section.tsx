// ---------------------------------------------------------------------------
// Creative Tools + UI Experiments — one continuous dark section in the Figma.
// ---------------------------------------------------------------------------

import { useState } from "react";
import { DARK } from "../lib/colors.js";
import { RevealCard } from "./reveal-card.js";
import { CREATIVE_CARDS, EXPERIMENT_CARDS } from "./project-cards.data.js";

export function CreativeToolsSection(): React.ReactElement {
  const [isMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  return (
    <section className="w-full" style={{ backgroundColor: DARK }}>
      <div className="mx-auto max-w-[1280px] px-[24px]">
        {/* AI-Native Creative Tools */}
        <div className="pt-[144px]">
          <p className="font-display text-center text-[24px] leading-[28px] text-[#fbf6ea]/80">
            AI-Native Creative&nbsp;Tools
          </p>
          <div className="mt-[36px] flex flex-wrap justify-center gap-[24px] md:gap-[64px]">
            {CREATIVE_CARDS.map((card) => (
              <RevealCard key={card.id} width={isMobile ? 312 : 272} height={isMobile ? 206 : 182} card={card} />
            ))}
          </div>
        </div>

        {/* UI Experiments */}
        <div className="pt-[144px] pb-[120px]">
          <p className="font-display text-center text-[24px] leading-[24px] text-[#fbf6ea]/80">
            UI Experiments
          </p>
          <div className="mt-[36px] flex flex-wrap justify-center gap-[24px] md:gap-[64px]">
            {EXPERIMENT_CARDS.map((card) => (
              <RevealCard key={card.id} width={isMobile ? 312 : 416} height={isMobile ? 206 : 275} card={card} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
