/**
 * Shared build utility functions
 * Used by build.js, build-smart.js, and build-writing.js to avoid code duplication
 */

const fs = require('fs');
const path = require('path');
const { GALLERY_MARKER } = require('./constants');

/**
 * Discover all trips by scanning the trips directory
 * Returns trip IDs sorted in reverse chronological order (newest first)
 *
 * @param {string} tripsDir - Path to the trips directory
 * @param {function} getTripConfigPath - Function that takes tripId and returns config path
 * @returns {Array<string>} Array of trip IDs sorted by beginDate (newest first)
 */
function discoverAllTrips(tripsDir, getTripConfigPath) {
    if (!fs.existsSync(tripsDir)) {
        return [];
    }

    const entries = fs.readdirSync(tripsDir, { withFileTypes: true });
    const tripDirs = entries.filter(entry => entry.isDirectory()).map(entry => entry.name);

    const trips = [];
    for (const tripId of tripDirs) {
        const tripConfigPath = getTripConfigPath(tripId);
        if (!fs.existsSync(tripConfigPath)) continue;

        try {
            const tripData = fs.readFileSync(tripConfigPath, 'utf8');
            const tripConfig = JSON.parse(tripData);
            trips.push({
                slug: tripId,  // Infer slug from directory name
                beginDate: tripConfig.beginDate || '1970-01-01'
            });
        } catch (e) {
            // Skip trips with invalid config
        }
    }

    trips.sort((a, b) => new Date(b.beginDate) - new Date(a.beginDate));
    return trips.map(trip => trip.slug);
}

/**
 * Process markdown file with optional gallery marker detection
 * Detects "*Add your photos here*" marker and splits content
 *
 * @param {string} filePath - Path to the markdown file
 * @param {string} itemFile - Name of the markdown file (for logging)
 * @returns {Object} { markdownContent: string, galleryImages: array|null }
 */
function processMarkdownWithGallery(filePath, itemFile) {
    const markdownContent = fs.readFileSync(filePath, 'utf8');
    let processedContent = markdownContent;
    let galleryImages = null;

    const galleryMarker = GALLERY_MARKER;
    const markerIndex = markdownContent.indexOf(galleryMarker);

    if (markerIndex !== -1) {
        console.log(`    📸 Gallery marker found in ${itemFile}`);

        // Split content at marker
        const beforeMarker = markdownContent.substring(0, markerIndex);
        const afterMarker = markdownContent.substring(markerIndex + galleryMarker.length);

        // Extract images from content after marker
        const imageRegex = /!\[([^\]]*)\]\(([^\)]+)\)/g;
        galleryImages = [];
        let match;

        while ((match = imageRegex.exec(afterMarker)) !== null) {
            galleryImages.push({
                caption: match[1],
                src: match[2]
            });
        }

        // Only return pre-marker content (strip gallery section)
        processedContent = beforeMarker.trim();
    }

    return {
        markdownContent: processedContent,
        galleryImages: galleryImages
    };
}

/**
 * Write trip content JSON file
 * @param {Object} trip - Processed trip object with slug, introHtml, content
 * @param {string} tripId - Trip ID (slug)
 * @param {string} tripsOutputDir - Output directory for trip JSON files
 * @returns {number} File size in bytes
 */
function writeTripContentJson(trip, tripId, tripsOutputDir) {
    const tripContentFile = path.join(tripsOutputDir, `${tripId}.json`);
    const tripContent = {
        slug: trip.slug,
        introHtml: trip.introHtml,
        content: trip.content
    };

    fs.writeFileSync(
        tripContentFile,
        JSON.stringify(tripContent, null, 2),
        'utf8'
    );

    return fs.statSync(tripContentFile).size;
}

/**
 * Extract trip metadata (lightweight version for config.built.json)
 * @param {Object} trip - Full trip object
 * @returns {Object} Metadata-only object
 */
function extractTripMetadata(trip) {
    return {
        slug: trip.slug,
        title: trip.title,
        published: trip.published,
        beginDate: trip.beginDate,
        endDate: trip.endDate,
        duration: trip.duration,
        metadata: trip.metadata,
        coverImage: trip.coverImage,
        thumbnail: trip.thumbnail,
        mapCenter: trip.mapCenter,
        locations: trip.locations,
        relatedTrips: trip.relatedTrips
    };
}

/**
 * Write config.built.json file
 * @param {Object} output - Output object with site and trips
 * @param {string} outputFile - Path to output file
 * @returns {number} File size in bytes
 */
function writeConfigBuilt(output, outputFile) {
    fs.writeFileSync(
        outputFile,
        JSON.stringify(output, null, 2),
        'utf8'
    );

    return fs.statSync(outputFile).size;
}

/**
 * Generate homepage and promote it to index.html
 * Handles backup of old index.html automatically
 * @param {Object} output - Output object with site and trips
 * @param {string} domain - Site domain
 * @param {function} generateHomepageFn - Homepage generator function
 * @returns {number} File size in bytes
 */
function generateAndPromoteHomepage(output, domain, generateHomepageFn) {
    const homepageHtml = generateHomepageFn(output, domain);
    fs.writeFileSync('index.html.new', homepageHtml, 'utf8');

    // Auto-promote (backup old version first)
    if (fs.existsSync('index.html')) {
        fs.copyFileSync('index.html', 'index.html.backup');
    }
    fs.renameSync('index.html.new', 'index.html');

    return fs.statSync('index.html').size;
}

/**
 * Generate map page to file
 * @param {Object} output - Output object with site and trips
 * @param {string} domain - Site domain
 * @param {function} generateMapPageFn - Map page generator function
 * @returns {number} File size in bytes
 */
function generateMapPageToFile(output, domain, generateMapPageFn) {
    if (!fs.existsSync('map')) {
        fs.mkdirSync('map', { recursive: true });
    }
    const mapHtml = generateMapPageFn(output, domain);
    fs.writeFileSync('map/index.html', mapHtml, 'utf8');

    return fs.statSync('map/index.html').size;
}

/**
 * Generate sitemap to file
 * @param {Array} trips - Array of trip metadata objects
 * @param {string} domain - Site domain
 * @param {function} generateSitemapFn - Sitemap generator function
 * @returns {number} File size in bytes
 */
function generateSitemapToFile(trips, domain, generateSitemapFn) {
    const sitemapXml = generateSitemapFn(trips, domain);
    fs.writeFileSync('sitemap.xml', sitemapXml, 'utf8');

    return fs.statSync('sitemap.xml').size;
}

/**
 * Generate HTML pages for trips
 * @param {Array} tripIds - Array of trip IDs to generate
 * @param {Object} output - Output object with site and trips
 * @param {string} domain - Site domain
 * @param {string} tripsOutputDir - Directory containing trip JSON files
 * @param {function} generateTripFilesFn - Trip files generator function
 * @param {string} indent - Indentation for logging (default: '      ')
 * @returns {Object} { totalSize: number, tripCount: number }
 */
function generateTripHtmlPages(tripIds, output, domain, tripsOutputDir, generateTripFilesFn, indent = '      ') {
    let totalHtmlSize = 0;

    for (const tripId of tripIds) {
        // Load full trip content
        const tripContentPath = path.join(tripsOutputDir, `${tripId}.json`);
        if (!fs.existsSync(tripContentPath)) continue;

        const tripContentData = JSON.parse(fs.readFileSync(tripContentPath, 'utf8'));

        // Reconstruct tripData structure for generateTripFiles
        const tripData = {
            slug: tripId,
            introHtml: tripContentData.introHtml,
            content: tripContentData.content
        };

        // Generate all trip files using shared function
        const result = generateTripFilesFn(tripData, output, domain, indent);

        // Calculate total HTML size
        if (result.introPath) totalHtmlSize += fs.statSync(result.introPath).size;
        if (result.mapPath) totalHtmlSize += fs.statSync(result.mapPath).size;
        result.locationPaths.forEach(p => totalHtmlSize += fs.statSync(p).size);
        result.articlePaths.forEach(p => totalHtmlSize += fs.statSync(p).size);
    }

    return {
        totalSize: totalHtmlSize,
        tripCount: tripIds.length
    };
}

module.exports = {
    discoverAllTrips,
    processMarkdownWithGallery,
    writeTripContentJson,
    extractTripMetadata,
    writeConfigBuilt,
    generateAndPromoteHomepage,
    generateMapPageToFile,
    generateSitemapToFile,
    generateTripHtmlPages
};
