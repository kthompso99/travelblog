/**
 * Template assembly utilities
 * Handles placeholder replacement in HTML templates
 */

/**
 * Assemble a page from base template by replacing all placeholders
 * @param {string} baseTemplate - The base HTML template
 * @param {Object} replacements - Object with placeholder values
 * @param {string} replacements.seoMetadata - SEO meta tags
 * @param {string} replacements.siteTitle - Site title
 * @param {string} replacements.basePath - Base path for assets
 * @param {string} replacements.tripsMenu - Navigation menu HTML
 * @param {string} replacements.tripSubmenu - Trip submenu HTML (default: '')
 * @param {string} replacements.preMain - Content before main (e.g., hero) (default: '')
 * @param {string} replacements.content - Main page content
 * @param {string} replacements.pageCSS - Page-specific CSS (default: '')
 * @param {string} replacements.scripts - Additional scripts (default: '')
 * @returns {string} Assembled HTML page
 */
function assembleTemplate(baseTemplate, replacements) {
    return baseTemplate
        .replace(/{{SEO_METADATA}}/g, replacements.seoMetadata)
        .replace(/{{PAGE_CSS}}/g, replacements.pageCSS || '')
        .replace(/{{SITE_TITLE}}/g, replacements.siteTitle)
        .replace(/{{BASE_PATH}}/g, replacements.basePath)
        .replace(/{{TRIPS_MENU}}/g, replacements.tripsMenu)
        .replace(/{{TRIP_SUBMENU}}/g, replacements.tripSubmenu || '')
        .replace(/{{PRE_MAIN}}/g, replacements.preMain || '')
        .replace(/{{CONTENT}}/g, replacements.content)
        .replace(/{{REMARK42_HOST}}/g, replacements.remark42Host || '')
        .replace(/{{REMARK42_SITE_ID}}/g, replacements.remark42SiteId || '')
        .replace(/{{SCRIPTS}}/g, replacements.scripts || '');
}

/**
 * Fill an inner template by replacing {{KEY}} placeholders with values.
 * Accepts a plain object where each key maps to the placeholder name.
 * Missing/undefined values are replaced with an empty string.
 *
 * @param {string} template - Template string with {{KEY}} placeholders
 * @param {Object} replacements - Plain object mapping KEY → value
 * @returns {string} Template with all placeholders substituted
 */
function fillTemplate(template, replacements) {
    return Object.entries(replacements).reduce((html, [key, value]) => {
        const safeValue = value ?? '';
        return html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), () => safeValue);
    }, template);
}

module.exports = { assembleTemplate, fillTemplate };
