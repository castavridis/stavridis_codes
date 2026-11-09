# tools/design-seam

Tooling for the Claude Design → Claude Code seam. Start with `SEAM.md` (why
ports drift + the authoring conventions + the plan to factor dc interactions
into shared modules).

## visual-check.mjs — drift check

Screenshots each section of the live case study and compares it to a committed
baseline, so an unintended change is a number, not six eyeballed screenshots.
Static prose/screenshot/type sections gate the run; the WebGL/watercolour hero
and figure sections are captured for review but never fail (they render
non-deterministically under software rendering).

### Setup (once)

Playwright-core matched to the cached Chromium build (per the design-sync
notes, 1.61.0 ↔ Chromium 1228):

```sh
cd tools/design-seam
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm i -D playwright-core@1.61.0
```

### Run

```sh
# 1. build + serve the app
node node_modules/vite/bin/vite.js build
node node_modules/vite/bin/vite.js preview --port 5199 &

# 2. compare against baselines (exits non-zero on drift)
node tools/design-seam/visual-check.mjs

# refresh baselines after an intended change
node tools/design-seam/visual-check.mjs --update
```

Env: `CASE_URL` (default `localhost:5199/project/caresignal-clinician-app`),
`PW_CHROMIUM` (default the cached Chromium 1228 binary).

Baselines live in `baselines/`, drift captures in `diffs/`. **Baselines are a
regression net, not the design source** — refresh them against the canvas when
the design genuinely changes, and treat a `DRIFT` line as "did I mean to change
this section?"

## mobile-check.mjs — phone/tablet check

Scrolls the whole case study at 375, 390, 600, 768 and 1024px (lazy figures
mount on the way) and reports page-level horizontal overflow, tap areas under
44px (counting the ::before/::after padding the case study uses to grow small
controls) and text under 12px. Saves a viewport screenshot per screen into
`mobile-shots/<width>/`. Same setup and server as visual-check.

```sh
node tools/design-seam/mobile-check.mjs           # all five widths
node tools/design-seam/mobile-check.mjs 375,768   # chosen widths
```

Fails only on page overflow; tap-area and small-text lines are for review.
The phone layout switches at 600px (`NARROW_PX` in
`src/features/projects/components/figures/breakpoints.ts`).

## dc-to-jsx.mjs — structure scaffolder (spike)

Converts one `.dc.html` section into a React scaffold — JSX from the markup,
prop types from `data-props`. It does **not** port behaviour (the `Component`
class logic); it gets the structure so you only hand-write the interactions.
See the file header for usage. Proof-of-concept quality — treat its output as a
starting point, not finished code.
