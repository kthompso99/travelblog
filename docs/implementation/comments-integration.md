# Remark42 Comments Integration

## Overview

Remark42 is integrated as the commenting system across all trip pages (intro, locations, articles, and maps). Each page has a unique comment stream identified by a stable page ID.

## Architecture

### Configuration (`config/remark42.json`)

Environment-aware configuration file following the `google-maps.json` pattern:

```json
{
  "siteId": "twotravelnuts",
  "hosts": {
    "development": "http://localhost:8080",
    "production": "https://comments.twotravelnuts.com"
  }
}
```

- **Development**: Points to local Docker instance at `localhost:8080`
- **Production**: Points to production Remark42 deployment
- **Site ID**: Unique identifier for the blog instance

### Helper Module (`lib/remark42-config.js`)

Provides three core functions:

#### `getRemark42Config()`
Loads configuration and selects appropriate host based on `NODE_ENV`:
- Development: Uses `config.hosts.development`
- Production: Uses `config.hosts.production`
- Fallback: Returns test defaults if config file missing

#### `buildCommentPageId(tripSlug, pageType, itemSlug)`
Generates unique, stable page IDs in format `{tripSlug}/{pageType}/{itemSlug}`:
- **Trip intro**: `spain/intro`
- **Trip map**: `spain/map`
- **Location page**: `spain/location/cordoba`
- **Article page**: `spain/article/tips`

#### `buildCommentsSection(pageId)`
Creates comment section HTML:
```html
<div class="comments-section">
    <div class="comments-header">
        <h2>Comments</h2>
        <p class="comments-subtitle">Share your thoughts and experiences</p>
    </div>
    <div id="remark42" data-remark42-page-id="{pageId}"></div>
</div>
```

## Integration Points

### Base Template (`templates/base.html`)

Remark42 script loaded globally before closing `</body>` tag, following GLightbox pattern:

```html
<!-- Remark42 Comments -->
<script>
  var remark_config = {
    host: '{{REMARK42_HOST}}',
    site_id: '{{REMARK42_SITE_ID}}',
    components: ['embed'],
    theme: 'light'
  };
</script>
<script>!function(e,n){for(var o=0;o<e.length;o++){var r=n.createElement("script"),c=".js",d=n.head||n.body;"noModule"in r?(r.type="module",c=".mjs"):r.async=!0,r.defer=!0,r.src=remark_config.host+"/web/"+e[o]+c,d.appendChild(r)}}(remark_config.components||["embed"],document);</script>
```

Placeholders `{{REMARK42_HOST}}` and `{{REMARK42_SITE_ID}}` are replaced during page assembly.

### Template Utilities (`lib/template-utilities.js`)

`assembleTemplate()` function includes Remark42 placeholder replacements:
```javascript
.replace(/{{REMARK42_HOST}}/g, replacements.remark42Host || '')
.replace(/{{REMARK42_SITE_ID}}/g, replacements.remark42SiteId || '')
```

### Render Page Helper (`lib/generate-html-helpers.js`)

`renderPage()` function loads config and passes to template:
```javascript
const remark42Config = getRemark42Config();
return assembleTemplate(baseTemplate, {
    // ... other replacements
    remark42Host: remark42Config.host,
    remark42SiteId: remark42Config.siteId
});
```

### Content Templates

All three trip templates include `{{COMMENTS_SECTION}}` placeholder:

**Trip Intro** (`templates/trip-intro-page.html`):
```html
<div class="markdown-content">
    {{INTRO_CONTENT}}
</div>
{{COMMENTS_SECTION}}
{{PREV_NEXT_NAV}}
```

**Location/Article** (`templates/trip-location-page.html`):
```html
<div class="markdown-content">
    {{LOCATION_CONTENT}}
</div>
{{COMMENTS_SECTION}}
<div class="location-navigation">
    {{PREV_NEXT_NAV}}
</div>
```

**Trip Map** (`templates/trip-map-page.html`):
```html
<div class="trip-map-full-layout">
    <!-- map content -->
</div>
{{COMMENTS_SECTION}}
{{MAP_SCRIPT}}
{{PREV_NEXT_NAV}}
```

### Page Generators (`lib/generate-trip-pages.js`)

Each generator function injects comments:

**Trip Intro Page**:
```javascript
const commentPageId = buildCommentPageId(tripMetadata.slug, 'intro');
const commentsHtml = buildCommentsSection(commentPageId);
```

**Location/Article Page**:
```javascript
const itemSlug = getContentItemSlug(contentItem);
const pageType = contentItem.type; // 'location' or 'article'
const commentPageId = buildCommentPageId(tripMetadata.slug, pageType, itemSlug);
const commentsHtml = buildCommentsSection(commentPageId);
```

**Trip Map Page**:
```javascript
const commentPageId = buildCommentPageId(tripMetadata.slug, 'map');
const commentsHtml = buildCommentsSection(commentPageId);
```

## Styling (`lib/css-content-pages.js`)

Custom CSS matches design specifications with amber accent colors:

### Comment Section Container
- Top margin: 4rem
- Top border: 2px solid #e2e8f0
- Top padding: 3rem

### Comment Header
- Title: 1.75rem, bold, dark slate (#0f172a)
- Subtitle: 0.95rem, muted (#64748b)

### Remark42 Widget Overrides
- **Form fields**: Rounded corners (8px), border color #e2e8f0
- **Focus states**: Amber border (#f59e0b) with subtle shadow
- **Submit button**: Amber background (#f59e0b), darker on hover (#d97706)
- **Comment cards**: Left border (3px), amber highlight on hover
- **Typography**: Matches site fonts (Inter, system-ui)

### Responsive Design
- Mobile: Reduced spacing (3rem → 2rem)
- Header font size scales down on small screens

## Page ID Stability

Page IDs remain consistent across rebuilds because they're derived from:
1. **Trip slug**: Inferred from directory name (stable)
2. **Page type**: Hardcoded ('intro', 'map', 'location', 'article')
3. **Item slug**: Derived from filename without .md extension (stable)

Example: The file `content/trips/spain/cordoba.md` always generates page ID `spain/location/cordoba`.

## Build Integration

### Build Modes
- **Full build** (`npm run build`): Generates all pages with comments
- **Incremental** (`npm run build:smart`): Rebuilds changed trips with comments
- **Writing mode** (`npm run writing`): Rebuilds individual pages with comments
- **Validation** (`npm run validate`): No comment-specific validation needed

### Environment Detection
- Uses `process.env.NODE_ENV` to select host
- Defaults to 'development' if NODE_ENV not set
- Production builds set NODE_ENV=production in CI/CD

## Testing

### Verification Steps
1. **Build system**: All build modes succeed without errors
2. **Comment visibility**: Comments appear on all page types
3. **Comment placement**: Between content and prev/next nav
4. **Unique IDs**: Each page has unique `data-remark42-page-id`
5. **Environment**: Correct host URL for dev/production
6. **Integration**: Remark42 script loads, widget initializes
7. **Tests**: `npm test` passes (navigation, filter, CSS, maps)

### Manual Testing
1. Start local Remark42: Docker instance on `localhost:8080`
2. Build site: `npm run build`
3. Serve locally: `npm run serve`
4. Visit pages: Check intro, locations, articles, map pages
5. Post comment: Verify unique streams per page
6. Check styling: Amber accents, proper spacing, mobile responsive

## Design Decisions

### Why Global Script Loading?
Follows GLightbox pattern - script loads once, initializes automatically when `#remark42` div present. Simpler than per-page injection.

### Why Hierarchical Page IDs?
Format `{tripSlug}/{pageType}/{itemSlug}` provides:
- Uniqueness across all pages
- Stability across rebuilds
- Human-readable debugging
- Natural hierarchy reflecting content structure

### Why Environment-Aware Config?
Matches `google-maps.json` pattern - single config file with environment awareness eliminates hardcoded URLs.

### Why CSS in `css-content-pages.js`?
Comments only appear on content pages (not homepage), so styles belong with content page CSS for better organization.

### Why Always Show Comments?
Unlike published filter for homepage, comments always visible (dev + production) to allow testing and feedback on unpublished content.

## Edge Cases

1. **Missing config**: Falls back to test defaults (localhost:8080, remark_test_123)
2. **Invalid NODE_ENV**: Defaults to development host
3. **Missing item slug**: Uses slugified title as fallback
4. **No Remark42 server**: Widget fails gracefully, no page break
5. **Duplicate page IDs**: Prevented by unique tripSlug + pageType + itemSlug combination

## Future Considerations

- **Moderation**: Configure Remark42 admin panel for comment moderation
- **Notifications**: Email notifications for new comments
- **Social login**: Enable GitHub, Google, Facebook authentication
- **Analytics**: Track comment engagement metrics
- **Import/Export**: Backup comment data periodically
- **Spam protection**: Configure reCAPTCHA or Akismet integration
