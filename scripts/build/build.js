#!/usr/bin/env node

/**
 * Build script for travel blog - Trips Architecture
 * Geocodes locations and converts markdown to HTML offline
 * Run with: node build.js or npm run build
 */

const fs = require('fs');
const path = require('path');
const { getContentItemSlug } = require('../../lib/slug-utilities');
const { geocodeLocation, loadGeocodeCache } = require('../../lib/geocode');
const { convertMarkdown } = require('../../lib/markdown-converter');

// Load HTML generators (paths relative to project root since script runs from root)
const { generateHomepage, generateMapPage, generateAboutPage } = require('../../lib/generate-html');
const { generateSitemap, generateRobotsTxt } = require('../../lib/generate-sitemap');
const { generateTripFiles } = require('../../lib/generate-trip-files');
const {
    ensureDir,
    loadTripConfig,
    discoverAllTrips,
    processMarkdownWithGallery,
    writeTripContentJson,
    extractTripMetadata,
    writeConfigBuilt,
    generateAndPromoteHomepage,
    generateMapPageToFile,
    generateSitemapToFile,
    generateTripHtmlPages,
    printBuildWarnings
} = require('../../lib/build-utilities');

// Import centralized configuration paths
const CONFIG = require('../../lib/config-paths');

// Import cache management
const { loadCache, createEmptyCache, updateFullCache, saveCache } = require('../../lib/build-cache');

const GEOCODING_RATE_LIMIT_MS = 1000; // 1 request per second

const { SITE_CONFIG, TRIPS_DIR, OUTPUT_FILE, TRIPS_OUTPUT_DIR } = CONFIG;

// Load geocode cache from disk
loadGeocodeCache();

// Calculate duration between two dates
function calculateDuration(beginDate, endDate) {
    if (!beginDate || !endDate) {
        return "Ongoing";
    }
    const start = new Date(beginDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return `${days} days`;
}

// Convert a content item's markdown to HTML, handling gallery markers
async function convertContentMarkdown(processed, item, tripId, tripTitle, warnings) {
    if (!item.file) return;

    const filePath = path.join(CONFIG.getTripDir(tripId), item.file);
    try {
        console.log(`    📝 Converting markdown: ${filePath}`);

        const { markdownContent, galleryImages } = processMarkdownWithGallery(filePath, item.file);

        if (galleryImages && galleryImages.length > 0) {
            const tempPath = filePath + '.temp';
            fs.writeFileSync(tempPath, markdownContent, 'utf8');
            processed.contentHtml = await convertMarkdown(tempPath);
            fs.unlinkSync(tempPath);
        } else {
            processed.contentHtml = await convertMarkdown(filePath);
        }

        console.log(`    ✅ HTML generated (${processed.contentHtml.length} chars)`);

        if (galleryImages && galleryImages.length > 0) {
            processed.gallery = galleryImages;
            console.log(`    ✅ Gallery parsed from main file: ${galleryImages.length} images`);
        }
    } catch (e) {
        console.log(`    ⚠️  Markdown conversion failed: ${e.message}`);
        processed.contentHtml = `<p>Content not found</p>`;
        warnings.push({
            trip: tripTitle,
            location: item.title,
            type: 'Markdown Conversion',
            message: e.message
        });
    }
}

// Geocode a location content item and attach coordinates
async function geocodeContentLocation(processed, item, tripTitle, warnings) {
    processed.place = item.place;
    processed.duration = item.duration;
    if (item.thumbnail) processed.thumbnail = item.thumbnail;

    try {
        console.log(`    🗺️  Geocoding: ${item.place}`);
        processed.coordinates = await geocodeLocation(item.place);
        console.log(`    ✅ Coordinates: ${processed.coordinates.lat}, ${processed.coordinates.lng}`);

        await new Promise(resolve => setTimeout(resolve, GEOCODING_RATE_LIMIT_MS));
    } catch (e) {
        console.log(`    ⚠️  Geocoding failed: ${e.message}`);
        processed.coordinates = { lat: 0, lng: 0 };
        warnings.push({
            trip: tripTitle,
            location: item.title,
            type: 'Geocoding',
            message: e.message
        });
    }
}

// Process a single content item (location or article)
async function processContentItem(item, tripId, tripTitle, order, warnings = []) {
    const processed = {
        type: item.type,
        title: item.title,
        file: item.file,
        order: order
    };

    await convertContentMarkdown(processed, item, tripId, tripTitle, warnings);

    if (item.type === 'location') {
        await geocodeContentLocation(processed, item, tripTitle, warnings);
    }

    return processed;
}

// Extract location objects from processed content items
function extractLocations(processedContent) {
    return processedContent
        .filter(item => item.type === 'location')
        .map(item => ({
            name: item.title,
            slug: getContentItemSlug(item),
            duration: item.duration || null,
            coordinates: item.coordinates,
            thumbnail: item.thumbnail || null
        }));
}

// Resolve mapCenter config string to { name, coordinates }
async function resolveMapCenter(tripConfig, processedContent, locations) {
    if (tripConfig.mapCenter) {
        const centerLocation = processedContent.find(item =>
            item.type === 'location' &&
            (item.title === tripConfig.mapCenter || item.place.includes(tripConfig.mapCenter))
        );

        if (centerLocation) {
            return { name: tripConfig.mapCenter, coordinates: centerLocation.coordinates };
        }

        // Geocode the mapCenter string (allows any place, not just trip locations)
        const geocoded = await geocodeLocation(tripConfig.mapCenter);
        if (geocoded) {
            return { name: tripConfig.mapCenter, coordinates: geocoded };
        }

        if (locations.length > 0) {
            console.warn(`   ⚠️  Could not geocode mapCenter "${tripConfig.mapCenter}", using first location`);
            return { name: locations[0].name, coordinates: locations[0].coordinates };
        }

        return null;
    }

    // No mapCenter specified — use first location
    return locations.length > 0
        ? { name: locations[0].name, coordinates: locations[0].coordinates }
        : null;
}

// Load and parse trip.json, exiting on fatal errors
function loadTripConfigForBuild(tripId) {
    const tripConfigPath = CONFIG.getTripConfigPath(tripId);

    if (!fs.existsSync(tripConfigPath)) {
        console.log(`  ⚠️  Config file not found: ${tripConfigPath}`);
        return null;
    }

    try {
        return loadTripConfig(tripId);
    } catch (err) {
        console.error(`\n❌❌❌ FATAL ERROR ❌❌❌`);
        console.error(`Invalid JSON in: ${tripConfigPath}`);
        console.error(`Error: ${err.message}`);
        console.error(`\nPlease fix the JSON syntax error and try again.\n`);
        process.exit(1);
    }
}

// Convert main.md intro content to HTML
async function convertIntroMarkdown(mainMdPath) {
    if (!fs.existsSync(mainMdPath)) return null;

    try {
        console.log(`  📝 Converting intro markdown: ${mainMdPath}`);
        const introHtml = await convertMarkdown(mainMdPath);
        console.log(`  ✅ Intro HTML generated (${introHtml.length} chars)\n`);
        return introHtml;
    } catch (e) {
        console.log(`  ⚠️  Intro markdown conversion failed: ${e.message}\n`);
        return `<p>Trip introduction not available</p>`;
    }
}

// Process a single trip
async function processTrip(tripId, warnings = []) {
    console.log(`\n📍 Processing trip: ${tripId}`);

    const tripConfig = loadTripConfigForBuild(tripId);
    if (!tripConfig) return null;

    // Validate main.md exists
    const mainMdPath = CONFIG.getTripMainPath(tripId);
    if (!fs.existsSync(mainMdPath)) {
        console.log(`  ⚠️  WARNING: main.md not found at ${mainMdPath}`);
        console.log(`     Every trip should have a main.md file for the intro page.\n`);
    }

    const duration = calculateDuration(tripConfig.beginDate, tripConfig.endDate);
    console.log(`  ⏱️  Duration: ${duration}`);

    const introHtml = await convertIntroMarkdown(mainMdPath);

    // Process content items in order
    const processedContent = [];
    console.log(`  📚 Processing ${tripConfig.content.length} content items...\n`);

    for (let i = 0; i < tripConfig.content.length; i++) {
        const item = tripConfig.content[i];
        console.log(`  [${i + 1}/${tripConfig.content.length}] ${item.type}: ${item.title}`);
        const processed = await processContentItem(item, tripId, tripConfig.title, i + 1, warnings);
        processedContent.push(processed);
        console.log('');
    }

    const locations = extractLocations(processedContent);
    const mapCenter = await resolveMapCenter(tripConfig, processedContent, locations);

    return {
        slug: tripId,
        title: tripConfig.title,
        published: tripConfig.published,
        beginDate: tripConfig.beginDate,
        endDate: tripConfig.endDate,
        duration: duration,
        metadata: tripConfig.metadata,
        coverImage: tripConfig.coverImage,
        thumbnail: tripConfig.thumbnail,
        mapCenter: mapCenter,
        introHtml: introHtml,
        content: processedContent,
        locations: locations,
        relatedTrips: tripConfig.relatedTrips || []
    };
}

/**
 * Detect if we're running in production (GitHub Pages) or localhost
 * Production is detected by NODE_ENV environment variable
 * @returns {boolean} true if production, false if localhost
 */
function isProduction() {
    return process.env.NODE_ENV === 'production';
}

/**
 * Filter trips based on published status and environment
 * - Localhost: Returns all trips (ignores published field)
 * - Production: Returns only trips with published: true
 * @param {Array} tripIds - Array of trip IDs from index.json
 * @returns {Promise<Array>} Filtered array of trip IDs
 */
async function filterPublishedTrips(tripIds) {
    const isProd = isProduction();

    // Localhost: show all trips for debugging
    if (!isProd) {
        console.log('🏠 Localhost mode: Building all trips (ignoring published status)\n');
        return tripIds;
    }

    // Production: filter based on published field
    console.log('🌐 Production mode: Filtering trips by published status\n');

    const publishedTrips = [];
    for (const tripId of tripIds) {
        try {
            const tripConfig = loadTripConfig(tripId);

            if (tripConfig.published === true) {
                publishedTrips.push(tripId);
                console.log(`  ✅ ${tripId}: published`);
            } else {
                console.log(`  ⏭️  ${tripId}: unpublished (skipping)`);
            }
        } catch (e) {
            console.warn(`  ⚠️  ${tripId}: Error reading trip config, skipping. ${e.message}`);
        }
    }

    console.log(`\n📊 Building ${publishedTrips.length} of ${tripIds.length} trips\n`);
    return publishedTrips;
}

// Load and validate site configuration
function loadSiteConfig() {
    try {
        const siteConfig = JSON.parse(fs.readFileSync(SITE_CONFIG, 'utf8'));
        console.log(`✅ Loaded site config: ${siteConfig.title}\n`);
        return siteConfig;
    } catch (e) {
        console.error(`❌ Error reading ${SITE_CONFIG}:`, e.message);
        process.exit(1);
    }
}

// Process all trips: geocode, convert markdown, write JSON files
async function processAllTrips(tripsToProcess, warnings) {
    const processedTrips = [];
    let totalContentSize = 0;

    for (const tripId of tripsToProcess) {
        const trip = await processTrip(tripId, warnings);
        if (trip) {
            const fileSize = writeTripContentJson(trip, tripId, TRIPS_OUTPUT_DIR);
            totalContentSize += fileSize;
            console.log(`  💾 Saved trips/${tripId}.json (${(fileSize / 1024).toFixed(1)}KB)`);

            const tripMetadata = extractTripMetadata(trip);
            processedTrips.push(tripMetadata);
        }
    }

    return { processedTrips, totalContentSize };
}

// Generate global pages: homepage, map, about, sitemap, robots.txt
async function generateGlobalPages(output, domain) {
    let htmlSize = 0;

    console.log(`   📄 Generating homepage...`);
    const homepageSize = generateAndPromoteHomepage(output, domain, generateHomepage);
    htmlSize += homepageSize;
    console.log(`   ✅ Homepage generated and promoted (${(homepageSize / 1024).toFixed(1)}KB)`);

    console.log(`   📄 Generating map page...`);
    const mapSize = generateMapPageToFile(output, domain, generateMapPage);
    htmlSize += mapSize;
    console.log(`   ✅ Map page generated (${(mapSize / 1024).toFixed(1)}KB)`);

    console.log(`   📄 Generating about page...`);
    ensureDir('about');
    const aboutHtml = await generateAboutPage(output, domain, convertMarkdown);
    fs.writeFileSync('about/index.html', aboutHtml, 'utf8');
    const aboutSize = fs.statSync('about/index.html').size;
    htmlSize += aboutSize;
    console.log(`   ✅ About page generated (${(aboutSize / 1024).toFixed(1)}KB)`);

    console.log(`\n   📄 Generating sitemap.xml...`);
    const sitemapSize = generateSitemapToFile(output.trips, domain, generateSitemap);
    console.log(`   ✅ Sitemap generated (${(sitemapSize / 1024).toFixed(1)}KB)`);

    console.log(`   📄 Generating robots.txt...`);
    const robotsTxt = generateRobotsTxt(domain);
    fs.writeFileSync('robots.txt', robotsTxt, 'utf8');
    const robotsSize = fs.statSync('robots.txt').size;
    console.log(`   ✅ Robots.txt generated (${(robotsSize / 1024).toFixed(0)} bytes)`);

    return htmlSize;
}

// Print JSON build summary stats
function printJsonSummary(processedTrips, indexSize, totalContentSize) {
    console.log(`\n✅ JSON build complete!`);
    console.log(`\n📊 Summary:`);
    console.log(`   - Trips processed: ${processedTrips.length}`);
    console.log(`   - Total locations: ${processedTrips.reduce((sum, t) => sum + t.locations.length, 0)}`);
    console.log(`\n💾 File sizes:`);
    console.log(`   - Index (${OUTPUT_FILE}): ${(indexSize / 1024).toFixed(1)}KB`);
    console.log(`   - Trip content files: ${(totalContentSize / 1024).toFixed(1)}KB`);
    console.log(`   - Total: ${((indexSize + totalContentSize) / 1024).toFixed(1)}KB`);
    console.log(`\n⚡ Performance:`);
    console.log(`   - Initial load: ${(indexSize / 1024).toFixed(1)}KB (index only)`);
    console.log(`   - Per trip load: ~${(totalContentSize / processedTrips.length / 1024).toFixed(1)}KB average`);
}

// Main build function
async function build(specificTripId = null) {
    if (specificTripId) {
        console.log(`🚀 Starting full build for trip: ${specificTripId}\n`);
    } else {
        console.log('🚀 Starting full build process (Trips Architecture)...\n');
    }

    const siteConfig = loadSiteConfig();

    // Auto-discover trips by scanning directories (sorted by date, newest first)
    const discoveredTrips = discoverAllTrips(TRIPS_DIR, (tripId) => CONFIG.getTripConfigPath(tripId));

    // If specific trip requested, filter to just that trip
    let tripsToDiscover = discoveredTrips;
    if (specificTripId) {
        if (!discoveredTrips.includes(specificTripId)) {
            console.error(`❌ Trip "${specificTripId}" not found`);
            console.error(`   Available trips: ${discoveredTrips.join(', ')}`);
            process.exit(1);
        }
        tripsToDiscover = [specificTripId];
        console.log(`📋 Building single trip: ${specificTripId}\n`);
    } else {
        console.log(`📋 Discovered ${discoveredTrips.length} trips (sorted by date, newest first)\n`);
    }

    // Filter trips based on published status and environment
    const tripsToProcess = await filterPublishedTrips(tripsToDiscover);

    // Create trips output directory and process all trips
    ensureDir(TRIPS_OUTPUT_DIR);
    const buildWarnings = [];
    const { processedTrips, totalContentSize } = await processAllTrips(tripsToProcess, buildWarnings);

    const output = { site: siteConfig, trips: processedTrips };

    // For single-trip builds, skip global file generation
    if (specificTripId) {
        console.log(`\n✅ Trip build complete!`);
        console.log(`\n📊 Summary:`);
        console.log(`   - Trip processed: ${specificTripId}`);
        console.log(`   - Total locations: ${processedTrips.reduce((sum, t) => sum + t.locations.length, 0)}`);
        console.log(`\n⚠️  Note: Skipping global files (homepage, map, config.built.json)`);
        console.log(`   Run 'npm run build' without trip ID to regenerate global files\n`);
    } else {
        try {
            const indexSize = writeConfigBuilt(output, OUTPUT_FILE);
            printJsonSummary(processedTrips, indexSize, totalContentSize);
        } catch (e) {
            console.error('❌ Error writing output file:', e.message);
            process.exit(1);
        }
    }

    // Generate static HTML pages (SSG)
    console.log(`\n🏗️  Generating static HTML pages...\n`);
    const domain = siteConfig.domain || 'https://example.com';

    try {
        let htmlSizeTotal = 0;

        if (!specificTripId) {
            htmlSizeTotal += await generateGlobalPages(output, domain);
        }

        // Generate trip pages
        console.log(`   📄 Generating trip pages...\n`);
        const tripIds = processedTrips.map(t => t.slug);
        for (let i = 0; i < processedTrips.length; i++) {
            console.log(`   [${i + 1}/${processedTrips.length}] ${processedTrips[i].title}`);
            const result = generateTripHtmlPages(
                [tripIds[i]], output, domain, TRIPS_OUTPUT_DIR, generateTripFiles, '      '
            );
            htmlSizeTotal += result.totalSize;
            console.log('');
        }

        console.log(`\n✅ SSG complete!`);
        console.log(`\n💾 Static HTML sizes:`);
        console.log(`   - Total HTML files: ${(htmlSizeTotal / 1024).toFixed(1)}KB`);
        console.log(`   - Average trip page: ${(htmlSizeTotal / (processedTrips.length + 3) / 1024).toFixed(1)}KB`);

        console.log(`\n🎯 Next steps:`);
        console.log(`   1. Review generated HTML files`);
        console.log(`   2. Update domain in config/site.json`);
        console.log(`   3. Test locally with: npm run serve`);
        console.log(`   4. Validate SEO with online tools`);
        console.log(`   5. Deploy your site!`);

        printBuildWarnings(buildWarnings);

        // Update build cache so smart build knows what's been built
        console.log(`\n💾 Updating build cache...`);
        const buildCache = createEmptyCache();
        updateFullCache(buildCache);
        saveCache(buildCache);
        console.log(`   ✅ Cache updated`);
    } catch (e) {
        console.error('❌ Error generating HTML:', e.message);
        console.error(e.stack);
        process.exit(1);
    }
}

// Export processTrip for use by incremental build scripts
module.exports = { processTrip };

// Only run full build when executed directly (not when required by build-smart)
if (require.main === module) {
    // Get trip ID from command line args (e.g., "npm run build greece")
    const specificTripId = process.argv[2];

    build(specificTripId).catch(err => {
        console.error('❌ Build failed:', err);
        process.exit(1);
    });
}
