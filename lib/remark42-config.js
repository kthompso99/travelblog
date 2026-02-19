/**
 * Remark42 configuration loader and helper utilities
 * Provides environment-aware config and generates unique page IDs for comment streams
 */

const fs = require('fs');
const path = require('path');
const { loadJsonFile } = require('./build-utilities');
const { getContentItemSlug } = require('./slug-utilities');

/**
 * Get Remark42 configuration (host URL and site ID)
 * @returns {Object} Configuration object with { host, siteId }
 */
function getRemark42Config() {
    const configPath = path.join(__dirname, '..', 'config', 'remark42.json');

    // Fallback to test defaults if config file doesn't exist
    if (!fs.existsSync(configPath)) {
        return {
            siteId: 'remark_test_123',
            host: 'http://localhost:8080'
        };
    }

    const config = loadJsonFile(configPath);
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const host = isDevelopment ? config.hosts.development : config.hosts.production;

    return {
        siteId: config.siteId,
        host: host
    };
}

/**
 * Build unique page ID for Remark42 comment stream
 * Format: {tripSlug}/{pageType}/{itemSlug}
 *
 * Examples:
 * - Trip intro: spain/intro
 * - Trip map: spain/map
 * - Location: spain/location/cordoba
 * - Article: spain/article/tips
 *
 * @param {string} tripSlug - Trip slug (e.g., 'spain', 'greece')
 * @param {string} pageType - Page type: 'intro', 'map', 'location', 'article'
 * @param {string|null} itemSlug - Item slug for location/article pages (optional)
 * @returns {string} Unique page ID
 */
function buildCommentPageId(tripSlug, pageType, itemSlug = null) {
    if (pageType === 'intro') {
        return `${tripSlug}/intro`;
    } else if (pageType === 'map') {
        return `${tripSlug}/map`;
    } else if (pageType === 'location' || pageType === 'article') {
        if (!itemSlug) {
            throw new Error(`itemSlug required for ${pageType} pages`);
        }
        return `${tripSlug}/${pageType}/${itemSlug}`;
    }
    throw new Error(`Unknown page type: ${pageType}`);
}

/**
 * Build HTML for comments section
 * @param {string} pageId - Unique page ID for this comment stream
 * @returns {string} HTML for comments section
 */
function buildCommentsSection(pageId) {
    return `
    <div class="comments-section">
        <div class="comments-header">
            <h2>Comments</h2>
            <p class="comments-subtitle">Share your thoughts and experiences</p>
        </div>
        <div id="remark42" data-remark42-page-id="${pageId}"></div>
    </div>`;
}

module.exports = {
    getRemark42Config,
    buildCommentPageId,
    buildCommentsSection
};
