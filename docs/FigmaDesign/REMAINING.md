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

The Figma shows a masonry photo gallery on trip pages with hover zoom,
caption slide-up, and a full-screen lightbox with prev/next navigation.

**What's needed:**
- **Build side:** `generate-html.js` (or `build.js`) scans
  `content/trips/{tripId}/images/` and injects gallery HTML into trip intro
  pages (or a dedicated gallery section). Each image becomes a `.gallery-item`.
- **Layout:** CSS `column-count` masonry (1 / 2 / 3 columns at breakpoints).
  All styles are in `FIGMA_SYSTEM_DESIGN.md` under "Photo Gallery".
- **Hover:** Image scales to 110%, brightness drops, a centered zoom icon and
  bottom caption slide up.
- **Lightbox:** A `.lightbox` modal (fixed, z-index 9999) with the full image,
  close button, prev/next chevrons, and a "3 / 24" counter badge. Keyboard nav
  (← → Esc). All styles and SVG icons are in the Figma design guide.
- **JS:** Click a gallery item → open lightbox at that index. Prev/next cycle
  through the image array. Close on Esc or backdrop click.

**Feasibility note:** Medium effort. The build-side image scanning and masonry
CSS are straightforward. The lightbox is the heavy piece — using a CDN library
like GLightbox (~25 KB, MIT) cuts it to near-zero custom JS. Only the greece
trip has an `images/` directory currently (66 photos); the gallery should render
conditionally so trips without images simply skip it. The build already copies
`images/` to the output folder — no change needed there.

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
