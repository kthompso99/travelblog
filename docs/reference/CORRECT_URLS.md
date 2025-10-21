# Correct URLs for Your GitHub Pages Site

## Your Site Structure

Your repository: `kthompso99/travelblog`

GitHub Pages URL format: `https://{username}.github.io/{repository}/`

## ✅ Correct URLs

### Homepage
```
https://kthompso99.github.io/travelblog/
```

### Trip Pages
```
https://kthompso99.github.io/travelblog/trips/greece/
https://kthompso99.github.io/travelblog/trips/southernafrica/
https://kthompso99.github.io/travelblog/trips/utah/
https://kthompso99.github.io/travelblog/trips/newzealand/
```

### Other Pages
```
https://kthompso99.github.io/travelblog/map/
https://kthompso99.github.io/travelblog/about/
```

## ❌ Wrong URLs (Missing `/travelblog/`)

These will give "There isn't a GitHub Pages site here":

```
❌ https://kthompso99.github.io/trips/greece
❌ https://kthompso99.github.io/map
❌ https://kthompso99.github.io/about
```

**Why?** GitHub Pages expects the repository name in the path!

## How Navigation Works

### When Clicking Links (Automatic)

When you click links on your homepage, they work automatically:

1. You're at: `https://kthompso99.github.io/travelblog/`
2. You click link: `<a href="./trips/greece/">`
3. Browser resolves to: `https://kthompso99.github.io/travelblog/trips/greece/`
4. ✅ Works!

### When Typing URLs Manually

You **must include** `/travelblog/` in the path:

```
Type this: https://kthompso99.github.io/travelblog/trips/greece/
Not this:  https://kthompso99.github.io/trips/greece
```

## Testing Checklist

After deploying, test by **clicking** links from homepage:

1. Visit: `https://kthompso99.github.io/travelblog/`
2. Click on "Greece" card
3. Should navigate to trip page ✅
4. Click "Back to Home"
5. Should return to homepage ✅
6. Click "Trips" menu → "Greece"
7. Should navigate to trip page ✅

## Bookmarks / Direct Access

If you want to bookmark or share direct links, use the full URL:

**Share this:**
```
https://kthompso99.github.io/travelblog/trips/greece/
```

**Not this:**
```
https://kthompso99.github.io/trips/greece  ← Missing /travelblog/
```

## Future: Custom Domain

When you set up a custom domain (like `twotravelnuts.com`), the URLs will simplify:

```
Homepage:  https://twotravelnuts.com/
Greece:    https://twotravelnuts.com/trips/greece/
Map:       https://twotravelnuts.com/map/
```

No `/travelblog/` needed because the repository name isn't in the path!

## Summary

✅ **Correct usage**: Click links on your site (they use relative paths)
✅ **Correct URLs**: Include `/travelblog/` when typing manually
❌ **Wrong**: Typing URLs without `/travelblog/`

The site works correctly - just make sure you're using the right URLs!
