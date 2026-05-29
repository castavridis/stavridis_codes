import "../../globals.css";

import { DARK } from "./lib/colors.js";
import { Hero } from "./hero/hero.js";
import { CreativeToolsSection } from "./sections/creative-tools-section.js";
import { Footer } from "./sections/footer.js";
import { HorseTab } from "./sections/horse-tab.js";

// `onCardClick` is forwarded to the hero project cards so a host wrapper can
// swap to a project view on click. Optional — the page works standalone.
// `paused` freezes the Washes canvas when a project overlay covers the page.
type LandingPageProps = { onCardClick?: (id: string) => void; onCardHover?: (id: string) => void; paused?: boolean; transitioning?: boolean };

export default function LandingPage({ onCardClick, onCardHover, paused = false, transitioning = false }: LandingPageProps = {}): React.ReactElement {
  return (
    <div className="font-body relative w-full overflow-hidden text-[#fbf6ea]" style={{ backgroundColor: DARK }}>
      <Hero onCardClick={onCardClick} onCardHover={onCardHover} paused={paused} transitioning={transitioning} />
      <CreativeToolsSection />
      <Footer />
      <HorseTab />
    </div>
  );
}
