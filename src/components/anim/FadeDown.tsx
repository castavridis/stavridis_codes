'use client';

import { animated, easings, useSpring } from '@react-spring/web';
import type { ReactNode } from 'react';

type FadeDownProps = {
  delay?: number;
  from?: number;
  duration?: number;
  children: ReactNode;
};

export default function FadeDown({
  delay = 0,
  from = -8,
  duration = 600,
  children,
}: FadeDownProps): React.ReactElement {
  const styles = useSpring({
    from: { opacity: 0, y: from },
    to: { opacity: 1, y: 0 },
    delay,
    config: { duration, easing: easings.easeOutCubic },
  });

  return (
    <animated.div
      style={{ opacity: styles.opacity, transform: styles.y.to((v) => `translateY(${v}px)`) }}
    >
      {children}
    </animated.div>
  );
}
