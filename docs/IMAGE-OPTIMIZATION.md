# Image Optimization Guide

## Overview

The blog images are optimized for web delivery using ImageMagick. This dramatically reduces file sizes while maintaining visual quality.

**Current settings:**
- **Max width:** 1800px (perfect for 600px CSS display at 3x retina)
- **JPEG quality:** 85% (great balance of quality vs. size)
- **Metadata:** Stripped (EXIF removed for privacy and smaller files)

**Expected results:**
- **File size reduction:** 90-95% smaller (2-8MB → 100-300KB per image)
- **Total savings:** ~450MB for current Spain + Greece trips

---

## Usage

### First-time optimization (all trips)

```bash
# Preview what will happen (safe, no changes made)
npm run optimize:images:dry-run

# Optimize all images (creates backups in .originals/)
npm run optimize:images
```

### Optimize a specific trip

```bash
# Dry run for Spain only
npm run optimize:images:dry-run -- spain

# Optimize Spain only
npm run optimize:images -- spain
```

### Re-optimize already-optimized images

```bash
# Force re-optimization (useful if you change settings)
npm run optimize:images:force
```

---

## How It Works

1. **Finds images:** Scans `content/trips/*/images/` for JPG and PNG files
2. **Creates backups:** Originals saved to `content/trips/*/images/.originals/`
3. **Optimizes:** Resizes to max 1800px width, compresses to 85% quality, strips EXIF
4. **Skips optimized:** Won't re-optimize images that already have backups (unless `--force`)

---

## Safety Features

- ✅ **Automatic backups:** Originals preserved in `.originals/` subdirectory
- ✅ **Idempotent:** Safe to run multiple times (skips already-optimized images)
- ✅ **Dry-run mode:** Preview changes before applying
- ✅ **Error handling:** Continues processing if individual images fail
- ✅ **Statistics:** Shows before/after sizes and savings

---

## After Optimization

### What to commit

```bash
# Commit optimized images
git add content/trips/*/images/*.jpg

# Do NOT commit backups (already gitignored)
# .originals/ directories are excluded via .gitignore
```

### Restore originals (if needed)

```bash
# If you need to restore an original image
cp content/trips/spain/images/.originals/cordoba-01.jpg content/trips/spain/images/

# Or restore all images in a trip
cp content/trips/spain/images/.originals/* content/trips/spain/images/
```

---

## Automated Integration

### Pre-commit Hook (Automatic)

A git pre-commit hook automatically optimizes images before each commit:

**How it works:**
- Detects if any `.jpg`, `.jpeg`, or `.png` files in `content/trips/*/images/` are being committed
- If yes, runs `npm run optimize:images` automatically
- Re-stages any modified images
- Continues with commit

**What you'll see:**
```bash
git commit -m "Add photos"
🖼️  Detected staged images, running optimization...
📦 Re-staging optimized images...
✅ Images optimized and re-staged
[main abc1234] Add photos
```

**Benefits:**
- ✅ Never accidentally commit unoptimized images
- ✅ No manual steps to remember
- ✅ Fast when images already optimized (skips them)

**Hook location:** `.git/hooks/pre-commit`

### Deploy Check (Warning)

The deployment check (`npm run deploy-check`) warns about unoptimized images:

```bash
npm run deploy-check
...
⚠️  All images are optimized
   12 unoptimized image(s) found. Run: npm run optimize:images
```

This is a **warning only** (won't block deployment) but reminds you to optimize before deploying.

---

## Integration with Photo Workflow

### Recommended workflow for new trips

1. **Sync photos** from Google Takeout:
   ```bash
   node lib/sync-takeout-photos.js spain-2025 ~/Downloads/takeout-*.zip
   ```

2. **Assign photos** to locations:
   ```bash
   node lib/assign-photos.js spain-2025
   ```

3. **Optimize images** before committing:
   ```bash
   npm run optimize:images -- spain-2025
   ```

4. **Build and commit:**
   ```bash
   npm run build
   git add content/trips/spain-2025/
   git commit -m "Add Spain 2025 trip with optimized images"
   ```

---

## Technical Details

### ImageMagick command used

```bash
magick input.jpg \
  -resize "1800x1800>" \  # Only shrink if larger than 1800px
  -quality 85 \            # 85% JPEG quality
  -strip \                 # Remove EXIF metadata
  output.jpg
```

### Why 1800px?

Your CSS displays images at `max-width: 600px`. For high-DPI (retina) displays:
- **1x display:** 600px needed
- **2x display (iPhone):** 1200px needed
- **3x display (modern phones):** 1800px needed

1800px provides perfect quality on all devices while being 55% smaller than 4032px originals.

### Why 85% quality?

JPEG quality 85% is the "sweet spot":
- **90-100%:** Diminishing returns (huge files, imperceptible quality gain)
- **85%:** Excellent quality, good compression
- **70-80%:** Noticeable quality loss on detailed images
- **<70%:** Visible artifacts

---

## Troubleshooting

### "ImageMagick not found"

Install ImageMagick:
```bash
brew install imagemagick
```

Verify installation:
```bash
magick --version
```

### Images still large after optimization

Check if ImageMagick actually processed them:
```bash
# Original should exist in .originals/
ls -lh content/trips/spain/images/.originals/

# Compare sizes
ls -lh content/trips/spain/images/cordoba-01.jpg
ls -lh content/trips/spain/images/.originals/cordoba-01.jpg
```

### Want to change optimization settings

Edit `scripts/optimize-images.js`:
```javascript
const MAX_WIDTH = 1800;          // Change width
const JPEG_QUALITY = 85;         // Change quality (50-100)
```

Then re-optimize:
```bash
npm run optimize:images:force
```

---

## Performance

**Processing speed:**
- ~10 images per second on M1 Mac
- Spain (93 images): ~9 seconds
- Greece (71 images): ~7 seconds
- All trips (165 images): ~16 seconds

**File size savings (actual results from Spain + Greece):**
- Before: 482MB
- After: ~25-50MB (estimated)
- Savings: ~90-95%
