// ---------------------------------------------------------------------------
// Washes canvas — the interactive watercolor surface that sits behind the
// hero + header on the v2 landing page. Subscribes to:
//
//   - `usePaintStore.washesVisible` / `resetVersion` — controls fade in/out
//     and re-seeding. The preset widget bumps `resetVersion` on every
//     location/time/weather change so the canvas wipes and re-applies its
//     visualization preset.
//   - The `washesWorld` Koota world — every `Wash` entity spawned by the
//     paint-brush is observed via `onAdd(Wash)`, read for its Position +
//     Color + Radius, and piped into the WebGL sim via `paintAt()`. The
//     entity is then destroyed (it's a fire-and-forget event — the actual
//     pigment lives inside the Washes sim grid afterwards).
//
// Annotation (Visualization Evolution / hero.tsx): the canvas uses the same
// Washes settings as the hero — paint load 0.25, water load 8.0,
// evaporation 2.5, scale 1.5, gravity edges. Re-using those keeps the look
// continuous with the legacy hero implementation. PR 13 will likely
// consolidate this with hero.tsx.
// ---------------------------------------------------------------------------

import { useEffect, useRef } from "react";
import { animated, useSpring } from "@react-spring/web";

import { Washes } from "../../../../lib/washes/washes.js";
import type { WashesInstance } from "../../../../lib/washes/washes.js";
import { initGpuSim } from "../../../../lib/washes/washes-gpu-sim.js";

import { hexToRgb } from "../lib/colors.js";
import {
  DAY_PHASE_BACKGROUND,
  DAY_PHASE_PAPER,
  WEATHER_PRESETS,
  type DayPhase,
  type WeatherKey,
} from "../lib/weather.js";

import { usePaintStore } from "../../../lib/paint-store.js";
import {
  washesWorld,
  Wash,
  Position,
  Color,
  Radius,
} from "../../../lib/washes-world.js";

export type WashesCanvasProps = {
  // Imperative ref the surrounding page can use to scroll to the canvas
  // when the preset widget triggers a reset.
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  dayPhase: DayPhase;
  weather: WeatherKey;
};

export function WashesCanvas({
  scrollRef,
  dayPhase,
  weather,
}: WashesCanvasProps): React.ReactElement {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const washRef = useRef<WashesInstance | null>(null);

  const washesVisible = usePaintStore((s) => s.washesVisible);
  const resetVersion = usePaintStore((s) => s.resetVersion);
  const setWashesVisible = usePaintStore((s) => s.setWashesVisible);

  // Fade-in / fade-out spring for the canvas surface. Driven by the
  // `washesVisible` flag (used by both the initial mount fade-in and the
  // mid-cycle wipe during a preset reset).
  const fadeSpring = useSpring({
    opacity: washesVisible ? 1 : 0,
    config: { tension: 200, friction: 28 },
  });

  // ------------------------------------------------------------------------
  // Initialize the Washes instance once on mount.
  // ------------------------------------------------------------------------
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    host.replaceChildren();

    let wash: WashesInstance | null = null;
    let unsubscribeWashAdd: (() => void) | null = null;
    let ro: ResizeObserver | null = null;

    const applyVisualization = (phase: DayPhase, w: WeatherKey) => {
      if (!wash) return;
      const paper = DAY_PHASE_PAPER[phase];
      const rgb = hexToRgb(paper);
      wash.paperColor(rgb.r / 255, rgb.g / 255, rgb.b / 255);
      wash.setBackground(DAY_PHASE_BACKGROUND[phase]);
      wash.setAnimation(WEATHER_PRESETS[w].animation);
      const canvasEl = (wash as unknown as { canvas: HTMLCanvasElement }).canvas;
      if (canvasEl) canvasEl.style.backgroundColor = paper;
    };

    const initialize = () => {
      wash = Washes.create(host, {
        cursorPreview: false,
        // Pointer disabled — the v2 paint flow goes through the
        // PaintBrush overlay + Koota world, NOT the Washes built-in
        // pointer handling. We pipe paint via `paintAt()` ourselves.
        pointer: false,
        scale: 1.5,
      });
      washRef.current = wash;

      if (wash.webglAvailable()) {
        wash.webgl(true);
      }

      const gpuCtx = wash.gpuSimContext();
      if (gpuCtx) {
        try {
          const handle = initGpuSim(gpuCtx.gl, gpuCtx.GW, gpuCtx.GH);
          wash.gpuSim(handle);
        } catch (e) {
          console.warn("GPU sim init failed; falling back to CPU sim", e);
        }
      }

      wash.gouacheMode("auto");
      wash.paperWetness("damp");
      wash.paintLoad(0.25);
      wash.waterLoad(8.0);
      wash.evaporation(2.5);
      wash.brushSize(88);
      wash.edgeMode("gravity");
      wash.gravityDirection("down");
      wash.gravityStrength(0.1);
      wash.fadeHalfLife(10000);
      wash.fadePainting(0.05);
      wash.keepSimulating(true);
      applyVisualization(dayPhase, weather);

      const canvasEl = (wash as unknown as { canvas: HTMLCanvasElement }).canvas;
      if (canvasEl) {
        canvasEl.style.cursor = "none";
      }

      // Subscribe to new `Wash` entities. Each is a single click-to-paint
      // event from the PaintBrush overlay. Read its Position/Color/Radius,
      // convert display coords to grid coords, and stamp via paintAt.
      //
      // Rationale: we don't poll an animation-frame loop because clicks
      // are sparse events (vs. continuous-stroke painting). onAdd lets us
      // pipe each click into the sim exactly once. After the stamp, the
      // entity is destroyed — its "logical" state is now living in the
      // sim's pigment grid.
      unsubscribeWashAdd = washesWorld.onAdd(Wash, (entity) => {
        const w = washRef.current;
        if (!w) return;
        const pos = entity.get(Position);
        const col = entity.get(Color);
        const rad = entity.get(Radius);
        if (!pos || !col) return;
        const radius = rad?.value ?? 24;

        // Color → pigment selection. We approximate by picking the closest
        // of the three K-M pigments. The Washes lib's paintAt accepts a
        // pigment by index/name; arbitrary RGB isn't supported.
        const pigment = nearestPigment(col.r, col.g, col.b);
        const { gx, gy } = w.toGrid(pos.x, pos.y);
        const gridRadius = Math.max(2, radius / 1.5);
        w.paintAt(gx, gy, gridRadius, pigment, 1.0);

        entity.destroy();
      });

      // Fade in once the canvas has rendered its first frame.
      requestAnimationFrame(() => {
        setWashesVisible(true);
      });
    };

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
      unsubscribeWashAdd?.();
      // Destroy any stray Wash entities so they don't accumulate across
      // hot-reloads in dev.
      const stray = washesWorld.query(Wash);
      stray.forEach((e) => e.destroy());
      if (wash) {
        try {
          wash.destroy();
        } catch {
          /* ignore */
        }
      }
      washRef.current = null;
    };
    // dayPhase + weather are intentionally not deps — the apply-visualization
    // effect below handles updates without a full reinit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------------------------------------------------------------
  // Apply day-phase + weather changes without recreating the canvas.
  // ------------------------------------------------------------------------
  useEffect(() => {
    const wash = washRef.current;
    if (!wash) return;
    const paper = DAY_PHASE_PAPER[dayPhase];
    const rgb = hexToRgb(paper);
    wash.paperColor(rgb.r / 255, rgb.g / 255, rgb.b / 255);
    wash.setBackground(DAY_PHASE_BACKGROUND[dayPhase]);
    wash.setAnimation(WEATHER_PRESETS[weather].animation);
    const canvasEl = (wash as unknown as { canvas: HTMLCanvasElement }).canvas;
    if (canvasEl) canvasEl.style.backgroundColor = paper;
  }, [dayPhase, weather]);

  // ------------------------------------------------------------------------
  // Reset cycle. resetVersion bumps trigger a fade-out → fast-decay wipe →
  // re-seed → fade-in. Matches the Figma annotation:
  //   "the canvas should quickly fade out and fade in"
  // ------------------------------------------------------------------------
  const firstRunRef = useRef(true);
  useEffect(() => {
    if (firstRunRef.current) {
      // Don't run the reset on initial mount — initialize() already seeded.
      firstRunRef.current = false;
      return;
    }
    const wash = washRef.current;
    if (!wash) return;
    setWashesVisible(false);
    // Speed up the in-canvas decay so any visible pigment melts to paper
    // while we're faded out.
    wash.fadeHalfLife(200);
    const timeout = window.setTimeout(() => {
      // Clear logical Wash entities + reset the sim.
      const stray = washesWorld.query(Wash);
      stray.forEach((e) => e.destroy());
      try {
        wash.reset();
      } catch {
        /* ignore */
      }
      wash.fadeHalfLife(10000);
      // Re-apply visualization for the (possibly new) day phase / weather.
      const paper = DAY_PHASE_PAPER[dayPhase];
      const rgb = hexToRgb(paper);
      wash.paperColor(rgb.r / 255, rgb.g / 255, rgb.b / 255);
      wash.setBackground(DAY_PHASE_BACKGROUND[dayPhase]);
      wash.setAnimation(WEATHER_PRESETS[weather].animation);
      const canvasEl = (wash as unknown as { canvas: HTMLCanvasElement }).canvas;
      if (canvasEl) canvasEl.style.backgroundColor = paper;
      setWashesVisible(true);
    }, 350);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetVersion]);

  return (
    <animated.div
      ref={(node) => {
        if (scrollRef && node) {
          (scrollRef as React.MutableRefObject<HTMLDivElement | null>).current =
            node;
        }
      }}
      className="absolute inset-0"
      style={fadeSpring}
      aria-hidden="true"
    >
      {/* WebGL wash host — fills the canvas region. */}
      <div
        ref={hostRef}
        className="absolute inset-0"
        style={{ touchAction: "none" }}
      />

      {/* Connecting Gradients — Figma node 2232:32030. Three overlay layers
          that sit on top of the WebGL host but inside the same clipping
          shell so they get rounded corners + overflow-hidden for free.
          Layered bottom-up:
            1. Noise — white mix-blend-darken placeholder (no asset yet).
               Per Figma node 2232:32031, this is supposed to be a noise
               texture; until that lands, a flat white mix-blend-darken
               div is acceptable (it visibly desaturates the wash, which
               is the right direction). */}
      <div
        className="pointer-events-none absolute inset-0 bg-white mix-blend-darken"
        aria-hidden="true"
      />

      {/* 2. Radial gradient — Figma node 2232:32032. Paper cream blooms
            from the bottom-center (cx=568, cy=340 in the original
            1136-wide design) and fades outward to transparent. Combined
            with overlay #3 this is what melts the bottom of the wash
            into the page-cream background. The Figma export uses an
            inline SVG with a custom gradientTransform; we replicate via
            CSS radial-gradient ellipse 50%×100% centered at 50% 100% —
            visually equivalent, no SVG cost. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 75% at 50% 100%, #fbf6ea 0%, rgba(251,246,234,0) 100%)",
        }}
        aria-hidden="true"
      />

      {/* 3. Linear bottom fade — Figma node 2232:32033. Vertical fade from
            transparent to paper-cream, anchored ~100px from the top with
            ~291px height — together with #2 this melts the wash into the
            cream page background so the bottom of the wash doesn't have a
            hard edge. */}
      <div
        className="pointer-events-none absolute inset-x-0"
        style={{
          top: "100.82px",
          height: "291.176px",
          background:
            "linear-gradient(to bottom, rgba(251,246,234,0) 0%, #fbf6ea 100%)",
        }}
        aria-hidden="true"
      />
    </animated.div>
  );
}

// ---------------------------------------------------------------------------
// nearestPigment — pick the closest K-M pigment (rose/yellow/blue) for an
// RGB triple. The Washes lib's `paintAt` accepts pigment by name or index;
// it does NOT support arbitrary RGB. This is the same approximation the
// hero uses (active pigment is set out-of-band and reused here per-click).
// ---------------------------------------------------------------------------
const PIGMENT_RGB = {
  rose: { r: 165, g: 14, b: 83 },
  yellow: { r: 227, g: 175, b: 8 },
  blue: { r: 16, g: 139, b: 160 },
} as const;
type PigmentName = keyof typeof PIGMENT_RGB;

function nearestPigment(r: number, g: number, b: number): PigmentName {
  let best: PigmentName = "rose";
  let bestDist = Infinity;
  for (const name of Object.keys(PIGMENT_RGB) as PigmentName[]) {
    const p = PIGMENT_RGB[name];
    const d =
      (p.r - r) * (p.r - r) +
      (p.g - g) * (p.g - g) +
      (p.b - b) * (p.b - b);
    if (d < bestDist) {
      bestDist = d;
      best = name;
    }
  }
  return best;
}
