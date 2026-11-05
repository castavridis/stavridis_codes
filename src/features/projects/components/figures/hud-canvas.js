// hud-canvas — Figure 1's footer visualizations as framework-agnostic 2D-canvas
// drawers:
//   drawDayStrip(cv, spans, minute) — the 9-to-5 shift as 50 status-coloured
//     dots over time (inked where he was working, faded over lunch, faint ahead)
//   drawStatusGrid(cv, stats) — every patient as a dot coloured by status
//     (before = his 100 in call order from `log`; after = all 1,600 sorted from
//     `all`)
//   fmtClock(minute) — a minute offset from 9am as "h:mm am/pm"
//
// Both read the nurse-orbit engine's per-emit stats, so the repo's VizCanvas and
// the design's dc page import these instead of each carrying drawDay/drawBefore/
// drawBar on a Component class.

const VIZ_FILL = {
	a: '#108ba0',
	r: '#e5562e',
	y: '#f9ac31',
	g: '#b2d07f',
	G: '#b2d07f',
	d: '#e5562e',
	w: '#f9ac31',
	u: 'rgba(57,31,0,0.35)',
	'-': '#e4ded2',
};

function inkHex() {
	return (
		getComputedStyle(document.documentElement)
			.getPropertyValue('--color-confetti-black')
			.trim() || '#391f00'
	);
}

function prepCanvas(cv) {
	const W = cv.clientWidth;
	const H = cv.clientHeight;
	const dpr = Math.min(2, window.devicePixelRatio || 1);
	if (!W || !H) return null;
	if (cv.width !== Math.round(W * dpr)) {
		cv.width = Math.round(W * dpr);
		cv.height = Math.round(H * dpr);
	}
	const g = cv.getContext('2d');
	if (!g) return null;
	g.setTransform(dpr, 0, 0, dpr, 0, 0);
	g.clearRect(0, 0, W, H);
	return { g, W, H };
}

function dotFill(c, ink) {
	return c === 'k' ? ink : (VIZ_FILL[c] ?? VIZ_FILL.u);
}

export function drawDayStrip(cv, spans, minute) {
	if (!cv) return;
	const p = prepCanvas(cv);
	if (!p) return;
	const { g, W, H } = p;
	const n = 50;
	const step = 480 / n;
	const px = W / n;
	const r = Math.max(1.5, Math.min(px * 0.4, H * 0.4));
	const ink = inkHex();
	const sp = (typeof spans === 'string' ? spans : '')
		.split(' ')
		.map((t) => t.match(/^(\d+),(\d+)(\w)$/))
		.filter(Boolean)
		.map((m) => [+m[1], +m[2], m[3]]);
	for (let k = 0; k < n; k++) {
		const t = (k + 0.5) * step;
		const x = (k + 0.5) * px;
		const y = H / 2;
		const hit = sp.find((s) => t >= s[0] && t < Math.max(s[1], s[0] + step));
		const past = minute != null && minute >= 0 && t < minute;
		let fill = '#e4ded2';
		let a = 0.18;
		if (hit) {
			fill = VIZ_FILL[hit[2]] ?? VIZ_FILL.u;
			a = 1;
		} else if (past) {
			// inked where he was working; faded over lunch (12:30–1:30)
			fill = ink;
			a = t >= 210 && t < 270 ? 0.06 : 0.16;
		}
		g.globalAlpha = a;
		g.fillStyle = fill;
		g.beginPath();
		g.arc(x, y, r, 0, 6.2832);
		g.fill();
	}
	g.globalAlpha = 1;
}

export function drawStatusGrid(cv, stats) {
	if (!cv || !stats) return;
	const p = prepCanvas(cv);
	if (!p) return;
	const { g, W, H } = p;
	const cols = 50;
	const ink = inkHex();
	if (stats.phase === 'after' && stats.all) {
		const all = stats.all;
		const rows = 32;
		const px = W / cols;
		const py = H / rows;
		const r = Math.max(1, Math.min(px, py) * 0.36);
		const RANK = { a: 0, r: 1, y: 2, g: 3, k: 4, u: 5, '-': 6, G: 7, d: 8, w: 8 };
		const order = [...all]
			.map((_, i) => i)
			.sort((pIdx, qIdx) => (RANK[all[pIdx]] ?? 5) - (RANK[all[qIdx]] ?? 5) || pIdx - qIdx);
		for (let k = 0; k < order.length; k++) {
			const i = order[k];
			const c = all[i];
			const x = ((k % cols) + 0.5) * px;
			const y = (Math.floor(k / cols) + 0.5) * py;
			g.globalAlpha = c === 'd' || c === 'w' ? 0.3 : 1;
			g.fillStyle = dotFill(c, ink);
			g.beginPath();
			g.arc(x, y, r, 0, 6.2832);
			g.fill();
		}
		g.globalAlpha = 1;
	} else {
		const log = stats.log ?? '';
		const rows = 2;
		const px = W / cols;
		const py = H / rows;
		const r = Math.max(1, Math.min(px * 0.36, py * 0.4));
		for (let k = 0; k < 100; k++) {
			const c = log[k];
			const x = ((k % 50) + 0.5) * px;
			const y = (Math.floor(k / 50) + 0.5) * py;
			g.fillStyle = c ? dotFill(c, ink) : VIZ_FILL.u;
			g.beginPath();
			g.arc(x, y, r, 0, 6.2832);
			g.fill();
		}
	}
}

export function fmtClock(minute) {
	if (minute == null || minute < 0) return '';
	const t = 9 * 60 + Math.floor(minute);
	const hh = Math.floor(t / 60);
	const mm = t % 60;
	const h12 = ((hh + 11) % 12) + 1;
	return `${h12}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'am' : 'pm'}`;
}

export default { drawDayStrip, drawStatusGrid, fmtClock };
