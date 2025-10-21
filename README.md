# Two Travel Nuts

A modern, SEO-optimized travel blog with static site generation, interactive maps, and lazy-loading architecture.

## 🌟 Features

- **🎯 Static Site Generation (SSG)**: Pre-rendered HTML pages for perfect SEO
- **📍 Interactive World Map**: Click map markers to navigate to destinations
- **🗺️ Smart Navigation**: Continent-based menus with dropdown organization
- **📝 Markdown Content**: Write travel stories in simple markdown format
- **⚡ Lazy Loading**: Fast initial load with on-demand content loading
- **🔍 SEO Optimized**: Full meta tags, Open Graph, Twitter Cards, Schema.org
- **📱 Responsive Design**: Beautiful on all devices
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
│   ├── site.json          # Site configuration (title, domain)
│   ├── index.json         # List of trips to build
│   └── trips/             # Trip configuration files
│       ├── greece.json
│       ├── utah.json
│       └── ...
├── content/
│   └── trips/             # Markdown content by trip
│       ├── greece/
│       │   └── greece.md
│       └── ...
├── trips/                 # Generated trip pages (SSG output)
│   ├── greece/
│   │   └── index.html
│   └── ...
├── map/                   # Generated map page
│   └── index.html
├── about/                 # Generated about page
│   └── index.html
├── lib/                   # Build libraries
│   ├── seo-metadata.js
│   ├── generate-html.js
│   └── generate-sitemap.js
├── templates/             # HTML templates
│   ├── base.html
│   ├── trip-page.html
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

1. **Create trip config** in `config/trips/newtrip.json`:
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
         "place": "Colosseum, Rome",
         "duration": "3 days",
         "file": "content/trips/newtrip/rome.md"
       }
     ]
   }
   ```

2. **Add to index** in `config/index.json`:
   ```json
   {
     "trips": ["greece", "utah", "newtrip"]
   }
   ```

3. **Create content** in `content/trips/newtrip/rome.md`:
   ```markdown
   # Rome

   Our amazing adventure in Rome...
   ```

4. **Rebuild**:
   ```bash
   npm run build
   ```

Done! Your new trip is live.

## 🔧 Development Scripts

```bash
# Validate configuration
npm run validate

# Build static site
npm run build

# Watch for changes (auto-rebuild)
npm run watch

# Run local development server
npm run serve

# Pre-deployment checks
npm run deploy-check
```

## 🛠️ Technologies

- **Build**: Node.js, Custom SSG
- **Markdown**: marked.js
- **Maps**: Leaflet.js + OpenStreetMap
- **Geocoding**: Nominatim API
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
