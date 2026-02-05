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
        const dateLabel = formatMonthYear(trip.beginDate);
        const imgHtml = trip.thumbnail
            ? `<img src="${basePath}${trip.thumbnail}" alt="${escapeHtml(trip.title)}" class="destination-card-image" onerror="this.remove()">`
            : '';

        html += `
        <a href="${basePath}trips/${trip.slug}/" class="destination-card" data-trip-id="${trip.id}">
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
        .replace(/{{PRE_MAIN}}/g, '')
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
        .replace(/{{PRE_MAIN}}/g, '')
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
    let hoverTimeout = null;
    const amberIcon = L.divIcon({
        className: '',
        html: '<svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z" fill="#f59e0b"/><circle cx="12" cy="12" r="5" fill="white"/></svg>',
        iconSize: [24, 36],
        iconAnchor: [12, 36],
        popupAnchor: [0, -36]
    });

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

            const marker = L.marker([dest.mapCenter.coordinates.lat, dest.mapCenter.coordinates.lng], { icon: amberIcon })
                .addTo(map);

            const popupContent = \`
                <div class="marker-popup">
                    \${dest.thumbnail ? '<img src="../' + dest.thumbnail + '" alt="' + dest.title + '" class="marker-popup-image" onerror="this.remove()">' : ''}
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

            marker.on('mouseover', function() {
                if (hoverTimeout) { clearTimeout(hoverTimeout); hoverTimeout = null; }
                this.openPopup();
            });

            marker.on('mouseout', function() {
                hoverTimeout = setTimeout(() => this.closePopup(), 300);
            });

            marker.on('popupopen', function(e) {
                var container = e.popup.getContainer();
                container.addEventListener('mouseenter', function() {
                    if (hoverTimeout) { clearTimeout(hoverTimeout); hoverTimeout = null; }
                });
                container.addEventListener('mouseleave', function() {
                    hoverTimeout = setTimeout(() => marker.closePopup(), 300);
                });
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
        .replace(/{{PRE_MAIN}}/g, '')
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
        .replace(/{{PRE_MAIN}}/g, '')
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

    // Overview link (only on intro page, anchors to #map)
    if (currentPage === 'intro') {
        html += `
                <li><a href="#map">Overview</a></li>`;
    } else {
        html += `
                <li><a href="${basePath}#map">Overview</a></li>`;
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
    // Enrich locations with slug for linking to location pages
    const locationsForMap = tripMetadata.locations.map(loc => ({
        ...loc,
        slug: loc.name.toLowerCase().replace(/\s+/g, '-')
    }));
    const locationsJson = JSON.stringify(locationsForMap);
    const mapHtml = tripMetadata.locations.length > 0 ? `
        <div id="trip-map" class="trip-static-map"></div>
        <script>
            document.addEventListener('DOMContentLoaded', function() {
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

                // Add markers with rich popups (thumbnail + name + link)
                const markers = [];
                let hoverTimeout = null;
                const amberIcon = L.divIcon({
                    className: '',
                    html: '<svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z" fill="#f59e0b"/><circle cx="12" cy="12" r="5" fill="white"/></svg>',
                    iconSize: [24, 36],
                    iconAnchor: [12, 36],
                    popupAnchor: [0, -36]
                });
                locations.forEach((loc, idx) => {
                    const marker = L.marker([loc.coordinates.lat, loc.coordinates.lng], { icon: amberIcon })
                        .addTo(map);

                    const thumbHtml = loc.thumbnail
                        ? '<img src="' + loc.thumbnail + '" alt="' + loc.name + '" class="marker-popup-image" onerror="this.remove()">'
                        : '';

                    const popupContent =
                        '<div class="marker-popup">' +
                            thumbHtml +
                            '<div class="marker-popup-content">' +
                                '<div class="marker-popup-title">' + loc.name + '</div>' +
                                '<a href="./' + loc.slug + '.html" class="marker-popup-link">Read More \u2192</a>' +
                            '</div>' +
                        '</div>';

                    marker.bindPopup(popupContent, { maxWidth: 250, className: 'custom-popup' });

                    marker.on('mouseover', function() {
                        if (hoverTimeout) { clearTimeout(hoverTimeout); hoverTimeout = null; }
                        this.openPopup();
                    });

                    marker.on('mouseout', function() {
                        hoverTimeout = setTimeout(() => this.closePopup(), 300);
                    });

                    marker.on('popupopen', function(e) {
                        var container = e.popup.getContainer();
                        container.addEventListener('mouseenter', function() {
                            if (hoverTimeout) { clearTimeout(hoverTimeout); hoverTimeout = null; }
                        });
                        container.addEventListener('mouseleave', function() {
                            hoverTimeout = setTimeout(() => marker.closePopup(), 300);
                        });
                    });

                    marker.on('click', () => {
                        window.location.href = './' + loc.slug + '.html';
                    });

                    markers.push(marker);
                });

                // Add route line connecting locations in order
                const routeCoords = locations.map(loc => [loc.coordinates.lat, loc.coordinates.lng]);
                L.polyline(routeCoords, {
                    color: '#f59e0b',
                    weight: 4,
                    opacity: 0.8,
                    dashArray: '10, 10'
                }).addTo(map);

                // Fit map to show all markers
                const bounds = L.latLngBounds(routeCoords);
                map.fitBounds(bounds, { padding: [50, 50] });
            });
        </script>
    ` : '<p>Map not available</p>';

    // Generate table of contents
    const tocHtml = buildTableOfContents(locations, './');

    // Strip leading <h1> from intro content — title is now in the hero
    const introHtml = (tripMetadata.introHtml || '<p>Trip introduction not available</p>')
        .replace(/^<h1[^>]*>.*?<\/h1>\s*/i, '');

    const introPageContent = introTemplate
        .replace(/{{BASE_PATH}}/g, '../../')
        .replace(/{{TRIP_TITLE}}/g, escapeHtml(tripMetadata.title))
        .replace(/{{INTRO_CONTENT}}/g, introHtml)
        .replace(/{{TRIP_MAP}}/g, mapHtml)
        .replace(/{{TRIP_TOC}}/g, tocHtml);

    // Build full-bleed hero for PRE_MAIN
    const country = tripMetadata.metadata?.country || '';
    const dateLabel = formatMonthYear(tripMetadata.beginDate);
    const coverImage = tripMetadata.coverImage || '';
    const heroHtml = coverImage
        ? `<div class="trip-hero">
    <div class="trip-hero-bg" style="background-image: url('../../${coverImage}')"></div>
    <div class="trip-hero-overlay"></div>
    <a href="../../" class="trip-hero-back">\u2190 Back</a>
    <div class="trip-hero-content">
        <h1>${escapeHtml(tripMetadata.title)}</h1>
        <div class="trip-hero-meta">
            ${country ? '<span>\u{1f4cd} ' + escapeHtml(country) + '</span>' : ''}
            ${dateLabel ? '<span>\u{1f4c5} ' + dateLabel + '</span>' : ''}
        </div>
    </div>
</div>`
        : '';

    const html = baseTemplate
        .replace(/{{SEO_METADATA}}/g, seoMetadata)
        .replace(/{{SITE_TITLE}}/g, escapeHtml(config.site.title))
        .replace(/{{BASE_PATH}}/g, '../../')
        .replace(/{{TRIPS_MENU}}/g, tripsMenu)
        .replace(/{{TRIP_SUBMENU}}/g, tripSubmenu)
        .replace(/{{PRE_MAIN}}/g, heroHtml)
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
        .replace(/{{PRE_MAIN}}/g, '')
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
