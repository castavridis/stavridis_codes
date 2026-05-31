import type { SpringConfig } from '@react-spring/web';

export type CardTarget = { left: number; top: number; rotateZ: number };

// The animatable spring state for a card. Declared in full so react-spring can
// infer the SpringValues shape — sp.left / sp.top / etc. are then correctly typed.
export type CardSpringProps = {
  left?: number;
  top?: number;
  rotateZ?: number;
  opacity?: number;
  blurPx?: number;
  delay?: number;
  config?: SpringConfig;
};

// A preset builds the declarative spring props for a single card heading to its
// slot `target` at index `i`. These props are fed to useSprings(n, (i) => props,
// deps) so react-spring animates from each card's live position to the new target
// whenever the arrangement or preset changes.
export type CardTransitionPreset = {
  id: string;
  label: string;
  build: (target: CardTarget, i: number) => CardSpringProps;
};

export const ANIM_STORAGE_KEY = 'hero-card-animation';
export const DEFAULT_PRESET_ID = 'arc-float';

export const CARD_TRANSITION_PRESETS: Record<string, CardTransitionPreset> = {
  'flip-slide': {
    id: 'flip-slide',
    label: 'FLIP Slide',
    // Tight, simultaneous slide to the new slot.
    build: (t) => ({
      left: t.left,
      top: t.top,
      rotateZ: t.rotateZ,
      opacity: 1,
      blurPx: 0,
      config: { tension: 180, friction: 22 },
    }),
  },

  'arc-float': {
    id: 'arc-float',
    label: 'Arc Float',
    // Staggered, gently overshooting float (lower friction) so cards drift into place.
    build: (t, i) => ({
      left: t.left,
      top: t.top,
      rotateZ: t.rotateZ,
      opacity: 1,
      blurPx: 0,
      delay: i * 90,
      config: { tension: 150, friction: 16 },
    }),
  },
};
