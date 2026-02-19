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

module.exports = { GALLERY_MARKER, IMAGE_MAX_WIDTH, MARKDOWN_IMAGE_REGEX };
