import "../../globals.css";

import Header from "../../components/Header.js";
import FadeDown from "../../components/anim/FadeDown.js";
import { FeaturedWork } from "./sections/featured-work.js";
import { HorseTab } from "./sections/horse-tab.js";
import type { HeroProject } from "./hero/hero-project-card.js";
import type { ProjectCard } from "./sections/reveal-card.js";

// `onCardClick` is forwarded to FeaturedWork so a host wrapper can swap to a
// project view on click. Optional — the page works standalone. `paused`
// freezes the (future) Washes canvas when a project overlay covers the page.
// `company`/`blurb` and the card overrides power the per-company landing
// pages at /for/:company. `heroProjects`, `creativeCards`, `experimentCards`
// are kept for the existing props contract but are no-ops in v2.
type LandingPageProps = {
  onCardClick?: (id: string) => void;
  onCardHover?: (id: string) => void;
  paused?: boolean;
  transitioning?: boolean;
  company?: string;
  blurb?: string;
  onDismiss?: () => void;
  heroProjects?: HeroProject[];
  creativeCards?: ProjectCard[];
  experimentCards?: ProjectCard[];
};

export default function LandingPage({
  onCardClick,
  onCardHover: _onCardHover,
  paused: _paused = false,
  transitioning: _transitioning = false,
  company: _company,
  blurb: _blurb,
  onDismiss: _onDismiss,
  heroProjects: _heroProjects,
  creativeCards: _creativeCards,
  experimentCards: _experimentCards,
}: LandingPageProps = {}): React.ReactElement {
  return (
    <div className="font-body relative w-full overflow-hidden bg-washes-paper text-confetti-black">
      <Header />

      {/* Hero — Figma node 4002:21130 ("Intro"). Copy is canonical from Figma. */}
      <section className="relative mx-auto flex w-full max-w-[1104px] flex-col items-start gap-[24px] px-[160px] pt-[200px]">
        <FadeDown>
          <p className="font-kyoto w-[784px] text-[48px] font-medium leading-[60px] text-confetti-black">
            <span>
              {"Hey! I’m C Stavridis, "}
              <br aria-hidden />
              {"a "}
            </span>
            <span className="font-kyoto italic font-medium underline decoration-dotted decoration-from-font [text-underline-position:from-font]">
              Design Engineer
            </span>
            <span>
              {" with"}
              <br aria-hidden />
            </span>
            <span className="font-kyoto italic font-medium underline decoration-dotted decoration-from-font [text-underline-position:from-font]">
              big golden retriever energy
            </span>
            <span>.</span>
          </p>
        </FadeDown>

        <FadeDown delay={120}>
          <div className="flex items-start gap-[16px] text-[16px] leading-[24px] text-confetti-black">
            <div className="w-[385px]">
              <p className="font-kyoto mb-0 text-[16px] font-extrabold italic leading-[24px] text-confetti-black/50">
                then
              </p>
              <p className="mb-0">
                {"I love turning ambiguous, complex ideas into warm, approachable experiences. I co-founded CareSignal, "}
                <br aria-hidden />
                {"an enterprise digital health company (acquired "}
                <br aria-hidden />
                {"by Lightbeam), where I led Product and Brand."}
              </p>
              <p className="mb-0">&nbsp;</p>
              <p>
                In 2024, I decided to step away to be with my young family. I spent the time learning and building, too.
              </p>
            </div>
            <div className="w-[385px]">
              <p className="font-kyoto mb-0 text-[16px] font-extrabold italic leading-[24px] text-confetti-black/50">
                now
              </p>
              <p className="mb-0">
                {"I’ve finished two batches at the Recurse Center,"}
                <br aria-hidden />
                {"built AI-native tooling, and I’m currently building"}
                <br aria-hidden />
                {"a design system for Poimandres, the open-source collective behind react-three-fiber and zustand."}
              </p>
              <p className="mb-0">&nbsp;</p>
              <p>
                {"I am looking to join a dynamic team that values"}
                <br aria-hidden />
                {"high-craft design and engineering."}
              </p>
            </div>
          </div>
        </FadeDown>
      </section>

      <FeaturedWork onCardClick={onCardClick} />

      {/* TODO(PR 4c): Washes canvas + PresetWidget + Testimonial + Colophon */}

      <HorseTab />
    </div>
  );
}
