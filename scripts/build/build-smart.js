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
const { execSync } = require('child_process');

const CONFIG = require('../../lib/config-paths');
const { generateHomepage } = require('../../lib/generate-homepage');
const { generateMapPage } = require('../../lib/generate-global-pages');
const { generateTripFiles } = require('../../lib/generate-trip-files');
const { generateSitemap } = require('../../lib/generate-sitemap');
const {
    loadJsonFile,
    writeTripContentJson,
    extractTripMetadata,
    writeConfigBuilt,
    generateAndPromoteHomepage,
    generateMapPageToFile,
    generateSitemapToFile,
    generateTripHtmlPages,
    printBuildWarnings
} = require('../../lib/build-utilities');

// Import shared cache management
const {
    loadCache,
    createEmptyCache,
    saveCache,
    coreBuildFilesChanged,
    getChangedTrips,
    updateCacheForTrips,
    updateFullCache
} = require('../../lib/build-cache');

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

// Process changed trips and write per-trip JSON files
async function processChangedTrips(tripIds, buildModule, warnings) {
    const rebuiltTrips = {};
    for (const tripId of tripIds) {
        const trip = await buildModule.processTrip(tripId, warnings);
        if (trip) {
            rebuiltTrips[tripId] = trip;
            writeTripContentJson(trip, tripId, CONFIG.TRIPS_OUTPUT_DIR);
            console.log(`  💾 Saved trips/${tripId}.json`);
        }
    }
    return rebuiltTrips;
}

// Load config.built.json and merge updated trip metadata into it
function mergeIntoBuiltConfig(tripIds, rebuiltTrips, siteConfig) {
    let output;
    if (fs.existsSync(CONFIG.OUTPUT_FILE)) {
        output = loadJsonFile(CONFIG.OUTPUT_FILE);
    } else {
        output = { site: siteConfig, trips: [] };
    }

    for (const tripId of tripIds) {
        const trip = rebuiltTrips[tripId];
        if (!trip) continue;

        const tripMetadata = extractTripMetadata(trip);
        const idx = output.trips.findIndex(t => t.slug === tripId);
        if (idx >= 0) { output.trips[idx] = tripMetadata; }
        else { output.trips.push(tripMetadata); }
    }

    writeConfigBuilt(output, CONFIG.OUTPUT_FILE);
    console.log(`  💾 Updated ${CONFIG.OUTPUT_FILE}\n`);
    return output;
}

// Regenerate shared pages (homepage, map, sitemap)
function regenerateSharedPages(output, domain) {
    console.log('🏗️  Regenerating shared pages...\n');

    generateAndPromoteHomepage(output, domain, generateHomepage);
    console.log('   ✅ Homepage updated');

    generateMapPageToFile(output, domain, generateMapPage);
    console.log('   ✅ Map page updated');

    generateSitemapToFile(output.trips, domain, generateSitemap);
    console.log('   ✅ Sitemap updated');
}

async function runIncrementalBuild(tripIds) {
    console.log(`\n🔄 Incremental build for: ${tripIds.join(', ')}\n`);

    const buildModule = require('./build');
    const siteConfig = loadJsonFile(CONFIG.SITE_CONFIG);
    const domain = siteConfig.domain || 'https://example.com';

    const buildWarnings = [];
    const rebuiltTrips = await processChangedTrips(tripIds, buildModule, buildWarnings);
    const output = mergeIntoBuiltConfig(tripIds, rebuiltTrips, siteConfig);

    // Generate HTML for only the changed trips
    console.log('🏗️  Generating HTML for changed trips...\n');
    const changedTripIds = tripIds.filter(id => rebuiltTrips[id]);
    generateTripHtmlPages(changedTripIds, output, domain, CONFIG.TRIPS_OUTPUT_DIR, generateTripFiles, '      ');

    regenerateSharedPages(output, domain);

    console.log('\n✅ Incremental build complete!\n');
    printBuildWarnings(buildWarnings);

    return true;
}

// ─── Auto-detect helpers ──────────────────────────────────────────────────────

function detectChangedTrips(cache) {
    if (!cache.lastFullBuild) {
        console.log('📦 First build - running full build\n');
        return null; // signals: run full build
    }

    console.log('🔍 Checking for changes...\n');

    if (coreBuildFilesChanged(cache)) {
        console.log('\n⚠️  Core build files or templates changed - full rebuild required\n');
        return null; // signals: run full build
    }

    const changedTrips = getChangedTrips(cache);

    if (changedTrips.length === 0) {
        console.log('✅ No changes detected - nothing to build!\n');
        console.log('💡 Tips:');
        console.log('   • Edit files in content/trips/ to trigger rebuild');
        console.log('   • Use --force to rebuild everything\n');
        return []; // signals: nothing to do
    }

    console.log(`📝 ${changedTrips.length} trip(s) changed:`);
    changedTrips.forEach(id => console.log(`   - ${id}`));
    console.log('');

    return changedTrips;
}

async function handleAutoDetect() {
    const cache = loadCache();
    const changedTrips = detectChangedTrips(cache);

    if (changedTrips === null) return runFullBuild();
    if (changedTrips.length === 0) return true;

    const success = await runIncrementalBuild(changedTrips);
    if (success) {
        updateCacheForTrips(cache, changedTrips);
        saveCache(cache);
    }
    return success;
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

    if (specificTrips.length > 0) {
        console.log(`🎯 Building specific trip(s): ${specificTrips.join(', ')}\n`);
        return await runIncrementalBuild(specificTrips);
    }

    return await handleAutoDetect();
}

main().then(success => {
    process.exit(success ? 0 : 1);
}).catch(err => {
    console.error('❌ Smart build failed:', err);
    process.exit(1);
});
