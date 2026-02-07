/**
 * Slug generation utilities
 * Converts text to URL-safe slugs
 */

/**
 * Convert text to URL-safe slug
 * @param {string} text - Text to convert to slug
 * @returns {string} URL-safe slug
 */
function slugify(text) {
    if (!text) return '';
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

module.exports = { slugify };
