import "../../globals.css";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { animated, easings, useSpring, useTransition } from "@react-spring/web";

import Header from "../../components/Header.js";
import Colophon from "../../components/Colophon.js";
import Popover from "../../components/Popover.js";
import FadeDown from "../../components/anim/FadeDown.js";
import DomMarker from "../../components/DomMarker.js";
import Text from "../../components/Text.js";
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
import {
  SEAL_DEFAULT_BACKGROUND,
  SEAL_DEFAULT_FOREGROUND,
} from "../../components/RotatingSeal.js";
import type { SalutationColors, SealColors } from "../companies/companies.js";

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
  // Subset of slugs that get a rotating "Featured Project" seal over
  // their thumbnail. See CompanyConfig.featuredProjects.
  featuredProjectSlugs?: string[];
  // Seal text/disc colors for this company. See CompanyConfig.seal.
  // Undefined → RotatingSeal falls back to its defaults (Hansa Yellow).
  companySeal?: SealColors;
  // Per-company greeting override (CompanyConfig.salutation). When unset
  // the chip defaults to `Hey! {company}`.
  companySalutation?: string;
  // Greeting chip color override (CompanyConfig.salutation_colors). When
  // unset the chip uses the same defaults as the seal (Hansa Yellow bg +
  // confetti-black text).
  companySalutationColors?: SalutationColors;
  // Role label shown in the headline phrase ("a {roleLabel} with…").
  // Defaults to "Design Engineer" — the alternate "Product Designer"
  // flows from a /pd visit via app.tsx's role state.
  roleLabel?: string;
};

// Small page-local helper. Wraps an inline phrase (e.g. an italic span) so
// hovering or focusing it reveals an adjacent Popover. The popover floats
// just below+left of the phrase per the Figma hover states (nodes
// 2232:32188 and 4003:21284). A short close-delay lets the cursor cross the
// gap between the phrase and the popover without dismissing prematurely.
type HoverPopoverProps = {
  // The popover JSX to render in the portal. Each phrase can supply its
  // own custom popover layout (e.g. the Bailey popover renders a photo,
  // the Design Engineer popover uses the standard text Popover chrome).
  popover: ReactNode;
  children: ReactNode;
};

// Bailey popover — Figma node 4003:21309. Differs from the standard
// Popover chrome: narrower (228px), 12px padding, no body text, just a
// title + a photo of Bailey. Used by the "big golden retriever energy"
// hover affordance in the hero copy.
function BaileyPopover(): React.ReactElement {
  return (
    <div className="flex w-[228px] flex-col items-start gap-[10px] rounded-[8px] bg-white p-[12px]">
      <Text variant="headline-small-italic" className="text-black">
        My role model,
        <br aria-hidden />
        Bailey
      </Text>
      <div className="aspect-[500/438] w-full overflow-hidden rounded-[2.128px]">
        <img
          src="/images/bailey.png"
          alt="Bailey, a golden retriever"
          className="size-full object-cover"
        />
      </div>
    </div>
  );
}

// Small companion to HoverPopover. Drives the portal mount/unmount via
// useTransition (keyed on `open`, NOT on `coords`) so the popover fades
// + slides in and out smoothly, AND so cursor-tracked coords updates
// don't re-fire the spring on every pointermove.
function PopoverPortal({
  open,
  coords,
  children,
}: {
  open: boolean;
  coords: { bottom: number; left: number } | null;
  children: ReactNode;
}): React.ReactElement {
  const transitions = useTransition(open, {
    from: { opacity: 0, y: 6 },
    enter: { opacity: 1, y: 0 },
    leave: { opacity: 0, y: 6 },
    config: { duration: 240, easing: easings.easeOutCubic },
  });
  return (
    <>
      {transitions((style, isOpen) =>
        isOpen && coords
          ? createPortal(
              // Anchored at the bottom-left corner (coords from
              // updateCoords place that corner 8px above + 8px left of
              // the cursor). `pointer-events: none` so the cursor
              // moving over the popover itself doesn't pull focus away
              // from the phrase (popover is hint-only).
              <animated.div
                className="fixed z-50 pointer-events-none"
                style={{
                  bottom: coords.bottom,
                  left: coords.left,
                  opacity: style.opacity,
                  transform: style.y.to((v) => `translateY(${v}px)`),
                }}
              >
                {children}
              </animated.div>,
              document.body,
            )
          : null,
      )}
    </>
  );
}

function HoverPopover({
  popover,
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
  // through to the canvas for painting. Same gate applies while a
  // project overlay is open: the card has faded, the phrases are
  // invisible (and translated), so hovering over their would-be
  // positions shouldn't surface popovers.
  const paintActive = usePaintStore((s) => s.paintActive);
  const projectOpen = usePaintStore((s) => s.projectOpen);
  const hoverSuppressed = paintActive || projectOpen;

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

  // Position the popover so its bottom-LEFT corner sits 8px above and
  // 8px to the left of the cursor — popover extends up + right from
  // there. Coords update on every pointermove while open so the
  // popover tracks the cursor smoothly (no `translateX(-50%)` — we
  // anchor at the corner directly).
  const updateCoords = useCallback((clientX: number, clientY: number) => {
    setCoords({
      bottom: window.innerHeight - clientY + 8,
      left: clientX - 8,
    });
  }, []);

  const openAt = useCallback(
    (clientX: number, clientY: number) => {
      if (hoverSuppressed) return;
      cancelClose();
      updateCoords(clientX, clientY);
      setOpen(true);
    },
    [cancelClose, hoverSuppressed, updateCoords],
  );

  // Bare onFocus (no pointer event) — fall back to the wrapper's rect.
  const openFromFocus = useCallback(() => {
    if (hoverSuppressed) return;
    cancelClose();
    const el = wrapperRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      // Same anchor as cursor-positioned mode: bottom-left corner 8px
      // above + 8px left of the wrapper's top-left. (We don't have a
      // cursor position from a focus event so we use the wrapper rect.)
      setCoords({
        bottom: window.innerHeight - r.top + 8,
        left: r.left - 8,
      });
    }
    setOpen(true);
  }, [cancelClose, hoverSuppressed]);

  useEffect(() => {
    return () => {
      if (closeTimer.current != null) window.clearTimeout(closeTimer.current);
    };
  }, []);

  // Auto-close if paint mode starts OR a project overlay opens while
  // the popover is open.
  useEffect(() => {
    if (hoverSuppressed) setOpen(false);
  }, [hoverSuppressed]);

  return (
    // The wrapper stays inline (phrasing content) — only the popover is
    // portaled out to document.body so the hero <p> stays valid HTML. The
    // glass card body is `pointer-events: none`; `auto` here re-enables
    // the phrase + popover at rest. In paint mode or while the project
    // overlay is open the phrases are invisible, so we drop back to
    // `none` to let clicks fall through to the wash / overlay below.
    <span
      ref={wrapperRef}
      className="relative inline-block"
      style={{ pointerEvents: hoverSuppressed ? "none" : "auto" }}
      onMouseEnter={(e) => openAt(e.clientX, e.clientY)}
      onMouseMove={(e) => {
        if (open) updateCoords(e.clientX, e.clientY);
      }}
      onMouseLeave={scheduleClose}
      onFocus={openFromFocus}
      onBlur={scheduleClose}
    >
      {children}
      <PopoverPortal open={open} coords={coords}>
        {popover}
      </PopoverPortal>
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
  featuredProjectSlugs,
  companySeal,
  companySalutation,
  companySalutationColors,
  roleLabel = 'Designer and Engineer',
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
  const projectOpen = usePaintStore((s) => s.projectOpen);

  // Window scrollY for driving the sticky-header fade. The in-shell
  // Header scrolls out of view around scrollY ~80px, so we fade the
  // sticky header in over the 60–160 band — the in-shell Header is
  // just leaving as the sticky one finishes arriving.
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    let rafId = 0;
    const onScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        setScrollY(window.scrollY);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);
  const stickyHeaderOpacity = Math.min(
    1,
    Math.max(0, (scrollY - 60) / 100),
  );

  // Scroll to top when paint mode activates. If the intro is visible at
  // the top of the page, the existing glass-card spring fades it out;
  // if the visitor was scrolled down, this brings them back so the
  // wash canvas is in view ready to paint.
  const prevPaintActiveForScrollRef = useRef(paintActive);
  useEffect(() => {
    const wasActive = prevPaintActiveForScrollRef.current;
    prevPaintActiveForScrollRef.current = paintActive;
    if (paintActive && !wasActive) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [paintActive]);

  // Auto-exit paint mode when the visitor scrolls past the wash canvas.
  // Once the canvas region is entirely above the viewport, the paint
  // surface isn't reachable anymore — staying in paint mode would leave
  // the X-toggle visible in the sticky Header for a paint surface the
  // user can't see. Checks on every scroll tick (scrollY drives the
  // effect via the dep list).
  const setPaintActiveInStore = usePaintStore((s) => s.setPaintActive);
  useEffect(() => {
    if (!paintActive) return;
    const washesEl = washesRef.current;
    if (!washesEl) return;
    if (washesEl.getBoundingClientRect().bottom <= 0) {
      setPaintActiveInStore(false);
    }
  }, [scrollY, paintActive, setPaintActiveInStore]);

  // Project-overlay state — the click-project chain pre-arms this in the
  // store before route navigation so the glass card starts fading
  // Glass card fade/translate animates on paintActive — clicking a
  // project card no longer fades or slides the intro. The project sheet
  // slides up over the intro and covers it on its own; the intro stays
  // in place underneath, undisturbed.
  //
  // ONE exception: closing paint mode while a project is open. In
  // paint+project state, the project sheet is "off-screen" (slid down)
  // and the wash is exposed. When the user clicks X to close paint,
  // the sheet slides back UP over the intro. If the card un-fades
  // immediately, the user sees it un-fade through the rising sheet's
  // not-yet-covered area. So we delay the un-fade by ~650ms (sheet
  // animation = 600ms + small buffer) to wait until the sheet has
  // fully arrived. The card un-fade then happens beneath the sheet's
  // cover — invisible to the user, no visual conflict.
  const prevPaintActiveRef = useRef(paintActive);
  const [delayedShowCard, setDelayedShowCard] = useState(true);
  useEffect(() => {
    const wasInPaint = prevPaintActiveRef.current;
    prevPaintActiveRef.current = paintActive;
    if (!paintActive && projectOpen && wasInPaint) {
      setDelayedShowCard(false);
      const t = window.setTimeout(() => setDelayedShowCard(true), 650);
      return () => window.clearTimeout(t);
    }
    setDelayedShowCard(true);
  }, [paintActive, projectOpen]);

  const glassCardSpring = useSpring({
    opacity: paintActive || !delayedShowCard ? 0 : 1,
    y: paintActive ? 64 : 0,
    // Any card state change is instant while a project is open. Two
    // cases:
    //   • Paint toggled ON in project — card snaps to (opacity 0, y 64)
    //     instantly; the sheet is also sliding down to expose the wash,
    //     so a simultaneous smooth fade would read as a wobble.
    //   • Paint toggled OFF in project — the delayed un-fade timer
    //     (650ms, just past the sheet's 600ms slide-up) flips
    //     delayedShowCard back to true. With immediate=true the card
    //     snaps to (opacity 1, y 0) instead of smooth-animating, behind
    //     the now-fully-arrived sheet.
    immediate: projectOpen,
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
    <div className="font-body bg-washes-paper text-confetti-black relative flex w-full flex-col items-center overflow-hidden px-0 pt-0 pb-[40px] md:px-[72px] md:pt-[8px] md:pb-[80px]">
      {/* -------------------------------------------------------------------
          Sticky Header — fades in as the visitor scrolls past the wash
          shell's in-shell Header. Cream backdrop + bottom gradient mask
          so content scrolling under the bar reads as a soft fade rather
          than a hard edge. The in-shell Header (inside the wash shell
          below) stays in place — it's the source of truth at scrollY=0;
          this sticky copy takes over once the user scrolls. Both share
          the same paint store, so clicking either PaintToggle flips
          paintActive identically. `position: fixed` is used in place of
          `sticky` because the page root has `overflow-hidden` (required
          for the Colophon's negative-margin breakout below) which would
          otherwise neutralize a sticky element.
          ------------------------------------------------------------------- */}
      <div
        className="pointer-events-none fixed left-0 right-0 top-0 z-30"
        style={{
          opacity: stickyHeaderOpacity,
          pointerEvents: stickyHeaderOpacity > 0.5 ? "auto" : "none",
        }}
        aria-hidden={stickyHeaderOpacity < 0.5}
      >
        <div className="bg-washes-paper relative">
          <div className="mx-auto flex w-full max-w-[1104px] items-center justify-between px-[16px] py-[16px] md:px-0">
            <Header paintActive={paintActive} />
          </div>
          <div
            className="pointer-events-none absolute left-0 right-0 top-full h-[8px]"
            style={{
              background:
                "linear-gradient(to bottom, rgba(251, 246, 234, 0.5) 0%, rgba(251, 246, 234, 0) 100%)",
            }}
            aria-hidden
          />
        </div>
      </div>

      {/* -------------------------------------------------------------------
          Washes Shell — Figma node 4012:42332 "Header". The single rounded
          container that holds the Header (logo + nav), the Washes Canvas
          (top 66.93%), and the Intro glass card (overlaid at the bottom
          90.58%). The whole shell is 1136×584.169 with 12px rounded top
          corners; everything inside is absolutely positioned.
          ------------------------------------------------------------------- */}
      {/* wash-shell:start marker injected below — section opens here */}
      <section data-marker="wash-shell" className="relative w-full max-w-[1136px]" style={{ height: "660px" }}>
        {/* Washes Canvas region — Figma node 4002:21177. Takes the top
            66.93% of the shell (inset bottom = 33.07%). Owns the wash
            WebGL host, the Connecting Gradients overlays, the Header
            (Name + Links), and the PaintBrush overlay. The shell's
            overflow-hidden + rounded-tl/tr radii are applied here so the
            wash painting can't bleed outside. */}
        <div
          ref={washesRef}
          className="absolute left-0 right-0 top-0 overflow-hidden select-none md:rounded-tl-[12px] md:rounded-tr-[12px]"
          // OS crosshair cursor only when paint mode is active. Paint-mode
          // entry is handled by the tap-catcher overlay below (z-[5]), not
          // on this wrapper — putting an entry handler on the wrapper would
          // block the Header's PaintToggle even with pointer-events-auto on
          // the Header.
          style={{
            bottom: 0,
            cursor: paintActive ? "crosshair" : "default",
          }}
        >
          {/* No `scrollRef` — the outer wrapper IS the scroll target.
              PresetWidget + PaintBrush both reference `washesRef` (the
              outer div), so the WashesCanvas can stay agnostic. */}
          <WashesCanvas dayPhase={dayPhase} weather={weather} />

          {/* Tap catcher — the overlay the washesRef comment refers to.
              Previously documented ("enforced by the tap catcher overlay
              below (z-15)") but never actually mounted, so on desktop the
              only way into paint mode was the small brush toggle. At rest
              this is a full-region click target that enters paint mode;
              it sits at z-[5] — above the wash + gradients (all
              pointer-events-none) but BELOW the glass card (z-10), so
              clicking the card's footprint does NOT enter paint ("anywhere
              the wash isn't covered"), while the card's interactive
              children (HoverPopovers, dismiss) keep working. Disabled in
              paint mode so strokes pass straight to the canvas. */}
          <div
            onClick={() => setPaintActiveInStore(true)}
            className="absolute inset-0 z-[5] cursor-pointer"
            style={{ pointerEvents: paintActive ? "none" : "auto" }}
            aria-hidden="true"
          />

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
          className="absolute z-10 flex flex-col items-start overflow-clip rounded-tl-[12px] rounded-tr-[12px] rounded-bl-[12px] rounded-br-[12px] border-solid border-[#fbf6ea] px-[16px] pt-[24px] md:px-[160px] md:pt-[132px]"
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
            // At rest the card BLOCKS the tap catcher beneath it so clicking
            // the card's footprint does not enter paint mode — the user only
            // enters by clicking the exposed wash ("anywhere the wash isn't
            // covered") or the brush toggle. In paint mode the card has faded
            // out and goes pointer-transparent so strokes pass straight to
            // the canvas. (The old chicken-and-egg deadlock — where paint
            // could ONLY start by clicking through the card — is gone now
            // that entry is handled by the catcher + toggle, not by tapping
            // through the card.) The two HoverPopover children (Design
            // Engineer / golden retriever energy) and the dismiss link set
            // `pointer-events: auto` locally so they stay interactive.
            pointerEvents: paintActive ? "none" : "auto",
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
              <Text
                variant="eyebrow"
                className="text-confetti-black/60 mb-[16px] flex items-baseline gap-[8px]"
                style={{ pointerEvents: "auto" }}
              >
                {/* Greeting chip. Colors come from salutation_colors, and
                    otherwise default to the SAME colors as the seal (Hansa
                    Yellow bg + confetti-black text — see RotatingSeal).
                    Salutation text is CompanyConfig.salutation or the
                    default `Hey! {name}`. */}
                {(() => {
                  const salutationText =
                    companySalutation ?? `Hey! ${company}`;
                  const chipBg =
                    companySalutationColors?.background_color ??
                    SEAL_DEFAULT_BACKGROUND;
                  const chipFg =
                    companySalutationColors?.foreground_color ??
                    SEAL_DEFAULT_FOREGROUND;
                  return (
                    <span
                      className="shadow-md"
                      style={{
                        backgroundColor: chipBg,
                        color: chipFg,
                        padding: "4px 16px 3px",
                        borderRadius: "20px",
                        fontFamily: "sans-serif",
                        fontStyle: "normal",
                        position: "relative",
                        left: "-16px",
                        transform: "rotate(-2deg)",
                      }}
                    >
                      {salutationText}
                    </span>
                  );
                })()}
                {onDismiss ? (
                  <button
                    type="button"
                    onClick={onDismiss}
                    className="font-body decoration-from-font [text-underline-position:from-font] text-confetti-black/50 hover:text-confetti-black cursor-pointer text-[12px] not-italic underline decoration-dotted relative left-[-12px]"
                  >
                    dismiss
                  </button>
                ) : null}
              </Text>
            </FadeDown>
          ) : null}
          <FadeDown>
            <Text
              variant="headline"
              className="text-confetti-black w-full max-w-[784px] !text-[28px] !leading-[36px] md:!text-[48px] md:!leading-[60px]"
            >
              <span>
                {/* Drop the "Hey!" lead-in on company endpoints — the
                    branded "Hi {company}!" chip above already greets. */}
                {company ? "I’m C Stavridis, " : "Hey! I’m C Stavridis, "}
                <br aria-hidden className="hidden md:inline" />
                {"a "}
              </span>
              <HoverPopover
                popover={
                  <Popover title="Tools I like to build with">
                    React, TypeScript, Tailwind, vanilla HTML/CSS, p5, GSAP,
                    react-three-fiber, Figma.
                  </Popover>
                }
              >
                <Text
                  variant="headline-italic"
                  as="span"
                  className="decoration-from-font [text-underline-position:from-font] underline decoration-dotted !text-[28px] !leading-[36px] md:!text-[48px] md:!leading-[60px]"
                >
                  {roleLabel}
                </Text>
              </HoverPopover>
              <span>
                {" with"}
                <br aria-hidden className="hidden md:inline" />
              </span>
              <HoverPopover popover={<BaileyPopover />}>
                <Text
                  variant="headline-italic"
                  as="span"
                  className="decoration-from-font [text-underline-position:from-font] underline decoration-dotted !text-[28px] !leading-[36px] md:!text-[48px] md:!leading-[60px]"
                >
                  big golden retriever energy
                </Text>
              </HoverPopover>
              <span>.</span>
            </Text>
          </FadeDown>

          {blurb ? (
            // Per-company blurb override. Replaces the canonical
            // then/now two-column copy with a single tailored paragraph.
            // Width matches a single "then" column (385px) so the
            // copy stays comfortably readable rather than stretching
            // across both columns. See CompanyConfig.blurb.
            <FadeDown delay={120}>
              <div className="text-confetti-black mt-[24px] w-full max-w-[385px]">
                <Text variant="copy" className="mb-0">
                  {blurb}
                </Text>
              </div>
            </FadeDown>
          ) : (
            <FadeDown delay={120}>
              <div className="text-confetti-black mt-[24px] flex flex-col items-start gap-[16px] md:flex-row">
                <div className="w-full max-w-[385px]">
                  <Text variant="eyebrow" className="text-confetti-black/50 mb-0">
                    then
                  </Text>
                  <Text variant="copy" className="mb-0">
                    {"I love turning ambiguous, complex ideas into warm, approachable experiences. I co-founded CareSignal, "}
                    <br aria-hidden />
                    {"an enterprise digital health company (acquired "}
                    <br aria-hidden />
                    {"by Lightbeam), where I led Product and Brand."}
                  </Text>
                  <Text variant="copy" className="mb-0">&nbsp;</Text>
                  <Text variant="copy">
                    In 2024, I decided to step away to be with my young family. I
                    spent the time learning and building, too.
                  </Text>
                </div>
                <div className="w-full max-w-[385px]">
                  <Text variant="eyebrow" className="text-confetti-black/50 mb-0">
                    now
                  </Text>
                  <Text variant="copy" className="mb-0">
                    {"I’ve finished two batches at the Recurse Center,"}
                    <br aria-hidden />
                    {"built AI-native tooling, and I’m currently building"}
                    <br aria-hidden />
                    {"a design system for Poimandres, the open-source collective behind react-three-fiber and zustand."}
                  </Text>
                  <Text variant="copy" className="mb-0">&nbsp;</Text>
                  <Text variant="copy">
                    {"I am looking to join a dynamic team that values"}
                    <br aria-hidden />
                    {"high-craft design and engineering."}
                  </Text>
                </div>
              </div>
            </FadeDown>
          )}
        </animated.div>
      </section>

      {/* PresetWidget — paint-mode instance. Sits below the wash with
          24px margin top so it overlaps the wash bottom (Figma `Landing Page
          – Paint 01/02`). Always rendered (vs. conditional) with animated
          max-height + opacity so paint-mode entry doesn't jump Featured
          Work below. `overflow-hidden` clips the widget while collapsed.
          No `scrollTargetRef` — clicking a bug in paint mode should only
          reset the visualization. */}
      <DomMarker name="paint-mode-preset-widget">
        <animated.div
          className="mt-[24px] flex w-full max-w-[1136px] justify-center"
          style={{
            opacity: paintWidgetSpring.opacity,
            maxHeight: paintWidgetSpring.maxHeight,
            pointerEvents: paintActive ? "auto" : "none",
          }}
          aria-hidden={!paintActive}
        >
          <PresetWidget {...presetWidgetCommon} />
        </animated.div>
      </DomMarker>

      <DomMarker name="featured-work">
        <div className="mt-[60px] flex w-full max-w-[944px] justify-center">
          <FeaturedWork
            onCardClick={onCardClick}
            slugs={featuredSlugs}
            featuredProjectSlugs={featuredProjectSlugs}
            stampCompanyName={company}
            stampSeal={companySeal}
          />
        </div>
      </DomMarker>

      <DomMarker name="testimonial">
        <div className="mt-[120px] flex w-full max-w-[944px] justify-center">
          <Testimonial />
        </div>
      </DomMarker>

      <DomMarker name="resting-preset-widget">
        {/* PresetWidget — resting / in-flow instance. Sits 120px below the
            Testimonial so it lives in the page rhythm (no longer fixed to
            the viewport footer). Visible in both resting and paint modes
            so the user can always tweak the visualization preset, but
            fades back when paintActive (the paint-mode instance above the
            wash becomes the primary). `scrollTargetRef` is passed here
            only — clicking from this instance scrolls back up, opens paint
            mode, and resets the visualization. */}
        <div
          className="mt-[120px] flex w-full max-w-[1136px] justify-center transition-opacity duration-300 ease-out"
          style={{ opacity: paintActive ? 0 : 1 }}
        >
          <PresetWidget {...presetWidgetCommon} scrollTargetRef={washesRef} />
        </div>
      </DomMarker>

      <DomMarker name="colophon">
        {/* Colophon strip — dark band per Figma node 4013:42567. Breaks out
            of the 72px side gutter and the 80px bottom pad so the dark fill
            spans the page-card edges. Width is parent + 144px to cancel
            the px-[72px] on both sides; the parent `overflow-hidden`
            guards against any sub-pixel overflow. */}
        <div className="bg-confetti-black mt-[120px] -mb-[40px] w-full md:-mx-[72px] md:-mb-[80px] md:w-[calc(100%+144px)]">
          <div className="mx-auto flex w-full max-w-[944px] justify-center">
            <Colophon />
          </div>
        </div>
      </DomMarker>

      <DomMarker name="horse-tab">
        <HorseTab />
      </DomMarker>
    </div>
  );
}
