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

  // The element the preset widget scrolls to + the paint brush targets.
  const washesRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="font-body bg-washes-paper text-confetti-black relative w-full overflow-hidden">
      <Header />

      {/* Hero — Figma node 4002:21130 ("Intro"). Copy is canonical from Figma. */}
      <section className="relative mx-auto flex w-full max-w-[1104px] flex-col items-start gap-[24px] px-[160px] pt-[200px]">
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
          <div className="text-confetti-black flex items-start gap-[16px] text-[16px] leading-[24px]">
            <div className="w-[385px]">
              <p className="font-kyoto text-confetti-black/50 mb-0 text-[16px] leading-[24px] font-extrabold italic">
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
              <p className="font-kyoto text-confetti-black/50 mb-0 text-[16px] leading-[24px] font-extrabold italic">
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

      {/* Washes canvas + paint brush + preset widget — the interactive band
          that sits between hero and featured work. The PaintBrush overlay
          shares the WashesCanvas's container as its target so pointer
          events line up exactly with the painted surface. */}
      <section className="relative mx-auto mt-[120px] flex w-full max-w-[1136px] flex-col items-center gap-[24px]">
        <div ref={washesRef} className="relative w-full">
          <WashesCanvas
            scrollRef={washesRef}
            dayPhase={dayPhase}
            weather={weather}
          />
          <PaintBrush targetRef={washesRef} />
        </div>
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
      </section>

      <div className="mx-auto mt-[120px] flex w-full max-w-[944px] justify-center">
        <FeaturedWork onCardClick={onCardClick} />
      </div>

      <div className="mx-auto mt-[120px] flex w-full max-w-[944px] justify-center">
        <Testimonial />
      </div>

      {/* Colophon strip — dark band per Figma node 4013:42567. */}
      <div className="bg-confetti-black mt-[120px] w-full">
        <div className="mx-auto flex w-full max-w-[944px] justify-center">
          <Colophon />
        </div>
      </div>

      <HorseTab />
    </div>
  );
}
