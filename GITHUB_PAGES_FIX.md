# GitHub Pages Deployment Fix

## Problem Solved

Your site works on localhost but failed on GitHub Pages because:

1. **GitHub Pages serves from subdirectory**: `https://kthompso99.github.io/travelblog/`
2. **Original code used absolute paths**: `/images/greece.jpg` → fails on GitHub Pages
3. **Fix: Use relative paths**: `./images/greece.jpg` → works everywhere

## Changes Made

### Updated Files

1. **[lib/generate-html.js](lib/generate-html.js)** - Changed all paths to relative
   - Homepage links: `/trips/` → `./trips/`
   - Image paths: `/images/` → `./images/`
   - Map page links: `/trips/` → `../trips/`
   - Trip page links: `/` → `../../`

2. **[templates/home-page.html](templates/home-page.html)** - Updated navigation
   - Config path: `/config.built.json` → `./config.built.json`
   - Trip links: use relative paths

3. **[templates/trip-page.html](templates/trip-page.html)** - Updated navigation
   - Config path: `/config.built.json` → `../../config.built.json`
   - Back button: uses `../../`

4. **[index.html](index.html)** - Regenerated with relative paths

### Path Strategy

**From homepage (`/` or `/travelblog/`):**
- Images: `./images/greece.jpg`
- Trips: `./trips/greece/`
- Map: `./map/`
- Config: `./config.built.json`

**From trip page (`/trips/greece/` or `/travelblog/trips/greece/`):**
- Home: `../../`
- Images: Would use `../../images/` if referenced
- Other trips: `../../trips/utah/`
- Config: `../../config.built.json`

**From map page (`/map/` or `/travelblog/map/`):**
- Home: `../`
- Trips: `../trips/greece/`
- Images: `../images/greece.jpg`

## How Relative Paths Work

Relative paths work on **any base URL**:

```
Localhost:
  http://localhost:8000/
  ./trips/greece/ → http://localhost:8000/trips/greece/ ✅

GitHub Pages:
  https://kthompso99.github.io/travelblog/
  ./trips/greece/ → https://kthompso99.github.io/travelblog/trips/greece/ ✅

Custom Domain:
  https://twotravelnuts.com/
  ./trips/greece/ → https://twotravelnuts.com/trips/greece/ ✅
```

## Testing Checklist

### Before Deploying

- [x] Rebuild with fixed paths: `npm run build`
- [x] Replace homepage: `mv index.html.new index.html`
- [x] Test locally: `npm run serve`
- [x] Verify images load on homepage
- [x] Verify trip links work
- [x] Check trip pages load correctly

### After Deploying to GitHub Pages

Test these URLs:

1. **Homepage**: https://kthompso99.github.io/travelblog/
   - [ ] Images should load (Greece, Utah, etc.)
   - [ ] Trip cards should be clickable

2. **Greece Trip**: https://kthompso99.github.io/travelblog/trips/greece/
   - [ ] Page should load (not 404)
   - [ ] Content should display
   - [ ] "Back to Home" button should work
   - [ ] Navigation menu should work

3. **Map Page**: https://kthompso99.github.io/travelblog/map/
   - [ ] Map should load
   - [ ] Markers should appear
   - [ ] Clicking markers should navigate to trips

4. **About Page**: https://kthompso99.github.io/travelblog/about/
   - [ ] Page should load
   - [ ] Content should display

## Deployment Commands

```bash
# 1. Ensure all changes are built
npm run build

# 2. Stage all files for commit
git add .

# 3. Commit with descriptive message
git commit -m "Fix GitHub Pages paths - use relative URLs for compatibility"

# 4. Push to GitHub
git push origin main
```

## How It Will Work on GitHub Pages

### Page Serving

GitHub Pages will serve:
- `index.html` for root path
- `trips/greece/index.html` for `/travelblog/trips/greece/`
- `map/index.html` for `/travelblog/map/`
- All using relative paths that adapt to the base URL

### Navigation Flow

1. User visits: `https://kthompso99.github.io/travelblog/`
2. Sees homepage with trip cards
3. Clicks "Greece" card
4. Browser navigates to: `./trips/greece/`
5. Resolves to: `https://kthompso99.github.io/travelblog/trips/greece/`
6. GitHub Pages serves: `trips/greece/index.html`
7. Page loads with content ✅

### Why It Works Now

**Before (Absolute Paths):**
```html
<!-- On GitHub Pages at /travelblog/ -->
<a href="/trips/greece/">Greece</a>
<!-- Resolves to: https://kthompso99.github.io/trips/greece/ -->
<!-- ERROR: 404 - file doesn't exist at root! -->
```

**After (Relative Paths):**
```html
<!-- On GitHub Pages at /travelblog/ -->
<a href="./trips/greece/">Greece</a>
<!-- Resolves to: https://kthompso99.github.io/travelblog/trips/greece/ -->
<!-- SUCCESS: file exists! -->
```

## Benefits of Relative Paths

1. **Works on any base path**
   - Root: `example.com/`
   - Subdirectory: `example.com/blog/`
   - GitHub Pages: `username.github.io/repo/`

2. **No configuration needed**
   - No need to set base path
   - No environment variables
   - No build-time substitution

3. **Easy testing**
   - Works on localhost
   - Works on GitHub Pages
   - Works on custom domain

4. **Future-proof**
   - Can move to custom domain without changes
   - Can change hosting without issues

## Troubleshooting

### Issue: Still seeing 404 errors

**Check:**
1. Are HTML files committed and pushed?
   ```bash
   git status
   git add trips/ map/ about/ index.html
   git commit -m "Add SSG HTML files"
   git push
   ```

2. Is GitHub Pages enabled?
   - Go to repo Settings → Pages
   - Source should be "Deploy from branch"
   - Branch should be "main" (or "master")
   - Folder should be "/ (root)"

3. Wait a minute after pushing
   - GitHub Pages needs time to rebuild
   - Check Actions tab for deployment status

### Issue: Images still not loading

**Check:**
1. Are images in the `images/` directory?
   ```bash
   ls -la images/
   ```

2. Are image files committed?
   ```bash
   git add images/
   git commit -m "Add trip images"
   git push
   ```

3. Check browser console for errors
   - Right-click → Inspect → Console tab
   - Look for 404 errors

### Issue: Styles not loading

**Check:**
1. Styles are embedded in HTML (not external files)
2. CDN links for Leaflet are working
3. No browser extensions blocking styles

## Verification

After deployment, view page source and verify:

```html
<!-- Homepage -->
<a href="./trips/greece/">
<img src="./images/greece.jpg">

<!-- Trip page -->
<a href="../../">Back to Home</a>
<a href="../../trips/utah/">Utah</a>
```

All paths should be relative (`./ ` or `../../`), not absolute (`/`).

## Success Criteria

✅ Homepage loads with all trip cards visible
✅ Trip card images display correctly
✅ Clicking a trip card navigates to trip page
✅ Trip pages load without 404 errors
✅ Navigation menu works on all pages
✅ Back button returns to homepage
✅ Map page loads with markers
✅ About page loads with content

## Next Steps

Once GitHub Pages works:

1. **Update domain in config**:
   ```json
   {
     "domain": "https://kthompso99.github.io/travelblog"
   }
   ```

2. **Rebuild for correct SEO URLs**:
   ```bash
   npm run build
   git add .
   git commit -m "Update domain for GitHub Pages"
   git push
   ```

3. **Or set up custom domain**:
   - Buy domain (e.g., twotravelnuts.com)
   - Configure DNS
   - Update GitHub Pages settings
   - Update config/site.json with custom domain
   - Rebuild and deploy

## Summary

The fix was simple but crucial:

**Changed:** All absolute paths (`/`) to relative paths (`./` or `../../`)

**Result:** Site works on localhost AND GitHub Pages AND custom domains

**Files ready to commit:** All HTML files have been regenerated with correct paths

Deploy now and it should work! 🚀
