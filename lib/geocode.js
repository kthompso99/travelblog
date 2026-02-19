/**
 * Geocoding utilities
 * Wraps the Google Maps Geocoding API with a file-backed cache so that
 * coordinates only need to be fetched once per unique place name.
 */

const fs = require('fs');
const https = require('https');
const CONFIG = require('./config-paths');
const { getGoogleMapsApiKey } = require('./maps-config');
const { ensureDir, loadJsonFile } = require('./build-utilities');

let cache = {};

/**
 * Load the geocode cache from disk.
 * Logs the result so callers don't have to.
 */
function loadGeocodeCache() {
    if (!fs.existsSync(CONFIG.GEOCODE_CACHE_FILE)) return;
    try {
        cache = loadJsonFile(CONFIG.GEOCODE_CACHE_FILE);
        console.log(`✅ Loaded geocode cache with ${Object.keys(cache).length} entries\n`);
    } catch (e) {
        const backupPath = CONFIG.GEOCODE_CACHE_FILE + '.corrupt';
        try { fs.copyFileSync(CONFIG.GEOCODE_CACHE_FILE, backupPath); } catch (_) { /* ignore */ }
        console.log(`⚠️  Could not load geocode cache (backed up to ${backupPath}), starting fresh\n`);
    }
}

/**
 * Persist the current cache to disk.
 */
function saveGeocodeCache() {
    ensureDir(CONFIG.CACHE_DIR);
    fs.writeFileSync(CONFIG.GEOCODE_CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
}

/**
 * Geocode a location using the Google Maps Geocoding API (with caching).
 * @param {string} locationName - Human-readable place name
 * @returns {Promise<{lat: number, lng: number}>} Coordinates
 */
function geocodeLocation(locationName) {
    if (cache[locationName]) {
        console.log(`    💾 Using cached coordinates for: ${locationName}`);
        return Promise.resolve(cache[locationName]);
    }

    let apiKey;
    try {
        apiKey = getGoogleMapsApiKey();
    } catch (e) {
        return Promise.reject(new Error('Google Maps API key not configured'));
    }

    return new Promise((resolve, reject) => {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationName)}&key=${apiKey}`;

        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.status === 'OK' && json.results && json.results.length > 0) {
                        const location = json.results[0].geometry.location;
                        const coords = { lat: location.lat, lng: location.lng };
                        cache[locationName] = coords;
                        saveGeocodeCache();
                        resolve(coords);
                    } else if (json.status === 'ZERO_RESULTS') {
                        reject(new Error('No results found'));
                    } else {
                        reject(new Error(`Geocoding failed: ${json.status}`));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

module.exports = { loadGeocodeCache, geocodeLocation };
