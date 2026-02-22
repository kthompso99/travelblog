/**
 * Homepage HTML generator
 * Builds the main landing page with trip grid and filter bar
 */

const { generateHomeMetadata, escapeHtml } = require('./seo-metadata');
const { getTripImagePath } = require('./image-utilities');
const { readTemplate, formatMonthYear, renderPage } = require('./generate-html-helpers');
const { fillTemplate } = require('./template-utilities');

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
                ${country ? `<div class="destination-card-location">\u{1f4cd} ${escapeHtml(country)}</div>` : ''}
                <div class="destination-card-content">
                    <h3 class="destination-card-title">${escapeHtml(trip.title)}</h3>
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

    // Combined filter row: continent pills + year dropdown
    const hasContinent = continents.length > 1;
    const hasYear = years.length > 1;

    html += '\n        <div class="filters-container">';

    // Search input (always shown)
    html += `
            <div class="search-wrapper">
                <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l3.312 3.312a1 1 0 01-1.414 1.414l-3.312-3.312A6 6 0 012 8z" clip-rule="evenodd"></path>
                </svg>
                <input type="text" class="search-input" id="trip-search" placeholder="Search trips…" autocomplete="off">
            </div>`;

    if (hasContinent) {
        html += '\n            <div class="filter-section">';
        html += '\n                <div class="filter-pills">';
        html += `\n                    <button class="filter-pill active" data-filter="continent" data-value="all">All</button>`;
        continents.forEach(c => {
            html += `\n                    <button class="filter-pill" data-filter="continent" data-value="${escapeHtml(c)}">${escapeHtml(c)}</button>`;
        });
        html += '\n                </div>';
        html += '\n            </div>';
    }

    if (hasYear) {
        html += '\n            <div class="year-filter">';
        html += '\n                <label>Year:</label>';
        html += '\n                <select class="year-dropdown" id="year-filter">';
        html += '\n                    <option value="all">All Years</option>';
        years.forEach(y => {
            html += `\n                    <option value="${y}">${y}</option>`;
        });
        html += '\n                </select>';
        html += '\n            </div>';
    }

    html += '\n        </div>';

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
    const homeTemplate = readTemplate('home-page.html');

    const seoMetadata = generateHomeMetadata(domain, config.site.title, config.site.description);
    const tripGrid  = buildTripGrid(config.trips, './');
    const filterBar = buildFilterBar(config.trips);

    const content = fillTemplate(homeTemplate, {
        SITE_TITLE: escapeHtml(config.site.title),
        SITE_DESCRIPTION: escapeHtml(config.site.description),
        FILTER_BAR: filterBar,
        TRIP_GRID: tripGrid,
        APP_BASE: './'
    });

    return renderPage(config, {
        basePath: './',
        seoMetadata,
        content,
        cssKey: 'homepage'
    });
}

module.exports = { generateHomepage };
