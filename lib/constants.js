/**
 * Shared constants used across build scripts and utilities.
 */

// Marker string that separates prose from the photo gallery section in markdown files.
// Kevin places this line in a .md file to indicate where the gallery should be injected.
const GALLERY_MARKER = '*Add your photos here*';

// Max-width constraints for images rendered in trip content pages.
const IMAGE_MAX_WIDTH = { LANDSCAPE: 600, PORTRAIT: 375 };

// Regex pattern for extracting markdown images: ![caption](src)
// Note: uses `g` flag — callers using .exec() loops must create a fresh copy
// via new RegExp(MARKDOWN_IMAGE_REGEX) or reset .lastIndex before reuse.
const MARKDOWN_IMAGE_REGEX = /!\[([^\]]*)\]\(([^\)]+)\)/g;

// Fenced block markers for the "in a Nutshell" structured section.
// Content between these markers is parsed as key-value pairs and rendered
// into HTML by the build system (see lib/nutshell.js).
const NUTSHELL_MARKER_START = ':::nutshell';
const NUTSHELL_MARKER_END = ':::';

// Central schema for nutshell fields. Order here controls render order on all pages.
// key: matched against the field key in the :::nutshell block (case-insensitive).
// label: displayed in the rendered HTML.
const NUTSHELL_FIELDS = [
    { key: 'Stay Overnight', label: 'Stay Overnight?' },
    { key: 'Return Visit', label: 'Return Visit?' },
    { key: "Don't Miss", label: "Don't Miss" },
    { key: 'Best Time of Day', label: 'Best Time of Day' },
    { key: 'Worth the Splurge', label: 'Worth the Splurge' },
];

module.exports = {
    GALLERY_MARKER, IMAGE_MAX_WIDTH, MARKDOWN_IMAGE_REGEX,
    NUTSHELL_MARKER_START, NUTSHELL_MARKER_END, NUTSHELL_FIELDS,
};
