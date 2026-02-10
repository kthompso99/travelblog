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

**Status:** ✅ **Implemented** — See [implementation/LIGHTBOX.md](../implementation/LIGHTBOX.md) for details.

Convention-based markdown galleries using `{location-slug}-gallery.md` files. Masonry layout with hover effects and GLightbox integration for full-screen viewing.

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
