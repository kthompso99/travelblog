/**
 * Build Cache Management
 *
 * Shared cache logic used by both full build (build.js) and smart build (build-smart.js)
 * to track what's been built and avoid unnecessary rebuilds.
 */

const fs = require('fs');
const path = require('path');
const CONFIG = require('./config-paths');
const { discoverAllTrips } = require('./build-utilities');

const CACHE_FILE = CONFIG.BUILD_CACHE_FILE;

const PATHS = {
    siteConfig: CONFIG.SITE_CONFIG,
    tripsDir: CONFIG.TRIPS_DIR,
    templatesDir: CONFIG.TEMPLATES_DIR,
    libDir: CONFIG.LIB_DIR,
    buildScript: CONFIG.BUILD_SCRIPT
};

/**
 * Load or create cache
 */
function loadCache() {
    if (fs.existsSync(CACHE_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
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
        PATHS.buildScript,
        path.join(PATHS.libDir, 'seo-metadata.js'),
        path.join(PATHS.libDir, 'generate-html.js'),
        path.join(PATHS.libDir, 'generate-sitemap.js'),
        path.join(PATHS.libDir, 'config-paths.js'),
        PATHS.siteConfig
    ];
    if (fs.existsSync(PATHS.templatesDir)) {
        files.push(...fs.readdirSync(PATHS.templatesDir)
            .filter(f => f.endsWith('.html'))
            .map(f => path.join(PATHS.templatesDir, f)));
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
        const allTrips = discoverAllTrips(PATHS.tripsDir, (tripId) => CONFIG.getTripConfigPath(tripId));
        for (const tripId of allTrips) {
            const configModTime = getFileModTime(CONFIG.getTripConfigPath(tripId));
            const contentModTime = getDirModTime(path.join(PATHS.tripsDir, tripId));
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
            contentModTime: getDirModTime(path.join(PATHS.tripsDir, tripId)),
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
        const allTrips = discoverAllTrips(PATHS.tripsDir, (tripId) => CONFIG.getTripConfigPath(tripId));
        updateCacheForTrips(cache, allTrips);
    } catch (e) { /* ignore */ }
    cache.lastFullBuild = Date.now();
}

module.exports = {
    loadCache,
    createEmptyCache,
    saveCache,
    getFileModTime,
    getDirModTime,
    getCoreFiles,
    coreBuildFilesChanged,
    getChangedTrips,
    updateCacheForTrips,
    updateFullCache
};
