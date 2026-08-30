/**
 * Rebuilds the harness from theme source before every run, so the tests can never pass against
 * a stale copy of the CSS.
 */

import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export default function globalSetup() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  execFileSync(process.execPath, ['tests/build-harness.mjs'], { cwd: root, stdio: 'inherit' });
}
