# Puru's Blog

This is my personal site and blog, built with SvelteKit and [ogygia](https://ogygiajs.dev). Every page is
prerendered plain HTML; only the clock, the home page's sky and line map ship JavaScript.

```sh
pnpm dev      # dev server (reads the stats cache, never counts)
pnpm build    # prerender everything (counts stats if the cache is older than a day)
pnpm stats    # count stats now; --force ignores the day-old cache, --full recounts npm since 2015
pnpm check    # svelte-check
```

- Content lives in `src/content` as ogygia folders: `blog/<date>-<slug>/+doc.svx`, `work/NN-<slug>/+doc.svx`,
  `speaking/{talk,podcast}/NN-<slug>/+doc.svx`. Images stay next to them but are not rendered yet.
- Every page also exists as markdown (`/blog/<slug>.md`, `/work.md`, ...), listed in `/llms.txt`.

## Stats

`src/lib/stats` counts all-time npm downloads (every package `puruvj` maintains), GitHub stars and lines
changed. The result is cached for a day and shared by every build:

- With `BLOB_READ_WRITE_TOKEN` set, the cache is `stats/stats.json` in Vercel Blob, so all deploys (production
  and previews) reuse one count a day. Without it, the cache is `node_modules/.cache/puru-stats/stats.json`.
- npm counts are incremental: each run adds only the days since the last count.
- Set `GITHUB_TOKEN` for the lines-changed numbers (they cost one GitHub call per repo).
- A failed API never fails the build: the last good numbers stay.

# License

Before forking this repo, please read the license: [LICENSE](./LICENSE.md)
