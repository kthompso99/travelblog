# CLAUDE.md

### How Kevin and Claude Work Together
- Writing conventions for MD files: always use "Kevin" or "Claude", avoid pronouns.

### Planning Protocol
- Always plan before implementation.
- Discuss overall strategy before writing code or making edits.
- Ask clarifying questions one at a time so Kevin can give complete answers.
- Get approval on the approach before implementation.
- Focus on understanding requirements and flow first.
- After completing each task, ask if Kevin has questions about what was just done.

---

### Architecture Quick-Reference

- **Generator:** `lib/generate-html.js` — single CommonJS file, renders all pages from templates.
- **Path config:** `lib/config-paths.js` — single source of truth for every path. Never hardcode.
- **Master template:** `templates/base.html` — all shared CSS, nav, footer.
- **Trip intro template:** `templates/trip-intro-page.html` — hero injected via `{{PRE_MAIN}}` placeholder.
- **Build:** `npm run build` (full) or `npm run build:smart` (incremental). Test: `npm test` (140 nav + 28 filter assertions via jsdom).
- **Homepage:** build writes `index.html.new`; must manually promote to `index.html` before committing.
- **Colour scheme:** amber `#f59e0b` throughout — polyline, markers (SVG divIcon), button accents, nav hover.
- **Maps:** Two Leaflet instances — global (map page) and per-trip (trip intro). Amber SVG divIcon markers. Popup hover-linger: 300 ms delay on mouseout, cancelled by mouseenter on popup. Nav z-index must stay ≥ 2000.
- **Gitignore gotchas:** `/trips/` output is gitignored; only `index.html`, `about/`, `map/` outputs are tracked. `index.html.backup` and `.build-cache.json` also ignored. `docs/Figma Design/` has a space — quote in shell.
- **CI:** `.github/workflows/deploy.yml` — build → promote homepage → `npm test` → copy to `deploy/` → Pages API. Deploy step copies: index.html, 404.html, config.built.json, sitemap.xml, images/, trips/, map/, about/, robots.txt.
- **Scale target:** Kevin anticipates 30–50 trips long-term. Design decisions should hold at that count without re-architecting. Client-side filtering/searching of homepage cards is fine up to hundreds; image lazy-loading on the homepage becomes relevant around 30+ trips. Pagination is not needed at 50 but may be considered for UX.
- **Deferred work:** `docs/Figma Design/REMAINING.md` — homepage hero, photo gallery, newsletter.
