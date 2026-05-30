// ---------------------------------------------------------------------------
// Hero (watercolor band + intro + cards) and the preset widget below it.
// They share a single component so the preset widget can drive the hero's
// live Washes canvas.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import { animated, useSpring, useSprings } from "@react-spring/web";
import type { PigmentOption, WashesInstance } from "../../../../lib/washes/washes.js";
import { Washes } from "../../../../lib/washes/washes.js";
import { initGpuSim } from "../../../../lib/washes/washes-gpu-sim.js";

import { CREAM, DARK, hexToRgb } from "../lib/colors.js";
import { PIGMENTS, PIGMENT_ORDER, type PigmentKey } from "../lib/pigments.js";
import {
  buildForecast,
  dayPhaseFor,
  DAY_PHASE_BACKGROUND,
  DAY_PHASE_PAPER,
  fallbackForecast,
  FALLBACK_SUN,
  formatClock,
  isoToMinutes,
  localMinutes,
  LOCATIONS,
  weatherFromCode,
  WEATHER_ORDER,
  WEATHER_PRESETS,
  type DayPhase,
  type LocationInfo,
  type PhaseForecast,
  type SunTimes,
  type WeatherKey,
} from "../lib/weather.js";
import { PigmentSelector } from "./pigment-selector.js";
import { BrushIndicator } from "./brush-indicator.js";
import { PresetWidget } from "./preset-widget.js";
import {
  HeroProjectCardButton,
  type HeroProject,
} from "./hero-project-card.js";
import { HERO_PROJECTS, MOBILE_HERO_PROJECTS } from "./hero-projects.data.js";
import {
  CARD_TRANSITION_PRESETS,
  ANIM_STORAGE_KEY,
  DEFAULT_PRESET_ID,
} from "./card-transition-presets.js";
import { AnimationSelector } from "./AnimationSelector.js";

const BRUSH_MIN = 16;
const BRUSH_MAX = 240;
const BRUSH_STEP = 8;
const BRUSH_DEFAULT = 160;

export function Hero({ onCardClick, onCardHover, paused = false, transitioning = false, company, blurb, onDismiss, heroProjects }: { onCardClick?: (id: string) => void; onCardHover?: (id: string) => void; paused?: boolean; transitioning?: boolean; company?: string; blurb?: string; onDismiss?: () => void; heroProjects?: HeroProject[] }): React.ReactElement {
  const activeHeroProjects = heroProjects ?? HERO_PROJECTS;
  const activeMobileHeroProjects = heroProjects
    ? [heroProjects[1] ?? heroProjects[0], heroProjects[0], heroProjects[2] ?? heroProjects[1] ?? heroProjects[0]]
    : MOBILE_HERO_PROJECTS;
  const heroCanvasRef = useRef<HTMLDivElement | null>(null);
  const heroWashRef = useRef<WashesInstance | null>(null);

  const [activePigment, setActivePigment] = useState<PigmentKey>("rose");
  const [locationIdx, setLocationIdx] = useState(0);
  const [weather, setWeather] = useState<WeatherKey>("sunny");
  const [temp, setTemp] = useState(72);
  // The sunrise / mid-day / sunset forecast for the next 24h (Open-Meteo).
  const [forecast, setForecast] = useState<PhaseForecast[]>(() =>
    fallbackForecast(LOCATIONS[0]),
  );
  // Which time the widget shows: 0 = now, 1..3 = forecast[sunrise|day|sunset].
  const [slot, setSlot] = useState(0);
  // The clock shows the *selected location's* local time. `tzOffsetSec` is the
  // location's UTC offset (from Open-Meteo); null until the first fetch lands,
  // in which case we fall back to the viewer's own local time.
  const [tzOffsetSec, setTzOffsetSec] = useState<number | null>(null);
  const [time, setTime] = useState(() => formatClock(null));
  // Sunrise/sunset for the selected location and the resulting day phase, which
  // selects the background visualization.
  const [sun, setSun] = useState<SunTimes>(FALLBACK_SUN);
  // The day phase that drives the background. `autoPhase` tracks the clock;
  // cycling the time selector sets `phaseOverride` (null = follow the clock).
  const [autoPhase, setAutoPhase] = useState<DayPhase>("day");
  const [phaseOverride, setPhaseOverride] = useState<DayPhase | null>(null);
  const dayPhase = phaseOverride ?? autoPhase;

  // Refs so initialize() can read current state without being in its dep array.
  const dayPhaseRef = useRef<DayPhase>(dayPhase);
  dayPhaseRef.current = dayPhase;
  const weatherRef = useRef<WeatherKey>(weather);
  weatherRef.current = weather;
  const locationIdxRef = useRef(locationIdx);
  locationIdxRef.current = locationIdx;

  // Annotation (Brush Indicator): follows the mouse; `[` / `]` adjust the
  // brush size; the indicator scales with the brush and recolors to the
  // active pigment.
  const [brushSize, setBrushSize] = useState(BRUSH_DEFAULT);
  const [brushCursor, setBrushCursor] = useState<{
    x: number;
    y: number;
    visible: boolean;
  }>({
    x: 1093 + 32,
    y: 37 + 32,
    visible: false,
  });

  const [canvasKey, setCanvasKey] = useState(0);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  const [scrollPaused, setScrollPaused] = useState(false);
  const canvasThresholdRef = useRef<number>(240);

  const location = LOCATIONS[locationIdx];

  // Annotation (Weather + Time selectors): "Use Open Meteo API to pull in
  // data." We fetch the current temperature + weather code (→ "now" line +
  // animation), the timezone offset (→ clock), today's sunrise/sunset (→ day
  // phase + forecast times), and hourly temperature/weather (→ the 24h
  // sunrise/mid-day/sunset forecast). Falls back to defaults if offline.
  const refreshWeather = useCallback(async (loc: LocationInfo) => {
    try {
      // `timezone=auto` resolves the location's timezone (DST-correct offset +
      // local sunrise/sunset); `hourly` + `forecast_days=2` cover the next 24h.
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

  // Bootstrap the hero wash. Annotation (Visualization Evolution) pins the
  // Washes.js settings: paint load 0.15, water load 8.0, evaporation 4.0,
  // resolution (scale) 1.75, closed-gravity edges pulling down, fading
  // painting with a 4s half-life. The background/animation are seeded by the
  // day-phase effect once the first Open-Meteo lookup lands.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const host = heroCanvasRef.current;
    if (!host) return;
    // Clear any leftover canvas from a previous init (breakpoint reload).
    host.replaceChildren();

    let wash: WashesInstance | null = null;
    let ro: ResizeObserver | null = null;

    const initialize = () => {
      wash = Washes.create(host, {
        cursorPreview: false,
        pointer: true,
        scale: 1.5,
      });
      heroWashRef.current = wash;
      (window as unknown as Record<string, WashesInstance>).Wash_hero = wash;

      if (wash.webglAvailable()) {
        wash.webgl(true);
        wash.webglSmokeTest(false);
      }

      // Enable GPU simulation if WebGL2 context is available
      const gpuCtx = wash.gpuSimContext();
      if (gpuCtx) {
        try {
          const handle = initGpuSim(gpuCtx.gl, gpuCtx.GW, gpuCtx.GH);
          wash.gpuSim(handle);
          wash.gpuSimBrushOnlyTest(false);
          wash.gpuSimTransferOnlyTest(false);
          wash.gpuSimWetDiffusionOnlyTest(false);
          wash.gpuSimVelocityOnlyTest(false);
          wash.gpuSimAdvectionOnlyTest(false);
          wash.webglGpuTextureTest(false);
          wash.webglGpuWetTextureTest(false);
          wash.webglGpuVelocityTextureTest(false);
        } catch (e) {
          console.warn("GPU sim init failed, falling back to CPU:", e);
        }
      }
      // Apply the current day phase / weather immediately so the canvas never
      // flashes CREAM on reinit (ResizeObserver or breakpoint canvasKey bump).
      const initPhase = dayPhaseRef.current;
      const initWeather = weatherRef.current;
      const initPaper = DAY_PHASE_PAPER[initPhase];
      const initRgb = hexToRgb(initPaper);
      wash.paperColor(initRgb.r / 255, initRgb.g / 255, initRgb.b / 255);
      wash.gouacheMode("auto");
      wash.paperWetness("damp");
      wash.paintLoad(0.25);
      wash.waterLoad(8.0);
      wash.evaporation(2.5);
      wash.brushSize(BRUSH_DEFAULT);
      wash.edgeMode("gravity");
      wash.gravityDirection("down");
      wash.gravityStrength(0.1);
      // wash.edgeFade(24);
      wash.fadeHalfLife(10000);
      wash.fadePainting(0.05);
      wash.pigment("rose" as PigmentOption);
      // Enable continuous flow on touch devices so a drag produces a smooth
      // stroke rather than scattered stamps (pointer events are sparse on mobile).
      const isTouch = window.matchMedia("(pointer: coarse)").matches;
      wash.continuousFlow(isTouch);
      wash.keepSimulating(true);
      wash.setBackground(DAY_PHASE_BACKGROUND[initPhase]);
      wash.setAnimation(WEATHER_PRESETS[initWeather].animation);

      const canvasEl = (wash as unknown as { canvas: HTMLCanvasElement }).canvas;
      if (canvasEl) {
        canvasEl.style.cursor = "crosshair";
        canvasEl.style.backgroundColor = initPaper;
        // iOS Safari fires pointercancel and hands the gesture to the scroll
        // container before touch-action:none takes effect on the canvas itself.
        // A non-passive touchstart calling preventDefault() pre-empts this.
        canvasEl.addEventListener("touchstart", (e) => e.preventDefault(), {
          passive: false,
        });
      }

      // Refresh weather for whichever location is currently selected.
      void refreshWeather(LOCATIONS[locationIdxRef.current]);
    };

    // Defer initialization until the host's parent container has a non-zero
    // width, so Washes receives correct canvas dimensions from the start.
    const parent = host.parentElement;
    if ((parent?.getBoundingClientRect().width ?? 0) > 0) {
      initialize();
    } else {
      ro = new ResizeObserver(() => {
        if ((parent?.getBoundingClientRect().width ?? 0) > 0) {
          ro?.disconnect();
          ro = null;
          initialize();
        }
      });
      if (parent) ro.observe(parent);
    }

    return () => {
      ro?.disconnect();
      if (wash) {
        try {
          wash.destroy();
        } catch {
          /* ignore */
        }
      }
      heroWashRef.current = null;
      delete (window as unknown as Record<string, WashesInstance | undefined>)
        .Wash_hero;
    };
  // canvasKey increments on breakpoint crossing to force a full reinit.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshWeather, canvasKey]);

  // Pause / resume the Washes canvas when the project overlay covers the page
  // or when the canvas has scrolled fully out of view on mobile.
  useEffect(() => {
    const wash = heroWashRef.current;
    if (!wash) return;
    const effectivePaused = paused || scrollPaused;
    if (effectivePaused && !wash.paused()) {
      wash.pause({ acceptInput: false });
    } else if (!effectivePaused && wash.paused()) {
      wash.resume();
    }
  }, [paused, scrollPaused]);

  // Keep the live clock + day phase in sync with the location's local time.
  useEffect(() => {
    const update = () => {
      setTime(formatClock(tzOffsetSec));
      setAutoPhase(dayPhaseFor(localMinutes(tzOffsetSec), sun));
    };
    update();
    const id = window.setInterval(update, 30_000);
    return () => window.clearInterval(id);
  }, [tzOffsetSec, sun]);

  // Re-apply pigment whenever it changes (selector, or a card hand-off).
  useEffect(() => {
    heroWashRef.current?.pigment(activePigment as PigmentOption);
  }, [activePigment]);

  // Drive the visualization: the day phase picks the background time-wash and
  // the paper/canvas tint; the weather picks the atmospheric animation.
  useEffect(() => {
    const wash = heroWashRef.current;
    if (!wash) return;
    wash.setBackground(DAY_PHASE_BACKGROUND[dayPhase]);
    wash.setAnimation(WEATHER_PRESETS[weather].animation);
    const paper = DAY_PHASE_PAPER[dayPhase];
    const { r, g, b } = hexToRgb(paper);
    wash.paperColor(r / 255, g / 255, b / 255);
    const canvasEl = (wash as unknown as { canvas: HTMLCanvasElement }).canvas;
    if (canvasEl) canvasEl.style.backgroundColor = paper;
  }, [dayPhase, weather]);

  // Brush size ↔ Washes sync. The visible indicator reads the same value.
  useEffect(() => {
    heroWashRef.current?.brushSize(brushSize);
  }, [brushSize]);

  // Mouse-follow + `[` / `]` resize. Pointermove is bound to the window
  // because the canvas captures pointer events while painting.
  useEffect(() => {
    const host = heroCanvasRef.current;
    if (!host) return;
    let rafId = 0;
    let pending: PointerEvent | null = null;

    const handle = () => {
      rafId = 0;
      if (!pending) return;
      const e = pending;
      pending = null;
      const rect = host.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const inside = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;
      setBrushCursor({ x: x - 36, y, visible: inside });
    };
    const onMove = (e: PointerEvent) => {
      pending = e;
      if (!rafId) rafId = window.requestAnimationFrame(handle);
    };
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (e.key === "[") {
        e.preventDefault();
        setBrushSize((s) => Math.max(BRUSH_MIN, s - BRUSH_STEP));
      } else if (e.key === "]") {
        e.preventDefault();
        setBrushSize((s) => Math.min(BRUSH_MAX, s + BRUSH_STEP));
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("keydown", onKey);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  // Speed up the Washes fade decay so current pigment melts to paper color,
  // then fire `then()` and restore the normal slow half-life. This replaces
  // the old CSS opacity blink with a visible in-canvas wipe.
  const wipeCanvas = useCallback((then: () => void) => {
    const wash = heroWashRef.current;
    if (!wash) { then(); return; }
    wash.fadeHalfLife(200);
    window.setTimeout(() => {
      wash.fadeHalfLife(10000);
      then();
    }, 750);
  }, []);

  // Annotation (Location selector): clicking resets the canvas. Wipes current
  // pigment to paper color via a fast fade, then swaps to the new location.
  // The new location's Open-Meteo lookup updates the timezone, weather, and
  // sunrise/sunset, which re-seed the visualization via the effects above.
  const cycleLocation = useCallback(() => {
    const nextIdx = (locationIdx + 1) % LOCATIONS.length;
    wipeCanvas(() => {
      setLocationIdx(nextIdx);
      void refreshWeather(LOCATIONS[nextIdx]);
      // Reset to the "now" slot (live phase) for the new location.
      setSlot(0);
      setPhaseOverride(null);
    });
  }, [locationIdx, refreshWeather, wipeCanvas]);

  const cycleWeather = useCallback(() => {
    const nextWeather =
      WEATHER_ORDER[(WEATHER_ORDER.indexOf(weather) + 1) % WEATHER_ORDER.length];
    wipeCanvas(() => {
      const wash = heroWashRef.current;
      if (wash) {
        wash.setBackground(DAY_PHASE_BACKGROUND[dayPhase]);
        wash.setAnimation(WEATHER_PRESETS[nextWeather].animation);
      }
      setWeather(nextWeather);
    });
  }, [weather, dayPhase, wipeCanvas]);

  // Cycle the displayed time slot (now → sunrise → mid-day → sunset) and point
  // the background visualization at the selected slot's phase (now = live).
  const cycleSlot = useCallback(() => {
    const next = (slot + 1) % (forecast.length + 1);
    const newOverride = next === 0 ? null : forecast[next - 1].phase;
    const effectivePhase = newOverride ?? autoPhase;
    wipeCanvas(() => {
      const wash = heroWashRef.current;
      if (wash) {
        wash.setBackground(DAY_PHASE_BACKGROUND[effectivePhase]);
        const paper = DAY_PHASE_PAPER[effectivePhase];
        const { r, g, b } = hexToRgb(paper);
        wash.paperColor(r / 255, g / 255, b / 255);
        const canvasEl = (wash as unknown as { canvas: HTMLCanvasElement }).canvas;
        if (canvasEl) canvasEl.style.backgroundColor = paper;
      }
      setSlot(next);
      setPhaseOverride(newOverride);
    });
  }, [slot, forecast, autoPhase, wipeCanvas]);

  const cyclePigment = useCallback(() => {
    setActivePigment(
      (prev) =>
        PIGMENT_ORDER[(PIGMENT_ORDER.indexOf(prev) + 1) % PIGMENT_ORDER.length],
    );
  }, []);

  // Annotation (Project cards): the brush/palette/pigment selector update to
  // the project's hue. The deluge happens on the card's own canvas (see
  // HeroProjectCard); here we just hand the pigment off and notify the host
  // wrapper, which runs the page transition for whichever card links out.
  const handleCardClick = useCallback(
    (project: HeroProject) => {
      setActivePigment(project.pigment);
      onCardClick?.(project.id);
    },
    [onCardClick],
  );

  const handleCardActivate = useCallback(
    (project: HeroProject) => {
      setActivePigment(project.pigment);
      onCardHover?.(project.id);
    },
    [onCardHover],
  );

  const [drawMode, setDrawMode] = useState(false);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const centerCardRef = useRef<HTMLDivElement>(null);
  // Exit draw mode and reload the canvas whenever the md breakpoint is crossed.
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      if (!e.matches) setDrawMode(false);
      setCanvasKey((k) => k + 1);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Scroll the mobile strip so Project 01 (center slot) is centered on mount.
  useEffect(() => {
    const container = mobileScrollRef.current;
    const card = centerCardRef.current;
    if (!container || !card) return;
    container.scrollLeft = card.offsetLeft - (container.offsetWidth - card.offsetWidth) / 2;
  }, []);

  useEffect(() => {
    const container = mobileScrollRef.current;
    if (!container) return;
    const updatePigment = () => {
      const containerCenter = container.scrollLeft + container.offsetWidth / 2;
      const cards = Array.from(container.querySelectorAll<HTMLElement>('.snap-center'));
      let closestIdx = 0;
      let minDist = Infinity;
      cards.forEach((card, i) => {
        const dist = Math.abs(card.offsetLeft + card.offsetWidth / 2 - containerCenter);
        if (dist < minDist) { minDist = dist; closestIdx = i; }
      });
      const project = MOBILE_HERO_PROJECTS[closestIdx];
      if (project) setActivePigment(project.pigment);
    };
    container.addEventListener('scrollend', updatePigment);
    return () => container.removeEventListener('scrollend', updatePigment);
  }, []);

  // Pause the canvas when it has scrolled fully out of the viewport on mobile;
  // resume when it's visible again. Re-runs when draw mode or transitioning
  // changes so the threshold updates immediately and the pause state is re-checked.
  useEffect(() => {
    if (!isMobile) {
      setScrollPaused(false);
      return;
    }
    canvasThresholdRef.current = (drawMode || transitioning) ? window.innerHeight : 240;
    setScrollPaused(window.scrollY >= canvasThresholdRef.current);

    const onScroll = () => {
      setScrollPaused(window.scrollY >= canvasThresholdRef.current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isMobile, drawMode, transitioning]);

  const activeColor = PIGMENTS[activePigment].color;

  const canvasHeightSpring = useSpring({
    height: (drawMode || transitioning) && isMobile ? window.innerHeight : isMobile ? (company ? 312 : 240) : 560,
    config: { tension: 200, friction: 28 },
  });

  const paintButtonSpring = useSpring({
    opacity: transitioning ? 0 : 1,
    config: { tension: 200, friction: 28 },
  });

  const introSpring = useSpring({
    opacity: transitioning || drawMode ? 0 : 1,
    config: { tension: 280, friction: 30 },
  });
  const cardsSpring = useSpring({
    opacity: transitioning || drawMode ? 0 : 1,
    transform: drawMode
      ? 'translateY(120vh)'
      : transitioning ? 'translateY(60px)' : 'translateY(0px)',
    config: { tension: 200, friction: 28 },
  });
  const gradientsSpring = useSpring({
    opacity: drawMode ? 0 : 1,
    config: { tension: 200, friction: 28 },
  });

  // ---------------------------------------------------------------------------
  // Per-card springs for animated reorder when heroProjects changes.
  // Springs are keyed by HERO_PROJECTS order (stable IDs), not by slot.
  // ---------------------------------------------------------------------------
  const [selectedPresetId, setSelectedPresetId] = useState(
    () => localStorage.getItem(ANIM_STORAGE_KEY) ?? DEFAULT_PRESET_ID,
  );
  const preset = CARD_TRANSITION_PRESETS[selectedPresetId] ?? CARD_TRANSITION_PRESETS[DEFAULT_PRESET_ID];

  // Displayed projects for watercolor-dissolve: updated after blur-out settles.
  const [displayedProjects, setDisplayedProjects] = useState(activeHeroProjects);

  const topOffset = company ? 32 : 0;

  // Stable lookup: position + rotation for a card at its current slot.
  const activePosOf = (id: string) => {
    const proj = activeHeroProjects.find((p) => p.id === id) ?? HERO_PROJECTS.find((p) => p.id === id)!;
    return { left: proj.left, top: proj.top + topOffset, rotateZ: proj.rotation };
  };

  // Initialize springs at the correct positions for the current company state.
  const [cardSprings, cardApi] = useSprings(HERO_PROJECTS.length, (i) => {
    const { left, top, rotateZ } = activePosOf(HERO_PROJECTS[i].id);
    return { left, top, rotateZ, opacity: 1, scale: 1, blurPx: 0 };
  });

  // Track previous (left, top, rotateZ) per card ID so FLIP/Arc know where to start from.
  type CardPosRecord = { left: number; top: number; rotateZ: number };
  const prevPosRef = useRef<Map<string, CardPosRecord>>(
    new Map(HERO_PROJECTS.map((bp) => [bp.id, activePosOf(bp.id)])),
  );

  // Sync topOffset changes (company badge appearing/dismissing) without a reorder animation.
  const prevTopOffsetRef = useRef(topOffset);
  useEffect(() => {
    if (prevTopOffsetRef.current === topOffset) return;
    prevTopOffsetRef.current = topOffset;
    cardApi.start((i) => {
      const id = HERO_PROJECTS[i].id;
      const proj = activeHeroProjects.find((p) => p.id === id) ?? HERO_PROJECTS[i];
      prevPosRef.current.set(id, { left: proj.left, top: proj.top + topOffset, rotateZ: proj.rotation });
      return { top: proj.top + topOffset, config: { tension: 200, friction: 28 } };
    });
  }, [topOffset, activeHeroProjects, cardApi]);

  // Skip the animation on mount — springs are already at the correct positions.
  const mountedRef = useRef(false);

  // Fire reorder animation when the project assignment changes.
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    const prev = prevPosRef.current;

    if (preset.id === 'watercolor-dissolve') {
      // Phase 1: blur out all cards.
      let restCount = 0;
      cardApi.start((_i) => ({
        to: { opacity: 0, blurPx: 10 },
        config: preset.config,
        onRest: () => {
          restCount += 1;
          if (restCount < HERO_PROJECTS.length) return;
          setDisplayedProjects(activeHeroProjects);
          activeHeroProjects.forEach((p) => {
            prevPosRef.current.set(p.id, { left: p.left, top: p.top + topOffset, rotateZ: p.rotation });
          });
          // Phase 2: snap positions immediately (invisible), then blur in.
          cardApi.start((j) => {
            const proj = activeHeroProjects.find((p) => p.id === HERO_PROJECTS[j].id) ?? HERO_PROJECTS[j];
            return {
              from: {
                left: proj.left,
                top: proj.top + topOffset,
                rotateZ: proj.rotation,
                opacity: 0,
                blurPx: 10,
              },
              to: { opacity: 1, blurPx: 0 },
              config: preset.config,
            };
          });
        },
      }));
      return;
    }

    // FLIP Slide / Arc Float — animate each card from its old position to its new one.
    cardApi.start((i) => {
      const id = HERO_PROJECTS[i].id;
      const next = activeHeroProjects.find((p) => p.id === id) ?? HERO_PROJECTS[i];
      const prevPos = prev.get(id) ?? { left: next.left, top: next.top + topOffset, rotateZ: next.rotation };
      const targetPos = { left: next.left, top: next.top + topOffset };

      // Inject rotateZ into the final animation step so the card ends at the correct rotation.
      const rawTo = preset.getTo(prevPos, targetPos, i);
      const toWithRotation = Array.isArray(rawTo)
        ? [...rawTo.slice(0, -1), { ...rawTo[rawTo.length - 1], rotateZ: next.rotation }]
        : { ...rawTo, rotateZ: next.rotation };

      return {
        from: { left: prevPos.left, top: prevPos.top, rotateZ: prevPos.rotateZ, opacity: 1, scale: 1, blurPx: 0 },
        to: toWithRotation,
        delay: preset.trail ? i * preset.trail : 0,
        config: preset.config,
      };
    });

    // Advance prev positions after triggering.
    activeHeroProjects.forEach((p) => {
      prevPosRef.current.set(p.id, { left: p.left, top: p.top + topOffset, rotateZ: p.rotation });
    });
    setDisplayedProjects(activeHeroProjects);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHeroProjects, preset]);

  return (
    <>
      <section
        className="color-[#251900] relative mx-auto h-auto md:h-[728px] w-full md:overflow-hidden"
        style={{ backgroundColor: DARK }}
      >
        {/* Live watercolor band — height spring-animates to viewport height in mobile draw mode. */}
        <animated.div
          className="absolute top-0 left-0 w-full select-none overflow-hidden"
          style={canvasHeightSpring}
        >
          <div
            ref={heroCanvasRef}
            className="absolute -inset-x-[36px] top-0"
            style={{ height: isMobile ? '100dvh' : '100%', touchAction: "none" }}
            aria-hidden="true"
          />
        </animated.div>

        <animated.div className="pointer-events-none" style={gradientsSpring}>
          {/* Radial pool — dark centre at bottom of wash band. */}
          <div
            className="absolute inset-x-0 top-[216px] h-[340px]"
            style={{
              background:
                "radial-gradient(ellipse 500px 275px at 50% 100%, rgba(37,25,0,1) 0%, rgba(37,25,0,0) 100%)",
            }}
          />
          {/* Linear fade — wash band → DARK. */}
          <div
            className="absolute inset-x-0 top-[269px] h-[291px]"
            style={{
              background: `linear-gradient(to bottom, rgba(37,25,0,0) 0%, ${DARK} 100%)`,
            }}
          />
          {/* Blurb legibility vignette. */}
          <div
            className="absolute inset-x-0 top-0 h-[304px]"
            style={{
              background:
                "radial-gradient(82% 100% at 50% 0%, rgba(255,251,240,0.5) 0%, rgba(255,251,240,0) 70%)",
            }}
          />
          {/* Film grain — a pre-baked 128px seamless noise tile repeated over
              the gradient band. Per-pixel noise has no spatial correlation, so
              the tile edges match the interior and it repeats without a seam.
              mix-blend-mode:overlay lets mid-gray pixels pass through and only
              the deviations grain the gradients/wash beneath; element opacity
              is the single strength knob. Cheap static raster — no per-frame
              feTurbulence repaint. */}
          <div
            className="absolute inset-x-0 top-0 h-[560px] opacity-[0.6]"
            style={{
              backgroundImage: "url('/images/noise.png')",
              backgroundRepeat: "repeat",
              mixBlendMode: "overlay",
            }}
          />
        </animated.div>

        {/* Intro blurb. When company context is active, the two-line greeting
            and badge chip add ~60px; we pull the block up 28px (extra greeting
            line) and push cards down 32px (chip) to keep visual balance. */}
        <animated.div
          className={`absolute left-1/2 z-30 flex w-[min(315px,calc(100vw-48px))] -translate-x-1/2 flex-col items-center gap-[8px] text-center leading-[24px] text-black ${company ? "top-[32px] md:top-[52px]" : "top-[60px] md:top-[80px]"}`}
          style={introSpring}
        >
          <p className="pointer-events-none font-display font-light text-[24px] leading-[28px]">
            {company && (<>Hi, {company}!<br /></>)}
            I'm C Stavridis,
          </p>
          <p className="pointer-events-none font-body text-[18px] leading-[24px]">
            {blurb ?? "an AI-Native Design Engineer who loves turning complex ideas into warm, approachable products."}
          </p>
          {company && onDismiss && (
            <CompanyBadge company={company} onDismiss={onDismiss} />
          )}
        </animated.div>

        {/* Project cards — desktop: spring-animated absolute positioning. */}
        <animated.div className="hidden md:block w-full max-w-[770px] relative m-auto z-20" style={cardsSpring}>
          {HERO_PROJECTS.map((baseProject, i) => {
            const current = displayedProjects.find((p) => p.id === baseProject.id) ?? baseProject;
            const sp = cardSprings[i];
            return (
              <animated.div
                key={baseProject.id}
                style={{
                  position: 'absolute',
                  left: sp.left,
                  top: sp.top,
                  rotateZ: sp.rotateZ,
                  opacity: sp.opacity,
                  scale: sp.scale,
                  filter: sp.blurPx.to((b) => (b > 0 ? `blur(${b}px)` : 'none')),
                  zIndex: current.z,
                }}
              >
                <div className={current.bob ? 'animate-[card-bob_6s_ease-in-out_infinite]' : undefined}>
                  <HeroProjectCardButton
                    project={current}
                    onClick={() => handleCardClick(current)}
                    onActivate={() => handleCardActivate(current)}
                  />
                </div>
              </animated.div>
            );
          })}
        </animated.div>

        {/* Animation preset selector — desktop only, bottom-left of hero canvas. */}
        <div className="hidden md:block">
          <AnimationSelector onSelect={setSelectedPresetId} />
        </div>

        {/* Project cards — mobile: horizontal snap scroll, 02 · 01 · 03. */}
        <animated.div
          ref={mobileScrollRef}
          className="md:hidden relative z-10 flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-6 pb-12"
          style={{ ...cardsSpring, scrollPaddingInline: "calc(50% - 136px)", paddingTop: company ? "252px" : "180px" }}
        >
          {/* Leading spacer so the first card can snap to center. */}
          <div className="flex-shrink-0 w-[calc(50vw-136px)]" aria-hidden="true" />
          {activeMobileHeroProjects.map((project, i) => (
            <div
              key={project.id}
              ref={i === 1 ? centerCardRef : undefined}
              className="snap-center flex-shrink-0"
              style={{
                transform: `rotate(${project.rotation}deg)`,
                pointerEvents: drawMode ? 'none' : 'auto',
              }}
            >
              <HeroProjectCardButton
                project={project}
                onClick={() => handleCardClick(project)}
                onActivate={() => handleCardActivate(project)}
              />
            </div>
          ))}
          {/* Trailing spacer so the last card can snap to center. */}
          <div className="flex-shrink-0 w-[calc(50vw-136px)]" aria-hidden="true" />
        </animated.div>

        {/* Draw mode toggle — mobile only. Comes after the canvas in DOM so it stacks above it. */}
        <animated.button
          type="button"
          onClick={() => setDrawMode((d) => !d)}
          className="md:hidden absolute top-4 right-4 z-20 font-mono text-[12px] leading-normal px-3 py-1.5 rounded-md backdrop-blur-sm transition-colors"
          style={{
            ...paintButtonSpring,
            backgroundColor: drawMode ? activeColor : 'rgba(79,61,27,0.5)',
            color: drawMode
              ? activePigment === 'yellow' ? '#100e08' : CREAM
              : CREAM,
          }}
        >
          {drawMode ? 'Done' : 'Paint'}
        </animated.button>

        {/* Pigment selector — always on desktop; draw-mode-only on mobile. */}
        <div className={drawMode ? 'block' : 'hidden md:block'}>
          <PigmentSelector
            active={activePigment}
            onSelect={setActivePigment}
            onPaintbrushClick={cyclePigment}
          />
        </div>

        {/* Brush indicator — pointer devices only; no persistent cursor on touch. */}
        {!window.matchMedia("(pointer: coarse)").matches && (
          <BrushIndicator
            cursor={brushCursor}
            size={brushSize}
            color={activeColor}
          />
        )}
      </section>

      {/* Preset widget — centered on the dark band below the hero. */}
      <div
        className={drawMode ? "flex w-full justify-center fixed bottom-0" : "flex w-full justify-center"}
        style={{ backgroundColor: DARK }}
      >
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
        />
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// CompanyBadge — shown below the intro blurb when a company context is active.
// Clicking × clears localStorage and reverts to the generic landing.
// ---------------------------------------------------------------------------

function CompanyBadge({ company, onDismiss }: { company: string; onDismiss: () => void }): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onDismiss}
      aria-label={`Dismiss personalization for ${company}`}
      className="mt-2 flex items-center gap-[6px] rounded-[4px] px-[10px] py-[4px] font-mono text-[11px] leading-[20px] transition-opacity hover:opacity-80 active:opacity-60"
      style={{ backgroundColor: 'rgba(79,61,27,0.75)', color: 'rgba(251,246,234,0.75)' }}
    >
      <span>Personalized for {company}</span>
      <span aria-hidden="true">×</span>
    </button>
  );
}
