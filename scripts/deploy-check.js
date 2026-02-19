#!/usr/bin/env node

/**
 * Pre-deployment checklist
 * Verifies everything is ready for production deployment
 * Run with: node deploy-check.js
 */

const fs = require('fs');
const path = require('path');
const CONFIG = require('../lib/config-paths');
const { discoverAllTrips } = require('../lib/build-utilities');

const checks = [];
let passed = 0;
let failed = 0;
let warnings = 0;

function check(name, test, required = true) {
    const result = test();
    checks.push({ name, result, required });
    if (result.pass) {
        passed++;
        console.log(`✅ ${name}`);
    } else if (required) {
        failed++;
        console.log(`❌ ${name}`);
        if (result.message) console.log(`   ${result.message}`);
    } else {
        warnings++;
        console.log(`⚠️  ${name}`);
        if (result.message) console.log(`   ${result.message}`);
    }
}

console.log('🚀 Pre-Deployment Checklist\n');

// Check 1: config.built.json exists
check('config.built.json exists', () => {
    if (fs.existsSync('config.built.json')) {
        return { pass: true };
    }
    return { pass: false, message: 'Run "npm run build" first' };
});

// Check 2: config.built.json is recent
check('Build is up to date', () => {
    if (!fs.existsSync('config.built.json')) {
        return { pass: false };
    }

    const siteConfigPath = CONFIG.SITE_CONFIG;
    if (!fs.existsSync(siteConfigPath)) {
        return { pass: false, message: `${siteConfigPath} not found` };
    }

    const builtTime = fs.statSync('config.built.json').mtime;
    const configTime = fs.statSync(siteConfigPath).mtime;

    if (builtTime > configTime) {
        return { pass: true };
    }
    return { pass: false, message: 'Site config modified after last build. Run "npm run build"' };
});

// Check 3: index.html exists
check('index.html exists', () => {
    if (fs.existsSync('index.html')) {
        return { pass: true };
    }
    return { pass: false, message: 'index.html not found' };
});

// Check 4: All trips have content JSON
check('All trips have built content', () => {
    if (!fs.existsSync('config.built.json')) {
        return { pass: false };
    }

    const config = JSON.parse(fs.readFileSync('config.built.json', 'utf8'));
    const missing = config.trips
        .filter(t => !fs.existsSync(path.join('trips', `${t.slug}.json`)))
        .map(t => t.title);

    if (missing.length === 0) {
        return { pass: true };
    }
    return {
        pass: false,
        message: `${missing.length} trip(s) missing content JSON: ${missing.join(', ')}`
    };
});

// Check 5: All locations have coordinates
check('All locations have coordinates', () => {
    if (!fs.existsSync('config.built.json')) {
        return { pass: false };
    }

    const config = JSON.parse(fs.readFileSync('config.built.json', 'utf8'));
    const missing = [];
    for (const trip of config.trips) {
        for (const loc of trip.locations || []) {
            if (!loc.coordinates || (loc.coordinates.lat === 0 && loc.coordinates.lng === 0)) {
                missing.push(`${trip.title} → ${loc.name}`);
            }
        }
    }

    if (missing.length === 0) {
        return { pass: true };
    }
    return {
        pass: false,
        message: `${missing.length} location(s) missing coordinates: ${missing.join(', ')}`
    };
});

// Check 6: Thumbnail images exist (warning only)
check('All thumbnail images exist', () => {
    if (!fs.existsSync('config.built.json')) {
        return { pass: false };
    }

    const config = JSON.parse(fs.readFileSync('config.built.json', 'utf8'));
    const missing = config.trips
        .filter(t => t.thumbnail && !fs.existsSync(t.thumbnail))
        .map(t => t.title);

    if (missing.length === 0) {
        return { pass: true };
    }
    return {
        pass: false,
        message: `${missing.length} thumbnail(s) not found: ${missing.join(', ')}`
    };
}, false);

// Check 7: File sizes are reasonable
check('config.built.json size is reasonable', () => {
    if (!fs.existsSync('config.built.json')) {
        return { pass: false };
    }

    const stats = fs.statSync('config.built.json');
    const sizeMB = stats.size / (1024 * 1024);

    if (sizeMB < 5) {
        return { pass: true };
    }
    return {
        pass: false,
        message: `File size is ${sizeMB.toFixed(2)}MB (should be under 5MB). Consider optimizing content.`
    };
}, false);

// Check 8: Images are optimized (warning only)
check('All images are optimized', () => {
    const tripIds = discoverAllTrips(CONFIG.TRIPS_DIR, id => CONFIG.getTripConfigPath(id));
    const unoptimized = [];

    for (const tripId of tripIds) {
        const imagesDir = path.join(CONFIG.TRIPS_DIR, tripId, 'images');
        const originalsDir = path.join(imagesDir, '.originals');

        if (!fs.existsSync(imagesDir)) continue;

        const images = fs.readdirSync(imagesDir)
            .filter(file => /\.(jpe?g|png)$/i.test(file));

        for (const image of images) {
            const backupExists = fs.existsSync(path.join(originalsDir, image));
            if (!backupExists) {
                unoptimized.push(path.relative(process.cwd(), path.join(imagesDir, image)));
            }
        }
    }

    if (unoptimized.length === 0) {
        return { pass: true };
    }

    return {
        pass: false,
        message: `${unoptimized.length} unoptimized image(s) found. Run: npm run optimize:images`
    };
}, false);

// Summary
console.log('\n📊 Summary:');
console.log(`   ✅ Passed: ${passed}`);
if (failed > 0) console.log(`   ❌ Failed: ${failed}`);
if (warnings > 0) console.log(`   ⚠️  Warnings: ${warnings}`);

if (failed > 0) {
    console.log('\n❌ Deployment blocked! Fix the errors above first.\n');
    process.exit(1);
}

if (warnings > 0) {
    console.log('\n⚠️  Deployment possible with warnings. Consider fixing them.\n');
}

if (failed === 0 && warnings === 0) {
    console.log('\n✅ All checks passed! Ready to deploy.\n');
}

process.exit(failed > 0 ? 1 : 0);
