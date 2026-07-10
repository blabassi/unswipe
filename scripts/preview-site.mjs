#!/usr/bin/env node
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pages = join(root, '.pages');
const site = join(root, 'site');

rmSync(pages, { recursive: true, force: true });
mkdirSync(join(pages, 'unswipe'), { recursive: true });
cpSync(site, join(pages, 'unswipe'), { recursive: true });

const child = spawn('npx', ['--yes', 'serve', pages, '-p', '4173'], {
  cwd: root,
  stdio: 'inherit',
});

child.on('exit', (code) => process.exit(code ?? 0));
