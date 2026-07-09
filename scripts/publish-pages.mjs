#!/usr/bin/env node
import { cpSync, rmSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const site = join(root, 'site');

execSync('npm run build:site', { cwd: root, stdio: 'inherit' });

const files = ['index.html', 'docs.html', 'site.css', 'guide.js'];
const stale = ['main.js', 'docs.js', 'docs.css'];

for (const file of files) {
  cpSync(join(site, file), join(root, file));
}

for (const file of stale) {
  rmSync(join(root, file), { force: true });
}

rmSync(join(root, 'assets'), { recursive: true, force: true });
cpSync(join(site, 'assets'), join(root, 'assets'), { recursive: true });
writeFileSync(join(root, '.nojekyll'), '');

console.log('Published static site to repository root');
