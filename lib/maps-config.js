/**
 * Google Maps configuration
 * Single source of truth for the Maps API key and visual styling used
 * by both the trip map and global map generators.
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

/**
 * Custom map styles: desaturated, warm tones, softened labels.
 * Makes the amber route and markers the visual hero.
 * @returns {string} JSON string for embedding in map constructor
 */
function getMapStylesJson() {
    const styles = [
        { elementType: 'geometry', stylers: [{ saturation: -60 }] },
        { featureType: 'landscape', elementType: 'geometry.fill', stylers: [{ color: '#f5f0e8' }] },
        { featureType: 'water', elementType: 'geometry.fill', stylers: [{ color: '#d6e4ed' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ saturation: -80 }, { lightness: 20 }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }, { weight: 3 }] },
        { featureType: 'poi', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
        { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#b0b0b0' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
        { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#d5d0c8' }] }
    ];
    return JSON.stringify(styles);
}

module.exports = { getGoogleMapsApiKey, getMapStylesJson };
