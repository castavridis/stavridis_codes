// ---------------------------------------------------------------------------
// Washes canvas — the interactive watercolor surface that sits behind the
// hero + header on the v2 landing page. Subscribes to:
//
//   - `usePaintStore.washesVisible` / `resetVersion` — controls fade in/out
//     and re-seeding. The preset widget bumps `resetVersion` on every
//     location/time/weather change so the canvas wipes and re-applies its
//     visualization preset.
//   - The Washes lib's built-in pointer handlers (pointer:true +
//     continuousFlow) — paint events flow directly through the lib's
//     internal pointermove stream. Header swatches update the lib's
//     active pigment via a `usePaintStore.subscribe` on brushColor.
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

import type { PigmentOption } from "../../../../lib/washes/washes.js";

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
  const paintActive = usePaintStore((s) => s.paintActive);

  // Fade-in / fade-out spring for the canvas surface. Driven by the
  // `washesVisible` flag (used by both the initial mount fade-in and the
  // mid-cycle wipe during a preset reset).
  const fadeSpring = useSpring({
    opacity: washesVisible ? 1 : 0,
    config: { tension: 200, friction: 28 },
  });

  // Connecting Gradients fade. When paintActive flips true, the paper-
  // bloom + bottom-fade overlays drop to 0 so the wash itself is
  // unobstructed. The noise layer is intentionally NOT animated — paper
  // grain reads as a baseline texture in both modes (PR 4c-paint-4 split).
  //
  // Fast spring (tension 280, friction 28) for the paint-mode fade.
  // Resting opacity is exactly 1.0 — at 0.95 the linear gradient never
  // fully reaches solid cream at the wash bottom, leaving a faint
  // visible line against the 100%-cream page background.
  const overlaysSpring = useSpring({
    opacity: paintActive ? 0 : 1,
    config: { tension: 280, friction: 28 },
  });

  // ------------------------------------------------------------------------
  // Initialize the Washes instance once on mount.
  // ------------------------------------------------------------------------
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    host.replaceChildren();

    let wash: WashesInstance | null = null;
    let unsubscribeBrushColor: (() => void) | null = null;
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
        // Pointer ENABLED — paint flows through the Washes lib's built-in
        // pointer handlers (pointermove + pointerdown stream tiny stamps as
        // the cursor travels). This matches the legacy hero behavior and is
        // what `paintLoad` + `brushSize` + `continuousFlow` are calibrated
        // for. The PaintBrush overlay is now purely visual (soft 10%-fill
        // disc + "Click to Paint" ring); its custom pointerdown spawn-Wash
        // pipeline was removed in favor of the lib's native handling.
        pointer: true,
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
      wash.paintLoad(0.15);
      wash.waterLoad(8.0);
      wash.evaporation(2.5);
      // 160 matches the legacy hero (BRUSH_DEFAULT). Smaller values feel
      // pinched; the lib's stamp calibration assumes ~160px.
      wash.brushSize(160);
      wash.edgeMode("gravity");
      wash.gravityDirection("down");
      wash.gravityStrength(0.075);
      wash.fadeHalfLife(10000);
      wash.fadePainting(0.05);
      // Smooth strokes on touch devices where pointermove is sparse.
      const isTouch = window.matchMedia("(pointer: coarse)").matches;
      wash.continuousFlow(isTouch);
      wash.keepSimulating(true);
      // Initial pigment from the current brush color in the store.
      const initColor = usePaintStore.getState().brushColor;
      wash.pigment(
        nearestPigment(initColor.r, initColor.g, initColor.b) as PigmentOption,
      );
      applyVisualization(dayPhase, weather);

      const canvasEl = (wash as unknown as { canvas: HTMLCanvasElement }).canvas;
      if (canvasEl) {
        // OS crosshair, not 'none' — the PaintBrush overlay does NOT
        // render a custom cursor anymore; the soft fill disc just tracks
        // the cursor for color preview.
        canvasEl.style.cursor = "crosshair";
        // Bottom corner radii live on the canvas itself, not the wrapping
        // div. The wrapper's `overflow-hidden` + bottom radius was clipping
        // the linear paper-fade gradient with visible artifacts; clipping
        // on the canvas element instead keeps the gradient flush to the
        // wrapper edges while still rounding the wash's painted output.
        canvasEl.style.borderBottomLeftRadius = "12px";
        canvasEl.style.borderBottomRightRadius = "12px";
        // iOS Safari hands the gesture to the scroll container before
        // touch-action:none takes effect on the canvas; a non-passive
        // touchstart calling preventDefault() pre-empts that. Matches
        // the legacy hero treatment.
        canvasEl.addEventListener("touchstart", (e) => e.preventDefault(), {
          passive: false,
        });
      }

      // Subscribe to brushColor and route it to the lib's pigment slot —
      // user picks a Header swatch, the next stroke uses that pigment.
      unsubscribeBrushColor = usePaintStore.subscribe((state, prev) => {
        if (state.brushColor === prev?.brushColor) return;
        const w = washRef.current;
        if (!w) return;
        const c = state.brushColor;
        w.pigment(nearestPigment(c.r, c.g, c.b) as PigmentOption);
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
      unsubscribeBrushColor?.();
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

      {/* Connecting Gradients — Figma node 2232:32030. Three overlay
          layers that sit on top of the WebGL host but inside the same
          clipping shell so they get rounded corners + overflow-hidden
          for free. PR 4c-paint-4: noise is split out and stays visible
          in both paint and rest modes — the two cream-blend gradients
          fade out under `paintActive` so the user paints onto an
          unobstructed wash. */}

      {/* 1. Noise — Figma node 2232:32031. Tiled noise PNG at 64px,
            hard-light blend at 0.5 opacity — gives the wash a tactile
            paper grain without flattening the pigment. Always visible. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "url('/images/noise.png')",
          backgroundRepeat: "repeat",
          backgroundSize: "64px",
          opacity: 0.5,
          mixBlendMode: "hard-light",
          // Match the canvas element's bottom radii so the noise tiles
          // clip to the rounded wash output. The wrapping div is square-
          // bottomed (to keep the gradient artifact-free), but the noise
          // sits ON the wash, so it needs to round with it.
          borderBottomLeftRadius: "12px",
          borderBottomRightRadius: "12px",
        }}
        aria-hidden="true"
      />

      {/* Cream-blend gradients — fade out together on paintActive. */}
      <animated.div
        className="pointer-events-none absolute inset-0"
        style={overlaysSpring}
        aria-hidden="true"
      >
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
            // Extended to ~430px so the transparent top edge of the
            // gradient sits ~100px from the top of the wash region. The
            // previous 291px height made the edge land at y≈239 within
            // the 530px wash, which read as a visible "line" where the
            // mask transition began. Longer gradient = gentler ramp =
            // no perceptible start edge.
            bottom: 0,
            height: "430px",
            background:
              "linear-gradient(to bottom, rgba(251,246,234,0) 0%, #fbf6ea 75%)",
          }}
          aria-hidden="true"
        />
      </animated.div>
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
