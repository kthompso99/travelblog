# Migration Plan: Destinations → Trips with Nested Config

## Overview

This document describes how to rearchitect the travel blog from a flat "destinations" model to a more flexible "trips" model with nested configuration structure.

## Current Architecture Problems

1. **Terminology Mismatch**: "Destinations" implies single locations, but travel blogs often cover multi-city trips
2. **Flat Structure**: One `config.json` file with everything embedded
3. **Scalability**: As content grows, config.json becomes unwieldy
4. **No Trip Metadata**: Can't store trip dates, duration, tags, etc.
5. **Rigid Structure**: Can't intersperse location-based and non-location content

## Proposed New Architecture

### Key Changes

1. **Rename**: `destinations` → `trips`
2. **Nested Config**: Split config into multiple files
3. **Trip Metadata**: Add rich metadata (dates, duration, tags)
4. **Flexible Content Items**: Mix locations and articles in any order
5. **Better Organization**: Trips organized by year/season
6. **Auto-computed Duration**: Automatically calculate from start/end dates
7. **Place Name Geocoding**: Use place names, build system geocodes automatically
8. **Published Flag**: Option to keep trips private (shareable by URL only)
9. **Per-Trip Maps**: Each trip gets its own map showing the journey
10. **Implicit Ordering**: Content items ordered by array position

### New File Structure

```
travel-blog/
├── config/
│   ├── site.json              # Site-wide settings
│   ├── trips/                 # Individual trip configs
│   │   ├── 2024-greece.json
│   │   ├── 2024-new-zealand.json
│   │   ├── 2023-italy.json
│   │   └── ...
│   └── index.json            # Master list of trips
├── content/
│   ├── trips/
│   │   ├── 2024-greece/
│   │   │   ├── planning.md
│   │   │   ├── athens.md
│   │   │   ├── travel-day.md
│   │   │   ├── santorini.md
│   │   │   └── ...
│   │   ├── 2024-new-zealand/
│   │   │   ├── introduction.md
│   │   │   ├── auckland.md
│   │   │   ├── road-trip.md
│   │   │   └── ...
│   │   └── ...
├── images/
│   ├── 2024-greece/
│   │   ├── cover.jpg
│   │   └── ...
│   └── ...
├── index.html
├── build.js                   # Updated build script
└── package.json
```

## New Data Model

### config/site.json
```json
{
  "title": "Two Travel Nuts",
  "description": "Adventures around the world",
  "author": {
    "name": "Your Name",
    "email": "you@example.com",
    "social": {
      "instagram": "@yourusername"
    }
  },
  "settings": {
    "theme": "light",
    "mapDefaultZoom": 2,
    "mapDefaultCenter": [20, 0]
  }
}
```

### config/index.json
```json
{
  "trips": [
    "2024-greece",
    "2024-new-zealand",
    "2023-italy"
  ]
}
```

### config/trips/2024-greece.json

**Key Concepts:**
- `beginDate` and `endDate` (flat, not nested)
- `content` array with mixed `location` and `article` items
- Order is implicit from array position (first item is order 1, etc.)
- `mapCenter` specifies which location to center the trip map on

```json
{
  "id": "2024-greece",
  "title": "Greek Islands Adventure",
  "slug": "greek-islands-2024",
  "published": true,
  
  "beginDate": "2024-06-15",
  "endDate": "2024-06-28",
  
  "metadata": {
    "season": "summer",
    "year": 2024,
    "tripType": ["beach", "culture", "islands"],
    "budget": "$$",
    "tags": ["greek-islands", "food", "beaches", "history", "sunset"]
  },
  
  "coverImage": "images/2024-greece/cover.jpg",
  "thumbnail": "images/2024-greece/thumb.jpg",
  
  "mapCenter": "Santorini",
  
  "content": [
    {
      "type": "article",
      "title": "Planning Our Greek Adventure",
      "file": "content/trips/2024-greece/planning.md"
    },
    {
      "type": "location",
      "title": "Athens: Ancient Wonders",
      "place": "Acropolis, Athens, Greece",
      "duration": "3 days",
      "file": "content/trips/2024-greece/athens.md"
    },
    {
      "type": "article",
      "title": "Ferry Ride to the Islands",
      "file": "content/trips/2024-greece/ferry.md"
    },
    {
      "type": "location",
      "title": "Santorini: Sunset Paradise",
      "place": "Fira, Santorini, Greece",
      "duration": "5 days",
      "file": "content/trips/2024-greece/santorini.md"
    },
    {
      "type": "location",
      "title": "Mykonos: Beach Bliss",
      "place": "Mykonos Town, Greece",
      "duration": "3 days",
      "file": "content/trips/2024-greece/mykonos.md"
    },
    {
      "type": "article",
      "title": "Greek Food Guide",
      "file": "content/trips/2024-greece/food-guide.md"
    }
  ],
  
  "relatedTrips": []
}
```

**Content Item Fields:**

**All items have:**
- `type`: Either `"location"` or `"article"`
- `title`: Display title
- `file`: Path to markdown file

**Location items additionally have:**
- `place`: Place name for geocoding (e.g., "Acropolis, Athens, Greece")
- `duration`: How long spent there (e.g., "3 days")

**Articles do NOT have:**
- No `place` field
- No `duration` field

### config/trips/2024-new-zealand.json (Complex Multi-Location Example)

```json
{
  "id": "2024-new-zealand",
  "title": "New Zealand: North to South",
  "slug": "new-zealand-2024",
  "published": true,
  
  "beginDate": "2024-11-10",
  "endDate": "2024-11-28",
  
  "metadata": {
    "season": "spring",
    "year": 2024,
    "tripType": ["adventure", "nature", "road-trip"],
    "budget": "$$$",
    "tags": ["hiking", "geothermal", "fjords", "maori-culture", "adventure-sports"]
  },
  
  "coverImage": "images/2024-new-zealand/cover.jpg",
  "thumbnail": "images/2024-new-zealand/thumb.jpg",
  
  "mapCenter": "Queenstown",
  
  "content": [
    {
      "type": "article",
      "title": "Why New Zealand?",
      "file": "content/trips/2024-new-zealand/introduction.md"
    },
    {
      "type": "location",
      "title": "Auckland: City of Sails",
      "place": "Sky Tower, Auckland, New Zealand",
      "duration": "3 days",
      "file": "content/trips/2024-new-zealand/auckland.md"
    },
    {
      "type": "location",
      "title": "Rotorua: Geothermal Wonderland",
      "place": "Te Puia, Rotorua, New Zealand",
      "duration": "2 days",
      "file": "content/trips/2024-new-zealand/rotorua.md"
    },
    {
      "type": "article",
      "title": "Road Trip: North Island Highlights",
      "file": "content/trips/2024-new-zealand/north-island-drive.md"
    },
    {
      "type": "location",
      "title": "Wellington: Culture & Coffee",
      "place": "Te Papa Museum, Wellington, New Zealand",
      "duration": "2 days",
      "file": "content/trips/2024-new-zealand/wellington.md"
    },
    {
      "type": "article",
      "title": "Ferry to South Island",
      "file": "content/trips/2024-new-zealand/ferry-crossing.md"
    },
    {
      "type": "location",
      "title": "Queenstown: Adventure Capital",
      "place": "Queenstown, New Zealand",
      "duration": "5 days",
      "file": "content/trips/2024-new-zealand/queenstown.md"
    },
    {
      "type": "article",
      "title": "Bungee Jumping Experience",
      "file": "content/trips/2024-new-zealand/bungee.md"
    },
    {
      "type": "location",
      "title": "Milford Sound: Nature's Cathedral",
      "place": "Milford Sound, New Zealand",
      "duration": "1 day",
      "file": "content/trips/2024-new-zealand/milford-sound.md"
    },
    {
      "type": "article",
      "title": "Travel Tips for New Zealand",
      "file": "content/trips/2024-new-zealand/tips.md"
    }
  ],
  
  "relatedTrips": []
}
```

### Example: Ongoing Trip
```json
{
  "id": "2025-world-tour",
  "title": "Around the World 2025",
  "slug": "world-tour-2025",
  "published": false,
  
  "beginDate": "2025-01-01",
  "endDate": null,
  
  "metadata": {
    "year": 2025,
    "tripType": ["long-term", "backpacking"],
    "tags": ["ongoing"]
  },
  
  "mapCenter": "Bangkok",
  
  "content": [
    {
      "type": "location",
      "title": "Bangkok: Starting Point",
      "place": "Grand Palace, Bangkok, Thailand",
      "duration": "5 days",
      "file": "content/trips/2025-world-tour/bangkok.md"
    }
  ],
  
  "relatedTrips": []
}
```

### Example: Article-Heavy Trip (Conference/Event)
```json
{
  "id": "2024-web-summit",
  "title": "Web Summit Lisbon 2024",
  "slug": "web-summit-lisbon-2024",
  "published": true,
  
  "beginDate": "2024-11-13",
  "endDate": "2024-11-16",
  
  "metadata": {
    "year": 2024,
    "tripType": ["conference", "city"],
    "tags": ["tech", "networking", "lisbon"]
  },
  
  "mapCenter": "Lisbon",
  
  "content": [
    {
      "type": "location",
      "title": "Lisbon",
      "place": "Lisbon, Portugal",
      "duration": "4 days",
      "file": "content/trips/2024-web-summit/lisbon.md"
    },
    {
      "type": "article",
      "title": "Day 1: Opening Keynotes",
      "file": "content/trips/2024-web-summit/day1.md"
    },
    {
      "type": "article",
      "title": "Day 2: AI & Future Tech",
      "file": "content/trips/2024-web-summit/day2.md"
    },
    {
      "type": "article",
      "title": "Day 3: Networking & Parties",
      "file": "content/trips/2024-web-summit/day3.md"
    },
    {
      "type": "article",
      "title": "Exploring Lisbon After Hours",
      "file": "content/trips/2024-web-summit/exploring.md"
    }
  ],
  
  "relatedTrips": []
}
```

## How the Build System Works

### Processing Content Items

The build system:

1. **Reads trip config** from `config/trips/*.json`
2. **Assigns implicit order** based on array position:
   - First item in array = order 1
   - Second item = order 2
   - etc.
3. **Processes each content item:**
   - **For locations:**
     - Geocodes the `place` field → coordinates
     - Converts markdown file → HTML
     - Stores: title, place, coordinates, duration, contentHtml, order
   - **For articles:**
     - Converts markdown file → HTML
     - Stores: title, contentHtml, order
4. **Calculates trip duration** from beginDate/endDate
5. **Extracts locations for mapping:**
   - Filters only `type: "location"` items
   - Uses for creating trip-specific map
6. **Determines map center:**
   - Finds location matching `mapCenter` field
   - Uses its coordinates as center for trip map

### Built Structure

```json
{
  "site": { ... },
  "trips": [
    {
      "id": "2024-greece",
      "title": "Greek Islands Adventure",
      "published": true,
      "slug": "greek-islands-2024",
      
      "beginDate": "2024-06-15",
      "endDate": "2024-06-28",
      "duration": "13 days",
      
      "metadata": { ... },
      
      "coverImage": "images/2024-greece/cover.jpg",
      "thumbnail": "images/2024-greece/thumb.jpg",
      
      "mapCenter": {
        "name": "Santorini",
        "coordinates": { "lat": 36.3932, "lng": 25.4615 }
      },
      
      "content": [
        {
          "type": "article",
          "title": "Planning Our Greek Adventure",
          "contentHtml": "<h1>Planning...</h1>",
          "order": 1
        },
        {
          "type": "location",
          "title": "Athens: Ancient Wonders",
          "place": "Acropolis, Athens, Greece",
          "coordinates": { "lat": 37.9715, "lng": 23.7267 },
          "duration": "3 days",
          "contentHtml": "<h1>Athens</h1>...",
          "order": 2
        },
        {
          "type": "article",
          "title": "Ferry Ride to the Islands",
          "contentHtml": "<h1>Ferry...</h1>",
          "order": 3
        },
        {
          "type": "location",
          "title": "Santorini: Sunset Paradise",
          "place": "Fira, Santorini, Greece",
          "coordinates": { "lat": 36.3932, "lng": 25.4615 },
          "duration": "5 days",
          "contentHtml": "<h1>Santorini</h1>...",
          "order": 4
        }
      ],
      
      "locations": [
        {
          "name": "Athens: Ancient Wonders",
          "coordinates": { "lat": 37.9715, "lng": 23.7267 }
        },
        {
          "name": "Santorini: Sunset Paradise",
          "coordinates": { "lat": 36.3932, "lng": 25.4615 }
        },
        {
          "name": "Mykonos: Beach Bliss",
          "coordinates": { "lat": 37.4467, "lng": 25.3289 }
        }
      ],
      
      "relatedTrips": []
    }
  ]
}
```

Note the built structure includes:
- `locations` array: Just the locations (for mapping) extracted from content
- `content` array: All items (locations + articles) in order with HTML
- `duration`: Auto-calculated
- `mapCenter`: Resolved to coordinates
- `order`: Added to each content item (1, 2, 3, ...)

## Frontend Display

### Trip Page Layout

When viewing a trip, the page shows:

1. **Header**:
   - Title
   - Dates and duration
   - Cover image

2. **Trip Map** (trip-specific):
   - Shows only locations from THIS trip
   - Centered on `mapCenter` location
   - Markers numbered 1, 2, 3 (by order)
   - Lines connecting locations to show route

3. **Content Timeline**:
   - Displayed in order
   - **Location cards** show:
     - Title
     - Duration
     - Place name
     - Content (HTML)
     - Map marker number
   - **Article cards** show:
     - Title
     - Content (HTML)
     - No location info

4. **Sidebar/Footer**:
   - Trip metadata (tags, budget, etc.)
   - Related trips links
   - Share button

### Global Map

The main homepage map:
- Shows ALL locations from ALL published trips
- One marker per trip (uses `mapCenter` coordinate)
- Click marker → go to that trip

### Trip List View

Options to view trips:
- **Timeline**: Chronological order
- **Map**: All trip centers plotted
- **Grid**: Cards with thumbnails
- **Filter by**: Year, continent, tags, etc.

## Migration Steps

### Phase 1: Update Data Structure

1. **Create new config structure**:
   - Split `config.json` → `config/site.json`, `config/index.json`, `config/trips/*.json`
   - Change date structure: nested dates → `beginDate`/`endDate`
   - Restructure content: flat list → content array with types

2. **Migration script**:
   - Converts old destinations to new trip format
   - Each destination becomes one location item in content array
   - Adds default article items if needed
   - Sets `mapCenter` to first location

### Phase 2: Update Build System

1. **Update build.js**:
   - Read new config structure
   - Process content array maintaining order
   - Geocode location items only
   - Calculate duration from beginDate/endDate
   - Resolve mapCenter to coordinates
   - Extract locations array for mapping
   - Add implicit order numbers (1, 2, 3...)
   - Generate new built structure

### Phase 3: Update Frontend

1. **Trip display page**:
   - Render content items in order
   - Different card styles for locations vs articles
   - Show trip-specific map with route
   - Number location markers by order

2. **Homepage map**:
   - Plot one marker per trip (at mapCenter)
   - Filter to published trips only

3. **Navigation & filtering**:
   - Update for new trip structure
   - Support content type filtering

### Phase 4: CLI Tools

1. **create-trip.js**:
   - Prompts for basic metadata
   - Asks for content items one by one
   - "Add location or article?"
   - Builds content array in order
   - Asks which location for map center

2. **add-content.js**:
   ```bash
   npm run add-content 2024-greece
   ? Type: location
   ? Title: Delphi Day Trip
   ? Place: Delphi Archaeological Site, Greece
   ? Duration: 1 day
   ? Insert after which item? (Athens)
   ✅ Added to content array
   ```

3. **reorder-content.js**:
   - Shows current order
   - Allows drag-and-drop style reordering
   - Updates JSON file

## Key Benefits

1. **Flexible Content Structure**:
   - Mix locations and articles freely
   - Tell story in natural order
   - Not forced into location-only format

2. **Trip-Specific Maps**:
   - Each trip shows its own journey
   - Clear route visualization
   - Numbered markers showing progression

3. **Implicit Ordering**:
   - No manual order numbers needed
   - Just arrange array
   - Order derived from position

4. **Simple Date Format**:
   - Flat `beginDate`/`endDate`
   - No nested structure to navigate
   - Duration auto-calculated

5. **Story-Driven**:
   - Can intersperse travel days, reflections, tips
   - Not just a list of places
   - Reads like a blog narrative

## Example Use Cases

### Use Case 1: Road Trip
```
1. Article: "Planning the Route"
2. Location: "Starting City"
3. Article: "Day 1 Drive"
4. Location: "Midpoint City"
5. Article: "Day 2 Drive"
6. Location: "Final Destination"
7. Article: "Lessons Learned"
```

### Use Case 2: Island Hopping
```
1. Location: "Main Island"
2. Article: "Boat Ride Between Islands"
3. Location: "Second Island"
4. Article: "Ferry Adventure"
5. Location: "Third Island"
```

### Use Case 3: Conference Trip
```
1. Location: "City Name"
2. Article: "Conference Day 1"
3. Article: "Conference Day 2"
4. Article: "Exploring the City"
5. Article: "Local Food Guide"
```

### Use Case 4: Multi-Country Journey
```
1. Article: "Why This Route?"
2. Location: "Country 1: Capital"
3. Location: "Country 1: Second City"
4. Article: "Border Crossing Adventure"
5. Location: "Country 2: First Stop"
6. Article: "Culture Shock Moments"
7. Location: "Country 2: Final City"
```

## Implementation Notes

### For Build System

- **Order assignment**: Simply use array index (0-based → 1-based)
  - `content[0]` → order 1
  - `content[1]` → order 2
  - etc.

- **Location extraction**: Filter content items where `type === "location"`

- **Map center resolution**:
  ```
  1. Find content item where title matches mapCenter string
  2. Must be type "location"
  3. Use its geocoded coordinates
  4. If not found, use first location's coordinates
  ```

- **Geocoding**: Only geocode items with `type: "location"`

### For Frontend

- **Rendering content**:
  ```
  for each item in content:
    if item.type === "location":
      render LocationCard
    else if item.type === "article":
      render ArticleCard
  ```

- **Trip map**:
  ```
  1. Filter locations from content
  2. Plot each with numbered marker (by order)
  3. Draw polyline connecting them
  4. Center on mapCenter coordinates
  ```

- **Global map**:
  ```
  for each trip:
    plot one marker at trip.mapCenter coordinates
  ```

## Testing Checklist

- [ ] Content items maintain order
- [ ] Locations geocoded correctly
- [ ] Articles don't get geocoded
- [ ] Trip map shows only that trip's locations
- [ ] Map markers numbered correctly
- [ ] Route lines connect locations
- [ ] mapCenter resolves to correct coordinates
- [ ] Article cards display without location info
- [ ] Location cards show place and duration
- [ ] Order numbers assigned implicitly (no manual entry)
- [ ] Duration calculated from beginDate/endDate
- [ ] Ongoing trips (endDate: null) work
- [ ] Published/unpublished flag respected

## Design Decisions Summary

✅ **Flat date structure**: `beginDate` and `endDate` (not nested)

✅ **Content array with types**: Mix locations and articles

✅ **Implicit ordering**: Array position = order (auto-assigned)

✅ **Two map types**: Global (all trips) and per-trip (one journey)

✅ **mapCenter field**: Which location to center trip map on

✅ **Location items**: Have place, duration, and file

✅ **Article items**: Have title and file only

✅ **Build-time processing**: Geocoding and order assignment happen in build

✅ **Order is preserved**: Content array order = display order

## Notes for VS Code Claude

This architecture allows maximum flexibility in storytelling while maintaining structured location data for mapping. The key insight is that not all content needs to be location-based, but locations need to be specially handled for geocoding and mapping.

The implicit ordering (array position) makes the config files cleaner and easier to maintain. Adding/removing/reordering content is just array manipulation.

Current working code is in the artifacts from the conversation. This is a major rearchitecture that enables much richer travel narratives.