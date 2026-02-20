/**
 * Shared build utility functions
 * Used by build.js, build-smart.js, and build-writing.js to avoid code duplication
 */

const fs = require('fs');
const path = require('path');
const { GALLERY_MARKER, MARKDOWN_IMAGE_REGEX } = require('./constants');
const { convertMarkdown } = require('./markdown-converter');
const CONFIG = require('./config-paths');

/**
 * Create a directory (and parents) if it doesn't already exist.
 * fs.mkdirSync with { recursive: true } is a no-op when the directory exists.
 *
 * @param {string} dirPath - Directory path to ensure exists
 */
function ensureDir(dirPath) {
    fs.mkdirSync(dirPath, { recursive: true });
}

/**
 * Load and parse a JSON file from disk.
 *
 * @param {string} filePath - Absolute or relative path to JSON file
 * @returns {Object} Parsed JSON content
 * @throws {Error} If file is missing or contains invalid JSON
 */
function loadJsonFile(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Write data to a JSON file with 2-space indentation.
 *
 * @param {string} filePath - Absolute or relative path to write
 * @param {*} data - Any JSON-serialisable value
 */
function writeJsonFile(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Read a text file from disk.
 *
 * @param {string} filePath - Absolute or relative path to text file
 * @returns {string} File content as UTF-8 string
 */
function readTextFile(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

/**
 * Return the byte size of a file on disk.
 *
 * @param {string} filePath - Absolute or relative path to the file
 * @returns {number} File size in bytes
 */
function getFileSize(filePath) {
    return fs.statSync(filePath).size;
}

/**
 * Load and parse a trip's trip.json configuration file.
 *
 * @param {string} tripId - Trip ID (directory name)
 * @returns {Object} Parsed trip configuration
 * @throws {Error} If config file is missing or contains invalid JSON
 */
function loadTripConfig(tripId) {
    return loadJsonFile(CONFIG.getTripConfigPath(tripId));
}

/**
 * Recursively walk a directory and return matching file paths.
 *
 * @param {string} dir - Directory to walk
 * @param {Object} [options]
 * @param {Set<string>} [options.skipDirs] - Directory names to skip
 * @param {function(string): boolean} [options.fileFilter] - Predicate on filename
 * @returns {Array<string>} Array of absolute file paths
 */
function walkDir(dir, { skipDirs = new Set(), fileFilter = () => true } = {}) {
    const results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (skipDirs.has(entry.name)) continue;
            results.push(...walkDir(full, { skipDirs, fileFilter }));
        } else if (fileFilter(entry.name)) {
            results.push(full);
        }
    }
    return results;
}

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
            const tripConfig = loadJsonFile(tripConfigPath);
            trips.push({
                slug: tripId,  // Infer slug from directory name
                beginDate: tripConfig.beginDate || '1970-01-01'
            });
        } catch (e) {
            console.warn(`  ⚠️  Skipping ${tripId}: invalid config (${e.message})`);
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
    const markdownContent = readTextFile(filePath);
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
        const imageRegex = new RegExp(MARKDOWN_IMAGE_REGEX);
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
 * Convert a markdown file to HTML, handling gallery marker extraction.
 * If the file contains a gallery marker, strips the gallery section before
 * converting and returns the extracted gallery images separately.
 *
 * @param {string} filePath - Path to the markdown file
 * @param {string} itemFile - Name of the markdown file (for logging)
 * @returns {Promise<{html: string, galleryImages: Array|null}>}
 */
async function convertMarkdownWithGallery(filePath, itemFile) {
    const { markdownContent, galleryImages } = processMarkdownWithGallery(filePath, itemFile);

    let html;
    if (galleryImages && galleryImages.length > 0) {
        const tempPath = `${filePath}.temp`;
        fs.writeFileSync(tempPath, markdownContent, 'utf8');
        html = await convertMarkdown(tempPath);
        fs.unlinkSync(tempPath);
    } else {
        html = await convertMarkdown(filePath);
    }

    return { html, galleryImages };
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

    writeJsonFile(tripContentFile, tripContent);

    return getFileSize(tripContentFile);
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
    writeJsonFile(outputFile, output);

    return getFileSize(outputFile);
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

    return getFileSize('index.html');
}

/**
 * Generate map page to file
 * @param {Object} output - Output object with site and trips
 * @param {string} domain - Site domain
 * @param {function} generateMapPageFn - Map page generator function
 * @returns {number} File size in bytes
 */
function generateMapPageToFile(output, domain, generateMapPageFn) {
    ensureDir('map');
    const mapHtml = generateMapPageFn(output, domain);
    fs.writeFileSync('map/index.html', mapHtml, 'utf8');

    return getFileSize('map/index.html');
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

    return getFileSize('sitemap.xml');
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

        const tripContentData = loadJsonFile(tripContentPath);

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

/**
 * Load previously-built trip data from the build output directory.
 * Returns the trip content JSON, metadata from config.built.json, and
 * the full built config (site + trips). Returns null if data is missing.
 *
 * @param {string} tripId - Trip ID (directory name)
 * @returns {Object|null} { tripContentData, tripMetadata, fullConfig } or null
 */
function loadBuiltTripData(tripId) {
    const tripContentFile = path.join(CONFIG.TRIPS_OUTPUT_DIR, `${tripId}.json`);
    if (!fs.existsSync(tripContentFile)) return null;

    const tripContentData = loadJsonFile(tripContentFile);
    const builtConfig = loadJsonFile(CONFIG.OUTPUT_FILE);
    const tripMetadata = builtConfig.trips.find(t => t.slug === tripId);
    if (!tripMetadata) return null;

    return {
        tripContentData,
        tripMetadata,
        fullConfig: { site: builtConfig.site, trips: builtConfig.trips }
    };
}

/**
 * Print a summary of build warnings (geocoding failures, markdown issues, etc.)
 * @param {Array} warnings - Array of { trip, location, type, message }
 */
function printBuildWarnings(warnings) {
    if (warnings.length === 0) return;
    console.log(`\n⚠️  Build completed with ${warnings.length} warning(s):\n`);
    warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. Trip: ${warning.trip}`);
        console.log(`      Location: ${warning.location}`);
        console.log(`      Issue: ${warning.type} - ${warning.message}\n`);
    });
}

module.exports = {
    ensureDir,
    loadJsonFile,
    writeJsonFile,
    readTextFile,
    getFileSize,
    loadTripConfig,
    walkDir,
    discoverAllTrips,
    processMarkdownWithGallery,
    convertMarkdownWithGallery,
    writeTripContentJson,
    extractTripMetadata,
    writeConfigBuilt,
    loadBuiltTripData,
    generateAndPromoteHomepage,
    generateMapPageToFile,
    generateSitemapToFile,
    generateTripHtmlPages,
    printBuildWarnings
};
