'use client';

import '../globals.css';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { animated, useSpring } from '@react-spring/web';
import type { PigmentOption, WashesInstance } from '../../lib/washes/washes.js';
import { Washes } from '../../lib/washes/washes.js';

// ---------------------------------------------------------------------------
// Pigments — the three primaries the design ships with. They drive the
// pigment selector, the per-card accent, and the active brush color.
// ---------------------------------------------------------------------------

type PigmentKey = 'rose' | 'yellow' | 'blue';

const PIGMENTS: Record<PigmentKey, { label: string; color: string }> = {
  rose: { label: 'Quinacridone Magenta', color: '#a50e53' },
  yellow: { label: 'Hansa Yellow', color: '#e3af08' },
  blue: { label: 'Cerulean Blue', color: '#108ba0' },
};
// Selector order, top → bottom, matches the Figma (magenta, yellow, blue).
const PIGMENT_ORDER: PigmentKey[] = ['rose', 'yellow', 'blue'];

const CREAM = '#fbf6ea';
const DARK = '#251900'; // the warm near-black the hero wash fades into

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
  { city: 'Saint Louis, MO', phrase: 'is where I’m based.', lat: 38.627, lon: -90.199, fallbackTemp: 72, fallbackWeather: 'sunny', fallbackOffsetSec: -18000 },
  { city: 'Prescott, AZ', phrase: 'is where I grew up.', lat: 34.54, lon: -112.468, fallbackTemp: 64, fallbackWeather: 'sunny', fallbackOffsetSec: -25200 },
  { city: 'Osaka, Japan', phrase: 'is where my heart is.', lat: 34.694, lon: 135.502, fallbackTemp: 70, fallbackWeather: 'cloudy', fallbackOffsetSec: 32400 },
  { city: 'Taipei, Taiwan', phrase: 'is where I could see myself living.', lat: 25.033, lon: 121.565, fallbackTemp: 81, fallbackWeather: 'rainy', fallbackOffsetSec: 28800 },
];

type WeatherKey = 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';
const WEATHER_PRESETS: Record<WeatherKey, { label: string; background: string; animation: string }> =
  {
    sunny: { label: 'sunny', background: 'dawn', animation: 'sunny' },
    cloudy: { label: 'cloudy', background: 'tornado', animation: 'partlyCloudy' },
    rainy: { label: 'rainy', background: 'dusk', animation: 'rainy' },
    stormy: { label: 'stormy', background: 'storm', animation: 'thunderstorm' },
    snowy: { label: 'snowy', background: 'night', animation: 'snowing' },
  };
const WEATHER_ORDER: WeatherKey[] = ['sunny', 'cloudy', 'rainy', 'stormy', 'snowy'];

// Map an Open-Meteo WMO weather code to one of our visualization presets.
function weatherFromCode(code: number): WeatherKey {
  if (code === 0) return 'sunny';
  if (code <= 48) return 'cloudy';
  if (code >= 71 && code <= 77) return 'snowy';
  if (code === 85 || code === 86) return 'snowy';
  if (code >= 95) return 'stormy';
  return 'rainy';
}

// ---------------------------------------------------------------------------
// Hero project cards — three overlapping watercolor cards. The watercolor is
// real pigment (a live Washes canvas) rather than a static screenshot, with a
// brush-stroke SVG traced onto each.
// ---------------------------------------------------------------------------

const HERO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-109.061 -9 2504.061 746.156"><g fill="none" stroke="#000" stroke-width="60" stroke-linecap="round"><path d="M-109.06 632.23C1.953 570.516 103.113 491.159 217.88 356.08 296 263.871 338 158.583 340 85.962 341 31.964 314.67-9 266-9c-54 0-88 40.964-109 134.995-23 103.341-40 221.921-83 602.161"/><path d="M78.215 690.995C100.229 497.473 184 356.156 291 356.156c64 0 104.675 51 93.125 124-6.501 43-14.038 87-22.819 138-10.235 64 19.02 114 107.656 114 129.263 0 270.282-71.834 342.45-183.094C836 511.156 846 477.156 847 444.156c1-60-33-105-93-105-76 0-134 86-134 196 0 118 64 201 199.918 201 184.806 0 389.507-221.848 483.563-469.423C1330.037 196.83 1340 131.921 1340 86.562c0-53.782-17-95.08-65-95.08-47 0-78 36.496-106 94.12-32.806 66.832-57.072 163.228-67 272.194-25 273.42 31 374.36 164.152 374.36 161.456 0 340.963-224.93 432.62-466.189C1725.037 196.83 1735 131.921 1735 86.562c0-53.782-17-95.08-65-95.08-47 0-78 36.496-106 94.12-32.806 66.832-57.072 163.228-67 272.194-25 273.42 31 374.36 149.906 374.36 118.718 0 183.209-103.485 221.873-213.371C1907 410.156 1954 343.156 2052 343.156c81 0 145 60 145 173 0 125-81.1 219-183.582 220-90.184 1-149.418-72-143.418-182 7-122 81-211 178-211 56 0 103.036 24.893 140 52 100.214 73.107 177.429 27.929 207-44.357"/></g></svg>`;

type HeroProject = {
  id: string;
  label: string;
  title: string;
  pigment: PigmentKey;
  cta: { text: string; variant: 'filled' | 'outline' };
  // Position inside the hero (Figma coordinates, hero-relative).
  left: number;
  top: number;
  rotation: number;
  z: number;
  bob: boolean; // Annotation: Project 01 "gently move up and down".
};

// Order matches the Figma stacking: the centre card (Project 01) sits highest
// and on top; the two flanking cards are lower and behind it.
const HERO_PROJECTS: HeroProject[] = [
  {
    id: 'proj-careSignal-ai',
    label: 'Project 02',
    title: 'Expressing the value\nof CareSignal AI',
    pigment: 'blue',
    cta: { text: 'View Project', variant: 'filled' },
    left: 198,
    top: 328,
    rotation: 1,
    z: 10,
    bob: false,
  },
  {
    id: 'proj-sol-lewitt',
    label: 'Project 03',
    title: 'Using ML to Conserve\nthe work of Sol LeWitt',
    pigment: 'rose',
    cta: { text: 'Coming Soon', variant: 'outline' },
    left: 807,
    top: 328,
    rotation: 1,
    z: 10,
    bob: false,
  },
  {
    id: 'proj-careSignal-ds',
    label: 'Project 01',
    title: 'Building CareSignal’s\nDesign System',
    pigment: 'yellow',
    cta: { text: 'View Project', variant: 'filled' },
    left: 504,
    top: 246,
    rotation: -1,
    z: 20,
    bob: true,
  },
];

// ---------------------------------------------------------------------------
// Lower sections — creative tools + UI experiments. Each card renders its
// imagery as a live Washes canvas tinted with the card's hue, masked by the
// three layers the Figma calls out (Washes Multiplied, Noise, Desaturation).
// ---------------------------------------------------------------------------

type ProjectCard = {
  id: string;
  title: string;
  description: string;
  pigment: PigmentKey;
  accent: PigmentKey;
};

const CREATIVE_CARDS: ProjectCard[] = [
  {
    id: 'creative-washes',
    title: 'Washes',
    description: 'a computational watercolor Javascript library',
    pigment: 'rose',
    accent: 'yellow',
  },
  {
    id: 'creative-confetti',
    title: 'Confetti',
    description: 'a playful SVG sprinkle engine for celebratory UI',
    pigment: 'yellow',
    accent: 'blue',
  },
  {
    id: 'creative-facets',
    title: 'Facets',
    description: 'codify your taste with a compound AI tool',
    pigment: 'blue',
    accent: 'rose',
  },
];

const EXPERIMENT_CARDS: ProjectCard[] = [
  {
    id: 'experiment-sandy',
    title: 'Sandy',
    description: "A 3D visualization of Dave Long's esolang, Calder.",
    pigment: 'rose',
    accent: 'blue',
  },
  {
    id: 'experiment-rain-check',
    title: 'Rain Check',
    description: 'Thoughtful declines to events.',
    pigment: 'blue',
    accent: 'rose',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

// `onCardClick` is forwarded to the hero project cards so a host wrapper can
// swap to a project view on click. Optional — the page works standalone.
type LandingPageProps = { onCardClick?: (id: string) => void };

export default function LandingPage({ onCardClick }: LandingPageProps = {}): React.ReactElement {
  return (
    <div className="font-body w-full text-[#fbf6ea]" style={{ backgroundColor: DARK }}>
      <Hero onCardClick={onCardClick} />
      <CreativeToolsSection />
      <Footer />
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
const BRUSH_DEFAULT = 64; // matches the 64px Brush Indicator in the Figma

function Hero({ onCardClick }: { onCardClick?: (id: string) => void }): React.ReactElement {
  const heroCanvasRef = useRef<HTMLDivElement | null>(null);
  const heroWashRef = useRef<WashesInstance | null>(null);

  const [activePigment, setActivePigment] = useState<PigmentKey>('rose');
  const [locationIdx, setLocationIdx] = useState(0);
  const [weather, setWeather] = useState<WeatherKey>('sunny');
  const [temp, setTemp] = useState(72);
  // The clock shows the *selected location's* local time. `tzOffsetSec` is the
  // location's UTC offset (from Open-Meteo); null until the first fetch lands,
  // in which case we fall back to the viewer's own local time.
  const [tzOffsetSec, setTzOffsetSec] = useState<number | null>(null);
  const [time, setTime] = useState(() => formatClock(null));
  const [canvasVisible, setCanvasVisible] = useState(true);

  // Annotation (Brush Indicator): follows the mouse; `[` / `]` adjust the
  // brush size; the indicator scales with the brush and recolors to the
  // active pigment.
  const [brushSize, setBrushSize] = useState(BRUSH_DEFAULT);
  const [brushCursor, setBrushCursor] = useState<{ x: number; y: number; visible: boolean }>({
    x: 1093 + 32,
    y: 37 + 32,
    visible: false,
  });

  const location = LOCATIONS[locationIdx];

  // Annotation (Weather selector): "Use Open Meteo API to pull in data." We
  // fetch the current temperature + weather code and translate the code into
  // one of our visualization presets. Falls back to the location's defaults
  // if the network is unavailable.
  const refreshWeather = useCallback(async (loc: LocationInfo) => {
    try {
      // `timezone=auto` makes Open-Meteo resolve the location's timezone and
      // return its DST-correct `utc_offset_seconds`, which drives the clock.
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}` +
        `&current=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as {
        utc_offset_seconds?: number;
        current?: { temperature_2m?: number; weather_code?: number };
      };
      const t = data.current?.temperature_2m;
      const code = data.current?.weather_code;
      const off = data.utc_offset_seconds;
      setTemp(typeof t === 'number' ? Math.round(t) : loc.fallbackTemp);
      setWeather(typeof code === 'number' ? weatherFromCode(code) : loc.fallbackWeather);
      setTzOffsetSec(typeof off === 'number' ? off : loc.fallbackOffsetSec);
    } catch {
      setTemp(loc.fallbackTemp);
      setWeather(loc.fallbackWeather);
      setTzOffsetSec(loc.fallbackOffsetSec);
    }
  }, []);

  // Bootstrap the hero wash. Annotation (Visualization Evolution) pins the
  // Washes.js settings: paint load 0.15, water load 8.0, evaporation 4.0,
  // resolution (scale) 1.75, closed-gravity edges pulling down, fading
  // painting with a 4s half-life. The "sunny weather preset" seeds it.
  useEffect(() => {
    const host = heroCanvasRef.current;
    if (!host) return;

    const wash = Washes.create(host, { cursorPreview: false, pointer: true, scale: 1.75 });
    heroWashRef.current = wash;
    (window as unknown as Record<string, WashesInstance>).Wash_hero = wash;

    if (wash.webglAvailable()) wash.webgl(false);
    wash.paperColor(251 / 255, 246 / 255, 234 / 255);
    wash.gouacheMode('auto');
    wash.paperWetness('damp');
    wash.paintLoad(0.15);
    wash.waterLoad(8.0);
    wash.evaporation(4.0);
    wash.brushSize(BRUSH_DEFAULT);
    wash.edgeMode('closed-gravity');
    wash.gravityDirection('down');
    wash.gravityStrength(0.2);
    wash.edgeFade(24);
    wash.fadeHalfLife(4000);
    wash.fadePainting(0.05);
    wash.pigment('rose' as PigmentOption);
    wash.setBackground(WEATHER_PRESETS.sunny.background);
    wash.setAnimation(WEATHER_PRESETS.sunny.animation);

    const canvasEl = (wash as unknown as { canvas: HTMLCanvasElement }).canvas;
    if (canvasEl) {
      canvasEl.style.cursor = 'crosshair';
      canvasEl.style.backgroundColor = `rgb(251,246,234)`;
    }

    // Pull live weather for the default location (Open-Meteo, keyless).
    void refreshWeather(LOCATIONS[0]);

    return () => {
      try {
        wash.destroy();
      } catch {
        /* ignore */
      }
      heroWashRef.current = null;
      delete (window as unknown as Record<string, WashesInstance | undefined>).Wash_hero;
    };
  }, [refreshWeather]);

  // Keep the live clock ticking, in the selected location's timezone.
  useEffect(() => {
    setTime(formatClock(tzOffsetSec));
    const id = window.setInterval(() => setTime(formatClock(tzOffsetSec)), 30_000);
    return () => window.clearInterval(id);
  }, [tzOffsetSec]);

  // Re-apply pigment whenever it changes (selector, or a card hand-off).
  useEffect(() => {
    heroWashRef.current?.pigment(activePigment as PigmentOption);
  }, [activePigment]);

  // Re-seed the visualization when the weather preset changes.
  useEffect(() => {
    const wash = heroWashRef.current;
    if (!wash) return;
    wash.setBackground(WEATHER_PRESETS[weather].background);
    wash.setAnimation(WEATHER_PRESETS[weather].animation);
  }, [weather]);

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
      setBrushCursor({ x, y, visible: inside });
    };
    const onMove = (e: PointerEvent) => {
      pending = e;
      if (!rafId) rafId = window.requestAnimationFrame(handle);
    };
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      if (e.key === '[') {
        e.preventDefault();
        setBrushSize((s) => Math.max(BRUSH_MIN, s - BRUSH_STEP));
      } else if (e.key === ']') {
        e.preventDefault();
        setBrushSize((s) => Math.min(BRUSH_MAX, s + BRUSH_STEP));
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('keydown', onKey);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  // Annotation (Location selector): clicking resets the canvas — fade it out,
  // re-seed under the new weather, then fade back in.
  const cycleLocation = useCallback(() => {
    setCanvasVisible(false);
    const nextIdx = (locationIdx + 1) % LOCATIONS.length;
    window.setTimeout(() => {
      setLocationIdx(nextIdx);
      void refreshWeather(LOCATIONS[nextIdx]);
      const wash = heroWashRef.current;
      if (wash) {
        // Re-trigger the time-wash so the canvas visibly "resets".
        const w = LOCATIONS[nextIdx].fallbackWeather;
        wash.setBackground(WEATHER_PRESETS[w].background);
        wash.setAnimation(WEATHER_PRESETS[w].animation);
      }
      setCanvasVisible(true);
    }, 260);
  }, [locationIdx, refreshWeather]);

  const cycleWeather = useCallback(() => {
    setWeather((prev) => WEATHER_ORDER[(WEATHER_ORDER.indexOf(prev) + 1) % WEATHER_ORDER.length]);
  }, []);

  const cyclePigment = useCallback(() => {
    setActivePigment(
      (prev) => PIGMENT_ORDER[(PIGMENT_ORDER.indexOf(prev) + 1) % PIGMENT_ORDER.length]
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
    [onCardClick]
  );

  const activeColor = PIGMENTS[activePigment].color;

  return (
    <>
      <section
        className="relative mx-auto h-[728px] w-full max-w-[1280px] overflow-hidden"
        style={{ backgroundColor: DARK }}
      >
        {/* Live watercolor band — top 437px. Fades out/in on location reset. */}
        <div
          className="absolute top-0 left-0 h-[437px] w-full select-none transition-opacity duration-200 ease-out"
          style={{ opacity: canvasVisible ? 1 : 0 }}
        >
          <div ref={heroCanvasRef} className="absolute inset-0" aria-hidden="true" />
        </div>

        {/* Connecting Gradient — fades the wash band into the dark page using
            the two stacked layers from the Figma, both bottom-aligned to the
            437px wash band (so they end exactly where the section's #251900
            background takes over). */}
        {/* Radial Gradient (583:21712) — a dark pool at the bottom-centre:
            an ellipse (rx 854 / ry 253) of #251900 fading to transparent. */}
        <div
          className="pointer-events-none absolute inset-x-0 top-[97px] h-[340px]"
          style={{
            background:
              'radial-gradient(ellipse 854px 253px at 50% 100%, rgba(37,25,0,1) 0%, rgba(37,25,0,0) 100%)',
          }}
        />
        {/* Linear Gradient (583:21713) — transparent → #251900, top to bottom,
            layered over the radial. */}
        <div
          className="pointer-events-none absolute inset-x-0 top-[146px] h-[291px]"
          style={{
            background: `linear-gradient(to bottom, rgba(37,25,0,0) 0%, ${DARK} 100%)`,
          }}
        />

        {/* Radial gradient to improve blurb legibility. */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[304px]"
          style={{
            background:
              'radial-gradient(82% 100% at 50% 0%, rgba(255,251,240,0.5) 0%, rgba(255,251,240,0) 70%)',
          }}
        />

        {/* Intro blurb. */}
        <div className="pointer-events-none absolute top-[80px] left-1/2 flex w-[420px] -translate-x-1/2 flex-col items-center gap-[8px] text-center leading-[24px] text-black">
          <p className="font-display text-[24px]">I’m C Stavridis,</p>
          <p className="font-body text-[18px] leading-[24px]">
            an AI-Native Design Engineer who loves turning complex ideas into warm, approachable
            products.
          </p>
        </div>

        {/* Project cards. */}
        {HERO_PROJECTS.map((project) => (
          <HeroProjectCard
            key={project.id}
            project={project}
            onClick={() => handleCardClick(project)}
            onActivate={() => setActivePigment(project.pigment)}
          />
        ))}

        {/* Pigment selector — vertical, right edge. */}
        <PigmentSelector
          active={activePigment}
          onSelect={setActivePigment}
          onPaintbrushClick={cyclePigment}
        />

        {/* Brush indicator. */}
        <BrushIndicator cursor={brushCursor} size={brushSize} color={activeColor} />
      </section>

      {/* Preset widget — centered on the dark band below the hero. */}
      <div className="flex w-full justify-center" style={{ backgroundColor: DARK }}>
        <PresetWidget
          location={location}
          time={time}
          temperature={temp}
          weather={weather}
          onLocation={cycleLocation}
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
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
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
      className="absolute top-[173px] right-[8px] z-30 flex w-[22px] flex-col items-center gap-[10px] rounded-[12px] py-[8px] backdrop-blur-[2px]"
      style={{ backgroundColor: `${activeColor}59` }}
    >
      <button
        type="button"
        onClick={onPaintbrushClick}
        aria-label="Cycle active pigment"
        className="flex h-[14px] w-[14px] items-center justify-center"
        style={{ color: activeColor }}
      >
        {/* Paint brush glyph (heroicons "paint-brush"). */}
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-[13px] w-[13px]" aria-hidden="true">
          <path d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128zM18.42 5.547a4.498 4.498 0 0 0-3.187 2.137l-2.388 4.005a15.79 15.79 0 0 1 3.467 2.067l3.087-2.667a4.5 4.5 0 0 0-.98-5.542z" />
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
            outline: active === key ? `2px solid ${CREAM}` : 'none',
            outlineOffset: active === key ? '1.5px' : '0',
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
        willChange: 'transform, opacity',
      }}
      aria-hidden="true"
    />
  );
}

// ---------------------------------------------------------------------------
// Preset widget
// ---------------------------------------------------------------------------

function PresetWidget({
  location,
  time,
  temperature,
  weather,
  onLocation,
  onWeather,
}: {
  location: LocationInfo;
  time: string;
  temperature: number;
  weather: WeatherKey;
  onLocation: () => void;
  onWeather: () => void;
}): React.ReactElement {
  return (
    <div className="font-mono flex flex-col items-center gap-[6px] pt-[12px] text-[12px] leading-[24px] opacity-60">
      <div className="flex items-center gap-[6px]">
        <PresetBug
          background="rgba(121,96,54,0.5)"
          onClick={onLocation}
          label={`Change location (currently ${location.city})`}
        >
          {location.city}
        </PresetBug>
        <span className="mix-blend-difference text-[#fbf6ea]">{location.phrase}</span>
      </div>
      <div className="flex items-center gap-[6px]">
        <span className="mix-blend-difference text-[#fbf6ea]">It’s currently</span>
        <span className="rounded-[4px] bg-[#4f3d1b] px-[8px] text-[#fbf6ea]">{time}</span>
        <span className="mix-blend-difference text-[#fbf6ea]">{temperature}°F and</span>
        <PresetBug
          background="#4f3d1b"
          onClick={onWeather}
          label={`Change weather (currently ${WEATHER_PRESETS[weather].label})`}
        >
          {WEATHER_PRESETS[weather].label}
        </PresetBug>
        <span className="mix-blend-difference text-[#fbf6ea]">.</span>
      </div>
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
      className="font-mono inline-flex items-center rounded-[4px] px-[8px] text-[12px] leading-[24px] text-[#fbf6ea] transition-transform hover:-translate-y-[1px]"
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

function HeroProjectCard({
  project,
  onClick,
  onActivate,
}: {
  project: HeroProject;
  onClick: () => void;
  onActivate: () => void;
}): React.ReactElement {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const washRef = useRef<WashesInstance | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const wash = Washes.create(host, { cursorPreview: false, pointer: false });
    washRef.current = wash;

    if (wash.webglAvailable()) wash.webgl(false);
    wash.paperColor(251 / 255, 246 / 255, 234 / 255);
    wash.gouacheMode('auto');
    wash.scale(4);
    wash.paperWetness('boneDry');
    wash.paintLoad(3);
    wash.waterLoad(0.2);
    wash.pigment(project.pigment as PigmentOption);

    const canvasEl = (wash as unknown as { canvas: HTMLCanvasElement }).canvas;
    if (canvasEl) canvasEl.style.backgroundColor = `rgb(251,246,234)`;

    // Trace once layout settles. Annotation: the SVG is "instantly on" — no
    // animated reveal — so `animate: false`.
    const tracer = window.setTimeout(() => {
      wash.traceSVG(HERO_SVG, { flipY: false, animate: false });
    }, 80);

    return () => {
      window.clearTimeout(tracer);
      try {
        wash.cancelSVGTrace();
        wash.destroy();
      } catch {
        /* ignore */
      }
      washRef.current = null;
    };
  }, [project.id, project.pigment]);

  const cta = project.cta;
  const ctaColor = PIGMENTS[project.pigment].color;

  // On click, deluge this card's own canvas from the cursor's position, then
  // hand off to the parent (pigment update + page transition for linked cards).
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const host = hostRef.current;
      const wash = washRef.current;
      if (host && wash) {
        const rect = host.getBoundingClientRect();
        // Keyboard-activated clicks report (0,0); fall back to the card centre.
        const fromKeyboard = e.detail === 0;
        const x = fromKeyboard ? rect.width / 2 : e.clientX - rect.left;
        const y = fromKeyboard ? rect.height / 2 : e.clientY - rect.top;
        wash.pigment(project.pigment as PigmentOption);
        wash.splash([{ x, y, velocity: 64 }], 'deluge', {
          radius: rect.width * 0.7,
          pressure: 92,
          liftRate: 0.96,
        });
      }
      onClick();
    },
    [project.pigment, onClick]
  );

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
      <div className={project.bob ? 'animate-[card-bob_6s_ease-in-out_infinite]' : undefined}>
        <button
          type="button"
          onClick={handleClick}
          onMouseEnter={onActivate}
          onFocus={onActivate}
          className="group relative flex w-[272px] cursor-pointer flex-col items-center gap-[24px] overflow-hidden rounded-[12px] px-[24px] pt-[24px] pb-[36px] text-left transition-transform hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#fbf6ea]"
          style={{ backgroundColor: CREAM }}
        >
          <div
            ref={hostRef}
            className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[12px] opacity-70 mix-blend-luminosity"
            aria-hidden="true"
          />
          <div className="relative z-10 flex w-full flex-col gap-[24px]">
            <p className="font-mono mix-blend-difference text-[12px] leading-[24px] text-[#7d7d7d]">
              {project.label}
            </p>
            <p
              className="font-body text-[18px] leading-[24px] whitespace-pre-line text-black"
              style={{ minHeight: '202px' }}
            >
              {project.title}
            </p>
            {cta.variant === 'filled' ? (
              <div
                className="font-mono flex h-[36px] w-[180px] items-center justify-center rounded-[4px] text-[12px] leading-[24px] transition-[filter] group-hover:brightness-110"
                style={{
                  backgroundColor: ctaColor,
                  color: project.pigment === 'yellow' ? '#100e08' : CREAM,
                }}
              >
                {cta.text}
              </div>
            ) : (
              <div
                className="font-mono flex h-[36px] w-[180px] items-center justify-center rounded-[4px] border text-[12px] leading-[24px] text-black opacity-75"
                style={{ borderColor: ctaColor }}
              >
                {cta.text}
              </div>
            )}
          </div>
        </button>
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
        <div className="px-[144px] pt-[144px]">
          <p className="font-mono text-[12px] leading-[24px] text-[#fbf6ea]/80">
            AI-Native Creative Tools
          </p>
          <div className="mt-[24px] flex flex-wrap justify-center gap-[64px]">
            {CREATIVE_CARDS.map((card) => (
              <RevealCard key={card.id} width={272} height={182} card={card} scale={3} />
            ))}
          </div>
        </div>

        {/* UI Experiments */}
        <div className="px-[192px] pt-[64px] pb-[120px]">
          <p className="font-mono text-[12px] leading-[24px] text-[#fbf6ea]/80">UI Experiments</p>
          <div className="mt-[24px] flex flex-wrap justify-center gap-[64px]">
            {EXPERIMENT_CARDS.map((card) => (
              <RevealCard key={card.id} width={416} height={275} card={card} scale={2.5} />
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
  scale,
}: {
  width: number;
  height: number;
  card: ProjectCard;
  scale: number;
}): React.ReactElement {
  const { title, description, pigment, accent } = card;
  const imageHostRef = useRef<HTMLDivElement | null>(null);
  const descRef = useRef<HTMLParagraphElement | null>(null);
  const [hovered, setHovered] = useState(false);

  // Distance the text block hides below the fold while inactive: the
  // description height + the 4px gap + the 12px bottom padding.
  const GAP_PX = 4;
  const PB_PX = 12;
  const [hideDistance, setHideDistance] = useState(24 + GAP_PX + PB_PX);

  useLayoutEffect(() => {
    if (descRef.current) setHideDistance(descRef.current.offsetHeight + GAP_PX + PB_PX);
  }, [description]);

  // The "original project image" — vivid live wash, stays visible.
  useEffect(() => {
    const host = imageHostRef.current;
    if (!host) return;
    const wash = Washes.create(host, { cursorPreview: false, pointer: false });
    if (wash.webglAvailable()) wash.webgl(false);
    wash.paperColor(251 / 255, 246 / 255, 234 / 255);
    wash.gouacheMode('auto');
    wash.scale(scale);
    wash.paperWetness('damp');
    wash.fadePainting(0);

    const canvasEl = (wash as unknown as { canvas: HTMLCanvasElement }).canvas;
    if (canvasEl) canvasEl.style.backgroundColor = `rgb(251,246,234)`;

    const t1 = window.setTimeout(() => {
      const rect = host.getBoundingClientRect();
      wash.pigment(pigment as PigmentOption);
      wash.splash([{ x: rect.width * 0.3, y: rect.height * 0.45, velocity: 55 }], 'deluge', {
        radius: rect.width * 0.65,
        pressure: 85,
        liftRate: 0.97,
      });
    }, 60);
    const t2 = window.setTimeout(() => {
      const rect = host.getBoundingClientRect();
      wash.pigment(accent as PigmentOption);
      wash.splash([{ x: rect.width * 0.75, y: rect.height * 0.55, velocity: 50 }], 'splash', {
        radius: rect.width * 0.55,
        pressure: 70,
        liftRate: 0.97,
      });
    }, 360);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      try {
        wash.destroy();
      } catch {
        /* ignore */
      }
    };
  }, [pigment, accent, scale]);

  // Mask layers fade out together on hover; text slides up.
  const maskStyle = useSpring({
    opacity: hovered ? 0 : 1,
    config: { tension: 200, friction: 26 },
  });
  const textStyle = useSpring({
    transform: hovered ? 'translateY(0px)' : `translateY(${hideDistance}px)`,
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
      className="relative isolate overflow-hidden rounded-[12px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#fbf6ea]"
    >
      {/* Original project image — vivid pigments, always visible underneath. */}
      <div
        ref={imageHostRef}
        className="absolute inset-0 overflow-hidden rounded-[12px]"
        style={{ backgroundColor: CREAM }}
        aria-hidden="true"
      />

      {/* Mask stack — Washes Multiplied + Noise + Desaturation. Fades on hover. */}
      <animated.div
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[12px]"
        style={{ opacity: maskStyle.opacity }}
      >
        {/* Washes Multiplied — accent wash multiplied over the image. */}
        <div
          className="absolute inset-0 opacity-70 mix-blend-multiply"
          style={{
            background: `radial-gradient(120% 120% at 35% 40%, ${PIGMENTS[accent].color} 0%, ${PIGMENTS[pigment].color} 70%)`,
          }}
        />
        {/* Noise layer. */}
        <div
          className="absolute inset-0 mix-blend-overlay"
          style={{
            opacity: 0.4,
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.98 0 0 0 0 0.96 0 0 0 0 0.91 0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
            backgroundSize: '160px 160px',
          }}
        />
        {/* Desaturation layer — cream wash with color blend. */}
        <div className="absolute inset-0 mix-blend-color" style={{ backgroundColor: CREAM }} />
      </animated.div>

      {/* Bottom gradient keeps the text legible over any pigment. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[80px]"
        style={{
          background:
            'linear-gradient(to top, #211e1f 0%, rgba(33,30,31,0.5) 50%, rgba(33,30,31,0) 100%)',
        }}
      />

      {/* Text — slides up so the description comes into view on hover. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 px-[12px] pb-[12px]">
        <animated.div style={textStyle} className="flex flex-col gap-[4px] text-[#fbf6ea]">
          <h3 className="font-display text-[18px] leading-[24px]">{title}</h3>
          <p ref={descRef} className="font-mono text-[16px] leading-[24px] text-[#fbf6ea]">
            {description}
          </p>
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
            You have an infectious energy and passion for what you do and you know how to push people
            in the right directions or advise them to get the best out of them.
          </span>
        </p>
        <p className="font-mono text-[16px] leading-[24px] opacity-75">
          <span className="font-mono block font-bold">Georgiana Ramona Turcsanyi</span>
          <span className="block">Senior Software Engineer</span>
        </p>
      </div>
      <HorseTab />
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
      ? 'translateX(-50%) translateY(-430px) rotate(-3deg)'
      : 'translateX(-50%) translateY(0px) rotate(0deg)',
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
      className="absolute -bottom-[490px] left-1/2 flex w-[201px] origin-bottom flex-col items-center gap-[28px] rounded-t-[8px] bg-black px-[20px] pt-[24px] pb-[36px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#fbf6ea]"
    >
      <div className="relative h-[339px] w-[154px] overflow-hidden rounded-[4px] border border-[#d4d4d4]">
        <div
          aria-hidden="true"
          className="h-full w-full"
          style={{
            background: 'linear-gradient(160deg, #2b2b2b 0%, #4a4640 35%, #6b5f55 60%, #2a221c 100%)',
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-[4px]"
          style={{ backgroundColor: 'rgba(251,246,234,0.2)' }}
        />
      </div>
      <p className="font-mono w-full -rotate-[0.5deg] text-center text-[12px] leading-[24px] text-[#fbf6ea]">
        “Let a horse whisper in your ear and breathe on your heart.
        <br />
        You will never regret it.”
        <br />— Author Unknown
      </p>
    </animated.div>
  );
}
