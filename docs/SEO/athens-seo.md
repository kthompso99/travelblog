# SEO Specification: Athens Guide (Location Page Example)

This document explains the JSON-LD implementation for Athens as a location page within the Greece trip.

## Purpose

Serves as a parallel example to Seville, demonstrating how the same schema pattern applies to different destinations. Athens showcases museum-heavy attractions while Seville emphasized architectural landmarks and cultural experiences.

## Key Structural Elements

### Dual-Entity Model
Like Seville, Athens uses **two linked entities**:

1. **BlogPosting** (#article)
   - author, datePublished, dateModified, publisher
   - mainEntity points to TouristDestination
   - Provides content provenance (E-E-A-T)

2. **TouristDestination** (#destination)
   - Place attributes, attractions, touristType
   - mainEntityOfPage points to canonical URL
   - Provides travel-specific rich results

### TouristDestination Details
* Name: "Athens"
* mainEntityOfPage: Canonical URL for Athens location page
* isPartOf: Links to Greece trip itinerary (`#itinerary` reference)
* touristType: `["Luxury Travelers", "Mature Travelers", "History Enthusiasts"]`
  - Uses "History Enthusiasts" (not "Culture Seekers") to match destination's focus on ancient ruins/museums
  - Maintains consistency with Seville's "Luxury Travelers", "Mature Travelers" (shared across both)
* sameAs: Both Wikipedia URL and Wikidata ID (Q1524)

### Attraction Entities (Fully Normalized)
All 4 attractions extracted as top-level @graph entities:

1. **Acropolis of Athens** (`#attraction-acropolis`): `TouristAttraction` type (archaeological site - no more specific type)
2. **Acropolis Museum** (`#attraction-acropolis-museum`): `Museum` type (specific type preferred)
3. **Ancient Agora** (`#attraction-ancient-agora`): `TouristAttraction` type (ancient marketplace)
4. **National Archaeological Museum** (`#attraction-national-archaeological-museum`): `Museum` type

**Normalization pattern:**
* **@id naming:** `#attraction-{kebab-case-slug}` for each attraction
* **Properties:** name, description, **url (REQUIRED)**, geo coordinates, Schema.org type, sameAs array
* **CRITICAL: url requirement** - All normalized attraction entities MUST include a `url` property (official website preferred, Wikipedia URL as fallback). This is non-negotiable for entity disambiguation.
* **TouristDestination.includesAttraction:** Array of @id references (no inline definitions)
* **Review.itemReviewed:** References attraction entity via @id (e.g., Acropolis Museum review → `#attraction-acropolis-museum`)
* **Benefits:** Single source of truth, tight entity linkage, consistent with images/reviews architecture

### Geographic Precision
**TouristDestination (city level):**
* GeoCoordinates for Athens city center (37.9755, 23.7348) - Syntagma Square area
* Provides location context for broad "Athens travel" queries

**Individual attractions (top-level entities):**
* All four attractions include precise GeoCoordinates
* Both Wikipedia URLs and Wikidata IDs in sameAs arrays
* **CRITICAL:** All attractions MUST include `url` property (Wikipedia URLs from sameAs for entity disambiguation) - required for entity identity
* Detailed descriptions explaining their significance

### Enhanced Image Metadata
All images (hero + gallery) are top-level @graph entities with unique @id values:
* **Hero image:** `@id: #image-hero` with `representativeOfPage: true`
* **Gallery images:** Descriptive @id values (`#image-caryatids`, `#image-areopagus-view`)
* **All include:** `url`, `contentUrl`, `name` (descriptive title), `caption` (from markdown alt-text)
* **Hero referenced from 3 places:** BlogPosting.image, BlogPosting.primaryImageOfPage, TouristDestination.image[0]
* **TouristDestination.image:** Array of @id references (no inline ImageObject definitions)
* **Benefits:** Enables image reuse across pages, tighter graph cohesion, single source of truth

### Multiple Review Entities with Connectivity

**CRITICAL: Temporal alignment** - All Review.datePublished values MUST match BlogPosting.datePublished exactly for clean freshness signals.

**Hotel Review:**
* @id: `https://twotravelnuts.com/trips/greece/athens.html#review-hotel-grande-bretagne`
* itemReviewed: `Hotel` type ("Hotel Grande Bretagne")
  - Includes official website url + Wikipedia/Wikidata sameAs for disambiguation
  - Hotel Grande Bretagne is a historic Athens landmark with Wikipedia entry (Q1630716)
* reviewRating: 5.0/5 (from "Would Plan Around" nutshell verdict)
* reviewBody: Positive feedback highlighting service, location, breakfast
* Linked from both BlogPosting and TouristDestination via `review` property

**Attraction Review:**
* @id: `https://twotravelnuts.com/trips/greece/athens.html#review-acropolis-museum`
* **itemReviewed references attraction @id:** `{ "@id": "...#attraction-acropolis-museum" }`
  - Points to top-level attraction entity (single source of truth)
  - Attraction entity includes all properties: Museum type, description, url, geo, sameAs
* reviewRating: 5.0/5 (from "Don't Miss" recommendation)
* reviewBody: Specific recommendation about top floor glass walls with Acropolis views
* Linked from both BlogPosting and TouristDestination via `review` property

**Why explicit linking via @id:** Creates closed E-E-A-T signal loop (BlogPosting → Reviews → Author → itemReviewed[@id] → Attraction Entity → Knowledge Graph) with precise entity identity resolution. Eliminates duplication - attraction defined once, referenced everywhere. All @id values use fully-qualified URLs (not fragment-only) for global scope and cross-page consistency.

## Comparison: Athens vs Seville

| Element | Athens | Seville |
|---------|--------|---------|
| **Primary attraction types** | Museum-heavy (2 of 4) | Church/palace/cultural venues |
| **Hotel rating** | 5.0 (Would Plan Around) | 3.5 (Worth It) |
| **Attraction reviews** | Museum (Acropolis Museum) | Music venue (La Casa del Flamenco) |
| **Multi-type example** | None in this set | La Casa del Flamenco: ["MusicVenue", "TouristAttraction"] |
| **Country** | Greece (GR) | Spain (ES) |

## Schema Strategy Highlights

### Type Specificity in Action
* **Correct**: Acropolis Museum → `Museum`
* **Wrong**: Acropolis Museum → `TouristAttraction` (too generic)

### Knowledge Graph Connections
1. **Vertical linking**: Athens → Greece trip → Two Travel Nuts site
2. **Entity disambiguation**: Wikipedia + Wikidata for all major landmarks
3. **Geographic hierarchy**: Athens → Greece (containedInPlace with `@type: "Country"` and Wikidata ID Q41)
4. **Navigation breadcrumbs**: Home → Greece → Athens

### Human Experience Signals
* Transparent hotel feedback (even when 5.0 rating, specific details provided)
* Specific attraction recommendations ("don't skip the top floor")
* Review entities separate from TouristDestination (signals independent evaluation)

## Implementation Notes

This example demonstrates that the schema pattern scales across:
* Different destinations (Mediterranean Greece vs Andalusian Spain)
* Different attraction types (museums vs churches vs cultural venues)
* Different trip contexts (island-hopping Greece vs road trip Spain)
* Different hotel experiences (5-star luxury vs boutique disappointments)

The structure remains consistent regardless of content - only the specific values, types, and coordinates change.

**Fully normalized entity architecture:** Images, attractions, and reviews all extracted as top-level @graph entities with unique @id values for consistency with Seville pattern.

**Attraction normalization (4 entities):**
* @id naming: `#attraction-acropolis`, `#attraction-acropolis-museum`, `#attraction-ancient-agora`, `#attraction-national-archaeological-museum`
* Graph order: Images → Attractions → BlogPosting → TouristDestination → Reviews
* TouristDestination.includesAttraction references via @id (no inline definitions)
* Review.itemReviewed for Acropolis Museum references attraction @id (tight entity linkage)
* Benefits: Single source of truth, enables cross-page references, consistent with images/reviews pattern

**Language consistency:** WebSite and BlogPosting entities include `inLanguage: "en-US"` to explicitly declare language across all top-level entities for clarity and consistency.

**sameAs consistency:** All `sameAs` properties use arrays even with single values (Person has one Instagram URL, Country has one Wikidata ID, both use array format) to maintain consistent data structure and simplify generation logic.
