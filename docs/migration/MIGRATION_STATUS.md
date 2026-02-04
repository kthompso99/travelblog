# Migration Status: Destinations → Trips

## ✅ Completed

### 1. New Directory Structure
- ✅ Created `config/` directory
- ✅ Created `config/trips/` directory
- ✅ Created `content/trips/` directory

### 2. Migration Script (`migrate-to-trips.js`)
- ✅ Converts old `config.json` → new nested structure
- ✅ Creates `config/site.json`
- ✅ Creates `config/index.json`
- ✅ Creates individual `config/trips/*.json` files
- ✅ Moves content files to `content/trips/*/` structure
- ✅ Adds placeholder dates (2024 with 3-month offsets)
- ✅ Converts destinations to single-location trip format

### 3. Updated Build System (`build.js`)
- ✅ Reads new config structure (`config/site.json`, `config/index.json`, `config/trips/*.json`)
- ✅ Processes content arrays with mixed location/article items
- ✅ Assigns implicit ordering (array position → order number)
- ✅ Geocodes only location-type items
- ✅ Calculates trip duration from beginDate/endDate
- ✅ Resolves mapCenter to coordinates
- ✅ Extracts locations array for mapping
- ✅ Generates new `config.built.json` format

### 4. Migration Executed Successfully
- ✅ Generated config files:
  - `config/site.json`
  - `config/index.json`
  - `config/trips/southernafrica.json`
  - `config/trips/greece.json`
  - `config/trips/utah.json`
  - `config/trips/newzealand.json`
- ✅ Copied content files to new structure
- ✅ Build completed successfully (4 trips, 4 locations, 4 content items)

## ✅ Migration Complete

Items 5–9 above have all been completed. The site is now a fully static-site
generator (SSG): `build.js` reads trip configs, geocodes locations, renders
HTML pages via templates, and outputs a deployable site with no client-side
data loading or routing.

Everything runs on `main`. The `feature/trips-architecture` branch referenced
in the original plan has long since been merged.

For the current file layout and build pipeline, see
[docs/reference/FILES.md](../reference/FILES.md).
