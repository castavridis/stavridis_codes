import type { SpringConfig } from '@react-spring/web';

export type CardPos = { x: number; y: number };

export type CardSpringStep = {
  x?: number;
  y?: number;
  opacity?: number;
  scale?: number;
  blurPx?: number;
  config?: SpringConfig;
};

export type CardTransitionPreset = {
  id: string;
  label: string;
  // Returns a single target or multi-step array for the `to` prop of api.start().
  // `prev` is the card's position before the swap; `next` is the target slot.
  getTo: (prev: CardPos, next: CardPos, cardIndex: number) => CardSpringStep | CardSpringStep[];
  config?: SpringConfig;
  // ms delay between each card's animation start (stagger).
  trail?: number;
};

export const ANIM_STORAGE_KEY = 'hero-card-animation';
export const DEFAULT_PRESET_ID = 'flip-slide';

export const CARD_TRANSITION_PRESETS: Record<string, CardTransitionPreset> = {
  'flip-slide': {
    id: 'flip-slide',
    label: 'FLIP Slide',
    getTo: (_prev, next) => ({
      x: next.x,
      y: next.y,
      opacity: 1,
      scale: 1,
      blurPx: 0,
    }),
    config: { tension: 180, friction: 22 },
  },

  'arc-float': {
    id: 'arc-float',
    label: 'Arc Float',
    getTo: (prev, next) => [
      // Lift up and scale slightly
      { x: prev.x, y: prev.y - 24, scale: 1.05, config: { tension: 420, friction: 18 } },
      // Arc to destination and settle
      { x: next.x, y: next.y, scale: 1, config: { tension: 160, friction: 26 } },
    ],
    trail: 110,
  },

  'watercolor-dissolve': {
    id: 'watercolor-dissolve',
    label: 'Watercolor Dissolve',
    // The dissolve preset doesn't move cards — it blurs out then blurs in.
    // The hero handles the two-phase content swap via onRest.
    getTo: (_prev, _next) => ({ opacity: 0, blurPx: 10 }),
    config: { tension: 90, friction: 22 },
  },
};
