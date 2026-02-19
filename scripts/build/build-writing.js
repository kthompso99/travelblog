#!/usr/bin/env node

/**
 * Writing Mode Build - Fast content-only rebuilds
 *
 * Only regenerates the specific page that changed.
 * SKIPS: homepage, map, sitemap, trip intro, other locations
 *
 * Usage: npm run writing
 *
 * Trade-off: Fast rebuilds (~0.5s) but other pages may be stale
 * until you run a full build before committing.
 */

const fs = require('fs');
const path = require('path');
const { generateTripContentPage } = require('../../lib/generate-html');
const { convertMarkdown } = require('../../lib/markdown-converter');
const CONFIG = require('../../lib/config-paths');
const { ensureDir, processMarkdownWithGallery, discoverAllTrips } = require('../../lib/build-utilities');
const { slugify } = require('../../lib/slug-utilities');

const NODEMON_TRIGGER_WINDOW_MS = 5000; // nodemon fires within ~5s of a file save

// Get changed file from command line argument or detect most recently modified file
let changedFile = process.argv[2];

if (!changedFile) {
    // When run by nodemon without explicit file argument, find most recently changed .md file
    const recentFiles = [];

    // Scan all trip directories for .md files
    const tripIds = discoverAllTrips(CONFIG.TRIPS_DIR, id => CONFIG.getTripConfigPath(id));
    for (const tripId of tripIds) {
        const tripDir = path.join(CONFIG.TRIPS_DIR, tripId);
        const files = fs.readdirSync(tripDir);
        for (const file of files) {
            if (file.endsWith('.md') && file !== 'main.md') {
                const filePath = path.join(tripDir, file);
                const stats = fs.statSync(filePath);
                recentFiles.push({ path: filePath, mtime: stats.mtimeMs });
            }
        }
    }

    // Find most recently modified file in last 5 seconds (nodemon trigger window)
    const fiveSecondsAgo = Date.now() - NODEMON_TRIGGER_WINDOW_MS;
    const recentlyModified = recentFiles
        .filter(f => f.mtime > fiveSecondsAgo)
        .sort((a, b) => b.mtime - a.mtime);

    if (recentlyModified.length > 0) {
        changedFile = recentlyModified[0].path;
    } else {
        console.log('\n⚡ Writing mode ready - fast content-only rebuilds');
        console.log('⚠️  Remember: run \'npm run build\' before committing!\n');
        process.exit(0);
    }
}

const startTime = Date.now();

// Parse file path to determine trip and content item
// e.g., content/trips/greece/milos.md → trip: greece, file: milos
const match = changedFile.match(/content\/trips\/([^/]+)\/([^/]+)\.md$/);

if (!match) {
    console.log(`   ⏭️  Skipped: ${path.basename(changedFile)} (not a trip content file)\n`);
    process.exit(0);
}

const [, tripId, contentSlug] = match;

console.log(`\n⚡ Fast rebuild: ${tripId}/${contentSlug}.md`);

// Skip main.md files (trip intro content)
if (contentSlug === 'main') {
    console.log('   ⏭️  Skipped: main.md (run full build for trip intro changes)\n');
    process.exit(0);
}

/**
 * Load trip data and metadata from previous full build output.
 * Returns null and exits the process if data is missing.
 */
function loadTripData(tripId) {
    const tripContentFile = path.join(CONFIG.TRIPS_OUTPUT_DIR, `${tripId}.json`);
    if (!fs.existsSync(tripContentFile)) {
        console.log(`   ⏭️  Skipped: ${tripId}.json not found - run full build first\n`);
        process.exit(0);
    }

    const tripContentData = JSON.parse(fs.readFileSync(tripContentFile, 'utf8'));

    const builtConfig = JSON.parse(fs.readFileSync(CONFIG.OUTPUT_FILE, 'utf8'));
    const tripMetadata = builtConfig.trips.find(t => t.slug === tripId);

    if (!tripMetadata) {
        console.log(`   ⏭️  Skipped: ${tripId} metadata not found - run full build first\n`);
        process.exit(0);
    }

    const fullConfig = {
        site: builtConfig.site,
        trips: builtConfig.trips
    };

    return { tripContentData, tripMetadata, fullConfig };
}

/**
 * Find the content item matching the given slug and ensure it has a slug field.
 * Exits the process if the item is not found.
 */
function findAndPrepareContentItem(tripContentData, contentSlug) {
    const contentItem = tripContentData.content.find(item => {
        if (item.slug === contentSlug) return true;
        return slugify(item.title) === contentSlug;
    });

    if (!contentItem) {
        console.log(`   ⏭️  Skipped: ${contentSlug} not found in ${tripId}.json\n`);
        process.exit(0);
    }

    if (!contentItem.slug) {
        contentItem.slug = slugify(contentItem.title);
    }

    return contentItem;
}

/**
 * Re-convert the markdown file for a content item, handling gallery markers.
 * Exits the process if the markdown file is not found.
 */
async function reconvertMarkdown(contentItem, tripId, contentSlug) {
    const markdownPath = path.join(CONFIG.TRIPS_DIR, tripId, `${contentSlug}.md`);
    if (!fs.existsSync(markdownPath)) {
        console.log(`   ⏭️  Skipped: ${markdownPath} not found\n`);
        process.exit(0);
    }

    const { markdownContent, galleryImages } = processMarkdownWithGallery(markdownPath, `${contentSlug}.md`);

    if (galleryImages && galleryImages.length > 0) {
        const tempPath = markdownPath + '.temp';
        fs.writeFileSync(tempPath, markdownContent, 'utf8');
        const freshHtml = await convertMarkdown(tempPath);
        fs.unlinkSync(tempPath);

        contentItem.html = freshHtml;
        contentItem.contentHtml = freshHtml;
        contentItem.gallery = galleryImages;
    } else {
        const freshHtml = await convertMarkdown(markdownPath);
        contentItem.html = freshHtml;
        contentItem.contentHtml = freshHtml;
    }

    if (!contentItem.html && contentItem.contentHtml) {
        contentItem.html = contentItem.contentHtml;
    }
}

/**
 * Generate the HTML page for a content item and write it to disk.
 * Exits the process if the content type is unknown.
 */
function generateAndWritePage(contentItem, tripMetadata, tripContentData, fullConfig, tripId, contentSlug) {
    ensureDir(path.join(CONFIG.TRIPS_OUTPUT_DIR, tripId));
    const outputPath = path.join(CONFIG.TRIPS_OUTPUT_DIR, tripId, `${contentSlug}.html`);
    let html;

    if (contentItem.type !== 'location' && contentItem.type !== 'article') {
        console.log(`   ⏭️  Skipped: unknown content type "${contentItem.type}"\n`);
        process.exit(0);
    }

    const allContent = tripContentData.content;
    const contentIndex = allContent.findIndex(item => item.slug === contentSlug);

    html = generateTripContentPage(
        tripMetadata,
        contentItem,
        allContent,
        contentIndex,
        fullConfig,
        fullConfig.site.domain
    );

    fs.writeFileSync(outputPath, html);
}

(async () => {
try {
    const { tripContentData, tripMetadata, fullConfig } = loadTripData(tripId);
    const contentItem = findAndPrepareContentItem(tripContentData, contentSlug);
    await reconvertMarkdown(contentItem, tripId, contentSlug);
    generateAndWritePage(contentItem, tripMetadata, tripContentData, fullConfig, tripId, contentSlug);

    const elapsed = Date.now() - startTime;
    console.log(`   ✅ Generated trips/${tripId}/${contentSlug}.html (${elapsed}ms)`);
    console.log('   ⚡ Skipped dependencies for speed\n');

} catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}\n`);
    process.exit(1);
}
})();
