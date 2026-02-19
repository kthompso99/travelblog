# Photo Gallery Implementation (Masonry + Lightbox)

## Overview

The photo gallery feature provides a masonry-style photo grid with hover effects and full-screen lightbox functionality for location pages.

## Implementation Approach

**Convention-based markdown:** For each location, the generator auto-discovers optional gallery files using the pattern `{location-slug}-gallery.md`. If found, a masonry gallery is appended to that location's page. If not found, no gallery is rendered (no error).

## Gallery File Format

```markdown
![Caption text for SEO and display](images/Photo-01.jpg)
![Another photo caption](images/Photo-02.jpg)
```

The markdown `![alt](src)` syntax provides both alt text (for accessibility/SEO) and visible captions. The generator extracts these and builds the gallery HTML.

## Examples

- `athens.md` + `athens-gallery.md` → Athens page with gallery
- `milos.md` (no gallery file) → Milos page without gallery
- `paros.md` + `paros-gallery.md` → Paros page with gallery

## Benefits

- No trip.json bloat (galleries don't clutter config files)
- Markdown-native caption authoring
- Optional per-location (not all locations need galleries)
- Alt text automatic (caption serves double duty)
- Easy to manage (one file per gallery)

## Technical Details

### Build Process

Generator checks for `{location-slug}-gallery.md` during location page generation. If present, parses markdown and appends gallery HTML.

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

- ✅ Markdown-based data format
- ✅ Build script detection and parsing
- ✅ Masonry CSS layout with responsive breakpoints
- ✅ Hover effects (scale, brightness, zoom icon, caption slide)
- ✅ GLightbox integration
- ✅ Lightbox captions via data-description
- ✅ Tested with Greece trip (Athens location, 30 photos)
- ⏸️ Validation of gallery image file existence (optional future enhancement)

## Usage

1. Create a gallery markdown file: `content/trips/greece/athens-gallery.md`
2. Add images with captions:
   ```markdown
   ![The Parthenon at sunset](images/athens-01.jpg)
   ![Street food in Plaka](images/athens-02.jpg)
   ```
3. Build the site - gallery automatically appends to athens.html
4. No configuration needed in trip.json

## Files Modified

- `scripts/build/build.js` - Gallery file detection
- `lib/generate-trip-pages.js` - Gallery HTML generation (`buildPhotoGallery`)
- `templates/base.html` - Masonry CSS and GLightbox integration
