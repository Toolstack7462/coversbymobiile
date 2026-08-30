# Repository audit (Phase 1)

Audit performed before any file was written. This records what was actually found, not what was
assumed.

## Headline finding: there was no repository

| Check | Result |
|---|---|
| Session working directory | `C:\WINDOWS\system32` — a Windows system directory |
| Is it a git repository? | **No.** `git rev-parse --is-inside-work-tree` → `fatal: not a git repository` |
| Shopify theme markers anywhere on `C:\Users\User` or `D:\` (depth 6) | **None.** Searched for `settings_schema.json`, `.theme-check.yml`, `shopify.theme.toml`, `shopify.app.toml` — zero results |
| Theme archives in Downloads | None (`*shopify*`, `*theme*`, `dawn`, `skeleton`, `prestige`, `capital`, `maximize` — no matches) |

### Consequences

- This is **greenfield**, not an existing live theme and not a licensed commercial theme.
- There is **no live-store risk**: nothing to overwrite, nothing to publish over.
- There is **no merchant functionality to preserve** and **no third-party integration** to keep
  working.
- No custom code, app embeds or existing design tokens exist to inherit.
- **Nothing was written into `C:\WINDOWS\system32`.** The project was created at
  `C:\Users\User\italian-tech-atelier` after confirming the location with the user.

## Toolchain found

| Tool | Status |
|---|---|
| Node | v24.14.1 ✅ |
| npm | 11.11.0 ✅ |
| git | 2.54.0.windows.1 ✅ |
| Shopify CLI | ❌ absent → installed as a dev dependency (`@shopify/cli` 3.94.3) |
| Ruby | ❌ absent (not required — Theme Check ships inside the modern CLI) |
| `theme-check` standalone | ❌ absent (superseded by `shopify theme check`) |
| Playwright | ❌ absent → installed as a dev dependency (1.62.1 + Chromium) |

## Claude Code capabilities found

Verified on disk rather than assumed.

| Capability | Status |
|---|---|
| `ui-ux-pro-max` skill | ✅ **installed** at `~/.claude/skills/ui-ux-pro-max/` — used, not duplicated |
| `impeccable`, `design-taste-frontend`, `emil-design-eng` skills | ✅ installed (user scope) |
| Shopify / Liquid skill | ❌ none → created `.claude/skills/shopify-theme-engineer/` |
| Ecommerce CRO skill | ❌ none → created `.claude/skills/ecommerce-cro/` |
| Device-compatibility skill | ❌ none → created `.claude/skills/device-compatibility-architect/` |
| Accessibility skill | ❌ none → created `.claude/skills/accessibility-wcag22/` |
| Core Web Vitals skill | ❌ none → created `.claude/skills/core-web-vitals/` |
| Technical SEO skill | ❌ none → created `.claude/skills/technical-seo/` |
| Visual QA skill | ❌ none → created `.claude/skills/visual-qa/` |
| Project subagents | ❌ `~/.claude/agents` did not exist → created 7 in `.claude/agents/` |
| `/code-review`, `/security-review` | ✅ available (bundled) |
| **`/verify`, `/debug`** | ❌ **do not exist in this installation.** Not used and not claimed. The equivalent is `npm run verify` (defined in `package.json`) plus `/code-review`. |
| MCP servers | `ruflo` (project-scoped), Nimble, Consensus, Canva, Notion, Google Drive, Vercel. **No Shopify MCP. No Playwright MCP.** |
| Browser automation | `claude-in-chrome` skill available but unusable without a live preview URL; Playwright installed instead |

## Theme base and its licence

Scaffolded from **Shopify Skeleton** (`github.com/Shopify/skeleton-theme`), the current official
starter — 53 files.

**Licence correction.** Skeleton is commonly assumed to be MIT. It is not. `LICENSE.md` (retained
in this repository) grants rights that

> "may only be exercised to develop themes that integrate or interoperate with Shopify software
> or services, and, if applicable, to distribute, offer for sale or otherwise make available any
> such themes via the Shopify Theme Store. All other uses of the Software are strictly
> prohibited."

That covers this project, which is a Shopify theme. It would **not** cover reusing this code
outside the Shopify ecosystem.

### What survives from Skeleton

Almost nothing of its markup or styling. Retained deliberately:

- `LICENSE.md` (attribution, required)
- `.gitattributes`, `.shopifyignore`, `.theme-check.yml`
- The `.shopify-section` three-column full-bleed grid idea in `critical.css` — a genuinely good
  pattern, reimplemented on this theme's own tokens
- OS 2.0 directory conventions and the JSON template shape

Removed: every demo section (`hello-world`, `custom-section`), the placeholder header/footer/
product/collection/cart/search sections, `snippets/css-variables.liquid`, `snippets/image.liquid`,
the demo SVG assets, and `blocks/group.liquid` + `blocks/text.liquid`.

Everything in `sections/`, `snippets/`, `assets/` and `locales/` is original work.

## Fonts and their licences

Manrope and Inter are both **SIL Open Font License 1.1**, which permits self-hosting and
redistribution. Sourced from the `@fontsource-variable/*` packages (dev dependencies), with the
Latin and Latin-Extended WOFF2 subsets copied into `assets/`. Both licence texts are retained at
`docs/font-licenses/`.

## Risks identified and how they were handled

| Risk | Handling |
|---|---|
| Writing into a Windows system directory | Project location confirmed with the user before any write |
| Committing secrets or a store domain | `.gitignore` blocks `.env*`, `*.token`, `.shopify/`, `shopify.theme.toml`; the write hook greps for `shpat_`/`myshopify.com` on every edit |
| Shipping a font without the right to | Verified OFL-1.1 and retained both licence files |
| Claiming tools that do not exist | `/verify` and `/debug` confirmed absent and explicitly not used |
| Publishing the theme | No store is authenticated; `shopify theme publish` is never invoked and is prohibited in `CLAUDE.md` |
