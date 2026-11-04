// Hand-written surface for the ported nurse-orbit engine (see
// nurse-orbit.js, ported from the case-study design handoff).

/** One emit from the simulation; before/after days carry different counters. */
export type NurseOrbitStats = {
	phase: 'before' | 'after';
	minute: number;
	onCall: 'idle' | 'ringing' | 'talking' | 'done' | 'lunch' | 'morph' | 'final';
	placed?: number;
	missed?: number;
	// Before day: statuses found so far.
	red?: number;
	yellow?: number;
	green?: number;
	// After day.
	alerts?: number;
	resolved?: number;
	yellows?: number;
	open?: number;
	redsLeft?: number;
	redsOf?: number;
	scenario?: string;
	queue?: string;
	active?: number;
	/** Per-patient status string (`a r y g G k u - d w`), after day only. */
	all?: string;
	/** Before day call log, one char per call. */
	log?: string;
	/** `start,end` + kind spans of how the day was spent. */
	spans?: string;
};

export type NurseOrbitParams = Record<string, unknown>;

export type NurseOrbitHandle = {
	setPaused(v: boolean): void;
	/** Land on a day's camera and portrait at once (0 before, 1 after). */
	snapCam(v: number): void;
	setDotPx(px: number): void;
	/** Run the whole story instantly, then rest on the finished picture. */
	skip(): void;
	/** Text on the rotating seal around the portrait. */
	setLabel(t: string): void;
	setParams(p: NurseOrbitParams): void;
	restart(): void;
	/** Fast-forward to the end of one day and stay there. */
	rest(which: 'before' | 'after' | 'tuesday'): void;
	playFrom(at: 'before' | 'after' | 'tuesday'): void;
	destroy(): void;
};

export function mount(
	stage: HTMLElement,
	opts: {
		params: NurseOrbitParams;
		onStats: (s: NurseOrbitStats) => void;
		photo: string;
		photoBefore?: string;
		photoLunch?: string;
	},
): NurseOrbitHandle;
