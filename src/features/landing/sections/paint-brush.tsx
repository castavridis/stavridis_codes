// ---------------------------------------------------------------------------
// Paint brush — the 88×88 cursor overlay that hovers over the Washes
// canvas. Spawns a `Wash` entity into the Koota world on each click; the
// WashesCanvas subscribes to those entities and pipes them into the sim.
//
// Annotation (Figma node 4003:30680): "'Click to Paint' shows up each time
// the washes panel is re-activated. Disappears while the user is painting.
// Text rotates around the brush while visible." → the SVG <textPath> ring
// fades in when washesVisible && !isPainting, and rotates continuously via
// CSS keyframe.
// ---------------------------------------------------------------------------

import { useEffect, useRef } from "react";

import { usePaintStore } from "../../../lib/paint-store.js";
import {
  washesWorld,
  Wash,
  Position,
  Color,
  Radius,
  Lifetime,
} from "../../../lib/washes-world.js";

export type PaintBrushProps = {
  // The region the brush is constrained to — typically the Washes canvas
  // host. Pointer events outside this region hide the brush.
  targetRef: React.RefObject<HTMLDivElement | null>;
};

const BRUSH_SIZE = 88;

export function PaintBrush({ targetRef }: PaintBrushProps): React.ReactElement {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const brushRef = useRef<HTMLDivElement | null>(null);
  const insideRef = useRef(false);

  const washesVisible = usePaintStore((s) => s.washesVisible);
  const isPainting = usePaintStore((s) => s.isPainting);
  const setIsPainting = usePaintStore((s) => s.setIsPainting);
  const setBrushPosition = usePaintStore((s) => s.setBrushPosition);
  const brushColor = usePaintStore((s) => s.brushColor);

  // ------------------------------------------------------------------------
  // Pointer follow + click handling. Bound to window so the cursor can
  // continue tracking even when the pointer momentarily leaves the canvas
  // (we hide the brush at that point but don't lose state).
  // ------------------------------------------------------------------------
  useEffect(() => {
    const target = targetRef.current;
    const overlay = overlayRef.current;
    if (!target || !overlay) return;

    let rafId = 0;
    let pending: PointerEvent | null = null;

    const handle = () => {
      rafId = 0;
      if (!pending) return;
      const e = pending;
      pending = null;
      const rect = target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const inside = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;
      insideRef.current = inside;
      const brush = brushRef.current;
      if (brush) {
        brush.style.transform = `translate(${x - BRUSH_SIZE / 2}px, ${y - BRUSH_SIZE / 2}px)`;
        brush.style.opacity = inside ? "1" : "0";
      }
      setBrushPosition(inside ? { x, y } : null);
    };
    const onMove = (e: PointerEvent) => {
      pending = e;
      if (!rafId) rafId = window.requestAnimationFrame(handle);
    };

    const onPointerDown = (e: PointerEvent) => {
      // Only react to clicks INSIDE the canvas region.
      const rect = target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
      setIsPainting(true);
      spawnWash(x, y, brushColor);
    };

    const onPointerUp = () => {
      if (insideRef.current) setIsPainting(false);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    target.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      target.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [targetRef, setBrushPosition, setIsPainting, brushColor]);

  const showRing = washesVisible && !isPainting;
  const colorCss = `rgb(${brushColor.r}, ${brushColor.g}, ${brushColor.b})`;

  return (
    <div
      ref={overlayRef}
      className="pointer-events-none absolute inset-0 z-30"
      aria-hidden="true"
    >
      <div
        ref={brushRef}
        className="pointer-events-none absolute top-0 left-0 transition-opacity duration-150 ease-out"
        style={{
          width: BRUSH_SIZE,
          height: BRUSH_SIZE,
          opacity: 0,
          willChange: "transform, opacity",
        }}
      >
        {/* Brush ring — 88px circle with a soft tinted fill so the user
            can see the active radius. */}
        <div
          className="absolute inset-0 rounded-full border-2"
          style={{
            backgroundColor: `${colorCss}33`,
            borderColor: `${colorCss}99`,
            boxShadow: `0 0 18px ${colorCss}66`,
          }}
        />

        {/* Centered crosshair — small white dot inside a thin black ring,
            matching Figma node 4015:48995. */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div
            className="h-[10px] w-[10px] rounded-full"
            style={{
              backgroundColor: "white",
              border: "1px solid rgba(0, 0, 0, 0.65)",
            }}
          />
        </div>

        {/* Click-to-paint ring — SVG textPath wrapped around a circle.
            Rotates continuously while shown. Hidden while painting. */}
        <svg
          className="paint-brush-ring absolute"
          width={BRUSH_SIZE * 2}
          height={BRUSH_SIZE * 2}
          viewBox="0 0 176 176"
          style={{
            top: -BRUSH_SIZE / 2,
            left: -BRUSH_SIZE / 2,
            opacity: showRing ? 1 : 0,
            transition: "opacity 200ms ease-out",
          }}
        >
          <defs>
            <path
              id="paint-brush-ring-path"
              d="M 88, 88 m -68, 0 a 68,68 0 1,1 136,0 a 68,68 0 1,1 -136,0"
              fill="none"
            />
          </defs>
          <text
            fill={colorCss}
            style={{
              fontFamily:
                "'Spline Sans Mono', ui-monospace, SFMono-Regular, monospace",
              fontSize: "10px",
              letterSpacing: "0.12em",
              fontWeight: 600,
            }}
          >
            <textPath href="#paint-brush-ring-path" startOffset="0">
              CLICK TO PAINT · CLICK TO PAINT · CLICK TO PAINT · CLICK TO PAINT ·
            </textPath>
          </text>
        </svg>
      </div>

      {/* Local keyframe for the ring rotation. Scoped via a unique class. */}
      <style>{`
        .paint-brush-ring {
          animation: paint-brush-ring-spin 16s linear infinite;
          transform-origin: 50% 50%;
        }
        @keyframes paint-brush-ring-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// spawnWash — fire-and-forget. The WashesCanvas's onAdd(Wash) subscriber
// will pick this up, paint it into the sim, and destroy it.
// ---------------------------------------------------------------------------
function spawnWash(
  x: number,
  y: number,
  color: { r: number; g: number; b: number },
): void {
  washesWorld.spawn(
    Wash,
    Position({ x, y }),
    Color({ r: color.r, g: color.g, b: color.b, a: 1 }),
    Radius({ value: 44 }),
    Lifetime({ born: performance.now(), ttl: 4000 }),
  );
}
