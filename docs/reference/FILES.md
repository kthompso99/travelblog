# File Reference

A guide to every file and directory in the travel blog project, organized by role.

---

## Directory Layout

```
travelblog/
│
├── config/                     Source configuration
│   └── site.json               Site title, description, base URL
│
├── content/                    Editable source content
│   ├── index.json              Ordered list of trip IDs
│   └── trips/
│       └── {tripId}/
│           ├── trip.json       Trip metadata + content array
│           ├── main.md         Trip intro page (optional)
│           ├── {location}.md   One file per content item
│           └── images/         Trip-specific photos
│
├── images/                     Root-level thumbnails (world map popups)
│
├── templates/                  HTML page templates (shared styles + nav)
│   ├── base.html               Shared <head>, nav, footer, CSS
│   ├── home-page.html          Homepage template
│   ├── trip-intro-page.html    Trip intro with per-trip map
│   ├── trip-location-page.html Individual location page
│   └── trip-page.html          Legacy trip template
│
├── lib/                        Node.js library modules
│   ├── config-paths.js         ⭐ Single source of truth for all paths
│   ├── generate-html.js        Renders templates → final HTML pages
│   ├── generate-sitemap.js     Builds sitemap.xml from trip list
│   └── seo-metadata.js         Generates <meta> / Open Graph tags
│
├── scripts/                    CLI build & utility scripts
│   ├── build.js                Main build — geocodes, renders, outputs HTML
│   ├── build-smart.js          Incremental build — skips unchanged trips
│   ├── validate.js             Pre-build validation of trip configs
│   ├── add-trip.js             Interactive CLI to scaffold a new trip
│   ├── deploy-check.js         Pre-deployment verification
│   ├── server.js               Local development HTTP server
│   └── test-nav.js             Navigation smoke-test (runs as `npm test`)
│
├── .github/workflows/
│   └── deploy.yml              GitHub Actions: build → test → deploy
│
├── archive/                    Legacy / obsolete files kept for reference
│
├── docs/                       Project documentation (this directory)
│
│   ── Generated output (created by build, not edited manually) ──
├── index.html                  Homepage
├── map/index.html              World-map page
├── about/index.html            About page
├── trips/
│   ├── {tripId}.json           Built trip data (geocoded coordinates + HTML)
│   └── {tripId}/
│       ├── index.html          Trip intro page
│       └── {location}.html     Location pages
├── 404.html                    Custom error page
├── sitemap.xml                 Search-engine sitemap
├── config.built.json           Aggregated built data (all trips)
│
│   ── Project housekeeping ──
├── package.json                npm scripts and dependencies
├── package-lock.json           Locked dependency versions
├── Makefile                    Convenience aliases for npm scripts
├── .gitignore                  Excludes node_modules, cache, built files
├── _redirects                  Netlify redirect rules
├── robots.txt                  Search-engine crawl directives
├── .nojekyll                   Disables Jekyll processing on GitHub Pages
├── LICENSE                     Creative Commons CC BY-NC-ND 4.0
├── README.md                   Project overview
└── CLAUDE.md                   Claude Code working-memory notes
```

---

## Source vs. Generated

| Category | Edit? | Deployed? | Where |
|----------|-------|-----------|-------|
| Source config | Yes | No | `config/`, `content/` |
| Source content | Yes | No | `content/trips/*/` |
| Templates | Yes | No | `templates/` |
| Library code | Yes | No | `lib/` |
| Scripts | Yes | No | `scripts/` |
| Generated HTML | No | Yes | `index.html`, `map/`, `about/`, `trips/` |
| Generated data | No | Yes | `config.built.json`, `trips/*.json`, `sitemap.xml` |
| Static assets | Yes | Yes | `images/`, `trips/*/images/` |

---

## Content Types

Each trip's `content` array in `trip.json` holds items of one of two types.
Both types are fully supported by the build pipeline.

### `location`

A geographically-pinned stop on the trip. Appears as a marker on the
trip's interactive map and gets its own HTML page.

```json
{
  "type": "location",
  "title": "Milos",
  "place": "Milos Greece",
  "duration": "2 days",
  "file": "milos.md",
  "thumbnail": "images/Milos-01.jpg"
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `type` | Yes | Must be `"location"` |
| `title` | Yes | Display name |
| `place` | Yes | Geocoded via Nominatim (be specific) |
| `duration` | Yes | Free-text string shown on the page |
| `file` | Yes | Path relative to the trip directory |
| `thumbnail` | No | Shown in map popup; omit to hide image |

### `article`

A non-geographic piece of content — e.g. a packing list or travel essay.
No geocoding, no map marker, no `place` or `duration` fields.

```json
{
  "type": "article",
  "title": "Packing List",
  "file": "packing.md"
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `type` | Yes | Must be `"article"` |
| `title` | Yes | Display name |
| `file` | Yes | Path relative to the trip directory |

---

## trip.json Schema

```json
{
  "id": "greece",                   // Must match directory name
  "title": "Athens and Greek Islands",
  "slug": "greece",                 // URL segment: /trips/greece/
  "published": true,                // false = excluded from build
  "beginDate": "2025-04-01",
  "endDate":   "2025-04-14",
  "metadata": {
    "year":      2025,
    "continent": "Europe",          // One of 7 valid values (see validate.js)
    "country":   "Greece",
    "tripType":  ["adventure"],
    "tags":      ["europe", "greece"]
  },
  "coverImage":  "images/greece.jpg",
  "thumbnail":   "images/greece.jpg",
  "mapCenter":   "Paros",           // Geocoded; centers the trip map
  "content": [ ... ],               // Array of location / article items
  "relatedTrips": []                // Future: cross-link trips
}
```

---

## npm Scripts

| Script | Command | What it does |
|--------|---------|--------------|
| `validate` | `npm run validate` | Check all trip configs for errors before building |
| `build` | `npm run build` | Validate → full build (geocode + render all trips) |
| `build:smart` | `npm run build:smart` | Incremental build — only rebuilds changed trips |
| `dev` | `npm run dev` | Smart build then start local server |
| `watch` | `npm run watch` | Rebuild on file changes (nodemon) |
| `serve` | `npm run serve` | Start local server without building |
| `add` | `npm run add` | Interactive CLI to scaffold a new trip |
| `test` | `npm test` | Navigation smoke-test on all generated pages |
| `deploy-check` | `npm run deploy-check` | Pre-deploy file & content verification |

Per-trip incremental build:
```bash
npm run build:smart -- greece      # rebuild only the greece trip
npm run build:smart -- --force     # force full rebuild ignoring cache
```

---

## The Build Chain

```
config/site.json          ─┐
content/index.json         ├─> scripts/build.js
content/trips/*/trip.json  │       │
content/trips/*/*.md  ─────┘       │
                                   ▼
                        trips/*.json          (per-trip built data)
                        config.built.json     (aggregate)
                        index.html            (homepage)
                        map/index.html        (world map)
                        about/index.html      (about page)
                        trips/*/index.html    (trip intro pages)
                        trips/*/{loc}.html    (location pages)
                        sitemap.xml
```

`build.js` orchestrates; `lib/generate-html.js` renders each page using the
templates in `templates/`. All paths are resolved through `lib/config-paths.js`.

### Markdown Post-Processing

The `convertMarkdown()` function in `scripts/build.js` automatically enhances
markdown content during the build:

1. **Image sizing:** All `<img>` tags get `max-width: 600px; width: 100%; height: auto;`
2. **Visible captions:** Images with alt text `![caption](img.jpg)` are wrapped in
   `<figure><img><figcaption>caption</figcaption></figure>`
3. **External links:** All `<a>` tags get `target="_blank" rel="noopener noreferrer"`
4. **Gallery captions:** Gallery links get `data-description` attribute for GLightbox

This means Kevin can write plain markdown without worrying about image sizing,
visible captions, or link behavior—the build handles it automatically.

---

## What Gets Deployed

Everything the site needs is generated into the project root. Deploy these:

```
index.html
map/
about/
trips/
404.html
sitemap.xml
config.built.json
images/
_redirects
robots.txt
.nojekyll
```

Do **not** deploy: `config/`, `content/`, `lib/`, `scripts/`, `templates/`,
`archive/`, `docs/`, `node_modules/`, `package.json`, `.build-cache.json`.

---

## Troubleshooting

| Symptom | Check |
|---------|-------|
| Build fails | Run `npm run validate` — it reports the specific issue |
| Geocoding fails | Make `place` more specific (e.g. add country) |
| Trip missing from site | Confirm it's listed in `content/index.json` and `published: true` |
| Location page blank | Check `file` path in `trip.json` matches an actual `.md` file |
| Map marker missing | Geocoding may have failed — check build output for that location |
| Nav test fails | Run `npm test`; each failure names the file and the broken assertion |
| CI deploy broken | Check GitHub Actions log; `npm test` runs after build |
