# Design → Code seam

How to port a Claude Design case study into this repo with the fewest tweaks,
and the conventions that kept drifting when we didn't.

## Why ports drift

What transferred **for free** vs. what we **paid for** by hand, on the
CareSignal port:

- **Free:** the orbit + washes engines. They're standalone JS modules vendored
  byte-for-byte into both the canvas and the repo. Zero tweaks.
- **Paid:** everything that lived _inside the design page_ — the `.dc.html`
  markup, the `#nurse-case` scoped CSS, the type/color/spacing choices, and the
  hero's interactions (drop fills, gum-peel nav, the day-strip + patient-status
  canvases, all baked into the page's `Component` class). Each was hand-ported,
  and each drifted.

The direction matters too. **DesignSync** pushes the repo's component library
_up_ to the design-system project (code → design). Case studies go the _other_
way — authored on the canvas, ported _down_ to code — and that direction has no
tooling. That download is the seam.

**Principle:** the seam smooths in proportion to how much of a case study is
_shared code both sides import_ rather than _page-specific markup_. Move work
from "embedded in the dc page" to "a module/token/component both sides use."

## Authoring conventions (so the usage drift stops)

The tokens already align (`type-copy-large` is 300; the status colors match).
The drift was in how case-study components _used_ them. When porting, default
to these:

| Thing | Use | Not |
| --- | --- | --- |
| Body paragraph | `<Text variant="copy-large">` (300, full `text-confetti-black`) | `copy`/400 dimmed to `/80` |
| Emphasis | `font-semibold` (600) | `font-bold` (700) |
| Prose reading-column gap | `gap-[20px]` (opening sections `gap-[24px]`) | `gap-[16px]` |
| Section label | `<SectionHeading>` (mono 14/700, 65%) | a hand-spelled h2/h3 |
| Pull quote | Kyoto 500 `clamp(28px,3vw,36px)`/1.22 | `headline-small` (24px) |
| Goal pillar h4 | Kyoto 500 28px + `<NumBadge>` (32px `#6f9e17` disc) | `callout-title` italic 24 + pale chip |
| Product screenshot | `<BackdropShot src w h>` (aspect frame over sky, fade-up) | padded/shadowed `<img>` mat |
| "20px body" blocks | `#f7f6f5` card / labelled list, Funnel 20/1.5 | big stat tiles / `copy` |
| Numbered list that drops pigment | `<DropNumber>` | flat filled chip |
| Colophon (Team & Tools) | full-width mono block under a top rule | body copy in the reading column |

Case-study-specific overrides that have no component/prop go in a scoped
`<style>` keyed off `data-case` (see `CaseStudyStyle.tsx` + the `scopeId` prop on
`MDXLayout`) — the repo equivalent of the design's `#nurse-case` block. Front
matter that belongs elsewhere (intro below the hero) uses the `introBelowHero`
flag → `hideIntroduction` on FrontMatter.

A few one-off colors were hardcoded during the port and should become tokens so
they're referenced, not re-typed: `#6f9e17` (pillar-badge green) and `#9fb6e8`
(screenshot sky backdrop). See `src/globals.css` `@theme`.

## Factoring plan: pull interactions out of the dc `Component` class

The engines transferred free because they're modules. The hero interactions did
_not_, because they're methods on the page's `Component` class. On the **design
side**, factor each into a standalone module the dc page imports (exactly like
`nurse-orbit.js`), so the repo imports the same file instead of re-porting it:

| Interaction | Lives today | Extract to | Repo port that would then be deleted |
| --- | --- | --- | --- |
| Rose drop on numerals | `syncDrops`/`paintDrop` in Component | `wash-drop.js` | `DropNumber.tsx` hand-port |
| Nav "gum-peel" stick | `gumPeel`/`gumPress`/`navGum` | `nav-gum.js` | `SectionNav.tsx` gum code |
| "How Time is Spent" strip | `drawDay` | `day-strip.js` | `drawDayStrip` in NurseDayFigure |
| "Patient Statuses" grid | `drawBefore`/`drawBar` | `status-grid.js` | `drawStatusGrid` in NurseDayFigure |
| "Impact over time" | `drawSpark`/`impMix` | fold into `day-strip.js` | (not yet ported) |
| Screenshot fade-up | `fadeImgs` | `fade-in.js` | `FadeImg` in shared.tsx |

Each takes a host element + data and owns its canvas/DOM, like the orbit engine's
`mount(el, {...}) → handle`. The React side becomes a thin `useEffect` wrapper.

**Worked example — the rose drop (done).** `figures/wash-drop.js` is the first
one factored out: `mount(el, { index, reduced, FX }) → { destroy() }`, no React,
reads the washes helpers off `opts.FX` (default `window.WashHighlightFX`). The
repo's `DropNumber.tsx` is now ~40 lines — the resting badge plus a
mount/destroy. The dc page can `import { mount } from './wash-drop.js'` and drop
`syncDrops`/`paintDrop` from its Component class, so neither side re-implements
it. Copy this shape for the rest of the table.

## Verify instead of eyeball

`tools/design-seam/visual-check.mjs` screenshots the live case study per section
and diffs against committed baselines — it turns "I eyeballed six screenshots"
into a drift report. See `tools/design-seam/README.md`.

## Scaffold the structure

`.dc.html` pages are structured markup + `{{ bindings }}` + `data-props`.
`tools/design-seam/dc-to-jsx.mjs` is a spike that converts one dc section to a
React scaffold (JSX + prop types from `data-props`) — it won't port logic, but it
gets the structure so you hand-write only behaviour.
