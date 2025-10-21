/**
 * HTML Generator
 * Generates static HTML pages from templates
 */

const fs = require('fs');
const path = require('path');
const { generateTripMetadata, generateHomeMetadata, escapeHtml } = require('./seo-metadata');

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
    const continents = {};

    trips.forEach(trip => {
        const continent = trip.metadata?.continent || 'Other';
        if (!continents[continent]) {
            continents[continent] = [];
        }
        continents[continent].push(trip);
    });

    let html = '';
    Object.keys(continents).sort().forEach(continent => {
        html += `
                        <div class="continent-group">
                            <div class="continent-title">${escapeHtml(continent)}</div>
                            <div class="continent-submenu">`;

        continents[continent].forEach(trip => {
            html += `
                                <a href="${basePath}${trip.slug}/">${escapeHtml(trip.title)}</a>`;
        });

        html += `
                            </div>
                        </div>`;
    });

    return html;
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
        const continent = trip.metadata?.continent || '';

        html += `
        <a href="${basePath}trips/${trip.slug}/" class="destination-card" data-trip-id="${trip.id}">
            <img src="${basePath}${trip.thumbnail}" alt="${escapeHtml(trip.title)}" onerror="this.src='https://via.placeholder.com/280x200?text=${encodeURIComponent(trip.title)}'">
            <div class="destination-card-content">
                <h3>${escapeHtml(trip.title)}</h3>
                <p>${escapeHtml(continent)}</p>
            </div>
        </a>`;
    });

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
    const tripGrid = buildTripGrid(config.trips, './');

    const content = homeTemplate
        .replace(/{{SITE_TITLE}}/g, escapeHtml(config.site.title))
        .replace(/{{SITE_DESCRIPTION}}/g, escapeHtml(config.site.description))
        .replace(/{{TRIP_GRID}}/g, tripGrid)
        .replace(/{{APP_BASE}}/g, './');

    const html = baseTemplate
        .replace(/{{SEO_METADATA}}/g, seoMetadata)
        .replace(/{{SITE_TITLE}}/g, escapeHtml(config.site.title))
        .replace(/{{BASE_PATH}}/g, './')
        .replace(/{{TRIPS_MENU}}/g, tripsMenu)
        .replace(/{{CONTENT}}/g, content)
        .replace(/{{SCRIPTS}}/g, '');

    return html;
}

/**
 * Generate trip page HTML
 * @param {Object} tripMetadata - Trip metadata
 * @param {Array} tripContent - Trip content items
 * @param {Object} config - Site configuration
 * @param {string} domain - Site domain
 * @returns {string} Complete HTML page
 */
function generateTripPage(tripMetadata, tripContent, config, domain) {
    const baseTemplate = readTemplate('base.html');
    const tripTemplate = readTemplate('trip-page.html');

    const seoMetadata = generateTripMetadata(tripMetadata, domain, config.site.title);
    const tripsMenu = buildTripsMenu(config.trips, '../');

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

    // Build trip content
    let contentHtml = '';
    tripContent.forEach(item => {
        if (item.type === 'location') {
            contentHtml += `
        <div class="content-item location-item">
            <h2>${escapeHtml(item.title)}</h2>
            ${item.place ? `<p class="location-meta"><strong>Location:</strong> ${escapeHtml(item.place)}</p>` : ''}
            ${item.duration ? `<p class="location-meta"><strong>Duration:</strong> ${escapeHtml(item.duration)}</p>` : ''}
            <div class="markdown-content">${item.contentHtml || '<p>Content not available</p>'}</div>
        </div>`;
        } else if (item.type === 'article') {
            contentHtml += `
        <div class="content-item article-item">
            <h2>${escapeHtml(item.title)}</h2>
            <div class="markdown-content">${item.contentHtml || '<p>Content not available</p>'}</div>
        </div>`;
        }
    });

    // Prepare content JSON for caching
    const contentJson = JSON.stringify(tripContent);

    const tripPageContent = tripTemplate
        .replace(/{{BASE_PATH}}/g, '../../')
        .replace(/{{TRIP_TITLE}}/g, escapeHtml(tripMetadata.title))
        .replace(/{{TRIP_METADATA}}/g, metadataHtml)
        .replace(/{{TRIP_CONTENT}}/g, contentHtml)
        .replace(/{{APP_BASE}}/g, '/')
        .replace(/{{TRIP_ID}}/g, tripMetadata.id)
        .replace(/{{TRIP_CONTENT_JSON}}/g, contentJson);

    const html = baseTemplate
        .replace(/{{SEO_METADATA}}/g, seoMetadata)
        .replace(/{{SITE_TITLE}}/g, escapeHtml(config.site.title))
        .replace(/{{BASE_PATH}}/g, '../../')
        .replace(/{{TRIPS_MENU}}/g, tripsMenu)
        .replace(/{{CONTENT}}/g, tripPageContent)
        .replace(/{{SCRIPTS}}/g, '');

    return html;
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

    const mapContent = `
<div id="map-view">
    <h2>World Map of Trips</h2>
    <div id="map-container">
        <div id="map"></div>
    </div>
</div>

<script>
    let map = null;
    let markers = [];
    const config = ${JSON.stringify(config, null, 2)};
    const APP_BASE = '/';

    function initMap() {
        if (!map) {
            map = L.map('map').setView([20, 0], 2);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 18
            }).addTo(map);
        }

        markers.forEach(marker => map.removeLayer(marker));
        markers = [];

        config.trips.forEach(dest => {
            if (!dest.mapCenter || !dest.mapCenter.coordinates) return;

            const marker = L.marker([dest.mapCenter.coordinates.lat, dest.mapCenter.coordinates.lng])
                .addTo(map);

            const thumbnailUrl = dest.thumbnail || \`https://via.placeholder.com/200x120/667eea/ffffff?text=\${encodeURIComponent(dest.title)}\`;

            const popupContent = \`
                <div class="marker-popup">
                    <img src="../\${thumbnailUrl}" alt="\${dest.title}" class="marker-popup-image" onerror="this.src='https://via.placeholder.com/200x120/667eea/ffffff?text=\${encodeURIComponent(dest.title)}'">
                    <div class="marker-popup-content">
                        <div class="marker-popup-title">\${dest.title}</div>
                        <a href="../trips/\${dest.slug}/" class="marker-popup-link">Read More →</a>
                    </div>
                </div>
            \`;

            marker.bindPopup(popupContent, {
                maxWidth: 250,
                className: 'custom-popup'
            });

            marker.on('mouseover', function(e) {
                this.openPopup();
            });

            marker.on('click', () => {
                window.location.href = \`../trips/\${dest.slug}/\`;
            });

            markers.push(marker);
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        initMap();
        setTimeout(() => {
            if (map) {
                map.invalidateSize();
            }
        }, 100);
    });
</script>`;

    const seoMetadata = `
    <title>Map | ${escapeHtml(config.site.title)}</title>
    <meta name="description" content="Explore all our travel destinations on an interactive world map.">
    <link rel="canonical" href="${domain}/map/">`;

    const html = baseTemplate
        .replace(/{{SEO_METADATA}}/g, seoMetadata)
        .replace(/{{SITE_TITLE}}/g, escapeHtml(config.site.title))
        .replace(/{{BASE_PATH}}/g, '../')
        .replace(/{{TRIPS_MENU}}/g, tripsMenu)
        .replace(/{{CONTENT}}/g, mapContent)
        .replace(/{{SCRIPTS}}/g, '');

    return html;
}

/**
 * Generate about page HTML
 * @param {Object} config - Site configuration
 * @param {string} domain - Site domain
 * @returns {string} Complete HTML page
 */
function generateAboutPage(config, domain) {
    const baseTemplate = readTemplate('base.html');
    const tripsMenu = buildTripsMenu(config.trips, '../trips/');

    const aboutContent = `
<div id="content-view">
    <a href="../" class="back-button">← Back to Home</a>
    <div id="content-area">
        <h1>About This Blog</h1>
        <div class="markdown-content">
            <p>Welcome to my travel blog! This is a place where I share my adventures, experiences, and discoveries from around the world.</p>
            <p>Use the map to explore all the destinations I've visited, or browse by continent in the Trips menu.</p>
        </div>
    </div>
</div>`;

    const seoMetadata = `
    <title>About | ${escapeHtml(config.site.title)}</title>
    <meta name="description" content="Learn more about our travel adventures and explorations around the world.">
    <link rel="canonical" href="${domain}/about/">`;

    const html = baseTemplate
        .replace(/{{SEO_METADATA}}/g, seoMetadata)
        .replace(/{{SITE_TITLE}}/g, escapeHtml(config.site.title))
        .replace(/{{BASE_PATH}}/g, '../')
        .replace(/{{TRIPS_MENU}}/g, tripsMenu)
        .replace(/{{CONTENT}}/g, aboutContent)
        .replace(/{{SCRIPTS}}/g, '');

    return html;
}

module.exports = {
    generateHomepage,
    generateTripPage,
    generateMapPage,
    generateAboutPage
};
