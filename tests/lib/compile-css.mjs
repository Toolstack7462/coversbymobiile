/**
 * Compiles the theme's REAL stylesheet for offline use (test harness and visual preview).
 *
 * Shared by tests/build-harness.mjs and tests/build-preview.mjs so both are guaranteed to be
 * looking at the same CSS the storefront would serve: the design tokens from
 * theme-tokens.liquid (with Liquid defaults resolved), plus critical.css, plus every scoped
 * {% stylesheet %} block, which Shopify concatenates into one download.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

export function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

/** Extracts the :root token block, resolving `{{ settings.x | default: 'y' }}` to `y`. */
function extractTokens() {
  const source = readFileSync(join(root, 'snippets', 'theme-tokens.liquid'), 'utf8');
  const blocks = [...source.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
  // Last block holds :root. The first holds @font-face and is handled separately by the
  // preview, which serves the real WOFF2 files.
  return blocks[blocks.length - 1]
    .replace(/\{\{\s*settings\.[a-z_]+\s*\|\s*default:\s*'([^']+)'\s*\}\}/g, '$1')
    .replace(/\{\{\s*settings\.[a-z_]+\s*\|\s*default:\s*([0-9]+)\s*\}\}/g, '$1')
    .replace(/\{%-?\s*[\s\S]*?-?%\}/g, '');
}

function scopedStyles() {
  const dirs = ['sections', 'snippets', 'blocks'].filter((d) => existsSync(join(root, d)));
  const files = dirs.flatMap((d) => walk(join(root, d))).filter((f) => extname(f) === '.liquid');

  let css = '';
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    for (const m of source.matchAll(/\{%\s*stylesheet\s*%\}([\s\S]*?)\{%\s*endstylesheet\s*%\}/g)) {
      css += `\n/* ${file.split(/[\\/]/).slice(-2).join('/')} */\n${m[1]}`;
    }
  }
  return css;
}

/** @param {{fonts?: boolean}} [options] - include self-hosted @font-face rules */
export function compileCss({ fonts = false } = {}) {
  const parts = ['/* Compiled from theme source. Do not edit. */'];

  if (fonts) {
    // Same faces and unicode-ranges as theme-tokens.liquid, pointed at the served asset paths.
    parts.push(`
@font-face {
  font-family: 'Inter Variable'; font-style: normal; font-weight: 400 700; font-display: swap;
  src: url('/assets/inter-latin.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2212, U+FEFF, U+FFFD;
}
@font-face {
  font-family: 'Manrope Variable'; font-style: normal; font-weight: 600 800; font-display: swap;
  src: url('/assets/manrope-latin.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2212, U+FEFF, U+FFFD;
}`);
  }

  parts.push(extractTokens());
  parts.push(readFileSync(join(root, 'assets', 'critical.css'), 'utf8'));
  parts.push(scopedStyles());
  return parts.join('\n');
}

/** Reads the real Italian locale so the preview shows real translated strings. */
export function locale() {
  return JSON.parse(readFileSync(join(root, 'locales', 'it.default.json'), 'utf8'));
}

/** Renders one icon from snippets/icon.liquid by extracting its `when` branch. */
export function icon(name, cls = 'icon') {
  const source = readFileSync(join(root, 'snippets', 'icon.liquid'), 'utf8');
  const re = new RegExp(
    `\\{%-\\s*when\\s+'${name}'\\s*-%\\}([\\s\\S]*?)(?=\\{%-\\s*when|\\{%-\\s*else)`
  );
  const m = source.match(re);
  const body = m ? m[1].trim() : '';
  return `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}
