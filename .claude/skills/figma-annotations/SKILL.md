---
name: figma-annotations
description: Surface Figma Dev Mode annotations (designer notes attached to nodes) when working with the Figma MCP. Trigger when the user says "annotations" in a Figma context — "where are the annotations", "I added annotations", "do you see my annotations" — or whenever you're reading a Figma design and might miss implementation notes. Annotations do NOT appear in `get_metadata` output; they only appear inside `get_design_context` as HTML `data-development-annotations` / `data-interaction-annotations` attributes, attached to nodes inside component definitions (not on page-level instances).
---

# Figma annotations via MCP

## The gotcha

If a user says "I added annotations" and you call `get_metadata`, you will find **zero annotation nodes** and may conclude the annotations are unreachable. That conclusion is wrong.

Figma Dev Mode annotations are surfaced by `get_design_context` only, as HTML data attributes on the specific child nodes they're attached to:

```
data-development-annotations="..."
data-interaction-annotations="..."
```

The attribute value is a single string that can contain newlines.

`get_design_context` includes a footer line when annotations are present:

> *"Some elements have annotation data attributes."*

Watch for it.

## Where annotations live

Annotations are attached to nodes inside **component definitions (symbols)**, not the component instances placed on a page. If a Preset Widget is annotated, calling `get_design_context` on the Landing Page that contains the instance will not surface those annotations — the instance is inlined as straight code without the source annotations. You have to call `get_design_context` on the **component symbol** itself.

## Workflow: harvesting annotations from a Figma file

1. **Locate the component symbols.** Either:
   - Call `get_metadata` on the page and look for nodes that aren't part of the visible canvas (often grouped at negative coordinates or in a separate "Components" frame).
   - Or get them from a prior `get_design_context` call — symbols referenced by instances will have node ids; those ids resolve to the symbol definitions.
2. **For each symbol, call `get_design_context`** with `excludeScreenshot: true` and `forceCode: true`. Batch in parallel — each call is independent.
3. **Search the output for `data-development-annotations="` and `data-interaction-annotations="`.** A plain string search is fine.
4. **Report each annotation by node id and parent component name.** Quote verbatim — annotations often contain data tables (cities, options, defaults) that matter.

## Asking the user to scope it

If the file is huge and you don't want to sweep every symbol, ask the user to share **direct node URLs** to the annotated areas. Any Figma URL with `?node-id=X-Y` resolves to a specific node — pull `get_design_context` on it and grep for the annotation attributes.

## What annotations are NOT

- Not Figma **comment pins** — those are conversational and the MCP cannot read them. If the user means comment pins, they'll need to paste the text manually.
- Not `data-name` attributes — those are just the layer name.
- Not the screenshot — annotations are textual notes, not visual callouts.

## Tool defaults that help

When sweeping for annotations, pass `excludeScreenshot: true` (annotations are text, you don't need the image) and `forceCode: true` (so the call doesn't truncate to metadata-only). Both meaningfully reduce noise.
