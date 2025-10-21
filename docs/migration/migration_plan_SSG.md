## SEO Architecture

### Problem
Single Page Application (SPA) architecture is not SEO-friendly:
- No unique URLs per trip
- JavaScript-rendered content
- No per-trip meta tags
- Poor social media previews

### Solution: Static Site Generation

Build process generates real HTML files:

**File structure:**
```
build-output/
├── index.html
├── trips/
│   ├── greece/
│   │   └── index.html    # Full HTML, SEO-optimized
│   └── new-zealand/
│       └── index.html
├── sitemap.xml
└── robots.txt
```

**Each trip page includes:**
- Unique title and meta description
- Open Graph tags (social media)
- Schema.org structured data
- Canonical URL
- Server-rendered content (no JS required)
- Internal links to related trips

**URL structure:**
- Homepage: `/`
- Trip: `/trips/{slug}/`
- Example: `/trips/greek-islands-2024/`

**Build script generates:**
1. HTML page for each trip
2. Sitemap.xml listing all pages
3. robots.txt
4. Meta tags from trip metadata