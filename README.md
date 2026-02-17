# Two Travel Nuts

A static travel blog with server-side HTML generation, interactive Google Maps, and Markdown-based content authoring.

---

## ⚠️ For Developers & AI Assistants

**BEFORE making code changes, READ:**
- **[CONTRIBUTING.md](docs/CONTRIBUTING.md)** - Development guidelines and path management rules
- **[lib/config-paths.js](lib/config-paths.js)** - Single source of truth for all paths

**Key Rule:** Never hardcode paths. Always use `lib/config-paths.js`.

---

## Features

- **Static Site Generation**: Pre-rendered HTML pages for perfect SEO
- **Interactive Trip Maps**: Google Maps with route polylines and amber SVG markers
- **Smart Navigation**: Trip sub-menus and prev/next navigation between locations
- **Markdown Content**: Write travel stories in plain Markdown
- **Geocoding Cache**: Automatic location geocoding via Google Maps API with caching
- **SEO Optimized**: Full meta tags, Open Graph, Twitter Cards, Schema.org
- **Responsive Design**: Side-by-side on desktop, stacked on mobile
- **GitHub Pages Ready**: Deploy-ready with relative paths

---

## Quick Start

```bash
npm install
npm run build
npm run serve        # http://localhost:8000
```

For full setup, daily workflows, and all commands see **[docs/QUICKSTART.md](docs/QUICKSTART.md)**.

---

## Documentation

All documentation is in [`docs/`](docs/) — see **[docs/README.md](docs/README.md)** for the full index.

| Doc | Purpose |
|-----|---------|
| **[docs/FILES.md](docs/FILES.md)** | Primary reference: every file, npm script, page type, build chain |
| **[docs/QUICKSTART.md](docs/QUICKSTART.md)** | Setup, daily workflow, adding trips |
| **[docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)** | Path management rules, adding scripts |
| **[docs/deployment/DEPLOYMENT.md](docs/deployment/DEPLOYMENT.md)** | GitHub Pages, Netlify, Cloudflare |
| **[docs/implementation/SMART_BUILD.md](docs/implementation/SMART_BUILD.md)** | Incremental build system |

---

## Deployment

CI runs automatically on every push to `main` via GitHub Actions:
`npm run build` → `npm test` → deploy to GitHub Pages.

For manual deploys or alternative hosts see **[docs/deployment/DEPLOYMENT.md](docs/deployment/DEPLOYMENT.md)**.

**Live site**: https://kthompso99.github.io/travelblog/

---

## License

MIT. See [LICENSE](LICENSE).
