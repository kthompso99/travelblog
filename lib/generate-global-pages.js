/**
 * Global page HTML generators
 * Builds the map page and about page
 */

const fs = require('fs');
const path = require('path');
const { escapeHtml } = require('./seo-metadata');
const { getTripImagePath } = require('./image-utilities');
const { getGoogleMapsApiKey } = require('./maps-config');
const { readTemplate, renderPage } = require('./generate-html-helpers');

/**
 * Build a lightweight config object for the global map page.
 * Strips large HTML content and precomputes image paths for client-side use.
 */
function buildMapConfig(config) {
    return {
        site: config.site,
        trips: config.trips.map(trip => ({
            slug: trip.slug,
            title: trip.title,
            published: trip.published,
            beginDate: trip.beginDate,
            endDate: trip.endDate,
            duration: trip.duration,
            metadata: trip.metadata,
            coverImage: trip.coverImage,
            thumbnail: getTripImagePath(trip.thumbnail, trip.slug, '../', false),
            mapCenter: trip.mapCenter,
            locations: trip.locations ? trip.locations.map(loc => ({
                ...loc,
                thumbnail: getTripImagePath(loc.thumbnail, trip.slug, '../', false)
            })) : [],
            relatedTrips: trip.relatedTrips
        }))
    };
}

/**
 * Generate map page HTML
 * @param {Object} config - Site configuration
 * @param {string} domain - Site domain
 * @returns {string} Complete HTML page
 */
function generateMapPage(config, domain) {
    const mapConfig = buildMapConfig(config);

    const mapScript = readTemplate('map-global-script.html')
        .replace('{{GOOGLE_MAPS_API_KEY}}', () => getGoogleMapsApiKey())
        .replace('{{MAP_CONFIG_JSON}}', () => JSON.stringify(mapConfig, null, 2));

    const content = `
<div id="map-view">
    <h2>World Map of Trips</h2>
    <div id="map-container">
        <div id="map"></div>
    </div>
</div>

${mapScript}`;

    const seoMetadata = `
    <title>Map | ${escapeHtml(config.site.title)}</title>
    <meta name="description" content="Explore all our travel destinations on an interactive world map.">
    <link rel="canonical" href="${domain}/map/">`;

    return renderPage(config, {
        basePath: '../',
        seoMetadata,
        content,
        cssKey: 'global-map'
    });
}

/**
 * Generate about page HTML
 * @param {Object} config - Site configuration
 * @param {string} domain - Site domain
 * @returns {string} Complete HTML page
 */
async function generateAboutPage(config, domain, convertMarkdown) {
    // Read and convert about.md
    const aboutMdPath = path.join(__dirname, '../content/about.md');
    let markdownHtml = '';

    if (fs.existsSync(aboutMdPath)) {
        markdownHtml = await convertMarkdown(aboutMdPath);
    } else {
        // Fallback to default content if about.md doesn't exist
        markdownHtml = `
            <h1>About This Blog</h1>
            <p>Welcome to my travel blog! This is a place where I share my adventures, experiences, and discoveries from around the world.</p>
            <p>Use the map to explore all the destinations I've visited, or browse by continent in the Trips menu.</p>`;
    }

    const content = `
<div id="content-view">
    <a href="../" class="back-button">← Back to Home</a>
    <div id="content-area">
        <div class="markdown-content">
            ${markdownHtml}
        </div>
    </div>
</div>`;

    const seoMetadata = `
    <title>About | ${escapeHtml(config.site.title)}</title>
    <meta name="description" content="Learn more about our travel adventures and explorations around the world.">
    <link rel="canonical" href="${domain}/about/">`;

    return renderPage(config, {
        basePath: '../',
        seoMetadata,
        content,
        cssKey: 'about'
    });
}

module.exports = { generateMapPage, generateAboutPage };
