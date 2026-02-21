#!/usr/bin/env node

/**
 * Unit tests for lib/build-cache.js
 * Tests cache invalidation logic and core file detection
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { createTestRunner } = require('./test-helpers');
const {
    loadCache,
    createEmptyCache,
    saveCache,
    coreBuildFilesChanged,
    getChangedTrips,
    updateCacheForTrips,
    updateFullCache
} = require('../../lib/build-cache');
const CONFIG = require('../../lib/config-paths');

const { assert, report } = createTestRunner('📦 Build cache tests');

// ── Test cache structure ────────────────────────────────────────

const emptyCache = createEmptyCache();
assert('createEmptyCache: returns object', typeof emptyCache === 'object');
assert('createEmptyCache: has lastFullBuild field', 'lastFullBuild' in emptyCache);
assert('createEmptyCache: has files field', 'files' in emptyCache);
assert('createEmptyCache: has trips field', 'trips' in emptyCache);
assert('createEmptyCache: files is object', typeof emptyCache.files === 'object');
assert('createEmptyCache: trips is object', typeof emptyCache.trips === 'object');

// ── Test cache loading ──────────────────────────────────────────

const cache = loadCache();
assert('loadCache: returns object', typeof cache === 'object');
assert('loadCache: has required structure', 'files' in cache && 'trips' in cache);

// ── CRITICAL: Test getCoreFiles returns only existing files ─────

// This is the test that would have caught the generate-html.js bug!
// We need to access getCoreFiles indirectly by checking what coreBuildFilesChanged touches

// Read build-cache.js to extract the getCoreFiles logic
const buildCacheSource = fs.readFileSync(path.join(__dirname, '../../lib/build-cache.js'), 'utf8');
const getCoreFilesMatch = buildCacheSource.match(/function getCoreFiles\(\) \{([\s\S]*?)\n\}/);

if (getCoreFilesMatch) {
    // Extract the hardcoded file paths from the function
    const coreFilesPaths = [];
    const pathJoinMatches = getCoreFilesMatch[1].matchAll(/path\.join\(CONFIG\.LIB_DIR,\s*['"](.*?)['"]\)/g);

    for (const match of pathJoinMatches) {
        const filename = match[1];
        const fullPath = path.join(CONFIG.LIB_DIR, filename);
        coreFilesPaths.push({ filename, fullPath });
    }

    // Test each hardcoded lib file actually exists
    let allCoreFilesExist = true;
    const missingFiles = [];

    for (const { filename, fullPath } of coreFilesPaths) {
        if (!fs.existsSync(fullPath)) {
            allCoreFilesExist = false;
            missingFiles.push(filename);
        }
    }

    assert('getCoreFiles: all hardcoded lib/ files exist',
        allCoreFilesExist,
        missingFiles.length > 0 ? `Missing files: ${missingFiles.join(', ')}` : undefined);
}

// ── Test core build files detection ─────────────────────────────

// Test 1: Empty cache should report changes
const freshCache = createEmptyCache();
const hasChanges = coreBuildFilesChanged(freshCache);
assert('coreBuildFilesChanged: detects changes with empty cache', hasChanges === true);

// Test 2: Test that actual core files are checked
const testCacheWithFiles = createEmptyCache();
// Set timestamps for known files
testCacheWithFiles.files[CONFIG.BUILD_SCRIPT] = fs.statSync(CONFIG.BUILD_SCRIPT).mtime.getTime();
testCacheWithFiles.files[CONFIG.SITE_CONFIG] = fs.statSync(CONFIG.SITE_CONFIG).mtime.getTime();

// Important lib files that should trigger rebuilds
const criticalLibFiles = [
    'generate-homepage.js',
    'generate-trip-pages.js',
    'generate-global-pages.js',
    'generate-html-helpers.js'
];

let allCriticalFilesExist = true;
const missingCriticalFiles = [];

for (const filename of criticalLibFiles) {
    const filepath = path.join(CONFIG.LIB_DIR, filename);
    if (fs.existsSync(filepath)) {
        testCacheWithFiles.files[filepath] = fs.statSync(filepath).mtime.getTime();
    } else {
        allCriticalFilesExist = false;
        missingCriticalFiles.push(filename);
    }
}

assert('Critical HTML generation files exist',
    allCriticalFilesExist,
    missingCriticalFiles.length > 0 ? `Missing: ${missingCriticalFiles.join(', ')}` : undefined);

// ── Test trip change detection ──────────────────────────────────

// Test with fresh cache - should detect all trips as changed
const changedTrips = getChangedTrips(createEmptyCache());
assert('getChangedTrips: returns array', Array.isArray(changedTrips));
assert('getChangedTrips: detects trips with empty cache', changedTrips.length > 0);

// ── Test cache update functions ─────────────────────────────────

const updateTestCache = createEmptyCache();
updateCacheForTrips(updateTestCache, ['spain']);
assert('updateCacheForTrips: adds trip to cache', 'spain' in updateTestCache.trips);
assert('updateCacheForTrips: stores configModTime', 'configModTime' in (updateTestCache.trips.spain || {}));
assert('updateCacheForTrips: stores contentModTime', 'contentModTime' in (updateTestCache.trips.spain || {}));
assert('updateCacheForTrips: stores lastBuilt', 'lastBuilt' in (updateTestCache.trips.spain || {}));

const fullCacheTest = createEmptyCache();
updateFullCache(fullCacheTest);
assert('updateFullCache: sets lastFullBuild timestamp', fullCacheTest.lastFullBuild !== null);
assert('updateFullCache: populates files object', Object.keys(fullCacheTest.files).length > 0);

// ── Test cache persistence ──────────────────────────────────────

const TEST_CACHE_FILE = path.join(CONFIG.CACHE_DIR, 'test-build-cache.json');

// Create test cache and save
const persistTestCache = createEmptyCache();
persistTestCache.testData = 'test123';

// Temporarily override the cache file location for testing
const originalCacheFile = CONFIG.BUILD_CACHE_FILE;

// We can't easily test saveCache without modifying the module, but we can verify
// the cache file exists and is readable
if (fs.existsSync(CONFIG.BUILD_CACHE_FILE)) {
    const loadedCache = loadCache();
    assert('Cache persistence: loaded cache is valid object', typeof loadedCache === 'object');
    assert('Cache persistence: has expected structure',
        'files' in loadedCache && 'trips' in loadedCache);
}

// ── Verify no stale references exist ────────────────────────────

// This test would have caught the generate-html.js bug
const buildCachePath = path.join(__dirname, '../../lib/build-cache.js');
const buildCacheCode = fs.readFileSync(buildCachePath, 'utf8');

// Check for common non-existent files that might be referenced
const suspiciousReferences = [
    'generate-html.js',  // Deleted in tech debt cleanup (commit 2b0f54e)
    'build-html.js',
    'html-generator.js'
];

let noStaleReferences = true;
const foundStaleRefs = [];

for (const ref of suspiciousReferences) {
    if (buildCacheCode.includes(`'${ref}'`) || buildCacheCode.includes(`"${ref}"`)) {
        const filepath = path.join(CONFIG.LIB_DIR, ref);
        if (!fs.existsSync(filepath)) {
            noStaleReferences = false;
            foundStaleRefs.push(ref);
        }
    }
}

assert('No stale file references in getCoreFiles()',
    noStaleReferences,
    foundStaleRefs.length > 0 ? `Found stale refs: ${foundStaleRefs.join(', ')}` : undefined);

// ── Report ──────────────────────────────────────────────────────

const exitCode = report();
process.exit(exitCode);
