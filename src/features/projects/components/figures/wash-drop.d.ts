// Types for the framework-agnostic wash-drop module (see wash-drop.js).

export type WashDropOptions = {
	/** 0-based position in the list — staggers the drop and seeds it. */
	index?: number;
	/** Reduced motion: skip the drop entirely (keep the static ring). */
	reduced?: boolean;
	/**
	 * The washes helper surface (loadWashes / backdrop / h01 / inkOf /
	 * kmPigment / freeze). Defaults to `window.WashHighlightFX`.
	 */
	FX?: unknown;
};

export type WashDropHandle = {
	destroy(): void;
};

/** Attach a scroll-triggered rose drop to `el`; returns a cleanup handle. */
export function mount(el: HTMLElement, opts?: WashDropOptions): WashDropHandle;

declare const WashDrop: { mount: typeof mount };
export default WashDrop;
