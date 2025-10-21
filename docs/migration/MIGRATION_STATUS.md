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

## 🚧 Still To Do

### 5. Update Frontend (`index.html`)
- [ ] Change `config.destinations` → `config.trips`
- [ ] Update `destination` terminology → `trip` throughout
- [ ] Change routing: `/destination/` → `/trip/`
- [ ] Update `appRoutes` whitelist: `'destination'` → `'trip'`
- [ ] Update `buildDestinationsMenu()` → `buildTripsMenu()`
- [ ] Update `loadDestination()` → `loadTrip()`
- [ ] Add support for displaying content arrays (location cards vs article cards)
- [ ] Add trip-specific map view (per-trip locations)
- [ ] Update global map to use `trip.mapCenter` coordinates
- [ ] Update navigation state: `view: 'destination'` → `view: 'trip'`

### 6. Update Routing Configuration
- [ ] Update `server.js`: `/destination/*` → `/trip/*` in comments
- [ ] Update `test-routing.html`: test URLs to use `/trip/`

### 7. Update Deployment
- [ ] Update `.github/workflows/deploy.yml` to copy new config structure
- [ ] Ensure `config/` directory gets deployed (or just `config.built.json`)

### 8. Testing
- [ ] Test localhost with new structure
- [ ] Verify trips display correctly
- [ ] Verify trip URLs work: `/trip/greece`, `/trip/utah`, etc.
- [ ] Test map displays trip centers correctly
- [ ] Verify content items display in order
- [ ] Test direct URL access
- [ ] Test browser back/forward

### 9. Cleanup (Optional)
- [ ] Archive old files:
  - `config.json` → `config.json.old`
  - `content/*.md` → (already copied to trips structure)
- [ ] Update `.gitignore` if needed for new structure

## Current Built Output Structure

The new `config.built.json` has this format:

```json
{
  "site": {
    "title": "Two Travel Nuts",
    "description": "..."
  },
  "trips": [
    {
      "id": "greece",
      "title": "Athens and Greek Islands",
      "slug": "greece",
      "published": true,
      "beginDate": "2024-04-01",
      "endDate": "2024-04-14",
      "duration": "13 days",
      "metadata": { ... },
      "coverImage": "images/greece.jpg",
      "thumbnail": "images/greece.jpg",
      "mapCenter": {
        "name": "Paros",
        "coordinates": { "lat": 37.065, "lng": 25.191 }
      },
      "content": [
        {
          "type": "location",
          "title": "Athens and Greek Islands",
          "place": "Paros",
          "coordinates": { "lat": 37.065, "lng": 25.191 },
          "duration": "14 days",
          "contentHtml": "<h1>...</h1>",
          "order": 1
        }
      ],
      "locations": [
        {
          "name": "Athens and Greek Islands",
          "coordinates": { "lat": 37.065, "lng": 25.191 }
        }
      ],
      "relatedTrips": []
    }
  ]
}
```

## Next Step

The frontend (`index.html`) needs significant updates to work with the new trips structure. This is the biggest remaining task.

## Branch Status

Currently on branch: `feature/trips-architecture`

Once frontend is updated and tested, this branch can be merged to `main`.
