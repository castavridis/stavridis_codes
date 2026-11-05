// Visual drift check for the case study: screenshots each section of the live
// page and compares it to a committed baseline, so an unintended change shows
// up as a number instead of needing six eyeballed screenshots.
//
// Usage (preview server must be running — see README):
//   node tools/design-seam/visual-check.mjs            # compare vs baselines
//   node tools/design-seam/visual-check.mjs --update   # (re)write baselines
//
// Env: CASE_URL (default localhost:5199/project/caresignal-clinician-app),
//      PW_CHROMIUM (default the cached Chromium 1228 build).
//
// The hero + figure-heavy sections render WebGL/watercolour non-deterministically
// under software rendering, so they're captured for review but never fail the
// run (`animated: true`). The static prose/screenshot/type sections are the ones
// that gate — those are where composition drift (the kind this port kept hitting)
// actually shows up.
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const BASE_DIR = join(HERE, 'baselines');
const DIFF_DIR = join(HERE, 'diffs');
const EXE =
	process.env.PW_CHROMIUM ||
	'/home/node/.cache/ms-playwright/chromium-1228/chrome-linux/chrome';
const URL =
	process.env.CASE_URL ||
	'http://localhost:5199/project/caresignal-clinician-app';
const UPDATE = process.argv.includes('--update');
const TOLERANCE = 0.02; // fraction of differing pixels allowed before a section fails

const SECTIONS = [
	{ name: 'front-matter', anchor: null, animated: false },
	{ name: 'hero', anchor: 'contribution', animated: true },
	{ name: 'background', anchor: 'background', animated: false },
	{ name: 'opportunity', anchor: 'opportunity', animated: true },
	{ name: 'proof-of-concept', anchor: 'starting-point', animated: true },
	{ name: 'product-market-fit', anchor: 'product-market-fit', animated: false },
	{ name: 'scaling-care-teams', anchor: 'scaling-care-teams', animated: true },
	{ name: 'outcomes', anchor: 'outcomes', animated: true },
	{ name: 'conclusion', anchor: 'conclusion', animated: false },
	{ name: 'team-and-tools', anchor: 'team-and-tools', animated: false },
];

for (const d of [BASE_DIR, DIFF_DIR]) if (!existsSync(d)) mkdirSync(d, { recursive: true });

const browser = await chromium.launch({
	executablePath: EXE,
	args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(6000); // let fonts + both engine days settle

// Resolve the sheet's scroll container once.
await page.evaluate(() => {
	const nav = document.querySelector('nav[aria-label="Sections"]');
	let el = nav?.parentElement;
	while (el && el !== document.body) {
		const s = getComputedStyle(el);
		if (/(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 20) {
			el.setAttribute('data-sp', '1');
			return;
		}
		el = el.parentElement;
	}
});

// Count differing pixels between two PNG buffers by decoding both in the page.
async function diffFraction(a, b) {
	return page.evaluate(
		async ([aB64, bB64]) => {
			const load = (b64) =>
				new Promise((res) => {
					const img = new Image();
					img.onload = () => res(img);
					img.onerror = () => res(null); // a corrupt PNG must not hang the check
					img.src = 'data:image/png;base64,' + b64;
				});
			const [ia, ib] = await Promise.all([load(aB64), load(bB64)]);
			if (!ia || !ib) return 1; // couldn't decode one side -> treat as fully changed
			const w = Math.min(ia.width, ib.width);
			const h = Math.min(ia.height, ib.height);
			if (!w || !h) return 1;
			const cv = (im) => {
				const c = document.createElement('canvas');
				c.width = w;
				c.height = h;
				const g = c.getContext('2d');
				g.drawImage(im, 0, 0);
				return g.getImageData(0, 0, w, h).data;
			};
			const da = cv(ia);
			const db = cv(ib);
			let diff = 0;
			for (let i = 0; i < da.length; i += 4) {
				if (
					Math.abs(da[i] - db[i]) > 12 ||
					Math.abs(da[i + 1] - db[i + 1]) > 12 ||
					Math.abs(da[i + 2] - db[i + 2]) > 12
				)
					diff++;
			}
			return diff / (w * h);
		},
		[a.toString('base64'), b.toString('base64')],
	);
}

let failed = 0;
const rows = [];
for (const s of SECTIONS) {
	if (s.anchor) {
		await page.evaluate((id) => {
			const sp = document.querySelector('[data-sp]');
			const el = document.getElementById(id);
			if (sp && el) sp.scrollTop += el.getBoundingClientRect().top - sp.getBoundingClientRect().top - 24;
			else el?.scrollIntoView({ block: 'start' });
		}, s.anchor);
	} else {
		await page.evaluate(() => {
			const sp = document.querySelector('[data-sp]');
			if (sp) sp.scrollTop = 0;
		});
	}
	await page.waitForTimeout(700);
	const shot = await page.screenshot();
	const basePath = join(BASE_DIR, `${s.name}.png`);

	if (UPDATE || !existsSync(basePath)) {
		writeFileSync(basePath, shot);
		rows.push(`  ${UPDATE ? 'updated' : 'new    '}  ${s.name}`);
		continue;
	}
	const frac = await diffFraction(shot, readFileSync(basePath));
	const pct = (frac * 100).toFixed(2);
	if (s.animated) {
		rows.push(`  review   ${s.name}  (${pct}% — animated, not gated)`);
	} else if (frac > TOLERANCE) {
		failed++;
		writeFileSync(join(DIFF_DIR, `${s.name}.png`), shot);
		rows.push(`  DRIFT    ${s.name}  (${pct}% > ${(TOLERANCE * 100).toFixed(0)}%) -> diffs/${s.name}.png`);
	} else {
		rows.push(`  ok       ${s.name}  (${pct}%)`);
	}
}

await browser.close();
console.log((UPDATE ? 'Baselines written:\n' : 'Visual drift check:\n') + rows.join('\n'));
if (!UPDATE && failed) {
	console.log(`\n${failed} static section(s) drifted. Review diffs/, then --update if intended.`);
	process.exit(1);
}
