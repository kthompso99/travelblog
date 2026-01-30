# Two Travel Nuts

A modern, SEO-optimized travel blog with static site generation, interactive maps, and lazy-loading architecture.

---

## ⚠️ For Developers & AI Assistants

**BEFORE making code changes, READ:**
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Development guidelines (START HERE!)
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Configuration management (REQUIRED!)
- **[lib/config-paths.js](lib/config-paths.js)** - Single source of truth for all paths

**Key Rule:** Never hardcode paths. Always use `lib/config-paths.js`.

---

## 🌟 Features

- **🎯 Static Site Generation (SSG)**: Pre-rendered HTML pages for perfect SEO
- **📍 Interactive Trip Maps**: Leaflet maps with route visualization and hover markers
- **🗺️ Smart Navigation**: Trip sub-menus and prev/next navigation between locations
- **📝 Markdown Content**: Write travel stories in simple markdown format
- **🚶 Trip Organization**: Intro pages with table of contents + individual location pages
- **⚡ Geocoding Cache**: Automatic location geocoding with caching
- **🔍 SEO Optimized**: Full meta tags, Open Graph, Twitter Cards, Schema.org
- **📱 Responsive Design**: Beautiful on all devices (side-by-side on desktop, stacked on mobile)
- **🚀 GitHub Pages Ready**: Deploy-ready with relative paths

## 🏗️ Architecture

**Hybrid SSG + SPA Approach:**
- First page load: Static HTML (instant, SEO-friendly)
- Navigation: Lazy-loaded content (smooth, fast)
- Progressive enhancement: Works with or without JavaScript

**Performance:**
- Initial load: ~15KB (index + config)
- Per trip load: ~13-2461KB on demand
- 600x performance improvement over full-load architecture

## 📋 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/kthompso99/travelblog.git
cd travelblog

# Install dependencies
npm install

# Build the site
npm run build

# Start local server
npm run serve
```

Visit `http://localhost:8000`

## 📁 Project Structure

```
travelblog/
├── index.html              # Homepage (SSG-generated)
├── config/
│   └── site.json          # Site configuration (title, domain)
├── content/
│   ├── index.json         # List of trips to build
│   └── trips/             # Trip directories (self-contained)
│       ├── greece/
│       │   ├── trip.json         # Trip configuration
│       │   ├── main.md           # Trip intro (required)
│       │   ├── milos.md          # Individual location
│       │   ├── santorini.md
│       │   ├── paros.md
│       │   └── athens.md
│       └── ...
├── trips/                 # Generated trip pages (SSG output)
│   ├── greece/
│   │   ├── index.html            # Trip intro with map & TOC
│   │   ├── milos.html            # Location pages
│   │   ├── santorini.html
│   │   ├── paros.html
│   │   └── athens.html
│   └── ...
├── map/                   # Generated map page
│   └── index.html
├── about/                 # Generated about page
│   └── index.html
├── _cache/                # Build cache
│   └── geocode.json       # Geocoding cache
├── lib/                   # Build libraries
│   ├── seo-metadata.js
│   ├── generate-html.js
│   └── generate-sitemap.js
├── templates/             # HTML templates
│   ├── base.html
│   ├── trip-page.html
│   ├── trip-intro-page.html      # Intro with map & TOC
│   ├── trip-location-page.html   # Location with prev/next
│   └── home-page.html
├── build.js               # Main build script
├── validate.js            # Configuration validator
└── docs/                  # Documentation (see below)
```

## 📚 Documentation

All documentation is organized in the [`docs/`](docs/) directory:

### Getting Started
- **[Quick Start](docs/reference/QUICKSTART.md)** - Get up and running
- **[URL Reference](docs/reference/URL_REFERENCE.md)** - All correct URLs

### Deployment
- **[Ready to Deploy](docs/deployment/READY_TO_DEPLOY.md)** - Deploy to GitHub Pages
- **[Custom Domain Setup](docs/deployment/CUSTOM_DOMAIN_DEPLOYMENT.md)** - Set up your domain
- **[GitHub Pages Fix](docs/deployment/GITHUB_PAGES_FIX.md)** - Path configuration details

### Development
- **[SSG Implementation](docs/implementation/SSG_IMPLEMENTATION.md)** - How SSG works
- **[Testing Guide](docs/implementation/TESTING_GUIDE.md)** - Test before deploying

See **[docs/README.md](docs/README.md)** for complete documentation index.

## 🚀 Deployment

### Current Deployment
- **GitHub Pages**: https://kthompso99.github.io/travelblog/

### Deploy to GitHub Pages

```bash
# Build the site
npm run build

# Commit and push
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main
```

GitHub Pages will automatically serve your site!

### Deploy with Custom Domain

See **[Custom Domain Deployment Guide](docs/deployment/CUSTOM_DOMAIN_DEPLOYMENT.md)** for:
- GitHub Pages + Custom Domain
- Cloudflare Pages
- Netlify

## ✨ Adding New Trips

Every trip requires:
1. A trip configuration file
2. A `main.md` intro file (required)
3. Individual location markdown files
4. Entry in index.json

### Step-by-Step Guide

1. **Create trip directory**: `content/trips/newtrip/`

2. **Create trip config** in `content/trips/newtrip/trip.json`:
   ```json
   {
     "id": "newtrip",
     "title": "Amazing New Trip",
     "slug": "newtrip",
     "published": true,
     "beginDate": "2025-01-01",
     "endDate": "2025-01-14",
     "metadata": {
       "continent": "Europe",
       "country": "Italy"
     },
     "coverImage": "images/newtrip.jpg",
     "thumbnail": "images/newtrip.jpg",
     "mapCenter": "Rome",
     "content": [
       {
         "type": "location",
         "title": "Rome",
         "place": "Rome, Italy",
         "duration": "3 days",
         "file": "content/trips/newtrip/rome.md"
       },
       {
         "type": "location",
         "title": "Florence",
         "place": "Florence, Italy",
         "duration": "2 days",
         "file": "content/trips/newtrip/florence.md"
       }
     ]
   }
   ```

3. **Add to index** in `content/index.json`:
   ```json
   {
     "trips": ["greece", "utah", "newtrip"]
   }
   ```

4. **Create intro content** in `content/trips/newtrip/main.md`:
   ```markdown
   # Italy Adventure 2025

   Our incredible journey through Italy, exploring ancient history and Renaissance art...
   ```

5. **Create location content** in `content/trips/newtrip/rome.md`:
   ```markdown
   # Rome

   Our amazing adventure in Rome...
   ```

   And `content/trips/newtrip/florence.md`:
   ```markdown
   # Florence

   The birthplace of the Renaissance...
   ```

6. **Rebuild**:
   ```bash
   npm run build
   ```

Done! Your new trip will have:
- Intro page at `trips/newtrip/` with interactive map and table of contents
- Location pages: `trips/newtrip/rome.html`, `trips/newtrip/florence.html`
- Trip sub-menu navigation on all pages
- Previous/Next navigation between locations

## 🔧 Development Scripts

```bash
# Validate configuration
npm run validate

# Build static site (full build)
npm run build

# Smart build (only rebuilds changed files) ⚡
npm run build:smart

# Watch for changes (auto-rebuild)
npm run watch

# Run local development server
npm run serve

# Pre-deployment checks
npm run deploy-check
```

### Smart Build System ⚡

The smart build system detects file changes and skips unnecessary work:

```bash
# Normal use - only rebuilds what changed
npm run build:smart

# Force full rebuild
npm run build:smart -- --force
```

**Benefits:**
- ✅ Skips builds when nothing changed
- ✅ Detects which trips need rebuilding
- ✅ Saves time as your site grows
- ✅ Safe fallback to full build when needed

See [Smart Build Documentation](docs/implementation/SMART_BUILD.md) for details.

## 🛠️ Technologies

- **Build**: Node.js, Custom SSG
- **Markdown**: marked.js
- **Maps**: Leaflet.js + OpenStreetMap tiles
- **Geocoding**: Nominatim API with caching
- **Templates**: Custom HTML templating system
- **Deployment**: GitHub Pages / Cloudflare Pages / Netlify
- **SEO**: Open Graph, Twitter Cards, Schema.org

## 📝 License

MIT License - Feel free to use this for your own travel blog!

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 📧 Contact

Questions? Open an issue on GitHub.

---

**Live Site**: https://kthompso99.github.io/travelblog/

**Documentation**: [docs/README.md](docs/README.md)

Happy traveling! 🌍✈️
