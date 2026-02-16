#!/usr/bin/env node

/**
 * Build a single trip - useful for testing
 * Usage: npm run build:trip <trip-id>
 * Example: npm run build:trip botswana
 */

const fs = require('fs');
const path = require('path');
const CONFIG = require('../../lib/config-paths');
const { slugify } = require('../../lib/slug-utilities');

// Import from main build script
const { processTrip, convertMarkdown } = require('./build.js');
const { generateTripIntroPage, generateTripLocationPage, generateTripArticlePage, generateTripMapPage } = require('../../lib/generate-html');

const tripId = process.argv[2];

if (!tripId) {
    console.error('Usage: npm run build:trip <trip-id>');
    console.error('Example: npm run build:trip botswana');
    process.exit(1);
}

console.log(`🔨 Building single trip: ${tripId}\n`);

// Verify trip exists
const tripConfigPath = CONFIG.getTripConfigPath(tripId);
if (!fs.existsSync(tripConfigPath)) {
    console.error(`❌ Trip not found: ${tripId}`);
    console.error(`   Looking for: ${tripConfigPath}`);
    process.exit(1);
}

// Build just this trip
(async () => {
    try {
        const tripData = await processTrip(tripId);

        if (!tripData) {
            console.error(`❌ Failed to process trip: ${tripId}`);
            process.exit(1);
        }

        // Load site config for HTML generation
        const siteConfig = JSON.parse(fs.readFileSync(CONFIG.SITE_CONFIG, 'utf8'));
        const domain = siteConfig.domain || 'https://example.com';

        // Create minimal output object (just this trip)
        const output = {
            site: siteConfig,
            trips: [{
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
            }]
        };

        // Prepare trip metadata with introHtml
        const tripMetadata = output.trips[0];
        tripMetadata.introHtml = tripData.introHtml;

        // Get all content (articles and locations)
        const allContent = tripData.content;
        const locations = allContent.filter(item => item.type === 'location');
        const articles = allContent.filter(item => item.type === 'article');

        // Create trip directory
        const tripDir = path.join('trips', tripId);
        if (!fs.existsSync(tripDir)) {
            fs.mkdirSync(tripDir, { recursive: true });
        }

        console.log(`\n🏗️  Generating HTML files...\n`);

        // Generate trip intro page (index.html)
        const introHtml = generateTripIntroPage(tripMetadata, allContent, output, domain);
        fs.writeFileSync(path.join(tripDir, 'index.html'), introHtml, 'utf8');
        console.log(`   ✅ Intro page → trips/${tripId}/index.html`);

        // Generate trip map page (map.html)
        const mapHtml = generateTripMapPage(tripMetadata, allContent, output, domain);
        fs.writeFileSync(path.join(tripDir, 'map.html'), mapHtml, 'utf8');
        console.log(`   ✅ Map page → trips/${tripId}/map.html`);

        // Generate location pages
        locations.forEach((location, idx) => {
            const locationSlug = slugify(location.title);
            const locationHtml = generateTripLocationPage(tripMetadata, location, allContent, idx, output, domain);
            fs.writeFileSync(path.join(tripDir, `${locationSlug}.html`), locationHtml, 'utf8');
            console.log(`   ✅ ${location.title} → trips/${tripId}/${locationSlug}.html`);
        });

        // Generate article pages
        articles.forEach((article, idx) => {
            const articleSlug = slugify(article.title);
            const articleHtml = generateTripArticlePage(tripMetadata, article, allContent, idx, output, domain);
            fs.writeFileSync(path.join(tripDir, `${articleSlug}.html`), articleHtml, 'utf8');
            console.log(`   ✅ ${article.title} (article) → trips/${tripId}/${articleSlug}.html`);
        });

        // Copy images
        const imgSrc = path.join(CONFIG.TRIPS_DIR, tripId, 'images');
        const imgDst = path.join(tripDir, 'images');
        if (fs.existsSync(imgSrc)) {
            if (!fs.existsSync(imgDst)) fs.mkdirSync(imgDst, { recursive: true });
            let count = 0;
            for (const file of fs.readdirSync(imgSrc)) {
                const src = path.join(imgSrc, file);
                if (fs.statSync(src).isFile()) {
                    fs.copyFileSync(src, path.join(imgDst, file));
                    count++;
                }
            }
            if (count > 0) console.log(`   📷 Copied ${count} image(s)`);
        }

        console.log(`\n✅ Successfully built trip: ${tripId}`);

    } catch (error) {
        console.error(`\n❌ Build failed:`, error.message);
        console.error(error.stack);
        process.exit(1);
    }
})();
