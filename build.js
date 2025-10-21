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

const SITE_CONFIG = 'config/site.json';
const INDEX_CONFIG = 'config/index.json';
const TRIPS_DIR = 'config/trips';
const OUTPUT_FILE = 'config.built.json';

// Geocode a location using Nominatim
function geocodeLocation(locationName) {
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
                        resolve({
                            lat: parseFloat(json[0].lat),
                            lng: parseFloat(json[0].lon)
                        });
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

    // Calculate duration
    const duration = calculateDuration(tripConfig.beginDate, tripConfig.endDate);
    console.log(`  ⏱️  Duration: ${duration}`);

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

    // Process each trip
    const processedTrips = [];
    for (const tripId of indexConfig.trips) {
        const trip = await processTrip(tripId);
        if (trip) {
            processedTrips.push(trip);
        }
    }

    // Build final output
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
        console.log(`\n✅ Build complete! Output written to ${OUTPUT_FILE}`);
        console.log(`\n📊 Summary:`);
        console.log(`   - Trips processed: ${processedTrips.length}`);
        console.log(`   - Total locations: ${processedTrips.reduce((sum, t) => sum + t.locations.length, 0)}`);
        console.log(`   - Total content items: ${processedTrips.reduce((sum, t) => sum + t.content.length, 0)}`);
        console.log(`\n🎯 Next steps:`);
        console.log(`   1. Update index.html to use '${OUTPUT_FILE}'`);
        console.log(`   2. Test locally with: npm run serve`);
        console.log(`   3. Deploy your site!`);
    } catch (e) {
        console.error('❌ Error writing output file:', e.message);
        process.exit(1);
    }
}

// Run build
build().catch(err => {
    console.error('❌ Build failed:', err);
    process.exit(1);
});
