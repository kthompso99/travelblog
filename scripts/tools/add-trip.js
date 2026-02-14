#!/usr/bin/env node

/**
 * Interactive CLI tool to scaffold new trips
 *
 * Run with: npm run add
 *
 * WHAT THIS SCRIPT DOES:
 *
 * Example: Adding a trip to Spain with locations Seville, Granada, Cordoba
 *
 * 1. Creates directory: content/trips/spain/
 *
 * 2. Creates trip configuration: content/trips/spain/trip.json
 *    - Contains trip metadata (title, dates, continent, country)
 *    - Lists all content items (locations and articles)
 *    - Each location has: type, title, place (for geocoding), duration, file
 *
 * 3. Creates intro file: content/trips/spain/main.md
 *    - Template markdown for the trip overview page
 *
 * 4. Creates content files for each location/article:
 *    - content/trips/spain/seville.md (template with sections)
 *    - content/trips/spain/granada.md (template with sections)
 *    - content/trips/spain/cordoba.md (template with sections)
 *
 * 5. Creates images directory: content/trips/spain/images/
 *    - Ready for you to add trip photos
 *
 * NOTE: Trips are auto-discovered by scanning content/trips/ - no manual
 * index.json needed. The build system automatically finds all trips.
 *
 * WHAT THIS SCRIPT DOES NOT DO:
 *
 * - Does NOT create the trip cover image (add images/spain.jpg manually to root images/)
 * - Does NOT run the build (run 'npm run build' after adding content)
 *
 * CONTENT TYPES:
 *
 * - "location" = places with coordinates (geocoded, appears on map)
 *   Requires: place (for geocoding), duration
 *   Example: Seville, Granada, Cordoba
 *
 * - "article" = text-only content (no map marker)
 *   Does NOT require: place or duration
 *   Example: "Tips", "Planning Guide", "Packing List"
 *
 * AFTER RUNNING THIS SCRIPT:
 *
 * 1. Add trip cover image to root images/ directory: images/spain.jpg
 * 2. Edit content/trips/spain/main.md with trip introduction
 * 3. Edit location markdown files with your travel stories
 * 4. Add trip photos to content/trips/spain/images/
 * 5. Optionally add thumbnail field to locations in trip.json
 * 6. Run 'npm run build' to generate HTML pages
 * 7. Run 'npm run serve' to preview locally
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { slugify } = require('../../lib/slug-utilities');

// Import centralized configuration paths
const CONFIG = require('../../lib/config-paths');

const { TRIPS_DIR, TRIP_CONFIG_FILE, TRIP_MAIN_FILE, VALID_CONTINENTS } = CONFIG;
const CONTINENTS = VALID_CONTINENTS;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function addTrip() {
    console.log('🌍 Add New Trip\n');

    // Gather trip information
    const title = await question('Trip title (e.g., "Japan Adventure 2025"): ');
    if (!title) {
        console.log('❌ Title is required');
        rl.close();
        return;
    }

    // Infer trip ID from slugified title (slug will be derived from directory name)
    const tripId = slugify(title);

    // Check if trip directory already exists
    const tripDir = CONFIG.getTripDir(tripId);
    if (fs.existsSync(tripDir)) {
        console.log(`❌ Directory "${tripDir}" already exists`);
        rl.close();
        return;
    }

    const country = await question('Country: ');

    console.log('\nSelect continent:');
    CONTINENTS.forEach((c, i) => console.log(`  ${i + 1}. ${c}`));
    const continentIdx = await question('Continent (1-7): ');
    const continent = CONTINENTS[parseInt(continentIdx) - 1];

    if (!continent) {
        console.log('❌ Invalid continent selection');
        rl.close();
        return;
    }

    const beginDate = await question('Start date (YYYY-MM-DD): ');
    const endDate = await question('End date (YYYY-MM-DD): ');

    // Get content items (locations and articles)
    console.log('\n📍 Add content to this trip (press enter with blank title to finish):');
    console.log('Content can be locations (with coordinates) or articles (like "Tips" or "Planning")');
    const content = [];
    let itemNum = 1;

    while (true) {
        const itemTitle = await question(`\nContent ${itemNum} title (or press enter to finish): `);
        if (!itemTitle) break;

        const itemType = await question(`  Type (location/article, default: location): `) || 'location';

        const itemSlug = slugify(itemTitle);
        const contentItem = {
            type: itemType,
            title: itemTitle,
            file: `${itemSlug}.md`
        };

        if (itemType === 'location') {
            const place = await question(`  Place for geocoding (e.g., "Tokyo, Japan"): `);
            const duration = await question(`  Duration (e.g., "3 days"): `);
            contentItem.place = place || itemTitle;
            contentItem.duration = duration || '1 day';
            contentItem.thumbnail = `images/${itemSlug}-01.jpg`;
        }

        content.push(contentItem);
        itemNum++;
    }

    if (content.length === 0) {
        console.log('❌ At least one content item is required');
        rl.close();
        return;
    }

    // Find first location for map center default (skip articles)
    const firstLocation = content.find(item => item.type === 'location');
    const defaultMapCenter = firstLocation ? firstLocation.title : content[0].title;
    const mapCenter = await question(`\nMap center location (press enter for "${defaultMapCenter}"): `) || defaultMapCenter;

    // Create trip config object
    const tripConfig = {
        title,
        published: true,
        beginDate,
        endDate,
        metadata: {
            year: new Date(beginDate).getFullYear(),
            continent,
            country,
            tripType: ['adventure'],
            tags: [continent.toLowerCase(), country.toLowerCase()]
        },
        coverImage: `images/${tripId}.jpg`,
        thumbnail: `images/${tripId}.jpg`,
        mapCenter,
        content: content,
        relatedTrips: []
    };

    // Create trip directory and images subdirectory
    try {
        fs.mkdirSync(tripDir, { recursive: true });
        console.log(`\n✅ Created directory: ${tripDir}`);

        const imagesDir = path.join(tripDir, 'images');
        fs.mkdirSync(imagesDir, { recursive: true });
        console.log(`✅ Created directory: ${imagesDir}`);
    } catch (e) {
        console.error(`❌ Error creating directory: ${e.message}`);
        rl.close();
        return;
    }

    // Save trip.json
    try {
        const tripConfigPath = CONFIG.getTripConfigPath(tripId);
        fs.writeFileSync(tripConfigPath, JSON.stringify(tripConfig, null, 2), 'utf8');
        console.log(`✅ Created ${tripConfigPath}`);
    } catch (e) {
        console.error('❌ Error saving trip config:', e.message);
        rl.close();
        return;
    }

    // Create main.md (intro file)
    const locationCount = content.filter(item => item.type === 'location').length;
    const mainTemplate = `# ${title}

Welcome to our ${title}!

## Trip Overview

Add your trip introduction here. Describe what made this trip special, the overall experience, and what travelers should know.

## Highlights

- **Duration**: ${beginDate} to ${endDate}
- **Locations Visited**: ${locationCount}
- **Best For**: Adventure seekers, culture enthusiasts

## Planning Your Trip

Add general planning information, tips, and recommendations here.

---

*Explore each location below to learn more about our journey.*
`;

    try {
        const mainPath = CONFIG.getTripMainPath(tripId);
        fs.writeFileSync(mainPath, mainTemplate, 'utf8');
        console.log(`✅ Created ${mainPath}`);
    } catch (e) {
        console.error(`❌ Error creating main.md: ${e.message}`);
    }

    // Create content markdown files
    for (const item of content) {
        const itemSlug = slugify(item.title);
        let template;

        if (item.type === 'article') {
            // Template for articles (tips, planning, etc.)
            template = `# ${item.title}

Add your ${item.title.toLowerCase()} content here...

## Section 1

Content goes here...

## Section 2

More content...

---

*Last updated: ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}*
`;
        } else {
            // Template for locations
            template = `# ${item.title}

## Overview

Add your introduction to ${item.title} here...

## What We Did

Describe your activities and experiences...

## Where We Stayed

Share accommodation recommendations...

## Food & Dining

Recommend restaurants and local cuisine...

## Practical Tips

- Getting there
- Getting around
- What to bring
- Best time to visit

*Add your photos here*

---

*Last updated: ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}*
`;
        }

        try {
            const filePath = path.join(tripDir, `${itemSlug}.md`);
            fs.writeFileSync(filePath, template, 'utf8');
            console.log(`✅ Created ${filePath}`);
        } catch (e) {
            console.error(`❌ Error creating ${itemSlug}.md: ${e.message}`);
        }
    }

    console.log('\n📋 Next steps:');
    console.log(`  1. Add trip image to images/${tripId}.jpg`);
    console.log(`  2. Edit ${tripDir}/main.md with your trip introduction`);
    console.log('  3. Edit content markdown files with your travel stories');
    console.log('  4. Optionally add thumbnail images for each location');
    console.log('  5. Run "npm run build" to generate the trip pages');
    console.log('  6. Run "npm run serve" to preview your site\n');

    console.log('📁 Created files:');
    console.log(`  - ${tripDir}/trip.json`);
    console.log(`  - ${tripDir}/main.md`);
    content.forEach(item => {
        const itemSlug = slugify(item.title);
        console.log(`  - ${tripDir}/${itemSlug}.md`);
    });

    rl.close();
}

addTrip().catch(err => {
    console.error('❌ Error:', err);
    rl.close();
    process.exit(1);
});
