// wash-drop — a rose watercolour drop that pools into a small element (a
// numbered badge) as it scrolls into view, dries with an edge-darkened rim,
// then fades the element's ring out.
//
// Framework-agnostic on purpose: `mount(el, opts) -> { destroy }`, the same
// shape as the orbit engine. This is the shared module both sides import — the
// repo's React `DropNumber` wraps it, and the design's dc page can import it
// instead of carrying `syncDrops`/`paintDrop` on its Component class. Extract
// interactions into modules like this and they stop needing to be re-ported.
//
// Needs the washes helpers (loadWashes / backdrop / h01 / inkOf / kmPigment /
// freeze). Pass them as `opts.FX`, or they default to window.WashHighlightFX
// (set by wash-highlight.js / washes.standalone.js).

export function mount(el, opts = {}) {
	const {
		index = 0,
		reduced = false,
		FX = typeof window !== 'undefined' ? window.WashHighlightFX : null,
	} = opts;
	// Reduced motion, a missing host, or no engine: keep the static ring.
	if (!el || reduced || !FX) return { destroy() {} };

	let dead = false;
	let wc = null;
	let raf = 0;
	const timers = [];
	const i = index % 3;

	const paint = () => {
		FX.loadWashes()
			.then((W) => {
				if (dead || !el.isConnected) return;
				const S = 40;
				const overlay = document.createElement('span');
				overlay.setAttribute('aria-hidden', 'true');
				overlay.style.cssText =
					'position:absolute;left:50%;top:50%;width:' +
					S +
					'px;height:' +
					S +
					'px;margin:' +
					-S / 2 +
					'px 0 0 ' +
					-S / 2 +
					'px;z-index:0;pointer-events:none;overflow:hidden;clip-path:circle(50%)';
				el.appendChild(overlay);
				const host = document.createElement('div');
				host.style.cssText = 'position:absolute;inset:0';
				overlay.appendChild(host);

				const paper = FX.backdrop(el.parentElement || el);
				wc = W.create(host, {
					transparent: true,
					pointer: false,
					cursorPreview: false,
					mobile: false,
					seed: 5 + i * 7,
					size: { width: 100, height: 100 },
					scale: 1.25,
					paperColor: FX.h01(paper),
					pigments: [0, 1, 2].map(() => FX.kmPigment(FX.inkOf('rose'), paper)),
				});
				try {
					wc.edgeDarkening(true);
					wc.gravityStrength(0);
					wc.edgeMode('closed');
					wc.edgeFade(4);
				} catch (e) {
					/* older engine surface */
				}
				wc.run('until-dry');

				// Only fade the fallback ring once rose pigment is confirmed on the
				// canvas; otherwise keep the static ring.
				const settle = () => {
					if (dead || !overlay.isConnected || !wc) return;
					const cv = host.querySelector('canvas');
					let ok = false;
					try {
						if (cv) {
							const c2 = document.createElement('canvas');
							c2.width = c2.height = 24;
							const x = c2.getContext('2d', { willReadFrequently: true });
							x.drawImage(cv, 0, 0, 24, 24);
							const d = x.getImageData(0, 0, 24, 24).data;
							for (let k = 0; k < d.length; k += 4)
								if (d[k + 3] > 40 && d[k] - d[k + 1] > 40) {
									ok = true;
									break;
								}
						}
					} catch (e) {
						/* tainted / again-empty canvas: treat as not confirmed */
					}
					if (!ok) {
						overlay.remove();
						return;
					}
					el.style.transition = 'box-shadow 400ms ease';
					el.style.boxShadow = 'inset 0 0 0 1.5px transparent';
					timers.push(
						setTimeout(() => {
							if (dead || !overlay.isConnected || !wc) return;
							try {
								wc.dry();
							} catch (e) {
								/* noop */
							}
							timers.push(
								setTimeout(() => {
									if (!dead && overlay.isConnected && wc) FX.freeze(wc, host);
								}, 400),
							);
						}, 2500),
					);
				};

				// A rose drop pooled under the number over ~30 frames.
				const N = 30;
				let done = 0;
				const tick = () => {
					if (dead || !overlay.isConnected || !wc) return;
					const f = (done + 1) / N;
					try {
						wc.pigment(0);
						wc.paintLoad(2.4);
						wc.waterLoad(1.2);
						wc.pressure(1);
						wc.rewet(0.5, 0.5, 0.3);
						wc.paint(0.5 + (i - 1) * 0.02, 0.5, 0.2, 0, 1);
					} catch (e) {
						/* ignore a dropped frame */
					}
					done += 1;
					if (f < 1) {
						raf = requestAnimationFrame(tick);
					} else {
						try {
							wc.penUp();
						} catch (e) {
							/* noop */
						}
						timers.push(setTimeout(settle, 500));
					}
				};
				raf = requestAnimationFrame(tick);
			})
			.catch(() => {
				/* engine failed to load: keep the static ring */
			});
	};

	const io = new IntersectionObserver(
		(entries) => {
			for (const e of entries) {
				if (!e.isIntersecting) continue;
				io.disconnect();
				timers.push(setTimeout(paint, i * 260));
			}
		},
		{ threshold: 1 },
	);
	io.observe(el);

	return {
		destroy() {
			dead = true;
			io.disconnect();
			cancelAnimationFrame(raf);
			timers.forEach(clearTimeout);
			if (wc) {
				try {
					wc.destroy();
				} catch (e) {
					/* noop */
				}
			}
		},
	};
}

export default { mount };
