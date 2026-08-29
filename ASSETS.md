# Bundled assets inventory

Inventory of every non-code asset shipped in this repository, with its source and license. Kept current for each release.

| Asset type | Files in this repository | Source | License |
|---|---|---|---|
| Fonts | none (0 files) | System font stacks only — see below | n/a |
| Images / SVG files | none (0 files) | All graphics are drawn in code (inline SVG / CSS) | MIT (part of the templates) |
| Audio | none (0 files) | — | n/a |
| Video | none (0 files) | — | n/a |

## Font stacks referenced in code

The templates reference the following CSS font-family stacks. No font files are bundled; the fonts resolve to whatever is installed on the machine that renders the video.

- `"SF Mono", "Menlo", "Consolas", monospace`
- `-apple-system, "Segoe UI", Roboto, sans-serif`

Verified by scanning `src/` for font files, `@font-face`, `url()`, `data:` URIs and binary extensions (0 hits) on 2026-08-29.
