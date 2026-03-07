# Plan: Structured Nutshell Blocks

## Scope

**This is a structural-only change.** The goal is to replace raw markdown nutshell sections with a build-parsed `:::nutshell` block so that field order, labels, and rendering are controlled centrally. The output HTML will look the same as before — visual styling ("pop") is a separate follow-up pass.

## Context

All 9 Spain location files have a hand-written "In a Nutshell" section with the same 5 fields in raw markdown. Changing field order, labels, or visual styling requires editing every file individually. Kevin wants this to behave like a structured blog feature — data lives per-location, but rendering/ordering/styling are controlled centrally.

## Approach: Fenced Block + Central Schema

Replace the raw markdown nutshell sections with a `:::nutshell` fenced block that the build system parses and renders into styled HTML.

### What Kevin writes (in each .md file):

```
:::nutshell Ronda
verdict: Would Plan Around
Stay Overnight: Absolutely — the bridge lit up alone is worth the overnight.
Don't Miss: The Puente Nuevo from below; Cueva Pileta if you plan ahead.
Best Time of Day: Late afternoon light from the gorge viewpoints.
Worth the Splurge: A room with a gorge view at Montelirio.
Return Visit: Yes. This is a place worth lingering in, not just checking off.
:::
```

### What the build produces:

Styled HTML — heading, verdict badge, and fields rendered in the order defined centrally. The exact visual design is TBD (Kevin said "details TBD"), but the structure supports any styling: cards, icon grids, colored badges, etc. Initial implementation will produce clean semantic HTML with a CSS class hook (`nutshell-section`, `nutshell-verdict`, `nutshell-field`, etc.) that Kevin can style later.

### Why this format?

- **`:::` fences** are a well-known pattern (Docusaurus, VuePress, markdown-it containers). Readable as plain text, clearly marks the block as special.
- **Data stays in the .md file** — Kevin edits content where Kevin writes content. No context-switching to trip.json.
- **Key-value pairs** are parsed by field key, so field order in the .md file doesn't matter — the build renders them in whatever order the central config specifies.
- **Follows existing precedent** — the gallery marker (`*Add your photos here*`) already demonstrates "special markdown patterns parsed by the build."

---

## Implementation Steps

### 1. Add nutshell constants — `lib/constants.js`

```javascript
const NUTSHELL_MARKER_START = ':::nutshell';
const NUTSHELL_MARKER_END = ':::';

const NUTSHELL_FIELDS = [
  { key: 'Stay Overnight', label: 'Stay Overnight?' },
  { key: "Don't Miss",     label: "Don't Miss" },
  { key: 'Best Time of Day', label: 'Best Time of Day' },
  { key: 'Worth the Splurge', label: 'Worth the Splurge' },
  { key: 'Return Visit',   label: 'Return Visit?' },
];

const NUTSHELL_VERDICTS = ['Would Plan Around', 'Glad We Went', 'Lovely but Optional'];
```

`NUTSHELL_FIELDS` is the single source of truth for field order and labels. To reorder, add, or remove a field — edit this one array.

### 2. Create nutshell module — `lib/nutshell.js` (new file)

Three functions:

- **`parseNutshellBlock(markdown)`** — finds `:::nutshell <Name>` ... `:::`, extracts location name, verdict, and key-value field data. Returns `{ name, verdict, fields: { key: value }, raw }` or `null` if no block found.

- **`renderNutshell(parsed)`** — takes parsed data + `NUTSHELL_FIELDS` config, produces semantic HTML:
  ```html
  <section class="nutshell-section">
    <h2>🥜 Ronda in a Nutshell</h2>
    <div class="nutshell-verdict">Would Plan Around</div>
    <dl class="nutshell-fields">
      <div class="nutshell-field">
        <dt>Stay Overnight?</dt>
        <dd>Absolutely — the bridge lit up alone is worth the overnight.</dd>
      </div>
      ...
    </dl>
  </section>
  ```
  Uses `<dl>` (definition list) — semantically correct for label/value pairs and easy to style.

- **`processNutshell(markdown)`** — combines parse + render. Returns the markdown string with the `:::nutshell...:::` block replaced by rendered HTML. If no block found, returns markdown unchanged.

### 3. Integrate into build pipeline — `lib/markdown-converter.js`

Add nutshell pre-processing before `marked.parse()`:

```javascript
// In convertMarkdownString():
function convertMarkdownString(content, markdownDir) {
    content = processNutshell(content);  // ← new line
    return postProcessHtml(marked.parse(content), markdownDir);
}
```

Also add it in `convertMarkdown()` for the file-based path.

Since `processNutshell()` replaces the fenced block with raw HTML, and `marked` passes HTML through unchanged, this slots in cleanly with zero impact on existing transforms.

### 4. Convert Spain .md files — `content/trips/spain/*.md`

Replace each raw markdown nutshell section with the `:::nutshell` block format. For each of the 9 files:
- Remove the `## 🥜 X in a Nutshell` heading
- Remove the verdict line
- Remove the `**bold field**` lines
- Add the `:::nutshell Name` ... `:::` block with the same data

### 5. Add unit tests — `tests/unit.test.js` (or new test file)

- Parse: block extraction, missing block returns null, multi-line field values
- Render: field ordering matches NUTSHELL_FIELDS, verdict rendering, HTML structure
- Round-trip: known markdown input → expected HTML output

### 6. Verify full build

```bash
npm run validate
npm run build
node scripts/build/build-smart.js
node scripts/build/build-writing.js content/trips/spain/ronda.md
npm test
```

---

## What this enables (future)

Once the nutshell is structured, Kevin can:
- **Reorder fields** — edit `NUTSHELL_FIELDS` once, all pages update on next build
- **Add/remove fields** — add a new key to the array (e.g. `{ key: 'Budget', label: 'Budget Tip' }`)
- **Add visual pop** — style `.nutshell-section` with CSS in `templates/base.html` (colored cards, icons, rating badges for verdict, etc.)
- **Auto-generate the overview table** — the build could read all nutshell data and produce the "Spain at a Glance" table automatically
- **Use nutshell data elsewhere** — e.g. tooltip previews on the map, card summaries on the homepage

---

## Files Modified

| File | Change |
|:---|:---|
| `lib/constants.js` | Add nutshell markers + field schema |
| `lib/nutshell.js` | **New** — parse/render/process functions |
| `lib/markdown-converter.js` | Add `processNutshell()` call before `marked.parse()` |
| `content/trips/spain/*.md` (9 files) | Convert raw nutshell markdown → `:::nutshell` blocks |
| `tests/unit.test.js` | Add nutshell parse/render tests |

## Follow-up: Visual Styling (separate pass)

Visual "pop" (card layout, colored verdict badges, icons per field, etc.) will be designed and implemented in a second pass once the structural change is verified working. The CSS class hooks (`nutshell-section`, `nutshell-verdict`, `nutshell-field`) are already in place to support that.
