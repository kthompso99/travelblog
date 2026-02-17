# Quick Start Guide

## First-Time Setup

```bash
npm install
npm run build
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
4. `npm run build`

## All Commands

See the [npm Scripts](FILES.md#npm-scripts) section of the file reference for the complete command list.

## What Gets Committed vs. Generated

**Commit (source):** `config/`, `content/`, `templates/`, `lib/`, `scripts/`, `images/`, `docs/`

**Commit (static assets):** `404.html`, `images/`

**Do not commit (gitignored):** `index.html`, `about/`, `map/`, `/trips/`, `sitemap.xml`, `robots.txt`, `config.built.json`, `_cache/`, `node_modules/`, `index.html.backup`

All generated HTML and data files are built fresh by CI at deploy time — they don't need to be tracked in git.
