/**
 * HTML Generator
 * Generates static HTML pages from templates
 */

const fs = require('fs');
const path = require('path');
const { generateTripMetadata, generateHomeMetadata, escapeHtml } = require('./seo-metadata');
const { getContentItemSlug } = require('./slug-utilities');
const { assembleTemplate } = require('./template-utilities');
const { getPageCSS } = require('./css-utilities');
const { getTripImagePath } = require('./image-utilities');
const { getGoogleMapsApiKey } = require('./maps-config');

/**
 * Read template file
 * @param {string} templateName - Template filename
 * @returns {string} Template content
 */
function readTemplate(templateName) {
    const templatePath = path.join(__dirname, '..', 'templates', templateName);
    return fs.readFileSync(templatePath, 'utf-8');
}

/**
 * Build trips menu HTML
 * @param {Array} trips - Array of trip metadata
 * @param {string} basePath - Base path for links
 * @returns {string} HTML for trips menu
 */
function buildTripsMenu(trips, basePath = '/') {
    // Group trips by continent
    const continents = {};
    trips.forEach(trip => {
        const continent = trip.metadata?.continent || 'Other';
        if (!continents[continent]) continents[continent] = [];
        continents[continent].push(trip);
    });

    let html = '';
    Object.keys(continents).sort().forEach(continent => {
        html += `
                        <div class="continent-group">
                            <div class="continent-title">${escapeHtml(continent)}<span class="continent-arrow">›</span></div>
                            <div class="continent-submenu">`;
        continents[continent].forEach(trip => {
            html += `
                                <a href="${basePath}${trip.slug}/" class="continent-submenu-item">${escapeHtml(trip.title)}</a>`;
        });
        html += `
                            </div>
                        </div>`;
    });

    return html;
}

/**
 * Format a date string (YYYY-MM-DD) as "Month Year"
 * @param {string} dateStr - ISO date string
 * @returns {string} Formatted date
 */
function formatMonthYear(dateStr) {
    if (!dateStr) return '';
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const [year, month] = dateStr.split('-');
    return months[parseInt(month, 10) - 1] + ' ' + year;
}

/**
 * Build trip grid HTML for homepage
 * @param {Array} trips - Array of trip metadata
 * @param {string} basePath - Base path for links (relative, like './' or '../../')
 * @returns {string} HTML for trip grid
 */
function buildTripGrid(trips, basePath = './') {
    let html = '';

    trips.forEach(trip => {
        const country = trip.metadata?.country || '';
        const continent = trip.metadata?.continent || '';
        const countries = trip.metadata?.countries ? trip.metadata.countries.join(', ') : country;
        const year = trip.beginDate ? trip.beginDate.split('-')[0] : '';
        const dateLabel = formatMonthYear(trip.beginDate);
        const imgHtml = trip.thumbnail
            ? `<img src="${getTripImagePath(trip.thumbnail, trip.slug, basePath, false)}" alt="${escapeHtml(trip.title)}" class="destination-card-image" loading="lazy" onerror="this.remove()">`
            : '';

        html += `
        <a href="${basePath}trips/${trip.slug}/" class="destination-card" data-trip-slug="${trip.slug}" data-continent="${escapeHtml(continent)}" data-country="${escapeHtml(country)}" data-countries="${escapeHtml(countries)}" data-year="${year}" data-title="${escapeHtml(trip.title)}">
            <div class="destination-card-image-wrapper">
                ${imgHtml}
                <div class="destination-card-overlay"></div>
                <div class="destination-card-hover-overlay"></div>
                <div class="destination-card-content">
                    <h3 class="destination-card-title">${escapeHtml(trip.title)}</h3>
                    ${country ? `<div class="destination-card-location">\u{1f4cd} ${escapeHtml(country)}</div>` : ''}
                </div>
            </div>
            <div class="destination-card-body">
                ${dateLabel ? `<span class="destination-card-badge">\u{1f4c5} ${dateLabel}</span>` : ''}
            </div>
        </a>`;
    });

    return html;
}

/**
 * Build search input + continent/year filter pills for the homepage.
 * Pills are only rendered when there are 2+ distinct values for that axis.
 * @param {Array} trips - Array of trip metadata
 * @returns {string} HTML for the filter bar
 */
function buildFilterBar(trips) {
    const continents = [...new Set(trips.map(t => t.metadata?.continent).filter(Boolean))].sort();
    const years      = [...new Set(trips.map(t => t.beginDate?.split('-')[0]).filter(Boolean))].sort().reverse();

    let html = '<div class="filter-bar">';

    // Search input (always shown)
    html += `
        <div class="search-wrapper">
            <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l3.312 3.312a1 1 0 01-1.414 1.414l-3.312-3.312A6 6 0 012 8z" clip-rule="evenodd"></path>
            </svg>
            <input type="text" class="search-input" id="trip-search" placeholder="Search trips…" autocomplete="off">
        </div>`;

    // Continent pills (only when 2+ continents)
    if (continents.length > 1) {
        html += '\n        <div class="filter-pills">';
        html += `\n            <button class="filter-pill active" data-filter="continent" data-value="all">All Continents</button>`;
        continents.forEach(c => {
            html += `\n            <button class="filter-pill" data-filter="continent" data-value="${escapeHtml(c)}">${escapeHtml(c)}</button>`;
        });
        html += '\n        </div>';
    }

    // Year pills (only when 2+ years)
    if (years.length > 1) {
        html += '\n        <div class="filter-pills">';
        html += `\n            <button class="filter-pill active" data-filter="year" data-value="all">All Years</button>`;
        years.forEach(y => {
            html += `\n            <button class="filter-pill" data-filter="year" data-value="${y}">${y}</button>`;
        });
        html += '\n        </div>';
    }

    html += '\n    </div>';
    return html;
}

/**
 * Generate homepage HTML
 * @param {Object} config - Site configuration
 * @param {string} domain - Site domain
 * @returns {string} Complete HTML page
 */
function generateHomepage(config, domain) {
    const baseTemplate = readTemplate('base.html');
    const homeTemplate = readTemplate('home-page.html');

    const seoMetadata = generateHomeMetadata(domain, config.site.title, config.site.description);
    const tripsMenu = buildTripsMenu(config.trips, './trips/');
    const tripGrid  = buildTripGrid(config.trips, './');
    const filterBar = buildFilterBar(config.trips);

    const content = homeTemplate
        .replace(/{{SITE_TITLE}}/g, escapeHtml(config.site.title))
        .replace(/{{SITE_DESCRIPTION}}/g, escapeHtml(config.site.description))
        .replace(/{{FILTER_BAR}}/g, filterBar)
        .replace(/{{TRIP_GRID}}/g, tripGrid)
        .replace(/{{APP_BASE}}/g, './');

    return assembleTemplate(baseTemplate, {
        seoMetadata,
        siteTitle: escapeHtml(config.site.title),
        basePath: './',
        tripsMenu,
        content,
        pageCSS: getPageCSS('homepage')
    });
}

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
    const baseTemplate = readTemplate('base.html');
    const tripsMenu = buildTripsMenu(config.trips, '../trips/');
    const mapConfig = buildMapConfig(config);

    const mapScript = readTemplate('map-global-script.html')
        .replace('{{GOOGLE_MAPS_API_KEY}}', () => getGoogleMapsApiKey())
        .replace('{{MAP_CONFIG_JSON}}', () => JSON.stringify(mapConfig, null, 2));

    const mapContent = `
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

    return assembleTemplate(baseTemplate, {
        seoMetadata,
        siteTitle: escapeHtml(config.site.title),
        basePath: '../',
        tripsMenu,
        content: mapContent,
        pageCSS: getPageCSS('global-map')
    });
}

/**
 * Generate about page HTML
 * @param {Object} config - Site configuration
 * @param {string} domain - Site domain
 * @returns {string} Complete HTML page
 */
async function generateAboutPage(config, domain, convertMarkdown) {
    const baseTemplate = readTemplate('base.html');
    const tripsMenu = buildTripsMenu(config.trips, '../trips/');

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

    const aboutContent = `
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

    return assembleTemplate(baseTemplate, {
        seoMetadata,
        siteTitle: escapeHtml(config.site.title),
        basePath: '../',
        tripsMenu,
        content: aboutContent,
        pageCSS: getPageCSS('about')
    });
}

/**
 * Build trip submenu HTML
 * @param {Object} tripMetadata - Trip metadata
 * @param {Array} locations - Array of location content items
 * @param {string} currentPage - Current page identifier ('intro' or location title)
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

    // Map link (NEW!)
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
 * @param {Array} locations - Array of location content items
 * @param {number} currentIndex - Index of current location
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
 * @param {Array} allContent - Array of all content items (articles and locations)
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
 * Generate trip intro page HTML
 * @param {Object} tripMetadata - Trip metadata
 * @param {Array} allContent - Array of all content items (articles and locations)
 * @param {Object} config - Site configuration
 * @param {string} domain - Site domain
 * @returns {string} Complete HTML page
 */
function generateTripIntroPage(tripMetadata, allContent, config, domain) {
    const baseTemplate = readTemplate('base.html');
    const introTemplate = readTemplate('trip-intro-page.html');

    let seoMetadata = generateTripMetadata(tripMetadata, domain, config.site.title);
    const tripsMenu = buildTripsMenu(config.trips, '../../trips/');
    const tripSubmenu = buildTripSubmenu(tripMetadata, allContent, 'intro', './');

    // Extract locations from allContent for map rendering (articles don't have coordinates)
    const locations = allContent.filter(item => item.type === 'location');

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

    const introPageContent = introTemplate
        .replace(/{{BASE_PATH}}/g, '../../')
        .replace(/{{TRIP_TITLE}}/g, escapeHtml(tripMetadata.title))
        .replace(/{{INTRO_CONTENT}}/g, introHtml)
        .replace(/{{PREV_NEXT_NAV}}/g, prevNextHtml);

    // Build full-bleed hero for PRE_MAIN
    const heroHtml = buildTripHero(tripMetadata);

    return assembleTemplate(baseTemplate, {
        seoMetadata,
        siteTitle: escapeHtml(config.site.title),
        basePath: '../../',
        tripsMenu,
        tripSubmenu,
        preMain: heroHtml,
        content: introPageContent,
        pageCSS: getPageCSS('trip-intro')
    });
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
            ${country ? '<span>\u{1f4cd} ' + escapeHtml(country) + '</span>' : ''}
            ${dateLabel ? '<span>\u{1f4c5} ' + dateLabel + '</span>' : ''}
        </div>
    </div>
</div>`;
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
    const baseTemplate = readTemplate('base.html');
    const pageTemplate = readTemplate('trip-location-page.html');

    const itemSlug = getContentItemSlug(contentItem);
    const seoMetadata = `
    <title>${escapeHtml(contentItem.title)} - ${escapeHtml(tripMetadata.title)} | ${escapeHtml(config.site.title)}</title>
    <meta name="description" content="${escapeHtml(contentItem.title)} - Part of ${escapeHtml(tripMetadata.title)}">
    <link rel="canonical" href="${domain}/trips/${tripMetadata.slug}/${itemSlug}.html">`;

    const tripsMenu = buildTripsMenu(config.trips, '../../trips/');
    const tripSubmenu = buildTripSubmenu(tripMetadata, allContent, contentItem.title, './');

    const prevNextHtml = buildPrevNextNav(allContent, contentIndex, './');
    const galleryHtml = contentItem.gallery ? buildPhotoGallery(contentItem.gallery, './') : '';
    const fullContent = (contentItem.contentHtml || '<p>Content not available</p>') + galleryHtml;

    const pageContent = pageTemplate
        .replace(/{{TRIP_TITLE}}/g, escapeHtml(tripMetadata.title))
        .replace(/{{LOCATION_TITLE}}/g, escapeHtml(contentItem.title))
        .replace(/{{LOCATION_METADATA}}/g, '')
        .replace(/{{LOCATION_CONTENT}}/g, fullContent)
        .replace(/{{PREV_NEXT_NAV}}/g, prevNextHtml);

    const cssType = contentItem.type === 'article' ? 'trip-article' : 'trip-location';

    return assembleTemplate(baseTemplate, {
        seoMetadata,
        siteTitle: escapeHtml(config.site.title),
        basePath: '../../',
        tripsMenu,
        tripSubmenu,
        preMain: buildTripHero(tripMetadata),
        content: pageContent,
        pageCSS: getPageCSS(cssType)
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
// Build numbered sidebar HTML for trip map page
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

// Build prev/next navigation for the map page (Overview ← → first content item)
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

function generateTripMapPage(tripMetadata, allContent, config, domain) {
    const baseTemplate = readTemplate('base.html');
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

    const tripsMenu = buildTripsMenu(config.trips, '../../trips/');
    const tripSubmenu = buildTripSubmenu(tripMetadata, allContent, 'map', './');

    const mapPageContent = mapPageTemplate
        .replace(/{{NUMBERED_LOCATIONS_LIST}}/g, sidebarHtml)
        .replace(/{{MAP_SCRIPT}}/g, mapScript)
        .replace(/{{PREV_NEXT_NAV}}/g, prevNextHtml);

    return assembleTemplate(baseTemplate, {
        seoMetadata,
        siteTitle: escapeHtml(config.site.title),
        basePath: '../../',
        tripsMenu,
        tripSubmenu,
        preMain: buildTripHero(tripMetadata),
        content: mapPageContent,
        pageCSS: getPageCSS('trip-map')
    });
}

module.exports = {
    generateHomepage,
    generateTripIntroPage,
    generateTripContentPage,
    generateTripMapPage,
    generateMapPage,
    generateAboutPage
};
