// Hand-written surface for the ported wash-highlight engine (see
// wash-highlight.js, ported from the case-study design handoff).

export type WashPigment = 'rose' | 'hansa' | 'cerulean' | 'rainbow' | (string & {});

export type WashHighlightOptions = {
	pigment?: WashPigment;
	duration?: number;
	delay?: number;
	load?: number;
	/** Mark height as a fraction of line height. */
	height?: number;
	trigger?: 'view' | 'load' | 'hover';
	threshold?: number;
	pad?: number;
	mark?: 'underline' | 'highlight';
	hand?: 'left' | 'left-hook' | 'right';
	instant?: boolean;
	instantDry?: boolean;
	wet?: number;
	onDone?: () => void;
};

export type WashSwipeOptions = {
	pigment?: WashPigment;
	load?: number;
	/** Brush width × element height. */
	width?: number;
	duration?: number;
	delay?: number;
	pressure?: number;
	variation?: number;
	landing?: number;
	lift?: number;
	runOut?: number;
	arc?: number;
	rise?: number;
	y?: number;
	x0?: number;
	y0?: number;
	s0?: number;
	x1?: number;
	y1?: number;
	s1?: number;
	/** Catmull-Rom waypoints in card fractions; overrides x0/y0 → x1/y1. */
	path?: Array<{ x: number; y: number }>;
	spatter?: boolean;
	trigger?: 'view' | 'load' | 'hover';
	threshold?: number;
	dryAfter?: number;
	passes?: number;
	gravity?: number;
	gravityAngle?: number;
	seed?: number;
	paper?: string;
	instant?: boolean;
};

export type WashHandle = {
	setParams(o: Record<string, unknown>): void;
	destroy(): void;
};

declare const WashHighlightFX: {
	attach(el: HTMLElement, opts?: WashHighlightOptions): WashHandle;
	swipe(el: HTMLElement, opts?: WashSwipeOptions): WashHandle;
};

export default WashHighlightFX;
