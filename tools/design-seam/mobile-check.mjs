// Phone/tablet check for the case study: scrolls the whole page at each width
// (so lazy figures mount), and reports
//   - page-level horizontal overflow (content past the screen edge that isn't
//     clipped by a scroll/overflow container),
//   - controls with a tap area under 44px,
//   - text set under 12px,
// plus a viewport screenshot every screen into mobile-shots/<width>/.
//
// Usage (preview server must be running — see README):
//   node tools/design-seam/mobile-check.mjs                 # 375,390,600,768,1024
//   node tools/design-seam/mobile-check.mjs 375,768         # chosen widths
//
// Exits non-zero if any width overflows the page. Touch/text findings are
// listed for review (some are deliberate: inline citation markers, legend
// text), so they don't fail the run.
//
// Note: element screenshots taller than the viewport come out garbled here —
// the case study scrolls inside the sheet overlay, which Playwright can't
// stitch — so this only takes viewport shots.
//
// Env: CASE_URL, PW_CHROMIUM — as visual-check.mjs.
import { chromium } from 'playwright-core';
import { mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SHOTS = join(HERE, 'mobile-shots');
const EXE =
	process.env.PW_CHROMIUM ||
	'/home/node/.cache/ms-playwright/chromium-1228/chrome-linux/chrome';
const URL =
	process.env.CASE_URL ||
	'http://localhost:5199/project/caresignal-clinician-app';
const WIDTHS = (process.argv[2] || '375,390,600,768,1024').split(',').map(Number);

// Runs in the page: one pass over what's on screen now.
function scan() {
	const W = innerWidth;
	const S = (window.__mc ??= { over: {}, touch: {}, small: {} });
	const hint = (el) => {
		const parts = [];
		for (let n = el, i = 0; n && i < 3 && n.nodeType === 1; n = n.parentElement, i++) {
			const c = String(n.getAttribute('class') || '').trim().split(/\s+/).slice(0, 3).join('.');
			parts.unshift(n.tagName.toLowerCase() + (n.id ? '#' + n.id : '') + (c ? '.' + c : ''));
		}
		return parts.join(' > ');
	};
	const clipped = (el) => {
		for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
			if (getComputedStyle(n).overflowX !== 'visible' && n.getBoundingClientRect().right <= W + 1) return true;
		}
		return false;
	};
	for (const el of document.querySelectorAll('body *')) {
		const r = el.getBoundingClientRect();
		if (!r.width || r.bottom < 0 || r.top > innerHeight) continue;
		const cs = getComputedStyle(el);
		if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
		if ((r.right > W + 1 || r.left < -1) && !clipped(el)) S.over[hint(el)] = Math.round(r.right);
		if (el.matches('a[href],button,input,select,summary,[role=button]') && !el.closest('[aria-hidden="true"]')) {
			// Count ::before/::after padding (how the case study grows small
			// targets) by probing just outside the box.
			const hits = (x, y) => { const e = document.elementFromPoint(x, y); return e === el || el.contains(e); };
			const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
			const h = r.height >= 44 || (hits(cx, cy - (44 - r.height) / 2 + 1) && hits(cx, cy + (44 - r.height) / 2 - 1));
			const w = r.width >= 44 || (hits(cx - (44 - r.width) / 2 + 1, cy) && hits(cx + (44 - r.width) / 2 - 1, cy));
			if (!h || !w) S.touch[hint(el) + ` "${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 28)}"`] = `${Math.round(r.width)}×${Math.round(r.height)}`;
		}
		if ([...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && parseFloat(cs.fontSize) < 12) {
			S.small[hint(el)] = `${cs.fontSize} "${el.textContent.trim().slice(0, 24)}"`;
		}
	}
}

const browser = await chromium.launch({ executablePath: EXE, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
rmSync(SHOTS, { recursive: true, force: true });
let failed = false;
for (const w of WIDTHS) {
	const h = w < 600 ? 812 : 1024;
	const mobile = w < 1024;
	const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile });
	const page = await ctx.newPage();
	const errors = [];
	page.on('pageerror', (e) => errors.push(e.message));
	await page.goto(URL, { waitUntil: 'load', timeout: 120000 });
	await page.waitForTimeout(3000);
	mkdirSync(join(SHOTS, String(w)), { recursive: true });
	// The page scrolls inside the sheet overlay: find that scroller.
	const scroll = (y) =>
		page.evaluate((y) => {
			const start = document.getElementById('background') || document.querySelector('main');
			let port = document.scrollingElement;
			for (let n = start?.parentElement; n; n = n.parentElement) {
				const cs = getComputedStyle(n);
				if (/(auto|scroll)/.test(cs.overflowY) && n.scrollHeight > n.clientHeight) { port = n; break; }
			}
			port.scrollTo(0, y);
			return { y: port.scrollTop, max: port.scrollHeight - port.clientHeight };
		}, y);
	let i = 0;
	for (let y = 0; ; y += h * 0.8, i++) {
		const at = await scroll(y);
		await page.waitForTimeout(700);
		await page.evaluate(scan);
		await page.screenshot({ path: join(SHOTS, String(w), `${String(i).padStart(3, '0')}.png`) });
		if (at.y >= at.max - 1 || i > 150) break;
	}
	const S = await page.evaluate(() => window.__mc);
	const sw = await page.evaluate(() => document.documentElement.scrollWidth);
	const over = Object.entries(S.over);
	if (over.length || sw > w) failed = true;
	console.log(`\n== ${w}px  (${i + 1} screens, page width ${sw})`);
	console.log(over.length ? `OVERFLOW ${over.length}:\n  ` + over.map(([k, r]) => `${k} → right ${r}`).join('\n  ') : 'no page overflow');
	const touch = Object.entries(S.touch);
	console.log(`tap areas under 44px: ${touch.length}` + (touch.length ? '\n  ' + touch.map(([k, v]) => `${v}  ${k}`).join('\n  ') : ''));
	const small = Object.entries(S.small);
	console.log(`text under 12px: ${small.length}` + (small.length ? '\n  ' + small.map(([k, v]) => `${v}  ${k}`).join('\n  ') : ''));
	if (errors.length) console.log('page errors:\n  ' + errors.join('\n  '));
	await ctx.close();
}
await browser.close();
console.log(`\nscreenshots: ${SHOTS}`);
process.exit(failed ? 1 : 0);
