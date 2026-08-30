#!/usr/bin/env node
/**
 * Italian Tech Atelier — asset budget gate.
 *
 * Hard-fails when theme-owned JavaScript or CSS exceeds budget. A budget that only lives in a
 * document is a suggestion; this makes it a build failure.
 *
 * What counts:
 *   JS  — every .js file in assets/ (all theme-owned; nothing is bundled from npm).
 *   CSS — assets/critical.css PLUS every {% stylesheet %} block in sections/ and snippets/,
 *         because Shopify concatenates those into one stylesheet the customer downloads.
 *         Measuring critical.css alone would understate the real cost substantially.
 *
 * Fonts are reported but not budgeted: they are subset, cached hard, and served with
 * unicode-range so only what a page needs is fetched.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const BUDGETS = {
  js: 30 * 1024,
  css: 45 * 1024,
};

const gzipped = (buffer) => gzipSync(buffer, { level: 9 }).length;
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

/* ── JavaScript ───────────────────────────────────────────────────────── */

const jsFiles = walk(join(root, 'assets')).filter((f) => extname(f) === '.js');
let jsRaw = '';
const jsBreakdown = [];

for (const file of jsFiles) {
  const source = readFileSync(file, 'utf8');
  jsRaw += source;
  jsBreakdown.push({
    name: file.replace(root + '\\', '').replace(root + '/', ''),
    size: gzipped(Buffer.from(source)),
  });
}

const jsTotal = gzipped(Buffer.from(jsRaw));

/* ── CSS: critical.css plus every scoped {% stylesheet %} block ────────── */

let cssRaw = readFileSync(join(root, 'assets', 'critical.css'), 'utf8');
const cssBreakdown = [{ name: 'assets/critical.css', size: gzipped(Buffer.from(cssRaw)) }];

const liquidFiles = [...walk(join(root, 'sections')), ...walk(join(root, 'snippets'))].filter(
  (f) => extname(f) === '.liquid'
);

let scopedTotal = '';
for (const file of liquidFiles) {
  const source = readFileSync(file, 'utf8');
  const match = source.match(/\{%\s*stylesheet\s*%\}([\s\S]*?)\{%\s*endstylesheet\s*%\}/);
  if (match) scopedTotal += match[1];
}

cssRaw += scopedTotal;
cssBreakdown.push({
  name: 'scoped {% stylesheet %} blocks',
  size: gzipped(Buffer.from(scopedTotal)),
});
const cssTotal = gzipped(Buffer.from(cssRaw));

/* ── Report ───────────────────────────────────────────────────────────── */

const fontFiles = walk(join(root, 'assets')).filter((f) => extname(f) === '.woff2');
const fontTotal = fontFiles.reduce((sum, f) => sum + statSync(f).size, 0);

console.log('\nItalian Tech Atelier — asset budgets (gzipped)\n');

console.log('JavaScript');
for (const item of jsBreakdown.sort((a, b) => b.size - a.size)) {
  console.log(`  ${kb(item.size).padStart(9)}  ${item.name}`);
}
console.log(`  ${'─'.repeat(9)}`);
console.log(`  ${kb(jsTotal).padStart(9)}  TOTAL  (budget ${kb(BUDGETS.js)})\n`);

console.log('CSS');
for (const item of cssBreakdown) {
  console.log(`  ${kb(item.size).padStart(9)}  ${item.name}`);
}
console.log(`  ${'─'.repeat(9)}`);
console.log(`  ${kb(cssTotal).padStart(9)}  TOTAL  (budget ${kb(BUDGETS.css)})\n`);

console.log(`Fonts (not budgeted, subset + unicode-range)`);
console.log(`  ${kb(fontTotal).padStart(9)}  ${fontFiles.length} files\n`);

const failures = [];
if (jsTotal > BUDGETS.js) failures.push(`JS ${kb(jsTotal)} exceeds ${kb(BUDGETS.js)}`);
if (cssTotal > BUDGETS.css) failures.push(`CSS ${kb(cssTotal)} exceeds ${kb(BUDGETS.css)}`);

if (failures.length > 0) {
  console.error('BUDGET EXCEEDED:');
  for (const failure of failures) console.error(`  - ${failure}`);
  console.error(
    '\nRemove code or raise the budget deliberately in CLAUDE.md. Do not ignore this.\n'
  );
  process.exit(1);
}

console.log('All budgets within limits.\n');
