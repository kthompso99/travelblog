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
    discoverTrips: discoverTripsShared,
    processMarkdownWithGallery,
    writeTripContentJson,
    extractTripMetadata,
    writeConfigBuilt,
    generateAndPromoteHomepage,
    generateMapPageToFile,
    generateSitemapToFile,
    generateTripHtmlPages
} = require('../../lib/build-utilities');

// Import centralized configuration paths
const CONFIG = require('../../lib/config-paths');

// Import cache management
const { loadCache, createEmptyCache, updateFullCache, saveCache } = require('../../lib/build-cache');

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

// Process a single content item (location or article)
async function processContentItem(item, tripId, tripTitle, order, warnings = []) {
    const processed = {
        type: item.type,
        title: item.title,
        file: item.file,  // Include filename for stable slug generation
        order: order
    };

    // Convert markdown to HTML (file path is relative to trip dir)
    if (item.file) {
        const filePath = path.join(CONFIG.getTripDir(tripId), item.file);
        try {
            console.log(`    📝 Converting markdown: ${filePath}`);

            // Use shared gallery marker detection function
            const { markdownContent, galleryImages } = processMarkdownWithGallery(filePath, item.file);

            if (galleryImages && galleryImages.length > 0) {
                // Write processed content (without gallery) to temp file for conversion
                const tempPath = filePath + '.temp';
                fs.writeFileSync(tempPath, markdownContent, 'utf8');
                processed.contentHtml = await convertMarkdown(tempPath);
                fs.unlinkSync(tempPath); // Clean up temp file
            } else {
                // No marker found, convert entire file as before
                processed.contentHtml = await convertMarkdown(filePath);
            }

            console.log(`    ✅ HTML generated (${processed.contentHtml.length} chars)`);

            // Store gallery if images found
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

    // If it's a location, geocode it
    if (item.type === 'location') {
        processed.place = item.place;
        processed.duration = item.duration;
        if (item.thumbnail) processed.thumbnail = item.thumbnail;

        // Geocode the place
        try {
            console.log(`    🗺️  Geocoding: ${item.place}`);
            processed.coordinates = await geocodeLocation(item.place);
            console.log(`    ✅ Coordinates: ${processed.coordinates.lat}, ${processed.coordinates.lng}`);

            // Respect rate limits (1 request per second)
            await new Promise(resolve => setTimeout(resolve, 1000));
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

// Process a single trip
async function processTrip(tripId, warnings = []) {
    console.log(`\n📍 Processing trip: ${tripId}`);

    const tripConfigPath = CONFIG.getTripConfigPath(tripId);

    if (!fs.existsSync(tripConfigPath)) {
        console.log(`  ⚠️  Config file not found: ${tripConfigPath}`);
        return null;
    }

    // Parse trip.json with clear error handling
    let tripConfig;
    try {
        tripConfig = JSON.parse(fs.readFileSync(tripConfigPath, 'utf8'));
    } catch (error) {
        console.error(`\n❌❌❌ FATAL ERROR ❌❌❌`);
        console.error(`Invalid JSON in: ${tripConfigPath}`);
        console.error(`Error: ${error.message}`);
        console.error(`\nPlease fix the JSON syntax error and try again.\n`);
        process.exit(1);
    }

    // Validate main.md exists
    const mainMdPath = CONFIG.getTripMainPath(tripId);
    if (!fs.existsSync(mainMdPath)) {
        console.log(`  ⚠️  WARNING: main.md not found at ${mainMdPath}`);
        console.log(`     Every trip should have a main.md file for the intro page.\n`);
    }

    // Calculate duration
    const duration = calculateDuration(tripConfig.beginDate, tripConfig.endDate);
    console.log(`  ⏱️  Duration: ${duration}`);

    // Process main.md (intro content)
    let introHtml = null;
    if (fs.existsSync(mainMdPath)) {
        try {
            console.log(`  📝 Converting intro markdown: ${mainMdPath}`);
            introHtml = await convertMarkdown(mainMdPath);
            console.log(`  ✅ Intro HTML generated (${introHtml.length} chars)\n`);
        } catch (e) {
            console.log(`  ⚠️  Intro markdown conversion failed: ${e.message}\n`);
            introHtml = `<p>Trip introduction not available</p>`;
        }
    }

    // Process content items in order
    const processedContent = [];
    console.log(`  📚 Processing ${tripConfig.content.length} content items...\n`);

    for (let i = 0; i < tripConfig.content.length; i++) {
        const item = tripConfig.content[i];
        const order = i + 1; // 1-based ordering

        console.log(`  [${i + 1}/${tripConfig.content.length}] ${item.type}: ${item.title}`);
        const processed = await processContentItem(item, tripId, tripConfig.title, order, warnings);
        processedContent.push(processed);
        console.log('');
    }

    // Extract locations for mapping
    const locations = extractLocations(processedContent);

    // Resolve mapCenter to coordinates
    const mapCenter = await resolveMapCenter(tripConfig, processedContent, locations);

    // Build final trip object
    return {
        slug: tripId,  // Infer slug from directory name
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
        const tripConfigPath = CONFIG.getTripConfigPath(tripId);
        try {
            const tripData = fs.readFileSync(tripConfigPath, 'utf8');
            const tripConfig = JSON.parse(tripData);

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

// Main build function
async function build(specificTripId = null) {
    if (specificTripId) {
        console.log(`🚀 Starting full build for trip: ${specificTripId}\n`);
    } else {
        console.log('🚀 Starting full build process (Trips Architecture)...\n');
    }

    // Read site config
    let siteConfig;
    try {
        siteConfig = JSON.parse(fs.readFileSync(SITE_CONFIG, 'utf8'));
        console.log(`✅ Loaded site config: ${siteConfig.title}\n`);
    } catch (e) {
        console.error(`❌ Error reading ${SITE_CONFIG}:`, e.message);
        process.exit(1);
    }

    // Auto-discover trips by scanning directories (sorted by date, newest first)
    const discoveredTrips = discoverTripsShared(TRIPS_DIR, (tripId) => CONFIG.getTripConfigPath(tripId));

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

    // Create index config with filtered trips
    const indexConfig = {
        trips: tripsToProcess
    };

    // Create trips output directory
    if (!fs.existsSync(TRIPS_OUTPUT_DIR)) {
        fs.mkdirSync(TRIPS_OUTPUT_DIR, { recursive: true });
    }

    // Process each trip
    const processedTrips = [];
    let totalContentSize = 0;
    const buildWarnings = []; // Collect warnings during build

    for (const tripId of indexConfig.trips) {
        const trip = await processTrip(tripId, buildWarnings);
        if (trip) {
            // Save full trip content to separate file using shared function
            const fileSize = writeTripContentJson(trip, tripId, TRIPS_OUTPUT_DIR);
            totalContentSize += fileSize;
            console.log(`  💾 Saved trips/${tripId}.json (${(fileSize / 1024).toFixed(1)}KB)`);

            // Create lightweight metadata version for index using shared function
            const tripMetadata = extractTripMetadata(trip);
            processedTrips.push(tripMetadata);
        }
    }

    // Build lightweight index file
    const output = {
        site: siteConfig,
        trips: processedTrips
    };

    // For single-trip builds, skip global file generation (homepage, map, config.built.json)
    // Only generate the specific trip's HTML pages
    if (specificTripId) {
        console.log(`\n✅ Trip build complete!`);
        console.log(`\n📊 Summary:`);
        console.log(`   - Trip processed: ${specificTripId}`);
        console.log(`   - Total locations: ${processedTrips.reduce((sum, t) => sum + t.locations.length, 0)}`);
        console.log(`\n⚠️  Note: Skipping global files (homepage, map, config.built.json)`);
        console.log(`   Run 'npm run build' without trip ID to regenerate global files\n`);
    } else {
        // Write built config using shared function (full build only)
        try {
            const indexSize = writeConfigBuilt(output, OUTPUT_FILE);

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
        } catch (e) {
            console.error('❌ Error writing output file:', e.message);
            process.exit(1);
        }
    }

    // Generate static HTML pages (SSG)
    console.log(`\n🏗️  Generating static HTML pages...\n`);

    const domain = siteConfig.domain || 'https://example.com';
    let htmlSizeTotal = 0;

    try {
        if (!specificTripId) {
            // Full build: generate all global pages
            // Generate homepage using shared function
            console.log(`   📄 Generating homepage...`);
            const homepageSize = generateAndPromoteHomepage(output, domain, generateHomepage);
            htmlSizeTotal += homepageSize;
            console.log(`   ✅ Homepage generated and promoted (${(homepageSize / 1024).toFixed(1)}KB)`);

            // Generate map page using shared function
            console.log(`   📄 Generating map page...`);
            const mapSize = generateMapPageToFile(output, domain, generateMapPage);
            htmlSizeTotal += mapSize;
            console.log(`   ✅ Map page generated (${(mapSize / 1024).toFixed(1)}KB)`);

            // Generate about page
            console.log(`   📄 Generating about page...`);
            if (!fs.existsSync('about')) {
                fs.mkdirSync('about', { recursive: true });
            }
            const aboutHtml = await generateAboutPage(output, domain, convertMarkdown);
            fs.writeFileSync('about/index.html', aboutHtml, 'utf8');
            const aboutSize = fs.statSync('about/index.html').size;
            htmlSizeTotal += aboutSize;
            console.log(`   ✅ About page generated (${(aboutSize / 1024).toFixed(1)}KB)`);
        }

        // Generate trip pages (all trips for full build, single trip for partial build)
        console.log(`   📄 Generating trip pages...\n`);
        const tripIds = processedTrips.map(t => t.slug);
        for (let i = 0; i < processedTrips.length; i++) {
            console.log(`   [${i + 1}/${processedTrips.length}] ${processedTrips[i].title}`);

            // Generate this trip's HTML files
            const result = generateTripHtmlPages(
                [tripIds[i]],
                output,
                domain,
                TRIPS_OUTPUT_DIR,
                generateTripFiles,
                '      '
            );
            htmlSizeTotal += result.totalSize;
            console.log('');
        }

        if (!specificTripId) {
            // Full build only: generate sitemap and robots.txt
            // Generate sitemap.xml using shared function
            console.log(`\n   📄 Generating sitemap.xml...`);
            const sitemapSize = generateSitemapToFile(processedTrips, domain, generateSitemap);
            console.log(`   ✅ Sitemap generated (${(sitemapSize / 1024).toFixed(1)}KB)`);

            // Generate robots.txt
            console.log(`   📄 Generating robots.txt...`);
            const robotsTxt = generateRobotsTxt(domain);
            fs.writeFileSync('robots.txt', robotsTxt, 'utf8');
            const robotsSize = fs.statSync('robots.txt').size;
            console.log(`   ✅ Robots.txt generated (${(robotsSize / 1024).toFixed(0)} bytes)`);
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

        // Print warning summary if there were any issues
        if (buildWarnings.length > 0) {
            console.log(`\n⚠️  Build completed with ${buildWarnings.length} warning(s):\n`);
            buildWarnings.forEach((warning, index) => {
                console.log(`   ${index + 1}. Trip: ${warning.trip}`);
                console.log(`      Location: ${warning.location}`);
                console.log(`      Issue: ${warning.type} - ${warning.message}\n`);
            });
        }

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
