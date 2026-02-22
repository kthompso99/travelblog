#!/usr/bin/env node
/**
 * Hero Image Search Tool
 * Scans a trip's images directory for landscape-oriented, high-resolution
 * photos suitable as homepage hero images. Outputs ranked candidates with
 * copy-paste-ready paths for config/site.json heroImages array.
 *
 * Usage: npm run hero-search -- <trip-id>
 */

const fs = require('fs');
const path = require('path');
const { imageSize } = require('image-size');
const CONFIG = require('../../lib/config-paths');

const MIN_WIDTH = 1200;
const MAX_RESULTS = 5;
const IMAGE_EXT = /\.(jpe?g|png)$/i;

const tripId = process.argv[2];
if (!tripId) {
    console.error('Usage: npm run hero-search -- <trip-id>');
    console.error('Example: npm run hero-search -- utah');
    process.exit(1);
}

const imagesDir = CONFIG.getTripImagesDir(tripId);
if (!fs.existsSync(imagesDir)) {
    console.error(`Error: images directory not found: ${imagesDir}`);
    process.exit(1);
}

// Read all image files, skip .originals/ backup directory
const files = fs.readdirSync(imagesDir)
    .filter(f => IMAGE_EXT.test(f) && !f.startsWith('.'));

console.log(`\n\u{1f50d} Scanning hero image candidates for: ${tripId}\n`);
console.log(`Found ${files.length} images in ${imagesDir}/`);

// Measure dimensions and filter to landscape images above minimum width
const candidates = [];
for (const file of files) {
    const filePath = path.join(imagesDir, file);
    try {
        const buf = fs.readFileSync(filePath);
        const { width, height } = imageSize(buf);
        if (width > height && width >= MIN_WIDTH) {
            candidates.push({ file, width, height, ratio: width / height });
        }
    } catch (e) {
        // Skip files that can't be read (corrupt, unsupported format)
    }
}

console.log(`Filtered to ${candidates.length} landscape images (width >= ${MIN_WIDTH}px)\n`);

if (candidates.length === 0) {
    console.log('No hero candidates found. Try a trip with more landscape photos.');
    process.exit(0);
}

// Sort by aspect ratio descending (wider = more cinematic)
candidates.sort((a, b) => b.ratio - a.ratio);

// Format aspect ratio as readable label
function ratioLabel(r) {
    if (Math.abs(r - 16 / 9) < 0.05) return '16:9';
    if (Math.abs(r - 3 / 2) < 0.05) return '3:2';
    if (Math.abs(r - 4 / 3) < 0.05) return '4:3';
    return r.toFixed(2) + ':1';
}

console.log(`Top candidates (sorted by aspect ratio, most cinematic first):\n`);

const top = candidates.slice(0, MAX_RESULTS);
for (let i = 0; i < top.length; i++) {
    const c = top[i];
    const dims = `${c.width}\u00d7${c.height}`;
    const heroPath = `trips/${tripId}/images/${c.file}`;
    console.log(`  ${i + 1}. ${c.file.padEnd(30)} ${dims.padEnd(12)} (${ratioLabel(c.ratio)})`);
    console.log(`     \u2192 ${heroPath}\n`);
}

console.log('To use, add the \u2192 path to heroImages in config/site.json');
