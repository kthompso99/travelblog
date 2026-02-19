/**
 * Trip page HTML generators
 * Builds trip intro, content (location/article), and map pages
 */

const { generateTripMetadata, escapeHtml } = require('./seo-metadata');
const { getContentItemSlug } = require('./slug-utilities');
const { getTripImagePath } = require('./image-utilities');
const { getGoogleMapsApiKey } = require('./maps-config');
const { readTemplate, formatMonthYear, renderPage } = require('./generate-html-helpers');

/**
 * Build trip submenu HTML
 * @param {Object} tripMetadata - Trip metadata
 * @param {Array} allContent - Array of all content items (locations and articles)
 * @param {string} currentPage - Current page identifier ('intro', 'map', or content title)
 * @param {string} basePath - Base path for links
 * @returns {string} HTML for trip submenu
 */
function buildTripSubmenu(tripMetadata, allContent, currentPage, basePath = './') {
    let html = `
        <nav class="trip-submenu">
            <ul class="trip-submenu-links">`;

    // Overview link
    const overviewActive = currentPage === 'intro' ? ' class="active"' : '';
    html += `
                <li><a href="${basePath}index.html"${overviewActive}>Overview</a></li>`;

    // Map link
    const mapActive = currentPage === 'map' ? ' class="active"' : '';
    html += `
                <li><a href="${basePath}map.html"${mapActive}>Map</a></li>`;

    // Content links (articles and locations)
    allContent.forEach(item => {
        const itemSlug = getContentItemSlug(item);
        const isActive = currentPage === item.title;
        const activeClass = isActive ? ' class="active"' : '';

        html += `
                <li><a href="${basePath}${itemSlug}.html"${activeClass}>${escapeHtml(item.title)}</a></li>`;
    });

    html += `
            </ul>
        </nav>`;

    return html;
}

/**
 * Build prev/next navigation HTML
 * @param {Array} allContent - Array of all content items
 * @param {number} currentIndex - Index of current item
 * @param {string} basePath - Base path for links
 * @returns {string} HTML for prev/next navigation
 */
function buildPrevNextNav(allContent, currentIndex, basePath = './') {
    let html = '<div class="prev-next-links">';

    // Previous link
    if (currentIndex === 0) {
        // First content item -> previous is MAP page
        html += `
            <a href="${basePath}map.html" class="prev-link">← Previous: Map</a>`;
    } else if (currentIndex > 0) {
        // Other items -> previous is the item before this one
        const prevItem = allContent[currentIndex - 1];
        const prevSlug = getContentItemSlug(prevItem);
        html += `
            <a href="${basePath}${prevSlug}.html" class="prev-link">← Previous: ${escapeHtml(prevItem.title)}</a>`;
    }

    // Next link
    if (currentIndex < allContent.length - 1) {
        const nextItem = allContent[currentIndex + 1];
        const nextSlug = getContentItemSlug(nextItem);
        html += `
            <a href="${basePath}${nextSlug}.html" class="next-link">Next: ${escapeHtml(nextItem.title)} →</a>`;
    }

    html += '</div>';
    return html;
}

/**
 * Build prev/next navigation for intro page (only shows Next link)
 * @param {Array} allContent - Array of all content items
 * @param {string} basePath - Base path for links
 * @returns {string} HTML for prev/next navigation
 */
function buildIntroPageNextLink(allContent, basePath = './') {
    return `
        <div class="prev-next-links">
            <a href="${basePath}map.html" class="next-link">Next: Map →</a>
        </div>`;
}

/**
 * Build photo gallery HTML from gallery data
 * @param {Array} gallery - Array of {caption, src} objects
 * @param {string} basePath - Base path for image links
 * @returns {string} HTML for masonry photo gallery
 */
function buildPhotoGallery(gallery, basePath = './') {
    if (!gallery || gallery.length === 0) {
        return '';
    }

    // Zoom icon SVG
    const zoomIcon = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        <line x1="11" y1="8" x2="11" y2="14"></line>
        <line x1="8" y1="11" x2="14" y2="11"></line>
    </svg>`;

    let html = '<h2 class="gallery-section-title">Photo Gallery</h2>';
    html += '<div class="gallery-masonry">';

    gallery.forEach(image => {
        const imageSrc = `${basePath}${image.src}`;
        const caption = escapeHtml(image.caption);

        html += `
            <a href="${imageSrc}" class="gallery-item" data-gallery="location-gallery" data-description="${caption}">
                <img src="${imageSrc}" alt="${caption}" loading="lazy">
                <div class="gallery-item-overlay">
                    <div class="gallery-zoom-icon">${zoomIcon}</div>
                </div>
                <div class="gallery-caption">${caption}</div>
            </a>`;
    });

    html += '</div>';
    return html;
}

/**
 * Build trip hero section HTML
 * @param {Object} tripMetadata - Trip metadata
 * @returns {string} Hero HTML or empty string if no cover image
 */
function buildTripHero(tripMetadata) {
    const country = tripMetadata.metadata?.country || '';
    const dateLabel = formatMonthYear(tripMetadata.beginDate);
    const coverImage = tripMetadata.coverImage || '';

    if (!coverImage) return '';

    const heroImagePath = getTripImagePath(coverImage, tripMetadata.slug, './', true);
    return `<div class="trip-hero">
    <div class="trip-hero-bg" style="background-image: url('${heroImagePath}');"></div>
    <div class="trip-hero-overlay"></div>
    <div class="trip-hero-content">
        <h1>${escapeHtml(tripMetadata.title)}</h1>
        <div class="trip-hero-meta">
            ${country ? `<span>\u{1f4cd} ${escapeHtml(country)}</span>` : ''}
            ${dateLabel ? `<span>\u{1f4c5} ${dateLabel}</span>` : ''}
        </div>
    </div>
</div>`;
}

/**
 * Build numbered sidebar HTML for trip map page
 * @param {Array} locations - Array of location content items
 * @returns {string} HTML for sidebar location list
 */
function buildMapSidebar(locations) {
    let html = '<ol class="trip-map-locations-list">';
    locations.forEach((loc, idx) => {
        const locationSlug = getContentItemSlug(loc);
        const duration = loc.duration ? ` (${loc.duration})` : '';
        html += `
            <li>
                <a href="./${locationSlug}.html" data-location-index="${idx + 1}" class="location-list-item">
                    <span class="location-number">${idx + 1}</span>
                    <span class="location-name">${escapeHtml(loc.title)}${duration}</span>
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
 * Generate trip intro page HTML
 * @param {Object} tripMetadata - Trip metadata
 * @param {Array} allContent - Array of all content items (articles and locations)
 * @param {Object} config - Site configuration
 * @param {string} domain - Site domain
 * @returns {string} Complete HTML page
 */
function generateTripIntroPage(tripMetadata, allContent, config, domain) {
    const introTemplate = readTemplate('trip-intro-page.html');

    const seoMetadata = generateTripMetadata(tripMetadata, domain, config.site.title);
    const tripSubmenu = buildTripSubmenu(tripMetadata, allContent, 'intro', './');

    // Build trip metadata section
    let metadataHtml = '';
    if (tripMetadata.duration) {
        metadataHtml += `<p class="trip-meta"><strong>Duration:</strong> ${escapeHtml(tripMetadata.duration)}</p>`;
    }
    if (tripMetadata.beginDate) {
        metadataHtml += `<p class="trip-meta"><strong>Dates:</strong> ${escapeHtml(tripMetadata.beginDate)}`;
        if (tripMetadata.endDate) {
            metadataHtml += ` to ${escapeHtml(tripMetadata.endDate)}`;
        }
        metadataHtml += `</p>`;
    }

    // Build prev/next navigation for intro page
    const prevNextHtml = buildIntroPageNextLink(allContent, './');

    // Strip leading <h1> from intro content — title is now in the hero
    const introHtml = (tripMetadata.introHtml || '<p>Trip introduction not available</p>')
        .replace(/^<h1[^>]*>.*?<\/h1>\s*/i, '');

    const content = introTemplate
        .replace(/{{BASE_PATH}}/g, '../../')
        .replace(/{{TRIP_TITLE}}/g, escapeHtml(tripMetadata.title))
        .replace(/{{INTRO_CONTENT}}/g, introHtml)
        .replace(/{{PREV_NEXT_NAV}}/g, prevNextHtml);

    return renderPage(config, {
        basePath: '../../',
        seoMetadata,
        content,
        cssKey: 'trip-intro',
        tripSubmenu,
        preMain: buildTripHero(tripMetadata)
    });
}

/**
 * Generate trip content page HTML (locations and articles)
 * @param {Object} tripMetadata - Trip metadata
 * @param {Object} contentItem - Content item (location or article)
 * @param {Array} allContent - Array of all content items (locations and articles)
 * @param {number} contentIndex - Index of this item in allContent
 * @param {Object} config - Site configuration
 * @param {string} domain - Site domain
 * @returns {string} Complete HTML page
 */
function generateTripContentPage(tripMetadata, contentItem, allContent, contentIndex, config, domain) {
    const pageTemplate = readTemplate('trip-location-page.html');

    const itemSlug = getContentItemSlug(contentItem);
    const seoMetadata = `
    <title>${escapeHtml(contentItem.title)} - ${escapeHtml(tripMetadata.title)} | ${escapeHtml(config.site.title)}</title>
    <meta name="description" content="${escapeHtml(contentItem.title)} - Part of ${escapeHtml(tripMetadata.title)}">
    <link rel="canonical" href="${domain}/trips/${tripMetadata.slug}/${itemSlug}.html">`;

    const tripSubmenu = buildTripSubmenu(tripMetadata, allContent, contentItem.title, './');

    const prevNextHtml = buildPrevNextNav(allContent, contentIndex, './');
    const galleryHtml = contentItem.gallery ? buildPhotoGallery(contentItem.gallery, './') : '';
    const fullContent = (contentItem.contentHtml || '<p>Content not available</p>') + galleryHtml;

    const content = pageTemplate
        .replace(/{{TRIP_TITLE}}/g, escapeHtml(tripMetadata.title))
        .replace(/{{LOCATION_TITLE}}/g, escapeHtml(contentItem.title))
        .replace(/{{LOCATION_METADATA}}/g, '')
        .replace(/{{LOCATION_CONTENT}}/g, fullContent)
        .replace(/{{PREV_NEXT_NAV}}/g, prevNextHtml);

    const cssKey = contentItem.type === 'article' ? 'trip-article' : 'trip-location';

    return renderPage(config, {
        basePath: '../../',
        seoMetadata,
        content,
        cssKey,
        tripSubmenu,
        preMain: buildTripHero(tripMetadata)
    });
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

    const sidebarHtml = buildMapSidebar(locations);
    const prevNextHtml = buildMapNavigation(allContent);

    const mapScript = locations.length > 0
        ? readTemplate('map-trip-script.html')
            .replace('{{GOOGLE_MAPS_API_KEY}}', () => getGoogleMapsApiKey())
            .replace('{{LOCATIONS_JSON}}', () => locationsJson)
        : '<p>No locations available for this trip.</p>';

    const seoMetadata = `
        <title>Map - ${escapeHtml(tripMetadata.title)} | ${escapeHtml(config.site.title)}</title>
        <meta name="description" content="Interactive map showing all locations visited during ${escapeHtml(tripMetadata.title)}">
        <link rel="canonical" href="${domain}/trips/${tripMetadata.slug}/map.html">`;

    const tripSubmenu = buildTripSubmenu(tripMetadata, allContent, 'map', './');

    const content = mapPageTemplate
        .replace(/{{NUMBERED_LOCATIONS_LIST}}/g, sidebarHtml)
        .replace(/{{MAP_SCRIPT}}/g, mapScript)
        .replace(/{{PREV_NEXT_NAV}}/g, prevNextHtml);

    return renderPage(config, {
        basePath: '../../',
        seoMetadata,
        content,
        cssKey: 'trip-map',
        tripSubmenu,
        preMain: buildTripHero(tripMetadata)
    });
}

module.exports = {
    generateTripIntroPage,
    generateTripContentPage,
    generateTripMapPage
};
