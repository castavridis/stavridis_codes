import "../../globals.css";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { animated, easings, useSpring, useTransition } from "@react-spring/web";

import Header from "../../components/Header.js";
import Colophon from "../../components/Colophon.js";
import Popover from "../../components/Popover.js";
import FadeDown from "../../components/anim/FadeDown.js";
import { FeaturedWork } from "./sections/featured-work.js";
import { HorseTab } from "./sections/horse-tab.js";
import { WashesCanvas } from "./sections/washes-canvas.js";
import { WashesInfo } from "./sections/washes-info.js";
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

// `onCardClick` is forwarded to FeaturedWork so a host wrapper can swap to a
// project view on click. Optional — the page works standalone. `paused`
// freezes the Washes canvas when a project overlay covers the page.
// `company`/`blurb` and `featuredSlugs` power the per-company landing pages
// at /for/:company.
type LandingPageProps = {
  onCardClick?: (id: string) => void;
  onCardHover?: (id: string) => void;
  paused?: boolean;
  transitioning?: boolean;
  company?: string;
  blurb?: string;
  onDismiss?: () => void;
  // Ordered list of FeaturedWork project slugs to surface for this
  // visitor — see CompanyConfig.featuredSlugs. Undefined renders the
  // canonical 4.
  featuredSlugs?: string[];
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

// Small companion to HoverPopover. Drives the portal mount/unmount via
// useTransition so the popover fades + slides in AND OUT — instant unmount
// is too abrupt for a hover affordance.
function PopoverPortal({
  open,
  coords,
  title,
  content,
}: {
  open: boolean;
  coords: { bottom: number; left: number } | null;
  title: string;
  content: ReactNode;
}): React.ReactElement {
  const transitions = useTransition(open && coords ? coords : null, {
    from: { opacity: 0, y: 6 },
    enter: { opacity: 1, y: 0 },
    leave: { opacity: 0, y: 6 },
    config: { duration: 240, easing: easings.easeOutCubic },
  });
  return (
    <>
      {transitions((style, c) =>
        c
          ? createPortal(
              // `translateX(-50%)` centers on the cursor. `pointer-events:
              // none` so the cursor moving over the popover itself doesn't
              // pull focus away from the phrase (popover is hint-only).
              <animated.div
                className="fixed z-50 pointer-events-none"
                style={{
                  bottom: c.bottom,
                  left: c.left,
                  opacity: style.opacity,
                  transform: style.y.to(
                    (v) => `translateX(-50%) translateY(${v}px)`,
                  ),
                }}
              >
                <Popover title={title}>{content}</Popover>
              </animated.div>,
              document.body,
            )
          : null,
      )}
    </>
  );
}

function HoverPopover({
  title,
  content,
  children,
}: HoverPopoverProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{
    bottom: number;
    left: number;
  } | null>(null);
  const wrapperRef = useRef<HTMLSpanElement | null>(null);
  const closeTimer = useRef<number | null>(null);
  // When paintActive flips true the glass card fades out + the underlying
  // italic phrases are no longer visible — disable hover/focus so the
  // popover doesn't open over the wash, and let pointer events pass
  // through to the canvas for painting.
  const paintActive = usePaintStore((s) => s.paintActive);

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

  // Position the popover 24px above the cursor; coords update on each
  // pointermove inside the wrapper so it tracks the cursor while open.
  // The portal renders into document.body with `bottom`-anchored fixed
  // positioning so it sits above the pointer rather than dropping below.
  const updateCoords = useCallback((clientX: number, clientY: number) => {
    setCoords({
      bottom: window.innerHeight - clientY + 24,
      left: clientX,
    });
  }, []);

  const openAt = useCallback(
    (clientX: number, clientY: number) => {
      if (paintActive) return;
      cancelClose();
      updateCoords(clientX, clientY);
      setOpen(true);
    },
    [cancelClose, paintActive, updateCoords],
  );

  // Bare onFocus (no pointer event) — fall back to the wrapper's rect.
  const openFromFocus = useCallback(() => {
    if (paintActive) return;
    cancelClose();
    const el = wrapperRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      setCoords({
        bottom: window.innerHeight - r.top + 24,
        left: r.left + r.width / 2,
      });
    }
    setOpen(true);
  }, [cancelClose, paintActive]);

  useEffect(() => {
    return () => {
      if (closeTimer.current != null) window.clearTimeout(closeTimer.current);
    };
  }, []);

  // Auto-close if paint mode starts while the popover is open.
  useEffect(() => {
    if (paintActive) setOpen(false);
  }, [paintActive]);

  return (
    // The wrapper stays inline (phrasing content) — only the popover is
    // portaled out to document.body so the hero <p> stays valid HTML. The
    // glass card body is `pointer-events: none`; `auto` here re-enables
    // the phrase + popover at rest. In paint mode the phrases are
    // invisible, so we drop back to `none` to let clicks fall through
    // to the wash.
    <span
      ref={wrapperRef}
      className="relative inline-block"
      style={{ pointerEvents: paintActive ? "none" : "auto" }}
      onMouseEnter={(e) => openAt(e.clientX, e.clientY)}
      onMouseMove={(e) => {
        if (open) updateCoords(e.clientX, e.clientY);
      }}
      onMouseLeave={scheduleClose}
      onFocus={openFromFocus}
      onBlur={scheduleClose}
    >
      {children}
      <PopoverPortal
        open={open}
        coords={coords}
        title={title}
        content={content}
      />
    </span>
  );
}

export default function LandingPage({
  onCardClick,
  onCardHover: _onCardHover,
  paused: _paused = false,
  transitioning: _transitioning = false,
  company,
  blurb,
  onDismiss,
  featuredSlugs,
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

  // Glass-card fade + shift on paint activation. Subscribes to
  // `paintActive` in the store — flips true on the user's first paint
  // stroke and stays true until a visualization reset.
  //
  // Figma reference: frames `Landing Page – Paint 00/01/02` (node ids
  // 4003:23338, 4008:30723, 4008:32853) show the Intro card removed
  // entirely so the wash takes the full shell. We mirror that with a
  // soft fade (opacity 1 → 0) + downward translate (~64px) so the card
  // slides out of the way rather than pop-disappearing. ~300ms with a
  // cubic-out feel (tension 220, friction 32) lands the card before
  // pointer-events are intercepted by the next stroke. After the card
  // is faded out we also drop its pointer-events so clicks land on the
  // wash beneath — without this you couldn't paint into the lower
  // ~33% of the shell.
  const paintActive = usePaintStore((s) => s.paintActive);
  const glassCardSpring = useSpring({
    opacity: paintActive ? 0 : 1,
    y: paintActive ? 64 : 0,
    config: { tension: 220, friction: 32 },
  });

  // Spring for the second PresetWidget instance that appears below the
  // Washes shell while painting (Figma `Landing Page – Paint 01/02`).
  // Fades in as paintActive flips true; the resting in-flow instance
  // below the Testimonial is unaffected. No translate — the resting
  // position is exactly 24px below the wash canvas at all times so the
  // widget appears in place rather than sliding.
  // `maxHeight` animates alongside opacity so the layout below (Featured
  // Work) doesn't jump when paintActive flips. 60px is a generous upper
  // bound on the desktop widget's natural height (~36px chip + padding).
  // Combined with `overflow-hidden` on the wrapper, the height grows
  // smoothly with the spring instead of popping in.
  const paintWidgetSpring = useSpring({
    opacity: paintActive ? 1 : 0,
    maxHeight: paintActive ? 60 : 0,
    config: { tension: 220, friction: 32 },
  });

  // Ref the PaintBrush uses to suppress the brush + "click to paint" ring
  // while the cursor is over the glass card body. Without this the ring
  // animation competes with the intro copy and pointer-events handoff was
  // ambiguous. See PaintBrush#excludeRef.
  const glassCardRef = useRef<HTMLDivElement | null>(null);

  // The PresetWidget is rendered in two slots:
  //   1. In-flow below the Testimonial (resting + paint state) — passes
  //      `scrollTargetRef={washesRef}` so a click scrolls back up to the
  //      canvas + resets the visualization.
  //   2. A second instance directly under the Washes shell that fades in
  //      with `paintActive` so the user has the location/time/weather
  //      controls within easy reach while painting (Figma `Landing Page –
  //      Paint 01/02`). NO `scrollTargetRef` is passed here — we're
  //      already at the canvas, so a click should reset the visualization
  //      without scrolling. Two instances rather than a portal so each
  //      can be driven by its own animated wrapper independently.
  const presetWidgetCommon = {
    location,
    slot,
    time,
    temp,
    weather,
    dayPhase,
    forecast,
    onLocation: cycleLocation,
    onTime: cycleSlot,
    onWeather: cycleWeather,
  } as const;

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
      <section className="relative w-full max-w-[1136px]" style={{ height: "calc(584.169px - 24px)" }}>
        {/* Washes Canvas region — Figma node 4002:21177. Takes the top
            66.93% of the shell (inset bottom = 33.07%). Owns the wash
            WebGL host, the Connecting Gradients overlays, the Header
            (Name + Links), and the PaintBrush overlay. The shell's
            overflow-hidden + rounded-tl/tr radii are applied here so the
            wash painting can't bleed outside. */}
        <div
          ref={washesRef}
          className="absolute left-0 right-0 top-0 overflow-hidden rounded-tl-[12px] rounded-tr-[12px] select-none"
          // OS crosshair cursor — PR 4c-paint-4. Replaces the custom
          // crosshair SVG previously rendered inside the PaintBrush. The
          // soft 10%-fill brush indicator (paint-brush.tsx) still tracks
          // the cursor for color preview; the OS crosshair gives the
          // exact pixel anchor.
          style={{ height: "530px", cursor: "crosshair" }}
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
              rounded shell corners.

              `paintActive` swaps the name + nav links for the paintbrush
              pigment swatches; Contact Me stays solid. */}
          <div className="absolute left-[16px] right-[16px] top-[16.17px] z-20 flex items-center justify-between">
            <Header paintActive={paintActive} />
          </div>

          {/* PaintBrush overlay — pointer events target the washesRef
              (this very container). The `glassCardRef` is forwarded so
              the brush can hide its ring while the pointer hovers over
              the resting glass card (per user feedback — the click-to-
              paint ring shouldn't compete with the intro card content). */}
          <PaintBrush targetRef={washesRef} excludeRef={glassCardRef} />

          {/* Washes info — Figma node 4008:32877 (Paintbrush Control at
              the bottom-left of the canvas region) + popover content
              from node 4014:43015. Visible in both resting and paint
              modes so the credits are always reachable. */}
          <WashesInfo />
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
        <animated.div
          ref={glassCardRef}
          className="absolute z-10 flex flex-col items-start overflow-clip rounded-tl-[12px] rounded-tr-[12px] rounded-bl-[12px] rounded-br-[12px] border-solid border-[#fbf6ea] px-[160px] pt-[132px]"
          style={{
            top: "9.42%",
            bottom: "0.2%",
            left: "1.41%",
            right: "1.41%",
            backdropFilter: "blur(1px)",
            WebkitBackdropFilter: "blur(1px)",
            borderWidth: "0.972px",
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.35) 60%, rgba(255,255,255,0) 100%)",
            opacity: glassCardSpring.opacity,
            transform: glassCardSpring.y.to((y) => `translateY(${y}px)`),
            // PR 4c-paint-2: the card is pointer-transparent at all times so
            // pointer-down events fall through to the wash region beneath.
            // The card previously toggled to `auto` until the first paint
            // stroke, but `paintActive` only flips AFTER the first stroke
            // lands — a chicken-and-egg deadlock that made it impossible to
            // start painting because the card swallowed every click in its
            // (~90%-of-canvas) footprint. The two HoverPopover children
            // (Design Engineer / golden retriever energy) opt back in with
            // `pointer-events: auto` locally so they still receive hover.
            pointerEvents: "none",
          }}
        >
          {company ? (
            <FadeDown>
              {/* Per-company greeting tag. Sits above the headline so the
                  visitor immediately sees the page was tailored. The
                  dismiss affordance (when wired via onDismiss) returns to
                  the canonical `/` landing — see app.tsx#handleDismiss
                  which also clears the persisted company context. The
                  position is provisional; final placement may need
                  Figma input. `pointer-events: auto` so the dismiss link
                  is clickable through the otherwise-transparent glass
                  card. */}
              <p
                className="font-kyoto text-confetti-black/60 mb-[16px] flex items-baseline gap-[8px] text-[16px] leading-[24px] font-medium italic"
                style={{ pointerEvents: "auto" }}
              >
                <span>Hi {company}!</span>
                {onDismiss ? (
                  <button
                    type="button"
                    onClick={onDismiss}
                    className="font-body decoration-from-font [text-underline-position:from-font] text-confetti-black/50 hover:text-confetti-black cursor-pointer text-[12px] not-italic underline decoration-dotted"
                  >
                    dismiss
                  </button>
                ) : null}
              </p>
            </FadeDown>
          ) : null}
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

          {blurb ? (
            // Per-company blurb override. Replaces the canonical
            // then/now two-column copy with a single tailored paragraph.
            // Width matches a single "then" column (385px) so the
            // copy stays comfortably readable rather than stretching
            // across both columns. See CompanyConfig.blurb.
            <FadeDown delay={120}>
              <div className="text-confetti-black mt-[24px] w-[385px] text-[16px] leading-[24px]">
                <p className="mb-0">{blurb}</p>
              </div>
            </FadeDown>
          ) : (
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
          )}
        </animated.div>
      </section>

      {/* PresetWidget — paint-mode instance. Sits below the wash with
          -24px margin so it overlaps the wash bottom (Figma `Landing Page
          – Paint 01/02`). Always rendered (vs. conditional) with animated
          max-height + opacity so paint-mode entry doesn't jump Featured
          Work below. `overflow-hidden` clips the widget while collapsed.
          No `scrollTargetRef` — clicking a bug in paint mode should only
          reset the visualization. */}
      <animated.div
        className="-mt-[24px] flex w-full max-w-[1136px] justify-center overflow-hidden"
        style={{
          opacity: paintWidgetSpring.opacity,
          maxHeight: paintWidgetSpring.maxHeight,
          pointerEvents: paintActive ? "auto" : "none",
        }}
        aria-hidden={!paintActive}
      >
        <PresetWidget {...presetWidgetCommon} />
      </animated.div>

      <div className="mt-[120px] flex w-full max-w-[944px] justify-center">
        <FeaturedWork onCardClick={onCardClick} slugs={featuredSlugs} />
      </div>

      <div className="mt-[120px] flex w-full max-w-[944px] justify-center">
        <Testimonial />
      </div>

      {/* PresetWidget — resting / in-flow instance. Sits 120px below the
          Testimonial so it lives in the page rhythm (no longer fixed to
          the viewport footer). Visible in both resting and paint modes
          so the user can always tweak the visualization preset.
          `scrollTargetRef` is passed here only — clicking from this
          instance scrolls back up to the canvas + resets. */}
      <div className="mt-[120px] flex w-full max-w-[1136px] justify-center">
        <PresetWidget {...presetWidgetCommon} scrollTargetRef={washesRef} />
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
