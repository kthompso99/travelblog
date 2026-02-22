/**
 * Shared trip file generation functions
 * Used by build.js, build-smart.js, and build-trip.js to avoid code duplication
 */

const fs = require('fs');
const path = require('path');
const { generateTripIntroPage, generateTripContentPage, generateTripMapPage } = require('./generate-trip-pages');
const { ensureDir, extractTripMetadata } = require('./build-utilities');
const { getContentItemSlug } = require('./slug-utilities');
const CONFIG = require('./config-paths');

/**
 * Generate intro (index.html) and map (map.html) pages for a trip
 */
function generateIntroAndMapPages(tripMetadata, allContent, output, domain, tripDir, indent) {
    const introHtml = generateTripIntroPage(tripMetadata, allContent, output, domain);
    const introPath = path.join(tripDir, 'index.html');
    fs.writeFileSync(introPath, introHtml, 'utf8');
    console.log(`${indent}✅ Intro page → ${tripDir}/index.html`);

    const mapHtml = generateTripMapPage(tripMetadata, allContent, output, domain);
    const mapPath = path.join(tripDir, 'map.html');
    fs.writeFileSync(mapPath, mapHtml, 'utf8');
    console.log(`${indent}✅ Map page → ${tripDir}/map.html`);

    return { introPath, mapPath };
}

/**
 * Generate HTML pages for an array of content items (locations or articles)
 */
function generateContentPages(items, tripMetadata, allContent, output, domain, tripDir, indent) {
    const paths = [];

    items.forEach((item) => {
        const slug = getContentItemSlug(item);
        const contentIndex = allContent.findIndex(c => c.title === item.title);
        const html = generateTripContentPage(tripMetadata, item, allContent, contentIndex, output, domain);
        const filePath = path.join(tripDir, `${slug}.html`);
        fs.writeFileSync(filePath, html, 'utf8');
        paths.push(filePath);

        const label = item.type === 'article' ? `${item.title} (article)` : item.title;
        console.log(`${indent}✅ ${label} → ${tripDir}/${slug}.html`);
    });

    return paths;
}

/**
 * Copy images from content source to trip output directory.
 * Skips files that already exist with matching size and mtime.
 */
function copyTripImages(tripId, tripDir, indent) {
    const imgSrc = CONFIG.getTripImagesDir(tripId);
    const imgDst = path.join(tripDir, 'images');

    if (!fs.existsSync(imgSrc)) return 0;

    ensureDir(imgDst);
    let copied = 0;
    let skipped = 0;
    const files = fs.readdirSync(imgSrc);

    for (const file of files) {
        const src = path.join(imgSrc, file);
        const srcStat = fs.statSync(src);
        if (!srcStat.isFile()) continue;

        const dst = path.join(imgDst, file);

        // Skip if destination exists with same size and same-or-newer mtime
        try {
            const dstStat = fs.statSync(dst);
            if (dstStat.size === srcStat.size && dstStat.mtimeMs >= srcStat.mtimeMs) {
                skipped++;
                continue;
            }
        } catch {
            // Destination doesn't exist — needs copy
        }

        fs.copyFileSync(src, dst);
        copied++;
    }

    const total = copied + skipped;
    if (total > 0) {
        if (copied === 0) {
            console.log(`${indent}📷 ${total} image(s) up to date`);
        } else {
            console.log(`${indent}📷 Copied ${copied} image(s), ${skipped} up to date`);
        }
    }

    return total;
}

/**
 * Generate all HTML files for a single trip
 *
 * @param {Object} tripData - Processed trip data from processTrip()
 * @param {Object} output - Full output config with site and trips metadata
 * @param {string} domain - Domain for canonical URLs
 * @param {string} [indent=''] - Indent string for console output (e.g., '   ')
 * @returns {Object} Summary of generated files: { introPath, mapPath, locationPaths, articlePaths, imageCount }
 */
function generateTripFiles(tripData, output, domain, indent = '') {
    const tripId = tripData.slug;

    // Find trip metadata in output.trips (may be different from tripData in smart build)
    let tripMetadata = output.trips.find(t => t.slug === tripId);

    // If not found in output, create it from tripData (single-trip build case)
    if (!tripMetadata) {
        tripMetadata = extractTripMetadata(tripData);
    }

    // Add introHtml to metadata
    tripMetadata.introHtml = tripData.introHtml;

    // Get all content and filter by type
    const allContent = tripData.content;
    const locations = allContent.filter(item => item.type === 'location');
    const articles = allContent.filter(item => item.type === 'article');

    // Create trip directory
    const tripDir = path.join('trips', tripId);
    ensureDir(tripDir);

    // Generate pages
    const { introPath, mapPath } = generateIntroAndMapPages(tripMetadata, allContent, output, domain, tripDir, indent);
    const locationPaths = generateContentPages(locations, tripMetadata, allContent, output, domain, tripDir, indent);
    const articlePaths = generateContentPages(articles, tripMetadata, allContent, output, domain, tripDir, indent);
    const imageCount = copyTripImages(tripId, tripDir, indent);

    return { introPath, mapPath, locationPaths, articlePaths, imageCount };
}

module.exports = {
    generateTripFiles
};
