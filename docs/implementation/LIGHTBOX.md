# Photo Gallery Implementation (Masonry + Lightbox)

## Overview

The photo gallery feature provides a masonry-style photo grid with hover effects and full-screen lightbox functionality for location pages.

## Implementation Approach

**Marker-based markdown:** Kevin adds a special marker line (`*Add your photos here*`) inside a location's existing `.md` file to indicate where the gallery section begins. Any `![caption](src)` images placed after the marker are extracted as gallery photos. The marker and the images after it are stripped from the prose before rendering — they appear as a masonry gallery appended to the bottom of the page, not inline with the text.

If no marker is found, the file renders normally with no gallery (no error).

## Gallery File Format

Add the marker and images at the end of any location markdown file:

```markdown
Regular prose content goes here...

*Add your photos here*
![Caption text for SEO and display](images/Photo-01.jpg)
![Another photo caption](images/Photo-02.jpg)
```

The markdown `![alt](src)` syntax provides both alt text (for accessibility/SEO) and visible captions. The build extracts these and builds the gallery HTML.

## Examples

- `athens.md` contains marker + photos → Athens page renders prose + gallery
- `milos.md` (no marker) → Milos page renders prose only, no gallery
- `paros.md` contains marker + photos → Paros page renders prose + gallery

## Benefits

- No trip.json bloat (galleries don't clutter config files)
- Markdown-native caption authoring
- Optional per-location (not all locations need galleries)
- Alt text automatic (caption serves double duty)
- Single file per location (no separate gallery file to manage)

## Technical Details

### Build Process

`lib/build-utilities.js` exports `processMarkdownWithGallery()`, which reads the location `.md` file, searches for the `GALLERY_MARKER` constant (`*Add your photos here*` from `lib/constants.js`), and splits the file at that point. Everything before the marker is converted to prose HTML; images found after the marker are returned as a `galleryImages` array. `scripts/build/build.js` and `scripts/build/build-writing.js` both call `convertMarkdownWithGallery()` (which wraps `processMarkdownWithGallery`) to get the `{ html, galleryImages }` result. If `galleryImages` is non-empty, `buildPhotoGallery()` in `lib/generate-trip-pages.js` renders the masonry gallery HTML and appends it to the page.

### Layout

CSS `column-count` masonry (1 / 2 / 3 columns at breakpoints). All styles documented in `FIGMA_SYSTEM_DESIGN.md` under "Photo Gallery".

### Hover Effects

Image scales to 110%, brightness drops, centered zoom icon and bottom caption slide up.

### Lightbox

GLightbox library (~25 KB, MIT) provides full-screen modal with:
- Prev/next chevrons
- "3 / 24" counter
- Keyboard nav (← → Esc)
- Captions via `data-description` attribute

### Alt Text

Caption field from markdown serves as:
- `alt=""` attribute (SEO/accessibility)
- Visible caption text below image
- Lightbox caption via `data-description` attribute

Single source of truth for all caption contexts.

## Implementation Status

- ✅ Markdown-based data format (marker in main file)
- ✅ Build script detection and parsing
- ✅ Masonry CSS layout with responsive breakpoints
- ✅ Hover effects (scale, brightness, zoom icon, caption slide)
- ✅ GLightbox integration
- ✅ Lightbox captions via data-description
- ✅ Tested with Greece trip (Athens location, 30 photos)
- ⏸️ Validation of gallery image file existence (optional future enhancement)

## Usage

1. Open any location markdown file, e.g. `content/trips/greece/athens.md`
2. At the end of the file, add the marker followed by images:
   ```markdown
   *Add your photos here*
   ![The Parthenon at sunset](images/athens-01.jpg)
   ![Street food in Plaka](images/athens-02.jpg)
   ```
3. Build the site — the gallery automatically appends to `athens.html`
4. No configuration needed in `trip.json`

## Key Files

- `lib/constants.js` — `GALLERY_MARKER` constant (`*Add your photos here*`)
- `lib/build-utilities.js` — `processMarkdownWithGallery()` detects marker and extracts images
- `lib/generate-trip-pages.js` — `buildPhotoGallery()` renders masonry gallery HTML
- `templates/base.html` — Masonry CSS and GLightbox integration
