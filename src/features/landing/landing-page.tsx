import "../../globals.css";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { animated, easings, useSpring, useTransition } from "@react-spring/web";

import Header from "../../components/Header.js";
import Colophon from "../../components/Colophon.js";
import Popover from "../../components/Popover.js";
import HoverPopover from "../../components/HoverPopover.js";
import FloretteSeal from "../../components/FloretteSeal.js";
import Button from "../../components/Button.js";
import FadeDown from "../../components/anim/FadeDown.js";
import DomMarker from "../../components/DomMarker.js";
import Text from "../../components/Text.js";
import { FeaturedWork } from "./sections/featured-work.js";
import { Playground } from "./sections/playground.js";
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

// Slots around the intro headline where the FloretteSeal can land; one is
// picked at random per page load. Positions are relative to the headline
// wrapper and chosen to sit in empty space (above/beside the text, inside
// the glass card's padding) rather than over the copy. On phones the seal
// is in flow above the headline, so the slot only picks a side there
// (justify-*); the md: classes place it absolutely. Plus a small tilt so
// it reads "stuck on".
const FLORETTE_SLOTS: { className: string; tilt: number }[] = [
  // Above-left of the greeting
  { className: "justify-start md:top-[-104px] md:left-[-152px]", tilt: -8 },
  // Past the end of the first line
  { className: "justify-end md:top-[-80px] md:left-[580px]", tilt: 6 },
  // Right gutter, level with the role
  { className: "justify-end md:top-[48px] md:right-[-148px]", tilt: 10 },
  // Left gutter, level with the role
  { className: "justify-start md:top-[56px] md:left-[-152px]", tilt: -5 },
];

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
  // The active company's slug, used to show the /for/{slug} URL in the
  // dismiss-confirmation modal for the visitor to bookmark.
  companySlug?: string;
  blurb?: string;
  onDismiss?: () => void;
  // Ordered list of FeaturedWork project slugs to surface for this
  // visitor — see CompanyConfig.featuredSlugs. Undefined renders the
  // canonical 4.
  featuredSlugs?: string[];
  // One project to lead Featured Work as a full-width two-column hero card.
  // See CompanyConfig.heroSlug. Undefined → grid only.
  heroSlug?: string;
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
  // Role-specific résumé PDF the Header's Resume link opens. Resolved in
  // app.tsx from the active role (see role-context.ROLE_RESUME).
  resumeHref?: string;
};

export default function LandingPage({
  onCardClick,
  onCardHover: _onCardHover,
  paused = false,
  transitioning: _transitioning = false,
  company,
  companySlug,
  blurb,
  onDismiss,
  featuredSlugs,
  heroSlug,
  featuredProjectSlugs,
  companySeal,
  companySalutation,
  companySalutationColors,
  roleLabel = 'Designer and Engineer',
  resumeHref,
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

  // "Wag" the per-company greeting chip. `wagging` is transient: set true
  // to play the tail-wag keyframe, cleared on animationEnd so it can replay.
  // Triggered once after load (the wash flips washesVisible true after its
  // first frame, + a short beat) and again on each hover (onMouseEnter on
  // the chip). A ref guards the load trigger so a later preset reset (which
  // toggles washesVisible) doesn't re-fire it.
  const washesVisible = usePaintStore((s) => s.washesVisible);
  const [wagging, setWagging] = useState(false);
  // Random per load (lazy initializer, so it's stable across re-renders).
  const [floretteSlot] = useState(
    () => FLORETTE_SLOTS[Math.floor(Math.random() * FLORETTE_SLOTS.length)],
  );
  const loadWagFired = useRef(false);
  useEffect(() => {
    if (!washesVisible || loadWagFired.current) return;
    loadWagFired.current = true;
    const t = window.setTimeout(() => setWagging(true), 300);
    return () => window.clearTimeout(t);
  }, [washesVisible]);

  // Dismiss-confirmation modal. Clicking "dismiss" next to the company name
  // opens a Popover-styled confirm dialog rather than dropping the tailored
  // landing immediately. Fades in/out like the hover popovers.
  const [confirmDismiss, setConfirmDismiss] = useState(false);
  const dismissTransition = useTransition(confirmDismiss, {
    from: { opacity: 0, y: 8 },
    enter: { opacity: 1, y: 0 },
    leave: { opacity: 0, y: 8 },
    config: { duration: 200, easing: easings.easeOutCubic },
  });

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
            <Header paintActive={paintActive} resumeHref={resumeHref} />
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
      {/* Height: fixed 660px overlay on desktop; on mobile the section grows
          to fit the in-flow glass card (see below) so the intro copy is
          never clipped. */}
      <section data-marker="wash-shell" className="relative w-full max-w-[1136px] h-auto md:h-[660px]">
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
          <WashesCanvas dayPhase={dayPhase} weather={weather} paused={paused} />

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
            <Header paintActive={paintActive} resumeHref={resumeHref} />
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
          // On mobile the card is in-flow (relative, no clip) so the section
          // grows to fit it and the "now" copy isn't cut off. At md+ it
          // returns to the fixed overlay: absolute with percentage insets +
          // overflow-clip. Mobile pt clears the absolute in-shell Header.
          className="relative z-10 flex flex-col items-center md:items-start rounded-tl-[12px] rounded-tr-[12px] rounded-bl-[12px] rounded-br-[12px] border-solid border-[#fbf6ea] px-[56px] md:px-[16px] pt-[64px] pb-[24px] md:absolute top-[56px] md:top-[9.42%] md:bottom-[0.2%] md:left-[1.41%]  md:right-[1.41%] md:overflow-clip md:px-[160px] md:pt-[132px] md:pb-0"
          style={{
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
            // through the card.) The HoverPopover children (the Design
            // Engineer phrase / FloretteSeal) and the dismiss link set
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
                    companySalutation ?? `Hey, ${company}!`;
                  const chipBg =
                    companySalutationColors?.background_color ??
                    SEAL_DEFAULT_BACKGROUND;
                  const chipFg =
                    companySalutationColors?.foreground_color ??
                    SEAL_DEFAULT_FOREGROUND;
                  return (
                    <span
                      className={`shadow-sm ${wagging ? "motion-safe:[animation:chip-wag_800ms_ease-in-out]" : ""}`}
                      // Wag on hover too; cleared on animationEnd so the next
                      // hover (or the load trigger) can replay it.
                      onMouseEnter={() => setWagging(true)}
                      onAnimationEnd={() => setWagging(false)}
                      style={{
                        backgroundColor: chipBg,
                        color: chipFg,
                        padding: "4px 16px 3px",
                        borderRadius: "20px",
                        fontFamily: "sans-serif",
                        fontStyle: "normal",
                        position: "relative",
                        left: "-12px",
                        // Pivot from the left so the wag swings the chip's
                        // free end like a tail.
                        transformOrigin: "right center",
                      }}
                    >
                      {salutationText}
                    </span>
                  );
                })()}
                {onDismiss ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDismiss(true)}
                    className="font-body decoration-from-font [text-underline-position:from-font] text-confetti-black/50 hover:text-confetti-black cursor-pointer text-[12px] not-italic underline decoration-dotted relative left-[-12px]"
                  >
                    remove
                  </button>
                ) : null}
              </Text>
            </FadeDown>
          ) : null}
          <div className="relative w-full max-w-[784px]">
          {/* Florette seal — dropped at a random slot around the intro on
              each load (see FLORETTE_SLOTS). Its hover opens the Bailey
              popover the old "big Golden Retriever energy" phrase used.
              Phones: in flow above the headline (there's no free space
              around it there). md+: absolutely positioned. The positioning
              lives OUTSIDE FadeDown — its transform would otherwise become
              the containing block. */}
          <div
            className={`relative z-10 mb-[8px] flex md:absolute md:mb-0 md:block ${floretteSlot.className}`}
          >
            <FadeDown delay={240}>
              <span className="inline-block" style={{ transform: `rotate(${floretteSlot.tilt}deg)` }}>
                <span className="md:hidden">
                  <FloretteSeal size={104} />
                </span>
                <span className="hidden md:inline">
                  <FloretteSeal size={136} />
                </span>
              </span>
            </FadeDown>
          </div>
          <FadeDown>
            <Text
              variant="headline"
              className="text-confetti-black w-full max-w-[784px] !text-[28px] !leading-[36px] md:!text-[48px] md:!leading-[60px] text-center md:text-left"
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
                  <Popover
                    title="Tools I like to build with"
                    // Narrower on mobile (matches the golden-retriever
                    // popover's footprint) so it anchors with a right-margin
                    // instead of the 368px box being clamped to the edge.
                    className="!w-[280px] md:!w-[368px]"
                  >
                    Figma, Claude Code, Ghostty, Helix, React, TypeScript, Tailwind CSS, vanilla HTML/CSS, p5, GSAP,
                    react-three-fiber, Vercel, Supabase.
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
                {/* Leading space matters on mobile, where the <br> is
                    hidden — without it the role runs into "designing". */}
                {" "}
                <br aria-hidden className="hidden md:inline" />
                designing healthcare products that help care teams deliver better care at scale.
              </span>
            </Text>
          </FadeDown>
          </div>

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
                    I’ve turned complex, high-stakes systems into warm, approachable products. I co-founded
                    CareSignal, a Best in KLAS remote patient monitoring company (acquired by Lightbeam), where I
                    designed the tools that transformed care delivery and patient outcomes.
                  </Text>
                  <Text variant="copy" className="mb-0">&nbsp;</Text>
                  <Text variant="copy">
                    In 2024, I stepped away to be with my young family, but kept learning and building.
                  </Text>
                </div>
                <div className="w-full max-w-[385px]">
                  <Text variant="eyebrow" className="text-confetti-black/50 mb-0">
                    now
                  </Text>
                  <Text variant="copy" className="mb-0">
                    I’m returning to design craft through product design and design-engineering: building AI-native design tools and exploring shader-based
                    design systems, after two batches at the Recurse Center.
                  </Text>
                  <Text variant="copy" className="mb-0">&nbsp;</Text>
                  <Text variant="copy">
                    I’m looking for a team that cares about craft in both design and code, where I can take hard
                    problems from zero to shipped.
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
            heroSlug={heroSlug}
            featuredProjectSlugs={featuredProjectSlugs}
            stampCompanyName={company}
            stampSeal={companySeal}
          />
        </div>
      </DomMarker>

      <DomMarker name="testimonial">
        <div className="mt-[72px] flex w-full max-w-[944px] justify-center">
          <Testimonial />
        </div>
      </DomMarker>

      <DomMarker name="playground">
        <div className="mt-[72px] flex w-full max-w-[944px] justify-center">
          <Playground />
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

      {/* Dismiss-confirmation modal — Popover-styled confirm dialog,
          portaled to <body> and centered over a scrim. */}
      {dismissTransition((style, open) =>
        open
          ? createPortal(
              <animated.div
                className="fixed inset-0 z-[60] flex items-center justify-center p-[16px]"
                style={{ opacity: style.opacity }}
              >
                <div
                  className="bg-confetti-black/30 absolute inset-0"
                  onClick={() => setConfirmDismiss(false)}
                  aria-hidden
                />
                <animated.div
                  role="dialog"
                  aria-modal="true"
                  aria-label="Remove tailored landing"
                  className="relative w-full max-w-[368px]"
                  style={{ transform: style.y.to((v) => `translateY(${v}px)`) }}
                >
                  <Popover
                    title="Are you sure?"
                    className="!w-full"
                    onClose={() => setConfirmDismiss(false)}
                  >
                    <p className="mb-0">
                      This site has been customized for {company}. It highlights the projects I think are most relevant to your organization. { resumeHref && <>It also includes a résumé tailored to you all.</> }
                      <br /><br />
                      Removing customizations will take you back to my standard portfolio. You can return to this customized site anytime at:
                    </p>
                    {companySlug ? (
                      <a
                        href={`/for/${companySlug}`}
                        className="text-confetti-black mt-[12px] inline-block break-all rounded-[6px] bg-confetti-black/5 px-[10px] py-[8px] font-mono text-[12px] underline decoration-dotted"
                      >
                        {`${typeof window !== "undefined" ? window.location.origin : ""}/for/${companySlug}`}
                      </a>
                    ) : null}
                    <div className="mt-[16px] flex items-center gap-[8px]">
                      <Button
                        variant="default"
                        label="Keep Customizations"
                        onClick={() => setConfirmDismiss(false)}
                      />
                      <Button
                        variant="outline"
                        label="Remove"
                        onClick={() => {
                          setConfirmDismiss(false);
                          onDismiss?.();
                        }}
                      />
                    </div>
                  </Popover>
                </animated.div>
              </animated.div>,
              document.body,
            )
          : null,
      )}
    </div>
  );
}
