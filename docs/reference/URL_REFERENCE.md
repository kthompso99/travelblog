# Quick URL Reference

## Your GitHub Pages URLs

### Homepage
```
✅ https://kthompso99.github.io/travelblog/
```

### Trip Pages (Note: includes /trips/)
```
✅ https://kthompso99.github.io/travelblog/trips/greece/
✅ https://kthompso99.github.io/travelblog/trips/southernafrica/
✅ https://kthompso99.github.io/travelblog/trips/utah/
✅ https://kthompso99.github.io/travelblog/trips/newzealand/
```

### Other Pages
```
✅ https://kthompso99.github.io/travelblog/map/
✅ https://kthompso99.github.io/travelblog/about/
```

## Common Mistakes

### ❌ Missing /trips/
```
❌ https://kthompso99.github.io/travelblog/greece
   (redirects to homepage - file doesn't exist here)

✅ https://kthompso99.github.io/travelblog/trips/greece/
   (correct - file exists at trips/greece/index.html)
```

### ❌ Missing /travelblog/
```
❌ https://kthompso99.github.io/trips/greece/
   (404 - missing repository name)

✅ https://kthompso99.github.io/travelblog/trips/greece/
   (correct - includes repository name)
```

### ❌ Missing trailing slash (usually still works, but better with it)
```
⚠️  https://kthompso99.github.io/travelblog/trips/greece
   (GitHub might redirect, but not guaranteed)

✅ https://kthompso99.github.io/travelblog/trips/greece/
   (correct - trailing slash for directory)
```

## File Structure

Your deployed files look like this:

```
/travelblog/                          ← Repository root
├── index.html                        ← Homepage
├── trips/                            ← Trips directory
│   ├── greece/                       ← Greece trip directory
│   │   └── index.html                ← Greece page
│   ├── southernafrica/
│   │   └── index.html
│   ├── utah/
│   │   └── index.html
│   └── newzealand/
│       └── index.html
├── map/
│   └── index.html
└── about/
    └── index.html
```

**Notice**: There is NO `greece/index.html` at the root level!

The file is at: `trips/greece/index.html`

So the URL must be: `.../travelblog/trips/greece/`

## How to Navigate

### Click Links (Best Way)
1. Go to: `https://kthompso99.github.io/travelblog/`
2. Click on Greece card
3. Browser automatically navigates to: `https://kthompso99.github.io/travelblog/trips/greece/`

### Type URL Manually
Always include the full path:
```
https://kthompso99.github.io/travelblog/trips/greece/
                                        ^^^^^^^^^^^^
                                        directory structure
```

## With Custom Domain (Future)

When you set up `twotravelnuts.com`, URLs will be:

```
✅ https://twotravelnuts.com/
✅ https://twotravelnuts.com/trips/greece/
✅ https://twotravelnuts.com/map/
✅ https://twotravelnuts.com/about/
```

**Note**: Still includes `/trips/` but no `/travelblog/`!

## Quick Test

Right now, open these URLs in your browser:

1. ✅ Homepage: https://kthompso99.github.io/travelblog/
2. ✅ Greece (correct): https://kthompso99.github.io/travelblog/trips/greece/
3. ❌ Greece (wrong): https://kthompso99.github.io/travelblog/greece ← Will redirect to homepage

## Bookmarks for Easy Access

Save these bookmarks:

```
Homepage:        https://kthompso99.github.io/travelblog/
Southern Africa: https://kthompso99.github.io/travelblog/trips/southernafrica/
Greece:          https://kthompso99.github.io/travelblog/trips/greece/
Utah:            https://kthompso99.github.io/travelblog/trips/utah/
New Zealand:     https://kthompso99.github.io/travelblog/trips/newzealand/
Map:             https://kthompso99.github.io/travelblog/map/
About:           https://kthompso99.github.io/travelblog/about/
```

## Summary

The key thing to remember:

**Trip pages are in the `/trips/` directory!**

Not at root level. So always include `/trips/` in the URL:

```
✅ .../travelblog/trips/greece/
❌ .../travelblog/greece
```
