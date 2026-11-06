export const prefersReducedMotion = () =>
	typeof matchMedia !== 'undefined' &&
	matchMedia('(prefers-reduced-motion: reduce)').matches;

// Resolves `delay` ms after the window's load event (immediately-ish if the
// page has already loaded). The case-study design holds its wash highlights
// and drops until 500 ms after load so they don't compete with first paint.
let loaded: Promise<void> | null = null;
export function afterPageLoad(delay = 500): Promise<void> {
	if (typeof window === 'undefined') return Promise.resolve();
	loaded ??= new Promise<void>((res) => {
		if (document.readyState === 'complete') res();
		else window.addEventListener('load', () => res(), { once: true });
	});
	return loaded.then(() => new Promise<void>((res) => setTimeout(res, delay)));
}

// A happy little wag: a randomized decaying alternating rotation — new
// amplitude, swing count, damping and tempo each time. Shared by the
// citation tooltip and the back-to-top pill.
export function wag(
	el: HTMLElement,
	{
		amp = [3.5, 6.5],
		origin,
	}: { amp?: [number, number]; origin?: string } = {},
) {
	if (!el.animate || prefersReducedMotion()) return;
	if (origin) el.style.transformOrigin = origin;
	const R = (a: number, b: number) => a + Math.random() * (b - a);
	const n = Math.random() < 0.35 ? 5 : 4;
	const a0 = R(amp[0], amp[1]);
	const dir = Math.random() < 0.5 ? -1 : 1;
	const decay = R(0.5, 0.68);
	const kf: Keyframe[] = [{ rotate: '0deg' }];
	for (let i = 0; i < n; i++) {
		kf.push({
			rotate:
				(dir * (i % 2 ? -1 : 1) * a0 * Math.pow(decay, i) * R(0.85, 1.15)).toFixed(2) +
				'deg',
		});
	}
	kf.push({ rotate: '0deg' });
	el.animate(kf, {
		duration: Math.round((R(160, 200) * (n + 1)) / 1.25),
		easing: 'ease-in-out',
	});
}
