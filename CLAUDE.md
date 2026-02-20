# CLAUDE.md

### How Kevin and Claude Work Together
- Writing conventions for MD files: always use "Kevin" or "Claude", avoid pronouns.

### Git Commit Protocol
- **BLOCKING REQUIREMENT:** NEVER EVER commit or push to git without Kevin's explicit approval.
- This is a CRITICAL rule that Kevin has reminded Claude about 5+ times.
- After completing implementation, ALWAYS ask Kevin: "Ready to commit and push?"
- WAIT for Kevin to respond with explicit approval (e.g., "please commit and push", "yes", "go ahead").
- Do NOT commit if Kevin says anything else or asks questions about the changes.
- This rule has ABSOLUTE PRIORITY over all other instructions, conventions, or assumptions.
- If unsure whether to commit, the answer is ALWAYS: ask first, do not commit.

### Planning Protocol
- Always plan before implementation.
- Discuss overall strategy before writing code or making edits.
- Ask clarifying questions one at a time so Kevin can give complete answers.
- Get approval on the approach before implementation.
- Focus on understanding requirements and flow first.
- After completing each task, ask if Kevin has questions about what was just done.

---

### Architecture Quick-Reference

- **Generators (split by concern):** `lib/generate-homepage.js` (homepage), `lib/generate-trip-pages.js` (trip intro/content/map), `lib/generate-global-pages.js` (global map + about), `lib/generate-html-helpers.js` (shared: renderPage, readTemplate, buildTripsMenu).
- **Path config:** `lib/config-paths.js` — single source of truth for every path. Never hardcode.
- **Master template:** `templates/base.html` — all shared CSS, nav, footer. Trip hero (`{{PRE_MAIN}}`) is injected here and appears on all trip pages (intro, content, map).
- **Trip intro template:** `templates/trip-intro-page.html` — minimal template with intro content, comments, and prev/next nav.
- **Content types:** Trips support two content types — `location` (has coordinates, appears on map) and `article` (text-only, like "Tips"). Both appear in submenu navigation and prev/next chains. Articles don't require `place` or `duration` fields.
- **Published trips:** Only trips with `published: true` in trip.json appear on production (GitHub Pages). All trips visible on localhost for debugging. Filtering happens in scripts/build.js using `NODE_ENV=production`.
- **Build:** `npm run build` (full) or `npm run build:smart` (incremental). **Dev modes:** `npm run dev` (safe incremental) or `npm run writing` (fast content-only). Test: `npm test` (navigation, filter, and map smoke tests).
- **Homepage:** build auto-promotes `index.html.new` → `index.html` (old version backed up to `index.html.backup`).
- **Colour scheme:** amber `#f59e0b` throughout — polyline, markers (SVG divIcon), button accents, nav hover.
- **Maps:** Two Google Maps instances — global (`/map/`) and per-trip (`/trips/{slug}/map.html`). Trip intro pages show a hero image, not a map. Amber SVG divIcon markers. Popup hover-linger: 300 ms delay on mouseout, cancelled by mouseenter on popup. Nav z-index must stay ≥ 2000.
- **Gitignore gotchas:** `/trips/` output is gitignored; only `index.html`, `about/`, `map/` outputs are tracked. `index.html.backup` and `_cache/` also ignored.
- **CI:** `.github/workflows/deploy.yml` — build (auto-promotes homepage) → `npm test` → copy to `deploy/` → Pages API. Deploy step copies: index.html, 404.html, config.built.json, sitemap.xml, images/, trips/, map/, about/, robots.txt.
- **Scale target:** Kevin anticipates 30–50 trips long-term. Design decisions should hold at that count without re-architecting. Client-side filtering/searching of homepage cards is fine up to hundreds; image lazy-loading on the homepage becomes relevant around 30+ trips. Pagination is not needed at 50 but may be considered for UX.
- **Deferred work:** `docs/FigmaDesign/REMAINING.md` — homepage hero, photo gallery, newsletter.

---

### Development Workflows

Kevin has two development modes optimized for different editing scenarios:

#### `npm run dev` — Safe Mode (Full Incremental Builds)
**Use when:** Making structural changes, editing metadata, adding/removing locations, or when unsure about dependencies.

**What happens:**
- Detects which trips changed via `_cache/build-cache.json`
- Rebuilds entire trip (~2-5 seconds per trip)
- Updates all dependencies: homepage, global map, sitemap, trip intro
- Auto-promotes `index.html.new` → `index.html`
- Server stays running, watcher automatically triggers on content changes

**Workflow:**
```bash
npm run dev                          # Start dev server + watcher
# Edit any content files
# Save → auto-rebuild entire trip → refresh browser
```

#### `npm run writing` — Fast Mode (Content-Only Rebuilds)
**Use when:** Focused writing sessions editing location/article markdown (e.g., spending 3 hours editing milos.md, santorini.md, etc.)

**What happens:**
- Auto-detects most recently modified .md file in `content/trips/`
- Rebuilds **only** that specific HTML page (~4-6 milliseconds)
- Skips all dependencies for speed (10-1000x faster)
- Reuses processed trip data from previous full build

**Trade-offs:**
- ✅ **Updates:** The specific page you edited
- ❌ **Stays stale:** Homepage, global map, trip intro, other location pages, sitemap

**Workflow:**
```bash
npm run writing                      # Start fast content-only mode
# Edit content/trips/greece/milos.md
# Save → rebuild milos.html (~4-6ms) → refresh browser
# Edit content/trips/greece/santorini.md
# Save → rebuild santorini.html (~4-6ms) → refresh browser
# Repeat for hours...
```

**Before testing locally after writing mode:**
```bash
Ctrl-C                               # Stop writing mode
npm run build                        # Full build to sync homepage, map, and all dependencies
npm run serve                        # Now safe to verify the full site locally
```

**Note:** Running `npm run build` before committing is not required — CI runs a full fresh build on every push, so the deployed site is always correct regardless of local state.

#### Build pipeline verification
After any change to build scripts, `lib/` modules, or import/export structure, verify all four modes before committing:
```bash
npm run validate
npm run build
node scripts/build/build-smart.js
node scripts/build/build-writing.js content/trips/<trip>/<slug>.md
```
The `dev` and `writing` npm scripts launch `concurrently` (server + watcher); test the underlying scripts directly to avoid that.
