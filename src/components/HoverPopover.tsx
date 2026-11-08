import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { animated, easings, useTransition } from "@react-spring/web";

import { usePaintStore } from "../lib/paint-store.js";

// Wraps an inline phrase (e.g. an italic span) — or any inline-level
// element, like the FloretteSeal — so hovering or focusing it reveals an
// adjacent Popover. The popover floats
// just below+left of the phrase per the Figma hover states (nodes
// 2232:32188 and 4003:21284). A short close-delay lets the cursor cross the
// gap between the phrase and the popover without dismissing prematurely.
type HoverPopoverProps = {
  // The popover JSX to render in the portal. Each phrase can supply its
  // own custom popover layout (e.g. the Bailey popover renders a photo,
  // the Design Engineer popover uses the standard text Popover chrome).
  popover: ReactNode;
  children: ReactNode;
};

// Small companion to HoverPopover. Drives the portal mount/unmount via
// useTransition (keyed on `open`, NOT on `coords`) so the popover fades
// + slides in and out smoothly, AND so cursor-tracked coords updates
// don't re-fire the spring on every pointermove.
function PopoverPortal({
  open,
  anchor,
  children,
}: {
  open: boolean;
  anchor: { x: number; y: number } | null;
  children: ReactNode;
}): React.ReactElement {
  const transitions = useTransition(open, {
    from: { opacity: 0, y: 6 },
    enter: { opacity: 1, y: 0 },
    leave: { opacity: 0, y: 6 },
    config: { duration: 240, easing: easings.easeOutCubic },
  });
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  // Measure the popover and keep it inside the viewport: prefer placing it
  // ABOVE the anchor (the tap/cursor point); flip BELOW when above would
  // clip the top edge; clamp horizontally so it never runs off the sides.
  // useLayoutEffect runs before paint, so the pre-measure render (which may
  // hold a stale position) never reaches the screen. Re-runs on anchor
  // changes too, so cursor-tracked hovers stay clamped.
  useLayoutEffect(() => {
    if (!open || !anchor) return;
    const el = boxRef.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const M = 8; // min gap to the viewport edge
    const GAP = 8; // gap between the anchor point and the popover

    const left = Math.max(M, Math.min(anchor.x - GAP, vw - w - M));

    const above = anchor.y - GAP - h;
    const below = anchor.y + GAP;
    let top: number;
    if (above >= M) top = above; // fits above
    else if (below + h <= vh - M) top = below; // flip below
    else top = Math.max(M, Math.min(above, vh - h - M)); // clamp into view

    setPos({ top, left });
  }, [open, anchor]);

  return (
    <>
      {transitions((style, isOpen) =>
        isOpen && anchor
          ? createPortal(
              // `pointer-events: none` so the cursor moving over the
              // popover itself doesn't pull focus from the phrase (the
              // popover is hint-only). Hidden until measured so it never
              // flashes at the top-left corner.
              <animated.div
                ref={boxRef}
                className="fixed z-50 pointer-events-none"
                style={{
                  top: pos?.top ?? 0,
                  left: pos?.left ?? 0,
                  visibility: pos ? "visible" : "hidden",
                  opacity: style.opacity,
                  transform: style.y.to((v) => `translateY(${v}px)`),
                }}
              >
                {children}
              </animated.div>,
              document.body,
            )
          : null,
      )}
    </>
  );
}

export default function HoverPopover({
  popover,
  children,
}: HoverPopoverProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  // The tap/cursor point the popover positions itself against. Placement
  // (above/below + horizontal clamping) is resolved in PopoverPortal once
  // it can measure the popover against the viewport.
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  const wrapperRef = useRef<HTMLSpanElement | null>(null);
  const closeTimer = useRef<number | null>(null);
  // When paintActive flips true the glass card fades out + the underlying
  // italic phrases are no longer visible — disable hover/focus so the
  // popover doesn't open over the wash, and let pointer events pass
  // through to the canvas for painting. Same gate applies while a
  // project overlay is open: the card has faded, the phrases are
  // invisible (and translated), so hovering over their would-be
  // positions shouldn't surface popovers.
  const paintActive = usePaintStore((s) => s.paintActive);
  const projectOpen = usePaintStore((s) => s.projectOpen);
  const hoverSuppressed = paintActive || projectOpen;

  const cancelClose = useCallback(() => {
    if (closeTimer.current != null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => {
      setOpen(false);
      closeTimer.current = null;
    }, 120);
  }, [cancelClose]);

  // Record the anchor point (cursor/tap). PopoverPortal turns this into a
  // viewport-clamped position. Updates on every pointermove while open so
  // the popover tracks the cursor on desktop.
  const updateCoords = useCallback((clientX: number, clientY: number) => {
    setAnchor({ x: clientX, y: clientY });
  }, []);

  const openAt = useCallback(
    (clientX: number, clientY: number) => {
      if (hoverSuppressed) return;
      cancelClose();
      updateCoords(clientX, clientY);
      setOpen(true);
    },
    [cancelClose, hoverSuppressed, updateCoords],
  );

  // Bare onFocus (no pointer event) — fall back to the wrapper's rect.
  const openFromFocus = useCallback(() => {
    if (hoverSuppressed) return;
    cancelClose();
    const el = wrapperRef.current;
    if (el) {
      // No cursor position from a focus event — anchor to the wrapper's
      // top-left corner instead.
      const r = el.getBoundingClientRect();
      setAnchor({ x: r.left, y: r.top });
    }
    setOpen(true);
  }, [cancelClose, hoverSuppressed]);

  useEffect(() => {
    return () => {
      if (closeTimer.current != null) window.clearTimeout(closeTimer.current);
    };
  }, []);

  // Auto-close if paint mode starts OR a project overlay opens while
  // the popover is open.
  useEffect(() => {
    if (hoverSuppressed) setOpen(false);
  }, [hoverSuppressed]);

  // Close on scroll while open. The popover is anchored to a fixed viewport
  // position, so once the page scrolls (notably a touch-scroll on mobile,
  // which `touchmove` catches as the gesture begins) it would otherwise
  // hang detached from its phrase. Close immediately instead.
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, { passive: true });
    window.addEventListener("touchmove", close, { passive: true });
    return () => {
      window.removeEventListener("scroll", close);
      window.removeEventListener("touchmove", close);
    };
  }, [open]);

  return (
    // The wrapper stays inline (phrasing content) — only the popover is
    // portaled out to document.body so the hero <p> stays valid HTML. The
    // glass card body is `pointer-events: none`; `auto` here re-enables
    // the phrase + popover at rest. In paint mode or while the project
    // overlay is open the phrases are invisible, so we drop back to
    // `none` to let clicks fall through to the wash / overlay below.
    <span
      ref={wrapperRef}
      // `inline` (not inline-block) so the phrase flows + wraps with the
      // surrounding headline text instead of being forced onto its own
      // line as a single unwrappable unit. The popover is portaled to
      // <body>, so no positioning context is needed here.
      className="inline"
      style={{ pointerEvents: hoverSuppressed ? "none" : "auto" }}
      onMouseEnter={(e) => openAt(e.clientX, e.clientY)}
      onMouseMove={(e) => {
        if (open) updateCoords(e.clientX, e.clientY);
      }}
      onMouseLeave={scheduleClose}
      onFocus={openFromFocus}
      onBlur={scheduleClose}
    >
      {children}
      <PopoverPortal open={open} anchor={anchor}>
        {popover}
      </PopoverPortal>
    </span>
  );
}
