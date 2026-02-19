/**
 * Page-specific CSS router
 * Imports CSS from css-homepage.js and css-content-pages.js,
 * provides getPageCSS() to select the right stylesheet per page type.
 */

const { CSS_HOMEPAGE } = require('./css-homepage');
const { CSS_CONTENT_PAGES } = require('./css-content-pages');

/**
 * Get page-specific CSS based on page type
 * @param {string} pageType - 'homepage', 'trip-intro', 'trip-location', 'trip-article', 'trip-map', 'global-map', 'about'
 * @returns {string} CSS content for the page type wrapped in <style> tags
 */
function getPageCSS(pageType) {
    switch (pageType) {
        case 'homepage':
            return `<style>${CSS_HOMEPAGE}\n    </style>`;
        case 'trip-intro':
        case 'trip-location':
        case 'trip-article':
        case 'trip-map':
        case 'global-map':
        case 'about':
            // All content/map pages use the same CSS (includes markdown, maps, navigation, etc.)
            return `<style>${CSS_CONTENT_PAGES}\n    </style>`;
        default:
            return '';
    }
}

module.exports = { getPageCSS };
