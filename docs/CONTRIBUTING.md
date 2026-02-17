# Contributing to Two Travel Nuts

## Configuration Management: Single Source of Truth

All file paths and directory structures are defined in **`lib/config-paths.js`**. This ensures all scripts stay in sync when structural changes are made.

### ✅ Always Do This

```javascript
// ✅ CORRECT - Import from config-paths.js
const CONFIG = require('../lib/config-paths');
const tripConfig = CONFIG.getTripConfigPath('greece');
const mainMd = CONFIG.getTripMainPath('greece');
```

### ❌ Never Do This

```javascript
// ❌ WRONG - Hardcoded path
const tripConfig = 'content/trips/greece/trip.json';
```

### `lib/config-paths.js` Constants

```javascript
module.exports = {
    SITE_CONFIG: 'config/site.json',
    TRIPS_DIR: 'content/trips',
    TRIP_CONFIG_FILE: 'trip.json',
    TRIP_MAIN_FILE: 'main.md',
    OUTPUT_FILE: 'config.built.json',
    TRIPS_OUTPUT_DIR: 'trips',
    CACHE_DIR: '_cache',
    GEOCODE_CACHE_FILE: '_cache/geocode.json',
    BUILD_CACHE_FILE: '_cache/build-cache.json',
    getTripDir(tripId) { ... },
    getTripConfigPath(tripId) { ... },
    getTripMainPath(tripId) { ... },
    getTripImagesDir(tripId) { ... },
    getSyncedPhotosPath(tripId) { ... }
};
```

### Scripts That Import config-paths.js

| Script | Purpose | Uses |
|--------|---------|------|
| `scripts/build/build.js` | Main build | `SITE_CONFIG`, `TRIPS_DIR`, `CACHE_DIR`, helpers |
| `scripts/build/build-smart.js` | Incremental build | All path constants |
| `scripts/build/build-writing.js` | Fast content-only rebuild | `TRIPS_DIR`, helpers |
| `scripts/validate.js` | Validation | `TRIPS_DIR`, helpers |
| `scripts/tools/add-trip.js` | Add new trip | `TRIPS_DIR`, helpers |
| `scripts/deploy-check.js` | Pre-deploy checks | Path constants |
| `lib/build-cache.js` | Shared cache management | `BUILD_CACHE_FILE`, `CACHE_DIR` |
| `lib/build-utilities.js` | Shared build functions | `TRIPS_DIR`, helpers |

---

## Making Structure Changes

When reorganizing files or directories:

1. **Edit `lib/config-paths.js`** — and only this file
2. Run `npm run validate`
3. Run `npm run build`
4. Run `npm run build:smart`
5. Update `docs/FILES.md` if the structure changed significantly
6. Commit with a descriptive message

---

## Adding New Scripts

```javascript
#!/usr/bin/env node

const fs = require('fs');
const CONFIG = require('../lib/config-paths');

// ✅ Use CONFIG constants
const tripDir = CONFIG.getTripDir('mytrip');
const tripConfig = CONFIG.getTripConfigPath('mytrip');

// ❌ DON'T hardcode paths
// const tripConfig = 'content/trips/mytrip/trip.json'; // WRONG!
```

---

## Testing Before Committing

```bash
npm run validate    # check trip configs
npm run build       # full build
npm test            # navigation, filter, and map smoke tests
npm run build:smart # incremental build
npm run serve       # serve locally and check
```

---

## Common Mistakes

**Hardcoding paths** — always use `CONFIG.getTripConfigPath(id)` instead of constructing paths manually.

**Not testing after changes** — always run `npm run validate && npm run build` after any path or structure changes.

**Updating paths in multiple places** — only edit `lib/config-paths.js`. Never update path constants in individual scripts.

---

See **[FILES.md](FILES.md)** for the complete file reference and directory structure.
