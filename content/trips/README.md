# Trip Content & Images

This directory contains all trip content organized by trip ID.

## Directory Structure

```
content/trips/{trip-id}/
├── trip.json          # Trip metadata and content structure
├── main.md            # Trip intro content (optional but recommended)
├── {location}.md      # Content for each location
└── images/            # Trip-specific images
    ├── photo1.jpg
    ├── photo2.jpg
    └── ...
```

## Using Images in Markdown

Images placed in `content/trips/{trip-id}/images/` will be copied to `trips/{slug}/images/` during build.

### In Markdown Files

Reference images using relative paths:

```markdown
![Sunset over Milos](images/milos-sunset.jpg)

As you can see in this picture:

![Beach at Paros](images/paros-beach.jpg)
```

### Image Optimization

Before committing images:
- **Resize** to max 1920px wide (maintains quality on all screens)
- **Compress** to 80% JPEG quality
- **Target**: 200-500 KB per image (down from 3-8 MB originals)

**Tools:**
- **Mac Preview**: Tools → Adjust Size, then Export with lower quality
- **ImageMagick**: `mogrify -resize 1920x1920\> -quality 80 *.jpg`
- **ImageOptim** (free macOS app): Drag-and-drop optimization

### Cover Images & Thumbnails

Top-level cover images and thumbnails (referenced in `trip.json`) should go in the root `/images` directory:

```
images/
├── greece-cover.jpg     # Large cover image
├── greece-thumb.jpg     # Thumbnail for homepage
└── logo.png             # Site-wide assets
```

## Example: Greece Trip

```
content/trips/greece/
├── trip.json            # References "coverImage": "images/greece-cover.jpg"
├── main.md              # Trip introduction
├── milos.md             # Contains: ![Photo](images/milos-sunset.jpg)
├── santorini.md
├── paros.md
└── images/
    ├── milos-sunset.jpg
    ├── santorini-caldera.jpg
    └── paros-beach.jpg
```

After build, these images are available at:
- `trips/greece/images/milos-sunset.jpg`
- `trips/greece/images/santorini-caldera.jpg`
- `trips/greece/images/paros-beach.jpg`

The markdown `![Photo](images/milos-sunset.jpg)` in `trips/greece/milos.html` will correctly resolve to the copied image.

## Benefits of Per-Trip Images

1. **Scalability** - Each trip is self-contained
2. **No naming collisions** - Each trip has its own namespace
3. **Portability** - Trip content + images live together
4. **Simple paths** - Standard markdown relative paths work naturally
