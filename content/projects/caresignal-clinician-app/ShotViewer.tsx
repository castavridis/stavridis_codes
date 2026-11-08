import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Full-screen viewer for a product screenshot, opened by tapping it on phones
// and tablets (where the UI text in a shot is a few pixels tall). Opens at
// 1:1 (the shots are 2× exports, so natural width / 2 CSS px), scrollable
// from the top-left; tapping toggles a fitted view, and tapping back zooms
// in centred on the tap. (Fitted alone would be no bigger than the inline
// shot on a portrait phone.)
// Native pinch zoom still works on top. Close: the button or Escape (kept
// from reaching the sheet, which would close the case study too).
// Portalled to <body>: the sheet's transform would capture position: fixed.
export function ShotViewer({
	src,
	alt,
	width,
	height,
	onClose,
}: {
	src: string;
	alt: string;
	width: number;
	height: number;
	onClose: () => void;
}) {
	const [zoom, setZoom] = useState(true);
	const scrollRef = useRef<HTMLDivElement>(null);
	const closeRef = useRef<HTMLButtonElement>(null);
	// Where to centre after zooming in: the tap point as a fraction of the image.
	const focus = useRef<{ fx: number; fy: number } | null>(null);

	const closeFn = useRef(onClose);
	closeFn.current = onClose;
	useEffect(() => {
		const prev = document.activeElement as HTMLElement | null;
		closeRef.current?.focus();
		const onKey = (e: KeyboardEvent) => {
			if (e.key !== 'Escape') return;
			e.stopImmediatePropagation();
			closeFn.current();
		};
		window.addEventListener('keydown', onKey, true);
		return () => {
			window.removeEventListener('keydown', onKey, true);
			prev?.focus?.({ preventScroll: true });
		};
	}, []);

	useLayoutEffect(() => {
		const sc = scrollRef.current;
		const f = focus.current;
		if (!sc) return;
		if (zoom && f) {
			sc.scrollLeft = f.fx * sc.scrollWidth - sc.clientWidth / 2;
			sc.scrollTop = f.fy * sc.scrollHeight - sc.clientHeight / 2;
		} else {
			sc.scrollLeft = 0;
			sc.scrollTop = 0;
		}
	}, [zoom]);

	return createPortal(
		<div
			role="dialog"
			aria-modal="true"
			aria-label={alt}
			className="fixed inset-0 z-[calc(var(--z-floating)+10)] flex flex-col"
			style={{ background: '#201e1f' }}
		>
			<div
				className="flex flex-none items-center justify-between gap-[16px] px-[16px] text-white"
				style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)', paddingBottom: 12 }}
			>
				<span className="text-[12px] leading-[16px] tracking-[0.04em] opacity-80" style={{ fontFamily: 'var(--font-mono)' }}>
					{zoom ? 'Drag to pan · tap to fit' : 'Tap to zoom in'}
				</span>
				<button
					ref={closeRef}
					type="button"
					onClick={onClose}
					className="inline-flex min-h-[44px] cursor-pointer items-center rounded-full border-[1.25px] border-white bg-transparent px-[18px] text-[14px] text-white"
					style={{ fontFamily: 'var(--font-mono)' }}
				>
					Close
				</button>
			</div>
			<div
				ref={scrollRef}
				className={`min-h-0 flex-1 overscroll-contain ${zoom ? 'overflow-auto' : 'flex items-center justify-center overflow-hidden p-[16px]'}`}
				style={{ paddingBottom: zoom ? undefined : 'calc(env(safe-area-inset-bottom) + 16px)' }}
			>
				<img
					src={src}
					alt={alt}
					width={width}
					height={height}
					onClick={(e) => {
						const r = e.currentTarget.getBoundingClientRect();
						focus.current = { fx: (e.clientX - r.left) / r.width, fy: (e.clientY - r.top) / r.height };
						setZoom((z) => !z);
					}}
					className={`block max-w-none ${zoom ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
					style={
						zoom
							? { width: Math.round(width / 2), height: 'auto' }
							: { maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto' }
					}
				/>
			</div>
		</div>,
		document.body,
	);
}
