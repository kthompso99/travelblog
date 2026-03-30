# SEO Specification: Seville Guide (Location Page Example)

This document explains the JSON-LD implementation for Seville as a location page within the Southern Spain trip.

## Key Structural Decisions

### Dual-Entity Model (Critical)
Location pages use **two linked entities** in the @graph:

1. **BlogPosting** (#article) - **Document layer**
   - WHO wrote it: `author` → Kevin Thompson
   - WHEN: `datePublished`, `dateModified`
   - FOR WHOM: `publisher` → Two Travel Nuts
   - ABOUT WHAT: `mainEntity` → #destination
   - **Purpose**: Content provenance for E-E-A-T

2. **TouristDestination** (#destination) - **Entity layer**
   - WHAT it is: Place attributes
   - WHERE: `includesAttraction` with geo coordinates
   - FOR WHOM: `touristType` arrays
   - **Purpose**: Travel-specific rich results

**Why both:** TouristDestination doesn't support author/datePublished properties. BlogPosting provides content provenance while TouristDestination provides place-specific schema.

### Other Key Features

3. **Knowledge graph linking**: Uses `isPartOf` to connect this location to parent trip itinerary
4. **Attraction entities (fully normalized)**: All 5 attractions extracted as top-level @graph entities with unique @id values
   - **@id naming:** `#attraction-{kebab-case-slug}` (e.g., `#attraction-royal-alcazar`, `#attraction-la-casa-del-flamenco`)
   - **Properties:** name, description, **url (REQUIRED)**, geo coordinates, Schema.org type, sameAs array
   - **CRITICAL: url requirement** - All normalized attraction entities MUST include a `url` property (official website preferred, Wikipedia URL as fallback). This is non-negotiable for entity disambiguation.
   - **Graph order:** Defined after images, before BlogPosting (so they exist when referenced)
   - **TouristDestination.includesAttraction:** Array of @id references (no inline definitions)
   - **Benefits:** Enables attraction reuse across pages, tight review linking via @id, consistent with images/reviews architecture
5. **Multiple reviews with explicit connectivity**: Separate Review entities for hotel + "Don't Miss" attractions
   - Each Review has unique `@id` using fully-qualified URLs (e.g., `https://twotravelnuts.com/trips/spain/seville.html#review-hotel-unuk`)
   - **CRITICAL: Temporal alignment** - All Review.datePublished values MUST match BlogPosting.datePublished exactly for clean freshness signals
   - Both BlogPosting and TouristDestination link to reviews via `review` property
   - Creates explicit semantic relationship: "this guide contains these reviews"
   - **itemReviewed patterns:**
     - **Attractions (normalized):** Reference via @id to top-level attraction entity (e.g., flamenco review → `#attraction-la-casa-del-flamenco`)
     - **Hotels (inline):** Define inline with url for disambiguation (hotels rarely appear in multiple contexts)
   - Completes E-E-A-T signal cluster: BlogPosting → Reviews → Author → itemReviewed (@id or disambiguated inline)
6. **Geo coordinates**: All attractions include precise lat/long for "near me" searches
7. **Type specificity**: Cathedral uses `CatholicChurch` not generic `TouristAttraction`
8. **Dual identifiers**: Both Wikipedia URLs and Wikidata IDs in `sameAs` arrays
9. **All images as top-level @graph entities**: Hero and gallery images defined once with unique @id values
   - **Hero image:** `@id: #image-hero` with `representativeOfPage: true`
   - **Gallery images:** Descriptive @id values (`#image-alcazar-pond`, `#image-peacock`)
   - **All include:** `url`, `contentUrl`, `name` (descriptive title), `caption` (from markdown alt-text)
   - **Hero referenced from 3 places:** BlogPosting.image, BlogPosting.primaryImageOfPage, TouristDestination.image[0]
   - **TouristDestination.image:** Array of @id references (no inline definitions)
   - **Benefits:** Enables image reuse across pages, tighter graph cohesion, eliminates duplication

## Architecture

### @graph Pattern
The `@graph` array links WebSite, Organization, Person, BreadcrumbList, TouristDestination, and Review entities into a cohesive knowledge graph.

### Audience Targeting (`touristType`)
* **Values**: `["Luxury Travelers", "Mature Travelers", "Culture Seekers"]`
* **Strategy**: Codifies target audience for Google's travel intent filters
* **Consistency note**: Free-form vocabulary (not standardized) - must use exact same terms across all pages to avoid synonym drift (e.g., don't mix "Culture Seekers" with "Cultural Travelers")

### Entity Disambiguation (`sameAs`)
* **Implementation**: Uses **both** Wikipedia URLs and Wikidata IDs
* **Strategy**: Wikipedia for human verification, Wikidata for non-ambiguous Knowledge Graph anchoring

### Experience Signals (Multiple Reviews)
* **Hotel review**: Extracted from "Where We Stayed" section, rated 3.5/5 from nutshell verdict
* **Attraction review**: La Casa del Flamenco rated 5.0/5 from "Don't Miss" recommendation
* **Strategy**: Transparent feedback (including negatives) signals human experience vs AI content

### Geographic Precision
* **All attractions** include GeoCoordinates (latitude/longitude)
* **Benefit**: Enables "near me" searches, Google Maps integration, local discovery features

### Type Specificity
* **Seville Cathedral**: `CatholicChurch` (not generic LandmarksOrHistoricalBuildings)
* **La Casa del Flamenco**: `["MusicVenue", "TouristAttraction"]` (multi-type array)
* **Strategy**: Most specific types improve semantic understanding

### Knowledge Graph Connections
* **isPartOf**: Links this location to parent trip (`https://twotravelnuts.com/trips/spain/#itinerary`)
* **BreadcrumbList**: Shows navigation hierarchy (Home → Southern Spain → Seville)
* **Benefit**: Creates connected entity graph from landmark → location → trip → site

## Implementation Notes

* **Fully normalized entity architecture:** Images, attractions, and reviews all extracted as top-level @graph entities with unique @id values
* **Attraction normalization:** All 5 attractions defined once as top-level entities, referenced via @id from includesAttraction array and Review.itemReviewed
  - @id naming: `#attraction-{kebab-case-slug}`
  - Graph order: Images → Attractions → BlogPosting → TouristDestination → Reviews
  - Benefits: Single source of truth, tight entity linkage, enables cross-page references
* TouristDestination.image array references images via @id (no inline definitions)
* TouristDestination.includesAttraction array references attractions via @id (no inline definitions)
* containedInPlace establishes geographic hierarchy (Seville → Spain) using `@type: "Country"` with Wikidata ID (Q29) for entity disambiguation
* TouristDestination includes city-center GeoCoordinates (37.3891, -5.9845) for broad location queries
* Individual attractions have their own specific coordinates for precision
* **CRITICAL:** All attractions MUST include `url` property (official website where available, otherwise Wikipedia URL from sameAs) - this is required for entity disambiguation
* Review entities are top-level @graph nodes with fully-qualified @id URLs for explicit linking
* Both BlogPosting and TouristDestination reference reviews via `review` property (dual context)
* Reviews use two itemReviewed patterns:
  - **Attractions (normalized):** Reference via @id to attraction entity (e.g., `{ "@id": "...#attraction-la-casa-del-flamenco" }`)
  - **Hotels (inline):** Define inline with url for disambiguation (rarely reused)
* All @id values use fully-qualified URLs (not fragment-only) for global scope and consistent entity identity across pages
* WebSite and BlogPosting entities include `inLanguage: "en-US"` for language clarity and consistency across top-level entities
* All `sameAs` properties use arrays even with single values (e.g., Country sameAs has one Wikidata ID but uses array format) for consistent data structure and future extensibility
