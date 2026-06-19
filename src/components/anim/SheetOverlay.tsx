'use client';

import { animated, easings, useTransition } from '@react-spring/web';
import { useEffect, type MouseEvent, type ReactNode } from 'react';

type SheetOverlayProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

// TODO(follow-up): focus trap + scroll lock on body while open.
export default function SheetOverlay({
  open,
  onClose,
  children,
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
              inset: 0,
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
