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
│   └── trips/                  Auto-discovered (sorted by date, newest first)
│       └── {tripId}/
│           ├── trip.json       Trip metadata + content array
│           ├── main.md         Trip intro page (optional)
│           ├── {location}.md   One file per content item
│           └── images/         Trip-specific photos
│
├── images/                     Site-wide static images (og-image, about page, etc.)
│
├── templates/                  HTML page templates (shared styles + nav)
│   ├── base.html               Shared <head>, nav, footer, CSS
│   ├── home-page.html          Homepage template
│   ├── trip-intro-page.html    Trip intro with per-trip map
│   └── trip-location-page.html Individual location/article page
│
├── lib/                        Node.js library modules
│   ├── config-paths.js         ⭐ Single source of truth for all paths
│   ├── build-cache.js          Shared cache management (read/write _cache/)
│   ├── build-utilities.js      Shared build functions (discover, process, generate)
│   ├── css-utilities.js        CSS helpers
│   ├── generate-html.js        Renders templates → final HTML pages
│   ├── generate-sitemap.js     Builds sitemap.xml from trip list
│   ├── generate-trip-files.js  Generates per-trip HTML files
│   ├── image-utilities.js      Image dimension helpers
│   ├── seo-metadata.js         Generates <meta> / Open Graph tags
│   ├── slug-utilities.js       URL slug generation
│   └── template-utilities.js  Template rendering helpers
│
├── scripts/                    CLI build & utility scripts
│   ├── build/
│   │   ├── build.js            Full build — geocodes, renders, outputs HTML
│   │   ├── build-smart.js      Incremental build — skips unchanged trips
│   │   └── build-writing.js    Fast content-only rebuild (no geocoding)
│   ├── test/
│   │   ├── test-nav.js         Navigation smoke-tests
│   │   ├── test-filter.js      Homepage filter smoke-tests
│   │   ├── test-maps.js        Map page smoke-tests
│   │   ├── test-css-injection.js CSS injection tests
│   │   └── test-caption-detection.js Photo caption detection tests
│   ├── tools/
│   │   ├── add-trip.js         Interactive CLI to scaffold a new trip
│   │   ├── assign-photos.js    Insert photos into markdown
│   │   ├── sync-takeout-photos.js Extract photos from Google Takeout
│   │   ├── analyze-takeout-geo.js Analyze GPS data in Takeout
│   │   └── optimize-images.js  ImageMagick image optimization
│   ├── validate.js             Pre-build validation of trip configs
│   ├── deploy-check.js         Pre-deployment verification
│   ├── sync-docs.js            Check docs for drift against code
│   ├── test-geocode.js         Quick geocoding test utility
│   └── server.js               Local development HTTP server
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
├── config.built.json           Aggregated built data (all trips)
│
│   ── Build cache (gitignored) ──
├── _cache/
│   ├── build-cache.json        Tracks file mod times for incremental builds
│   └── geocode.json            Cached GPS coordinates from Google Maps API
│
│   ── Project housekeeping ──
├── package.json                npm scripts and dependencies
├── package-lock.json           Locked dependency versions
├── .gitignore                  Excludes node_modules, cache, built files
├── _redirects                  Netlify redirect rules
├── .nojekyll                   Disables Jekyll processing on GitHub Pages
├── LICENSE                     MIT License
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
| Generated data | No | Yes | `config.built.json`, `trips/*.json`, `sitemap.xml`, `robots.txt` |
| Static assets | Yes | Yes | `images/`, `trips/*/images/` |

---

## trip.json Schema

```json
{
  "title": "Athens and Greek Islands",
  "published": true,                // false = excluded from build
                                    // NOTE: slug inferred from directory name
  "beginDate": "2025-04-01",
  "endDate":   "2025-04-14",
  "metadata": {
    "year":      2025,
    "continent": "Europe",          // One of 7 valid values (see validate.js)
    "country":   "Greece",          // Primary country (display)
    "countries": ["Greece"],        // All countries visited; use multiple for multi-country trips
    "tripType":  ["adventure"],
    "tags":      ["europe", "greece"]
  },
  "coverImage":  "images/greece.jpg",
  "thumbnail":   "images/greece.jpg",
  "mapCenter":   "Paros",           // Geocoded; centers the trip map
  "content": [ ... ],               // Array of location / article items (see Content Types below)
  "relatedTrips": []                // Future: cross-link trips
}
```

---

## Content Types

Each trip's `content` array holds items of one of two types.
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
| `place` | Yes | Geocoded via Google Maps API (be specific) |
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
content/trips/*/trip.json  ├─> scripts/build/build.js (auto-discovers trips)
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

### Page Types

| Page | Template | URL |
|------|----------|-----|
| Homepage | `home-page.html` | `/` |
| World map | (inline in generate-html.js) | `/map/` |
| About | (inline) | `/about/` |
| Trip intro | `trip-intro-page.html` | `/trips/{slug}/` |
| Location | `trip-location-page.html` | `/trips/{slug}/{loc}.html` |

Trip intro pages feature a full-bleed hero (cover image + title overlay) injected via the `{{PRE_MAIN}}` placeholder in `base.html`.

### Markdown Post-Processing

The `convertMarkdown()` function in `scripts/build/build.js` automatically enhances
markdown content during the build:

1. **Image sizing:** All `<img>` tags get `max-width: 600px; width: 100%; height: auto;`
2. **Visible captions:** Images with alt text `![caption](img.jpg)` are wrapped in
   `<figure><img><figcaption>caption</figcaption></figure>`
3. **External links:** All `<a>` tags get `target="_blank" rel="noopener noreferrer"`
4. **Gallery captions:** Gallery links get `data-description` attribute for GLightbox

This means Kevin can write plain markdown without worrying about image sizing,
visible captions, or link behavior—the build handles it automatically.

### Published Trip Filtering

The build system filters trips based on the `published` field in trip.json:
- **Localhost:** All trips built and visible (ignores published status)
- **Production:** Only trips with `"published": true` are built
- **Detection:** Production is identified by `NODE_ENV=production` environment variable
- **Implementation:** `scripts/build/build.js` filters trips before any build operations

This allows Kevin to keep incomplete trips in the repository for local testing while
only showing complete trips on the public site. The GitHub Actions workflow sets
`NODE_ENV=production` during deployment.

---

## What Gets Deployed

Everything the site needs is generated into the project root. Deploy these:

```
index.html
map/
about/
trips/
404.html
sitemap.xml       (generated by build, not tracked in git)
config.built.json
images/
_redirects
robots.txt        (generated by build, not tracked in git)
.nojekyll
```

Do **not** deploy: `config/`, `content/`, `lib/`, `scripts/`, `templates/`,
`archive/`, `docs/`, `node_modules/`, `_cache/`.

---

## Troubleshooting

| Symptom | Check |
|---------|-------|
| Build fails | Run `npm run validate` — it reports the specific issue |
| Geocoding fails | Make `place` more specific (e.g. add country) |
| Trip missing from site | Confirm trip directory exists in `content/trips/` and `published: true` |
| Location page blank | Check `file` path in `trip.json` matches an actual `.md` file |
| Map marker missing | Geocoding may have failed — check build output for that location |
| Nav test fails | Run `npm test`; each failure names the file and the broken assertion |
| CI deploy broken | Check GitHub Actions log; `npm test` runs after build |
