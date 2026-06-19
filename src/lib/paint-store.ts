import { create } from "zustand";

// Shared interactive state for the paint-brush + washes flow.
// Populated in PR 4c; this PR sets up the surface and initial values only.
//
// Annotation source (Figma `User's Paint Brush > Click to Paint`):
//   "'Click to Paint' shows up each time the washes panel is re-activated.
//    Disappears while the user is painting."
//
// Annotation source (Figma PresetWidget Location Selector):
//   "Clicking Location, Time, or Weather scrolls up to the Washes canvas and
//    then resets the visualization."

export type BrushPoint = { x: number; y: number };

export type PaintState = {
  washesVisible: boolean;
  isPainting: boolean;
  brushPosition: BrushPoint | null;
  setWashesVisible: (visible: boolean) => void;
  setIsPainting: (painting: boolean) => void;
  setBrushPosition: (point: BrushPoint | null) => void;
  resetWashes: () => void;
};

export const usePaintStore = create<PaintState>((set) => ({
  washesVisible: false,
  isPainting: false,
  brushPosition: null,
  setWashesVisible: (washesVisible) => set({ washesVisible }),
  setIsPainting: (isPainting) => set({ isPainting }),
  setBrushPosition: (brushPosition) => set({ brushPosition }),
  resetWashes: () => set({ isPainting: false, brushPosition: null }),
}));
