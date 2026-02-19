/**
 * Google Maps API key loader
 * Single source of truth for obtaining the Maps API key in both the
 * build pipeline (geocoding) and the HTML generator (map page script).
 */

const fs = require('fs');
const path = require('path');
const { loadJsonFile } = require('./build-utilities');

/**
 * Get Google Maps API key from environment or config file.
 * @returns {string} API key
 * @throws {Error} if no key is found
 */
function getGoogleMapsApiKey() {
    if (process.env.GOOGLE_MAPS_API_KEY) {
        return process.env.GOOGLE_MAPS_API_KEY;
    }

    const configPath = path.join(__dirname, '..', 'config', 'google-maps.json');
    if (fs.existsSync(configPath)) {
        return loadJsonFile(configPath).apiKey;
    }

    throw new Error('Google Maps API key not found. Set GOOGLE_MAPS_API_KEY env var or create config/google-maps.json');
}

module.exports = { getGoogleMapsApiKey };
