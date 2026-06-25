# Claude collaboration notes

## Figma → code workflow

Before pulling any Figma design into this repo, read `figma-component-map.md`
at the repo root. Any Figma instance whose name matches a row in that manifest
must be rendered as the mapped React component (with the listed props), not as
regenerated markup.

When you encounter a Figma component that is NOT in the manifest:

1. Generate flat markup as a starting point.
2. If the component is likely to repeat across case studies, add a row to the
   manifest under "## Unmapped" and propose extracting it.

## Type system

Body text uses the `type-*` Tailwind utilities defined in `src/globals.css`.
Prefer the `<Text variant="...">` component over hand-spelled `type-*`
classNames so swaps stay coherent. The full variant list is enumerated in
`@source inline(...)` near the top of `globals.css`.

## Case-study structure

Each case study lives under `content/projects/{slug}/`:

- `index.mdx` — top-level MDX, composes Sections
- One `.tsx` file per Section, imported into the MDX

Reusable chrome (FrontMatter, Callout, OutcomeStat) lives in
`src/features/projects/components/` and is shared across case studies.
