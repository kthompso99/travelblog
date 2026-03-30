# JSON-LD Target Specification for Two Travel Nuts

**Document Purpose:** Defines the desired JSON-LD/Schema.org structured data output for each page type on the travel blog. This spec is independent of implementation details and serves as the "product requirement" for SEO markup.

**Version:** 1.0
**Last Updated:** March 28, 2026
**Status:** Draft for review

---

## Design Principles

1. **Entity Linking:** Use `@graph` pattern to link WebSite, Organization, Person, and content entities
2. **@id Consistency (Critical):** Use fully-qualified URLs for ALL `@id` values - never use fragment-only IDs like `#review-hotel`. Always use complete URLs like `https://twotravelnuts.com/trips/greece/athens.html#review-hotel-grande-bretagne`. This eliminates ambiguity, enables cross-page entity reuse, and aligns with how Google builds knowledge graphs.
   - **Universal entities** (same across all pages): `https://twotravelnuts.com/#website`, `https://twotravelnuts.com/#organization`, `https://twotravelnuts.com/#author`
   - **Page-specific entities**: Full page URL + fragment, e.g., `https://twotravelnuts.com/trips/spain/seville.html#article`
3. **sameAs Consistency (Critical):** Always use arrays for `sameAs` properties, even with single values (e.g., `"sameAs": ["https://www.wikidata.org/wiki/Q29"]` not `"sameAs": "https://www.wikidata.org/wiki/Q29"`). This ensures consistent data structure, simplifies generation logic, and enables adding additional identifiers later without refactoring.
4. **Dual-Layer Modeling:** Location pages use BlogPosting (document/provenance layer) + TouristDestination (entity/subject layer) linked via `mainEntity` - preserves E-E-A-T authorship while enabling travel-specific rich results
5. **Node Linking Strategy:** When a page describes a destination that was part of a larger trip, use `@id` references to connect individual location pages to the overarching trip itinerary
6. **Audience Targeting:** Include `touristType` arrays for SEO filtering
7. **Entity Disambiguation:** Use Wikipedia URLs and/or Wikidata IDs in `sameAs` arrays (both preferred when available)
8. **Content Typing:** Use appropriate Schema.org types (TouristDestination vs Article)
9. **Human Experience:** Include Reviews with transparent feedback to differentiate from AI content

**Key Decisions:**
- ✅ **Dual-entity location pages:** BlogPosting wrapper + TouristDestination subject (document provenance + entity attributes)
- ✅ Wikipedia URLs and/or Wikidata IDs in `sameAs` arrays (include as many as possible)
- ✅ Multiple Review entities (hotels + "Don't Miss" attractions) with standardized 5-point rating scale
- ✅ **Review connectivity:** Both BlogPosting and TouristDestination explicitly link to Review entities via @id references (strengthens E-E-A-T signal cluster)
- ✅ Focused schema types (no FAQPage, HowTo unless requested)
- ✅ **Layered Trip Schema:** Use `TravelAction` as primary entity (completed experience) linked to secondary `TouristTrip` node (trip object for Google travel features) via `@id` references
- ✅ Multi-type arrays for attractions (e.g., `["MusicVenue", "TouristAttraction"]`)
- ✅ Full ImageObject with captions for gallery images (leverage descriptive alt-text)

---

## Universal Elements

Every page includes these entities in its `@graph`:

### 1. WebSite Entity
```json
{
  "@type": "WebSite",
  "@id": "https://twotravelnuts.com/#website",
  "url": "https://twotravelnuts.com/",
  "name": "Two Travel Nuts",
  "inLanguage": "en-US",
  "publisher": { "@id": "https://twotravelnuts.com/#organization" }
}
```

### 2. Organization Entity
```json
{
  "@type": "Organization",
  "@id": "https://twotravelnuts.com/#organization",
  "name": "Two Travel Nuts",
  "url": "https://twotravelnuts.com/",
  "logo": {
    "@type": "ImageObject",
    "url": "https://twotravelnuts.com/logo.png"
  }
}
```

### 3. Person/Author Entity
```json
{
  "@type": "Person",
  "@id": "https://twotravelnuts.com/#author",
  "name": "Kevin Thompson",
  "jobTitle": "Travel Photographer & Writer",
  "knowsAbout": [
    "Luxury Travel",
    "Travel Photography",
    "European Travel",
    "Cultural Travel"
  ],
  "sameAs": ["https://www.instagram.com/twotravelnuts"]
}
```

### 4. BreadcrumbList (on all pages)
Structure depends on page depth - see examples below.

---

## Page Type 1: Homepage

**URL Pattern:** `https://twotravelnuts.com/`

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://twotravelnuts.com/#website",
      "url": "https://twotravelnuts.com/",
      "name": "Two Travel Nuts",
      "inLanguage": "en-US",
      "publisher": { "@id": "https://twotravelnuts.com/#organization" }
    },
    {
      "@type": "Organization",
      "@id": "https://twotravelnuts.com/#organization",
      "name": "Two Travel Nuts",
      "url": "https://twotravelnuts.com/",
      "logo": {
        "@type": "ImageObject",
        "url": "https://twotravelnuts.com/logo.png"
      }
    },
    {
      "@type": "Person",
      "@id": "https://twotravelnuts.com/#author",
      "name": "Kevin Thompson",
      "jobTitle": "Travel Photographer & Writer",
      "knowsAbout": ["Luxury Travel", "Travel Photography", "European Travel", "Cultural Travel"],
      "sameAs": ["https://www.instagram.com/twotravelnuts"]
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://twotravelnuts.com/"
        }
      ]
    }
  ]
}
```

---

## Page Type 2: Trip Intro Page

**URL Pattern:** `/trips/{slug}/` (e.g., `/trips/spain/`)
**Purpose:** Overview page for a complete trip with itinerary

```json
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "@id": "https://twotravelnuts.com/#website", "..." },
    { "@type": "Organization", "@id": "https://twotravelnuts.com/#organization", "..." },
    { "@type": "Person", "@id": "https://twotravelnuts.com/#author", "..." },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://twotravelnuts.com/" },
        { "@type": "ListItem", "position": 2, "name": "Southern Spain", "item": "https://twotravelnuts.com/trips/spain/" }
      ]
    },
    {
      "@type": "TravelAction",
      "@id": "https://twotravelnuts.com/trips/spain/#trip-action",
      "name": "Southern Spain",
      "description": "Moorish history, white villages, and slow autumn travel",
      "agent": { "@id": "https://twotravelnuts.com/#author" },
      "startTime": "2025-10-22",
      "endTime": "2025-11-07",
      "object": { "@id": "https://twotravelnuts.com/trips/spain/#itinerary" }
    },
    {
      "@type": "TouristTrip",
      "@id": "https://twotravelnuts.com/trips/spain/#itinerary",
      "name": "Southern Spain Itinerary",
      "mainEntityOfPage": "https://twotravelnuts.com/trips/spain/",
      "touristType": ["Luxury Travelers", "Mature Travelers", "Culture Seekers"],
      "itinerary": {
        "@type": "ItemList",
        "@id": "https://twotravelnuts.com/trips/spain/#itinerary-list",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "item": {
              "@type": "TouristDestination",
              "name": "Cordoba",
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": 37.88,
                "longitude": -4.77
              },
              "url": "https://twotravelnuts.com/trips/spain/cordoba.html"
            }
          },
          {
            "@type": "ListItem",
            "position": 2,
            "item": {
              "@type": "TouristDestination",
              "name": "Granada",
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": 37.18,
                "longitude": -3.60
              },
              "url": "https://twotravelnuts.com/trips/spain/granada.html"
            }
          }
          // ... all locations in sequence
        ]
      }
    }
  ]
}
```

**Key properties:**
- **Hybrid structure:** Two linked entities in `@graph`:
  - **TravelAction** node: Represents the completed experience (E-E-A-T signal)
    - Uses `object` property to reference the TouristTrip by `@id`
    - Includes agent, startTime, endTime
  - **TouristTrip** node: Provides "trip object" for Google travel features
    - mainEntityOfPage points to canonical trip URL (page-level entity consistency)
    - Contains the full itinerary (ItemList)
    - Includes touristType for audience targeting
    - Each itinerary item is a TouristDestination with geo coordinates
- **@id linking:** TravelAction.object points to TouristTrip.@id
- **url:** Each itinerary item links to its location page

---

## Page Type 3: Location Page (Content)

**URL Pattern:** `/trips/{slug}/{location}.html` (e.g., `/trips/spain/seville.html`)
**Purpose:** Detailed guide for a specific destination

**This is the most complex page type** - includes attractions and hotel reviews.

```json
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "@id": "https://twotravelnuts.com/#website", "..." },
    { "@type": "Organization", "@id": "https://twotravelnuts.com/#organization", "..." },
    { "@type": "Person", "@id": "https://twotravelnuts.com/#author", "..." },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://twotravelnuts.com/" },
        { "@type": "ListItem", "position": 2, "name": "Southern Spain", "item": "https://twotravelnuts.com/trips/spain/" },
        { "@type": "ListItem", "position": 3, "name": "Seville", "item": "https://twotravelnuts.com/trips/spain/seville.html" }
      ]
    },
    {
      "@type": "ImageObject",
      "@id": "https://twotravelnuts.com/trips/spain/seville.html#image-hero",
      "url": "https://twotravelnuts.com/images/seville-15.jpg",
      "contentUrl": "https://twotravelnuts.com/images/seville-15.jpg",
      "name": "Seville Cathedral through Moorish arch",
      "caption": "Moorish arch framing the cathedral in Seville's old town",
      "representativeOfPage": true
    },
    {
      "@type": "ImageObject",
      "@id": "https://twotravelnuts.com/trips/spain/seville.html#image-alcazar-pond",
      "url": "https://twotravelnuts.com/images/seville-14.jpg",
      "contentUrl": "https://twotravelnuts.com/images/seville-14.jpg",
      "name": "Mercury's Pond at the Alcázar",
      "caption": "The large, emerald-green Mercury's Pond at the Alcázar"
    },
    {
      "@type": "ImageObject",
      "@id": "https://twotravelnuts.com/trips/spain/seville.html#image-peacock",
      "url": "https://twotravelnuts.com/images/seville-18.jpg",
      "contentUrl": "https://twotravelnuts.com/images/seville-18.jpg",
      "name": "Close encounter with peacock in Seville",
      "caption": "Not sure I've ever been quite this close to a peacock"
    },
    {
      "@type": "TouristAttraction",
      "@id": "https://twotravelnuts.com/trips/spain/seville.html#attraction-royal-alcazar",
      "name": "Royal Alcázar of Seville",
      "description": "A stunning 14th-century Mudéjar palace and gardens.",
      "url": "https://en.wikipedia.org/wiki/Alc%C3%A1zar_of_Seville",
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 37.3830,
        "longitude": -5.9930
      },
      "sameAs": [
        "https://en.wikipedia.org/wiki/Alc%C3%A1zar_of_Seville",
        "https://www.wikidata.org/wiki/Q1134300"
      ]
    },
    {
      "@type": "CatholicChurch",
      "@id": "https://twotravelnuts.com/trips/spain/seville.html#attraction-seville-cathedral",
      "name": "Seville Cathedral",
      "description": "The largest Gothic church in the world, featuring the Giralda Tower.",
      "url": "https://en.wikipedia.org/wiki/Seville_Cathedral",
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 37.3859,
        "longitude": -5.9930
      },
      "sameAs": [
        "https://en.wikipedia.org/wiki/Seville_Cathedral",
        "https://www.wikidata.org/wiki/Q2973"
      ]
    },
    {
      "@type": ["MusicVenue", "TouristAttraction"],
      "@id": "https://twotravelnuts.com/trips/spain/seville.html#attraction-la-casa-del-flamenco",
      "name": "La Casa del Flamenco",
      "description": "Authentic, unamplified flamenco in a 15th-century courtyard.",
      "url": "https://lacasadelflamencosevilla.com/",
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 37.3845,
        "longitude": -5.9920
      }
    },
    {
      "@type": "TouristAttraction",
      "@id": "https://twotravelnuts.com/trips/spain/seville.html#attraction-metropol-parasol",
      "name": "Metropol Parasol (Las Setas)",
      "description": "A massive wooden structure with Roman ruins and panoramic views.",
      "url": "https://en.wikipedia.org/wiki/Metropol_Parasol",
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 37.3930,
        "longitude": -5.9915
      },
      "sameAs": [
        "https://en.wikipedia.org/wiki/Metropol_Parasol",
        "https://www.wikidata.org/wiki/Q1311020"
      ]
    },
    {
      "@type": "TouristAttraction",
      "@id": "https://twotravelnuts.com/trips/spain/seville.html#attraction-plaza-de-espana",
      "name": "Plaza de España",
      "description": "A cinematic landmark built for the 1929 Ibero-American Exposition.",
      "url": "https://en.wikipedia.org/wiki/Plaza_de_Espa%C3%B1a,_Seville",
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 37.3770,
        "longitude": -5.9869
      },
      "sameAs": [
        "https://en.wikipedia.org/wiki/Plaza_de_Espa%C3%B1a,_Seville",
        "https://www.wikidata.org/wiki/Q956014"
      ]
    },
    {
      "@type": "BlogPosting",
      "@id": "https://twotravelnuts.com/trips/spain/seville.html#article",
      "headline": "Seville: Where the Best Moments Come from Wrong Turns",
      "description": "4-night guide to Seville covering the Royal Alcázar, authentic flamenco, and the reality of high-end lodging.",
      "inLanguage": "en-US",
      "mainEntityOfPage": "https://twotravelnuts.com/trips/spain/seville.html",
      "author": { "@id": "https://twotravelnuts.com/#author" },
      "datePublished": "2025-11-15",
      "dateModified": "2025-11-15",
      "publisher": { "@id": "https://twotravelnuts.com/#organization" },
      "mainEntity": { "@id": "https://twotravelnuts.com/trips/spain/seville.html#destination" },
      "about": { "@id": "https://twotravelnuts.com/trips/spain/seville.html#destination" },
      "image": { "@id": "https://twotravelnuts.com/trips/spain/seville.html#image-hero" },
      "primaryImageOfPage": { "@id": "https://twotravelnuts.com/trips/spain/seville.html#image-hero" },
      "review": [
        { "@id": "https://twotravelnuts.com/trips/spain/seville.html#review-hotel-unuk" },
        { "@id": "https://twotravelnuts.com/trips/spain/seville.html#review-flamenco" }
      ]
    },
    {
      "@type": "TouristDestination",
      "@id": "https://twotravelnuts.com/trips/spain/seville.html#destination",
      "name": "Seville",
      "description": "4-night guide to Seville covering the Royal Alcázar, authentic flamenco, and the reality of high-end lodging.",
      "mainEntityOfPage": "https://twotravelnuts.com/trips/spain/seville.html",
      "isPartOf": { "@id": "https://twotravelnuts.com/trips/spain/#itinerary" },
      "touristType": ["Luxury Travelers", "Mature Travelers", "Culture Seekers"],
      "sameAs": [
        "https://en.wikipedia.org/wiki/Seville",
        "https://www.wikidata.org/wiki/Q8717"
      ],
      "review": [
        { "@id": "https://twotravelnuts.com/trips/spain/seville.html#review-hotel-unuk" },
        { "@id": "https://twotravelnuts.com/trips/spain/seville.html#review-flamenco" }
      ],
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 37.3891,
        "longitude": -5.9845
      },
      "image": [
        { "@id": "https://twotravelnuts.com/trips/spain/seville.html#image-hero" },
        { "@id": "https://twotravelnuts.com/trips/spain/seville.html#image-alcazar-pond" },
        { "@id": "https://twotravelnuts.com/trips/spain/seville.html#image-peacock" }
        // ... all gallery images referenced via @id
      ],
      "containedInPlace": {
        "@type": "Country",
        "name": "Spain",
        "sameAs": ["https://www.wikidata.org/wiki/Q29"],
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "ES"
        }
      },
      "includesAttraction": [
        { "@id": "https://twotravelnuts.com/trips/spain/seville.html#attraction-royal-alcazar" },
        { "@id": "https://twotravelnuts.com/trips/spain/seville.html#attraction-seville-cathedral" },
        { "@id": "https://twotravelnuts.com/trips/spain/seville.html#attraction-la-casa-del-flamenco" },
        { "@id": "https://twotravelnuts.com/trips/spain/seville.html#attraction-metropol-parasol" },
        { "@id": "https://twotravelnuts.com/trips/spain/seville.html#attraction-plaza-de-espana" }
      ]
    },
    {
      "@type": "Review",
      "@id": "https://twotravelnuts.com/trips/spain/seville.html#review-hotel-unuk",
      "itemReviewed": {
        "@type": "Hotel",
        "name": "Vincci Seleccion Unuk",
        "url": "https://www.vinccihoteles.com/en/hotels/seville/vincci-seleccion-unuk",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Seville",
          "addressCountry": "ES"
        }
      },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "3.5",
        "bestRating": "5"
      },
      "author": { "@id": "https://twotravelnuts.com/#author" },
      "datePublished": "2025-11-15",
      "reviewBody": "Beautiful hotel with high-end touches, but disappointing communication regarding amenity closures. The rooftop bar and restaurant were closed for the entire stay without prior notice."
    },
    {
      "@type": "Review",
      "@id": "https://twotravelnuts.com/trips/spain/seville.html#review-flamenco",
      "itemReviewed": { "@id": "https://twotravelnuts.com/trips/spain/seville.html#attraction-la-casa-del-flamenco" },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5.0",
        "bestRating": "5"
      },
      "author": { "@id": "https://twotravelnuts.com/#author" },
      "datePublished": "2025-11-15",
      "reviewBody": "Authentic, unamplified flamenco in an intimate 15th-century courtyard. The real thing."
    }
  ]
}
```

**Key properties:**
- **Dual-entity structure:** Content layer + Entity layer
  - **BlogPosting** node (document layer): Content provenance
    - author, datePublished, dateModified, publisher (E-E-A-T signals)
    - inLanguage ("en-US" for language clarity, even for monolingual sites)
    - mainEntityOfPage points to canonical URL (establishes page association)
    - mainEntity points to TouristDestination (`#destination`)
    - about points to same TouristDestination (strengthens topic/subject relationship)
    - headline, description, image (article metadata)
  - **TouristDestination** node (entity layer): Place attributes
    - name, touristType, includesAttraction, image array
    - mainEntityOfPage points to canonical URL
    - isPartOf links to parent trip itinerary
  - **Bidirectional linking:** BlogPosting.mainEntity → TouristDestination, both entities have mainEntityOfPage → canonical URL
- **Why both:** TouristDestination doesn't support author/datePublished - BlogPosting provides content provenance while TouristDestination provides travel-specific rich results
- **isPartOf:** Reference to parent trip itinerary using `@id` (e.g., `{ "@id": "https://twotravelnuts.com/trips/spain/#itinerary" }`) - creates knowledge graph connection from individual location to full trip
- **touristType:** Array from trip metadata (e.g., ["Luxury Travelers", "Mature Travelers"])
  - **Not standardized:** Schema.org allows free-form text - Google treats as soft signals
  - **Consistency critical:** Use exact same terms across all pages to avoid synonym drift
  - **Recommended vocabulary:** "Luxury Travelers", "Budget Travelers", "Mature Travelers", "Family Travelers", "Adventure Travelers", "Culture Seekers", "History Enthusiasts", "Backpackers", "Solo Travelers", "Multi-generational Groups"
  - **Avoid synonyms:** Don't use "Cultural Travelers" if using "Culture Seekers" elsewhere
- **sameAs:** Array with Wikipedia URL and/or Wikidata ID - include both when available, either when not (e.g., `["https://en.wikipedia.org/wiki/Seville", "https://www.wikidata.org/wiki/Q8717"]`)
- **All images as top-level entities:** Hero and gallery images are defined as separate ImageObject entities in @graph with unique @id values
  - **Hero image:** `@id: #image-hero` with `representativeOfPage: true`
  - **Gallery images:** Descriptive @id values (e.g., `#image-alcazar-pond`, `#image-peacock`)
  - **All include enhanced properties:** `url`, `contentUrl`, `name` (descriptive title), `caption` (from alt-text)
  - **Hero image referenced from three places:**
    1. BlogPosting.image
    2. BlogPosting.primaryImageOfPage
    3. TouristDestination.image[0] (first item in array)
  - **Benefits:** Enables image reuse across pages, tighter graph cohesion, eliminates duplication
- **TouristDestination.image array:** References all images via @id (no inline definitions)
  - Hero image first, followed by gallery images in sequence
  - Leverages Kevin's descriptive alt-text for Image Search SEO
- **review:** Both BlogPosting and TouristDestination link to Review entities via @id references
  - Creates explicit semantic connection: "this guide contains these reviews"
  - Completes E-E-A-T signal cluster: BlogPosting → Reviews → Author
  - Reviews still have `itemReviewed` property (critical - shows what was reviewed)
  - Dual context: reviews as content (BlogPosting) and as destination features (TouristDestination)
- **geo:** TouristDestination includes GeoCoordinates for the destination itself (city center)
  - Use canonical city-center coordinates (e.g., Syntagma Square for Athens, Cathedral area for Seville)
  - Single point, not bounding boxes or polygons
  - Improves visibility for broad location queries ("Seville travel guide")
  - Individual attractions also have their own specific coordinates
- **containedInPlace:** Country/region hierarchy with entity disambiguation
  - Use specific `@type: "Country"` (not generic "Place")
  - Include `sameAs` with Wikidata country ID (e.g., Q29 for Spain, Q41 for Greece)
  - Extends disambiguation strategy consistently across all geographic entities
- **Attraction entities (top-level @graph nodes):** 3-7 key attractions extracted as first-class entities (Claude-extracted from content)
  - **@id naming:** Use `#attraction-{kebab-case-slug}` pattern (e.g., `#attraction-royal-alcazar`, `#attraction-acropolis-museum`)
  - **Properties:** name, description, **url**, **geo coordinates** (GeoCoordinates), Schema.org type (or type array), sameAs array
  - **CRITICAL REQUIREMENT - url property:** All normalized attraction entities MUST include a `url` property (official website preferred, Wikipedia URL as fallback). This is non-negotiable - the entire disambiguation strategy depends on canonical URLs for entity identity.
  - **Geo coordinates required:** Enables "near me" searches and Google Maps integration
  - **Type specificity:** Use the most specific Schema.org type possible (e.g., `CatholicChurch` not `LandmarksOrHistoricalBuildings`)
  - **Multi-typing:** Use arrays like `["MusicVenue", "TouristAttraction"]` to broaden search result surface area when appropriate
  - **Specific types to prefer:** `CatholicChurch`, `Museum`, `Park`, `Garden`, `Restaurant`, `Winery`, `MusicVenue`, `PerformingArtsTheater`, `Zoo`, `AquaticCenter`
  - **Generic fallback:** Use `TouristAttraction` only when no specific type fits
  - **Graph order:** Define attractions after images, before BlogPosting (so they exist when referenced)
- **includesAttraction (array of @id references):** TouristDestination references attractions via @id (no inline definitions)
  - Pattern: `"includesAttraction": [{ "@id": "...#attraction-royal-alcazar" }, ...]`
  - **Benefits:** Enables attraction reuse across pages, tight review linking, consistent with images/reviews architecture
- **Review entities (array):** Multiple reviews for different aspects of the destination
  - **Standard properties:** All reviews include author (@id reference), datePublished, reviewRating, reviewBody
  - **CRITICAL: Temporal alignment** - Review.datePublished MUST match BlogPosting.datePublished exactly. Crawlers prefer aligned dates for clean "freshness" signals. Never use different dates for reviews vs. the post they reside in.
  - **Hotel review:** Extract from "Where We Stayed" section
    - Map nutshell verdict → rating using standardized scale:

      | Verdict | Rating Value |
      |---------|-------------|
      | "Would Plan Around" | 5.0 |
      | "Loved It" | 4.5 |
      | "Glad We Went" | 4.0 |
      | "Worth It" | 3.5 |
      | "Skip It" | 2.5 |

    - Include positive/negative quotes from review body
  - **Attraction reviews:** Extract from "Don't Miss" items in nutshell
    - Generate Review entity when strong positive/negative opinion expressed
    - **itemReviewed references attraction @id:** `"itemReviewed": { "@id": "...#attraction-la-casa-del-flamenco" }`
    - reviewBody captures the recommendation/opinion
    - Use 5.0 rating for "Don't Miss" items (strong positive signal)
  - **itemReviewed patterns:** Two approaches for identity resolution
    - **Attractions (normalized):** Reference via @id to top-level attraction entity
      - Pattern: `"itemReviewed": { "@id": "https://twotravelnuts.com/trips/spain/seville.html#attraction-la-casa-del-flamenco" }`
      - **Benefits:** Single source of truth, tight entity linkage, enables cross-page references
    - **Hotels (inline):** Define inline with url/sameAs for disambiguation
      - Hotels rarely appear in multiple contexts (only reviewed once per trip)
      - Inline definition acceptable: `"itemReviewed": { "@type": "Hotel", "name": "...", "url": "..." }`
    - Creates chain: Review → itemReviewed (@id or disambiguated inline) → Wikidata/Wikipedia → Knowledge Graph
    - Strengthens assertion: "Known author reviewed precisely identified entity"

---

## Page Type 4: Article Page (Non-Location Content)

**URL Pattern:** `/trips/{slug}/{article}.html` (e.g., `/trips/spain/tips.html`)
**Purpose:** Non-location content like "Tips", "Planning Guide"

```json
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "@id": "https://twotravelnuts.com/#website", "..." },
    { "@type": "Organization", "@id": "https://twotravelnuts.com/#organization", "..." },
    { "@type": "Person", "@id": "https://twotravelnuts.com/#author", "..." },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://twotravelnuts.com/" },
        { "@type": "ListItem", "position": 2, "name": "Southern Spain", "item": "https://twotravelnuts.com/trips/spain/" },
        { "@type": "ListItem", "position": 3, "name": "Tips", "item": "https://twotravelnuts.com/trips/spain/tips.html" }
      ]
    },
    {
      "@type": "Article",
      "@id": "https://twotravelnuts.com/trips/spain/tips.html#article",
      "isPartOf": { "@id": "https://twotravelnuts.com/#website" },
      "author": { "@id": "https://twotravelnuts.com/#author" },
      "headline": "Tips for Visiting Southern Spain",
      "description": "Practical advice for traveling in Andalucía",
      "inLanguage": "en-US",
      "image": {
        "@type": "ImageObject",
        "url": "https://twotravelnuts.com/images/spain.jpg",
        "contentUrl": "https://twotravelnuts.com/images/spain.jpg",
        "name": "Spain travel overview"
      },
      "datePublished": "2025-11-15",
      "dateModified": "2025-11-15",
      "publisher": { "@id": "https://twotravelnuts.com/#organization" },
      "mainEntityOfPage": "https://twotravelnuts.com/trips/spain/tips.html",
      "articleSection": "Travel Tips",
      "keywords": ["Spain", "Andalucía", "Travel Tips", "Europe"]
    }
  ]
}
```

**Key properties:**
- **Primary entity:** `Article` (not TouristDestination)
- **Authorship:** author and publisher (@id references for E-E-A-T)
- **Standard metadata:** headline, datePublished, dateModified, mainEntityOfPage
- **keywords:** From trip.metadata.tags

---

## Page Type 5: Global Map Page

**URL Pattern:** `/map/`
**Purpose:** Interactive map showing all travel destinations

```json
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "@id": "https://twotravelnuts.com/#website", "..." },
    { "@type": "Organization", "@id": "https://twotravelnuts.com/#organization", "..." },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://twotravelnuts.com/" },
        { "@type": "ListItem", "position": 2, "name": "Travel Map", "item": "https://twotravelnuts.com/map/" }
      ]
    },
    {
      "@type": "WebPage",
      "@id": "https://twotravelnuts.com/map/#page",
      "name": "Our Travel Map",
      "description": "Interactive map of all our travel destinations",
      "isPartOf": { "@id": "https://twotravelnuts.com/#website" }
    }
  ]
}
```

---

## Page Type 6: About Page

**URL Pattern:** `/about/`
**Purpose:** Information about the author and site

```json
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "@id": "https://twotravelnuts.com/#website", "..." },
    { "@type": "Organization", "@id": "https://twotravelnuts.com/#organization", "..." },
    { "@type": "Person", "@id": "https://twotravelnuts.com/#author", "..." },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://twotravelnuts.com/" },
        { "@type": "ListItem", "position": 2, "name": "About", "item": "https://twotravelnuts.com/about/" }
      ]
    },
    {
      "@type": "AboutPage",
      "@id": "https://twotravelnuts.com/about/#page",
      "name": "About Two Travel Nuts",
      "description": "Learn about Kevin Thompson and his luxury travel photography",
      "isPartOf": { "@id": "https://twotravelnuts.com/#website" },
      "mainEntity": { "@id": "https://twotravelnuts.com/#author" }
    }
  ]
}
```

---

## Summary: What This Achieves

1. ✅ **Entity linking** via @graph pattern
2. ✅ **Breadcrumbs** on every page for navigation hierarchy
3. ✅ **Audience targeting** via touristType arrays
4. ✅ **Entity disambiguation** via sameAs (Wikipedia URLs)
5. ✅ **Rich attraction data** via includesAttraction (3-7 per location)
6. ✅ **Hybrid trip structure** via linked TravelAction (experience) + TouristTrip (itinerary object for Google features)
7. ✅ **Organization branding** (not anonymous Person)
8. ✅ **Proper content typing** (TouristDestination vs Article)
9. ✅ **Multiple reviews** (hotels + "Don't Miss" attractions) with transparent feedback (human experience signal)
10. ✅ **Full image arrays** (all gallery images, not just one)

---

## Validation Checklist

After implementation, verify:
- [ ] All pages pass [Google Rich Results Test](https://search.google.com/test/rich-results)
- [ ] All pages pass [Schema.org Validator](https://validator.schema.org/)
- [ ] Breadcrumbs visible in validator on all pages
- [ ] Organization logo/name appears in all author/agent fields
- [ ] Hybrid TravelAction + TouristTrip structure present with proper @id linking
- [ ] includesAttraction arrays have 3-7 items on location pages with geo coordinates
- [ ] Review entities (hotel + attractions) include ratings and review bodies

---

## Notes for 3rd-Party Reviewers

This spec intentionally:
- **Prefers both Wikipedia URLs and Wikidata IDs** in `sameAs` arrays when available - Wikipedia for human verification, Wikidata as non-ambiguous ground truth for Knowledge Graph and AI reasoning - but accepts whatever identifiers can be found
- **Includes hotel reviews** to signal human experience vs AI-generated content
- **Uses dual-entity structure for location pages** - BlogPosting (document layer with author/datePublished) wraps TouristDestination (entity layer with attractions/reviews) via mainEntity linkage - preserves E-E-A-T authorship signals while enabling travel-specific rich results
- **Keeps types focused** (no FAQPage, HowTo) to avoid over-optimization
- **Uses hybrid TravelAction + TouristTrip structure** - TravelAction signals completed experience (E-E-A-T), TouristTrip provides trip object for Google travel features, linked via @id references
- **Uses multi-type arrays** for attractions (e.g., `["MusicVenue", "TouristAttraction"]`) to broaden search result surface area
- **Prioritizes type specificity** - Uses most specific Schema.org types (e.g., `CatholicChurch` over `LandmarksOrHistoricalBuildings`) for better semantic understanding
- **Includes ImageObject with captions** to leverage descriptive alt-text for Image Search

Questions or suggestions? Contact via GitHub issues or email.
