#!/usr/bin/env node
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const site = join(root, 'site');
const docsDist = join(root, 'docs', 'dist');

execSync('pnpm run build', { cwd: root, stdio: 'inherit' });
execSync('pnpm --filter docs exec astro telemetry disable', {
  cwd: root,
  stdio: 'inherit',
});
execSync('pnpm --filter docs build', { cwd: root, stdio: 'inherit' });

rmSync(site, { recursive: true, force: true });
mkdirSync(site, { recursive: true });
cpSync(docsDist, site, { recursive: true });

writeFileSync(
  join(site, 'docs.html'),
  `<!doctype html><meta http-equiv="refresh" content="0;url=./"><link rel="canonical" href="./"><title>Redirecting…</title><a href="./">Unswipe docs</a>\n`,
);

console.log('Site ready at', site);
