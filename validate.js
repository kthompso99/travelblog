#!/usr/bin/env node

/**
 * Validation script for travel blog configuration
 * Checks config.json for common issues before building
 * Run with: node validate.js
 */

const fs = require('fs');
const path = require('path');

const CONFIG_FILE = 'config.json';

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

    // Check if config.json exists
    if (!fs.existsSync(CONFIG_FILE)) {
        error(`${CONFIG_FILE} not found`);
        printResults();
        process.exit(1);
    }

    // Parse JSON
    let config;
    try {
        const data = fs.readFileSync(CONFIG_FILE, 'utf8');
        config = JSON.parse(data);
    } catch (e) {
        error(`Invalid JSON in ${CONFIG_FILE}: ${e.message}`);
        printResults();
        process.exit(1);
    }

    // Validate site section
    if (!config.site) {
        error('Missing "site" section in config');
    } else {
        if (!config.site.title) {
            warning('Missing site.title');
        }
        if (!config.site.description) {
            warning('Missing site.description');
        }
    }

    // Validate destinations
    if (!config.destinations || !Array.isArray(config.destinations)) {
        error('Missing or invalid "destinations" array');
        printResults();
        process.exit(1);
    }

    if (config.destinations.length === 0) {
        warning('No destinations defined');
    } else {
        log(`Found ${config.destinations.length} destination(s)`);
    }

    const seenIds = new Set();

    config.destinations.forEach((dest, index) => {
        const prefix = `Destination #${index + 1} (${dest.name || 'unnamed'})`;

        // Check required fields
        if (!dest.id) {
            error(`${prefix}: Missing "id" field`);
        } else {
            // Check for duplicate IDs
            if (seenIds.has(dest.id)) {
                error(`${prefix}: Duplicate id "${dest.id}"`);
            }
            seenIds.add(dest.id);

            // Check ID format
            if (!/^[a-z0-9-]+$/.test(dest.id)) {
                warning(`${prefix}: ID should be lowercase with hyphens only (found: "${dest.id}")`);
            }
        }

        if (!dest.name) {
            error(`${prefix}: Missing "name" field`);
        }

        if (!dest.continent) {
            error(`${prefix}: Missing "continent" field`);
        } else if (!VALID_CONTINENTS.includes(dest.continent)) {
            error(`${prefix}: Invalid continent "${dest.continent}". Must be one of: ${VALID_CONTINENTS.join(', ')}`);
        }

        if (!dest.country) {
            warning(`${prefix}: Missing "country" field`);
        }

        // Check location/coordinates
        if (!dest.coordinates && !dest.location) {
            warning(`${prefix}: Neither "coordinates" nor "location" specified. Will use name for geocoding.`);
        }

        if (dest.coordinates) {
            if (typeof dest.coordinates.lat !== 'number' || typeof dest.coordinates.lng !== 'number') {
                error(`${prefix}: coordinates.lat and coordinates.lng must be numbers`);
            } else {
                if (dest.coordinates.lat < -90 || dest.coordinates.lat > 90) {
                    error(`${prefix}: latitude must be between -90 and 90 (found: ${dest.coordinates.lat})`);
                }
                if (dest.coordinates.lng < -180 || dest.coordinates.lng > 180) {
                    error(`${prefix}: longitude must be between -180 and 180 (found: ${dest.coordinates.lng})`);
                }
            }
        }

        // Check content file
        if (!dest.contentFile) {
            warning(`${prefix}: Missing "contentFile" field`);
        } else {
            if (!fs.existsSync(dest.contentFile)) {
                warning(`${prefix}: Content file not found: ${dest.contentFile}`);
            } else {
                // Check if file is not empty
                const stats = fs.statSync(dest.contentFile);
                if (stats.size === 0) {
                    warning(`${prefix}: Content file is empty: ${dest.contentFile}`);
                } else {
                    log(`${prefix}: Content file OK (${stats.size} bytes)`);
                }
            }
        }

        // Check thumbnail
        if (dest.thumbnail) {
            if (!fs.existsSync(dest.thumbnail)) {
                warning(`${prefix}: Thumbnail file not found: ${dest.thumbnail}`);
            }
        }
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