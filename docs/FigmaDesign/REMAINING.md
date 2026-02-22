# Figma Design — Remaining Work

Items from the Figma mockups that have not yet been implemented.
Each section below is a self-contained conversation / work item.

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

---

## Map Sidebar: Expandable Micro-Summaries Per Stop

Figma suggested adding a 1-sentence highlight per location in the trip map
sidebar — a standout memory, quote, or rating that appears below the duration.

**Example:**
```
Granada
3 days
"Alhambra at dusk alone was worth the flight."
```

**What's needed:**
- A new optional `highlight` field in trip.json location entries.
- Build pipeline to pass it through (`scripts/build/build.js` field copy).
- Sidebar rendering in `lib/generate-trip-pages.js` (`buildMapSidebar`).
- CSS for the highlight text (small italic, muted color, maybe expandable).

**Why deferred:** This is editorial content — Kevin would write each highlight
by hand during a writing pass. No point building the UI until there's content
to show.
