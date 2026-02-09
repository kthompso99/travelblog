#!/usr/bin/env node

/**
 * Smart Incremental Build Script
 * Detects what changed and rebuilds only what's needed
 *
 * Usage:
 *   npm run build:smart              # Build only what changed
 *   npm run build:smart -- --force   # Force full rebuild
 *   npm run build:smart -- greece    # Build only Greece
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { slugify } = require('../lib/slug-utilities');

const CONFIG = require('../lib/config-paths');
const { generateHomepage, generateTripIntroPage, generateTripLocationPage, generateMapPage } = require('../lib/generate-html');
const { generateSitemap } = require('../lib/generate-sitemap');

const CACHE_FILE = CONFIG.BUILD_CACHE_FILE;

const PATHS = {
    siteConfig: CONFIG.SITE_CONFIG,
    tripsDir: CONFIG.TRIPS_DIR,
    templatesDir: CONFIG.TEMPLATES_DIR,
    libDir: CONFIG.LIB_DIR,
    buildScript: CONFIG.BUILD_SCRIPT
};

/**
 * Discover all trips by scanning the trips directory
 * Returns trip IDs sorted in reverse chronological order (newest first)
 * @returns {Array} Array of trip IDs sorted by beginDate (newest first)
 */
function discoverTrips() {
    const tripsDir = PATHS.tripsDir;

    if (!fs.existsSync(tripsDir)) {
        return [];
    }

    const entries = fs.readdirSync(tripsDir, { withFileTypes: true });
    const tripDirs = entries.filter(entry => entry.isDirectory()).map(entry => entry.name);

    const trips = [];
    for (const tripId of tripDirs) {
        const tripConfigPath = CONFIG.getTripConfigPath(tripId);
        if (!fs.existsSync(tripConfigPath)) continue;

        try {
            const tripData = fs.readFileSync(tripConfigPath, 'utf8');
            const tripConfig = JSON.parse(tripData);
            trips.push({
                id: tripId,
                beginDate: tripConfig.beginDate || '1970-01-01'
            });
        } catch (e) {
            // Skip trips with invalid config
        }
    }

    trips.sort((a, b) => new Date(b.beginDate) - new Date(a.beginDate));
    return trips.map(trip => trip.id);
}

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
        const allTrips = discoverTrips();
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
        const allTrips = discoverTrips();
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
    for (const tripId of tripIds) {
        const trip = await buildModule.processTrip(tripId);
        if (trip) {
            rebuiltTrips[tripId] = trip;

            // Write per-trip content JSON
            const tripContentFile = path.join(CONFIG.TRIPS_OUTPUT_DIR, `${tripId}.json`);
            fs.writeFileSync(tripContentFile, JSON.stringify({
                id: trip.id,
                introHtml: trip.introHtml,
                content: trip.content
            }, null, 2), 'utf8');
            console.log(`  💾 Saved ${tripContentFile}`);
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

        const tripMetadata = {
            id: trip.id, title: trip.title, slug: trip.slug,
            published: trip.published, beginDate: trip.beginDate,
            endDate: trip.endDate, duration: trip.duration,
            metadata: trip.metadata, coverImage: trip.coverImage,
            thumbnail: trip.thumbnail, mapCenter: trip.mapCenter,
            locations: trip.locations, relatedTrips: trip.relatedTrips
        };

        const idx = output.trips.findIndex(t => t.id === tripId);
        if (idx >= 0) { output.trips[idx] = tripMetadata; }
        else { output.trips.push(tripMetadata); }
    }

    fs.writeFileSync(CONFIG.OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8');
    console.log(`  💾 Updated ${CONFIG.OUTPUT_FILE}\n`);

    // Generate HTML for only the changed trips
    console.log('🏗️  Generating HTML for changed trips...\n');
    for (const tripId of tripIds) {
        if (!rebuiltTrips[tripId]) continue;

        const tripMetadata = output.trips.find(t => t.id === tripId);
        const tripContentData = JSON.parse(fs.readFileSync(
            path.join(CONFIG.TRIPS_OUTPUT_DIR, `${tripId}.json`), 'utf8'));

        const tripDir = path.join('trips', tripMetadata.slug);
        if (!fs.existsSync(tripDir)) fs.mkdirSync(tripDir, { recursive: true });

        const locations = tripContentData.content.filter(item => item.type === 'location');
        tripMetadata.introHtml = tripContentData.introHtml;

        // Intro page
        fs.writeFileSync(path.join(tripDir, 'index.html'),
            generateTripIntroPage(tripMetadata, locations, output, domain), 'utf8');
        console.log(`      ✅ Intro page → ${tripDir}/index.html`);

        // Location pages
        locations.forEach((location, locationIndex) => {
            const locationSlug = slugify(location.title);
            fs.writeFileSync(path.join(tripDir, `${locationSlug}.html`),
                generateTripLocationPage(tripMetadata, location, locations, locationIndex, output, domain), 'utf8');
            console.log(`      ✅ ${location.title} → ${tripDir}/${locationSlug}.html`);
        });

        // Copy images
        const imgSrc = path.join(CONFIG.TRIPS_DIR, tripId, 'images');
        const imgDst = path.join(tripDir, 'images');
        if (fs.existsSync(imgSrc)) {
            if (!fs.existsSync(imgDst)) fs.mkdirSync(imgDst, { recursive: true });
            let count = 0;
            for (const file of fs.readdirSync(imgSrc)) {
                const src = path.join(imgSrc, file);
                if (fs.statSync(src).isFile()) { fs.copyFileSync(src, path.join(imgDst, file)); count++; }
            }
            if (count > 0) console.log(`      📷 Copied ${count} image(s)`);
        }
        console.log('');
    }

    // Regenerate shared pages — these reference all trips so must always run
    console.log('🏗️  Regenerating shared pages...\n');

    fs.writeFileSync('index.html.new', generateHomepage(output, domain), 'utf8');
    // Auto-promote in incremental mode (you're actively iterating)
    if (fs.existsSync('index.html')) fs.copyFileSync('index.html', 'index.html.backup');
    fs.renameSync('index.html.new', 'index.html');
    console.log('   ✅ Homepage updated');

    if (!fs.existsSync('map')) fs.mkdirSync('map', { recursive: true });
    fs.writeFileSync('map/index.html', generateMapPage(output, domain), 'utf8');
    console.log('   ✅ Map page updated');

    fs.writeFileSync('sitemap.xml', generateSitemap(output.trips, domain), 'utf8');
    console.log('   ✅ Sitemap updated');

    console.log('\n✅ Incremental build complete!\n');
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
