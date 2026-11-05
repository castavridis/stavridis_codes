// fade-in — fade an element up from transparent once it has loaded (for an
// <img>) and scrolled into view. Framework-agnostic: observe(el, { reduced })
// -> { destroy }. The element should start at `opacity:0` with a transition
// set (e.g. `transition: opacity 450ms ease`); reduced motion shows it at once.
// The design's `fadeImgs` does exactly this to every #nurse-case img[data-fade].
export function observe(el, opts = {}) {
	if (!el) return { destroy() {} };
	const show = () => {
		el.style.opacity = '1';
	};
	if (opts.reduced) {
		el.style.transition = 'none';
		show();
		return { destroy() {} };
	}
	const ready = () => {
		// <img>: wait for the pixels; anything else: show on intersect.
		if (el.tagName === 'IMG' && !(el.complete && el.naturalWidth)) {
			el.addEventListener('load', () => requestAnimationFrame(show), {
				once: true,
			});
		} else {
			requestAnimationFrame(show);
		}
	};
	let io = new IntersectionObserver(
		(entries) => {
			for (const e of entries) {
				if (!e.isIntersecting) continue;
				if (io) io.disconnect();
				io = null;
				ready();
			}
		},
		{ threshold: 0.15 },
	);
	io.observe(el);
	return {
		destroy() {
			if (io) io.disconnect();
		},
	};
}

export default { observe };
