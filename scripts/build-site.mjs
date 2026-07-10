#!/usr/bin/env node
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const site = join(root, 'site');

execSync('npm run build', { cwd: root, stdio: 'inherit' });

rmSync(site, { recursive: true, force: true });
mkdirSync(join(site, 'assets', 'plugins'), { recursive: true });

cpSync(join(root, 'demo', 'index.html'), join(site, 'index.html'));
cpSync(join(root, 'demo', 'docs.html'), join(site, 'docs.html'));
cpSync(join(root, 'demo', 'site.css'), join(site, 'site.css'));
cpSync(join(root, 'demo', 'guide.js'), join(site, 'guide.js'));
cpSync(join(root, 'dist', 'unswipe.js'), join(site, 'assets', 'unswipe.js'));
cpSync(
  join(root, 'dist', 'plugins', 'autoplay.js'),
  join(site, 'assets', 'plugins', 'autoplay.js'),
);
cpSync(
  join(root, 'dist', 'plugins', 'navigation.js'),
  join(site, 'assets', 'plugins', 'navigation.js'),
);
cpSync(
  join(root, 'dist', 'plugins', 'pagination.js'),
  join(site, 'assets', 'plugins', 'pagination.js'),
);
cpSync(
  join(root, 'dist', 'plugins', 'drag.js'),
  join(site, 'assets', 'plugins', 'drag.js'),
);

writeFileSync(join(site, '.nojekyll'), '');

console.log('Site ready at', site);
