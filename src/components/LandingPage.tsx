'use client';

import '../globals.css';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { animated, useSpring } from '@react-spring/web';
import { useLocation } from 'wouter';
import type { PigmentOption, WashesInstance } from '../../lib/washes/washes.js';
import { Washes } from '../../lib/washes/washes.js';
import { routes } from '../routes.js';

// ---------------------------------------------------------------------------
// Pigments — the three primaries the lib ships with. These drive both the
// pigment selector in the hero and the per-card accent + brush trace.
// ---------------------------------------------------------------------------

type PigmentKey = 'rose' | 'yellow' | 'blue';

const PIGMENTS: Record<PigmentKey, { label: string; color: string; ring: string }> = {
  rose: { label: 'Quinacridone Magenta', color: '#a50e53', ring: 'rgba(165,14,83,0.5)' },
  yellow: { label: 'Hansa Yellow', color: '#e3af08', ring: 'rgba(227,175,8,0.5)' },
  blue: { label: 'Cerulean Blue', color: '#108ba0', ring: 'rgba(16,139,160,0.5)' },
};
const PIGMENT_ORDER: PigmentKey[] = ['rose', 'yellow', 'blue'];

// ---------------------------------------------------------------------------
// Hero "preset widget" state — the saint-louis weather line at the bottom of
// the hero doubles as a way to swap the background visualization. Each
// segment ("location", "temp", "weather") is interactive: clicking cycles
// through the available options, which retriggers the time-wash background.
// ---------------------------------------------------------------------------

type WeatherKey = 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';
const WEATHER_PRESETS: Record<WeatherKey, { label: string; background: string; animation: string }> =
  {
    sunny: { label: 'sunny', background: 'dawn', animation: 'sunny' },
    cloudy: { label: 'cloudy', background: 'tornado', animation: 'partlyCloudy' },
    rainy: { label: 'rainy', background: 'dawn', animation: 'rainy' },
    stormy: { label: 'stormy', background: 'tornado', animation: 'thunderstorm' },
    snowy: { label: 'snowy', background: 'night', animation: 'snowing' },
  };
const WEATHER_ORDER: WeatherKey[] = ['sunny', 'cloudy', 'rainy', 'stormy', 'snowy'];

const LOCATIONS = ['saint louis, mo', 'brooklyn, ny', 'austin, tx', 'tokyo, jp', 'lisbon, pt'];
const TEMPS = [72, 65, 58, 52, 28];

// ---------------------------------------------------------------------------
// Hero project cards — the three overlapping watercolor cards. The SVG trace
// is the existing portfolio's "watercolor cursive" — used as a visible brush
// stroke on each card's surface.
// ---------------------------------------------------------------------------

const HERO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-109.061 -9 2504.061 746.156"><g fill="none" stroke="#000" stroke-width="60" stroke-linecap="round"><path d="M-109.06 632.23C1.953 570.516 103.113 491.159 217.88 356.08 296 263.871 338 158.583 340 85.962 341 31.964 314.67-9 266-9c-54 0-88 40.964-109 134.995-23 103.341-40 221.921-83 602.161"/><path d="M78.215 690.995C100.229 497.473 184 356.156 291 356.156c64 0 104.675 51 93.125 124-6.501 43-14.038 87-22.819 138-10.235 64 19.02 114 107.656 114 129.263 0 270.282-71.834 342.45-183.094C836 511.156 846 477.156 847 444.156c1-60-33-105-93-105-76 0-134 86-134 196 0 118 64 201 199.918 201 184.806 0 389.507-221.848 483.563-469.423C1330.037 196.83 1340 131.921 1340 86.562c0-53.782-17-95.08-65-95.08-47 0-78 36.496-106 94.12-32.806 66.832-57.072 163.228-67 272.194-25 273.42 31 374.36 164.152 374.36 161.456 0 340.963-224.93 432.62-466.189C1725.037 196.83 1735 131.921 1735 86.562c0-53.782-17-95.08-65-95.08-47 0-78 36.496-106 94.12-32.806 66.832-57.072 163.228-67 272.194-25 273.42 31 374.36 149.906 374.36 118.718 0 183.209-103.485 221.873-213.371C1907 410.156 1954 343.156 2052 343.156c81 0 145 60 145 173 0 125-81.1 219-183.582 220-90.184 1-149.418-72-143.418-182 7-122 81-211 178-211 56 0 103.036 24.893 140 52 100.214 73.107 177.429 27.929 207-44.357"/></g></svg>`;

type HeroProject = {
  id: string;
  label: string;
  title: string;
  pigment: PigmentKey;
  rotation: number;
  offsetX: number;
  offsetY: number;
};

const HERO_PROJECTS: HeroProject[] = [
  {
    id: 'proj-careSignal-ds',
    label: 'Project 02',
    title: "Building CareSignal's\nDesign System",
    pigment: 'blue',
    rotation: 1,
    offsetX: -290,
    offsetY: 42,
  },
  {
    id: 'proj-careSignal-ai',
    label: 'Project 01',
    title: 'Expressing the value\nof CareSignal AI',
    pigment: 'yellow',
    rotation: -1,
    offsetX: 0,
    offsetY: 0,
  },
  {
    id: 'proj-sol-lewitt',
    label: 'Project 03',
    title: 'Using ML to Conserve\nthe work of Sol LeWitt',
    pigment: 'rose',
    rotation: 1,
    offsetX: 290,
    offsetY: 42,
  },
];

// ---------------------------------------------------------------------------
// Lower sections — creative tools + experiments. Each card is rendered as a
// little Washes canvas tinted with the card's intended hue, so the watercolor
// background is real pigment instead of a static screenshot.
// ---------------------------------------------------------------------------

type CreativeCard = {
  id: string;
  title: string;
  description: string;
  pigment: PigmentKey;
  accent: PigmentKey;
};

const CREATIVE_CARDS: CreativeCard[] = [
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

type ExperimentCard = {
  id: string;
  title: string;
  description: string;
  pigment: PigmentKey;
  accent: PigmentKey;
};

const EXPERIMENT_CARDS: ExperimentCard[] = [
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

// `onCardClick` is forwarded to the hero project cards so the (legacy)
// PageTransitionWrapper can swap to a project view on click. Optional —
// the LandingPage works standalone when omitted.
type LandingPageProps = { onCardClick?: (id: string) => void };

export default function LandingPage({ onCardClick }: LandingPageProps = {}): React.ReactElement {
  return (
    <div className="font-body bg-cream-50 text-synthetic-black w-full">
      <Hero onCardClick={onCardClick} />
      <CreativeToolsSection />
      <ExperimentsSection />
      <Footer />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

function Hero({ onCardClick }: { onCardClick?: (id: string) => void }): React.ReactElement {
  const heroCanvasRef = useRef<HTMLDivElement | null>(null);
  const heroWashRef = useRef<WashesInstance | null>(null);
  const [, setLocation] = useLocation();

  const [activePigment, setActivePigment] = useState<PigmentKey>('rose');
  const [locationIdx, setLocationIdx] = useState(0);
  const [tempIdx, setTempIdx] = useState(0);
  const [weather, setWeather] = useState<WeatherKey>('sunny');

  // Annotation (Brush Indicator): "Brush indicator should follow mouse —
  // adjust size with [ ] keys; the indicator scales with the brush." We
  // hold both pieces of state here so the visible ring and the underlying
  // Washes brush stay in sync.
  const BRUSH_MIN = 12;
  const BRUSH_MAX = 240;
  const BRUSH_STEP = 8;
  const [brushSize, setBrushSize] = useState(64);
  const [brushCursor, setBrushCursor] = useState<{ x: number; y: number; visible: boolean }>({
    x: 1125,
    y: 69,
    visible: false,
  });

  // Bootstrap the hero's full-bleed wash. The background is a "dawn" time-
  // wash (cerulean → rose → yellow gradient — the warm "sunny weather
  // preset" the Figma calls out) paired with the matching atmospheric
  // animation for the active weather key. We let the user repaint over it
  // with the active pigment.
  useEffect(() => {
    const host = heroCanvasRef.current;
    if (!host) return;

    const wash = Washes.create(host, {
      cursorPreview: false,
      pointer: true,
    });
    heroWashRef.current = wash;
    (window as unknown as Record<string, WashesInstance>).Wash_hero = wash;

    if (wash.webglAvailable()) wash.webgl(false);
    wash.paperColor(251 / 255, 246 / 255, 234 / 255);
    wash.gouacheMode('auto');
    wash.paperWetness('damp');
    wash.fadePainting(0);
    wash.pigment(activePigment as PigmentOption);
    wash.setBackground(WEATHER_PRESETS[weather].background);
    wash.setAnimation(WEATHER_PRESETS[weather].animation);

    const canvasEl = (wash as unknown as { canvas: HTMLCanvasElement }).canvas;
    if (canvasEl) {
      canvasEl.style.cursor = 'crosshair';
      canvasEl.style.backgroundColor = 'rgb(251,246,234)';
    }

    return () => {
      try {
        wash.destroy();
      } catch {
        /* ignore */
      }
      heroWashRef.current = null;
      delete (window as unknown as Record<string, WashesInstance | undefined>).Wash_hero;
    };
  }, []);

  // Re-apply pigment whenever the user toggles the swatch.
  useEffect(() => {
    heroWashRef.current?.pigment(activePigment as PigmentOption);
  }, [activePigment]);

  // Re-trigger the weather visualization when the preset bug is clicked.
  useEffect(() => {
    const wash = heroWashRef.current;
    if (!wash) return;
    wash.setBackground(WEATHER_PRESETS[weather].background);
    wash.setAnimation(WEATHER_PRESETS[weather].animation);
  }, [weather]);

  // Brush size <-> Washes lib sync. The visible indicator scales from this
  // same value, so the on-screen circle always matches the actual brush.
  useEffect(() => {
    heroWashRef.current?.brushSize(brushSize);
  }, [brushSize]);

  // Mouse-follow + [ ] keyboard resize. Pointermove is bound to window
  // because the Washes canvas captures pointer events for painting; the
  // host div's listener wouldn't fire reliably during a stroke.
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
      // Ignore when the user is typing in an input.
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

  const cyclePigment = useCallback(() => {
    setActivePigment((prev) => {
      const next = PIGMENT_ORDER[(PIGMENT_ORDER.indexOf(prev) + 1) % PIGMENT_ORDER.length];
      return next;
    });
  }, []);

  const cycleWeather = useCallback(() => {
    setWeather((prev) => WEATHER_ORDER[(WEATHER_ORDER.indexOf(prev) + 1) % WEATHER_ORDER.length]);
  }, []);

  const cycleLocation = useCallback(() => {
    setLocationIdx((i) => (i + 1) % LOCATIONS.length);
  }, []);

  const cycleTemp = useCallback(() => {
    setTempIdx((i) => (i + 1) % TEMPS.length);
  }, []);

  const handleCardClick = useCallback(
    (cardId: string, cardPigment: PigmentKey) => {
      const wash = heroWashRef.current;
      if (wash) {
        const canvasEl = (wash as unknown as { canvas: HTMLCanvasElement }).canvas;
        if (canvasEl) {
          const rect = canvasEl.getBoundingClientRect();
          wash.pigment(cardPigment as PigmentOption);
          wash.splash([{ x: rect.width / 2, y: rect.height / 2, velocity: 60 }], 'deluge', {
            radius: 360,
            pressure: 90,
            liftRate: 0.96,
          });
        }
      }
      // Route to the project page after the splash animation kicks off.
      // Other agents own the other two project cards' navigation.
      if (cardId === 'proj-sol-lewitt') {
        window.setTimeout(() => setLocation(routes.projectSolLewitt.href()), 600);
      }
      onCardClick?.(cardId);
    },
    [onCardClick, setLocation]
  );

  const activeColor = PIGMENTS[activePigment].color;
  const activeRing = PIGMENTS[activePigment].ring;
  const localTime = useMemo(() => formatLocalTime(), []);

  return (
    <section className="relative w-full overflow-hidden bg-[#fbf6ea]">
      <div className="relative mx-auto h-[752px] w-full max-w-[1280px]">
        {/* Washes background canvas */}
        <div ref={heroCanvasRef} className="absolute inset-0 select-none" aria-hidden="true" />

        {/* Radial gradient to improve blurb legibility */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[304px]"
          style={{
            background:
              'radial-gradient(82% 100% at 50% 0%, rgba(255,251,240,0.55) 0%, rgba(255,251,240,0) 70%)',
          }}
        />

        {/* Availability widget — top-left */}
        <div className="absolute top-[22px] left-[24px] flex h-[24px] items-center rounded-[12px] bg-[rgba(251,246,234,0.78)] px-[12px] shadow-[0_0_7px_0_#fbf6ea] backdrop-blur-[2px]">
          <span className="font-mono text-[12px] leading-[24px] text-[#211e1f]">
            Available for Hire
          </span>
        </div>

        {/* Pigment selector + brush indicator — top-right */}
        <PigmentSelector
          active={activePigment}
          onSelect={setActivePigment}
          onPaintbrushClick={cyclePigment}
        />
        <BrushIndicator
          cursor={brushCursor}
          size={brushSize}
          fill={`${activeColor}40`}
          ring={activeRing}
        />

        {/* Intro blurb */}
        <div className="absolute top-[70px] left-1/2 w-[420px] -translate-x-1/2 text-center leading-[28px]">
          <p className="font-display text-[20px] tracking-tight text-black">I&rsquo;m C Stavridis,</p>
          <p className="mt-[4px] text-[18px] leading-[26px] text-black">
            an AI-Native Design Engineer who loves turning complex ideas into warm, approachable
            products.
          </p>
        </div>

        {/* Project cards */}
        <div className="absolute top-[228px] left-1/2 flex -translate-x-1/2 items-start">
          {HERO_PROJECTS.map((project) => (
            <HeroProjectCard
              key={project.id}
              project={project}
              onClick={() => handleCardClick(project.id, project.pigment)}
            />
          ))}
        </div>

        {/* Preset widget (bottom-left) */}
        <PresetWidget
          location={LOCATIONS[locationIdx]}
          temperature={TEMPS[tempIdx]}
          weather={weather}
          time={localTime}
          onLocation={cycleLocation}
          onTemp={cycleTemp}
          onWeather={cycleWeather}
        />

        {/* Credit (bottom-right) */}
        <a
          href="https://github.com/anthropics"
          className="absolute right-[24px] bottom-[24px] flex h-[24px] items-center rounded-[12px] bg-[rgba(251,246,234,0.78)] px-[12px] font-mono text-[12px] leading-[24px] text-[#211e1f] shadow-[0_0_7px_0_#fbf6ea] backdrop-blur-[2px]"
        >
          Powered by Washes.js
        </a>
      </div>
    </section>
  );
}

function formatLocalTime(): string {
  const d = new Date();
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
}

// ---------------------------------------------------------------------------
// Pigment selector
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
      className="absolute top-[22px] right-[24px] flex h-[24px] items-center gap-[8px] rounded-[12px] px-[10px] shadow-[0_0_7px_0_#fbf6ea]"
      style={{ backgroundColor: `${activeColor}80` }}
    >
      <button
        type="button"
        onClick={onPaintbrushClick}
        aria-label="Cycle active pigment"
        className="-mx-[2px] flex h-[24px] w-[16px] items-center justify-center text-[14px] leading-[24px] text-[#fbf6ea]"
      >
        {/* Paint brush glyph (heroicons "paint-brush") */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-[14px] w-[14px]"
          aria-hidden="true"
        >
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
            outline: active === key ? '2px solid #fbf6ea' : 'none',
            outlineOffset: active === key ? '2px' : '0',
          }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Brush indicator — follows the mouse over the hero canvas. Size matches
// the current Washes brush, which the user can shrink with `[` and grow
// with `]`. We use a CSS transition for size so resize feels springy but
// leave position untransitioned so the ring tracks the cursor 1:1.
// ---------------------------------------------------------------------------

function BrushIndicator({
  cursor,
  size,
  fill,
  ring,
}: {
  cursor: { x: number; y: number; visible: boolean };
  size: number;
  fill: string;
  ring: string;
}): React.ReactElement {
  return (
    <div
      className="pointer-events-none absolute rounded-full border-2 transition-[width,height,opacity] duration-150 ease-out"
      style={{
        width: size,
        height: size,
        transform: `translate(${cursor.x - size / 2}px, ${cursor.y - size / 2}px)`,
        top: 0,
        left: 0,
        backgroundColor: fill,
        borderColor: ring,
        boxShadow: `0 0 12px ${ring}`,
        opacity: cursor.visible ? 1 : 0,
        willChange: 'transform, opacity',
      }}
      aria-hidden="true"
    />
  );
}

// ---------------------------------------------------------------------------
// Preset widget — "in saint louis, mo it's 9:52 AM 72°F and sunny"
// ---------------------------------------------------------------------------

function PresetWidget({
  location,
  temperature,
  weather,
  time,
  onLocation,
  onTemp,
  onWeather,
}: {
  location: string;
  temperature: number;
  weather: WeatherKey;
  time: string;
  onLocation: () => void;
  onTemp: () => void;
  onWeather: () => void;
}): React.ReactElement {
  return (
    <div className="absolute bottom-[24px] left-[24px] flex h-[24px] items-center gap-[6px] font-mono text-[12px] leading-[24px] text-[#3d3735] mix-blend-multiply">
      <span>in</span>
      <PresetBug
        color="#e3af08"
        onClick={onLocation}
        label={`Change location (currently ${location})`}
      >
        {location}
      </PresetBug>
      <span>it&rsquo;s {time}</span>
      <PresetBug
        color="#108ba0"
        onClick={onTemp}
        label={`Change temperature (currently ${temperature}°F)`}
      >
        {temperature}°F
      </PresetBug>
      <span>and</span>
      <PresetBug
        color="#a50e53"
        onClick={onWeather}
        label={`Change weather (currently ${WEATHER_PRESETS[weather].label})`}
      >
        {WEATHER_PRESETS[weather].label}
      </PresetBug>
    </div>
  );
}

function PresetBug({
  color,
  onClick,
  label,
  children,
}: {
  color: string;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-[19px] items-center rounded-[3px] px-[6px] font-mono text-[12px] leading-[19px] text-[#211e1f] transition-transform hover:translate-y-[-1px]"
      style={{ backgroundColor: color, color: '#211e1f' }}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Hero project card
// ---------------------------------------------------------------------------

function HeroProjectCard({
  project,
  onClick,
}: {
  project: HeroProject;
  onClick: () => void;
}): React.ReactElement {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const washRef = useRef<WashesInstance | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const wash = Washes.create(host, {
      cursorPreview: false,
      pointer: false,
    });
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
    if (canvasEl) canvasEl.style.backgroundColor = 'rgb(251,246,234)';

    // Defer the SVG trace until after the canvas has its layout, so it
    // fits inside the card instead of overflowing while we're still
    // mounting.
    const tracer = window.setTimeout(() => {
      wash.traceSVG(HERO_SVG, { flipY: false, durationMs: 1200, easing: 'penStroke' });
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

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        transform: `translate(${project.offsetX}px, ${project.offsetY}px) rotate(${project.rotation}deg)`,
      }}
      className="group absolute top-0 left-1/2 -ml-[136px] flex w-[272px] cursor-pointer flex-col items-center gap-[16px] overflow-hidden rounded-[12px] bg-[#fbf6ea] px-[24px] pt-[24px] pb-[28px] text-left transition-transform hover:scale-[1.02]"
    >
      <div
        ref={hostRef}
        className="pointer-events-none absolute inset-0 -z-0 overflow-hidden rounded-[12px] opacity-70 mix-blend-luminosity"
        aria-hidden="true"
      />
      <div className="relative z-10 flex w-full flex-col gap-[16px]">
        <p className="font-mono text-[12px] leading-[24px] text-[#7d7d7d]">{project.label}</p>
        <p
          className="font-body text-[18px] leading-[24px] whitespace-pre-line text-black"
          style={{ minHeight: '168px' }}
        >
          {project.title}
        </p>
        <div
          className="flex h-[36px] w-full items-center justify-center rounded-[4px] font-mono text-[12px] text-[#fbf6ea] transition-[filter] group-hover:brightness-110"
          style={{
            backgroundColor: PIGMENTS[project.pigment].color,
            color: project.pigment === 'yellow' ? '#100e08' : '#fbf6ea',
          }}
        >
          View Project
        </div>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Creative Tools section
// ---------------------------------------------------------------------------

function CreativeToolsSection(): React.ReactElement {
  return (
    <section className="bg-coffee w-full px-[24px] py-[72px]">
      <div className="mx-auto max-w-[1280px]">
        <p className="text-cream/80 px-[144px] font-mono text-[12px] leading-[24px]">
          AI-Native Creative Tooling I&rsquo;m Building
        </p>
        <div className="mt-[24px] flex flex-wrap justify-center gap-[32px] px-[144px]">
          {CREATIVE_CARDS.map((card) => (
            <CreativeProjectCard key={card.id} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CreativeProjectCard({ card }: { card: CreativeCard }): React.ReactElement {
  return (
    <RevealCard
      width={272}
      height={182}
      title={card.title}
      description={card.description}
      pigment={card.pigment}
      accent={card.accent}
      scale={3}
    />
  );
}

// ---------------------------------------------------------------------------
// Current Experiments section
// ---------------------------------------------------------------------------

function ExperimentsSection(): React.ReactElement {
  return (
    <section className="bg-coffee w-full px-[24px] py-[96px]">
      <div className="mx-auto max-w-[1280px]">
        <p className="text-cream/80 px-[212px] font-mono text-[12px] leading-[24px]">
          Current Experiments
        </p>
        <div className="mt-[24px] flex flex-wrap justify-center gap-[24px] px-[212px]">
          {EXPERIMENT_CARDS.map((card) => (
            <ExperimentProjectCard key={card.id} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ExperimentProjectCard({ card }: { card: ExperimentCard }): React.ReactElement {
  return (
    <RevealCard
      width={416}
      height={275}
      title={card.title}
      description={card.description}
      pigment={card.pigment}
      accent={card.accent}
      scale={2.5}
    />
  );
}

// ---------------------------------------------------------------------------
// RevealCard — shared CreativeProjectCard / ExperimentProjectCard recipe.
//
// Annotation (CreativeProjectCard & ExperimentProjectCard):
//   Inactive: only the title is visible.
//   On hover: title + description slide up "until the bottom of the
//   description is in view," AND the watercolor mask layers
//   (Washes Multiplied, Noise, Desaturation) fade out to reveal the
//   "original project image" underneath. Use react-spring.
//
// We render two pigment layers stacked: the "image" (bottom, vivid, stays
// visible) and the "mask" (top, cream-tinted with noise — fades on hover).
// Spring physics drive both the text slide and the mask fade.
// ---------------------------------------------------------------------------

type RevealCardProps = {
  width: number;
  height: number;
  title: string;
  description: string;
  pigment: PigmentKey;
  accent: PigmentKey;
  scale: number;
};

function RevealCard({
  width,
  height,
  title,
  description,
  pigment,
  accent,
  scale,
}: RevealCardProps): React.ReactElement {
  const imageHostRef = useRef<HTMLDivElement | null>(null);
  const maskHostRef = useRef<HTMLDivElement | null>(null);
  const descRef = useRef<HTMLParagraphElement | null>(null);
  const [hovered, setHovered] = useState(false);

  // Hide distance for the inactive state. The text block sits inside a
  // container with 4px gap + 12px padding-bottom, so the description ends
  // 12px above the article's bottom edge. To bury the description fully
  // below the fold we need to translate by its height + the gap + the pb.
  // 36px is a fine default for a single-line description; the layout
  // effect updates it once we can read offsetHeight for real (handles
  // 2-line descriptions like Sandy's).
  const GAP_PX = 4;
  const PB_PX = 12;
  const [hideDistance, setHideDistance] = useState(20 + GAP_PX + PB_PX);

  useLayoutEffect(() => {
    if (descRef.current) {
      setHideDistance(descRef.current.offsetHeight + GAP_PX + PB_PX);
    }
  }, [description]);

  // Bottom "image" wash — vivid pigments, stays visible.
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
    if (canvasEl) canvasEl.style.backgroundColor = 'rgb(251,246,234)';

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

  // Top "mask" wash — cream-tinted, washes out on hover.
  useEffect(() => {
    const host = maskHostRef.current;
    if (!host) return;
    const wash = Washes.create(host, { cursorPreview: false, pointer: false });
    if (wash.webglAvailable()) wash.webgl(false);
    wash.paperColor(251 / 255, 246 / 255, 234 / 255);
    wash.gouacheMode(false);
    wash.scale(scale + 0.5);
    wash.paperWetness('damp');
    wash.fadePainting(0);

    const canvasEl = (wash as unknown as { canvas: HTMLCanvasElement }).canvas;
    if (canvasEl) canvasEl.style.backgroundColor = 'rgb(251,246,234)';

    const t1 = window.setTimeout(() => {
      const rect = host.getBoundingClientRect();
      // A wash in the accent pigment, broader and softer than the image
      // layer, gives the mask its desaturated multiplied look.
      wash.pigment(accent as PigmentOption);
      wash.splash([{ x: rect.width * 0.5, y: rect.height * 0.5, velocity: 35 }], 'spray', {
        radius: rect.width * 0.9,
        pressure: 55,
        liftRate: 0.96,
      });
    }, 80);

    return () => {
      window.clearTimeout(t1);
      try {
        wash.destroy();
      } catch {
        /* ignore */
      }
    };
  }, [accent, scale]);

  const maskStyle = useSpring({
    opacity: hovered ? 0 : 1,
    config: { tension: 200, friction: 24 },
  });
  const noiseStyle = useSpring({
    opacity: hovered ? 0 : 0.4,
    config: { tension: 200, friction: 26 },
    delay: hovered ? 40 : 0,
  });
  const desatStyle = useSpring({
    opacity: hovered ? 0 : 1,
    config: { tension: 200, friction: 28 },
    delay: hovered ? 80 : 0,
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
      className="relative isolate overflow-hidden rounded-[12px] bg-[#fbf6ea] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#fbf6ea]"
    >
      {/* "Original project image" — vivid pigments, always visible underneath.
          Each layer carries its own `overflow-hidden rounded-[12px]` so the
          canvas's rectangular bitmap is clipped against the card's curve in
          browsers that don't always honor the parent's clip on
          mix-blend-mode children (notably Safari). */}
      <div
        ref={imageHostRef}
        className="absolute inset-0 overflow-hidden rounded-[12px]"
        aria-hidden="true"
      />

      {/* Mask layer #1: Washes Multiplied — the second wash painted in the
          accent pigment, multiplied over the image. */}
      <animated.div
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[12px]"
        style={{ opacity: maskStyle.opacity, mixBlendMode: 'multiply' }}
      >
        <div ref={maskHostRef} className="absolute inset-0 opacity-80" />
      </animated.div>

      {/* Mask layer #2: Noise — fractal-noise SVG dataurl over the lot. */}
      <animated.div
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[12px]"
        style={{
          opacity: noiseStyle.opacity,
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.98 0 0 0 0 0.96 0 0 0 0 0.91 0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          backgroundSize: '160px 160px',
          mixBlendMode: 'overlay',
        }}
      />

      {/* Mask layer #3: Desaturation — cream wash with mix-blend-color. */}
      <animated.div
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[12px] bg-[#fbf6ea]"
        style={{ opacity: desatStyle.opacity, mixBlendMode: 'color' }}
      />

      {/* Bottom gradient ensures the text legible against any pigment. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0"
        style={{
          height: '80px',
          background:
            'linear-gradient(to top, rgba(33,30,31,0.92) 0%, rgba(33,30,31,0.5) 50%, rgba(33,30,31,0) 100%)',
        }}
      />

      {/* Text — slides up so description comes into view on hover. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 px-[12px] pb-[12px]">
        <animated.div style={textStyle} className="text-cream flex flex-col gap-[4px]">
          <h3 className="font-display text-[18px] leading-[24px]">{title}</h3>
          <p ref={descRef} className="font-mono text-[14px] leading-[20px] text-[#fbf6eacc]">
            {description}
          </p>
        </animated.div>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

function Footer(): React.ReactElement {
  return (
    <footer className="bg-coffee-deep text-cream relative w-full overflow-hidden pt-[120px] pb-[180px]">
      <div className="text-cream mx-auto flex max-w-[560px] flex-col items-start gap-[24px]">
        <p className="font-display text-[24px] leading-[32px]">I love working with you, C.</p>
        <p className="font-body text-[24px] leading-[32px]">
          You have an infectious energy and passion for what you do and you know how to push people in
          the right directions or advise them to get the best out of them.
        </p>
        <p className="text-cream/80 font-mono text-[16px] leading-[24px]">
          — Georgiana Ramona Turcsanyi, Senior Software Engineer
        </p>
      </div>
      <HorseTab />
    </footer>
  );
}

// Annotation (Horse Tab): "On Hover — tab pulls out, ends at a slight
// angle, uses a spring." The tab pokes up from below the page; hovering
// its visible lip pulls the body up into view with a spring, finishing at
// a tilted rest. We use react-spring so the animation eases physically
// rather than linearly.
function HorseTab(): React.ReactElement {
  const [hovered, setHovered] = useState(false);
  const tabStyle = useSpring({
    transform: hovered
      ? 'translateX(-50%) translateY(-420px) rotate(-3deg)'
      : 'translateX(-50%) translateY(0px) rotate(0deg)',
    config: { tension: 180, friction: 14 },
  });
  return (
    <animated.div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      tabIndex={0}
      style={tabStyle}
      className="absolute -bottom-[480px] left-1/2 flex w-[200px] origin-bottom flex-col items-center gap-[24px] rounded-t-[8px] bg-black px-[20px] pt-[24px] pb-[36px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#fbf6ea]"
    >
      <div className="bg-paper-purple-dark/30 h-[338px] w-[154px] overflow-hidden rounded-[4px] border border-[#d4d4d4]">
        <div
          aria-hidden="true"
          className="h-full w-full"
          style={{
            background: 'linear-gradient(160deg, #2b2b2b 0%, #4a4640 35%, #6b5f55 60%, #2a221c 100%)',
            mixBlendMode: 'screen',
          }}
        />
      </div>
      <p className="text-cream w-full -rotate-[0.5deg] text-center font-mono text-[12px] leading-[24px]">
        &ldquo;Let a horse whisper in your ear and breathe on your heart.
        <br />
        You will never regret it.&rdquo;
        <br />— Author Unknown
      </p>
    </animated.div>
  );
}
