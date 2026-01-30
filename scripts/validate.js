#!/usr/bin/env node

/**
 * Validation script for travel blog configuration
 * Checks trips configuration for common issues before building
 * Run with: npm run validate or node scripts/validate.js
 */

const fs = require('fs');
const path = require('path');

const SITE_CONFIG = 'config/site.json';
const INDEX_CONFIG = 'content/index.json';
const TRIPS_DIR = 'content/trips';

const VALID_CONTINENTS = [
    'Africa',
    'Antarctica',
    'Asia',
    'Europe',
    'North America',
    'South America',
    'Oceania'
];

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

function validate() {
    console.log('🔍 Validating configuration...\n');

    // Check site config
    if (!fs.existsSync(SITE_CONFIG)) {
        error(`${SITE_CONFIG} not found`);
    } else {
        try {
            const siteConfig = JSON.parse(fs.readFileSync(SITE_CONFIG, 'utf8'));
            if (!siteConfig.title) warning('Missing site.title in config/site.json');
            if (!siteConfig.description) warning('Missing site.description in config/site.json');
        } catch (e) {
            error(`Invalid JSON in ${SITE_CONFIG}: ${e.message}`);
        }
    }

    // Check index config
    if (!fs.existsSync(INDEX_CONFIG)) {
        error(`${INDEX_CONFIG} not found`);
        printResults();
        process.exit(1);
    }

    let indexConfig;
    try {
        indexConfig = JSON.parse(fs.readFileSync(INDEX_CONFIG, 'utf8'));
    } catch (e) {
        error(`Invalid JSON in ${INDEX_CONFIG}: ${e.message}`);
        printResults();
        process.exit(1);
    }

    if (!indexConfig.trips || !Array.isArray(indexConfig.trips)) {
        error('Missing or invalid "trips" array in content/index.json');
        printResults();
        process.exit(1);
    }

    if (indexConfig.trips.length === 0) {
        warning('No trips defined in content/index.json');
    } else {
        log(`Found ${indexConfig.trips.length} trip(s)`);
    }

    // Validate each trip
    indexConfig.trips.forEach((tripId, index) => {
        const tripDir = path.join(TRIPS_DIR, tripId);
        const tripConfigPath = path.join(tripDir, 'trip.json');
        const mainMdPath = path.join(tripDir, 'main.md');

        const prefix = `Trip #${index + 1} (${tripId})`;

        // Check trip directory exists
        if (!fs.existsSync(tripDir)) {
            error(`${prefix}: Directory not found: ${tripDir}`);
            return;
        }

        // Check trip.json exists
        if (!fs.existsSync(tripConfigPath)) {
            error(`${prefix}: trip.json not found in ${tripDir}`);
            return;
        }

        // Parse trip.json
        let tripConfig;
        try {
            tripConfig = JSON.parse(fs.readFileSync(tripConfigPath, 'utf8'));
        } catch (e) {
            error(`${prefix}: Invalid JSON in trip.json: ${e.message}`);
            return;
        }

        // Validate trip fields
        if (!tripConfig.id) error(`${prefix}: Missing "id" field`);
        if (tripConfig.id !== tripId) error(`${prefix}: ID mismatch - folder is "${tripId}" but trip.json has "${tripConfig.id}"`);
        if (!tripConfig.title) error(`${prefix}: Missing "title" field`);
        if (!tripConfig.slug) error(`${prefix}: Missing "slug" field`);
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
            warning(`${prefix}: No locations defined in content array`);
        }

        // Validate each location
        tripConfig.content.forEach((location, locIndex) => {
            const locPrefix = `${prefix}, Location #${locIndex + 1} (${location.title || 'unnamed'})`;

            if (!location.type) warning(`${locPrefix}: Missing "type" field`);
            if (!location.title) error(`${locPrefix}: Missing "title" field`);
            if (!location.place) warning(`${locPrefix}: Missing "place" field for geocoding`);
            if (!location.duration) warning(`${locPrefix}: Missing "duration" field`);

            // Check location markdown file
            if (!location.file) {
                error(`${locPrefix}: Missing "file" field`);
            } else {
                if (!fs.existsSync(location.file)) {
                    error(`${locPrefix}: Content file not found: ${location.file}`);
                } else {
                    const stats = fs.statSync(location.file);
                    if (stats.size === 0) {
                        warning(`${locPrefix}: Content file is empty: ${location.file}`);
                    } else {
                        log(`${locPrefix}: Content file OK (${stats.size} bytes)`);
                    }
                }
            }
        });
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
