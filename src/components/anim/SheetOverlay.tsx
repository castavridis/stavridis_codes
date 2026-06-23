'use client';

import { animated, easings, useTransition } from '@react-spring/web';
import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react';

// Selector for tab-reachable focusable elements. Excludes negative tabindex
// and disabled controls. Visibility is filtered at runtime via offsetParent.
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusables(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    // offsetParent is null when display:none / hidden ancestor.
    (el) => el.offsetParent !== null,
  );
}

type SheetOverlayProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  // Pixel offset from the top of the viewport at which the overlay's
  // backdrop + content start (Path A in the project-overlay arch).
  // Defaults to 0 (full-viewport sheet — blog still uses this). When
  // set, the area above stays untouched so the landing's wash-shell
  // header remains visible AND interactive while the overlay is open.
  // The backdrop scrim also starts at this offset, matching the
  // visible content edge.
  topOffset?: number;
};

export default function SheetOverlay({
  open,
  onClose,
  children,
  topOffset = 0,
}: SheetOverlayProps): React.ReactElement | null {
  // Ref to the sheet's outer animated.div so we can scope focusable
  // queries to its subtree.
  const sheetRef = useRef<HTMLDivElement | null>(null);

  const transitions = useTransition(open, {
    from: { backdrop: 0, y: 100 },
    enter: { backdrop: 1, y: 0 },
    // On leave, content slides DOWN (y → 100%) only. Opacity stays at 1
    // throughout the slide so the sheet is fully visible as it moves —
    // per user direction "just animate it down".
    leave: { backdrop: 0, y: 100 },
    config: { duration: 600, easing: easings.easeOutCubic },
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Lock body scroll while the sheet is open so the landing's scroll
  // bar doesn't compete with the sheet content's own scroll container.
  // Restores whatever overflow was previously set on body.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Focus trap. On open: record the previously-focused element, focus
  // the first focusable inside the sheet. While open: keep Tab/Shift+Tab
  // cycling inside the sheet (window-level keydown so the trap fires
  // even if focus drifts to body). On close: restore focus.
  //
  // The trap waits one rAF after open so the sheet's enter animation
  // has mounted the children and they're focusable. Using `requestAnimationFrame`
  // (not `setTimeout`) lines up with the next paint.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    let raf = window.requestAnimationFrame(() => {
      const sheet = sheetRef.current;
      if (!sheet) return;
      const focusables = getFocusables(sheet);
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        // No focusables — make the sheet itself programmatically
        // focusable so keyboard users land somewhere meaningful.
        sheet.tabIndex = -1;
        sheet.focus();
      }
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const sheet = sheetRef.current;
      if (!sheet) return;
      const focusables = getFocusables(sheet);
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      // If focus is somehow outside the sheet (e.g. user clicked
      // backdrop, then tabbed), pull it back to the first focusable.
      if (!active || !sheet.contains(active)) {
        e.preventDefault();
        first.focus();
        return;
      }
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      // Restore focus to the element that had it before the sheet
      // opened, IF it's still in the DOM. Some pages re-render around
      // route changes so the trigger might be gone; in that case we
      // just leave focus on body and let the next user action move it.
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, [open]);

  const handleBackdrop = (e: MouseEvent<HTMLDivElement>) => {
    // Only close when the backdrop itself was clicked, not bubbled from content.
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <>
      {transitions((style, isOpen) =>
        isOpen ? (
          <animated.div
            ref={sheetRef}
            onMouseDown={handleBackdrop}
            // `data-paint-skip` so clicks inside the sheet (project or
            // blog content) don't trigger the landing's window-level
            // pointerdown paint-activate handler — the wash region's
            // bounding rect spatially overlaps the sheet even when the
            // sheet visually covers it. PaintBrush walks up from the
            // click target via `closest('[data-paint-skip]')` and
            // bails when this attribute is found.
            data-paint-skip
            style={{
              position: 'fixed',
              top: topOffset,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 50,
            }}
            className="max-w-[1104px] m-auto overflow-hidden"
          >
            <animated.div
              className="bg-white rounded-xl overflow-hidden"
              style={{
                position: 'absolute',
                inset: 0,
                transform: style.y.to((v) => `translateY(${v}%)`),
              }}
            >
              {children}
            </animated.div>
          </animated.div>
        ) : null,
      )}
    </>
  );
}
