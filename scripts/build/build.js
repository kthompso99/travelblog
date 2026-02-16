#!/usr/bin/env node

/**
 * Build script for travel blog - Trips Architecture
 * Geocodes locations and converts markdown to HTML offline
 * Run with: node build.js or npm run build
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { imageSize } = require('image-size');
const { slugify } = require('../../lib/slug-utilities');

// Load marked for markdown conversion
let marked;
try {
    marked = require('marked');
} catch (e) {
    console.error('Error: marked is not installed. Run: npm install marked');
    process.exit(1);
}

// Load HTML generators (paths relative to project root since script runs from root)
const { generateHomepage, generateTripIntroPage, generateTripLocationPage, generateTripArticlePage, generateTripMapPage, generateMapPage, generateAboutPage } = require('../../lib/generate-html');
const { generateSitemap, generateRobotsTxt } = require('../../lib/generate-sitemap');

// Import centralized configuration paths
const CONFIG = require('../../lib/config-paths');

const { SITE_CONFIG, TRIPS_DIR, OUTPUT_FILE, TRIPS_OUTPUT_DIR, CACHE_DIR, GEOCODE_CACHE_FILE } = CONFIG;

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
                    let html = marked.parse(data);

                    // Post-process: Add orientation-aware max-width to all images
                    // Portrait (vertical) images: 375px max-width
                    // Landscape (horizontal) images: 600px max-width
                    // Only add if img doesn't already have inline style
                    const markdownDir = path.dirname(filePath);
                    html = html.replace(/<img(?![^>]*style=)([^>]*)>/gi, (match, attrs) => {
                        // Extract src attribute
                        const srcMatch = attrs.match(/src="([^"]*)"/);
                        if (!srcMatch) return match; // No src, return unchanged

                        const imgSrc = srcMatch[1];
                        const imgPath = path.join(markdownDir, imgSrc);

                        let maxWidth = 600; // Default to landscape

                        // Try to get image dimensions to determine orientation
                        try {
                            if (fs.existsSync(imgPath)) {
                                const buffer = fs.readFileSync(imgPath);
                                const dimensions = imageSize(buffer);
                                // Portrait: height > width
                                if (dimensions.height > dimensions.width) {
                                    maxWidth = 375;
                                }
                            }
                        } catch (err) {
                            // If we can't read dimensions, default to landscape (600px)
                            // This handles cases where images don't exist yet or are external
                        }

                        return `<img${attrs} style="max-width: ${maxWidth}px; width: 100%; height: auto;">`;
                    });

                    // Post-process: Convert paragraph-wrapped images to figure with figcaption
                    // This makes the alt text visible as a caption below the image
                    html = html.replace(/<p>(<img[^>]+>)<\/p>/gi, (match, imgTag) => {
                        const altMatch = imgTag.match(/alt="([^"]*)"/);
                        if (altMatch && altMatch[1]) {
                            // Image has alt text - wrap in figure with figcaption
                            return `<figure>${imgTag}<figcaption>${altMatch[1]}</figcaption></figure>`;
                        }
                        // No alt text - keep as paragraph
                        return match;
                    });

                    // Post-process: Add target="_blank" to all external links
                    // Opens links in new tab and adds security attributes
                    html = html.replace(/<a(?![^>]*target=)([^>]*)>/gi, '<a$1 target="_blank" rel="noopener noreferrer">');

                    // Post-process: Convert <img> tags with video extensions to <video> tags
                    // Supports .mp4, .mov, .webm file extensions
                    html = html.replace(/<figure>(<img[^>]+src="([^"]+\.(mp4|mov|webm))"[^>]*>)<figcaption>([^<]+)<\/figcaption><\/figure>/gi, (match, imgTag, src, ext, caption) => {
                        // Video with caption (was wrapped in figure)
                        return `<figure><video controls style="max-width: 600px; width: 100%; height: auto;"><source src="${src}" type="video/${ext === 'mov' ? 'quicktime' : ext}">Your browser does not support the video tag.</video><figcaption>${caption}</figcaption></figure>`;
                    });
                    html = html.replace(/<p>(<img[^>]+src="([^"]+\.(mp4|mov|webm))"[^>]*>)<\/p>/gi, (match, imgTag, src, ext) => {
                        // Video without caption (was in paragraph)
                        return `<p><video controls style="max-width: 600px; width: 100%; height: auto;"><source src="${src}" type="video/${ext === 'mov' ? 'quicktime' : ext}">Your browser does not support the video tag.</video></p>`;
                    });
                    html = html.replace(/<img([^>]+)src="([^"]+\.(mp4|mov|webm))"([^>]*)>/gi, (match, before, src, ext, after) => {
                        // Catch any remaining video img tags (not wrapped in p or figure)
                        return `<video controls style="max-width: 600px; width: 100%; height: auto;"><source src="${src}" type="video/${ext === 'mov' ? 'quicktime' : ext}">Your browser does not support the video tag.</video>`;
                    });

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

    // Convert markdown to HTML (file path is relative to trip dir)
    if (item.file) {
        const filePath = path.join(CONFIG.getTripDir(tripId), item.file);
        try {
            console.log(`    📝 Converting markdown: ${filePath}`);

            // Read markdown content to check for gallery marker
            let markdownContent = fs.readFileSync(filePath, 'utf8');
            let galleryImages = null;
            const galleryMarker = '*Add your photos here*';
            const markerIndex = markdownContent.indexOf(galleryMarker);

            if (markerIndex !== -1) {
                console.log(`    📸 Gallery marker found in ${item.file}`);

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

                // Only convert pre-marker content to HTML (strip gallery section)
                markdownContent = beforeMarker.trim();

                // Write to temp file for convertMarkdown
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
        }
    }


    return processed;
}

// Process a single trip
async function processTrip(tripId) {
    console.log(`\n📍 Processing trip: ${tripId}`);

    const tripConfigPath = CONFIG.getTripConfigPath(tripId);

    if (!fs.existsSync(tripConfigPath)) {
        console.log(`  ⚠️  Config file not found: ${tripConfigPath}`);
        return null;
    }

    const tripConfig = JSON.parse(fs.readFileSync(tripConfigPath, 'utf8'));

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
        const processed = await processContentItem(item, tripId, order);
        processedContent.push(processed);
        console.log('');
    }

    // Extract locations for mapping
    const locations = processedContent
        .filter(item => item.type === 'location')
        .map(item => ({
            name: item.title,
            slug: slugify(item.title),
            duration: item.duration || null,
            coordinates: item.coordinates,
            thumbnail: item.thumbnail || null
        }));

    // Resolve mapCenter to coordinates
    let mapCenter = null;
    if (tripConfig.mapCenter) {
        const centerLocation = processedContent.find(item =>
            item.type === 'location' &&
            (item.title === tripConfig.mapCenter || item.place.includes(tripConfig.mapCenter))
        );

        if (centerLocation) {
            // Reuse coordinates from existing location
            mapCenter = {
                name: tripConfig.mapCenter,
                coordinates: centerLocation.coordinates
            };
        } else {
            // Geocode the mapCenter string (allows any place, not just trip locations)
            const geocoded = await geocodeLocation(tripConfig.mapCenter);
            if (geocoded) {
                mapCenter = {
                    name: tripConfig.mapCenter,
                    coordinates: geocoded
                };
            } else if (locations.length > 0) {
                // Fallback to first location only if geocoding fails
                console.warn(`   ⚠️  Could not geocode mapCenter "${tripConfig.mapCenter}", using first location`);
                mapCenter = {
                    name: locations[0].name,
                    coordinates: locations[0].coordinates
                };
            }
        }
    } else if (locations.length > 0) {
        // No mapCenter specified, use first location
        mapCenter = {
            name: locations[0].name,
            coordinates: locations[0].coordinates
        };
    }

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
 * Discover all trips by scanning the trips directory
 * Returns trip IDs sorted in reverse chronological order (newest first)
 * @returns {Array} Array of trip IDs sorted by beginDate (newest first)
 */
function discoverTrips() {
    const tripsDir = TRIPS_DIR;

    if (!fs.existsSync(tripsDir)) {
        console.warn(`⚠️  Trips directory not found: ${tripsDir}`);
        return [];
    }

    // Read all subdirectories in trips/
    const entries = fs.readdirSync(tripsDir, { withFileTypes: true });
    const tripDirs = entries.filter(entry => entry.isDirectory()).map(entry => entry.name);

    // Load each trip.json to get beginDate for sorting
    const trips = [];
    for (const tripId of tripDirs) {
        const tripConfigPath = CONFIG.getTripConfigPath(tripId);

        // Skip if trip.json doesn't exist
        if (!fs.existsSync(tripConfigPath)) {
            console.warn(`⚠️  Skipping ${tripId}: no trip.json found`);
            continue;
        }

        try {
            const tripData = fs.readFileSync(tripConfigPath, 'utf8');
            const tripConfig = JSON.parse(tripData);

            trips.push({
                slug: tripId,  // Infer slug from directory name
                beginDate: tripConfig.beginDate || '1970-01-01' // Default to old date if missing
            });
        } catch (e) {
            console.warn(`⚠️  Skipping ${tripId}: error reading trip.json - ${e.message}`);
        }
    }

    // Sort by beginDate in reverse chronological order (newest first)
    trips.sort((a, b) => {
        return new Date(b.beginDate) - new Date(a.beginDate);
    });

    return trips.map(trip => trip.slug);
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

    // Auto-discover trips by scanning directories (sorted by date, newest first)
    const discoveredTrips = discoverTrips();
    console.log(`📋 Discovered ${discoveredTrips.length} trips (sorted by date, newest first)\n`);

    // Filter trips based on published status and environment
    const tripsToProcess = await filterPublishedTrips(discoveredTrips);

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

    for (const tripId of indexConfig.trips) {
        const trip = await processTrip(tripId);
        if (trip) {
            // Save full trip content to separate file
            const tripContentFile = path.join(TRIPS_OUTPUT_DIR, `${tripId}.json`);
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

            const fileSize = fs.statSync(tripContentFile).size;
            totalContentSize += fileSize;
            console.log(`  💾 Saved ${tripContentFile} (${(fileSize / 1024).toFixed(1)}KB)`);

            // Create lightweight metadata version for index
            const tripMetadata = {
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

        // Auto-promote homepage (backup old version first)
        if (fs.existsSync('index.html')) {
            fs.copyFileSync('index.html', 'index.html.backup');
        }
        fs.renameSync('index.html.new', 'index.html');
        console.log(`   ✅ Homepage generated and promoted (${(homepageSize / 1024).toFixed(1)}KB)`);

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
        const aboutHtml = await generateAboutPage(output, domain, convertMarkdown);
        fs.writeFileSync('about/index.html', aboutHtml, 'utf8');
        const aboutSize = fs.statSync('about/index.html').size;
        htmlSizeTotal += aboutSize;
        console.log(`   ✅ About page generated (${(aboutSize / 1024).toFixed(1)}KB)`);

        // Generate trip pages
        console.log(`   📄 Generating trip pages...\n`);
        for (let i = 0; i < processedTrips.length; i++) {
            const tripMetadata = processedTrips[i];
            const tripId = tripMetadata.slug;

            // Load full trip content
            const tripContentPath = path.join(TRIPS_OUTPUT_DIR, `${tripId}.json`);
            const tripContentData = JSON.parse(fs.readFileSync(tripContentPath, 'utf8'));

            // Create trip directory
            const tripDir = path.join('trips', tripMetadata.slug);
            if (!fs.existsSync(tripDir)) {
                fs.mkdirSync(tripDir, { recursive: true });
            }

            // Get all content items (articles and locations) and extract locations for map
            const allContent = tripContentData.content;
            const locations = allContent.filter(item => item.type === 'location');

            console.log(`   [${i + 1}/${processedTrips.length}] ${tripMetadata.title}`);

            // Add introHtml to metadata for page generation
            tripMetadata.introHtml = tripContentData.introHtml;

            // Generate trip intro page (index.html)
            const introHtml = generateTripIntroPage(tripMetadata, allContent, output, domain);
            const introHtmlPath = path.join(tripDir, 'index.html');
            fs.writeFileSync(introHtmlPath, introHtml, 'utf8');
            const introSize = fs.statSync(introHtmlPath).size;
            htmlSizeTotal += introSize;
            console.log(`      ✅ Intro page → ${introHtmlPath} (${(introSize / 1024).toFixed(1)}KB)`);

            // Generate trip map page (map.html)
            const mapPageHtml = generateTripMapPage(tripMetadata, allContent, output, domain);
            const mapPageHtmlPath = path.join(tripDir, 'map.html');
            fs.writeFileSync(mapPageHtmlPath, mapPageHtml, 'utf8');
            const mapPageSize = fs.statSync(mapPageHtmlPath).size;
            htmlSizeTotal += mapPageSize;
            console.log(`      ✅ Map page → ${mapPageHtmlPath} (${(mapPageSize / 1024).toFixed(1)}KB)`);

            // Generate pages for all content items (articles and locations)
            allContent.forEach((item, itemIndex) => {
                const itemSlug = slugify(item.title);
                const itemHtmlPath = path.join(tripDir, `${itemSlug}.html`);

                let itemHtml;
                if (item.type === 'location') {
                    itemHtml = generateTripLocationPage(tripMetadata, item, allContent, itemIndex, output, domain);
                } else if (item.type === 'article') {
                    itemHtml = generateTripArticlePage(tripMetadata, item, allContent, itemIndex, output, domain);
                } else {
                    console.warn(`      ⚠️  Unknown content type "${item.type}" for ${item.title} - skipping`);
                    return;
                }

                fs.writeFileSync(itemHtmlPath, itemHtml, 'utf8');
                const itemSize = fs.statSync(itemHtmlPath).size;
                htmlSizeTotal += itemSize;
                console.log(`      ✅ ${item.title} → ${itemHtmlPath} (${(itemSize / 1024).toFixed(1)}KB)`);
            });

            // Copy trip images directory if it exists
            const tripImagesSource = path.join(TRIPS_DIR, tripId, 'images');
            const tripImagesTarget = path.join(tripDir, 'images');

            if (fs.existsSync(tripImagesSource)) {
                if (!fs.existsSync(tripImagesTarget)) {
                    fs.mkdirSync(tripImagesTarget, { recursive: true });
                }

                // Copy all files from source to target
                const imageFiles = fs.readdirSync(tripImagesSource);
                let imageCount = 0;

                imageFiles.forEach(file => {
                    const sourcePath = path.join(tripImagesSource, file);
                    const targetPath = path.join(tripImagesTarget, file);

                    // Only copy files, not directories
                    if (fs.statSync(sourcePath).isFile()) {
                        fs.copyFileSync(sourcePath, targetPath);
                        imageCount++;
                    }
                });

                if (imageCount > 0) {
                    console.log(`      📷 Copied ${imageCount} image(s) → ${tripImagesTarget}`);
                }
            }

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

// Export reusable functions for incremental builds
module.exports = {
    processTrip,
    convertMarkdown,
    geocodeLocation,
    saveGeocodeCache,
    getGeocodeCache: () => geocodeCache,
    setGeocodeCache: (cache) => { geocodeCache = cache; }
};

// Only run full build when executed directly (not when required by build-smart)
if (require.main === module) {
    build().catch(err => {
        console.error('❌ Build failed:', err);
        process.exit(1);
    });
}
