# File Reference

A guide to every file and directory in the travel blog project, organized by role.

---

## Directory Layout

```
travelblog/
│
├── config/                     Source configuration
│   ├── site.json               Site title, description, heroImages, base URL
│   ├── google-maps.json        Google Maps API key (local dev only, gitignored)
│   └── remark42.json           Remark42 commenting system config (dev/prod hosts)
│
├── content/                    Editable source content
│   └── trips/                  Auto-discovered (sorted by date, newest first)
│       └── {tripId}/
│           ├── trip.json       Trip metadata + content array
│           ├── overview.md     Trip intro page (optional)
│           ├── {location}.md   One file per content item
│           └── images/         Trip-specific photos
│
├── images/                     Site-wide static images (og-image, about page, etc.)
│
├── templates/                  HTML page templates (shared styles + nav)
│   ├── base.html               Shared <head>, nav, footer, CSS
│   ├── home-page.html          Homepage template
│   ├── map-global-script.html  Global map JavaScript (inlined at build time)
│   ├── map-trip-script.html    Per-trip map JavaScript (inlined at build time)
│   ├── trip-intro-page.html    Trip intro page (hero image + intro content)
│   ├── toc-script.html          Table-of-contents toggle script (inlined)
│   ├── trip-location-page.html Individual location/article page
│   └── trip-map-page.html      Per-trip interactive map page
│
├── lib/                        Node.js library modules
│   ├── config-paths.js         ⭐ Single source of truth for all paths
│   ├── build-cache.js          Shared cache management (read/write _cache/)
│   ├── build-utilities.js      Shared build functions (discover, process, write)
│   ├── constants.js            Shared constants (gallery marker, image regex)
│   ├── css-content-pages.js    CSS for content pages
│   ├── css-homepage.js         CSS for homepage
│   ├── css-utilities.js        CSS router (getPageCSS)
│   ├── generate-global-pages.js Global map + about page generators
│   ├── generate-homepage.js    Homepage generator (trip grid, filter bar)
│   ├── generate-html-helpers.js Shared helpers (renderPage, readTemplate, buildTripsMenu)
│   ├── generate-sitemap.js     Builds sitemap.xml from trip list
│   ├── generate-trip-files.js  Per-trip HTML generation orchestrator
│   ├── generate-trip-map-page.js Trip map page generator (sidebar, navigation)
│   ├── generate-trip-pages.js  Trip intro and content page generators
│   ├── geocode.js              Google Maps geocoding with file-backed cache
│   ├── image-utilities.js      Image path and dimension helpers
│   ├── maps-config.js          Google Maps API key resolver
│   ├── markdown-converter.js   Markdown → HTML with post-processing pipeline
│   ├── nutshell.js             Nutshell block parser and renderer
│   ├── prompt-utilities.js     AI prompt helpers (add-trip CLI)
│   ├── remark42-config.js      Remark42 config loader + comment page ID generation
│   ├── seo-metadata.js         Generates <meta> / Open Graph tags
│   ├── slug-utilities.js       URL slug generation
│   ├── takeout-utilities.js    Google Takeout zip parsing utilities
│   └── template-utilities.js   assembleTemplate + fillTemplate helpers
│
├── scripts/                    CLI build & utility scripts
│   ├── audit/
│   │   ├── audit-shared.mjs    Shared audit utilities (file resolution, scoring, prompts)
│   │   ├── claude-audit.mjs    AI editorial audit (Claude-powered scoring + suggestions)
│   │   ├── content-audit.js    Mechanical content audit (sentence-level quality checks)
│   │   ├── gpt-audit.mjs       AI editorial audit (OpenAI-powered scoring + suggestions)
│   │   ├── gpt-audit-prompt.txt GPT audit system prompt
│   │   ├── gpt-audit-mandate.txt GPT audit enforcement mandate
│   │   └── gpt-dashboard.mjs  Dashboard for audit score history
│   ├── build/
│   │   ├── build.js            Full build — geocodes, renders, outputs HTML
│   │   ├── build-smart.js      Incremental build — skips unchanged trips
│   │   └── build-writing.js    Fast content-only rebuild (no geocoding)
│   ├── test/
│   │   ├── test-helpers.js     Shared test runner utilities
│   │   ├── test-maps-helpers.js Shared helpers for map tests
│   │   ├── test-nav.js         Navigation smoke-tests (Puppeteer)
│   │   ├── test-filter.js      Homepage filter smoke-tests (Puppeteer)
│   │   ├── test-maps.js        Map page smoke-tests (Puppeteer)
│   │   ├── test-css-injection.js CSS injection tests (Puppeteer)
│   │   ├── test-caption-detection.js Photo caption detection tests
│   │   ├── test-lib-utilities.js Unit tests for lib utilities (slug, template, etc.)
│   │   ├── test-geocode-utilities.js Unit tests for geocode cache logic
│   │   ├── test-build-cache.js Build cache validation and file existence tests
│   │   └── test-markdown-converter.js Unit tests for markdown-converter
│   ├── tools/
│   │   ├── add-trip.js         Interactive CLI to scaffold a new trip
│   │   ├── assign-photos.js    Insert photos into markdown
│   │   ├── build-context.js    Generate Context-Combined.md from editorial sources
│   │   ├── content-report.js   Content quality report (readability, write-good)
│   │   ├── normalize-typography.js Flatten curly quotes/dashes to ASCII in markdown
│   │   ├── sync-takeout-photos.js Extract photos from Google Takeout
│   │   ├── analyze-takeout-geo.js Analyze GPS data in Takeout
│   │   ├── optimize-images.js  ImageMagick image optimization
│   │   └── hero-search.js     Find hero image candidates from trip photos
│   ├── validate.js             Pre-build validation of trip configs
│   ├── deploy-check.js         Pre-deployment verification
│   ├── sync-docs.js            Check docs for drift against code
│   ├── test-geocode.js         Quick geocoding test utility
│   └── server.js               Local development HTTP server
│
├── .github/workflows/
│   ├── claude.yml              Claude Code AI agent workflow
│   ├── claude-code-review.yml  Claude Code PR review workflow
│   └── deploy.yml              GitHub Actions: build → test → deploy
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
  "subtitle": "Island-hopping by ferry, ancient ruins, and Cycladic sunsets",
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
  "mapNarrative": "Thirteen days island-hopping...",  // Optional: intro text above trip map
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
  "file": "milos.md",
  "thumbnail": "images/Milos-01.jpg",
  "travelMode": "ferry",
  "travelDuration": "3 hours"
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `type` | Yes | Must be `"location"` |
| `title` | Yes | Display name |
| `place` | Yes | Geocoded via Google Maps API (be specific) |
| `file` | Yes | Path relative to the trip directory |
| `thumbnail` | No | Shown in map popup; omit to hide image |
| `travelMode` | No | How you arrived: `"train"`, `"drive"`, `"ferry"`, or `"fly"`. Omit for the first stop. |
| `travelDuration` | No | Free-text travel time (e.g. `"1.5 hours"`). Shown between stops on the route page sidebar. |

**Note:** `duration` (visit length) now lives in the nutshell block inside the `.md` file, not in trip.json. The build extracts it from the nutshell during markdown conversion. For locations without a nutshell block, `duration` can still be specified in trip.json as a fallback.

### `article`

A non-geographic piece of content — e.g. a packing list or travel essay.
No geocoding, no map marker, no `place` fields.

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
| `dev` | `npm run dev` | Smart build → start server + full incremental watcher |
| `writing` | `npm run writing` | Smart build → start server + fast content-only watcher |
| `watch` | `npm run watch` | Full incremental watcher (nodemon, .md and .json) |
| `watch:writing` | `npm run watch:writing` | Fast content-only watcher (nodemon, .md only) |
| `serve` | `npm run serve` | Start local server without building |
| `add` | `npm run add` | Interactive CLI to scaffold a new trip |
| `audit` | `npm run audit -- spain/cordoba` | Mechanical content audit (sentence-level quality checks) |
| `gpt-audit` | `npm run gpt-audit -- spain/cordoba` | AI editorial audit (scoring + suggestions). Accepts multiple files or a trip name for incremental mode |
| `claude-audit` | `npm run claude-audit -- spain/cordoba` | AI editorial audit via Claude API (same interface as gpt-audit) |
| `gpt-dashboard` | `npm run gpt-dashboard` | Dashboard for audit score history and analysis |
| `normalize` | `npm run normalize` | Flatten curly quotes, Unicode dashes, and ellipses to ASCII in markdown source |
| `normalize-quotes` | `npm run normalize-quotes` | Alias for `normalize` |
| `build-context` | `npm run build-context` | Generate `Context-Combined.md` from editorial source files |
| `sync-photos` | `npm run sync-photos` | Extract and match photos from Google Takeout zip |
| `assign-photos` | `npm run assign-photos` | Interactive tool to insert photos into markdown |
| `report` | `npm run report` | Content quality report (readability + write-good) |
| `sync-docs` | `npm run sync-docs` | Check docs for broken links and stale file references |
| `test` | `npm test` | Full test suite: unit tests + Puppeteer smoke tests |
| `testGeo` | `npm run testGeo` | Quick geocoding test utility |
| `deploy-check` | `npm run deploy-check` | Pre-deploy file & content verification |
| `optimize:images` | `npm run optimize:images` | Compress trip images with ImageMagick |
| `optimize:images:dry-run` | `npm run optimize:images:dry-run` | Preview image optimization without writing files |
| `optimize:images:force` | `npm run optimize:images:force` | Force re-optimize all images (ignore already-optimized) |
| `hero-search` | `npm run hero-search -- <trip-id>` | Find landscape hero image candidates from a trip's photos |

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

`build.js` orchestrates; `lib/generate-homepage.js`, `lib/generate-trip-pages.js`,
and `lib/generate-global-pages.js` render each page using the templates in
`templates/`, with shared helpers in `lib/generate-html-helpers.js`.
All paths are resolved through `lib/config-paths.js`.

### Page Types

| Page | Template | URL |
|------|----------|-----|
| Homepage | `home-page.html` | `/` |
| World map | `map-global-script.html` (inlined) | `/map/` |
| About | (markdown → HTML, no separate template) | `/about/` |
| Trip intro | `trip-intro-page.html` | `/trips/{slug}/` |
| Trip map | `trip-map-page.html` | `/trips/{slug}/route.html` |
| Location | `trip-location-page.html` | `/trips/{slug}/{loc}.html` |

Trip intro pages feature a full-bleed hero (cover image + title overlay) injected via the `{{PRE_MAIN}}` placeholder in `base.html`.

### Markdown Post-Processing

The `convertMarkdown()` function in `lib/markdown-converter.js` automatically enhances
markdown content during the build:

1. **Image sizing:** All `<img>` tags get `max-width: 600px; width: 100%; height: auto;`
2. **Visible captions:** Images with alt text `![caption](img.jpg)` are wrapped in
   `<figure><img><figcaption>caption</figcaption></figure>`
3. **External links:** Links to external URLs (`http://`, `https://`) get
   `target="_blank" rel="noopener noreferrer"`. Internal links (e.g. `tips.html`) stay in the same tab.
4. **Gallery captions:** Gallery links get `data-description` attribute for GLightbox
5. **Nutshell blocks:** `:::nutshell Location Name` fenced blocks are parsed and rendered
   into styled HTML with verdict badge and field layout. Field order is controlled centrally
   via `NUTSHELL_FIELDS` in `lib/constants.js`. See `docs/Content/Editorial-Standards.md` for syntax.

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
`docs/`, `node_modules/`, `_cache/`.

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
