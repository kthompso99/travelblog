#!/usr/bin/env node

/**
 * Build script for travel blog - Trips Architecture
 * Geocodes locations and converts markdown to HTML offline
 * Run with: node build.js or npm run build
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load marked for markdown conversion
let marked;
try {
    marked = require('marked');
} catch (e) {
    console.error('Error: marked is not installed. Run: npm install marked');
    process.exit(1);
}

// Load HTML generators
const { generateHomepage, generateTripPage, generateTripIntroPage, generateTripLocationPage, generateMapPage, generateAboutPage } = require('./lib/generate-html');
const { generateSitemap, generateRobotsTxt } = require('./lib/generate-sitemap');

const SITE_CONFIG = 'config/site.json';
const INDEX_CONFIG = 'config/index.json';
const TRIPS_DIR = 'config/trips';
const OUTPUT_FILE = 'config.built.json';
const TRIPS_OUTPUT_DIR = 'trips';
const CACHE_DIR = '_cache';
const GEOCODE_CACHE_FILE = '_cache/geocode.json';

// Load geocode cache
let geocodeCache = {};
if (fs.existsSync(GEOCODE_CACHE_FILE)) {
    try {
        geocodeCache = JSON.parse(fs.readFileSync(GEOCODE_CACHE_FILE, 'utf8'));
        console.log(`✅ Loaded geocode cache with ${Object.keys(geocodeCache).length} entries\n`);
    } catch (e) {
        console.log('⚠️  Could not load geocode cache, starting fresh\n');
    }
}

// Save geocode cache
function saveGeocodeCache() {
    if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    fs.writeFileSync(GEOCODE_CACHE_FILE, JSON.stringify(geocodeCache, null, 2), 'utf8');
}

// Geocode a location using Nominatim (with caching)
function geocodeLocation(locationName) {
    // Check cache first
    if (geocodeCache[locationName]) {
        console.log(`    💾 Using cached coordinates for: ${locationName}`);
        return Promise.resolve(geocodeCache[locationName]);
    }
    return new Promise((resolve, reject) => {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`;

        https.get(url, {
            headers: {
                'User-Agent': 'TravelBlogBuilder/2.0'
            }
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json && json.length > 0) {
                        const coords = {
                            lat: parseFloat(json[0].lat),
                            lng: parseFloat(json[0].lon)
                        };
                        // Cache the result
                        geocodeCache[locationName] = coords;
                        saveGeocodeCache();
                        resolve(coords);
                    } else {
                        reject(new Error('No results found'));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

// Read and convert markdown file to HTML
function convertMarkdown(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                try {
                    const html = marked.parse(data);
                    resolve(html);
                } catch (e) {
                    reject(e);
                }
            }
        });
    });
}

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
async function processContentItem(item, tripId, order) {
    const processed = {
        type: item.type,
        title: item.title,
        order: order
    };

    // Convert markdown to HTML
    if (item.file) {
        try {
            console.log(`    📝 Converting markdown: ${item.file}`);
            processed.contentHtml = await convertMarkdown(item.file);
            console.log(`    ✅ HTML generated (${processed.contentHtml.length} chars)`);
        } catch (e) {
            console.log(`    ⚠️  Markdown conversion failed: ${e.message}`);
            processed.contentHtml = `<p>Content not found</p>`;
        }
    }

    // If it's a location, geocode it
    if (item.type === 'location') {
        processed.place = item.place;
        processed.duration = item.duration;

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
        }
    }

    return processed;
}

// Process a single trip
async function processTrip(tripId) {
    console.log(`\n📍 Processing trip: ${tripId}`);

    const tripConfigPath = path.join(TRIPS_DIR, `${tripId}.json`);

    if (!fs.existsSync(tripConfigPath)) {
        console.log(`  ⚠️  Config file not found: ${tripConfigPath}`);
        return null;
    }

    const tripConfig = JSON.parse(fs.readFileSync(tripConfigPath, 'utf8'));

    // Validate main.md exists
    const mainMdPath = path.join('content/trips', tripId, 'main.md');
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
        const processed = await processContentItem(item, tripId, order);
        processedContent.push(processed);
        console.log('');
    }

    // Extract locations for mapping
    const locations = processedContent
        .filter(item => item.type === 'location')
        .map(item => ({
            name: item.title,
            coordinates: item.coordinates
        }));

    // Resolve mapCenter to coordinates
    let mapCenter = null;
    if (tripConfig.mapCenter) {
        const centerLocation = processedContent.find(item =>
            item.type === 'location' &&
            (item.title === tripConfig.mapCenter || item.place.includes(tripConfig.mapCenter))
        );

        if (centerLocation) {
            mapCenter = {
                name: tripConfig.mapCenter,
                coordinates: centerLocation.coordinates
            };
        } else if (locations.length > 0) {
            // Fallback to first location
            mapCenter = {
                name: locations[0].name,
                coordinates: locations[0].coordinates
            };
        }
    } else if (locations.length > 0) {
        mapCenter = {
            name: locations[0].name,
            coordinates: locations[0].coordinates
        };
    }

    // Build final trip object
    return {
        id: tripConfig.id,
        title: tripConfig.title,
        slug: tripConfig.slug,
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

// Main build function
async function build() {
    console.log('🚀 Starting build process (Trips Architecture)...\n');

    // Read site config
    let siteConfig;
    try {
        siteConfig = JSON.parse(fs.readFileSync(SITE_CONFIG, 'utf8'));
        console.log(`✅ Loaded site config: ${siteConfig.title}\n`);
    } catch (e) {
        console.error(`❌ Error reading ${SITE_CONFIG}:`, e.message);
        process.exit(1);
    }

    // Read index config (list of trips)
    let indexConfig;
    try {
        indexConfig = JSON.parse(fs.readFileSync(INDEX_CONFIG, 'utf8'));
        console.log(`📋 Found ${indexConfig.trips.length} trips to process\n`);
    } catch (e) {
        console.error(`❌ Error reading ${INDEX_CONFIG}:`, e.message);
        process.exit(1);
    }

    // Create trips output directory
    if (!fs.existsSync(TRIPS_OUTPUT_DIR)) {
        fs.mkdirSync(TRIPS_OUTPUT_DIR, { recursive: true });
    }

    // Process each trip
    const processedTrips = [];
    let totalContentSize = 0;

    for (const tripId of indexConfig.trips) {
        const trip = await processTrip(tripId);
        if (trip) {
            // Save full trip content to separate file
            const tripContentFile = path.join(TRIPS_OUTPUT_DIR, `${tripId}.json`);
            const tripContent = {
                id: trip.id,
                introHtml: trip.introHtml,
                content: trip.content
            };

            fs.writeFileSync(
                tripContentFile,
                JSON.stringify(tripContent, null, 2),
                'utf8'
            );

            const fileSize = fs.statSync(tripContentFile).size;
            totalContentSize += fileSize;
            console.log(`  💾 Saved ${tripContentFile} (${(fileSize / 1024).toFixed(1)}KB)`);

            // Create lightweight metadata version for index
            const tripMetadata = {
                id: trip.id,
                title: trip.title,
                slug: trip.slug,
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
                // NO content array here - that's in the separate file!
            };

            processedTrips.push(tripMetadata);
        }
    }

    // Build lightweight index file
    const output = {
        site: siteConfig,
        trips: processedTrips
    };

    // Write built config
    try {
        fs.writeFileSync(
            OUTPUT_FILE,
            JSON.stringify(output, null, 2),
            'utf8'
        );

        const indexSize = fs.statSync(OUTPUT_FILE).size;

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

    // Generate static HTML pages (SSG)
    console.log(`\n🏗️  Generating static HTML pages...\n`);

    const domain = siteConfig.domain || 'https://example.com';
    let htmlSizeTotal = 0;

    try {
        // Generate homepage
        console.log(`   📄 Generating homepage...`);
        const homepageHtml = generateHomepage(output, domain);
        fs.writeFileSync('index.html.new', homepageHtml, 'utf8');
        const homepageSize = fs.statSync('index.html.new').size;
        htmlSizeTotal += homepageSize;
        console.log(`   ✅ Homepage generated (${(homepageSize / 1024).toFixed(1)}KB)`);

        // Generate map page
        console.log(`   📄 Generating map page...`);
        if (!fs.existsSync('map')) {
            fs.mkdirSync('map', { recursive: true });
        }
        const mapHtml = generateMapPage(output, domain);
        fs.writeFileSync('map/index.html', mapHtml, 'utf8');
        const mapSize = fs.statSync('map/index.html').size;
        htmlSizeTotal += mapSize;
        console.log(`   ✅ Map page generated (${(mapSize / 1024).toFixed(1)}KB)`);

        // Generate about page
        console.log(`   📄 Generating about page...`);
        if (!fs.existsSync('about')) {
            fs.mkdirSync('about', { recursive: true });
        }
        const aboutHtml = generateAboutPage(output, domain);
        fs.writeFileSync('about/index.html', aboutHtml, 'utf8');
        const aboutSize = fs.statSync('about/index.html').size;
        htmlSizeTotal += aboutSize;
        console.log(`   ✅ About page generated (${(aboutSize / 1024).toFixed(1)}KB)`);

        // Generate trip pages
        console.log(`   📄 Generating trip pages...\n`);
        for (let i = 0; i < processedTrips.length; i++) {
            const tripMetadata = processedTrips[i];
            const tripId = tripMetadata.id;

            // Load full trip content
            const tripContentPath = path.join(TRIPS_OUTPUT_DIR, `${tripId}.json`);
            const tripContentData = JSON.parse(fs.readFileSync(tripContentPath, 'utf8'));

            // Create trip directory
            const tripDir = path.join('trips', tripMetadata.slug);
            if (!fs.existsSync(tripDir)) {
                fs.mkdirSync(tripDir, { recursive: true });
            }

            // Get locations for this trip
            const locations = tripContentData.content.filter(item => item.type === 'location');

            console.log(`   [${i + 1}/${processedTrips.length}] ${tripMetadata.title}`);

            // Add introHtml to metadata for page generation
            tripMetadata.introHtml = tripContentData.introHtml;

            // Generate trip intro page (index.html)
            const introHtml = generateTripIntroPage(tripMetadata, locations, output, domain);
            const introHtmlPath = path.join(tripDir, 'index.html');
            fs.writeFileSync(introHtmlPath, introHtml, 'utf8');
            const introSize = fs.statSync(introHtmlPath).size;
            htmlSizeTotal += introSize;
            console.log(`      ✅ Intro page → ${introHtmlPath} (${(introSize / 1024).toFixed(1)}KB)`);

            // Generate individual location pages
            locations.forEach((location, locationIndex) => {
                const locationSlug = location.title.toLowerCase().replace(/\s+/g, '-');
                const locationHtml = generateTripLocationPage(tripMetadata, location, locations, locationIndex, output, domain);
                const locationHtmlPath = path.join(tripDir, `${locationSlug}.html`);
                fs.writeFileSync(locationHtmlPath, locationHtml, 'utf8');
                const locationSize = fs.statSync(locationHtmlPath).size;
                htmlSizeTotal += locationSize;
                console.log(`      ✅ ${location.title} → ${locationHtmlPath} (${(locationSize / 1024).toFixed(1)}KB)`);
            });

            console.log('');
        }

        // Generate sitemap.xml
        console.log(`\n   📄 Generating sitemap.xml...`);
        const sitemapXml = generateSitemap(processedTrips, domain);
        fs.writeFileSync('sitemap.xml', sitemapXml, 'utf8');
        const sitemapSize = fs.statSync('sitemap.xml').size;
        console.log(`   ✅ Sitemap generated (${(sitemapSize / 1024).toFixed(1)}KB)`);

        // Generate robots.txt
        console.log(`   📄 Generating robots.txt...`);
        const robotsTxt = generateRobotsTxt(domain);
        fs.writeFileSync('robots.txt', robotsTxt, 'utf8');
        const robotsSize = fs.statSync('robots.txt').size;
        console.log(`   ✅ Robots.txt generated (${(robotsSize / 1024).toFixed(0)} bytes)`);

        console.log(`\n✅ SSG complete!`);
        console.log(`\n💾 Static HTML sizes:`);
        console.log(`   - Total HTML files: ${(htmlSizeTotal / 1024).toFixed(1)}KB`);
        console.log(`   - Average trip page: ${(htmlSizeTotal / (processedTrips.length + 3) / 1024).toFixed(1)}KB`);

        console.log(`\n⚠️  IMPORTANT: New homepage saved as index.html.new`);
        console.log(`   Review it, then rename to index.html when ready:`);
        console.log(`   $ mv index.html index.html.backup`);
        console.log(`   $ mv index.html.new index.html`);

        console.log(`\n🎯 Next steps:`);
        console.log(`   1. Review generated HTML files`);
        console.log(`   2. Update domain in config/site.json`);
        console.log(`   3. Test locally with: npm run serve`);
        console.log(`   4. Validate SEO with online tools`);
        console.log(`   5. Deploy your site!`);
    } catch (e) {
        console.error('❌ Error generating HTML:', e.message);
        console.error(e.stack);
        process.exit(1);
    }
}

// Run build
build().catch(err => {
    console.error('❌ Build failed:', err);
    process.exit(1);
});
