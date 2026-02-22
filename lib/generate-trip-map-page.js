/**
 * Trip map page HTML generator
 * Builds the per-trip map page (map.html) with sidebar, playback controls, and Google Maps
 */

const { generateTripMetadata, escapeHtml } = require('./seo-metadata');
const { getContentItemSlug } = require('./slug-utilities');
const { getTripImagePath } = require('./image-utilities');
const { getGoogleMapsApiKey, getMapStylesJson } = require('./maps-config');
const { readTemplate, renderPage } = require('./generate-html-helpers');
const { fillTemplate } = require('./template-utilities');
const { buildCommentPageId, buildCommentsSection } = require('./remark42-config');
const { buildTripSubmenu, buildTripHero } = require('./generate-trip-pages');

/**
 * Build numbered sidebar HTML for trip map page
 * @param {Array} locations - Array of location content items
 * @param {string} tripTitle - Trip title for sidebar heading
 * @returns {string} HTML for sidebar location list
 */
function buildMapSidebar(locations, tripTitle) {
    const TRAVEL_MODE_ICONS = {
        train: '\uD83D\uDE86',
        drive: '\uD83D\uDE97',
        ferry: '\u26F4\uFE0F',
        fly: '\u2708\uFE0F'
    };
    const stopCount = locations.length;
    const totalDays = locations.reduce((sum, loc) => {
        const match = loc.duration && loc.duration.match(/(\d+)/);
        return sum + (match ? parseInt(match[1], 10) : 0);
    }, 0);
    const summary = totalDays > 0
        ? `<p class="location-count">${stopCount} stops \u2022 ${totalDays} days</p>`
        : `<p class="location-count">${stopCount} stops</p>`;
    let html = `<div class="locations-header"><h2>${escapeHtml(tripTitle)} Itinerary</h2><div class="locations-header-row">${summary}<div class="tour-controls"><button id="play-trip-btn" class="play-trip-btn" title="Auto-play through each stop"><span class="btn-icon">\u25B6</span> Follow the Journey</button><button id="stop-trip-btn" class="stop-trip-btn" title="Stop tour">\u25A0</button></div><span class="play-hint">Watch each stop unfold on the map</span></div></div>`;
    html += '<ol class="trip-map-locations-list">';
    locations.forEach((loc, idx) => {
        // Travel connector between locations
        if (idx > 0 && loc.travelMode && loc.travelDuration) {
            const icon = TRAVEL_MODE_ICONS[loc.travelMode] || '';
            html += `
            <li class="travel-segment">
                <span class="travel-info">${icon} ${escapeHtml(loc.travelDuration)}</span>
            </li>`;
        }
        const locationSlug = getContentItemSlug(loc);
        const duration = loc.duration ? `<span class="location-duration">${escapeHtml(loc.duration)}</span>` : '';
        const thumbHtml = loc.thumbnail
            ? `<img class="location-thumb" src="./${loc.thumbnail}" alt="" loading="lazy">`
            : '';
        html += `
            <li>
                <a href="./${locationSlug}.html" data-location-index="${idx + 1}" class="location-list-item">
                    <span class="location-number">${idx + 1}</span>
                    ${thumbHtml}
                    <span class="location-details">
                        <span class="location-name">${escapeHtml(loc.title)}</span>
                        ${duration}
                    </span>
                </a>
            </li>`;
    });
    html += '</ol>';
    return html;
}

/**
 * Build prev/next navigation for the map page (Overview <- -> first content item)
 * @param {Array} allContent - Array of all content items
 * @returns {string} HTML for map page navigation
 */
function buildMapNavigation(allContent) {
    const firstItem = allContent && allContent.length > 0 ? allContent[0] : null;
    const firstSlug = firstItem ? getContentItemSlug(firstItem) : '';
    const nextHtml = firstItem ?
        `<a href="./${firstSlug}.html" class="next-link">Next: ${escapeHtml(firstItem.title)} →</a>` : '';

    return `
        <div class="prev-next-links">
            <a href="./index.html" class="prev-link">← Previous: Overview</a>
            ${nextHtml}
        </div>`;
}

/**
 * Generate trip map page (standalone map.html for each trip)
 * @param {Object} tripMetadata - Trip metadata with title, slug, locations, etc.
 * @param {Array} allContent - Array of all content items (articles and locations)
 * @param {Object} config - Site config with title, domain
 * @param {string} domain - Domain for canonical URL
 * @returns {string} Complete HTML for trip map page
 */
function generateTripMapPage(tripMetadata, allContent, config, domain) {
    const mapPageTemplate = readTemplate('trip-map-page.html');

    const locations = allContent.filter(item => item.type === 'location');

    // Enrich locations with slug and computed image path for linking
    const locationsForMap = locations.map(loc => ({
        ...loc,
        slug: getContentItemSlug(loc),
        thumbnail: loc.thumbnail ? getTripImagePath(loc.thumbnail, tripMetadata.slug, './', true) : null
    }));
    const locationsJson = JSON.stringify(locationsForMap);

    const sidebarHtml = buildMapSidebar(locations, tripMetadata.title);
    const prevNextHtml = buildMapNavigation(allContent);

    // Build comments section
    const commentPageId = buildCommentPageId(tripMetadata.slug, 'map');
    const commentsHtml = buildCommentsSection(commentPageId);

    const mapScript = locations.length > 0
        ? readTemplate('map-trip-script.html')
            .replace('{{GOOGLE_MAPS_API_KEY}}', () => getGoogleMapsApiKey())
            .replace('{{LOCATIONS_JSON}}', () => locationsJson)
            .replace('{{MAP_STYLES}}', () => getMapStylesJson())
        : '<p>No locations available for this trip.</p>';

    const seoMetadata = `
        <title>Map - ${escapeHtml(tripMetadata.title)} | ${escapeHtml(config.site.title)}</title>
        <meta name="description" content="Interactive map showing all locations visited during ${escapeHtml(tripMetadata.title)}">
        <link rel="canonical" href="${domain}/trips/${tripMetadata.slug}/map.html">`;

    const tripSubmenu = buildTripSubmenu(tripMetadata, allContent, 'map', './');

    const content = fillTemplate(mapPageTemplate, {
        NUMBERED_LOCATIONS_LIST: sidebarHtml,
        MAP_SCRIPT: mapScript,
        COMMENTS_SECTION: commentsHtml,
        PREV_NEXT_NAV: prevNextHtml
    });

    return renderPage(config, {
        basePath: '../../',
        seoMetadata,
        content,
        cssKey: 'trip-map',
        tripSubmenu,
        preMain: buildTripHero(tripMetadata)
    });
}

module.exports = { generateTripMapPage };
