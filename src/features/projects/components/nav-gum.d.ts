// Types for the framework-agnostic nav-gum module (see nav-gum.js).

/** Peel the card off the page as it sticks (scroller drives the strand snaps). */
export function peel(card: HTMLElement, scroller: HTMLElement | null): void;
/** Squish the card back down as it un-sticks; fades the chrome out. */
export function press(card: HTMLElement): void;
/** Cancel any running peel on `card`. */
export function end(card: HTMLElement): void;
/** Set the resting chrome directly (initial mount / reduced motion). */
export function set(
	card: HTMLElement,
	stuck: boolean,
	opts?: { animate?: boolean },
): void;

declare const NavGum: {
	peel: typeof peel;
	press: typeof press;
	end: typeof end;
	set: typeof set;
};
export default NavGum;
