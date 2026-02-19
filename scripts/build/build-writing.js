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
const { generateTripLocationPage, generateTripArticlePage } = require('../../lib/generate-html');
const { convertMarkdown } = require('../../lib/markdown-converter');
const CONFIG = require('../../lib/config-paths');
const { processMarkdownWithGallery } = require('../../lib/build-utilities');

// Get changed file from command line argument or detect most recently modified file
let changedFile = process.argv[2];

if (!changedFile) {
    // When run by nodemon without explicit file argument, find most recently changed .md file
    const glob = require('node:fs');
    const recentFiles = [];
    const tripsDir = path.join(CONFIG.TRIPS_DIR);

    // Scan all trip directories for .md files
    if (glob.existsSync(tripsDir)) {
        const trips = glob.readdirSync(tripsDir);
        for (const tripId of trips) {
            const tripDir = path.join(tripsDir, tripId);
            if (!glob.statSync(tripDir).isDirectory()) continue;

            const files = glob.readdirSync(tripDir);
            for (const file of files) {
                if (file.endsWith('.md') && file !== 'main.md') {
                    const filePath = path.join(tripDir, file);
                    const stats = glob.statSync(filePath);
                    recentFiles.push({ path: filePath, mtime: stats.mtimeMs });
                }
            }
        }
    }

    // Find most recently modified file in last 5 seconds (nodemon trigger window)
    const fiveSecondsAgo = Date.now() - 5000;
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

(async () => {
try {
    // Load processed trip data from previous build
    const tripContentFile = path.join(CONFIG.TRIPS_OUTPUT_DIR, `${tripId}.json`);
    if (!fs.existsSync(tripContentFile)) {
        console.log(`   ⏭️  Skipped: ${tripId}.json not found - run full build first\n`);
        process.exit(0);
    }

    const tripContentData = JSON.parse(fs.readFileSync(tripContentFile, 'utf8'));

    // Find the content item by matching the markdown file name
    // Content items might not have slug field, so we'll add it
    const contentItem = tripContentData.content.find(item => {
        // Try to match by existing slug first
        if (item.slug === contentSlug) return true;

        // Otherwise derive slug from title (this is what the build system does)
        const { slugify } = require('../../lib/slug-utilities');
        const derivedSlug = slugify(item.title);
        return derivedSlug === contentSlug;
    });

    if (!contentItem) {
        console.log(`   ⏭️  Skipped: ${contentSlug} not found in ${tripId}.json\n`);
        process.exit(0);
    }

    // Ensure contentItem has slug field
    if (!contentItem.slug) {
        const { slugify } = require('../../lib/slug-utilities');
        contentItem.slug = slugify(contentItem.title);
    }

    // Load trip metadata from config.built.json
    const builtConfig = JSON.parse(fs.readFileSync(CONFIG.OUTPUT_FILE, 'utf8'));
    const tripMetadata = builtConfig.trips.find(t => t.slug === tripId);

    if (!tripMetadata) {
        console.log(`   ⏭️  Skipped: ${tripId} metadata not found - run full build first\n`);
        process.exit(0);
    }

    // Prepare config object with trips list (needed by generate functions)
    const fullConfig = {
        site: builtConfig.site,
        trips: builtConfig.trips
    };

    // Re-convert the markdown for this specific file
    const markdownPath = path.join(CONFIG.TRIPS_DIR, tripId, `${contentSlug}.md`);
    if (fs.existsSync(markdownPath)) {
        // Use shared gallery marker detection function
        const { markdownContent, galleryImages } = processMarkdownWithGallery(markdownPath, `${contentSlug}.md`);

        if (galleryImages && galleryImages.length > 0) {
            // Write processed content (without gallery) to temp file for conversion
            const tempPath = markdownPath + '.temp';
            fs.writeFileSync(tempPath, markdownContent, 'utf8');
            const freshHtml = await convertMarkdown(tempPath);
            fs.unlinkSync(tempPath); // Clean up temp file

            // Update both html and contentHtml fields for compatibility
            contentItem.html = freshHtml;
            contentItem.contentHtml = freshHtml;
            contentItem.gallery = galleryImages;
        } else {
            // No marker found, convert entire file as before
            const freshHtml = await convertMarkdown(markdownPath);
            contentItem.html = freshHtml;
            contentItem.contentHtml = freshHtml;
        }
    } else {
        console.log(`   ⏭️  Skipped: ${markdownPath} not found\n`);
        process.exit(0);
    }

    // Ensure contentItem has html field (fallback to contentHtml)
    if (!contentItem.html && contentItem.contentHtml) {
        contentItem.html = contentItem.contentHtml;
    }

    // Ensure output directory exists
    const outputDir = path.join(CONFIG.TRIPS_OUTPUT_DIR, tripId);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate only this page based on type
    const outputPath = path.join(outputDir, `${contentSlug}.html`);
    let html;

    if (contentItem.type === 'location') {
        const allLocations = tripContentData.content.filter(c => c.type === 'location');
        const locationIndex = allLocations.findIndex(loc => loc.slug === contentSlug);

        html = generateTripLocationPage(
            tripMetadata,
            contentItem,
            allLocations,
            locationIndex,
            fullConfig,
            fullConfig.site.url
        );
    } else if (contentItem.type === 'article') {
        const articleIndex = tripContentData.content.findIndex(item => item.slug === contentSlug);

        html = generateTripArticlePage(
            tripMetadata,
            contentItem,
            tripContentData.content,
            articleIndex,
            fullConfig,
            fullConfig.site.url
        );
    } else {
        console.log(`   ⏭️  Skipped: unknown content type "${contentItem.type}"\n`);
        process.exit(0);
    }

    // Write the file
    fs.writeFileSync(outputPath, html);

    const elapsed = Date.now() - startTime;
    console.log(`   ✅ Generated trips/${tripId}/${contentSlug}.html (${elapsed}ms)`);
    console.log('   ⚡ Skipped dependencies for speed\n');

} catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}\n`);
    process.exit(1);
}
})();
