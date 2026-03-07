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

/**
 * Parse a :::nutshell block from a markdown string.
 *
 * Expected format:
 *   :::nutshell Location Name
 *   verdict: Would Plan Around
 *   Stay Overnight: Yes — two nights minimum.
 *   Don't Miss: The Mezquita.
 *   :::
 *
 * @param {string} markdown - Full markdown content
 * @returns {{ name: string, verdict: string, fields: Object<string, string>, raw: string } | null}
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
        } else {
            fields[key] = value;
        }
    }

    return { name, verdict, fields, raw };
}

/**
 * Render parsed nutshell data into HTML.
 * Field order follows NUTSHELL_FIELDS from constants.js.
 * Any fields in the data not in NUTSHELL_FIELDS are appended at the end.
 *
 * @param {{ name: string, verdict: string, fields: Object<string, string> }} parsed
 * @returns {string} HTML string
 */
function renderNutshell(parsed) {
    const { name, verdict, fields } = parsed;

    // Build field HTML in schema-defined order
    const renderedKeys = new Set();
    let fieldHtml = '';

    for (const { key, label } of NUTSHELL_FIELDS) {
        // Case-insensitive key lookup
        const matchKey = Object.keys(fields).find(k => k.toLowerCase() === key.toLowerCase());
        if (matchKey) {
            renderedKeys.add(matchKey);
            fieldHtml += `<div class="nutshell-field"><dt>${label}</dt><dd>${inlineMarkdown(fields[matchKey])}</dd></div>\n`;
        }
    }

    // Append any extra fields not in the schema
    for (const [key, value] of Object.entries(fields)) {
        if (!renderedKeys.has(key)) {
            fieldHtml += `<div class="nutshell-field"><dt>${key}</dt><dd>${inlineMarkdown(value)}</dd></div>\n`;
        }
    }

    const verdictHtml = verdict
        ? `<div class="nutshell-verdict">${verdict}</div>\n`
        : '';

    return `<section class="nutshell-section">
<h2>🥜 ${name} in a Nutshell</h2>
${verdictHtml}<dl class="nutshell-fields">
${fieldHtml}</dl>
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
