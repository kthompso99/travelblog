# Deployment Guide

Step-by-step instructions for deploying your travel blog to various hosting platforms.

## Pre-Deployment Steps (All Platforms)

```bash
# 1. Final validation
npm run validate

# 2. Build for production
npm run build

# 3. Run deployment checks
npm run deploy-check
# Checks: config.built.json exists, HTML content, coordinates, thumbnails,
# file sizes, and warns about unoptimized images

# 4. Test locally one more time
npm run serve
```

---

## 1. GitHub Pages (Free)

Deployment is automated via `.github/workflows/deploy.yml`. Every push to `main`
triggers the pipeline — no manual steps needed.

### What the CI Pipeline Does

1. `npm install` + `npm run validate`
2. `npm run build` — full geocode + render
3. Promote homepage: `mv index.html.new index.html`
4. `npm test` — 140 navigation smoke-test assertions
5. Copy output into a `deploy/` directory
6. Upload via the GitHub Pages API (`actions/upload-pages-artifact` + `actions/deploy-pages`)

**Access:** `https://kthompso99.github.io/travelblog/` (or custom domain when configured)

### Manual Build + Push (if needed)

```bash
npm run build
mv index.html index.html.backup
mv index.html.new index.html
npm test                          # verify before pushing
git add index.html about/ map/
git commit -m "Rebuild site"
git push origin main              # triggers CI deploy
```

---

## 2. Netlify (Free)

### Option A: Drag & Drop

1. Go to https://app.netlify.com/
2. Click "Add new site" → "Deploy manually"
3. Drag these files/folders:
   - `index.html`
   - `config.built.json`
   - `images/` (if exists)
4. Done! Get instant URL like `random-name.netlify.app`

### Option B: Git Integration (Recommended)

1. Push your repo to GitHub/GitLab/Bitbucket
2. Connect to Netlify
3. Build settings:
   ```
   Build command: npm run build
   Publish directory: ./
   ```
4. Add to `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "."

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"

[build.environment]
  NODE_VERSION = "18"
```

5. Every push to main auto-deploys!

**Custom Domain:** Settings → Domain management → Add custom domain

---

## 3. Vercel (Free)

### Option A: CLI Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Option B: Git Integration

1. Import project at https://vercel.com/new
2. Configure:
   ```
   Build Command: npm run build
   Output Directory: ./
   Install Command: npm install
   ```
3. Add `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "."
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
```

4. Push to trigger deployment

**Custom Domain:** Settings → Domains → Add

---

## 4. Cloudflare Pages (Free)

1. Go to https://pages.cloudflare.com/
2. Connect Git repository
3. Build settings:
   ```
   Build command: npm run build
   Build output directory: /
   ```
4. Environment variables: None needed
5. Deploy!

**Custom Domain:** Custom domains → Add

---

## 5. AWS S3 + CloudFront

### Step 1: Create S3 Bucket

```bash
# Create bucket
aws s3 mb s3://your-travel-blog

# Upload files
aws s3 sync . s3://your-travel-blog \
  --exclude "*" \
  --include "index.html" \
  --include "config.built.json" \
  --include "images/*"

# Make public
aws s3 website s3://your-travel-blog \
  --index-document index.html
```

### Step 2: CloudFront Distribution

1. Create CloudFront distribution
2. Origin: Your S3 bucket
3. Default root object: `index.html`
4. Wait for deployment (~15 min)

**URL:** `https://d111111abcdef8.cloudfront.net`

---

## 6. Traditional Web Hosting (FTP)

### Using FileZilla/Cyberduck

1. Connect to your hosting via FTP/SFTP
2. Navigate to public_html or www folder
3. Upload:
   - `index.html`
   - `config.built.json`
   - `images/` folder
4. Done!

### Using Command Line

```bash
# Example with scp
scp index.html config.built.json user@yourhost.com:/var/www/html/

# Upload images folder
scp -r images user@yourhost.com:/var/www/html/
```

---

## 7. Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize
firebase init hosting

# Configure:
# - Public directory: .
# - Single-page app: No
# - GitHub actions: Optional

# Deploy
firebase deploy --only hosting
```

`firebase.json`:
```json
{
  "hosting": {
    "public": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**",
      "content/**",
      "*.js",
      "package*.json"
    ]
  }
}
```

---

## Custom Domain Setup

### DNS Configuration

For most platforms, add these records:

**Apex domain (example.com):**
```
Type: A
Name: @
Value: [Platform's IP address]
```

**WWW subdomain:**
```
Type: CNAME
Name: www
Value: [Platform's domain]
```

### Platform-Specific DNS

**Netlify:**
```
Type: A
Name: @
Value: 75.2.60.5

Type: CNAME
Name: www
Value: [your-site].netlify.app
```

**Vercel:**
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**GitHub Pages:**
```
Type: A
Name: @
Values: 
  185.199.108.153
  185.199.109.153
  185.199.110.153
  185.199.111.153

Type: CNAME
Name: www
Value: [username].github.io
```

---

## SSL/HTTPS

All modern platforms provide free SSL:
- **Netlify:** Automatic (Let's Encrypt)
- **Vercel:** Automatic (Let's Encrypt)
- **GitHub Pages:** Automatic
- **Cloudflare Pages:** Automatic
- **Firebase:** Automatic

For traditional hosting, use Let's Encrypt:
```bash
sudo certbot --apache -d yourdomain.com -d www.yourdomain.com
```

---

## Post-Deployment Checklist

```bash
# 1. Check site loads
curl -I https://yoursite.com

# 2. Test all pages
# - Home page
# - Map view
# - Each destination
# - About page

# 3. Test on mobile
# Use Chrome DevTools mobile emulation

# 4. Check console for errors
# Open browser DevTools (F12)

# 5. Test map markers
# Click each marker

# 6. Verify images load
# Check all thumbnails

# 7. Test navigation
# Click through all menu items
```

---

## Performance Optimization

### Enable Compression

**Netlify** (automatic)

**Vercel** (automatic)

**Apache (.htaccess):**
```apache
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/css application/json
</IfModule>
```

**Nginx:**
```nginx
gzip on;
gzip_types text/plain text/css application/json;
```

### Cache Headers

**Netlify (_headers file):**
```
/config.built.json
  Cache-Control: public, max-age=3600

/images/*
  Cache-Control: public, max-age=31536000
```

**Vercel (vercel.json):**
```json
{
  "headers": [
    {
      "source": "/config.built.json",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=3600"
        }
      ]
    }
  ]
}
```

---

## Monitoring & Analytics

### Google Analytics

Add to `index.html` before `</head>`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Plausible Analytics (Privacy-friendly)

```html
<script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
```

---

## Updating Your Site

### After Making Changes

```bash
# 1. Edit content or config
vim content/new-post.md

# 2. Rebuild
npm run build

# 3. Test locally
npm run serve

# 4. Deploy
# Git-based: just push
git add .
git commit -m "Add new destination"
git push

# Manual: re-upload files
# - index.html (if changed)
# - config.built.json (always)
# - images/ (if new images)
```

### Automated Deployment Script

Create `deploy.sh`:

```bash
#!/bin/bash
echo "🚀 Deploying travel blog..."

# Build
npm run build || exit 1

# Deploy check
npm run deploy-check || exit 1

# Deploy based on platform
if [ "$1" == "netlify" ]; then
    netlify deploy --prod
elif [ "$1" == "vercel" ]; then
    vercel --prod
elif [ "$1" == "github" ]; then
    git checkout gh-pages
    cp index.html config.built.json .
    git add .
    git commit -m "Deploy $(date)"
    git push origin gh-pages
    git checkout main
else
    echo "Usage: ./deploy.sh [netlify|vercel|github]"
    exit 1
fi

echo "✅ Deployment complete!"
```

Make executable: `chmod +x deploy.sh`

Use: `./deploy.sh netlify`

---

## Troubleshooting

### "404 Not Found" after deployment
- Check files uploaded correctly
- Verify `index.html` is in root directory
- Check platform-specific publish directory setting

### Images not loading
- Verify `images/` folder uploaded
- Check image paths in config.built.json
- Try absolute URLs if needed

### Map not showing
- Check browser console for errors
- Verify internet connection (needs OpenStreetMap)
- Check if HTTPS is enabled (some APIs require it)

### Slow initial load
- Enable compression (see above)
- Optimize images before uploading
- Consider CDN for images

---

## Cost Comparison

| Platform | Free Tier | Bandwidth | Custom Domain | SSL |
|----------|-----------|-----------|---------------|-----|
| GitHub Pages | Yes | 100GB/mo | Yes | Yes |
| Netlify | Yes | 100GB/mo | Yes | Yes |
| Vercel | Yes | 100GB/mo | Yes | Yes |
| Cloudflare | Yes | Unlimited | Yes | Yes |
| Firebase | Yes | 10GB/mo | Yes | Yes |
| AWS S3 | 12mo free | Pay per GB | Yes | Via CloudFront |

**Recommendation:** Start with Netlify or Vercel for easiest setup.

---

*Need help? Check PROJECT.md or open an issue!*