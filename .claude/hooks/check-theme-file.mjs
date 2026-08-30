#!/usr/bin/env node
/**
 * Italian Tech Atelier — advisory write guard.
 *
 * SAFETY CONTRACT: this hook is READ-ONLY. It never modifies, moves or deletes a file.
 * It reads the file that was just written and reports rule violations on stderr.
 * Exit 0 = clean (silent). Exit 2 = findings surfaced to the agent.
 *
 * Full Shopify Theme Check is deliberately NOT run here — it inspects the whole theme and
 * takes ~10s, which would stall every edit. Run `npm run check` for that.
 */

import { readFileSync } from 'node:fs';
import { relative, extname, sep } from 'node:path';

const read = (stream) =>
  new Promise((resolve) => {
    let data = '';
    stream.setEncoding('utf8');
    stream.on('data', (c) => (data += c));
    stream.on('end', () => resolve(data));
    stream.on('error', () => resolve(''));
  });

const raw = await read(process.stdin);
let payload;
try {
  payload = JSON.parse(raw || '{}');
} catch {
  process.exit(0); // Malformed payload is not the author's problem — stay silent.
}

const filePath = payload?.tool_input?.file_path;
if (!filePath) process.exit(0);

const root = process.cwd();
const rel = relative(root, filePath).split(sep).join('/');

// Only guard theme source. Ignore docs, tests, node_modules, and anything outside the project.
if (rel.startsWith('..') || rel.startsWith('node_modules/')) process.exit(0);
const ext = extname(filePath);
if (!['.liquid', '.json', '.js', '.css'].includes(ext)) process.exit(0);

let source;
try {
  source = readFileSync(filePath, 'utf8');
} catch {
  process.exit(0);
}

const findings = [];
const lines = source.split(/\r?\n/);
const at = (i) => `${rel}:${i + 1}`;

const isThemeSource = /^(sections|snippets|blocks|layout|templates)\//.test(rel);
const isTokenFile = /theme-tokens\.liquid$/.test(rel) || /^assets\/critical\.css$/.test(rel);

for (const [i, line] of lines.entries()) {
  // 1. Secrets and store identity must never be committed.
  if (/shpat_|shpca_|shppa_|shpss_/.test(line)) {
    findings.push(`${at(i)}  SECRET: Shopify access token pattern. Never commit a token.`);
  }
  if (/[a-z0-9-]+\.myshopify\.com/i.test(line) && !/example|your-store|<store>/i.test(line)) {
    findings.push(`${at(i)}  SECRET: hardcoded myshopify.com store domain.`);
  }

  // 2. Design tokens: no hardcoded colours outside the token file.
  if (isThemeSource && !isTokenFile) {
    if (/#[0-9a-fA-F]{3,8}\b/.test(line) && !/^\s*(\{%-?\s*)?(#|\{%\s*comment)/.test(line)) {
      findings.push(
        `${at(i)}  TOKEN: hardcoded hex colour. Use a var(--color-*) token from theme-tokens.liquid.`
      );
    }
    if (/\brgba?\(/.test(line) && !/var\(--/.test(line)) {
      findings.push(`${at(i)}  TOKEN: raw rgb()/rgba() colour. Use a design token.`);
    }
  }

  // 3. Deprecated / prohibited Liquid.
  if (ext === '.liquid' && /\{%-?\s*include\s/.test(line)) {
    findings.push(`${at(i)}  LIQUID: {% include %} is deprecated. Use {% render %}.`);
  }

  // 4. No framework may enter the theme.
  if (/cdn\.tailwindcss|unpkg\.com|cdn\.jsdelivr|react|jquery|alpinejs|gsap/i.test(line)) {
    if (!/^\s*(\/\/|\*|\{%\s*comment|#)/.test(line)) {
      findings.push(`${at(i)}  ARCHITECTURE: external framework/CDN reference. This theme ships no framework.`);
    }
  }

  // 5. Client-side trust boundary.
  if (ext === '.js' && /innerHTML\s*=/.test(line) && !/=\s*''|=\s*""/.test(line)) {
    findings.push(
      `${at(i)}  SECURITY: innerHTML assignment. Prefer the Section Rendering API or textContent.`
    );
  }
}

// 6. JSON must parse (templates and locales break the theme silently otherwise).
if (ext === '.json') {
  try {
    // Shopify allows a leading /* ... */ banner in auto-generated JSON files.
    JSON.parse(source.replace(/^\s*\/\*[\s\S]*?\*\//, ''));
  } catch (e) {
    findings.push(`${rel}  JSON: invalid JSON — ${e.message}`);
  }
}

// 7. Hardcoded Italian outside locales: catch obvious merchant-visible strings.
if (isThemeSource) {
  const italian =
    /(?:^|["'>\s])(Aggiungi al carrello|Cerca prodotti|Disponibile|Ritiro in negozio|Spedizione|Compatibile con|Verifica la compatibilità|Trova il tuo dispositivo|Cambia dispositivo)/;
  for (const [i, line] of lines.entries()) {
    if (italian.test(line) && !/\|\s*t\b|t:|\{%\s*comment|@example|@param/.test(line)) {
      findings.push(
        `${at(i)}  I18N: hardcoded Italian string. Move it to locales/it.default.json and use | t.`
      );
    }
  }
}

if (findings.length) {
  const unique = [...new Set(findings)];
  console.error(`\n[theme guard] ${unique.length} issue(s) in ${rel}:\n` + unique.map((f) => '  ' + f).join('\n') + '\n');
  process.exit(2);
}

process.exit(0);
