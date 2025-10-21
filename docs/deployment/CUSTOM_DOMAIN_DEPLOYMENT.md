# Custom Domain Deployment Options

## Goal: Clean URLs Without `/travelblog/`

You want:
- ✅ `twotravelnuts.com/trips/greece/`
- ❌ NOT `twotravelnuts.com/travelblog/trips/greece/`

Good news: With a custom domain, the `/travelblog/` disappears automatically!

## Option 1: GitHub Pages + Custom Domain (Easiest)

### Pros
- Already set up on GitHub
- Free hosting
- Automatic HTTPS
- No migration needed

### Steps

1. **Buy domain** (Namecheap, Google Domains, Cloudflare, etc.)
   - Approximately $10-15/year

2. **Configure DNS** (in your domain registrar):
   ```
   Type: A Record
   Name: @
   Value: 185.199.108.153

   Type: A Record
   Name: @
   Value: 185.199.109.153

   Type: A Record
   Name: @
   Value: 185.199.110.153

   Type: A Record
   Name: @
   Value: 185.199.111.153

   Type: CNAME Record
   Name: www
   Value: kthompso99.github.io
   ```

3. **Configure GitHub Pages**:
   - Go to: https://github.com/kthompso99/travelblog/settings/pages
   - Under "Custom domain", enter: `twotravelnuts.com`
   - Save
   - Wait for DNS check (may take a few minutes)
   - Enable "Enforce HTTPS" (after DNS propagates)

4. **Update site config**:
   ```bash
   # Edit config/site.json
   nano config/site.json
   ```

   Change:
   ```json
   {
     "title": "Two Travel Nuts",
     "description": "Exploring the world, one destination at a time",
     "domain": "https://twotravelnuts.com"
   }
   ```

5. **Rebuild and deploy**:
   ```bash
   npm run build
   git add .
   git commit -m "Update domain to twotravelnuts.com"
   git push
   ```

6. **Done!** Visit `twotravelnuts.com/trips/greece/`

### Result
```
✅ https://twotravelnuts.com/
✅ https://twotravelnuts.com/trips/greece/
✅ https://www.twotravelnuts.com/trips/greece/ (with www)
```

No `/travelblog/` in URL!

---

## Option 2: Cloudflare Pages (Fast & Feature-Rich)

### Pros
- Ultra-fast global CDN
- Unlimited bandwidth
- Built-in analytics
- More control than GitHub Pages
- Still free!

### Steps

1. **Create Cloudflare account**: https://pages.cloudflare.com/

2. **Connect GitHub**:
   - Click "Create a project"
   - Connect to GitHub
   - Select `kthompso99/travelblog` repository

3. **Configure build**:
   ```
   Build command: npm run build
   Build output directory: / (root)
   Root directory: / (leave blank)
   ```

   **Important**: Cloudflare Pages will deploy the entire repo, including all HTML files we generated.

4. **Deploy**:
   - Click "Save and Deploy"
   - Wait for deployment (~2 minutes)
   - You'll get a URL like: `travelblog-abc.pages.dev`

5. **Add custom domain**:
   - In Cloudflare Pages dashboard, go to "Custom domains"
   - Click "Set up a custom domain"
   - Enter: `twotravelnuts.com`
   - Cloudflare will configure DNS automatically (if domain is on Cloudflare)
   - Or give you DNS records to add manually

6. **Update site config**:
   ```bash
   # Edit config/site.json
   nano config/site.json
   ```

   Change domain to: `"https://twotravelnuts.com"`

7. **Rebuild and push**:
   ```bash
   npm run build
   git add .
   git commit -m "Update domain for Cloudflare Pages"
   git push
   ```

   Cloudflare auto-deploys on every push!

### Result
```
✅ https://twotravelnuts.com/
✅ https://twotravelnuts.com/trips/greece/
✅ https://travelblog-abc.pages.dev/ (preview URL)
```

### Bonus Features
- **Branch previews**: Every git branch gets its own preview URL
- **Analytics**: Built-in visitor analytics
- **Web Analytics**: Privacy-first analytics (optional)

---

## Option 3: Netlify (Popular Choice)

### Pros
- Easy to use
- Built-in forms (if you add contact form later)
- Branch deployments
- Free tier is generous

### Steps

1. **Create Netlify account**: https://netlify.com

2. **Connect GitHub**:
   - Click "Add new site" → "Import an existing project"
   - Choose GitHub
   - Select `kthompso99/travelblog`

3. **Configure build**:
   ```
   Build command: npm run build
   Publish directory: / (root)
   ```

4. **Deploy**:
   - Click "Deploy site"
   - Wait for deployment
   - You'll get a URL like: `random-name-123.netlify.app`

5. **Add custom domain**:
   - In site settings, go to "Domain management"
   - Click "Add custom domain"
   - Enter: `twotravelnuts.com`
   - Follow DNS configuration instructions

6. **Update site config and rebuild** (same as other options)

### Result
```
✅ https://twotravelnuts.com/
✅ https://twotravelnuts.com/trips/greece/
✅ https://random-name-123.netlify.app/ (preview URL)
```

**Note**: Our `_redirects` file is already configured for Netlify!

---

## Comparison

| Feature | GitHub Pages | Cloudflare Pages | Netlify |
|---------|--------------|------------------|---------|
| **Free tier** | Yes | Yes | Yes |
| **Custom domain** | Yes | Yes | Yes |
| **HTTPS** | Auto | Auto | Auto |
| **Build on push** | No* | Yes | Yes |
| **Analytics** | No | Yes (basic) | Yes (basic) |
| **CDN** | Yes | Yes (fastest) | Yes |
| **Bandwidth** | Soft limit | Unlimited | 100GB/mo |
| **Builds/month** | N/A | 500 | 300 |
| **Setup difficulty** | Easy | Easy | Easy |

\* GitHub Pages doesn't run npm build - we build locally and commit HTML files

## Recommendation

### For Simplest Setup: GitHub Pages + Custom Domain
- You're already on GitHub
- Just add DNS records
- No migration needed
- ✅ **Best choice if you want minimal changes**

### For Best Performance: Cloudflare Pages
- Fastest global CDN
- Automatic deployments
- Built-in analytics
- ✅ **Best choice for speed and features**

### For Most Features: Netlify
- Great developer experience
- Form handling built-in
- Lots of integrations
- ✅ **Best choice if you plan to add forms/contact page**

---

## DNS Propagation Time

After setting up DNS:
- **Minimum**: 5 minutes
- **Typical**: 30 minutes to 2 hours
- **Maximum**: 24-48 hours (rare)

Test with: https://dnschecker.org/

---

## Cost Breakdown

### Domain Registration
- **.com domain**: ~$12/year (Namecheap, Google Domains)
- **.com domain**: ~$10/year (Cloudflare - cheapest, no markup)

### Hosting
- **All options**: $0/month (completely free!)

**Total cost**: ~$10-12/year (just the domain)

---

## After Custom Domain Setup

### Update SEO Metadata

1. **Update config/site.json**:
   ```json
   {
     "domain": "https://twotravelnuts.com"
   }
   ```

2. **Rebuild**:
   ```bash
   npm run build
   ```

3. **Commit and push**:
   ```bash
   git add .
   git commit -m "Update domain for production"
   git push
   ```

### Submit to Search Engines

1. **Google Search Console**: https://search.google.com/search-console
   - Add property: `twotravelnuts.com`
   - Verify ownership (DNS verification recommended)
   - Submit sitemap: `https://twotravelnuts.com/sitemap.xml`

2. **Bing Webmaster Tools**: https://www.bing.com/webmasters
   - Add site
   - Submit sitemap

### Update Social Media

Share your new URLs:
- Facebook: `https://twotravelnuts.com/trips/greece/`
- Twitter: Will show rich card with image
- LinkedIn: Will show preview

Test previews:
- Facebook: https://developers.facebook.com/tools/debug/
- LinkedIn: https://www.linkedin.com/post-inspector/

---

## FAQ

### Q: Will my GitHub Pages URL still work?

**A**: Yes! Both will work:
- `https://kthompso99.github.io/travelblog/` (still works)
- `https://twotravelnuts.com/` (new custom domain)

GitHub will redirect the old URL to the new domain automatically.

### Q: Do I need to change any code?

**A**: Only the domain in `config/site.json`. The relative paths work on any domain!

### Q: What if I want to change hosting later?

**A**: Easy! Just update DNS to point to new host. Your code works anywhere because of relative paths.

### Q: Can I use `www.twotravelnuts.com`?

**A**: Yes! Set up both:
- `twotravelnuts.com` (apex/root domain)
- `www.twotravelnuts.com` (www subdomain)

Both will work. Typically one redirects to the other.

---

## Summary

✅ **Custom domain removes `/travelblog/` from URL**
✅ **Your code already works with custom domains** (thanks to relative paths!)
✅ **No code changes needed** (just update domain in config)
✅ **Multiple free hosting options available**
✅ **Domain costs ~$10-12/year, hosting is free**

**Recommended**: Start with GitHub Pages + Custom Domain (easiest), then consider Cloudflare Pages if you want better performance.

Your URLs will be clean:
```
https://twotravelnuts.com/
https://twotravelnuts.com/trips/greece/
https://twotravelnuts.com/map/
```

Perfect! 🎉
