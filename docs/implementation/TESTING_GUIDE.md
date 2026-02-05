# SSG Testing Guide

## Quick Testing Checklist

Before deploying, test these items locally:

### 1. Verify Domain

Confirm `config/site.json` has the correct domain (currently `https://twotravelnuts.com`).
If it needs changing, update and rebuild:

```bash
nano config/site.json   # update "domain"
npm run build
mv index.html index.html.backup
mv index.html.new index.html
```

### 2. Start Local Server

```bash
npm run serve
```

Server runs on http://localhost:8000

### 3. Test Static Pages

Open in browser and verify content loads:

- [ ] Homepage: http://localhost:8000/
- [ ] Greece trip: http://localhost:8000/trips/greece/
- [ ] Southern Africa trip: http://localhost:8000/trips/southernafrica/
- [ ] Utah trip: http://localhost:8000/trips/utah/
- [ ] New Zealand trip: http://localhost:8000/trips/newzealand/
- [ ] Map page: http://localhost:8000/map/
- [ ] About page: http://localhost:8000/about/

### 4. Verify SEO Metadata

For each trip page, view page source (right-click → View Page Source):

**Check for:**

- [ ] `<title>` tag includes trip name
- [ ] `<meta name="description">` exists
- [ ] `<meta property="og:title">` exists (Open Graph)
- [ ] `<meta property="og:image">` points to cover image
- [ ] `<meta property="twitter:card">` exists
- [ ] `<script type="application/ld+json">` exists (Schema.org)

**Example for Greece trip:**

```html
<title>Athens and Greek Islands | Two Travel Nuts</title>
<meta property="og:title" content="Athens and Greek Islands | Two Travel Nuts">
<meta property="og:image" content="https://your-domain.com/images/greece.jpg">
```

### 5. Test Navigation

- [ ] Click trip cards on homepage → loads trip page
- [ ] Click "Trips" menu → shows continent dropdown
- [ ] Click trip from menu → loads trip page
- [ ] Click "Map" → shows map with markers
- [ ] Click "About" → shows about page
- [ ] Click "Back to Home" → returns to homepage

### 6. Test Responsive Design

- [ ] Resize browser window → layout adapts
- [ ] Test on mobile device or mobile emulator
- [ ] Navigation menu works on mobile

### 7. Test with JavaScript Disabled

1. Disable JavaScript in browser
2. Visit homepage → should load normally
3. Click trip card → should navigate to trip page
4. Content should display (no blank pages)

This tests progressive enhancement!

### 8. Validate Generated Files

Check that files were created:

```bash
# List static HTML pages
ls -lh trips/*/index.html

# Check sitemap
cat sitemap.xml

# Check robots.txt
cat robots.txt

# Verify homepage
head -50 index.html
```

### 9. Online SEO Validation (After Domain Update)

Once you've updated the domain and deployed:

#### Google Rich Results Test
1. Visit: https://search.google.com/test/rich-results
2. Enter URL: `https://your-domain.com/trips/greece/`
3. Should show: "Page is eligible for rich results"
4. Check "TravelAction" structured data is detected

#### Open Graph Debugger
1. Visit: https://www.opengraph.xyz/
2. Enter trip URL
3. Check preview image and text appear correctly
4. Should show trip title, description, cover image

#### Twitter Card Validator
1. Visit: https://cards-dev.twitter.com/validator
2. Enter trip URL
3. Should show "summary_large_image" card type
4. Preview should display correctly

#### XML Sitemap Validator
1. Visit: https://www.xml-sitemaps.com/validate-xml-sitemap.html
2. Enter: `https://your-domain.com/sitemap.xml`
3. Should validate without errors
4. Should list all 7 URLs (home, map, about, 4 trips)

### 10. Performance Testing

Check page load speed:

1. Visit: https://pagespeed.web.dev/
2. Test homepage
3. Test a trip page
4. Should score well on:
   - First Contentful Paint
   - Largest Contentful Paint
   - Cumulative Layout Shift

### 11. Social Media Preview Testing

Share a trip URL on:

- [ ] Facebook (should show rich preview with image)
- [ ] Twitter (should show card with image)
- [ ] LinkedIn (should show preview with image)

If previews don't update immediately, use these debugging tools:

**Facebook:**
https://developers.facebook.com/tools/debug/

**LinkedIn:**
https://www.linkedin.com/post-inspector/

### 12. Browser Testing

Test in multiple browsers:

- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

## Common Issues & Fixes

### Issue: Homepage shows old SPA version

**Fix:**
```bash
mv index.html index.html.backup
mv index.html.new index.html
```

### Issue: Trip images not showing

**Check:**
1. Are images in `images/` directory?
2. Do trip configs have correct image paths?
3. Is domain set correctly in config/site.json?

### Issue: SEO tools show domain as "example.com"

**Fix:**
```bash
# Update config/site.json
# Change domain to your actual domain
npm run build
```

### Issue: Links returning to homepage instead of trip page

**Check:**
1. Are HTML files in correct location? (`trips/{slug}/index.html`)
2. Is `_redirects` file deployed?
3. Test locally first with `npm run serve`

### Issue: Map not showing

**Cause:** Leaflet CDN might be slow or blocked

**Fix:** Check browser console for errors, ensure internet connection

## Testing Complete?

Once you've verified:
- ✅ All pages load correctly
- ✅ SEO metadata is present
- ✅ Domain is updated
- ✅ Navigation works
- ✅ Content displays properly
- ✅ No console errors

You're ready to deploy!

## Deployment

```bash
# If using Netlify CLI
netlify deploy --prod

# Or push to git and let auto-deploy handle it
git add .
git commit -m "Add SSG with SEO optimization"
git push
```

**Note:** Don't commit yet - wait for your testing!
