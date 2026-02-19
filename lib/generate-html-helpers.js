/**
 * Shared HTML generation helpers
 * Used by generate-homepage.js, generate-trip-pages.js, and generate-global-pages.js
 */

const fs = require('fs');
const path = require('path');
const { escapeHtml } = require('./seo-metadata');

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

module.exports = { readTemplate, buildTripsMenu, formatMonthYear };
