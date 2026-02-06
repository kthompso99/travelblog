# Figma Design — Remaining Work

Items from the Figma mockups that have not yet been implemented.
Each section below is a self-contained conversation / work item.

---

## Homepage Hero (full-bleed photo)

The Figma homepage mockup shows a 500px full-bleed hero with a background
photograph, dark overlay gradient, large centered title, subtitle, and an
amber-to-orange gradient CTA button ("Explore Our Adventures →").

**What's needed:**
- A hero image asset. The Figma mockup uses a stock travel photo (passport,
  world map, sunglasses). Could use one of the existing trip photos, or source
  a new one. Goes in `images/` at the project root.
- Restructure `home-page.html` to include a hero section above the trip grid.
  Same pattern as the trip-detail hero already implemented: a `{{PRE_MAIN}}`
  block with `.trip-hero` / `.trip-hero-bg` / `.trip-hero-overlay` / content.
- The CTA button links to the trip grid (anchor `#destination-grid` or just
  scroll). Style: `linear-gradient(to right, #f59e0b, #ea580c)`, pill shape,
  shadow, hover lifts 2px.
- The current text-only `.hero` block in `home-page.html` (h1 + p) would be
  replaced by the full-bleed hero. The "Featured Trips" heading and grid stay
  below it.

**CSS already in place:** `.trip-hero`, `.trip-hero-bg`, `.trip-hero-overlay`,
`.trip-hero-content`, `.trip-hero-back` (in `base.html`). The CTA button style
would be new (`.btn-primary` per the Figma design guide).

---

## Photo Gallery (Masonry + Lightbox)

**Status:** Implementation in progress (convention-based markdown approach)

The Figma shows a masonry photo gallery on trip pages with hover zoom,
caption slide-up, and a full-screen lightbox with prev/next navigation.

### Implementation Approach (Chosen: Option 4 - Convention-Based Markdown)

**Convention:** For each location, the generator auto-discovers optional gallery
files using the pattern `{location-slug}-gallery.md`. If found, a masonry gallery
is appended to that location's page. If not found, no gallery is rendered (no
error).

**Gallery File Format:**
```markdown
![Caption text for SEO and display](images/Photo-01.jpg)
![Another photo caption](images/Photo-02.jpg)
```

The markdown `![alt](src)` syntax provides both alt text (for accessibility/SEO)
and visible captions. The generator extracts these and builds the gallery HTML.

**Examples:**
- `athens.md` + `athens-gallery.md` → Athens page with gallery
- `milos.md` (no gallery file) → Milos page without gallery
- `paros.md` + `paros-gallery.md` → Paros page with gallery

**Benefits:**
- No trip.json bloat (galleries don't clutter config files)
- Markdown-native caption authoring
- Optional per-location (not all locations need galleries)
- Alt text automatic (caption serves double duty)
- Easy to manage (one file per gallery)

### Implementation Checklist

- [x] Decide on data format (markdown files)
- [x] Update `scripts/build.js` to detect `{slug}-gallery.md` files during build
- [x] Parse gallery markdown to extract images and captions
- [x] Generate masonry gallery HTML in `lib/generate-html.js`
- [x] Add masonry CSS layout (column-count: 1/2/3 at breakpoints)
- [x] Add hover effects (scale 110%, brightness drop, magnifying glass icon, caption slide-up)
- [x] Integrate GLightbox library (~25 KB, MIT) for lightbox functionality
- [x] Add lightbox HTML/CSS (full-screen modal, prev/next, counter, keyboard nav)
- [ ] Update validation to optionally check gallery image file existence
- [x] Test with greece trip (Athens location with 4 photos)

### Technical Notes

- **Build:** Generator checks for `{location-slug}-gallery.md` during location
  page generation. If present, parses markdown and appends gallery HTML.
- **Layout:** CSS `column-count` masonry (1 / 2 / 3 columns at breakpoints).
  All styles in `FIGMA_SYSTEM_DESIGN.md` under "Photo Gallery".
- **Hover:** Image scales to 110%, brightness drops, centered zoom icon and
  bottom caption slide up.
- **Lightbox:** GLightbox library provides full-screen modal with prev/next
  chevrons, "3 / 24" counter, and keyboard nav (← → Esc).
- **Alt text:** Caption field from markdown serves as both `alt=""` attribute
  and visible caption text (single source of truth).

**Feasibility:** Medium effort. Markdown parsing and masonry CSS are
straightforward. Using GLightbox library eliminates custom lightbox JS. The
build already copies `images/` to output — no change needed. Greece trip has 66
photos; gallery renders conditionally per location.

---

## Newsletter Signup

The Figma homepage has an amber-tinted signup section ("Get Travel
Inspiration") with an email input and a gradient subscribe button.

**Note:** A static site cannot receive form submissions without an external
service (Mailchimp, ConvertKit, etc.). Decide whether to:
1. Wire up a third-party service and add the real form, or
2. Skip this section entirely.

If proceeding, the HTML/CSS is straightforward and the styles are in the Figma
design guide. The form action URL would come from whichever email service is
chosen.

**Feasibility note:** The code side is trivial — an amber-styled form section
with one `<input>` and a gradient button, pointed at a service-provided action
URL. The real decision is picking the email service. Kevin noted that adding an
email address is easy on the provider side, so once a service is chosen the
integration is a single session's work.
