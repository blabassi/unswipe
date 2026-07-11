import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const plugins = [
  'autoplay',
  'navigation',
  'pagination',
  'drag',
  'loop',
  'classNames',
  'wheel',
  'autoScroll',
  'fade',
];

mkdirSync(join(root, 'dist/plugins'), { recursive: true });

await Promise.all(
  plugins.flatMap((name) => {
    const entry = join(root, `src/plugins/${name}.ts`);
    return [
      build({
        entryPoints: [entry],
        bundle: true,
        minify: true,
        format: 'esm',
        outfile: join(root, `dist/plugins/${name}.js`),
      }),
      build({
        entryPoints: [entry],
        bundle: true,
        minify: true,
        format: 'cjs',
        outfile: join(root, `dist/plugins/${name}.cjs`),
      }),
    ];
  }),
);

console.log(`Built ${plugins.length} plugins`);
