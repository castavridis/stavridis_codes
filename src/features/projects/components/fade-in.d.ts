// Types for the framework-agnostic fade-in module (see fade-in.js).

export type FadeInOptions = {
	/** Reduced motion: show the element immediately, no fade. */
	reduced?: boolean;
};

export type FadeInHandle = { destroy(): void };

/** Fade `el` up once it has loaded (if an <img>) and scrolled into view. */
export function observe(
	el: HTMLElement | null,
	opts?: FadeInOptions,
): FadeInHandle;

declare const FadeIn: { observe: typeof observe };
export default FadeIn;
