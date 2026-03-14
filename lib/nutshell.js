/**
 * Nutshell block parser and renderer.
 *
 * Parses :::nutshell fenced blocks in markdown and renders them into
 * structured HTML. Field order and labels are controlled centrally
 * via NUTSHELL_FIELDS in constants.js.
 */

const { NUTSHELL_MARKER_START, NUTSHELL_MARKER_END, NUTSHELL_FIELDS } = require('./constants');

let marked;
try {
    marked = require('marked');
} catch (e) {
    // marked is required — will fail at build time if missing
}

/** Convert inline markdown (links, bold, italic) to HTML without wrapping <p> tags. */
function inlineMarkdown(text) {
    return marked.parseInline(text);
}

// ─── Inline SVG icons (Lucide-style, 24×24 viewBox) ─────────────────────────

const SVG_ATTRS = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

const FIELD_ICONS = {
    'stay overnight': `<svg ${SVG_ATTRS}><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>`,
    'return visit':   `<svg ${SVG_ATTRS}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`,
    "don't miss":     `<svg ${SVG_ATTRS}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
    'best time of day': `<svg ${SVG_ATTRS}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    'worth the splurge': `<svg ${SVG_ATTRS}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>`,
};

const INDICATOR_ATTRS = 'class="nutshell-indicator" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"';
const RETURN_YES_SVG = `<svg ${INDICATOR_ATTRS}><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`;
const RETURN_NO_SVG  = `<svg ${INDICATOR_ATTRS}><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`;

// Fields displayed side-by-side in 2-column layout
const PAIR_KEYS = new Set(['stay overnight', 'return visit']);

// Fields highlighted with amber background
const HIGHLIGHT_KEYS = new Set(["don't miss"]);

// ─── Rendering helpers ──────────────────────────────────────────────────────

/** Render the Return Visit value with a green check or gray X indicator. */
function renderReturnVisitValue(rawValue) {
    const value = inlineMarkdown(rawValue.trim());
    const lower = rawValue.trim().toLowerCase();
    if (lower.startsWith('yes')) {
        return `<span class="nutshell-return-yes">${RETURN_YES_SVG} ${value}</span>`;
    }
    if (lower.startsWith('no')) {
        return `<span class="nutshell-return-no">${RETURN_NO_SVG} ${value}</span>`;
    }
    return value;
}

/** Slugify a verdict string for use as a CSS class (e.g. "Would Plan Around" → "would-plan-around"). */
function verdictSlug(verdict) {
    return verdict.toLowerCase().replace(/\s+/g, '-');
}

// ─── Parser ─────────────────────────────────────────────────────────────────

/**
 * Parse a :::nutshell block from a markdown string.
 *
 * Expected format:
 *   :::nutshell Location Name
 *   verdict: Would Plan Around
 *   duration: 2 days
 *   Stay Overnight: Yes — two nights minimum.
 *   Don't Miss: The Mezquita.
 *   :::
 *
 * @param {string} markdown - Full markdown content
 * @returns {{ name: string, verdict: string, duration: string, fields: Object<string, string>, raw: string } | null}
 */
function parseNutshellBlock(markdown) {
    const startIdx = markdown.indexOf(NUTSHELL_MARKER_START);
    if (startIdx === -1) return null;

    // Find the closing ::: (must be on its own line, after the opening)
    const afterStart = startIdx + NUTSHELL_MARKER_START.length;
    const closingPattern = /^\s*:::\s*$/m;
    const remaining = markdown.substring(afterStart);
    const closingMatch = remaining.match(closingPattern);
    if (!closingMatch) return null;

    const endIdx = afterStart + closingMatch.index + closingMatch[0].length;
    const raw = markdown.substring(startIdx, endIdx);

    // Extract the header line: :::nutshell Location Name
    const headerLine = markdown.substring(afterStart, afterStart + remaining.indexOf('\n')).trim();
    const name = headerLine || '';

    // Extract body lines (between header and closing :::)
    const bodyStart = afterStart + remaining.indexOf('\n') + 1;
    const bodyEnd = afterStart + closingMatch.index;
    const body = markdown.substring(bodyStart, bodyEnd).trim();

    let verdict = '';
    let duration = '';
    const fields = {};

    for (const line of body.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const colonIdx = trimmed.indexOf(':');
        if (colonIdx === -1) continue;

        const key = trimmed.substring(0, colonIdx).trim();
        const value = trimmed.substring(colonIdx + 1).trim();

        if (key.toLowerCase() === 'verdict') {
            verdict = value;
        } else if (key.toLowerCase() === 'duration') {
            duration = value;
        } else {
            fields[key] = value;
        }
    }

    return { name, verdict, duration, fields, raw };
}

// ─── Renderer ───────────────────────────────────────────────────────────────

/**
 * Render parsed nutshell data into HTML.
 * Field order follows NUTSHELL_FIELDS from constants.js.
 * Any fields in the data not in NUTSHELL_FIELDS are appended at the end.
 *
 * @param {{ name: string, verdict: string, duration: string, fields: Object<string, string> }} parsed
 * @returns {string} HTML string
 */
function renderNutshell(parsed) {
    const { name, verdict, duration, fields } = parsed;

    // Collect field entries in schema-defined order
    const renderedKeys = new Set();
    const fieldEntries = [];

    for (const { key, label } of NUTSHELL_FIELDS) {
        const matchKey = Object.keys(fields).find(k => k.toLowerCase() === key.toLowerCase());
        if (matchKey) {
            renderedKeys.add(matchKey);
            fieldEntries.push({ key: key.toLowerCase(), label, value: fields[matchKey] });
        }
    }

    // Append any extra fields not in the schema
    for (const [key, value] of Object.entries(fields)) {
        if (!renderedKeys.has(key)) {
            fieldEntries.push({ key: key.toLowerCase(), label: key, value });
        }
    }

    // Build field HTML
    let fieldHtml = '';
    for (const entry of fieldEntries) {
        const icon = FIELD_ICONS[entry.key] || '';
        const isPair = PAIR_KEYS.has(entry.key);
        const isHighlight = HIGHLIGHT_KEYS.has(entry.key);
        const isReturnVisit = entry.key === 'return visit';

        const valueHtml = isReturnVisit
            ? renderReturnVisitValue(entry.value)
            : inlineMarkdown(entry.value);

        const classes = ['nutshell-field'];
        if (isPair) classes.push('nutshell-field--pair');
        if (isHighlight) classes.push('nutshell-field--highlight');

        const iconHtml = icon
            ? `<span class="nutshell-icon">${icon}</span>`
            : '';

        fieldHtml += `<div class="${classes.join(' ')}">${iconHtml}<div class="nutshell-field-text"><div class="nutshell-label">${entry.label}</div><div class="nutshell-value">${valueHtml}</div></div></div>\n`;
    }

    // Verdict badge with level-specific CSS class
    const verdictHtml = verdict
        ? `<div class="nutshell-verdict nutshell-verdict--${verdictSlug(verdict)}">${verdict}</div>`
        : '';

    const durationHtml = duration
        ? `<div class="nutshell-duration">${duration}</div>`
        : '';

    return `<section class="nutshell-section">
<div class="nutshell-header"><div>
<h2>🥜 ${name} in a Nutshell</h2>
<div class="nutshell-subtitle">Two Travel Nuts Verdict</div>
</div>
${verdictHtml}${durationHtml}</div>
<div class="nutshell-fields">
${fieldHtml}</div>
</section>`;
}

/**
 * Process a markdown string: find a :::nutshell block, replace it with rendered HTML.
 * If no block is found, returns the markdown unchanged.
 *
 * @param {string} markdown - Full markdown content
 * @returns {string} Markdown with nutshell block replaced by HTML
 */
function processNutshell(markdown) {
    const parsed = parseNutshellBlock(markdown);
    if (!parsed) return markdown;

    const html = renderNutshell(parsed);
    return markdown.replace(parsed.raw, html);
}

module.exports = { parseNutshellBlock, renderNutshell, processNutshell };
