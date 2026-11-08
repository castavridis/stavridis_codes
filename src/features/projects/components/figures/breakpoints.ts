import { useEffect, useState } from 'react';

// The case-study phone breakpoint. The CareSignal design switches to its
// phone layout (`renderVals` L0) when `innerWidth < 600`; figures and
// sections share this one number so they flip together. In CSS use the
// matching Tailwind variants: `max-[599.98px]:` for phone-only rules and
// `min-[600px]:` for everything wider.
export const NARROW_PX = 600;

const query = `(max-width: ${NARROW_PX - 0.02}px)`;

// True below NARROW_PX. Reads the media query on first render (so phones
// don't paint the desktop layout first) and tracks it after that.
export function useNarrow(): boolean {
	const [narrow, setNarrow] = useState(
		() => typeof matchMedia !== 'undefined' && matchMedia(query).matches,
	);
	useEffect(() => {
		const mq = matchMedia(query);
		const on = () => setNarrow(mq.matches);
		on();
		mq.addEventListener('change', on);
		return () => mq.removeEventListener('change', on);
	}, []);
	return narrow;
}
