import { create } from "zustand";

import type { DayPhase, WeatherKey } from "../features/landing/lib/weather.js";

// Shared interactive state for the paint-brush + washes flow.
//
// Annotation source (Figma `User's Paint Brush > Click to Paint`):
//   "'Click to Paint' shows up each time the washes panel is re-activated.
//    Disappears while the user is painting."
//
// Annotation source (Figma PresetWidget Location Selector):
//   "Clicking Location, Time, or Weather scrolls up to the Washes canvas and
//    then resets the visualization."
//
// `resetVersion` is a bump counter the WashesCanvas component subscribes to —
// each increment triggers a fade-out / clear / reseed / fade-in. The preset
// widget bumps it from a single call: `triggerReset()`.

export type BrushPoint = { x: number; y: number };
export type BrushColor = { r: number; g: number; b: number };

const DEFAULT_BRUSH_COLOR: BrushColor = { r: 165, g: 14, b: 83 }; // washes-rose

export type PaintState = {
  washesVisible: boolean;
  isPainting: boolean;
  // Latches to true on the first paint stroke and stays true for the
  // session. Drives the "expose washes" treatment from Figma frames
  // `Landing Page – Paint 00/01/02` — the Intro glass card fades out
  // and shifts down so the wash is fully visible for painting. Cleared
  // by `resetWashes` and `triggerReset` so the card comes back after a
  // visualization reset.
  paintActive: boolean;
  // True while a project-detail overlay is open (case-study sheet
  // covering most of the viewport, leaving the landing wash shell
  // visible at the top — Path A in the project-overlay arch notes).
  //
  // Gates a few things across the landing:
  //   1. The intro glass card fades + slides out (same animation as
  //      paint mode) so the wash shell behind the overlay reads as a
  //      clean header strip with logo + nav + Contact Me.
  //   2. The PaintBrush hides its 88px brush + click-to-paint ring and
  //      its pointer-down latch is a no-op — so the wash strip visible
  //      above the project overlay can't be painted while the overlay
  //      is up.
  //   3. The Header's PaintToggle hides for the same reason (no entry
  //      into paint mode while a project is up).
  //
  // `setPaintActive` is a no-op while `projectOpen` is true; we hard-
  // guard at the source so any caller (PaintBrush, Header toggle) is
  // gated without each having to remember the rule.
  projectOpen: boolean;
  brushPosition: BrushPoint | null;
  brushColor: BrushColor;
  currentLocationIndex: number;
  currentDayPhase: DayPhase | null;
  currentWeather: WeatherKey | null;
  resetVersion: number;
  setWashesVisible: (visible: boolean) => void;
  setIsPainting: (painting: boolean) => void;
  setPaintActive: (active: boolean) => void;
  setProjectOpen: (open: boolean) => void;
  setBrushPosition: (point: BrushPoint | null) => void;
  setBrushColor: (color: BrushColor) => void;
  setCurrentLocationIndex: (idx: number) => void;
  setCurrentDayPhase: (phase: DayPhase | null) => void;
  setCurrentWeather: (weather: WeatherKey | null) => void;
  triggerReset: () => void;
  resetWashes: () => void;
};

export const usePaintStore = create<PaintState>((set) => ({
  washesVisible: false,
  isPainting: false,
  paintActive: false,
  projectOpen: false,
  brushPosition: null,
  brushColor: DEFAULT_BRUSH_COLOR,
  currentLocationIndex: 0,
  currentDayPhase: null,
  currentWeather: null,
  resetVersion: 0,
  setWashesVisible: (washesVisible) => set({ washesVisible }),
  setIsPainting: (isPainting) => set({ isPainting }),
  // Single source of truth for "paint mode is locked out". When a
  // project overlay is open we drop paintActive flips on the floor;
  // callers don't need to remember the rule.
  setPaintActive: (paintActive) =>
    set((s) => (s.projectOpen ? {} : { paintActive })),
  setProjectOpen: (projectOpen) =>
    set((s) =>
      // Force-clear paint mode whenever a project opens so the wash
      // shell at top of the overlay reads clean (no brush, no swatch
      // overlay). When the overlay closes, paint stays off until the
      // user opts back in — that matches the spec "paint mode is
      // disabled while project is open".
      projectOpen && s.paintActive
        ? { projectOpen, paintActive: false, isPainting: false }
        : { projectOpen },
    ),
  setBrushPosition: (brushPosition) => set({ brushPosition }),
  setBrushColor: (brushColor) => set({ brushColor }),
  setCurrentLocationIndex: (currentLocationIndex) =>
    set({ currentLocationIndex }),
  setCurrentDayPhase: (currentDayPhase) => set({ currentDayPhase }),
  setCurrentWeather: (currentWeather) => set({ currentWeather }),
  // Preserve paintActive across a reset — the user clicked a preset
  // selector to change the visualization, not to leave paint mode. Only
  // clear the transient `isPainting` (mid-stroke) flag.
  triggerReset: () =>
    set((s) => ({
      resetVersion: s.resetVersion + 1,
      isPainting: false,
    })),
  resetWashes: () =>
    set({ isPainting: false, brushPosition: null, paintActive: false }),
}));
