import { useEffect, useRef } from 'react';

import WashHighlightFX, {
	type WashesInstance,
} from '../../../src/features/projects/components/figures/wash-highlight';
import { prefersReducedMotion } from '../../../src/features/projects/components/figures/motion';

// Rose watercolour drop that pools into a numbered badge as it scrolls into
// view, dries with a darkened rim, then fades out the static ring — the
// design's `data-drop` micro-interaction (master `syncDrops`/`paintDrop`).
//
// The resting state is a transparent 28px disc with an inset rose ring and a
// confetti-black numeral; that's what shows before the drop lands, under
// reduced motion, or if the engine never confirms pigment on the canvas.
// `index` (0-based) staggers the drops down the list and seeds each one.
export function DropNumber({ n, index }: { n: number; index: number }) {
	const ref = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		const el = ref.current;
		if (!el || prefersReducedMotion()) return;

		let dead = false;
		let wc: WashesInstance | null = null;
		const timers: ReturnType<typeof setTimeout>[] = [];
		let raf = 0;
		const i = index % 3;

		const paint = () => {
			const FX = WashHighlightFX;
			FX.loadWashes()
				.then((W) => {
					if (dead || !el.isConnected) return;
					const S = 40;
					const overlay = document.createElement('span');
					overlay.setAttribute('aria-hidden', 'true');
					overlay.style.cssText =
						`position:absolute;left:50%;top:50%;width:${S}px;height:${S}px;` +
						`margin:${-S / 2}px 0 0 ${-S / 2}px;z-index:0;pointer-events:none;` +
						`overflow:hidden;clip-path:circle(50%)`;
					el.appendChild(overlay);
					const host = document.createElement('div');
					host.style.cssText = 'position:absolute;inset:0';
					overlay.appendChild(host);

					const paper = FX.backdrop(el.parentElement ?? el);
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
					} catch {
						/* older engine surface */
					}
					wc.run('until-dry');

					// Only fade the fallback ring once rose pigment is confirmed on
					// the canvas; otherwise keep the static ring.
					const settle = () => {
						if (dead || !overlay.isConnected || !wc) return;
						const cv = host.querySelector('canvas');
						let ok = false;
						try {
							if (cv) {
								const c2 = document.createElement('canvas');
								c2.width = c2.height = 24;
								const x = c2.getContext('2d', { willReadFrequently: true })!;
								x.drawImage(cv, 0, 0, 24, 24);
								const d = x.getImageData(0, 0, 24, 24).data;
								for (let k = 0; k < d.length; k += 4) {
									if (d[k + 3] > 40 && d[k] - d[k + 1] > 40) {
										ok = true;
										break;
									}
								}
							}
						} catch {
							/* tainted/again-empty canvas: treat as not confirmed */
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
								} catch {
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

					// A rose drop pooled under the number over ~30 frames; edge
					// darkening dries it with a darker rim.
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
						} catch {
							/* ignore a dropped frame */
						}
						done += 1;
						if (f < 1) {
							raf = requestAnimationFrame(tick);
						} else {
							try {
								wc.penUp();
							} catch {
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

		return () => {
			dead = true;
			io.disconnect();
			cancelAnimationFrame(raf);
			timers.forEach(clearTimeout);
			if (wc) {
				try {
					wc.destroy();
				} catch {
					/* noop */
				}
			}
		};
	}, [index]);

	return (
		<span
			ref={ref}
			aria-hidden="true"
			className="relative mt-[2px] inline-flex size-[28px] items-center justify-center rounded-full font-bold text-confetti-black"
			style={{
				isolation: 'isolate',
				background: 'transparent',
				boxShadow: 'inset 0 0 0 1.5px #a50e53',
				fontFamily: 'var(--font-body)',
				fontSize: 14,
				lineHeight: 1,
			}}
		>
			<span className="relative z-[1]">{n}</span>
		</span>
	);
}
