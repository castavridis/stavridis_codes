'use client';

import { animated, easings, useTransition } from '@react-spring/web';
import { useEffect, type MouseEvent, type ReactNode } from 'react';

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

// TODO(follow-up): focus trap while open.
export default function SheetOverlay({
  open,
  onClose,
  children,
  topOffset = 0,
}: SheetOverlayProps): React.ReactElement | null {
  const transitions = useTransition(open, {
    from: { backdrop: 0, y: 100 },
    enter: { backdrop: 1, y: 0 },
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

  const handleBackdrop = (e: MouseEvent<HTMLDivElement>) => {
    // Only close when the backdrop itself was clicked, not bubbled from content.
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <>
      {transitions((style, isOpen) =>
        isOpen ? (
          <animated.div
            onMouseDown={handleBackdrop}
            style={{
              position: 'fixed',
              top: topOffset,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 50,
              backgroundColor: style.backdrop.to((v) => `rgba(0, 0, 0, ${v * 0.4})`),
            }}
          >
            <animated.div
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
