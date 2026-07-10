# Unswipe docs

Documentation site built with [Astro Starlight](https://starlight.astro.build/).

```bash
# from repo root (pnpm workspace)
pnpm install
pnpm run docs:dev

# or from this folder
pnpm --filter docs dev
```

Content lives in `src/content/docs/`. Live carousel playgrounds are Astro components in `src/components/` hydrated from the library source in `../src`.
