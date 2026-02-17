# Quick Start Guide

## First-Time Setup

```bash
npm install
npm run build
mv index.html index.html.backup   # promote the new homepage
mv index.html.new index.html
npm run serve                      # open http://localhost:8000
```

## Daily Workflow

```bash
# Auto-rebuild on content changes + serve
npm run dev

# Or, manual loop:
npm run build:smart   # only rebuilds what changed
npm run serve
```

## Adding a New Trip

### Interactive (recommended)

```bash
npm run add
```

Prompts for trip name, locations, and scaffolds all files.

### Manual

1. Create `content/trips/{id}/trip.json` — see [FILES.md](FILES.md) for the schema.
2. Create `content/trips/{id}/main.md` — trip intro.
3. Create `content/trips/{id}/{location}.md` — one file per stop.
4. Add the trip ID to `content/index.json`.
5. `npm run build`

## All Commands

| Command | What it does |
|---------|--------------|
| `npm run validate` | Check trip configs for errors |
| `npm run build` | Full build (validate → geocode → render) |
| `npm run build:smart` | Incremental build — only changed trips |
| `npm run build:smart -- greece` | Rebuild a single trip |
| `npm run build:smart -- --force` | Force full rebuild, ignore cache |
| `npm run dev` | Smart build + local server |
| `npm run watch` | Auto-rebuild on file changes |
| `npm run serve` | Local server only (no build) |
| `npm run add` | Scaffold a new trip interactively |
| `npm test` | Navigation, filter, and map smoke tests |
| `npm run deploy-check` | Pre-deploy verification |
| `npm run sync-docs` | Check docs for drift against code |

## What Gets Committed vs. Generated

**Commit (source):** `config/`, `content/`, `templates/`, `lib/`, `scripts/`, `images/`, `docs/`

**Commit (static assets):** `404.html`, `images/`

**Do not commit (gitignored):** `index.html`, `about/`, `map/`, `/trips/`, `sitemap.xml`, `robots.txt`, `config.built.json`, `_cache/`, `node_modules/`, `index.html.backup`

All generated HTML and data files are built fresh by CI at deploy time — they don't need to be tracked in git.
