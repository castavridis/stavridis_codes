import { createWorld, trait } from "koota";

// Koota ECS world for the Washes canvas + preset-widget animation system.
// Populated in PR 4c; this PR establishes the traits and the singleton world.
//
// A `Wash` is a single brushstroke or auto-generated paint daub on the
// canvas. Entities live until their `Lifetime.ttl` elapses, at which point
// the canvas reset (driven by the preset widget) flushes them.

export const Position = trait({ x: 0, y: 0 });
export const Velocity = trait({ x: 0, y: 0 });
export const Color = trait({ r: 0, g: 0, b: 0, a: 1 });
export const Radius = trait({ value: 24 });
export const Lifetime = trait({ born: 0, ttl: 0 });

export const Wash = trait();
export const PresetAnim = trait({ phase: 0, duration: 0 });

export const washesWorld = createWorld();
