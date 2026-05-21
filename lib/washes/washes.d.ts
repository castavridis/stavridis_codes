// washes.d.ts
//
// TypeScript declarations for the Washes watercolor simulation library.
//
// The runtime is plain JavaScript (no compilation step). These declarations
// describe the public API surface as it exists at the JS level. Internal
// helpers, debug methods (`_debug_*`), and private state are intentionally
// omitted.
//
// Authored against lib v0.85. When the lib adds new public methods, add
// them here. Methods removed from the lib should be removed here too —
// keep this file in sync with the actual API.

// =============================================================================
// Core types
// =============================================================================

/** Pigment slot index. 0 = quinacridone rose, 1 = hansa yellow, 2 = cerulean blue. */
export type PigmentIndex = 0 | 1 | 2;

/**
 * Named brushes that aren't tied to a pigment slot.
 *
 * - `'water'`: clear water; reactivates dry pigment and helps it spread.
 * - `'lift'`: removes pigment from cells it touches.
 * - `'rainbow'`: time-varying rainbow color from a phase-shifted palette.
 * - `'mask'`: paints into the freeze-mask layer (cells that flow skips).
 */
export type NamedBrush = 'water' | 'lift' | 'rainbow' | 'mask';

/**
 * Anything pigment-shaped that the lib will accept. Numbers select a pigment
 * slot; strings select a slot by name OR select a special brush. The slot
 * names match the pigment palette in the docs.
 */
export type PigmentOption =
  | PigmentIndex
  | 'rose' | 'yellow' | 'blue'
  | 'quinacridone-rose' | 'hansa-yellow' | 'cerulean-blue'
  | NamedBrush;

/** Advection scheme used by `movePigment()`. */
export type AdvectionMode = 'standard' | 'clamp' | 'substep' | 'semilag';

/**
 * Edge boundary behavior. See the Open Boundaries section in the docs.
 *
 * - `'closed'`: walls reflect (mass conserved).
 * - `'open'`: all edges drain; no ambient bias.
 * - `'gravity'`: edges open in the direction of gravity, with active bias.
 */
export type EdgeMode = 'closed' | 'closed-gravity' | 'open' | 'gravity';

/**
 * Direction of the gravity velocity bias. 8-compass plus two radial modes.
 * `'radial'` points outward from canvas center per-cell (mass drains toward edges);
 * `'radial-in'` points inward toward canvas center per-cell (mass piles toward center).
 *
 * In `'gravity'` edge mode, `'radial'` opens all four edges, `'radial-in'` keeps
 * them all closed (it's pointless to open edges when the bias pulls mass away
 * from them — opening would just leak mass that should have stayed put).
 */
export type GravityDirection =
  | 'up' | 'up-right' | 'right' | 'down-right'
  | 'down' | 'down-left' | 'left' | 'up-left'
  | 'radial' | 'radial-in';

/**
 * Gouache rendering mode.
 *
 * - `false`: pure watercolor (translucent pigments).
 * - `true`: opaque gouache pigments.
 * - `'auto'`: LERP between watercolor and gouache based on paper darkness.
 */
export type GouacheMode = boolean | 'auto';

/** Pause options (v0.90). */
export interface PauseOptions {
  /**
   * If true, pointer input is still accepted while paused — the user
   * can paint deposits onto the frozen canvas, which become visible
   * immediately but don't evolve via the sim until `resume()` is
   * called. If false (default), pointer input is ignored entirely
   * while paused.
   */
  acceptInput?: boolean;
}

/** Return value of `wc.paused()` — falsy when running, object when paused. */
export type PauseState = false | { acceptInput: boolean };

/** Quality preset bundling cost-vs-quality knobs (v0.89). */
export type QualityPreset = 'high' | 'medium' | 'low' | 'minimum';

/** Hint for picking an initial quality preset based on a static device signal (v0.89). */
export type QualityHint = 'auto-mobile';

// =============================================================================
// Splash / brush input shapes
// =============================================================================

/**
 * One epicenter for a splash. Coordinates are in display pixels relative to
 * the canvas host element. Velocity controls outward radial speed.
 */
export interface SplashEpicenter {
  x: number;
  y: number;
  /**
   * Outward radial velocity at the epicenter. Default ~40.
   * Below 5 is gentle; above 60 is dramatic.
   * @minimum 0
   * @maximum 200
   */
  velocity?: number;
}

/**
 * Options for a single splash call. Anything not specified falls back to the
 * library's current configuration (radius, pressure, etc.).
 */
export interface SplashOptions {
  /**
   * Outer ring radius in display pixels.
   * @minimum 1
   * @maximum 2000
   */
  radius?: number;
  /**
   * Peak pressure at the epicenter. Drives the initial outward push.
   * @minimum 0
   * @maximum 100
   */
  pressure?: number;
  /**
   * Per-frame pressure decay multiplier. Range (0, 1]. Default ~0.94.
   * @minimum 0.5
   * @maximum 1
   */
  liftRate?: number;
  /** Angular offset for ray patterns, radians. */
  angleOffset?: number;
  /**
   * Random jitter on epicenter position, 0..1.
   * @minimum 0
   * @maximum 1
   */
  jitter?: number;
  /**
   * Number of rays in the splash pattern. 1 = pure circular.
   * @minimum 1
   * @maximum 64
   */
  rays?: number;
  /** Pigment used by this splash. Default = active brush pigment. */
  pigment?: PigmentOption;
}

/** Style of splash. Different presets shape the radial profile differently. */
export type SplashStyle = 'deluge' | 'splash' | 'spray';

// =============================================================================
// SVG / image / text rendering
// =============================================================================

/**
 * Options for `traceSVG`. The lib parses the SVG, decomposes it into
 * pen-stroke paths, and animates drawing them onto the canvas.
 */
export interface TraceSVGOptions {
  /** Pigment to use for paths without a recognized fill/stroke color. */
  pigment?: PigmentOption;
  /**
   * Display-pixel brush size while tracing.
   * @minimum 1
   * @maximum 2000
   */
  brushSize?: number;
  /**
   * 0..1 stamp strength per point.
   * @minimum 0
   * @maximum 1
   */
  strength?: number;
  /** Recognize chroma-key and pigment-hex colors as direct pigment assignments. Default true. */
  triggerColors?: boolean;
  /** Recognize any color and decompose into pigment mix via subtractive theory. Default false. */
  approximateColor?: boolean;
  /** Mirror the trace horizontally. */
  flipX?: boolean;
  /** Mirror the trace vertically. Default true (SVG y-axis is screen-down). */
  flipY?: boolean;
  /**
   * If false, paint every point synchronously in one frame — no animation.
   * The drawn SVG appears whole instantly. (v0.90)
   *
   * Equivalent to the older `instant: true` option (kept for backward compat).
   * When false, any `durationMs` is ignored since there's nothing to animate.
   */
  animate?: boolean;
  /** @deprecated Use `animate: false` instead. */
  instant?: boolean;
  /**
   * Spread the trace over roughly this many ms with easing.
   * Mutually exclusive with `animate: false` (the latter wins).
   * @minimum 1
   * @maximum 600000
   */
  durationMs?: number;
  /** Easing curve when durationMs is set. */
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'penStroke';
  /**
   * Pause N ms between each top-level path.
   * @minimum 0
   * @maximum 10000
   */
  perStrokePauseMs?: number;
  /** Optional bounds (in grid coordinates) for the SVG to fit inside. */
  bounds?: { x: number; y: number; w: number; h: number };
  /** Called once when the trace completes. Only meaningful when animate is true. */
  onComplete?: () => void;
}

/** Options for `paintImage`. Source can be a URL, a data URL, or an HTMLImageElement. */
export interface PaintImageOptions {
  pigment?: PigmentOption;
  /**
   * @minimum 1
   * @maximum 2000
   */
  brushSize?: number;
  /**
   * 0..1 threshold for which pixels become pigment.
   * @minimum 0
   * @maximum 1
   */
  threshold?: number;
  flipX?: boolean;
  flipY?: boolean;
  /** Reverse light/dark mapping. */
  invert?: boolean;
  /**
   * Multiplicative scale for the image when stamping onto the canvas.
   * @minimum 0.01
   * @maximum 10
   */
  scale?: number;
  translateX?: number;
  translateY?: number;
  onComplete?: () => void;
}

/** Options for `paintText`. */
export interface PaintTextOptions {
  pigment?: PigmentOption;
  /**
   * @minimum 1
   * @maximum 2000
   */
  brushSize?: number;
  /**
   * @minimum 8
   * @maximum 500
   */
  fontSize?: number;
  fontFamily?: string;
  x?: number;
  y?: number;
  onComplete?: () => void;
}

// =============================================================================
// Animation, visualization, time-wash
// =============================================================================

export type AnimationName = 'off' | 'breathe' | 'drift' | 'pulse' | string;
export interface AnimationOptions {
  /**
   * @minimum 0
   * @maximum 10
   */
  speed?: number;
  /**
   * @minimum 0
   * @maximum 1
   */
  amplitude?: number;
}

export type VisualizationName = 'off' | 'velocity' | 'pressure' | 'wet' | 'mask' | string;
export interface VisualizationOptions {
  /**
   * @minimum 0
   * @maximum 1
   */
  opacity?: number;
}

// =============================================================================
// Sketch / obliterate / fade
// =============================================================================

export interface SketchModeOptions {
  enabled?: boolean;
  /**
   * @minimum 0
   * @maximum 1
   */
  strength?: number;
  /**
   * @minimum 0
   * @maximum 1
   */
  paperContrast?: number;
}

export interface ObliterateOptions {
  /**
   * Duration of the obliterate animation, ms.
   * @minimum 100
   * @maximum 60000
   */
  duration?: number;
  /** Easing function: 'linear' | 'ease-out' | 'cubic' or a custom (t: number) => number. */
  easing?: string | ((t: number) => number);
  onComplete?: () => void;
}

// =============================================================================
// Performance metrics
// =============================================================================

export interface PerfMetrics {
  fps: number;
  p50: number;
  p95: number;
  p99: number;
  activeCells: number;
  activeCellsPct: number;
  heapDeltaMB: number;
  longAnimationFrames: number;
  perPhaseMs: {
    diffuse: number;
    edge: number;
    velocity: number;
    advection: number;
    transfer: number;
    render: number;
  };
}

// =============================================================================
// Serializable preset (state subset; not a snapshot of pigment fields)
// =============================================================================

/**
 * Serializable subset of the lib's configuration. Round-trippable via
 * `getPreset()` and `applyPreset()`. Used for "save my current settings"
 * UX. Does NOT capture pigment fields — for that, use the canvas as an
 * image or call `state()` (which returns Float32Arrays not suitable for JSON).
 */
export interface Preset {
  pigment?: PigmentOption;
  brushSize?: number;
  paperWetness?: string;
  evaporation?: number;
  edgeMode?: EdgeMode;
  gravityDirection?: GravityDirection;
  gravityStrength?: number;
  velocityClamp?: number;
  gouacheMode?: GouacheMode;
  advectionMode?: AdvectionMode;
  maskTint?: boolean;
  webgl?: boolean;
  // Forward-compat: unknown keys are preserved through round-trip.
  [key: string]: unknown;
}

// =============================================================================
// Constructor options
// =============================================================================

/**
 * Options passed to `Washes.create()`. All are optional — sensible defaults
 * are computed from the target element's size and the user's viewport.
 */
export interface CreateOptions {
  /**
   * Pixels per simulation cell. Higher = lower-res, faster. Default = 1.75.
   * URL `?scale=` also accepted.
   * @minimum 1
   * @maximum 6
   */
  scale?: number;
  /**
   * Canvas DPI scale factor. Default = window.devicePixelRatio.
   * @minimum 0.5
   * @maximum 4
   */
  canvasScale?: number;
  /** Force mobile-mode heuristics (palm rejection, etc.). Default auto-detected via `matchMedia('(pointer: coarse)')`. */
  mobile?: boolean;
  /** Show floating cursor preview circle. Default true on desktop. */
  cursorPreview?: boolean;
  /** Initial gouache mode. Default `false`. Pass `'auto'` for paper-darkness-driven LERP. */
  gouacheMode?: GouacheMode;
  /** Continuous flow during paint strokes. Default true. */
  continuousFlow?: boolean;
  /** Disable pointer event handling entirely. Useful for programmatic control. Default true. */
  pointer?: boolean;
  /**
   * Static hint for picking an initial quality preset (v0.89). Only
   * 'auto-mobile' is currently supported, which raises starting
   * `scale` for coarse-pointer devices. Any explicit `scale` option
   * wins over the hint. Hint is one-shot — it doesn't enable runtime
   * adaptation.
   */
  qualityHint?: QualityHint;
}

// =============================================================================
// Returned instance
// =============================================================================

/**
 * Most setters return `this` to support chained calls. Getters return the
 * current value. The `(v?: T)` pattern throughout — pass nothing to read,
 * pass a value to set.
 */
export interface WashesInstance {
  // -----------------------------------------------------------------------
  // Painting input
  // -----------------------------------------------------------------------

  /** Inject a splash at one or more epicenters. */
  splash(epicenters: SplashEpicenter[], style?: SplashStyle, opts?: SplashOptions): WashesInstance;

  /**
   * Programmatic paint stamp at grid coordinates (not display coordinates).
   * Use `toGrid(displayX, displayY)` to convert if you have display coords.
   *
   * @param gx grid X coordinate
   * @param gy grid Y coordinate
   * @param gridRadius radius in grid cells
   * @param pigment optional pigment override (defaults to active)
   * @param strength 0..1 stamp strength
   */
  paintAt(
    gx: number,
    gy: number,
    /**
     * @minimum 0.5
     * @maximum 200
     */
    gridRadius: number,
    pigment?: PigmentOption,
    /**
     * @minimum 0
     * @maximum 1
     */
    strength?: number
  ): WashesInstance;

  /** Stamp text using the active brush. */
  paintText(text: string, opts?: PaintTextOptions): Promise<void>;

  /** Stamp an image using the active brush (light/dark map to pigment density). */
  paintImage(source: string | HTMLImageElement, opts?: PaintImageOptions): Promise<void>;

  /**
   * Trace an SVG onto the canvas. Returns the total number of stamp
   * points that will be (or were, for animate:false) painted. The
   * actual painting either happens immediately (animate:false) or
   * over multiple animation frames after this call returns.
   *
   * For Promise-based completion, listen on the host element for
   * the 'svgtracedone' event, or pass an `onComplete` callback in opts.
   */
  traceSVG(svgText: string, opts?: TraceSVGOptions): number;
  /** Cancel any in-flight SVG trace. */
  cancelSVGTrace(): WashesInstance;

  // -----------------------------------------------------------------------
  // Brush state
  // -----------------------------------------------------------------------

  /**
   * Current brush diameter in display pixels. Default 28.
   * @minimum 1
   * @maximum 2000
   */
  brushSize(v?: number): number;

  /**
   * Active pigment (or named brush) for subsequent paint operations.
   *
   * - Called with no arg → returns the current pigment.
   * - Called with a pigment → sets it and returns the instance (chainable).
   */
  pigment(): PigmentOption;
  pigment(v: PigmentOption): WashesInstance;

  /** Read-only list of available pigment indices. */
  pigments(): PigmentIndex[];

  /**
   * Paint load: how much pigment is delivered per stamp.
   * @minimum 0.001
   * @maximum 5
   */
  paintLoad(v?: number): number;

  /**
   * Water load: how much water is delivered per stamp. v0.92 raised max to 8
   * to support pooling effects.
   * @minimum 0.2
   * @maximum 8
   */
  waterLoad(v?: number): number;

  /**
   * Brush pressure: epicenter intensity multiplier.
   * @minimum 0
   * @maximum 1
   */
  pressure(v?: number): number;

  /**
   * Flow rate: how quickly pigment spreads after stamping.
   * @minimum 0
   * @maximum 1
   */
  flow(v?: number): number;

  /** Use pointer pressure (stylus) to modulate flow. Default true if supported. */
  usePointerPressure(v?: boolean): boolean;

  /** Whether dragging produces continuous flow or per-stamp dots. Default true. */
  continuousFlow(v?: boolean): boolean;

  // -----------------------------------------------------------------------
  // Paper state
  // -----------------------------------------------------------------------

  /** Set paper wetness preset (changes evaporation rate among other things). */
  paperWetness(preset?: string): string;
  /** List available wetness presets. */
  paperWetnessPresets(): string[];

  /**
   * Direct evaporation rate. Higher = wash dries faster.
   * Internally: rate = 0.9988^value. ~1 is very wet, ~50 is bone-dry.
   * @minimum 0.1
   * @maximum 200
   */
  evaporation(value?: number): number;

  /** Pause/resume the drying simulation. */
  pauseDrying(v?: boolean): boolean;

  /**
   * Set paper color. Each channel is a normalized 0..1 float.
   * @minimum 0
   * @maximum 1
   */
  paperColor(r: number, g: number, b: number): WashesInstance;

  /** Read the current rainbow brush color (for hover-state UI). */
  rainbowColor(): { r: number; g: number; b: number };

  // -----------------------------------------------------------------------
  // Edge boundaries (v0.81-v0.84)
  // -----------------------------------------------------------------------

  /** Edge boundary mode: closed, open, or gravity. */
  edgeMode(v?: EdgeMode): EdgeMode;

  /** Gravity direction (8-compass plus 'radial'). Ignored in `closed` mode. */
  gravityDirection(v?: GravityDirection): GravityDirection;

  /**
   * Gravity bias strength. 0 = no pull; ~0.10 = strong tilt; ~1.0 = max.
   * Practical range: 0 to ~0.25. Values above 0.5 feel like the page is
   * being shaken rather than tilted.
   * @minimum 0
   * @maximum 1
   */
  gravityStrength(v?: number): number;

  /**
   * Per-cell velocity magnitude cap. Auto-computed from `scale` by default
   * (so display speed is resolution-invariant). Pass `null` to restore the
   * auto-computed default.
   *
   * Note: values above ~1.7 require semi-Lagrangian advection mode; donor-
   * cell modes will produce the cardinal-cross artifact above that bound.
   * @minimum 0.5
   * @maximum 7.5
   */
  velocityClamp(v?: number | null): number;

  /**
   * Render-time alpha falloff in the last N grid cells at each edge,
   * using a smoothstep curve. The pigment is still mathematically
   * present; the render just makes it transparent. 0 disables.
   *
   * Independent of edge mode — composes freely. Useful with
   * 'closed-gravity' mode to get gravity dynamics without the
   * visible edge buildup. (v0.88)
   * @minimum 0
   * @maximum 80
   */
  edgeFade(v?: number): number;

  // -----------------------------------------------------------------------
  // Rendering / display
  // -----------------------------------------------------------------------

  /** Toggle gouache rendering mode. */
  gouacheMode(v?: GouacheMode): GouacheMode;
  /** Current LERP amount in 'auto' gouache mode. 0 = full watercolor, 1 = full gouache. */
  gouacheLerpAmount(): number;

  /** Advection scheme. */
  advectionMode(v?: AdvectionMode): AdvectionMode;
  /** Substeps used by the most recent movePigment call. */
  advectionLastSubsteps(): number;

  /** Whether edge darkening is applied. Default true. */
  edgeDarkening(v?: boolean): boolean;

  /** Show the amber tint over masked cells. Default true. */
  maskTint(v?: boolean): boolean;

  /** Toggle WebGL rendering. Falls back to CPU if WebGL2 isn't supported. */
  webgl(v?: boolean): boolean;
  /** Whether WebGL2 was available at init. */
  webglAvailable(): boolean;
  /** Debug: tint visible cells green so you can see the active region. */
  webglDebugTint(v?: boolean): boolean;

  /** Background transparent (canvas paper rendered transparent). */
  transparent(v?: boolean): boolean;

  /**
   * Host-element CSS background (v0.89). Accepts any valid CSS
   * background value: solid color, `linear-gradient(...)`,
   * `radial-gradient(...)`, `url(...)`. Auto-enables transparent
   * canvas mode so the background shows through pigment-less areas.
   * Pass null or '' to clear.
   *
   * Pigment compositing (Kubelka-Munk) is unaffected — the gradient
   * is purely a render-layer backdrop, not a physical paper tint.
   */
  background(value?: string | null): string;

  /**
   * Apply a named quality preset bundling cost-vs-quality knobs
   * (scale, advection mode, cursor preview, heatmap) into one call.
   * No runtime adaptation — this is a manual knob. Pass nothing to
   * read the most-recently-applied preset (null if none applied).
   *
   * - `'high'`    — scale 1.5, all features, fine grain.
   * - `'medium'`  — scale 2.0, all features. Library default.
   * - `'low'`     — scale 2.75, wetness heatmap forced off.
   * - `'minimum'` — scale 3.5, donor-cell advection, no cursor
   *                preview, no heatmap. WARNING: brings back the
   *                cardinal-cross artifact (donor-cell).
   */
  quality(preset?: QualityPreset): QualityPreset | null;

  /**
   * Paper color/texture fade applied each frame to existing painted area.
   * @minimum 0
   * @maximum 1
   */
  fadePainting(v?: number): number;

  /**
   * Half-life of the fade-out, in milliseconds.
   * @minimum 100
   * @maximum 60000
   */
  fadeHalfLife(ms?: number): number;

  /** Auto-fade the background between strokes. */
  autoDryBackground(v?: boolean): boolean;

  /**
   * Canvas resolution: display pixels per sim cell. Triggers a rescale event.
   * Larger = lower-resolution sim = faster.
   * @minimum 1
   * @maximum 6
   */
  scale(v?: number): number;

  /**
   * Canvas DPI scale factor. Defaults to window.devicePixelRatio.
   * @minimum 0.5
   * @maximum 4
   */
  canvasScale(v?: number): number;

  /** Convert display coordinates to sim grid coordinates. */
  toGrid(displayX: number, displayY: number): { gx: number; gy: number };

  // -----------------------------------------------------------------------
  // Mask
  // -----------------------------------------------------------------------

  /** Clear the freeze mask. */
  removeMask(): WashesInstance;

  // -----------------------------------------------------------------------
  // Composition modes
  // -----------------------------------------------------------------------

  /** Sketch mode (paper-contrasting line drawing overlay). */
  sketchMode(opts?: SketchModeOptions): SketchModeOptions;

  /** Obliterate animation: progressively destroys the painting. */
  obliterate(opts?: ObliterateOptions): Promise<void>;

  // -----------------------------------------------------------------------
  // Background animation / visualization
  // -----------------------------------------------------------------------

  /** Set a named time-driven background wash. */
  setBackground(name: string): WashesInstance;
  isBackgroundRunning(): boolean;

  /** Toggle an animation mode (breathe, drift, pulse, etc.). */
  setAnimation(name: AnimationName, opts?: AnimationOptions): WashesInstance;
  getAnimation(): AnimationName;

  /** Toggle a debug visualization (velocity vectors, pressure heat, etc.). */
  setVisualization(name: VisualizationName, opts?: VisualizationOptions): WashesInstance;
  getVisualization(): VisualizationName;

  // -----------------------------------------------------------------------
  // Mobile / input
  // -----------------------------------------------------------------------

  /** Force mobile-mode heuristics. */
  mobile(v?: boolean): boolean;
  /** Was mobile auto-detected at init? */
  mobileDetected(): boolean;

  /** Show floating cursor preview circle. */
  cursorPreview(v?: boolean): boolean;

  // -----------------------------------------------------------------------
  // Performance
  // -----------------------------------------------------------------------

  /** Start/stop perf instrumentation. */
  perf(v?: boolean): boolean;
  /** Current perf snapshot. */
  perfMetrics(): PerfMetrics;

  // -----------------------------------------------------------------------
  // UI helpers
  // -----------------------------------------------------------------------

  /** Build pigment swatch DOM elements into the given root. */
  buildPigmentSwatches(rootEl: HTMLElement): void;

  // -----------------------------------------------------------------------
  // Export
  // -----------------------------------------------------------------------

  /** Export the current canvas as a PNG blob. */
  exportPNG(opts?: { width?: number; height?: number; transparent?: boolean }): Promise<Blob>;

  // -----------------------------------------------------------------------
  // Preset / state
  // -----------------------------------------------------------------------

  /** Serializable subset of the current configuration. */
  getPreset(): Preset;
  /** Apply a previously-saved preset. */
  applyPreset(preset: Preset): WashesInstance;

  /** Internal state object for debugging. Shape is intentionally unspecified. */
  state(): Record<string, unknown>;

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  /**
   * Pause the simulation (v0.90). Stops simStep, fadeStep, time-wash,
   * animation, and visualization steps. The rAF loop continues so
   * input still produces renders (when acceptInput is true) and so
   * resume() takes effect on the next frame.
   *
   * Programmatic deposits (splash, paintAt, traceSVG) still work
   * while paused — the pigment deposits visibly but doesn't evolve
   * until resume(). With acceptInput: true, pointer input also
   * deposits pigment.
   */
  pause(opts?: PauseOptions): WashesInstance;

  /**
   * Resume from pause (v0.90). Adjusts wall-clock timer references
   * for animations that were mid-flight at pause time so they pick
   * up where they left off instead of jumping ahead by the pause
   * duration.
   */
  resume(): WashesInstance;

  /**
   * Pause state inspector (v0.90). Returns `false` when running,
   * or `{ acceptInput: boolean }` when paused. The falsy-or-object
   * return supports both:
   * ```
   * if (wc.paused()) { ... }
   * const accepting = wc.paused() && wc.paused().acceptInput;
   * ```
   */
  paused(): PauseState;

  /** Tear down event listeners and free resources. */
  destroy(): void;
}

// =============================================================================
// Static API
// =============================================================================

/**
 * The Washes constructor namespace, as imported from `'washes'` or as the
 * `window.Washes` global. The lib doesn't expose a `class Washes`; instead
 * it exposes a `create()` factory function on this object.
 */
export interface WashesStatic {
  /**
   * Create a Washes instance attached to the given DOM element. The element
   * is treated as a host: a canvas is appended into it and sized to fill.
   *
   * @example
   * import { Washes } from 'washes';
   * const wc = Washes.create(document.getElementById('app')!, {
   *   gouacheMode: 'auto',
   * });
   * wc.splash([{ x: 200, y: 200, velocity: 40 }], 'deluge');
   */
  create(target: HTMLElement, options?: CreateOptions): WashesInstance;

  /** Library version, e.g. "0.85.0". */
  readonly version: string;
}

/** Default export: the WashesStatic namespace. */
declare const Washes: WashesStatic;
export { Washes };
export default Washes;

// =============================================================================
// Global augmentation — the lib also attaches `window.Washes` for use in
// no-bundler / classic-script contexts. TypeScript users who pull the lib
// via a script tag rather than `import` can rely on this global.
// =============================================================================

declare global {
  interface Window {
    Washes: WashesStatic;
  }
}
