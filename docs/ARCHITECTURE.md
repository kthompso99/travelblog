# Architecture & Configuration Management

## 🎯 Single Source of Truth: `lib/config-paths.js`

All file paths and directory structures are defined in **`lib/config-paths.js`**. This ensures all scripts stay in sync when you make structural changes.

### Why This Matters

Before centralization, path information was scattered across multiple files:
- `scripts/build/build.js` had hardcoded `'content/trips'`
- `scripts/validate.js` had hardcoded `'trip.json'` and `'main.md'`
- `scripts/tools/add-trip.js` had hardcoded paths
- `scripts/build/build-smart.js` had its own path constants

**Problem**: When we moved from `config/trips/` to `content/trips/`, several scripts fell out of sync.

**Solution**: All scripts now import from `lib/config-paths.js`.

---

## 📁 Configuration File Structure

```javascript
// lib/config-paths.js
module.exports = {
    // Site configuration
    SITE_CONFIG: 'config/site.json',
    TRIPS_DIR: 'content/trips',

    // Trip file names
    TRIP_CONFIG_FILE: 'trip.json',
    TRIP_MAIN_FILE: 'main.md',

    // Build outputs
    OUTPUT_FILE: 'config.built.json',
    TRIPS_OUTPUT_DIR: 'trips',

    // Cache (entire _cache/ dir is gitignored)
    CACHE_DIR: '_cache',
    GEOCODE_CACHE_FILE: '_cache/geocode.json',
    BUILD_CACHE_FILE: '_cache/build-cache.json',

    // Helpers
    getTripDir(tripId) { ... },
    getTripConfigPath(tripId) { ... },
    getTripMainPath(tripId) { ... },
    getTripImagesDir(tripId) { ... },
    getSyncedPhotosPath(tripId) { ... }
};
```

---

## 🔧 How Scripts Use It

### Example: scripts/validate.js

```javascript
const CONFIG = require('../lib/config-paths');

// Use the constants
const { SITE_CONFIG, TRIPS_DIR } = CONFIG;

// Use the helpers
const tripConfigPath = CONFIG.getTripConfigPath('greece');
// Returns: 'content/trips/greece/trip.json'
```

---

## 📝 Making Structure Changes

### ✅ CORRECT Way (Single Source of Truth)

1. **Edit `lib/config-paths.js`** to change paths:
   ```javascript
   // Example: Renaming trip.json to config.json
   TRIP_CONFIG_FILE: 'config.json',  // Changed from 'trip.json'
   ```

2. **All scripts automatically use the new structure!**
   - `scripts/build/build.js` ✅
   - `scripts/validate.js` ✅
   - `scripts/tools/add-trip.js` ✅
   - `scripts/build/build-smart.js` ✅

3. **Test to verify**:
   ```bash
   npm run validate
   npm run build
   ```

### ❌ WRONG Way (Causes Sync Issues)

❌ Editing paths directly in individual scripts
❌ Hardcoding paths in new scripts
❌ Creating duplicate constants

---

## 🚨 Checklist: When Changing Directory Structure

When you want to reorganize files/directories:

- [ ] **STEP 1**: Update `lib/config-paths.js` with new paths
- [ ] **STEP 2**: Test validation: `npm run validate`
- [ ] **STEP 3**: Test build: `npm run build`
- [ ] **STEP 4**: Test add script: Run `npm run add` (test mode, cancel before saving)
- [ ] **STEP 5**: Check smart build: `npm run build:smart`
- [ ] **STEP 6**: Update README.md if structure changed significantly
- [ ] **STEP 7**: Commit changes with descriptive message

---

## 📚 Scripts That Import config-paths.js

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

## 🔍 How to Add a New Script

When creating a new build/utility script:

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

## 🏗️ Current Directory Structure

```
travelblog/
├── lib/
│   ├── config-paths.js          ⭐ SINGLE SOURCE OF TRUTH
│   ├── build-cache.js           Shared cache management (read/write _cache/)
│   ├── build-utilities.js       Shared build functions (discover, process, generate)
│   ├── generate-html.js         Renders templates → static HTML pages
│   ├── generate-sitemap.js      Builds sitemap.xml
│   ├── generate-trip-files.js   Generates per-trip HTML files
│   ├── seo-metadata.js          Generates <meta> / Open Graph tags
│   ├── css-utilities.js         CSS helpers
│   ├── image-utilities.js       Image dimension helpers
│   ├── slug-utilities.js        URL slug generation
│   └── template-utilities.js   Template rendering helpers
├── templates/
│   ├── base.html                Shared <head>, nav, footer, CSS
│   ├── home-page.html           Homepage
│   ├── trip-intro-page.html     Trip intro with per-trip map
│   └── trip-location-page.html  Individual location/article page
├── scripts/
│   ├── build/
│   │   ├── build.js             Full build (imports config-paths.js)
│   │   ├── build-smart.js       Incremental build (imports config-paths.js)
│   │   └── build-writing.js     Fast content-only rebuild
│   ├── test/
│   │   ├── test-nav.js          Navigation smoke-tests
│   │   ├── test-filter.js       Homepage filter smoke-tests
│   │   ├── test-maps.js         Map page smoke-tests
│   │   ├── test-css-injection.js CSS injection tests
│   │   └── test-caption-detection.js Photo caption detection tests
│   ├── tools/
│   │   ├── add-trip.js          Interactive new-trip scaffolder
│   │   ├── assign-photos.js     Insert photos into markdown
│   │   ├── sync-takeout-photos.js Extract photos from Google Takeout
│   │   ├── analyze-takeout-geo.js Analyze GPS data in Takeout
│   │   └── optimize-images.js   ImageMagick image optimization
│   ├── validate.js              Trip config validation
│   ├── deploy-check.js          Pre-deploy file verification
│   ├── sync-docs.js             Check docs for drift against code
│   ├── test-geocode.js          Quick geocoding test utility
│   └── server.js                Local dev HTTP server
├── config/
│   └── site.json                Site-level config (title, domain, etc.)
├── content/
│   └── trips/
│       └── {tripId}/
│           ├── trip.json        Trip metadata + content array
│           ├── main.md          Trip intro page
│           ├── {location}.md    Location or article pages
│           └── images/          Trip photos
├── _cache/                      Build caches (gitignored)
│   ├── build-cache.json         File mod-time tracking for smart builds
│   └── geocode.json             Cached GPS coordinates from Google Maps
├── trips/                       Generated HTML + JSON (gitignored)
├── map/                         Generated world-map page (gitignored)
├── about/                       Generated about page (gitignored)
└── package.json
```

---

## 💡 Benefits

1. **Consistency**: All scripts use the same paths
2. **Maintainability**: Change paths in one place
3. **Error Prevention**: No more "path out of sync" bugs
4. **Onboarding**: New developers see clear structure
5. **Refactoring**: Reorganize with confidence

---

## 🎓 Examples

### Example 1: Renaming trip.json to metadata.json

**Before**:
```javascript
// lib/config-paths.js
TRIP_CONFIG_FILE: 'trip.json',
```

**After**:
```javascript
// lib/config-paths.js
TRIP_CONFIG_FILE: 'metadata.json',  // ✅ One change here
```

**Result**: All scripts now look for `metadata.json` automatically!

### Example 2: Moving trips to different directory

**Before**:
```javascript
// lib/config-paths.js
TRIPS_DIR: 'content/trips',
```

**After**:
```javascript
// lib/config-paths.js
TRIPS_DIR: 'data/journeys',  // ✅ One change here
```

**Result**: All scripts now use `data/journeys/` automatically!

---

## 🔗 Related Documentation

- [README.md](../README.md) - Main project documentation
- [QUICKSTART.md](reference/QUICKSTART.md) - Getting started guide
- [Smart Build](implementation/SMART_BUILD.md) - Incremental build system
- [Testing Guide](implementation/TESTING_GUIDE.md) - Pre-deploy test checklist

---

**Last Updated**: January 2026
