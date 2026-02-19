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

/**
 * Derive a URL slug from a content item.
 * Prefers the filename (without .md) for stability; falls back to slugifying the title.
 * @param {Object} item - Content item with optional `file` and `title` fields
 * @returns {string} URL-safe slug
 */
function getContentItemSlug(item) {
    return item.file ? item.file.replace('.md', '') : slugify(item.title);
}

module.exports = { slugify, getContentItemSlug };
