// Hand-written surface for the ported watercolour-orbit engine (see
// watercolour-orbit.js, ported from the case-study design handoff).

// A bare wash sheet with the figure's paints and status mixes, for other
// figures (e.g. Care Team Orbit) to stain into. Coordinates are 0–1 of the
// sheet; r is a fraction of its shorter side.
export type WashSheetHandle = {
	ink(x: number, y: number, r: number, name: string, load?: number): void;
	rewet(x: number, y: number, r: number): void;
	paper(x: number, y: number, r: number): void;
	clear(): void;
	pause(): void;
	resume(): void;
	destroy(): void;
};

export function washSheet(
	host: HTMLElement,
	opts?: { width?: number; height?: number; colorblind?: boolean },
): Promise<WashSheetHandle>;

export type OrbitMountHandle = {
	setPaused(v: boolean): void;
	setDotPx(px: number): void;
	skip(): void;
	setLabel(t: string): void;
	setParams(p: Record<string, unknown>): void;
	restart(): void;
	playFrom(at: string): void;
	destroy(): void;
};

export function mount(
	stage: HTMLElement,
	opts: {
		params: Record<string, unknown>;
		onStats?: (stats: Record<string, unknown>) => void;
		photo?: string;
		photoBefore?: string;
		photoLunch?: string;
	},
): OrbitMountHandle;
