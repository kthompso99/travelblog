#!/usr/bin/env node

/**
 * Smart Incremental Build Script
 * Detects what changed and rebuilds only what's needed (uses cache)
 *
 * Usage:
 *   npm run build:smart              # Build only changed trips (auto-detect)
 *   npm run build:smart greece       # Build only Greece (uses cache)
 *   npm run build:smart --force      # Force rebuild all (ignores cache)
 *
 * For full rebuild without cache, use: npm run build [tripId]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONFIG = require('../../lib/config-paths');
const { generateHomepage, generateMapPage } = require('../../lib/generate-html');
const { generateTripFiles } = require('../../lib/generate-trip-files');
const { generateSitemap } = require('../../lib/generate-sitemap');
const {
    discoverTrips,
    writeTripContentJson,
    extractTripMetadata,
    writeConfigBuilt,
    generateAndPromoteHomepage,
    generateMapPageToFile,
    generateSitemapToFile,
    generateTripHtmlPages
} = require('../../lib/build-utilities');

const CACHE_FILE = CONFIG.BUILD_CACHE_FILE;

const PATHS = {
    siteConfig: CONFIG.SITE_CONFIG,
    tripsDir: CONFIG.TRIPS_DIR,
    templatesDir: CONFIG.TEMPLATES_DIR,
    libDir: CONFIG.LIB_DIR,
    buildScript: CONFIG.BUILD_SCRIPT
};

// Note: discoverTrips is now imported from lib/build-utilities.js

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

function createEmptyCache() {
    return {
        version: '1.0',
        lastFullBuild: null,
        files: {},
        trips: {}
    };
}

/**
 * Save cache
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
 * Check if core build files changed (forces full rebuild)
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
 * Get list of trips that changed
 */
function getChangedTrips(cache) {
    const changed = [];
    try {
        const allTrips = discoverTrips(PATHS.tripsDir, (tripId) => CONFIG.getTripConfigPath(tripId));
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

function updateCacheForTrips(cache, tripIds) {
    for (const tripId of tripIds) {
        cache.trips[tripId] = {
            configModTime: getFileModTime(CONFIG.getTripConfigPath(tripId)),
            contentModTime: getDirModTime(path.join(PATHS.tripsDir, tripId)),
            lastBuilt: Date.now()
        };
    }
}

function updateFullCache(cache) {
    getCoreFiles().forEach(file => { cache.files[file] = getFileModTime(file); });
    try {
        const allTrips = discoverTrips(PATHS.tripsDir, (tripId) => CONFIG.getTripConfigPath(tripId));
        updateCacheForTrips(cache, allTrips);
    } catch (e) { /* ignore */ }
    cache.lastFullBuild = Date.now();
}

function runFullBuild() {
    console.log('🔄 Running full build...\n');
    try {
        execSync('npm run build', { stdio: 'inherit' });
        const cache = createEmptyCache();
        updateFullCache(cache);
        saveCache(cache);
        console.log('\n✅ Full build complete and cache updated\n');
        return true;
    } catch (e) {
        console.error('\n❌ Build failed\n');
        return false;
    }
}

// ─── Incremental build ───────────────────────────────────────────────────────

async function runIncrementalBuild(tripIds) {
    console.log(`\n🔄 Incremental build for: ${tripIds.join(', ')}\n`);

    // Load build.js as a module to reuse processTrip and geocode functions
    const buildModule = require('./build');

    // Load geocode cache into the build module
    if (fs.existsSync(CONFIG.GEOCODE_CACHE_FILE)) {
        try {
            buildModule.setGeocodeCache(JSON.parse(fs.readFileSync(CONFIG.GEOCODE_CACHE_FILE, 'utf8')));
            console.log(`✅ Loaded geocode cache with ${Object.keys(buildModule.getGeocodeCache()).length} entries\n`);
        } catch (e) { /* start fresh */ }
    }

    const siteConfig = JSON.parse(fs.readFileSync(PATHS.siteConfig, 'utf8'));
    const domain = siteConfig.domain || 'https://example.com';

    // Process only the changed trips
    const rebuiltTrips = {};
    const buildWarnings = []; // Collect warnings during build
    for (const tripId of tripIds) {
        const trip = await buildModule.processTrip(tripId, buildWarnings);
        if (trip) {
            rebuiltTrips[tripId] = trip;

            // Write per-trip content JSON using shared function
            writeTripContentJson(trip, tripId, CONFIG.TRIPS_OUTPUT_DIR);
            console.log(`  💾 Saved trips/${tripId}.json`);
        }
    }

    // Persist geocode cache (may have new entries)
    buildModule.saveGeocodeCache();

    // Load existing config.built.json and merge in updated trip metadata
    let output;
    if (fs.existsSync(CONFIG.OUTPUT_FILE)) {
        output = JSON.parse(fs.readFileSync(CONFIG.OUTPUT_FILE, 'utf8'));
    } else {
        output = { site: siteConfig, trips: [] };
    }

    for (const tripId of tripIds) {
        const trip = rebuiltTrips[tripId];
        if (!trip) continue;

        // Extract trip metadata using shared function
        const tripMetadata = extractTripMetadata(trip);

        const idx = output.trips.findIndex(t => t.slug === tripId);
        if (idx >= 0) { output.trips[idx] = tripMetadata; }
        else { output.trips.push(tripMetadata); }
    }

    // Write config.built.json using shared function
    writeConfigBuilt(output, CONFIG.OUTPUT_FILE);
    console.log(`  💾 Updated ${CONFIG.OUTPUT_FILE}\n`);

    // Generate HTML for only the changed trips using shared function
    console.log('🏗️  Generating HTML for changed trips...\n');
    const changedTripIds = tripIds.filter(id => rebuiltTrips[id]);
    generateTripHtmlPages(changedTripIds, output, domain, CONFIG.TRIPS_OUTPUT_DIR, generateTripFiles, '      ');

    // Regenerate shared pages — these reference all trips so must always run
    console.log('🏗️  Regenerating shared pages...\n');

    generateAndPromoteHomepage(output, domain, generateHomepage);
    console.log('   ✅ Homepage updated');

    generateMapPageToFile(output, domain, generateMapPage);
    console.log('   ✅ Map page updated');

    generateSitemapToFile(output.trips, domain, generateSitemap);
    console.log('   ✅ Sitemap updated');

    console.log('\n✅ Incremental build complete!\n');

    // Print warning summary if there were any issues
    if (buildWarnings.length > 0) {
        console.log(`⚠️  Build completed with ${buildWarnings.length} warning(s):\n`);
        buildWarnings.forEach((warning, index) => {
            console.log(`   ${index + 1}. Trip: ${warning.trip}`);
            console.log(`      Location: ${warning.location}`);
            console.log(`      Issue: ${warning.type} - ${warning.message}\n`);
        });
    }

    return true;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    const args = process.argv.slice(2);
    const forceRebuild = args.includes('--force');
    const specificTrips = args.filter(arg => !arg.startsWith('--'));

    console.log('🚀 Smart Build System\n');

    if (forceRebuild) {
        console.log('🔄 Force rebuild requested\n');
        return runFullBuild();
    }

    // Specific trip(s) on command line — skip change detection
    if (specificTrips.length > 0) {
        console.log(`🎯 Building specific trip(s): ${specificTrips.join(', ')}\n`);
        return await runIncrementalBuild(specificTrips);
    }

    // Auto-detect mode
    const cache = loadCache();

    if (!cache.lastFullBuild) {
        console.log('📦 First build - running full build\n');
        return runFullBuild();
    }

    console.log('🔍 Checking for changes...\n');

    if (coreBuildFilesChanged(cache)) {
        console.log('\n⚠️  Core build files or templates changed - full rebuild required\n');
        return runFullBuild();
    }

    const changedTrips = getChangedTrips(cache);

    if (changedTrips.length === 0) {
        console.log('✅ No changes detected - nothing to build!\n');
        console.log('💡 Tips:');
        console.log('   • Edit files in content/trips/ to trigger rebuild');
        console.log('   • Use --force to rebuild everything\n');
        return true;
    }

    console.log(`📝 ${changedTrips.length} trip(s) changed:`);
    changedTrips.forEach(id => console.log(`   - ${id}`));
    console.log('');

    const success = await runIncrementalBuild(changedTrips);

    if (success) {
        updateCacheForTrips(cache, changedTrips);
        saveCache(cache);
    }

    return success;
}

main().then(success => {
    process.exit(success ? 0 : 1);
}).catch(err => {
    console.error('❌ Smart build failed:', err);
    process.exit(1);
});
