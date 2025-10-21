## Scalability: Lazy Loading Architecture

### Problem
With many trips (50+), embedding all HTML content in one JSON file would create a massive file (5-10MB+) that slows initial page load.

### Solution
Split into multiple files:
- `config.built.json`: Lightweight index (metadata + coordinates only)
- `trips/{tripId}.json`: Individual trip content (loaded on-demand)

### Build Output Structure
```
build-output/
├── config.built.json       # ~150KB (50 trips × 3KB metadata each)
└── trips/
    ├── 2024-greece.json    # ~75KB (full HTML content)
    ├── 2024-new-zealand.json
    └── ...
```

### Loading Strategy
1. **Initial**: Load `config.built.json` only
2. **Homepage**: Render from index (has thumbnails, dates, locations)
3. **Trip click**: Fetch `trips/{tripId}.json`
4. **Cache**: Store fetched trips in memory
5. **Result**: Fast initial load, on-demand details

### Build Script Changes
```javascript
// Instead of:
config.built.json → { trips: [ {all content} ] }

// Generate:
config.built.json → { trips: [ {metadata only} ] }
trips/2024-greece.json → { content: [ {all HTML} ] }
```

### Performance Comparison
| Metric | Monolithic | Lazy Loading |
|--------|-----------|--------------|
| Initial load | 10MB | 150KB |
| Time to interactive | 3-5s | 0.3-0.5s |
| Trip page load | Instant | 0.2s |
| Total transferred (5 trips) | 10MB | 525KB |