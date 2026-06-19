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
  brushPosition: BrushPoint | null;
  brushColor: BrushColor;
  currentLocationIndex: number;
  currentDayPhase: DayPhase | null;
  currentWeather: WeatherKey | null;
  resetVersion: number;
  setWashesVisible: (visible: boolean) => void;
  setIsPainting: (painting: boolean) => void;
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
  brushPosition: null,
  brushColor: DEFAULT_BRUSH_COLOR,
  currentLocationIndex: 0,
  currentDayPhase: null,
  currentWeather: null,
  resetVersion: 0,
  setWashesVisible: (washesVisible) => set({ washesVisible }),
  setIsPainting: (isPainting) => set({ isPainting }),
  setBrushPosition: (brushPosition) => set({ brushPosition }),
  setBrushColor: (brushColor) => set({ brushColor }),
  setCurrentLocationIndex: (currentLocationIndex) =>
    set({ currentLocationIndex }),
  setCurrentDayPhase: (currentDayPhase) => set({ currentDayPhase }),
  setCurrentWeather: (currentWeather) => set({ currentWeather }),
  triggerReset: () =>
    set((s) => ({ resetVersion: s.resetVersion + 1, isPainting: false })),
  resetWashes: () => set({ isPainting: false, brushPosition: null }),
}));
