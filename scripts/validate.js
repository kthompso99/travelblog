#!/usr/bin/env node

/**
 * Validation script for travel blog configuration
 * Checks trips configuration for common issues before building
 * Run with: npm run validate or node scripts/validate.js
 */

const fs = require('fs');
const path = require('path');

// Import centralized configuration paths
const CONFIG = require('../lib/config-paths');
const { loadTripConfig, discoverAllTrips } = require('../lib/build-utilities');

const { SITE_CONFIG, TRIPS_DIR, TRIP_CONFIG_FILE, TRIP_MAIN_FILE, VALID_CONTINENTS } = CONFIG;

let errors = [];
let warnings = [];
let info = [];

function error(msg) {
    errors.push('❌ ERROR: ' + msg);
}

function warning(msg) {
    warnings.push('⚠️  WARNING: ' + msg);
}

function log(msg) {
    info.push('ℹ️  ' + msg);
}

function validateSiteConfig() {
    if (!fs.existsSync(SITE_CONFIG)) {
        error(`${SITE_CONFIG} not found`);
        return;
    }

    try {
        const siteConfig = JSON.parse(fs.readFileSync(SITE_CONFIG, 'utf8'));
        if (!siteConfig.title) warning('Missing site.title in config/site.json');
        if (!siteConfig.description) warning('Missing site.description in config/site.json');
    } catch (e) {
        error(`Invalid JSON in ${SITE_CONFIG}: ${e.message}`);
    }
}

function validateContentItem(item, itemIndex, tripDir, prefix) {
    const itemType = item.type || 'location';
    const itemLabel = itemType === 'article' ? 'Article' : 'Location';
    const itemPrefix = `${prefix}, ${itemLabel} #${itemIndex + 1} (${item.title || 'unnamed'})`;

    // Common validations for both types
    if (!item.type) warning(`${itemPrefix}: Missing "type" field`);
    if (!item.title) error(`${itemPrefix}: Missing "title" field`);
    if (!item.file) {
        error(`${itemPrefix}: Missing "file" field`);
    }

    // Type-specific validations
    if (itemType === 'location') {
        if (!item.place) warning(`${itemPrefix}: Missing "place" field for geocoding`);
        if (!item.duration) warning(`${itemPrefix}: Missing "duration" field`);
    }

    // File existence check (common to both)
    if (item.file) {
        const filePath = path.join(tripDir, item.file);
        if (!fs.existsSync(filePath)) {
            error(`${itemPrefix}: Content file not found: ${filePath}`);
        } else {
            const stats = fs.statSync(filePath);
            if (stats.size === 0) {
                warning(`${itemPrefix}: Content file is empty: ${filePath}`);
            } else {
                log(`${itemPrefix}: Content file OK (${stats.size} bytes)`);
            }
        }
    }
}

function validateTrip(tripId, index) {
    const tripDir = CONFIG.getTripDir(tripId);
    const mainMdPath = CONFIG.getTripMainPath(tripId);
    const prefix = `Trip #${index + 1} (${tripId})`;

    // Check trip directory exists
    if (!fs.existsSync(tripDir)) {
        error(`${prefix}: Directory not found: ${tripDir}`);
        return;
    }

    // Check trip.json exists and parse it
    let tripConfig;
    try {
        tripConfig = loadTripConfig(tripId);
    } catch (e) {
        error(`${prefix}: ${e.message.includes('ENOENT') ? 'trip.json not found in ' + tripDir : 'Invalid JSON in trip.json: ' + e.message}`);
        return;
    }

    // Validate trip fields
    if (!tripConfig.title) error(`${prefix}: Missing "title" field`);
    if (tripConfig.published === undefined) warning(`${prefix}: Missing "published" field`);

    // Validate metadata
    if (!tripConfig.metadata) {
        warning(`${prefix}: Missing "metadata" section`);
    } else {
        if (!tripConfig.metadata.continent) {
            warning(`${prefix}: Missing metadata.continent`);
        } else if (!VALID_CONTINENTS.includes(tripConfig.metadata.continent)) {
            error(`${prefix}: Invalid continent "${tripConfig.metadata.continent}"`);
        }
        if (!tripConfig.metadata.country) warning(`${prefix}: Missing metadata.country`);
    }

    // Check main.md exists
    if (!fs.existsSync(mainMdPath)) {
        warning(`${prefix}: main.md not found - trip intro page will have no content`);
    } else {
        const stats = fs.statSync(mainMdPath);
        if (stats.size === 0) {
            warning(`${prefix}: main.md is empty`);
        }
    }

    // Validate content array
    if (!tripConfig.content || !Array.isArray(tripConfig.content)) {
        error(`${prefix}: Missing or invalid "content" array`);
        return;
    }

    if (tripConfig.content.length === 0) {
        warning(`${prefix}: No content items defined in content array`);
    }

    // Validate each content item
    tripConfig.content.forEach((item, itemIndex) => {
        validateContentItem(item, itemIndex, tripDir, prefix);
    });
}

function validate() {
    console.log('🔍 Validating configuration...\n');

    validateSiteConfig();

    // Auto-discover trips from directories
    const allTrips = discoverAllTrips(TRIPS_DIR, (id) => CONFIG.getTripConfigPath(id));

    if (allTrips.length === 0) {
        warning('No trips found in content/trips/');
    } else {
        log(`Found ${allTrips.length} trip(s)`);
    }

    // Validate each trip
    allTrips.forEach((tripId, index) => {
        validateTrip(tripId, index);
    });

    printResults();

    if (errors.length > 0) {
        console.log('\n❌ Validation failed! Please fix the errors above before building.');
        process.exit(1);
    } else if (warnings.length > 0) {
        console.log('\n⚠️  Validation passed with warnings. You can build, but consider fixing the warnings.');
        process.exit(0);
    } else {
        console.log('\n✅ Validation passed! Ready to build.');
        process.exit(0);
    }
}

function printResults() {
    if (errors.length > 0) {
        console.log('\n🚨 ERRORS:\n');
        errors.forEach(e => console.log(e));
    }

    if (warnings.length > 0) {
        console.log('\n⚠️  WARNINGS:\n');
        warnings.forEach(w => console.log(w));
    }

    if (info.length > 0 && errors.length === 0) {
        console.log('\n📋 INFO:\n');
        info.forEach(i => console.log(i));
    }
}

validate();
