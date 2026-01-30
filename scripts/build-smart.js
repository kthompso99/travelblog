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

const CACHE_FILE = '.build-cache.json';

// File/directory paths
const PATHS = {
    siteConfig: 'config/site.json',
    indexConfig: 'content/index.json',
    tripsDir: 'content/trips',
    contentDir: 'content/trips',
    templatesDir: 'templates',
    libDir: 'lib',
    buildScript: 'scripts/build.js'
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
function coreBuildFilesChanged(cache) {
    const coreFiles = [
        PATHS.buildScript,
        path.join(PATHS.libDir, 'seo-metadata.js'),
        path.join(PATHS.libDir, 'generate-html.js'),
        path.join(PATHS.libDir, 'generate-sitemap.js'),
        PATHS.siteConfig,
        PATHS.indexConfig
    ];

    // Check template files
    if (fs.existsSync(PATHS.templatesDir)) {
        const templates = fs.readdirSync(PATHS.templatesDir)
            .filter(f => f.endsWith('.html'))
            .map(f => path.join(PATHS.templatesDir, f));

        coreFiles.push(...templates);
    }

    for (const file of coreFiles) {
        const modTime = getFileModTime(file);
        const cachedTime = cache.files[file] || 0;

        if (modTime > cachedTime) {
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
        const indexConfig = JSON.parse(fs.readFileSync(PATHS.indexConfig, 'utf8'));

        for (const tripId of indexConfig.trips) {
            const tripConfigFile = path.join(PATHS.tripsDir, `${tripId}.json`);
            const tripContentDir = path.join(PATHS.contentDir, tripId);

            const configModTime = getFileModTime(tripConfigFile);
            const contentModTime = getDirModTime(tripContentDir);

            const cachedTrip = cache.trips[tripId] || {};

            if (configModTime > (cachedTrip.configModTime || 0) ||
                contentModTime > (cachedTrip.contentModTime || 0)) {
                changed.push(tripId);
            }
        }
    } catch (e) {
        console.error('Error reading trip configs:', e.message);
    }

    return changed;
}

/**
 * Update cache with current file times
 */
function updateCache(cache) {
    // Update core files
    const coreFiles = [
        PATHS.buildScript,
        path.join(PATHS.libDir, 'seo-metadata.js'),
        path.join(PATHS.libDir, 'generate-html.js'),
        path.join(PATHS.libDir, 'generate-sitemap.js'),
        PATHS.siteConfig,
        PATHS.indexConfig
    ];

    // Add template files
    if (fs.existsSync(PATHS.templatesDir)) {
        const templates = fs.readdirSync(PATHS.templatesDir)
            .filter(f => f.endsWith('.html'))
            .map(f => path.join(PATHS.templatesDir, f));

        coreFiles.push(...templates);
    }

    coreFiles.forEach(file => {
        cache.files[file] = getFileModTime(file);
    });

    // Update trip times
    try {
        const indexConfig = JSON.parse(fs.readFileSync(PATHS.indexConfig, 'utf8'));

        for (const tripId of indexConfig.trips) {
            const tripConfigFile = path.join(PATHS.tripsDir, `${tripId}.json`);
            const tripContentDir = path.join(PATHS.contentDir, tripId);

            cache.trips[tripId] = {
                configModTime: getFileModTime(tripConfigFile),
                contentModTime: getDirModTime(tripContentDir),
                lastBuilt: Date.now()
            };
        }
    } catch (e) {
        console.error('Error updating trip cache:', e.message);
    }
}

/**
 * Run full build
 */
function runFullBuild() {
    console.log('🔄 Running full build...\n');

    try {
        execSync('npm run build', { stdio: 'inherit' });

        const cache = createEmptyCache();
        cache.lastFullBuild = Date.now();
        updateCache(cache);
        saveCache(cache);

        console.log('\n✅ Full build complete and cache updated\n');
        return true;
    } catch (e) {
        console.error('\n❌ Build failed\n');
        return false;
    }
}

/**
 * Main function
 */
function main() {
    const args = process.argv.slice(2);
    const forceRebuild = args.includes('--force');
    const specificTrips = args.filter(arg => !arg.startsWith('--'));

    console.log('🚀 Smart Build System\n');

    // Force rebuild
    if (forceRebuild) {
        console.log('🔄 Force rebuild requested\n');
        return runFullBuild();
    }

    // Specific trip rebuild
    if (specificTrips.length > 0) {
        console.log(`🎯 Specific trip build not yet implemented: ${specificTrips.join(', ')}`);
        console.log('   Running full build for now...\n');
        return runFullBuild();
    }

    // Load cache
    const cache = loadCache();

    // First build ever
    if (!cache.lastFullBuild) {
        console.log('📦 First build - running full build\n');
        return runFullBuild();
    }

    // Check what changed
    console.log('🔍 Checking for changes...\n');

    const coreChanged = coreBuildFilesChanged(cache);

    if (coreChanged) {
        console.log('\n⚠️  Core build files or templates changed');
        console.log('   Full rebuild required\n');
        return runFullBuild();
    }

    const changedTrips = getChangedTrips(cache);

    if (changedTrips.length === 0) {
        console.log('✅ No changes detected - nothing to build!\n');
        console.log('💡 Tips:');
        console.log('   • Use --force to rebuild everything');
        console.log('   • Edit files in content/trips/ to trigger rebuild\n');
        return true;
    }

    console.log(`📝 ${changedTrips.length} trip(s) changed:`);
    changedTrips.forEach(id => console.log(`   - ${id}`));
    console.log('');

    // For now, do full build if any trip changed
    // TODO: Implement selective rebuild
    console.log('⚠️  Incremental trip rebuild not yet fully implemented');
    console.log('   Running full build (this will be optimized in future)\n');

    return runFullBuild();
}

// Run
const success = main();
process.exit(success ? 0 : 1);
