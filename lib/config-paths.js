/**
 * Centralized Configuration Paths
 *
 * SINGLE SOURCE OF TRUTH for all file/directory paths in the project.
 * If you change the structure, update paths HERE and all scripts will stay in sync.
 *
 * Used by:
 * - scripts/build/build.js, build-smart.js, build-writing.js
 * - scripts/validate.js
 * - scripts/tools/add-trip.js, content-report.js, sync-takeout-photos.js, optimize-images.js, assign-photos.js
 * - lib/build-cache.js, build-utilities.js, generate-trip-files.js
 */

module.exports = {
    // Site configuration
    SITE_CONFIG: 'config/site.json',

    // Trips directory (auto-discovered by scanning subdirectories)
    TRIPS_DIR: 'content/trips',

    // Trip structure (within each trip directory)
    // Example: content/trips/greece/trip.json
    TRIP_CONFIG_FILE: 'trip.json',
    TRIP_MAIN_FILE: 'main.md',

    // Build output
    OUTPUT_FILE: 'config.built.json',
    TRIPS_OUTPUT_DIR: 'trips',

    // Cache
    CACHE_DIR: '_cache',
    GEOCODE_CACHE_FILE: '_cache/geocode.json',
    BUILD_CACHE_FILE: '_cache/build-cache.json',

    // Templates
    TEMPLATES_DIR: 'templates',

    // Libraries
    LIB_DIR: 'lib',

    // Build scripts (for build-smart.js reference)
    BUILD_SCRIPT: 'scripts/build/build.js',

    // Valid metadata values
    VALID_CONTINENTS: [
        'Africa',
        'Antarctica',
        'Asia',
        'Europe',
        'North America',
        'South America',
        'Oceania'
    ],

    /**
     * Helper: Get path to trip directory
     * @param {string} tripId - Trip ID
     * @returns {string} Path to trip directory
     */
    getTripDir(tripId) {
        return `${this.TRIPS_DIR}/${tripId}`;
    },

    /**
     * Helper: Get path to trip config file
     * @param {string} tripId - Trip ID
     * @returns {string} Path to trip.json
     */
    getTripConfigPath(tripId) {
        return `${this.TRIPS_DIR}/${tripId}/${this.TRIP_CONFIG_FILE}`;
    },

    /**
     * Helper: Get path to trip main.md file
     * @param {string} tripId - Trip ID
     * @returns {string} Path to main.md
     */
    getTripMainPath(tripId) {
        return `${this.TRIPS_DIR}/${tripId}/${this.TRIP_MAIN_FILE}`;
    },

    /**
     * Helper: Get path to trip images directory
     * @param {string} tripId - Trip ID
     * @returns {string} Path to images/ directory
     */
    getTripImagesDir(tripId) {
        return `${this.TRIPS_DIR}/${tripId}/images`;
    },

    /**
     * Helper: Get path to synced photos markdown
     * @param {string} tripId - Trip ID
     * @returns {string} Path to all-synced-photos.md
     */
    getSyncedPhotosPath(tripId) {
        return `${this.TRIPS_DIR}/${tripId}/images/all-synced-photos.md`;
    }
};
