// ---------------------------------------------------------------------------
// Washes info — 24×24 "i" badge anchored to the bottom-left of the Washes
// Canvas region. Clicking it opens a Popover ("Powered by Washes.js")
// extracted verbatim from Figma `Landing Page – Paint 02` (node 4014:43015).
//
// The button itself stays visible in both resting and paint modes so the
// user can always look up the wash credits; the popover only opens on a
// user click and closes on outside-click or the popover's own close button.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";

import Popover from "../../../components/Popover.js";
import FadeUp from "../../../components/anim/FadeUp.js";

export function WashesInfo(): React.ReactElement {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Outside-click handler — close the popover when the user clicks/taps
  // anywhere outside the wrapper. Bound to `pointerdown` so it fires
  // before the paint-brush's own `pointerdown` (which would otherwise
  // spawn a wash through the open popover).
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const wrap = wrapperRef.current;
      if (!wrap) return;
      if (!wrap.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => window.removeEventListener("pointerdown", onPointerDown, true);
  }, [open]);

  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);

  return (
    // `data-paint-skip` keeps paint-brush from spawning a wash when the
    // pointer-down lands on the info button or its popover children
    // (paint-brush.tsx looks for that attribute via `closest`).
    <div
      ref={wrapperRef}
      data-paint-skip
      className="absolute bottom-[8px] left-[8px] z-30"
    >
      <button
        type="button"
        onClick={toggle}
        aria-label="About Washes.js"
        aria-expanded={open}
        data-paint-skip
        className="bg-confetti-black text-caresignal-white inline-flex size-[24px] items-center justify-center rounded-[12px]"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden fill="none">
          {/* Dot */}
          <circle cx="6" cy="2.6" r="0.9" fill="currentColor" />
          {/* Stem */}
          <path
            d="M6 5 L6 9.4"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open ? (
        <div className="absolute bottom-[32px] left-0">
          <FadeUp from={6} duration={240}>
            <Popover title="Powered by Washes.js" onClose={close}>
              <p className="mb-0 leading-[20px]">
                Washes.js is an in-browser watercolor library based primarily
                on seminal research from Pixar, Stanford, and University of
                Washington. I vibe-coded and iterated on the library with
                Claude.
              </p>
              <p className="mb-0">&nbsp;</p>
              <p className="mb-0 leading-[20px]">
                Kris Baumgartner created an early GPU optimization. It was
                inspired by explorations of the paper Dan Knutson performed
                during my time at the Recurse Center.
              </p>
            </Popover>
          </FadeUp>
        </div>
      ) : null}
    </div>
  );
}
