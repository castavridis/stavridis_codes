// ---------------------------------------------------------------------------
// Washes info — 24×24 "i" badge anchored to the bottom-left of the Washes
// Canvas region. Clicking it opens a Popover ("Powered by Washes.js")
// extracted verbatim from Figma `Landing Page – Paint 02` (node 4014:43015).
//
// Visible only in paint mode. Fades in when `paintActive` flips true, fades
// out when it flips false. The open popover auto-closes if the user leaves
// paint mode while it's open.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import { animated, easings, useTransition } from "@react-spring/web";

import Popover from "../../../components/Popover.js";
import { usePaintStore } from "../../../lib/paint-store.js";

export function WashesInfo(): React.ReactElement {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const paintActive = usePaintStore((s) => s.paintActive);

  // Outside-click handler — close the popover when the user clicks/taps
  // anywhere outside the wrapper.
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

  // Auto-close if paint mode ends while the popover is open.
  useEffect(() => {
    if (!paintActive) setOpen(false);
  }, [paintActive]);

  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);

  // useTransition for proper fade-out on close (instant unmount was too
  // abrupt). Keyed on `open` so it animates enter AND leave.
  const popoverTransitions = useTransition(open, {
    from: { opacity: 0, y: 6 },
    enter: { opacity: 1, y: 0 },
    leave: { opacity: 0, y: 6 },
    config: { duration: 240, easing: easings.easeOutCubic },
  });

  return (
    // `data-paint-skip` keeps paint-brush from spawning a wash when the
    // pointer-down lands on the info button or its popover children
    // (paint-brush.tsx looks for that attribute via `closest`).
    //
    // Fades in/out with paintActive. `pointer-events` is gated so the
    // hidden button isn't accidentally clickable.
    <div
      ref={wrapperRef}
      data-paint-skip
      className="absolute bottom-[8px] left-[8px] z-30 transition-opacity duration-300 ease-out"
      style={{
        opacity: paintActive ? 1 : 0,
        pointerEvents: paintActive ? "auto" : "none",
      }}
      aria-hidden={!paintActive}
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

      {popoverTransitions((style, isOpen) =>
        isOpen ? (
          <animated.div
            className="absolute bottom-[32px] left-0"
            style={{
              opacity: style.opacity,
              transform: style.y.to((v) => `translateY(${v}px)`),
            }}
          >
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
          </animated.div>
        ) : null,
      )}
    </div>
  );
}
