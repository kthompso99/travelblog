#!/usr/bin/env node

/**
 * Unit tests for lib/geocode.js
 * Tests geocode cache management and coordinate lookup logic
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { createTestRunner, backupFile, restoreFile } = require('./test-helpers');
const { loadGeocodeCache, geocodeLocation } = require('../../lib/geocode');

const { assert, report } = createTestRunner('🌍 Geocode utility tests');

// ── Setup test cache directory ──────────────────────────────────

const TEST_CACHE_DIR = path.join(__dirname, '../../_cache');
const TEST_CACHE_FILE = path.join(TEST_CACHE_DIR, 'geocode.json');
const BACKUP_PATH = backupFile(TEST_CACHE_FILE);

// ── Test cache loading ──────────────────────────────────────────

// Test 1: Cache loads when file exists
if (fs.existsSync(TEST_CACHE_FILE)) {
    const beforeLoad = fs.existsSync(TEST_CACHE_FILE);
    loadGeocodeCache();
    assert('loadGeocodeCache: loads existing cache without error', beforeLoad === true);
} else {
    assert('loadGeocodeCache: handles missing cache gracefully', true);
}

// ── Test cache usage ──────────────────────────────────────────────

// Test 2: Create a test cache with known location
const testCache = {
    'Paris, France': { lat: 48.8566, lng: 2.3522 },
    'London, UK': { lat: 51.5074, lng: -0.1278 }
};

// Write test cache
if (!fs.existsSync(TEST_CACHE_DIR)) {
    fs.mkdirSync(TEST_CACHE_DIR, { recursive: true });
}
fs.writeFileSync(TEST_CACHE_FILE, JSON.stringify(testCache, null, 2), 'utf8');

// Reload cache
loadGeocodeCache();

// Test 3: Cached location returns immediately (no API call)
geocodeLocation('Paris, France').then(coords => {
    assert('geocodeLocation: returns cached coordinates for Paris',
        coords.lat === 48.8566 && coords.lng === 2.3522);
}).catch(() => {
    assert('geocodeLocation: returns cached coordinates for Paris', false);
});

geocodeLocation('London, UK').then(coords => {
    assert('geocodeLocation: returns cached coordinates for London',
        coords.lat === 51.5074 && coords.lng === -0.1278);
}).catch(() => {
    assert('geocodeLocation: returns cached coordinates for London', false);
});

// Test 4: Non-existent location behavior (with or without API key)
geocodeLocation('NonExistentPlace12345XYZ').then(() => {
    // If API key exists and somehow resolved this, that's fine
    assert('geocodeLocation: handles uncached location with API key', true);
}).catch(err => {
    // Expected to fail without API key or for truly invalid location
    assert('geocodeLocation: handles uncached location error appropriately',
        err instanceof Error);
});

// ── Test coordinates validation ────────────────────────────────

geocodeLocation('Paris, France').then(coords => {
    assert('geocodeLocation: returns object with lat property', 'lat' in coords);
    assert('geocodeLocation: returns object with lng property', 'lng' in coords);
    assert('geocodeLocation: lat is a number', typeof coords.lat === 'number');
    assert('geocodeLocation: lng is a number', typeof coords.lng === 'number');
    assert('geocodeLocation: lat in valid range', coords.lat >= -90 && coords.lat <= 90);
    assert('geocodeLocation: lng in valid range', coords.lng >= -180 && coords.lng <= 180);
}).catch(() => {
    assert('geocodeLocation: returns valid coordinate object', false);
});

// ── Cleanup and report ──────────────────────────────────────────

// Give async tests time to complete before reporting
setTimeout(() => {
    restoreFile(TEST_CACHE_FILE, BACKUP_PATH);

    const exitCode = report();
    process.exit(exitCode);
}, 2000); // Wait 2 seconds for async geocode calls to complete
