#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const site = join(root, 'site');
const docs = join(root, 'docs');
const docsDist = join(docs, 'dist');

execSync('npm run build', { cwd: root, stdio: 'inherit' });

if (!existsSync(join(docs, 'node_modules'))) {
  execSync('npm ci', { cwd: docs, stdio: 'inherit' });
}

execSync('npx astro telemetry disable', { cwd: docs, stdio: 'inherit' });
execSync('npm run build', { cwd: docs, stdio: 'inherit' });

rmSync(site, { recursive: true, force: true });
mkdirSync(site, { recursive: true });
cpSync(docsDist, site, { recursive: true });

writeFileSync(
  join(site, 'docs.html'),
  `<!doctype html><meta http-equiv="refresh" content="0;url=./"><link rel="canonical" href="./"><title>Redirecting…</title><a href="./">Unswipe docs</a>\n`,
);

console.log('Site ready at', site);
