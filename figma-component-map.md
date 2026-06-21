# Figma → React component map

A manual substitute for Figma Code Connect (which requires a Dev/Full seat on
an Org/Enterprise plan — not on the current Figma plan). When Claude pulls a
Figma design via `get_design_context` or `get_metadata`, any instance whose
**Figma component name** matches a row below should be rendered as the listed
**React component** with the listed props — not as regenerated flat markup.

Add rows when new components get extracted. Move rows from "Unmapped" to the
main table once a React equivalent ships.

## Mapped

| Figma name      | React component   | Path                                                  | Key props                                    |
| --------------- | ----------------- | ----------------------------------------------------- | -------------------------------------------- |
| Callout         | `Callout`         | `src/features/projects/components/Callout.tsx`        | `title?`, `content`, `attribution?`          |
| Outcome stat    | `OutcomeStat`     | `src/features/projects/components/OutcomeStat.tsx`    | `stat`, `caption`                            |
| Front Matter    | `BlogFrontMatter` | `src/features/blog/components/BlogFrontMatter.tsx`    | `title`, `dek`, `date`, `readingTime`, `tags`, `onBack` |
| (any text node) | `<Text>`          | `src/components/Text.tsx`                             | `variant` — one of the `type-*` utilities in `globals.css` |

## Unmapped

These appear in v2.1 case-study designs and don't have a React equivalent yet.
When implementing a case study that uses them, decide per-instance:

- **Extract + map** — promote to the table above (lives in `src/features/projects/components/` if reusable).
- **One-off bespoke** — author inline in `content/projects/{slug}/`.

| Figma name        | Where it appears                              | Notes                                                              |
| ----------------- | --------------------------------------------- | ------------------------------------------------------------------ |
| Status Indicator  | Design Intro (risk illustration)              | Colored badge — likely reusable.                                   |
| Alert – Flag      | Key Objects (cascading alerts)                | Patient alert row — case-study-specific styling, but row shape may repeat. |
| Patient Object    | Key Objects, Screenshots                      | Wraps `Patient Banner` + slot of `Program Banner`s.                |
| Patient Banner    | Inside Patient Object                         | Sub-component of Patient Object.                                   |
| Program Banner    | Inside Patient Object slot                    | Sub-component of Patient Object.                                   |
| Side Navigation   | Screenshots (dashboard mockup)                | Single icon row, repeated. Likely too small to extract.            |
| Slide             | Screenshots                                   | Carousel container — strong candidate for extraction.              |
| Best in KLAS logo | Outcomes                                      | Award badge. Probably 1–2 usages; bespoke is fine.                 |

## Process notes for Claude

- When `get_metadata` returns an instance with `name="Callout"` (or any mapped
  name above), do NOT recreate the markup — use the React component directly.
- For unmapped instances, generate flat markup but flag in your response that
  this component is unmapped and ask whether to extract.
- For Text nodes: the Figma text style name (e.g. "Headline / Small")
  determines the `<Text variant>` — see the `type-*` definitions in
  `src/globals.css` for the mapping.
