import "../globals.css";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { animated, useSpring } from "@react-spring/web";
import type { PigmentOption, WashesInstance } from "../../lib/washes/washes.js";
import { Washes } from "../../lib/washes/washes.js";
import { initGpuSim } from "../../lib/washes/washes-gpu-sim.js";

// ---------------------------------------------------------------------------
// Pigments — the three primaries the design ships with. They drive the
// pigment selector, the per-card accent, and the active brush color.
// ---------------------------------------------------------------------------

type PigmentKey = "rose" | "yellow" | "blue";

const PIGMENTS: Record<PigmentKey, { label: string; color: string }> = {
  rose: { label: "Quinacridone Magenta", color: "#a50e53" },
  yellow: { label: "Hansa Yellow", color: "#e3af08" },
  blue: { label: "Cerulean Blue", color: "#108ba0" },
};
// Selector order, top → bottom, matches the Figma (magenta, yellow, blue).
const PIGMENT_ORDER: PigmentKey[] = ["rose", "yellow", "blue"];

const CREAM = "#fbf6ea";
const DARK = "#251900"; // the warm near-black the hero wash fades into

// ---------------------------------------------------------------------------
// Preset widget — "Saint Louis, MO is where I'm based. / It's currently
// 9:52 AM 72°F and sunny."
//
// Annotation (Location selector): cycles through four places, each with its
// own descriptive phrase; default Saint Louis, MO. Clicking resets the Washes
// canvas — the canvas should quickly fade out and fade back in.
// Annotation (Weather selector): "Use Open Meteo API to pull in data."
// ---------------------------------------------------------------------------

type LocationInfo = {
  city: string;
  phrase: string;
  lat: number;
  lon: number;
  fallbackTemp: number;
  fallbackWeather: WeatherKey;
  // UTC offset used only when the Open-Meteo lookup is unavailable; the live
  // fetch (timezone=auto) returns the real, DST-correct offset.
  fallbackOffsetSec: number;
};

const LOCATIONS: LocationInfo[] = [
  {
    city: "Saint Louis, MO",
    phrase: "is where I’m based.",
    lat: 38.627,
    lon: -90.199,
    fallbackTemp: 72,
    fallbackWeather: "sunny",
    fallbackOffsetSec: -18000,
  },
  {
    city: "Prescott, AZ",
    phrase: "is where I grew up.",
    lat: 34.54,
    lon: -112.468,
    fallbackTemp: 64,
    fallbackWeather: "sunny",
    fallbackOffsetSec: -25200,
  },
  {
    city: "Osaka, Japan",
    phrase: "is where my heart is.",
    lat: 34.694,
    lon: 135.502,
    fallbackTemp: 70,
    fallbackWeather: "cloudy",
    fallbackOffsetSec: 32400,
  },
  {
    city: "Taipei, Taiwan",
    phrase: "is where I could see myself living.",
    lat: 25.033,
    lon: 121.565,
    fallbackTemp: 81,
    fallbackWeather: "rainy",
    fallbackOffsetSec: 28800,
  },
];

type WeatherKey = "sunny" | "cloudy" | "rainy" | "stormy" | "snowy";
// Weather drives the atmospheric *animation* overlay only. The *background*
// time-wash is chosen by the local day phase (see DayPhase below), per the
// Time Selector annotation.
const WEATHER_PRESETS: Record<
  WeatherKey,
  { label: string; animation: string }
> = {
  sunny: { label: "sunny", animation: "sunny" },
  cloudy: { label: "cloudy", animation: "partlyCloudy" },
  rainy: { label: "rainy", animation: "rainy" },
  stormy: { label: "stormy", animation: "thunderstorm" },
  snowy: { label: "snowy", animation: "snowing" },
};
const WEATHER_ORDER: WeatherKey[] = [
  "sunny",
  "cloudy",
  "rainy",
  "stormy",
  "snowy",
];

// Map an Open-Meteo WMO weather code to one of our animation presets.
function weatherFromCode(code: number): WeatherKey {
  if (code === 0) return "sunny";
  if (code <= 48) return "cloudy";
  if (code >= 71 && code <= 77) return "snowy";
  if (code === 85 || code === 86) return "snowy";
  if (code >= 95) return "stormy";
  return "rainy";
}

// The widget label for the current weather. After sunset (night phase) a clear
// sky reads as "clear" rather than "sunny".
function weatherLabel(weather: WeatherKey, dayPhase: DayPhase): string {
  if (weather === "sunny" && dayPhase === "night") return "clear";
  return WEATHER_PRESETS[weather].label;
}

// Annotation (Time Selector): the background visualization tracks the selected
// location's local day phase, derived from Open-Meteo's sunrise/sunset. Each
// phase maps to one of the Washes time-wash backgrounds (TIME_WASHES).
type DayPhase = "sunrise" | "day" | "sunset" | "night";
const DAY_PHASE_BACKGROUND: Record<DayPhase, string> = {
  sunrise: "dawn",
  day: "day",
  sunset: "sunset",
  night: "night",
};

// Paper tint per day phase, applied to both the Washes paper color and the
// canvas background color.
const DAY_PHASE_PAPER: Record<DayPhase, string> = {
  sunrise: "#fdf3c8", // pastel yellow
  day: CREAM,
  sunset: "#f9d0e3", // pastel rose
  night: "#c8eaf0", // pastel blue
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = Number.parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

type SunTimes = { sunriseMin: number; sunsetMin: number };
// Generic fallback (≈6:00 sunrise / ≈19:30 sunset) when the lookup is offline.
const FALLBACK_SUN: SunTimes = { sunriseMin: 6 * 60, sunsetMin: 19 * 60 + 30 };

// Minutes-since-midnight from an Open-Meteo local ISO time ("...THH:MM").
function isoToMinutes(iso: string | undefined): number | null {
  if (!iso) return null;
  const m = /T(\d{2}):(\d{2})/.exec(iso);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

// Classify a local time (minutes since midnight) into a day phase, using a
// transition window straddling sunrise and sunset.
function dayPhaseFor(nowMin: number, sun: SunTimes): DayPhase {
  const W = 75; // minutes on each side of sunrise/sunset
  if (nowMin < sun.sunriseMin) return "night";
  if (nowMin < sun.sunriseMin + W) return "sunrise";
  if (nowMin < sun.sunsetMin - W) return "day";
  if (nowMin < sun.sunsetMin + W) return "sunset";
  return "night";
}

// The location's current wall-clock minutes-since-midnight, given its UTC
// offset (null → the viewer's own local time).
function localMinutes(offsetSec: number | null): number {
  if (offsetSec == null) {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }
  const d = new Date(Date.now() + offsetSec * 1000);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

// One forecast row: a day-phase, the time it occurs, and the predicted
// conditions there (from Open-Meteo hourly data, within the next 24h).
type PhaseForecast = {
  phase: DayPhase;
  label: string;
  time: string;
  temp: number;
  weather: WeatherKey;
};

function formatHourMinute(h: number, min: number): string {
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(min).padStart(2, "0")} ${ampm}`;
}

// Format a local "...THH:MM" ISO time as "7:05 AM".
function formatIsoTime(iso: string): string {
  const m = /T(\d{2}):(\d{2})/.exec(iso);
  return m ? formatHourMinute(Number(m[1]), Number(m[2])) : "";
}

type ForecastPayload = {
  daily?: { sunrise?: string[]; sunset?: string[] };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    weather_code?: number[];
  };
};

// Build the sunrise / mid-day / sunset forecast. For each phase we take its
// next occurrence within the coming 24h and read the nearest hourly sample.
// Unsuffixed Open-Meteo ISO times are local wall-clock; parsing them as UTC
// (append "Z") makes them comparable to the location's "now".
function buildForecast(
  data: ForecastPayload,
  offsetSec: number,
): PhaseForecast[] | null {
  const sr = data.daily?.sunrise;
  const ss = data.daily?.sunset;
  const ht = data.hourly?.time;
  const htemp = data.hourly?.temperature_2m;
  const hcode = data.hourly?.weather_code;
  if (!sr || !ss || !ht || !htemp || !hcode || sr.length < 2 || ss.length < 2)
    return null;

  const toVal = (iso: string) => Date.parse(`${iso}Z`);
  const nowVal = Date.now() + offsetSec * 1000;
  const next = (candidates: string[]) =>
    candidates.find((c) => toVal(c) >= nowVal) ??
    candidates[candidates.length - 1];
  const sampleAt = (iso: string) => {
    const target = toVal(iso);
    let best = 0;
    let bestDiff = Infinity;
    for (let i = 0; i < ht.length; i++) {
      const diff = Math.abs(toVal(ht[i]) - target);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = i;
      }
    }
    return { temp: Math.round(htemp[best] ?? 0), code: hcode[best] ?? 0 };
  };
  const noon = (iso: string) => `${iso.slice(0, 10)}T12:00`;
  const midnight = (iso: string) => `${iso.slice(0, 10)}T00:00`;
  const rows: { phase: DayPhase; label: string; iso: string }[] = [
    { phase: 'sunrise', label: 'Sunrise', iso: next([sr[0], sr[1]]) },
    { phase: 'day', label: 'Mid-Day', iso: next([noon(sr[0]), noon(sr[1])]) },
    { phase: 'sunset', label: 'Sunset', iso: next([ss[0], ss[1]]) },
    // Night is represented at local midnight (symmetric to Mid-Day at noon).
    { phase: 'night', label: 'Night', iso: next([midnight(sr[0]), midnight(sr[1])]) },
  ];
  // Order by when each phase next occurs so cycling from "now" advances to the
  // next chronological time (after sunrise → mid-day; after sunset → sunrise).
  rows.sort((a, b) => toVal(a.iso) - toVal(b.iso));
  return rows.map(({ phase, label, iso }) => {
    return { phase, label, time: formatIsoTime(iso), temp, weather: weatherFromCode(code) };
  });
}

// Offline fallback so the widget always renders three rows.
function fallbackForecast(loc: LocationInfo): PhaseForecast[] {
  const row = (phase: DayPhase, label: string, min: number): PhaseForecast => ({
    phase,
    label,
    time: formatHourMinute(Math.floor(min / 60), min % 60),
    temp: loc.fallbackTemp,
    weather: loc.fallbackWeather,
  });
  return [
    row('sunrise', 'Sunrise', FALLBACK_SUN.sunriseMin),
    row('day', 'Mid-Day', 12 * 60),
    row('sunset', 'Sunset', FALLBACK_SUN.sunsetMin),
    row('night', 'Night', 0),
  ];
}

// ---------------------------------------------------------------------------
// Hero project cards — three overlapping watercolor cards. The watercolor is
// real pigment (a live Washes canvas) rather than a static screenshot, with a
// brush-stroke SVG traced onto each.
// ---------------------------------------------------------------------------

type HeroProject = {
  id: string;
  label: string;
  title: string;
  image: string;
  pigment: PigmentKey;
  cta: { text: string; variant: "filled" | "outline" };
  // Position inside the hero (Figma coordinates, hero-relative).
  left: number;
  top: number;
  rotation: number;
  z: number;
  bob: boolean; // Annotation: Project 01 "gently move up and down".
};

// Order matches the Figma stacking: the centre card (Project 01) sits highest
// and on top; the two flanking cards are lower and behind it.
// MOBILE_HERO_PROJECTS puts Project 01 in the middle slot so it opens centered.
const HERO_PROJECTS: HeroProject[] = [
  {
    id: "proj-careSignal-ai",
    label: "Project 02",
    title: "Expressing the value\nof CareSignal AI",
    image: "/images/CareSignal AI Thumb.png",
    pigment: "blue",
    cta: { text: "View Project", variant: "filled" },
    left: -55,
    top: 328,
    rotation: 1,
    z: 10,
    bob: false,
  },
  {
    id: "proj-sol-lewitt",
    label: "Project 03",
    title: "Using ML to Conserve\nthe work of Sol LeWitt",
    image: "/images/Sol LeWitt Thumb.png",
    pigment: "rose",
    cta: { text: "View Project", variant: "filled" },
    left: 554,
    top: 328,
    rotation: 1,
    z: 10,
    bob: false,
  },
  {
    id: "proj-careSignal-ds",
    label: "Project 01",
    title: "Building CareSignal’s\nDesign System",
    image: "/images/CareSignal Design System Thumb.png",
    pigment: "yellow",
    cta: { text: "View Project", variant: "filled" },
    left: 251,
    top: 246,
    rotation: -1,
    z: 20,
    bob: true,
  },
];

// Mobile order: 02 · 01 · 03 — Project 01 in the center slot opens centered.
const MOBILE_HERO_PROJECTS = [HERO_PROJECTS[0], HERO_PROJECTS[2], HERO_PROJECTS[1]];

// ---------------------------------------------------------------------------
// Lower sections — creative tools + UI experiments. Each card renders its
// imagery as a live Washes canvas tinted with the card's hue, masked by the
// three layers the Figma calls out (Washes Multiplied, Noise, Desaturation).
// ---------------------------------------------------------------------------

type ProjectCard = {
  id: string;
  title: string;
  description: string;
  project_image: string;
  washes_image: string;
};

const CREATIVE_CARDS: ProjectCard[] = [
  {
    id: "creative-washes",
    title: "Washes.js",
    description: "a computational watercolor library",
    project_image: "/images/projects/Washes BG.png",
    washes_image: "/images/projects/Washes Multiplier.png",
  },
  {
    id: "creative-confetti",
    title: "Confetti",
    description: "a playful SVG sprinkle engine for celebratory UI",
    project_image: "/images/projects/Confetti BG.png",
    washes_image: "/images/projects/Confetti Multiplier.png",
  },
  {
    id: "creative-facets",
    title: "Facets",
    description: "codify your taste with a compound AI tool",
    project_image: "/images/projects/Facets BG.png",
    washes_image: "/images/projects/Facets Multiplier.png",
  },
];

const EXPERIMENT_CARDS: ProjectCard[] = [
  {
    id: "experiment-sandy",
    title: "Sandy",
    description: "A 3D visualization of Dave Long's esolang, Calder.",
    project_image: "/images/projects/Sandy BG.png",
    washes_image: "/images/projects/Sandy Multiplier.png",
  },
  {
    id: "experiment-rain-check",
    title: "Rain Check",
    description: "Thoughtful declines to events.",
    project_image: "/images/projects/Rain Check BG.png",
    washes_image: "/images/projects/Rain Check Multiplier.png",
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Hero (watercolor band + intro + cards) and the preset widget below it.
// They share a single component so the preset widget can drive the hero's
// live Washes canvas.
// ---------------------------------------------------------------------------

const BRUSH_MIN = 16;
const BRUSH_MAX = 240;
const BRUSH_STEP = 8;
const BRUSH_DEFAULT = 160;

function Hero({ onCardClick, onCardHover, paused = false, transitioning = false }: { onCardClick?: (id: string) => void; onCardHover?: (id: string) => void; paused?: boolean; transitioning?: boolean }): React.ReactElement {
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
      wash.paperColor(251 / 255, 246 / 255, 234 / 255);
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
      // The background (day phase) + animation (weather) are applied by the
      // effect below once state settles; see the [dayPhase, weather] effect.

      const canvasEl = (wash as unknown as { canvas: HTMLCanvasElement }).canvas;
      if (canvasEl) {
        canvasEl.style.cursor = "crosshair";
        canvasEl.style.backgroundColor = `rgb(251,246,234)`;
        // iOS Safari fires pointercancel and hands the gesture to the scroll
        // container before touch-action:none takes effect on the canvas itself.
        // A non-passive touchstart calling preventDefault() pre-empts this.
        canvasEl.addEventListener("touchstart", (e) => e.preventDefault(), {
          passive: false,
        });
      }

      // Pull live weather for the default location (Open-Meteo, keyless).
      void refreshWeather(LOCATIONS[0]);
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

  // Pause / resume the Washes canvas when the project overlay covers the page.
  useEffect(() => {
    const wash = heroWashRef.current;
    if (!wash) return;
    if (paused && !wash.paused()) {
      wash.pause({ acceptInput: false });
    } else if (!paused && wash.paused()) {
      wash.resume();
    }
  }, [paused]);

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
    }, 420);
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

  const activeColor = PIGMENTS[activePigment].color;

  const canvasHeightSpring = useSpring({
    height: drawMode && isMobile ? window.innerHeight : isMobile ? 240 : 560,
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
                "radial-gradient(ellipse 854px 253px at 50% 100%, rgba(37,25,0,1) 0%, rgba(37,25,0,0) 100%)",
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
        </animated.div>

        {/* Intro blurb. */}
        <animated.div className="pointer-events-none absolute top-[60px] md:top-[80px] left-1/2 flex w-[min(315px,calc(100vw-48px))] -translate-x-1/2 flex-col items-center gap-[8px] text-center leading-[24px] text-black" style={introSpring}>
          <p className="font-display text-[24px]">I’m C Stavridis,</p>
          <p className="font-body text-[18px] leading-[24px]">
            an AI-Native Design Engineer who loves turning complex ideas into
            warm, approachable products.
          </p>
        </animated.div>

        {/* Project cards — desktop: absolutely positioned. */}
        <animated.div className="hidden md:block w-full max-w-[770px] relative m-auto z-20" style={cardsSpring}>
          {HERO_PROJECTS.map((project) => (
            <HeroProjectCard
              key={project.id}
              project={project}
              onClick={() => handleCardClick(project)}
              onActivate={() => handleCardActivate(project)}
            />
          ))}
        </animated.div>

        {/* Project cards — mobile: horizontal snap scroll, 02 · 01 · 03. */}
        <animated.div
          ref={mobileScrollRef}
          className="md:hidden relative z-10 flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-6 pt-[180px] pb-12"
          style={{ ...cardsSpring, scrollPaddingInline: 'calc(50% - 136px)' }}
        >
          {/* Leading spacer so the first card can snap to center. */}
          <div className="flex-shrink-0 w-[calc(50vw-136px)]" aria-hidden="true" />
          {MOBILE_HERO_PROJECTS.map((project, i) => (
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
        <button
          type="button"
          onClick={() => setDrawMode((d) => !d)}
          className="md:hidden absolute top-4 right-4 z-20 font-mono text-[12px] leading-normal px-3 py-1.5 rounded-md backdrop-blur-sm transition-colors"
          style={{
            backgroundColor: drawMode ? activeColor : 'rgba(79,61,27,0.5)',
            color: drawMode
              ? activePigment === 'yellow' ? '#100e08' : CREAM
              : CREAM,
          }}
        >
          {drawMode ? 'Done' : 'Paint'}
        </button>

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
        className="flex w-full justify-center"
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

// Format the current wall-clock time for a given UTC offset (seconds). When
// `offsetSec` is null we have no location timezone yet, so fall back to the
// viewer's own local time. Shifting the epoch by the offset and reading the
// UTC fields yields the location's local time independent of the browser's tz.
function formatClock(offsetSec: number | null): string {
  let h: number;
  let m: number;
  if (offsetSec == null) {
    const d = new Date();
    h = d.getHours();
    m = d.getMinutes();
  } else {
    const d = new Date(Date.now() + offsetSec * 1000);
    h = d.getUTCHours();
    m = d.getUTCMinutes();
  }
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
}

// ---------------------------------------------------------------------------
// Pigment selector — vertical pill on the right edge of the hero. The paint-
// brush glyph recolors to the active pigment (annotation), and the pill tints
// to the active pigment ("Selector Background (Magenta)" in the Figma).
// ---------------------------------------------------------------------------

function PigmentSelector({
  active,
  onSelect,
  onPaintbrushClick,
}: {
  active: PigmentKey;
  onSelect: (key: PigmentKey) => void;
  onPaintbrushClick: () => void;
}): React.ReactElement {
  const activeColor = PIGMENTS[active].color;
  return (
    <div
      className="absolute top-[173px] right-[24px] z-30 flex w-[22px] flex-col items-center gap-[10px] rounded-[12px] py-[8px] backdrop-blur-[2px]"
      style={{ backgroundColor: `${CREAM}` }}
    >
      <button
        type="button"
        onClick={onPaintbrushClick}
        aria-label="Cycle active pigment"
        className="flex h-[14px] w-[14px] items-center justify-center"
        style={{ color: activeColor }}
      >
        {/* Paint brush glyph (heroicons "paint-brush"). */}
        <svg
          fill="currentColor"
          width="13"
          height="12"
          viewBox="0 0 13 12"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0.133484 10.3655C0.0280151 10.2209 -0.0149536 10.094 0.00457764 9.9846C0.0280151 9.87523 0.0866089 9.79124 0.180359 9.73265C0.278015 9.66624 0.381531 9.63304 0.490906 9.63304C0.600281 9.63304 0.721375 9.62523 0.854187 9.6096C0.990906 9.59398 1.14325 9.52562 1.31122 9.40452C1.45966 9.29905 1.56122 9.16624 1.61591 9.00608C1.67059 8.84202 1.71747 8.66429 1.75653 8.47288C1.7995 8.28148 1.87177 8.08812 1.97333 7.8928C2.07489 7.69749 2.24677 7.5139 2.48895 7.34202C2.7702 7.1428 3.08661 7.03929 3.43817 7.03148C3.78973 7.02366 4.13348 7.10569 4.46942 7.27757C4.80536 7.44944 5.09052 7.7053 5.32489 8.04515C5.59052 8.42015 5.73895 8.80491 5.7702 9.19944C5.80145 9.59398 5.72333 9.97093 5.53583 10.3303C5.34833 10.6936 5.05536 11.0139 4.65692 11.2912C4.31317 11.5295 3.93036 11.6819 3.50848 11.7483C3.09052 11.8147 2.66864 11.803 2.24286 11.7131C1.81708 11.6272 1.41864 11.469 1.04755 11.2385C0.680359 11.008 0.375671 10.717 0.133484 10.3655ZM5.54755 7.17796C5.33661 6.96312 5.09833 6.78343 4.8327 6.6389C4.57098 6.49046 4.32489 6.39671 4.09442 6.35765C4.13348 6.12718 4.2077 5.91038 4.31708 5.70726C4.43036 5.50413 4.58661 5.30296 4.78583 5.10374C4.81708 5.07249 4.84833 5.04124 4.87958 5.00999C4.91473 4.97874 4.94989 4.94749 4.98505 4.91624C5.3327 4.98265 5.66278 5.09983 5.97528 5.2678C6.28778 5.43577 6.56903 5.64671 6.81903 5.90062C7.07294 6.15062 7.28583 6.43382 7.4577 6.75023C7.62958 7.06273 7.74677 7.39476 7.80927 7.74632C7.78192 7.78148 7.75262 7.81468 7.72137 7.84593C7.69012 7.87718 7.65887 7.90843 7.62762 7.93968C7.42841 8.1389 7.22919 8.29515 7.02997 8.40843C6.83075 8.52171 6.612 8.59788 6.37372 8.63694C6.33466 8.40648 6.24091 8.16038 6.09247 7.89866C5.94403 7.63304 5.76239 7.3928 5.54755 7.17796ZM11.0729 0.211163C11.2604 0.0744441 11.4499 0.00413161 11.6413 0.000225361C11.8366 -0.00368089 12.0163 0.0431941 12.1804 0.14085C12.3483 0.238507 12.4811 0.369366 12.5788 0.533428C12.6765 0.697491 12.7253 0.879132 12.7253 1.07835C12.7253 1.27366 12.6569 1.46702 12.5202 1.65843C12.4811 1.70921 12.3913 1.83421 12.2507 2.03343C12.114 2.23265 11.9382 2.4846 11.7233 2.78929C11.5085 3.09398 11.2643 3.43187 10.9909 3.80296C10.7214 4.17405 10.4343 4.55882 10.1296 4.95726C9.8288 5.35179 9.52216 5.74241 9.20966 6.12913C8.90106 6.51585 8.59833 6.87718 8.30145 7.21312C8.09052 6.54124 7.73895 5.96116 7.24677 5.47288C6.75848 4.9846 6.18231 4.63499 5.51825 4.42405C5.85419 4.13108 6.21552 3.8303 6.60223 3.52171C6.98895 3.20921 7.38153 2.90257 7.77997 2.60179C8.17841 2.2971 8.56317 2.00999 8.93427 1.74046C9.30536 1.46702 9.6413 1.22288 9.94208 1.00804C10.2468 0.793194 10.4987 0.61546 10.6979 0.474835C10.8972 0.33421 11.0222 0.246319 11.0729 0.211163Z"
            fill="currentColor"
          />
        </svg>
      </button>
      {PIGMENT_ORDER.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onSelect(key)}
          aria-label={`Select ${PIGMENTS[key].label}`}
          aria-pressed={active === key}
          className="relative flex h-[10px] w-[10px] items-center justify-center rounded-full transition-transform hover:scale-110"
          style={{
            backgroundColor: PIGMENTS[key].color,
            outline: active === key ? `2px solid ${CREAM}` : "none",
            outlineOffset: active === key ? "1.5px" : "0",
          }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Brush indicator — a 64px (default) ring that follows the cursor over the
// hero band, scales with the Washes brush size, and recolors to the pigment.
// ---------------------------------------------------------------------------

function BrushIndicator({
  cursor,
  size,
  color,
}: {
  cursor: { x: number; y: number; visible: boolean };
  size: number;
  color: string;
}): React.ReactElement {
  return (
    <div
      className="pointer-events-none absolute z-20 rounded-full border-2 transition-[width,height,opacity] duration-150 ease-out"
      style={{
        width: size,
        height: size,
        top: 0,
        left: 0,
        transform: `translate(${cursor.x - size / 2}px, ${cursor.y - size / 2}px)`,
        backgroundColor: `${color}40`,
        borderColor: `${color}80`,
        boxShadow: `0 0 12px ${color}66`,
        opacity: cursor.visible ? 1 : 0,
        willChange: "transform, opacity",
      }}
      aria-hidden="true"
    />
  );
}

// ---------------------------------------------------------------------------
// Preset widget
// ---------------------------------------------------------------------------

// A non-interactive "bug" chip — used for the read-only forecast values.
function DisplayBug({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <span className="inline-flex items-center rounded-[4px] bg-[#4f3d1b] px-[8px] text-[#fbf6ea]">
      {children}
    </span>
  );
}

function PresetWidget({
  location,
  slot,
  time,
  temp,
  weather,
  dayPhase,
  forecast,
  onLocation,
  onTime,
  onWeather,
}: {
  location: LocationInfo;
  slot: number;
  time: string;
  temp: number;
  weather: WeatherKey;
  dayPhase: DayPhase;
  forecast: PhaseForecast[];
  onLocation: () => void;
  onTime: () => void;
  onWeather: () => void;
}): React.ReactElement {
  // slot 0 = "now"; 1..3 = the sunrise / mid-day / sunset forecast rows.
  const f = slot > 0 ? forecast[slot - 1] : null;
  return (
    <div className="flex flex-col items-center gap-[6px] px-[16px] py-[12px] font-mono text-[12px] leading-[24px] opacity-60 bg-[rgb(37,25,0)] rounded-md">
      <div className="flex items-center gap-[6px]">
        <PresetBug
          background="#4f3d1b"
          onClick={onLocation}
          label={`Change location (currently ${location.city})`}
        >
          {location.city}
        </PresetBug>
        <span className="text-[#fbf6ea] mix-blend-difference">
          {location.phrase}
        </span>
      </div>

      {f ? (
        <div className="flex items-center gap-[6px]">
          <span className="text-[#fbf6ea] mix-blend-difference">At</span>
          <PresetBug
            background="#4f3d1b"
            onClick={onTime}
            label={`Show the next time (now showing ${f.label})`}
          >
            {`${f.time} (${f.label.toLowerCase()})`}
          </PresetBug>
          <span className="text-[#fbf6ea] mix-blend-difference">
            it will be {f.temp}°F and
          </span>
          <DisplayBug>{weatherLabel(f.weather, f.phase)}</DisplayBug>
          <span className="text-[#fbf6ea] mix-blend-difference">.</span>
        </div>
      ) : (
        <div className="flex items-center gap-[6px]">
          <span className="text-[#fbf6ea] mix-blend-difference">
            It’s currently
          </span>
          <PresetBug
            background="#4f3d1b"
            onClick={onTime}
            label="Show the next forecast time"
          >
            {time}
          </PresetBug>
          <span className="text-[#fbf6ea] mix-blend-difference">
            , {temp}°F and
          </span>
          <PresetBug
            background="#4f3d1b"
            onClick={onWeather}
            label={`Change weather (currently ${weatherLabel(weather, dayPhase)})`}
          >
            {weatherLabel(weather, dayPhase)}
          </PresetBug>
          <span className="text-[#fbf6ea] mix-blend-difference">.</span>
        </div>
      )}
    </div>
  );
}

function PresetBug({
  background,
  onClick,
  label,
  children,
}: {
  background: string;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex items-center rounded-[4px] px-[8px] font-mono text-[12px] leading-[24px] text-[#fbf6ea] transition-transform hover:-translate-y-[1px]"
      style={{ backgroundColor: background }}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Hero project card — live watercolor surface with an instantly-traced brush
// stroke (annotation: "SVG does not animate in, it's instantly on").
// ---------------------------------------------------------------------------

function HeroProjectCardButton({
  project,
  onClick,
  onActivate,
}: {
  project: HeroProject;
  onClick: () => void;
  onActivate: () => void;
}): React.ReactElement {
  const cta = project.cta;
  const ctaColor = PIGMENTS[project.pigment].color;
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onActivate}
      onTouchStart={onActivate}
      onFocus={onActivate}
      className="group relative flex w-[272px] cursor-pointer flex-col items-center gap-[24px] overflow-hidden rounded-[12px] px-[24px] pt-[24px] pb-[36px] text-left transition-transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#fbf6ea]"
      style={{
        backgroundColor: CREAM,
        border: '1px solid rgba(79, 61, 27, 0.25)',
      }}
    >
      <div
        style={{
          backgroundSize: "60%",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          top: "5rem",
          backgroundImage: `url('${project.image}')`,
        }}
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[12px] opacity-70 mix-blend-luminosity"
      />
      <div className="relative z-10 flex w-full flex-col gap-[24px]">
        <p className="font-mono text-[12px] leading-[24px] text-[#7d7d7d] mix-blend-difference">
          {project.label}
        </p>
        <p
          className="font-body text-[18px] leading-[24px] whitespace-pre-line text-black"
          style={{ minHeight: "202px" }}
        >
          {project.title}
        </p>
        {cta.variant === "filled" ? (
          <div
            className="mx-auto flex h-[36px] w-[180px] items-center justify-center rounded-[4px] font-mono text-[12px] leading-[24px] transition-[filter] group-hover:brightness-110"
            style={{
              backgroundColor: ctaColor,
              color: project.pigment === "yellow" ? "#100e08" : CREAM,
            }}
          >
            {cta.text}
          </div>
        ) : (
          <div
            className="mx-auto flex h-[36px] w-[180px] items-center justify-center rounded-[4px] border font-mono text-[12px] leading-[24px] text-black opacity-75"
            style={{
              backgroundColor: CREAM,
              borderColor: ctaColor,
            }}
          >
            {cta.text}
          </div>
        )}
      </div>
    </button>
  );
}

function HeroProjectCard({
  project,
  onClick,
  onActivate,
}: {
  project: HeroProject;
  onClick: () => void;
  onActivate: () => void;
}): React.ReactElement {
  return (
    <div
      className="absolute"
      style={{
        left: `${project.left}px`,
        top: `${project.top}px`,
        zIndex: project.z,
        transform: `rotate(${project.rotation}deg)`,
      }}
    >
      <div
        className={
          project.bob ? "animate-[card-bob_6s_ease-in-out_infinite]" : undefined
        }
      >
        <HeroProjectCardButton project={project} onClick={onClick} onActivate={onActivate} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Creative Tools + UI Experiments — one continuous dark section in the Figma.
// ---------------------------------------------------------------------------

function CreativeToolsSection(): React.ReactElement {
  return (
    <section className="w-full" style={{ backgroundColor: DARK }}>
      <div className="mx-auto max-w-[1280px] px-[24px]">
        {/* AI-Native Creative Tools */}
        <div className="pt-[144px]">
          <p className="font-display text-center text-[24px] leading-[24px] text-[#fbf6ea]/80">
            AI-Native Creative Tools
          </p>
          <div className="mt-[36px] flex flex-wrap justify-center gap-[64px]">
            {CREATIVE_CARDS.map((card) => (
              <RevealCard key={card.id} width={272} height={182} card={card} />
            ))}
          </div>
        </div>

        {/* UI Experiments */}
        <div className="pt-[144px] pb-[120px]">
          <p className="font-display text-center text-[24px] leading-[24px] text-[#fbf6ea]/80">
            UI Experiments
          </p>
          <div className="mt-[36px] flex flex-wrap justify-center gap-[64px]">
            {EXPERIMENT_CARDS.map((card) => (
              <RevealCard key={card.id} width={416} height={275} card={card} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// RevealCard — shared Creative / Experiment recipe.
//
// Annotation (CreativeProjectCard & ExperimentProjectCard):
//   Inactive: only the title is visible.
//   On hover: title + description slide up until the description is in view,
//   AND the watercolor mask layers (Washes Multiplied, Noise, Desaturation)
//   fade out to reveal the "original project image" underneath.
//
// The image is one live Washes canvas; the three masks are CSS overlays
// matching the Figma's layer stack. react-spring drives the slide + fade.
// ---------------------------------------------------------------------------

function RevealCard({
  width,
  height,
  card,
}: {
  width: number;
  height: number;
  card: ProjectCard;
}): React.ReactElement {
  const { title, description } = card;
  const descRef = useRef<HTMLParagraphElement | null>(null);
  const [hovered, setHovered] = useState(false);

  // Distance the text block hides below the fold while inactive: the
  // description height + the 4px gap + the 12px bottom padding.
  const GAP_PX = 4;
  const PB_PX = 12;
  const [hideDistance, setHideDistance] = useState(24 + GAP_PX + PB_PX);

  useLayoutEffect(() => {
    if (descRef.current)
      setHideDistance(descRef.current.offsetHeight + GAP_PX + PB_PX);
  }, [description]);

  // Mask layers fade out together on hover; text slides up.
  const maskStyle = useSpring({
    opacity: hovered ? 1 : 0,
    config: { tension: 200, friction: 26 },
  });
  const textStyle = useSpring({
    transform: hovered
      ? `translateY(${hideDistance + PB_PX * 3.5}px)`
      : `translateY(${hideDistance}px)`,
    config: { tension: 220, friction: 22 },
  });

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      tabIndex={0}
      style={{ width, height }}
      className="relative isolate focus:outline-none focus-visible:ring-2 focus-visible:ring-[#fbf6ea]"
    >
      {/* Container project image */}
      <div className="absolute inset-0 overflow-hidden rounded-[12px]">
        {/* Original project image — vivid pigments, always visible underneath. */}
        <img className="absolute inset-0" src={card.project_image} />

        {/* Desaturation layer — cream wash with color blend. */}
        <div
          className="absolute inset-0 mix-blend-color"
          style={{ backgroundColor: CREAM }}
        />

        {/* Washes Multiplied — accent wash multiplied over the image. */}
        <img
          src={card.washes_image}
          className="absolute inset-0 opacity-70 mix-blend-multiply"
        />

        {/* Mask stack — Washes Multiplied + Noise + Desaturation. Fades on hover. */}
        <animated.div
          className="pointer-events-none absolute inset-0"
          style={{ opacity: maskStyle.opacity }}
        >
          {/* Original project image — vivid pigments, always visible underneath. */}
          <img className="absolute inset-0" src={card.project_image} />
        </animated.div>
      </div>
      {/* Text — slides up so the description comes into view on hover. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 px-[12px] pb-[12px]">
        <animated.div
          style={textStyle}
          className="flex flex-col text-[#fbf6ea]"
        >
          <h3 className="font-display text-[18px] leading-[36px]">{title}</h3>
          <animated.p
            ref={descRef}
            className="font-mono text-[16px] leading-[24px] text-[#fbf6ea]"
            style={{ opacity: maskStyle.opacity }}
          >
            {description}
          </animated.p>
        </animated.div>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Footer — testimonial + the "horse tab" that pulls out of the bottom edge.
// ---------------------------------------------------------------------------

function Footer(): React.ReactElement {
  return (
    <footer
      className="relative w-full overflow-hidden pt-[128px] pb-[144px] text-[#fbf6ea]"
      style={{ backgroundColor: DARK }}
    >
      <div className="mx-auto flex max-w-[560px] flex-col items-center gap-[16px] text-center">
        <p className="w-[504px] max-w-full">
          <span className="font-display block text-[24px] leading-[32px]">
            I love working with you, C.
          </span>
          <span className="font-body block text-[24px] leading-[32px]">
            You have an infectious energy and passion for what you do and you
            know how to push people in the right directions or advise them to
            get the best out of them.
          </span>
        </p>
        <p className="font-mono text-[16px] leading-[24px] opacity-75">
          <span className="block font-mono font-bold">
            Georgiana Ramona Turcsanyi
          </span>
          <span className="block">Senior Software Engineer</span>
        </p>
      </div>
    </footer>
  );
}

// Annotation (Horse Tab): "On Hover — 1. Tab pulls out 2. Ends at a slight
// angle 3. Uses a spring." The tab pokes up from below the page; hovering its
// visible lip pulls the body up with a spring, finishing tilted.
function HorseTab(): React.ReactElement {
  const [hovered, setHovered] = useState(false);
  const tabStyle = useSpring({
    transform: hovered
      ? "translateX(-50%) translateY(-525px) rotate(-3deg)"
      : "translateX(-50%) translateY(0px) rotate(0deg)",
    config: { tension: 180, friction: 15 },
  });
  return (
    <animated.div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      tabIndex={0}
      style={tabStyle}
      className="absolute -bottom-[625px] left-1/2 z-40 flex w-[201px] origin-bottom flex-col items-center gap-[28px] rounded-t-[8px] bg-black px-[20px] pt-[24px] pb-[144px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#fbf6ea]"
    >
      <div className="relative w-[154px] overflow-hidden rounded-[4px] border border-[#d4d4d4]">
        <div
          aria-hidden="true"
          className="h-full w-full"
          style={{
            background:
              "linear-gradient(160deg, #2b2b2b 0%, #4a4640 35%, #6b5f55 60%, #2a221c 100%)",
          }}
        />
        <img src="/images/Horse.png" aria-hidden="true" />
      </div>
      <p className="w-full -rotate-[0.5deg] text-center font-mono text-[12px] leading-[24px] text-[#fbf6ea]">
        “Let a horse whisper in your ear and breathe on your heart.
        <br />
        You will never regret&nbsp;it.”
        <br />— Author Unknown
      </p>
    </animated.div>
  );
}
