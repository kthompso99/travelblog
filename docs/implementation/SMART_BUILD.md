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
   - `build.js` - Main build script
   - `lib/*.js` - All library files (SEO, HTML generation, sitemap)
   - `config/site.json` - Site configuration
   - `config/index.json` - List of trips
   - `templates/*.html` - All HTML templates

2. **Per-Trip Files**
   - `config/trips/{tripId}.json` - Trip configuration
   - `content/trips/{tripId}/` - All markdown files

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
- Force rebuild option
- Build cache tracking

### ⚠️ Partially Implemented
- Detects which trips changed
- Currently does full rebuild when any trip changes
- **Future**: Will rebuild only changed trips

### 🔮 Future Optimization
When a single trip changes:
1. Rebuild only that trip's JSON file
2. Rebuild only that trip's HTML file
3. Regenerate homepage (quick)
4. Regenerate sitemap (quick)

**Time savings**: ~2 seconds per unchanged trip × 39 trips = ~78 seconds saved!

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
nano content/trips/greece/greece.md

# Build again
npm run build:smart
# Output: 📝 1 trip(s) changed: greece
#         Running full build (for now)
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
| 1 trip changed | ~12 seconds | ~12 seconds | 0 seconds* |
| Template changed | ~12 seconds | ~12 seconds | 0 seconds |

\* Currently does full rebuild when any trip changes

### With 40 Trips (Future)

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
- ✅ Trip index (`config/index.json`)

### Trip-Specific Triggers

These detect changes to individual trips:

- ✅ Trip config (`config/trips/greece.json`)
- ✅ Trip content (`content/trips/greece/*.md`)

### No Rebuild Needed

These don't trigger rebuilds:

- ❌ Image files (images already referenced)
- ❌ Documentation (doesn't affect output)
- ❌ Generated files (`trips/*.json`, `trips/*/index.html`)

## Development Workflow

### Editing Content

```bash
# 1. Make content changes
nano content/trips/greece/greece.md

# 2. Quick build (detects changes)
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

### Phase 2: Incremental Trips (🚧 In Progress)
- Rebuild only changed trips
- Regenerate homepage/sitemap
- Skip unchanged trips entirely

### Phase 3: Parallel Builds (🔮 Future)
- Build multiple trips in parallel
- Faster overall build times
- Better CPU utilization

### Phase 4: Watch Mode (🔮 Future)
- Auto-rebuild on file save
- Live reload in browser
- Developer experience improvement

## Summary

✅ **Smart build system saves time by skipping unnecessary work**
✅ **Currently detects all changes correctly**
⚠️ **Full incremental rebuild coming in future update**
✅ **Safe to use - falls back to full build when needed**

**Recommendation**: Use `npm run build:smart` as your default build command!

---

**See also**:
- [Main Build Documentation](../reference/FILES.md)
- [Testing Guide](TESTING_GUIDE.md)
