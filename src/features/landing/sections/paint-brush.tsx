// ---------------------------------------------------------------------------
// Paint brush — soft-tinted 88px disc that follows the cursor over the
// Washes canvas, plus the rotating "❦ CLICK TO PAINT ❦" affordance ring.
// Purely visual — paint is driven by the Washes lib's built-in pointer
// handlers (pointer:true + continuousFlow in washes-canvas.tsx). This
// component:
//
//   - Tracks pointermove for the brush indicator position.
//   - On the first pointerdown inside the canvas region, latches
//     `paintActive = true` so the glass card fades + slides and the Header
//     swaps in the paint controls.
//   - Suppresses the ring while the cursor is over the resting glass card.
//
// Annotation (Figma node 4003:30680): "'Click to Paint' shows up each time
// the washes panel is re-activated. Disappears while the user is painting."
// → the SVG <textPath> ring fades when washesVisible && !isPainting,
// continuously rotated via a CSS keyframe.
// ---------------------------------------------------------------------------

import { useEffect, useRef } from "react";

import { usePaintStore } from "../../../lib/paint-store.js";

export type PaintBrushProps = {
  // The region the brush is constrained to — typically the Washes canvas
  // host. Pointer events outside this region hide the brush.
  targetRef: React.RefObject<HTMLDivElement | null>;
  // Optional sub-region that should suppress the brush + "Click to Paint"
  // ring while the pointer is over it. Used for the Intro glass card in
  // the v2 landing page: the click-to-paint affordance shouldn't compete
  // with the card's intro copy at rest, but once `paintActive` is true
  // (card has faded out) the exclusion is bypassed and the brush is
  // visible everywhere inside the canvas region.
  excludeRef?: React.RefObject<HTMLElement | null>;
};

const BRUSH_SIZE = 88;

export function PaintBrush({
  targetRef,
  excludeRef,
}: PaintBrushProps): React.ReactElement {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const brushRef = useRef<HTMLDivElement | null>(null);
  const brushFillRef = useRef<HTMLDivElement | null>(null);
  const insideRef = useRef(false);

  const washesVisible = usePaintStore((s) => s.washesVisible);
  const isPainting = usePaintStore((s) => s.isPainting);
  const brushColor = usePaintStore((s) => s.brushColor);

  // ------------------------------------------------------------------------
  // Pointer follow + click handling. Bound to `window` so the cursor can
  // continue tracking even when the pointer momentarily leaves the canvas
  // AND so that no intermediate element in the DOM tree can swallow the
  // pointerdown via implicit capture. The handler does its own bounds
  // check against `targetRef`.
  //
  // Crucially the effect has STABLE refs as deps — no `paintActive` /
  // `brushColor` — so the listener attaches once on mount and stays
  // attached across paint-state changes. Stateful values are read fresh
  // from `usePaintStore.getState()` inside the handler.
  // ------------------------------------------------------------------------
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    let rafId = 0;
    let pending: PointerEvent | null = null;

    const isOverExcluded = (clientX: number, clientY: number): boolean => {
      // The exclusion zone only applies BEFORE paintActive — once the
      // user has committed to painting, the card has faded out and the
      // brush should follow the cursor everywhere inside the canvas.
      const { paintActive } = usePaintStore.getState();
      if (paintActive) return false;
      const exEl = excludeRef?.current;
      if (!exEl) return false;
      const er = exEl.getBoundingClientRect();
      return (
        clientX >= er.left &&
        clientX <= er.right &&
        clientY >= er.top &&
        clientY <= er.bottom
      );
    };

    const handle = () => {
      rafId = 0;
      if (!pending) return;
      const e = pending;
      pending = null;
      const target = targetRef.current;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const insideTarget =
        x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;
      const overExcluded = isOverExcluded(e.clientX, e.clientY);
      const inside = insideTarget && !overExcluded;
      insideRef.current = inside;
      const brush = brushRef.current;
      if (brush) {
        brush.style.transform = `translate(${x - BRUSH_SIZE / 2}px, ${y - BRUSH_SIZE / 2}px)`;
        brush.style.opacity = inside ? "1" : "0";
      }
      usePaintStore.getState().setBrushPosition(inside ? { x, y } : null);
    };
    const onMove = (e: PointerEvent) => {
      pending = e;
      if (!rafId) rafId = window.requestAnimationFrame(handle);
    };

    // PR-paint-arch: the Washes lib now handles ALL paint events itself
    // (pointer: true, continuousFlow). This handler is purely a STATE LATCH
    // — when the user first clicks inside the wash area, flip paintActive
    // so the glass card fades + slides out of the way and the Header
    // swaps in the paint controls. No paintAt / spawn pipeline anymore.
    const onPointerDown = (e: PointerEvent) => {
      const target = targetRef.current;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
      // Don't latch when the click was on an interactive element (Header
      // nav, HoverPopover spans, swatches).
      const targetEl = e.target as Element | null;
      if (
        targetEl &&
        (targetEl.closest("a, button, [role='button']") ||
          targetEl.closest("[data-paint-skip]"))
      ) {
        return;
      }
      const store = usePaintStore.getState();
      store.setIsPainting(true);
      store.setPaintActive(true);
    };

    const onPointerUp = () => {
      if (insideRef.current) usePaintStore.getState().setIsPainting(false);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    // Capture phase + window-level: no intermediate element in the DOM
    // tree can swallow the event before this handler runs.
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("pointerup", onPointerUp);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [targetRef, excludeRef]);

  // Keep the soft fill in sync with the active brushColor. Driving this via
  // inline style + a ref avoids re-binding the pointer effect just to read a
  // new color.
  useEffect(() => {
    const el = brushFillRef.current;
    if (!el) return;
    el.style.backgroundColor = `rgba(${brushColor.r}, ${brushColor.g}, ${brushColor.b}, 0.1)`;
  }, [brushColor]);

  const showRing = washesVisible && !isPainting;

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
        {/* Soft tinted fill — 25% opacity of the active brush color with
            `plus-darker` blend so it reads as a gentle darkening of the
            paper instead of a flat overlay. No stroke, no border — the
            cursor itself is the OS crosshair (set on the parent target
            in landing-page.tsx). */}
        <div
          ref={brushFillRef}
          className="absolute inset-0 rounded-full"
          style={{
            backgroundColor: `rgba(${brushColor.r}, ${brushColor.g}, ${brushColor.b}, 0.25)`,
            mixBlendMode: "plus-darker",
          }}
        />

        {/* Click-to-paint ring — SVG textPath wrapped around a circle.
            Rotates continuously while shown. Hidden while painting.
            The ring sits just outside the 88px brush perimeter; viewBox
            and path radius are sized so the text orbits at ~52px from
            center (i.e. ~8px outside the 44px brush radius). Fill is a
            static dark cream-on-paper to stay legible over any pigment.

            v2 update (PR 4c-paint): we used to loop "CLICK TO PAINT ·"
            four times around the ring, which got visually noisy and
            sometimes truncated. Now a single instance flanked by
            FLORAL HEART glyphs (U+2766 ❦) — picked for its organic,
            painterly feel vs. the geometric asterisk candidates. The
            phrase is `text-anchor="middle"` with `startOffset="25%"`
            so it sits centered at the top of the ring at the moment
            the rotation animation passes through 0°. The phrase reads
            ~upright as it cycles past the top; otherwise the slow 16s
            rotation keeps the ring feeling alive without forcing the
            reader to crane their neck. */}
        {/* Rotation lives on the inner <g>, NOT the <svg> host. Rotating
            the host creates a CSS-compositor layer; combined with the
            mix-blend-mode brush fill in the same brushRef, Chrome briefly
            renders that layer's bounding box as opaque black between paint
            frames. Rotating the <g> keeps everything in one paint pass. */}
        <svg
          className="absolute"
          width={BRUSH_SIZE * 1.4}
          height={BRUSH_SIZE * 1.4}
          viewBox="0 0 104 104"
          style={{
            top: -BRUSH_SIZE * 0.2,
            left: -BRUSH_SIZE * 0.2,
            opacity: showRing ? 1 : 0,
            transition: "opacity 200ms ease-out",
          }}
        >
          <defs>
            {/* Path starts at 9 o'clock and sweeps clockwise — the
                first half of the path is the TOP of the circle, the
                second half is the bottom. Combined with text-anchor=
                middle and startOffset="25%", the phrase center lands
                at the 12 o'clock position, so the entire phrase reads
                upright across the top arc with the ring at rest. */}
            <path
              id="paint-brush-ring-path"
              d="M 52, 52 m -42, 0 a 42,42 0 1,1 84,0 a 42,42 0 1,1 -84,0"
              fill="none"
            />
          </defs>
          <g className="paint-brush-ring-spin">
            <text
              fill="#391f00"
              textAnchor="middle"
              style={{
                fontFamily:
                  "'Spline Sans Mono', ui-monospace, SFMono-Regular, monospace",
                fontSize: "8px",
                letterSpacing: "0.14em",
                fontWeight: 500,
                paintOrder: "stroke fill",
              }}
            >
              <textPath href="#paint-brush-ring-path" startOffset="25%">
                ₊˚⊹ CLICK TO PAINT ⊹˚₊
              </textPath>
            </text>
          </g>
        </svg>
      </div>

      {/* Local keyframe for the ring rotation. Rotation is on the inner
          <g> (transform-origin in SVG user units = center of viewBox). */}
      <style>{`
        .paint-brush-ring-spin {
          animation: paint-brush-ring-spin 16s linear infinite;
          transform-origin: 52px 52px;
          transform-box: view-box;
        }
        @keyframes paint-brush-ring-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

