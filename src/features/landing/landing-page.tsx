import "../../globals.css";

import { DARK } from "./lib/colors.js";
import { Hero } from "./hero/hero.js";
import { CreativeToolsSection } from "./sections/creative-tools-section.js";
import { Footer } from "./sections/footer.js";
import { HorseTab } from "./sections/horse-tab.js";
import type { HeroProject } from "./hero/hero-project-card.js";
import type { ProjectCard } from "./sections/reveal-card.js";

// `onCardClick` is forwarded to the hero project cards so a host wrapper can
// swap to a project view on click. Optional — the page works standalone.
// `paused` freezes the Washes canvas when a project overlay covers the page.
// `company`/`blurb` and the card overrides power the per-company landing
// pages at /for/:company.
type LandingPageProps = {
  onCardClick?: (id: string) => void;
  onCardHover?: (id: string) => void;
  paused?: boolean;
  transitioning?: boolean;
  company?: string;
  blurb?: string;
  heroProjects?: HeroProject[];
  creativeCards?: ProjectCard[];
  experimentCards?: ProjectCard[];
};

export default function LandingPage({
  onCardClick,
  onCardHover,
  paused = false,
  transitioning = false,
  company,
  blurb,
  heroProjects,
  creativeCards,
  experimentCards,
}: LandingPageProps = {}): React.ReactElement {
  return (
    <div className="font-body relative w-full overflow-hidden text-[#fbf6ea]" style={{ backgroundColor: DARK }}>
      <Hero
        onCardClick={onCardClick}
        onCardHover={onCardHover}
        paused={paused}
        transitioning={transitioning}
        company={company}
        blurb={blurb}
        heroProjects={heroProjects}
      />
      <CreativeToolsSection creativeCards={creativeCards} experimentCards={experimentCards} />
      <Footer />
      <HorseTab />
    </div>
  );
}
