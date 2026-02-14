# Smart Build System

The smart build system detects which files have changed and skips rebuilding when nothing has changed, saving significant time especially as your site grows to 30-40 trips.

## Quick Start

```bash
# Use smart build instead of regular build
npm run build:smart

# Force rebuild everything
npm run build:smart -- --force
```

## How It Works

The smart build system tracks modification times of all source files and only rebuilds when something changes.

### What It Tracks

1. **Core Build Files**
   - `scripts/build/build.js` - Main build script
   - `lib/*.js` - All library files (SEO, HTML generation, sitemap)
   - `config/site.json` - Site configuration
   - `content/index.json` - List of trips
   - `templates/*.html` - All HTML templates

2. **Per-Trip Files**
   - `content/trips/{tripId}/trip.json` - Trip configuration
   - `content/trips/{tripId}/*.md` - All markdown files

### Build Logic

```
Run smart build
    ↓
Load .build-cache.json
    ↓
Check if core files changed
    ├─ YES → Full rebuild (templates/libs changed)
    └─ NO → Check trips
           ↓
       Check which trips changed
           ├─ None → Skip build! ✅
           └─ Some → Rebuild changed trips
```

## Current Status

### ✅ Implemented
- Change detection for all files
- Skip builds when nothing changed
- **Per-trip incremental rebuild** — only changed trips are geocoded and rendered
- Shared pages (homepage, world map, sitemap) always regenerate
- Force rebuild option (`--force`)
- Per-trip rebuild from CLI (`npm run build:smart -- greece`)
- Build cache tracking

## Usage Examples

### Normal Workflow

```bash
# First build - creates cache
npm run build:smart
# Output: Full build (first time)

# Run again without changes
npm run build:smart
# Output: ✅ No changes detected - nothing to build!

# Edit Greece content
nano content/trips/greece/milos.md

# Build again — only greece is rebuilt
npm run build:smart
# Output: 📝 1 trip(s) changed: greece
#         🏗️  Building trip: greece
#         ✅ Rebuilding shared pages

# Rebuild a specific trip regardless of cache
npm run build:smart -- greece
```

### Force Rebuild

```bash
# Ignore cache, rebuild everything
npm run build:smart -- --force
```

### When to Use Each Build

**Use `npm run build:smart`:**
- During development
- When making small content changes
- Default workflow

**Use `npm run build` (regular):**
- First deployment
- If build cache gets corrupted
- If you want to be absolutely sure everything rebuilds

## Build Cache

The build system uses `.build-cache.json` to track file modification times.

### Cache File Location
```
.build-cache.json  # In project root
```

### Cache Format
```json
{
  "version": "1.0",
  "lastFullBuild": 1761079617794,
  "files": {
    "build.js": 1761066432255,
    "templates/base.html": 1761078627138,
    ...
  },
  "trips": {
    "greece": {
      "configModTime": 1761018048441,
      "contentModTime": 1761018455853,
      "lastBuilt": 1761079617794
    },
    ...
  }
}
```

### Cache Management

**Auto-created**: First time you run `npm run build:smart`

**Auto-updated**: After every build

**Ignored by git**: Listed in `.gitignore`

**Clear cache**:
```bash
rm .build-cache.json
```

## Performance

### With 4 Trips (Current)

| Scenario | Regular Build | Smart Build | Time Saved |
|----------|---------------|-------------|------------|
| No changes | ~12 seconds | ~0.1 seconds | **~12 seconds** |
| 1 trip changed | ~12 seconds | ~3 seconds | **~9 seconds** |
| Template changed | ~12 seconds | ~12 seconds | 0 seconds |

### With 40 Trips (Projected)

| Scenario | Regular Build | Smart Build | Time Saved |
|----------|---------------|-------------|------------|
| No changes | ~120 seconds | ~0.1 seconds | **~120 seconds** |
| 1 trip changed | ~120 seconds | ~3 seconds | **~117 seconds** |
| Template changed | ~120 seconds | ~120 seconds | 0 seconds |

Estimated times based on geocoding (1 req/sec) + processing.

## Triggering Rebuilds

### Full Rebuild Triggers

These changes force a complete rebuild:

- ✅ Any template file (`templates/*.html`)
- ✅ Any library file (`lib/*.js`)
- ✅ Build script (`build.js`)
- ✅ Site config (`config/site.json`)
- ✅ Trip index (`content/index.json`)

### Trip-Specific Triggers

These detect changes to individual trips:

- ✅ Trip config (`content/trips/greece/trip.json`)
- ✅ Trip content (`content/trips/greece/*.md`)

### No Rebuild Needed

These don't trigger rebuilds:

- ❌ Image files (images already referenced)
- ❌ Documentation (doesn't affect output)
- ❌ Generated files (`trips/*.json`, `trips/*/index.html`)

## Development Workflow

### Day-to-Day: `npm run dev`

The fastest loop for content editing:

```bash
# Smart build + local server in one command
npm run dev
```

### Editing Content

```bash
# 1. Make content changes
nano content/trips/greece/milos.md

# 2. Quick build (detects only greece changed)
npm run build:smart

# 3. Test locally
npm run serve

# 4. Commit when satisfied
git add content/trips/greece/
git commit -m "Update Greece trip content"
```

### Editing Styles

```bash
# 1. Edit template
nano templates/base.html

# 2. Full rebuild (template changed)
npm run build:smart
# Automatically detects template change

# 3. Test all pages
npm run serve

# 4. Commit
git add templates/base.html
git commit -m "Update site styles"
```

## Troubleshooting

### Build cache seems wrong

**Solution**: Delete cache and rebuild
```bash
rm .build-cache.json
npm run build:smart
```

### Always doing full builds

**Check**:
1. Are you editing template files? (Forces full rebuild)
2. Check `.build-cache.json` exists and is valid JSON
3. Try force rebuild: `npm run build:smart -- --force`

### Changes not detected

**Check**:
1. Did you save the file?
2. Is file in correct location?
3. Check file modification time: `ls -l content/trips/greece/greece.md`
4. Try: `touch content/trips/greece/greece.md` to update mod time

## Future Enhancements

### Phase 1: Smart Detection (✅ Done)
- Detect file changes
- Skip builds when nothing changed
- Track per-trip modifications

### Phase 2: Incremental Trips (✅ Done)
- Rebuild only changed trips
- Regenerate homepage/sitemap
- Skip unchanged trips entirely
- Per-trip CLI: `npm run build:smart -- greece`

### Phase 3: Parallel Builds (🔮 Future)
- Build multiple trips in parallel
- Faster overall build times
- Better CPU utilization

## Summary

✅ **Smart build skips unchanged trips entirely**
✅ **Per-trip incremental rebuild is live**
✅ **Safe to use — falls back to full build when needed**

**Recommendation**: Use `npm run dev` for day-to-day work (smart build + serve).
Use `npm run build:smart` when you just want to rebuild without starting a server.

---

**See also**:
- [Main Build Documentation](../reference/FILES.md)
- [Testing Guide](TESTING_GUIDE.md)
