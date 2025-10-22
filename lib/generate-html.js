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
 * Generate OpenStreetMap URL with markers and route
 * @param {Array} locations - Array of location objects with {name, coordinates}
 * @param {number} width - Map width in pixels
 * @param {number} height - Map height in pixels
 * @returns {string} OpenStreetMap URL with markers
 */
function generateStaticMapURL(locations, width = 800, height = 400) {
    if (!locations || locations.length === 0) {
        return '';
    }

    // Calculate center and zoom based on locations
    const lats = locations.map(l => l.coordinates.lat);
    const lngs = locations.map(l => l.coordinates.lng);
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

    // Simple zoom calculation based on coordinate spread
    const latSpread = Math.max(...lats) - Math.min(...lats);
    const lngSpread = Math.max(...lngs) - Math.min(...lngs);
    const maxSpread = Math.max(latSpread, lngSpread);
    let zoom = 10;
    if (maxSpread > 10) zoom = 4;
    else if (maxSpread > 5) zoom = 5;
    else if (maxSpread > 2) zoom = 6;
    else if (maxSpread > 1) zoom = 7;
    else if (maxSpread > 0.5) zoom = 8;

    // Build marker parameters for OSM (using mlat/mlon format)
    const markerParams = locations.map((loc, idx) =>
        `&mlat${idx + 1}=${loc.coordinates.lat}&mlon${idx + 1}=${loc.coordinates.lng}`
    ).join('');

    // Use OpenStreetMap URL with markers
    return `https://www.openstreetmap.org/?mlat=${centerLat}&mlon=${centerLng}${markerParams}#map=${zoom}/${centerLat}/${centerLng}`;
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
        .replace(/{{TRIP_SUBMENU}}/g, '')
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
        .replace(/{{TRIP_SUBMENU}}/g, '')
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
        .replace(/{{TRIP_SUBMENU}}/g, '')
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
        .replace(/{{TRIP_SUBMENU}}/g, '')
        .replace(/{{CONTENT}}/g, aboutContent)
        .replace(/{{SCRIPTS}}/g, '');

    return html;
}

/**
 * Build trip submenu HTML
 * @param {Object} tripMetadata - Trip metadata
 * @param {Array} locations - Array of location content items
 * @param {string} currentPage - Current page identifier ('intro' or location title)
 * @param {string} basePath - Base path for links
 * @returns {string} HTML for trip submenu
 */
function buildTripSubmenu(tripMetadata, locations, currentPage, basePath = './') {
    let html = `
        <nav class="trip-submenu">
            <ul class="trip-submenu-links">`;

    // Map link (only on intro page, anchors to #map)
    if (currentPage === 'intro') {
        html += `
                <li><a href="#map">Map</a></li>`;
    } else {
        html += `
                <li><a href="${basePath}#map">Map</a></li>`;
    }

    // Location links
    locations.forEach(location => {
        const locationSlug = location.title.toLowerCase().replace(/\s+/g, '-');
        const isActive = currentPage === location.title;
        const activeClass = isActive ? ' class="active"' : '';

        html += `
                <li><a href="${basePath}${locationSlug}.html"${activeClass}>${escapeHtml(location.title)}</a></li>`;
    });

    html += `
            </ul>
        </nav>`;

    return html;
}

/**
 * Build table of contents HTML
 * @param {Array} locations - Array of location content items
 * @param {string} basePath - Base path for links
 * @returns {string} HTML for table of contents
 */
function buildTableOfContents(locations, basePath = './') {
    let html = '<ol class="trip-toc">';

    locations.forEach(location => {
        const locationSlug = location.title.toLowerCase().replace(/\s+/g, '-');
        html += `
            <li><a href="${basePath}${locationSlug}.html">${escapeHtml(location.title)}</a></li>`;
    });

    html += '</ol>';
    return html;
}

/**
 * Build prev/next navigation HTML
 * @param {Array} locations - Array of location content items
 * @param {number} currentIndex - Index of current location
 * @param {string} basePath - Base path for links
 * @returns {string} HTML for prev/next navigation
 */
function buildPrevNextNav(locations, currentIndex, basePath = './') {
    let html = '<div class="prev-next-links">';

    if (currentIndex > 0) {
        const prevLocation = locations[currentIndex - 1];
        const prevSlug = prevLocation.title.toLowerCase().replace(/\s+/g, '-');
        html += `
            <a href="${basePath}${prevSlug}.html" class="prev-link">← Previous: ${escapeHtml(prevLocation.title)}</a>`;
    }

    if (currentIndex < locations.length - 1) {
        const nextLocation = locations[currentIndex + 1];
        const nextSlug = nextLocation.title.toLowerCase().replace(/\s+/g, '-');
        html += `
            <a href="${basePath}${nextSlug}.html" class="next-link">Next: ${escapeHtml(nextLocation.title)} →</a>`;
    }

    html += '</div>';
    return html;
}

/**
 * Generate trip intro page HTML
 * @param {Object} tripMetadata - Trip metadata
 * @param {Array} locations - Array of location content items
 * @param {Object} config - Site configuration
 * @param {string} domain - Site domain
 * @returns {string} Complete HTML page
 */
function generateTripIntroPage(tripMetadata, locations, config, domain) {
    const baseTemplate = readTemplate('base.html');
    const introTemplate = readTemplate('trip-intro-page.html');

    const seoMetadata = generateTripMetadata(tripMetadata, domain, config.site.title);
    const tripsMenu = buildTripsMenu(config.trips, '../../trips/');
    const tripSubmenu = buildTripSubmenu(tripMetadata, locations, 'intro', './');

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

    // Generate interactive map with Leaflet
    const locationsJson = JSON.stringify(tripMetadata.locations);
    const mapHtml = tripMetadata.locations.length > 0 ? `
        <div id="trip-map" class="trip-static-map"></div>
        <script>
            (function() {
                const locations = ${locationsJson};

                // Calculate bounds
                const lats = locations.map(l => l.coordinates.lat);
                const lngs = locations.map(l => l.coordinates.lng);
                const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
                const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

                // Create map
                const map = L.map('trip-map').setView([centerLat, centerLng], 8);

                // Add OSM tile layer
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors',
                    maxZoom: 18
                }).addTo(map);

                // Add numbered markers for each location
                const markers = [];
                locations.forEach((loc, idx) => {
                    const marker = L.marker([loc.coordinates.lat, loc.coordinates.lng])
                        .addTo(map)
                        .bindPopup('<b>' + (idx + 1) + '. ' + loc.name + '</b>');

                    // Show popup on hover instead of click
                    marker.on('mouseover', function(e) {
                        this.openPopup();
                    });
                    marker.on('mouseout', function(e) {
                        this.closePopup();
                    });

                    markers.push(marker);
                });

                // Add route line connecting locations in order
                const routeCoords = locations.map(loc => [loc.coordinates.lat, loc.coordinates.lng]);
                L.polyline(routeCoords, {
                    color: '#4a5fc1',
                    weight: 4,
                    opacity: 0.8,
                    dashArray: '10, 10'
                }).addTo(map);

                // Fit map to show all markers
                const bounds = L.latLngBounds(routeCoords);
                map.fitBounds(bounds, { padding: [50, 50] });
            })();
        </script>
    ` : '<p>Map not available</p>';

    // Generate table of contents
    const tocHtml = buildTableOfContents(locations, './');

    const introPageContent = introTemplate
        .replace(/{{BASE_PATH}}/g, '../../')
        .replace(/{{TRIP_TITLE}}/g, escapeHtml(tripMetadata.title))
        .replace(/{{TRIP_METADATA}}/g, metadataHtml)
        .replace(/{{INTRO_CONTENT}}/g, tripMetadata.introHtml || '<p>Trip introduction not available</p>')
        .replace(/{{TRIP_MAP}}/g, mapHtml)
        .replace(/{{TRIP_TOC}}/g, tocHtml);

    const html = baseTemplate
        .replace(/{{SEO_METADATA}}/g, seoMetadata)
        .replace(/{{SITE_TITLE}}/g, escapeHtml(config.site.title))
        .replace(/{{BASE_PATH}}/g, '../../')
        .replace(/{{TRIPS_MENU}}/g, tripsMenu)
        .replace(/{{TRIP_SUBMENU}}/g, tripSubmenu)
        .replace(/{{CONTENT}}/g, introPageContent)
        .replace(/{{SCRIPTS}}/g, '');

    return html;
}

/**
 * Generate trip location page HTML
 * @param {Object} tripMetadata - Trip metadata
 * @param {Object} location - Location content item
 * @param {Array} allLocations - Array of all location content items
 * @param {number} locationIndex - Index of this location
 * @param {Object} config - Site configuration
 * @param {string} domain - Site domain
 * @returns {string} Complete HTML page
 */
function generateTripLocationPage(tripMetadata, location, allLocations, locationIndex, config, domain) {
    const baseTemplate = readTemplate('base.html');
    const locationTemplate = readTemplate('trip-location-page.html');

    const locationSlug = location.title.toLowerCase().replace(/\s+/g, '-');
    const seoMetadata = `
    <title>${escapeHtml(location.title)} - ${escapeHtml(tripMetadata.title)} | ${escapeHtml(config.site.title)}</title>
    <meta name="description" content="${escapeHtml(location.title)} - Part of ${escapeHtml(tripMetadata.title)}">
    <link rel="canonical" href="${domain}/trips/${tripMetadata.slug}/${locationSlug}.html">`;

    const tripsMenu = buildTripsMenu(config.trips, '../../trips/');
    const tripSubmenu = buildTripSubmenu(tripMetadata, allLocations, location.title, './');

    // Build location metadata section
    let metadataHtml = '';
    if (location.place) {
        metadataHtml += `<p class="location-meta"><strong>Location:</strong> ${escapeHtml(location.place)}</p>`;
    }
    if (location.duration) {
        metadataHtml += `<p class="location-meta"><strong>Duration:</strong> ${escapeHtml(location.duration)}</p>`;
    }

    // Build prev/next navigation
    const prevNextHtml = buildPrevNextNav(allLocations, locationIndex, './');

    const locationPageContent = locationTemplate
        .replace(/{{TRIP_TITLE}}/g, escapeHtml(tripMetadata.title))
        .replace(/{{LOCATION_TITLE}}/g, escapeHtml(location.title))
        .replace(/{{LOCATION_METADATA}}/g, metadataHtml)
        .replace(/{{LOCATION_CONTENT}}/g, location.contentHtml || '<p>Content not available</p>')
        .replace(/{{PREV_NEXT_NAV}}/g, prevNextHtml);

    const html = baseTemplate
        .replace(/{{SEO_METADATA}}/g, seoMetadata)
        .replace(/{{SITE_TITLE}}/g, escapeHtml(config.site.title))
        .replace(/{{BASE_PATH}}/g, '../../')
        .replace(/{{TRIPS_MENU}}/g, tripsMenu)
        .replace(/{{TRIP_SUBMENU}}/g, tripSubmenu)
        .replace(/{{CONTENT}}/g, locationPageContent)
        .replace(/{{SCRIPTS}}/g, '');

    return html;
}

module.exports = {
    generateHomepage,
    generateTripPage,
    generateTripIntroPage,
    generateTripLocationPage,
    generateMapPage,
    generateAboutPage
};
