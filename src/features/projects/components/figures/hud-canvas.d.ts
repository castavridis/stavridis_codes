// Types for the framework-agnostic hud-canvas module (see hud-canvas.js).

export type HudStats = {
	phase?: string;
	minute?: number | null;
	spans?: string;
	log?: string;
	all?: string;
} | null;

/** "How Time is Spent": the 9–5 shift as 50 status-coloured dots over time. */
export function drawDayStrip(
	cv: HTMLCanvasElement | null,
	spans?: string,
	minute?: number | null,
): void;

/** "Impact over time": impactful work as an equalizer (one 0–5 bar per 9.6 min). */
export function drawImpactStrip(
	cv: HTMLCanvasElement | null,
	spans?: string,
	minute?: number | null,
): void;

/** "Patient Statuses": every patient as a dot (before = 100 from `log`, after = 1,600 from `all`). */
export function drawStatusGrid(cv: HTMLCanvasElement | null, stats: HudStats): void;

/** A minute offset from 9am as "h:mm am/pm" (empty for null/negative). */
export function fmtClock(minute?: number | null): string;

declare const HudCanvas: {
	drawDayStrip: typeof drawDayStrip;
	drawImpactStrip: typeof drawImpactStrip;
	drawStatusGrid: typeof drawStatusGrid;
	fmtClock: typeof fmtClock;
};
export default HudCanvas;
