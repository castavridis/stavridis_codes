// Shared palette + color helpers for the landing page.

export const CREAM = "#fbf6ea";
export const DARK = "#251900"; // the warm near-black the hero wash fades into

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = Number.parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
