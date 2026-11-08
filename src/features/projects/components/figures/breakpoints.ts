import { useEffect, useState } from 'react';

// The case-study phone breakpoint. The CareSignal design switches to its
// phone layout (`renderVals` L0) when `innerWidth < 600`; figures and
// sections share this one number so they flip together. In CSS use the
// matching Tailwind variants: `max-[599.98px]:` for phone-only rules and
// `min-[600px]:` for everything wider.
export const NARROW_PX = 600;

// Below this the desktop side nav is hidden (dc wideNav: innerWidth >= 1100).
export const WIDE_NAV_PX = 1100;

// Tracks a media query. Reads it on first render (so phones don't paint the
// desktop layout first) and follows changes after that.
export function useMediaQuery(query: string): boolean {
	const [on, setOn] = useState(
		() => typeof matchMedia !== 'undefined' && matchMedia(query).matches,
	);
	useEffect(() => {
		const mq = matchMedia(query);
		const sync = () => setOn(mq.matches);
		sync();
		mq.addEventListener('change', sync);
		return () => mq.removeEventListener('change', sync);
	}, [query]);
	return on;
}

// True below NARROW_PX.
export const useNarrow = () => useMediaQuery(`(max-width: ${NARROW_PX - 0.02}px)`);
