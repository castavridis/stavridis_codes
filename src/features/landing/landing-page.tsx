import "../../globals.css";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import Header from "../../components/Header.js";
import Colophon from "../../components/Colophon.js";
import Popover from "../../components/Popover.js";
import FadeDown from "../../components/anim/FadeDown.js";
import FadeUp from "../../components/anim/FadeUp.js";
import { FeaturedWork } from "./sections/featured-work.js";
import { HorseTab } from "./sections/horse-tab.js";
import { WashesCanvas } from "./sections/washes-canvas.js";
import { PaintBrush } from "./sections/paint-brush.js";
import { Testimonial } from "./sections/testimonial.js";
import { PresetWidget } from "./hero/preset-widget.js";
import {
  buildForecast,
  dayPhaseFor,
  fallbackForecast,
  FALLBACK_SUN,
  formatClock,
  isoToMinutes,
  localMinutes,
  LOCATIONS,
  weatherFromCode,
  WEATHER_ORDER,
  type DayPhase,
  type LocationInfo,
  type PhaseForecast,
  type SunTimes,
  type WeatherKey,
} from "./lib/weather.js";
import { usePaintStore } from "../../lib/paint-store.js";
import type { HeroProject } from "./hero/hero-project-card.js";
import type { ProjectCard } from "./sections/reveal-card.js";

// `onCardClick` is forwarded to FeaturedWork so a host wrapper can swap to a
// project view on click. Optional — the page works standalone. `paused`
// freezes the Washes canvas when a project overlay covers the page.
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

// Small page-local helper. Wraps an inline phrase (e.g. an italic span) so
// hovering or focusing it reveals an adjacent Popover. The popover floats
// just below+left of the phrase per the Figma hover states (nodes
// 2232:32188 and 4003:21284). A short close-delay lets the cursor cross the
// gap between the phrase and the popover without dismissing prematurely.
type HoverPopoverProps = {
  title: string;
  content: ReactNode;
  children: ReactNode;
};

function HoverPopover({
  title,
  content,
  children,
}: HoverPopoverProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);

  const cancelClose = useCallback(() => {
    if (closeTimer.current != null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => {
      setOpen(false);
      closeTimer.current = null;
    }, 120);
  }, [cancelClose]);

  const openNow = useCallback(() => {
    cancelClose();
    setOpen(true);
  }, [cancelClose]);

  useEffect(() => {
    return () => {
      if (closeTimer.current != null) window.clearTimeout(closeTimer.current);
    };
  }, []);

  return (
    <span
      className="relative inline-block"
      onMouseEnter={openNow}
      onMouseLeave={scheduleClose}
      onFocus={openNow}
      onBlur={scheduleClose}
    >
      {children}
      {open ? (
        <span
          className="absolute top-full left-0 z-10 mt-[12px] block"
          onMouseEnter={openNow}
          onMouseLeave={scheduleClose}
        >
          <FadeUp from={6} duration={240}>
            <Popover title={title}>{content}</Popover>
          </FadeUp>
        </span>
      ) : null}
    </span>
  );
}

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
  // -----------------------------------------------------------------------
  // Weather / location state. Lifted from the legacy hero so the PresetWidget
  // and the WashesCanvas can both observe it. The OpenMeteo fetch logic is a
  // direct copy of the hero's `refreshWeather` — the same callback contract.
  // -----------------------------------------------------------------------
  const [locationIdx, setLocationIdx] = useState(0);
  const [weather, setWeather] = useState<WeatherKey>("sunny");
  const [temp, setTemp] = useState(72);
  const [forecast, setForecast] = useState<PhaseForecast[]>(() =>
    fallbackForecast(LOCATIONS[0]),
  );
  const [slot, setSlot] = useState(0);
  const [tzOffsetSec, setTzOffsetSec] = useState<number | null>(null);
  const [time, setTime] = useState(() => formatClock(null));
  const [sun, setSun] = useState<SunTimes>(FALLBACK_SUN);
  const [autoPhase, setAutoPhase] = useState<DayPhase>("day");
  const [phaseOverride, setPhaseOverride] = useState<DayPhase | null>(null);
  const dayPhase = phaseOverride ?? autoPhase;
  const location = LOCATIONS[locationIdx];

  // Mirror the location/weather/dayPhase into the shared paint store so any
  // observer (e.g. the WashesCanvas) can react without prop-drilling.
  const setCurrentLocationIndex = usePaintStore(
    (s) => s.setCurrentLocationIndex,
  );
  const setCurrentDayPhase = usePaintStore((s) => s.setCurrentDayPhase);
  const setCurrentWeather = usePaintStore((s) => s.setCurrentWeather);
  useEffect(() => {
    setCurrentLocationIndex(locationIdx);
  }, [locationIdx, setCurrentLocationIndex]);
  useEffect(() => {
    setCurrentDayPhase(dayPhase);
  }, [dayPhase, setCurrentDayPhase]);
  useEffect(() => {
    setCurrentWeather(weather);
  }, [weather, setCurrentWeather]);

  const refreshWeather = useCallback(async (loc: LocationInfo) => {
    try {
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}` +
        `&current=temperature_2m,weather_code&daily=sunrise,sunset` +
        `&hourly=temperature_2m,weather_code&forecast_days=2` +
        `&temperature_unit=fahrenheit&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as {
        utc_offset_seconds?: number;
        current?: { temperature_2m?: number; weather_code?: number };
        daily?: { sunrise?: string[]; sunset?: string[] };
        hourly?: {
          time?: string[];
          temperature_2m?: number[];
          weather_code?: number[];
        };
      };
      const t = data.current?.temperature_2m;
      const code = data.current?.weather_code;
      const off =
        typeof data.utc_offset_seconds === "number"
          ? data.utc_offset_seconds
          : loc.fallbackOffsetSec;
      setTemp(typeof t === "number" ? Math.round(t) : loc.fallbackTemp);
      setWeather(
        typeof code === "number" ? weatherFromCode(code) : loc.fallbackWeather,
      );
      setTzOffsetSec(off);
      const sr = isoToMinutes(data.daily?.sunrise?.[0]);
      const ss = isoToMinutes(data.daily?.sunset?.[0]);
      if (sr != null && ss != null) setSun({ sunriseMin: sr, sunsetMin: ss });
      setForecast(buildForecast(data, off) ?? fallbackForecast(loc));
    } catch {
      setTemp(loc.fallbackTemp);
      setWeather(loc.fallbackWeather);
      setTzOffsetSec(loc.fallbackOffsetSec);
      setSun(FALLBACK_SUN);
      setForecast(fallbackForecast(loc));
    }
  }, []);

  // Bootstrap: initial fetch for the default location.
  useEffect(() => {
    void refreshWeather(LOCATIONS[0]);
  }, [refreshWeather]);

  // Keep clock + day phase in sync with the location's local time.
  useEffect(() => {
    const update = () => {
      setTime(formatClock(tzOffsetSec));
      setAutoPhase(dayPhaseFor(localMinutes(tzOffsetSec), sun));
    };
    update();
    const id = window.setInterval(update, 30_000);
    return () => window.clearInterval(id);
  }, [tzOffsetSec, sun]);

  // -----------------------------------------------------------------------
  // Bug-chip handlers. Each cycles its slice of state; the PresetWidget
  // wrapper additionally scrolls + bumps `resetVersion` (see preset-widget).
  // -----------------------------------------------------------------------
  const cycleLocation = useCallback(() => {
    const nextIdx = (locationIdx + 1) % LOCATIONS.length;
    setLocationIdx(nextIdx);
    void refreshWeather(LOCATIONS[nextIdx]);
    setSlot(0);
    setPhaseOverride(null);
  }, [locationIdx, refreshWeather]);

  const cycleWeather = useCallback(() => {
    const nextWeather =
      WEATHER_ORDER[
        (WEATHER_ORDER.indexOf(weather) + 1) % WEATHER_ORDER.length
      ];
    setWeather(nextWeather);
  }, [weather]);

  const cycleSlot = useCallback(() => {
    const next = (slot + 1) % (forecast.length + 1);
    const newOverride = next === 0 ? null : forecast[next - 1].phase;
    setSlot(next);
    setPhaseOverride(newOverride);
  }, [slot, forecast]);

  // The Washes Canvas region — the paint brush hit target. This is the
  // top ~67% of the shell where the WebGL wash lives. The PresetWidget
  // also scrolls to this element on a reset.
  const washesRef = useRef<HTMLDivElement | null>(null);

  return (
    // -----------------------------------------------------------------------
    // Page root — Figma node 4012:42490 / 4003:23311. The outer page has a
    // 72px gutter on top + sides and 80px on bottom; everything is
    // centered. Background is washes-paper (#fbf6ea), text confetti-black.
    // -----------------------------------------------------------------------
    <div className="font-body bg-washes-paper text-confetti-black relative flex w-full flex-col items-center overflow-hidden px-[72px] pt-[72px] pb-[80px]">
      {/* -------------------------------------------------------------------
          Washes Shell — Figma node 4012:42332 "Header". The single rounded
          container that holds the Header (logo + nav), the Washes Canvas
          (top 66.93%), and the Intro glass card (overlaid at the bottom
          90.58%). The whole shell is 1136×584.169 with 12px rounded top
          corners; everything inside is absolutely positioned.
          ------------------------------------------------------------------- */}
      <section className="relative w-full max-w-[1136px]" style={{ height: "584.169px" }}>
        {/* Washes Canvas region — Figma node 4002:21177. Takes the top
            66.93% of the shell (inset bottom = 33.07%). Owns the wash
            WebGL host, the Connecting Gradients overlays, the Header
            (Name + Links), and the PaintBrush overlay. The shell's
            overflow-hidden + rounded-tl/tr radii are applied here so the
            wash painting can't bleed outside. */}
        <div
          ref={washesRef}
          className="absolute left-0 right-0 top-0 overflow-hidden rounded-tl-[12px] rounded-tr-[12px]"
          style={{ bottom: "33.07%" }}
        >
          {/* No `scrollRef` — the outer wrapper IS the scroll target.
              PresetWidget + PaintBrush both reference `washesRef` (the
              outer div), so the WashesCanvas can stay agnostic. */}
          <WashesCanvas dayPhase={dayPhase} weather={weather} />

          {/* Header — Name (left) and Links (right) at top:16.17px per
              Figma. Header.tsx renders a fragment (Name, Links); a flex
              strip with justify-between puts them at the correct edges
              within the 16px-inset slot. z-20 keeps it above the wash +
              gradients, and the parent `overflow-hidden` clips it to the
              rounded shell corners. */}
          <div className="absolute left-[16px] right-[16px] top-[16.17px] z-20 flex items-center justify-between">
            <Header />
          </div>

          {/* PaintBrush overlay — pointer events target the washesRef
              (this very container). */}
          <PaintBrush targetRef={washesRef} />
        </div>

        {/* Intro glass card — Figma node 4002:21178 / 4002:21130.
            Absolutely positioned over the bottom 90.58% of the shell
            (inset top = 9.42%) with 1.41% horizontal insets. Carries the
            backdrop-blur, the top-down white→transparent gradient that
            creates the "frosted glass at the top, wash bleeds through at
            the bottom" look, and a 0.972px cream border. z-index is
            below the Header so the nav stays clickable; the wash sits
            beneath.

            Pointer note: the glass card consumes clicks in its area, so
            painting via PaintBrush is only reachable in the strip ABOVE
            the card (top ~55px) and through the Header gaps. The Figma
            "click paintbrush" state at node 4003:23311 shows the card
            fading to 50% opacity + sliding down to reveal the full wash
            for painting — that interaction is a future PR; this one
            establishes the canonical resting structure. */}
        <div
          className="absolute z-10 flex flex-col items-start overflow-clip rounded-tl-[12px] rounded-tr-[12px] border-solid border-[#fbf6ea] px-[160px] pt-[132px]"
          style={{
            top: "9.42%",
            bottom: "0.2%",
            left: "1.41%",
            right: "1.41%",
            backdropFilter: "blur(1.944px)",
            WebkitBackdropFilter: "blur(1.944px)",
            borderWidth: "0.972px",
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.35) 60%, rgba(255,255,255,0) 100%)",
          }}
        >
          <FadeDown>
            <p className="font-kyoto text-confetti-black w-[784px] text-[48px] leading-[60px] font-medium">
              <span>
                {"Hey! I’m C Stavridis, "}
                <br aria-hidden />
                {"a "}
              </span>
              <HoverPopover
                title="Tools I like to build with"
                content="React, TypeScript, Tailwind, vanilla HTML/CSS, p5, GSAP, react-three-fiber, Figma."
              >
                <span className="font-kyoto decoration-from-font [text-underline-position:from-font] font-medium italic underline decoration-dotted">
                  Design Engineer
                </span>
              </HoverPopover>
              <span>
                {" with"}
                <br aria-hidden />
              </span>
              <HoverPopover
                title="My role model, Bailey"
                content="A very good dog. Equal parts curious, enthusiastic, and warm — the energy I try to bring to the work."
              >
                <span className="font-kyoto decoration-from-font [text-underline-position:from-font] font-medium italic underline decoration-dotted">
                  big golden retriever energy
                </span>
              </HoverPopover>
              <span>.</span>
            </p>
          </FadeDown>

          <FadeDown delay={120}>
            <div className="text-confetti-black mt-[24px] flex items-start gap-[16px] text-[16px] leading-[24px]">
              <div className="w-[385px]">
                <p className="font-kyoto text-confetti-black/50 mb-0 text-[16px] leading-[24px] font-medium italic">
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
                  In 2024, I decided to step away to be with my young family. I
                  spent the time learning and building, too.
                </p>
              </div>
              <div className="w-[385px]">
                <p className="font-kyoto text-confetti-black/50 mb-0 text-[16px] leading-[24px] font-medium italic">
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
        </div>
      </section>

      {/* PresetWidget — sits centered below the shell. Scroll target is
          the washesRef so a reset scrolls back to the wash region. */}
      <div className="mt-[40px] flex w-full max-w-[1136px] justify-center">
        <PresetWidget
          location={location}
          slot={slot}
          time={time}
          temp={temp}
          weather={weather}
          dayPhase={dayPhase}
          forecast={forecast}
          onLocation={cycleLocation}
          onTime={cycleSlot}
          onWeather={cycleWeather}
          scrollTargetRef={washesRef}
        />
      </div>

      <div className="mt-[120px] flex w-full max-w-[944px] justify-center">
        <FeaturedWork onCardClick={onCardClick} />
      </div>

      <div className="mt-[120px] flex w-full max-w-[944px] justify-center">
        <Testimonial />
      </div>

      {/* Colophon strip — dark band per Figma node 4013:42567. Breaks out
          of the 72px side gutter and the 80px bottom pad so the dark fill
          spans the page-card edges. Width is parent + 144px to cancel
          the px-[72px] on both sides; the parent `overflow-hidden`
          guards against any sub-pixel overflow. */}
      <div className="bg-confetti-black -mx-[72px] -mb-[80px] mt-[120px] w-[calc(100%+144px)]">
        <div className="mx-auto flex w-full max-w-[944px] justify-center">
          <Colophon />
        </div>
      </div>

      <HorseTab />
    </div>
  );
}
