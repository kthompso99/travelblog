/**
 * Build Cache Management
 *
 * Shared cache logic used by both full build (build.js) and smart build (build-smart.js)
 * to track what's been built and avoid unnecessary rebuilds.
 */

const fs = require('fs');
const path = require('path');
const CONFIG = require('./config-paths');
const { discoverAllTrips, loadJsonFile } = require('./build-utilities');

const CACHE_FILE = CONFIG.BUILD_CACHE_FILE;

/**
 * Load or create cache
 */
function loadCache() {
    if (fs.existsSync(CACHE_FILE)) {
        try {
            return loadJsonFile(CACHE_FILE);
        } catch (e) {
            return createEmptyCache();
        }
    }
    return createEmptyCache();
}

/**
 * Create empty cache structure
 */
function createEmptyCache() {
    return {
        lastFullBuild: null,
        files: {},
        trips: {}
    };
}

/**
 * Save cache to file
 */
function saveCache(cache) {
    cache.lastUpdate = new Date().toISOString();
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
}

/**
 * Get file modification time
 */
function getFileModTime(filePath) {
    try {
        return fs.statSync(filePath).mtime.getTime();
    } catch (e) {
        return 0;
    }
}

/**
 * Get modification time for entire directory recursively
 */
function getDirModTime(dirPath) {
    let maxTime = 0;

    try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);

            if (entry.isDirectory()) {
                maxTime = Math.max(maxTime, getDirModTime(fullPath));
            } else {
                maxTime = Math.max(maxTime, getFileModTime(fullPath));
            }
        }
    } catch (e) {
        // Directory doesn't exist
    }

    return maxTime;
}

/**
 * Get list of core build files that trigger full rebuild when changed
 */
function getCoreFiles() {
    const files = [
        CONFIG.BUILD_SCRIPT,
        path.join(CONFIG.LIB_DIR, 'seo-metadata.js'),
        path.join(CONFIG.LIB_DIR, 'generate-html.js'),
        path.join(CONFIG.LIB_DIR, 'generate-sitemap.js'),
        path.join(CONFIG.LIB_DIR, 'config-paths.js'),
        CONFIG.SITE_CONFIG
    ];
    if (fs.existsSync(CONFIG.TEMPLATES_DIR)) {
        files.push(...fs.readdirSync(CONFIG.TEMPLATES_DIR)
            .filter(f => f.endsWith('.html'))
            .map(f => path.join(CONFIG.TEMPLATES_DIR, f)));
    }
    return files;
}

/**
 * Check if core build files changed (forces full rebuild)
 */
function coreBuildFilesChanged(cache) {
    for (const file of getCoreFiles()) {
        if (getFileModTime(file) > (cache.files[file] || 0)) {
            console.log(`   📝 Changed: ${file}`);
            return true;
        }
    }
    return false;
}

/**
 * Get list of trips that changed since last build
 */
function getChangedTrips(cache) {
    const changed = [];
    try {
        const allTrips = discoverAllTrips(CONFIG.TRIPS_DIR, (tripId) => CONFIG.getTripConfigPath(tripId));
        for (const tripId of allTrips) {
            const configModTime = getFileModTime(CONFIG.getTripConfigPath(tripId));
            const contentModTime = getDirModTime(path.join(CONFIG.TRIPS_DIR, tripId));
            const cached = cache.trips[tripId] || {};
            if (configModTime > (cached.configModTime || 0) || contentModTime > (cached.contentModTime || 0)) {
                changed.push(tripId);
            }
        }
    } catch (e) {
        console.error('Error checking for changed trips:', e.message);
    }
    return changed;
}

/**
 * Update cache for specific trips
 */
function updateCacheForTrips(cache, tripIds) {
    for (const tripId of tripIds) {
        cache.trips[tripId] = {
            configModTime: getFileModTime(CONFIG.getTripConfigPath(tripId)),
            contentModTime: getDirModTime(path.join(CONFIG.TRIPS_DIR, tripId)),
            lastBuilt: Date.now()
        };
    }
}

/**
 * Update cache for all trips and core files (full build)
 */
function updateFullCache(cache) {
    getCoreFiles().forEach(file => { cache.files[file] = getFileModTime(file); });
    try {
        const allTrips = discoverAllTrips(CONFIG.TRIPS_DIR, (tripId) => CONFIG.getTripConfigPath(tripId));
        updateCacheForTrips(cache, allTrips);
    } catch (e) { /* ignore */ }
    cache.lastFullBuild = Date.now();
}

module.exports = {
    loadCache,
    createEmptyCache,
    saveCache,
    coreBuildFilesChanged,
    getChangedTrips,
    updateCacheForTrips,
    updateFullCache
};
