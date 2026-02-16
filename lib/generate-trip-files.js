/**
 * Shared trip file generation functions
 * Used by build.js, build-smart.js, and build-trip.js to avoid code duplication
 */

const fs = require('fs');
const path = require('path');
const { slugify } = require('./slug-utilities');
const { generateTripIntroPage, generateTripLocationPage, generateTripArticlePage, generateTripMapPage } = require('./generate-html');

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
        tripMetadata = {
            slug: tripData.slug,
            title: tripData.title,
            published: tripData.published,
            beginDate: tripData.beginDate,
            endDate: tripData.endDate,
            duration: tripData.duration,
            metadata: tripData.metadata,
            coverImage: tripData.coverImage,
            thumbnail: tripData.thumbnail,
            mapCenter: tripData.mapCenter,
            locations: tripData.locations,
            relatedTrips: tripData.relatedTrips
        };
    }

    // Add introHtml to metadata
    tripMetadata.introHtml = tripData.introHtml;

    // Get all content and filter by type
    const allContent = tripData.content;
    const locations = allContent.filter(item => item.type === 'location');
    const articles = allContent.filter(item => item.type === 'article');

    // Create trip directory
    const tripDir = path.join('trips', tripId);
    if (!fs.existsSync(tripDir)) {
        fs.mkdirSync(tripDir, { recursive: true });
    }

    const result = {
        introPath: null,
        mapPath: null,
        locationPaths: [],
        articlePaths: [],
        imageCount: 0
    };

    // Generate trip intro page (index.html)
    const introHtml = generateTripIntroPage(tripMetadata, allContent, output, domain);
    const introPath = path.join(tripDir, 'index.html');
    fs.writeFileSync(introPath, introHtml, 'utf8');
    result.introPath = introPath;
    console.log(`${indent}✅ Intro page → ${tripDir}/index.html`);

    // Generate trip map page (map.html)
    const mapHtml = generateTripMapPage(tripMetadata, allContent, output, domain);
    const mapPath = path.join(tripDir, 'map.html');
    fs.writeFileSync(mapPath, mapHtml, 'utf8');
    result.mapPath = mapPath;
    console.log(`${indent}✅ Map page → ${tripDir}/map.html`);

    // Generate location pages
    locations.forEach((location, idx) => {
        const locationSlug = slugify(location.title);
        const locationHtml = generateTripLocationPage(tripMetadata, location, allContent, idx, output, domain);
        const locationPath = path.join(tripDir, `${locationSlug}.html`);
        fs.writeFileSync(locationPath, locationHtml, 'utf8');
        result.locationPaths.push(locationPath);
        console.log(`${indent}✅ ${location.title} → ${tripDir}/${locationSlug}.html`);
    });

    // Generate article pages
    articles.forEach((article, idx) => {
        const articleSlug = slugify(article.title);
        const articleHtml = generateTripArticlePage(tripMetadata, article, allContent, idx, output, domain);
        const articlePath = path.join(tripDir, `${articleSlug}.html`);
        fs.writeFileSync(articlePath, articleHtml, 'utf8');
        result.articlePaths.push(articlePath);
        console.log(`${indent}✅ ${article.title} (article) → ${tripDir}/${articleSlug}.html`);
    });

    // Copy images
    const imgSrc = path.join('content/trips', tripId, 'images');
    const imgDst = path.join(tripDir, 'images');
    if (fs.existsSync(imgSrc)) {
        if (!fs.existsSync(imgDst)) {
            fs.mkdirSync(imgDst, { recursive: true });
        }

        let count = 0;
        const files = fs.readdirSync(imgSrc);
        for (const file of files) {
            const src = path.join(imgSrc, file);
            if (fs.statSync(src).isFile()) {
                fs.copyFileSync(src, path.join(imgDst, file));
                count++;
            }
        }
        result.imageCount = count;
        if (count > 0) {
            console.log(`${indent}📷 Copied ${count} image(s)`);
        }
    }

    return result;
}

module.exports = {
    generateTripFiles
};
