# Fonts

**Manrope** for headings, **Inter** for body and UI. Both are self-hosted in `assets/`, so the
storefront makes no request to a third-party font service — one less external dependency, one
less privacy question, and no render-blocking round-trip to another origin.

## Licensing

Both are **SIL Open Font License 1.1**, which permits self-hosting, modification and
redistribution as part of a larger work. The full licence texts are retained at:

- `docs/font-licenses/OFL-Inter.txt`
- `docs/font-licenses/OFL-Manrope.txt`

Retaining them is an OFL requirement, not a courtesy. Do not delete them.

Sourced from the `@fontsource-variable/inter` and `@fontsource-variable/manrope` npm packages
(dev dependencies, used only to obtain the files — **nothing from `node_modules` ships to the
storefront**).

## What ships

| File | Bytes | Loads when |
|---|---|---|
| `inter-latin.woff2` | 48,256 | Almost always |
| `inter-latin-ext.woff2` | 85,068 | Only if a Latin-Extended character appears |
| `manrope-latin.woff2` | 24,836 | Almost always |
| `manrope-latin-ext.woff2` | 15,120 | Only if a Latin-Extended character appears |

All four are **variable** fonts covering the full declared weight range in one file — Inter
400–700 and Manrope 600–800. That is why there is no `inter-600.woff2`: adding a weight costs
nothing extra, and removing one saves nothing.

## Why Latin-Extended almost never loads on an Italian store

Every accented character Italian actually uses — **à è é ì ò ù**, and the capitals — lives in
U+00C0–U+00FF, which is inside the **Latin** subset. The `unicode-range` descriptors in
`snippets/theme-tokens.liquid` mean the browser fetches `-latin-ext` only if a character in that
range is actually rendered.

So for ordinary Italian copy the real font cost is **73 KB** (Inter latin + Manrope latin), not
the 173 KB on disk.

### Should Latin-Extended be dropped?

An audit flagged `inter-latin-ext.woff2` as suspiciously large — bigger than the Latin subset it
supplements. That is genuinely how the Google Fonts Latin-Extended subset is cut: it carries a
large glyph set (Polish, Czech, Turkish, Romanian, Vietnamese diacritics and more), and Inter has
wide coverage.

It is kept, for two reasons:

1. It costs **zero bytes at runtime** for Italian pages. It is not preloaded and not fetched
   unless needed.
2. Italian customers have Polish, Romanian, Czech and Turkish names. A customer whose own name
   renders in a fallback font mid-word is a small, avoidable insult.

If theme file size ever becomes a constraint, dropping the two `-latin-ext` files and their
`@font-face` blocks is safe and reversible — the fallback stack covers the rare glyph.

## Loading strategy

Defined in `snippets/theme-tokens.liquid` and `layout/theme.liquid`:

- **`@font-face` is inlined** in the document head — no stylesheet round-trip before text can
  render.
- **`font-display: swap`** — text is visible immediately in the fallback and swaps when the
  webfont arrives. Never invisible text.
- **Exactly two preloads**, `manrope-latin.woff2` and `inter-latin.woff2`. Preloading all four
  would compete for bandwidth with the LCP image, and the other two usually are not needed at
  all. Preloading everything is equivalent to preloading nothing.
- **Fallback stack** is `ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, …` —
  metrically close enough that the swap does not visibly reflow.

## Turning them off

**Theme settings → Tipografia → "Usa i caratteri Manrope e Inter inclusi nel tema"**.

Unchecked, the theme uses the system stack. Nothing breaks: the type scale, weights and spacing
are all token-driven and independent of the family. It is a legitimate choice for a merchant who
wants the absolute minimum page weight.

## Replacing them

1. Obtain WOFF2 files you are licensed to self-host.
2. Upload to `assets/` with the same four names, **or** change the filenames in
   `snippets/theme-tokens.liquid` and the two preloads in `layout/theme.liquid`.
3. Update `--font-heading` / `--font-body` in `snippets/theme-tokens.liquid`.
4. Update the licence files in `docs/font-licenses/`.
5. Re-run `npm run verify` — the type-scale tests still apply.

**Do not add weights** beyond Inter 400–700 and Manrope 600–800 without a reason. The scale in
`CLAUDE.md` §4 is built on exactly those.
