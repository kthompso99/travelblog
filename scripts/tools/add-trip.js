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
const { ensureDir } = require('../../lib/build-utilities');

// Import centralized configuration paths
const CONFIG = require('../../lib/config-paths');

const { VALID_CONTINENTS } = CONFIG;
const CONTINENTS = VALID_CONTINENTS;

async function gatherTripMetadata(ask) {
    const title = await ask('Trip title (e.g., "Japan Adventure 2025"): ');
    if (!title) throw new Error('Title is required');

    const tripId = slugify(title);
    const tripDir = CONFIG.getTripDir(tripId);
    if (fs.existsSync(tripDir)) throw new Error(`Directory "${tripDir}" already exists`);

    const country = await ask('Country: ');

    console.log('\nSelect continent:');
    CONTINENTS.forEach((c, i) => console.log(`  ${i + 1}. ${c}`));
    const continentIdx = await ask('Continent (1-7): ');
    const continent = CONTINENTS[parseInt(continentIdx) - 1];
    if (!continent) throw new Error('Invalid continent selection');

    const beginDate = await ask('Start date (YYYY-MM-DD): ');
    const endDate = await ask('End date (YYYY-MM-DD): ');
    const mapCenter = await ask(`\nMap center location (press enter for "${country}"): `) || country;

    return { title, tripId, tripDir, country, continent, beginDate, endDate, mapCenter };
}

async function gatherContentItems(ask, country) {
    console.log('\n📍 Add content to this trip (press enter with blank title to finish):');
    console.log('Content can be locations (with coordinates) or articles (like "Tips" or "Planning")');
    const content = [];
    let itemNum = 1;

    while (true) {
        const itemTitle = await ask(`\nContent ${itemNum} title (or press enter to finish): `);
        if (!itemTitle) break;

        let itemType = await ask(`  Type (location/article/a, default: location): `) || 'location';
        if (itemType === 'a') itemType = 'article';

        const itemSlug = slugify(itemTitle);
        const contentItem = {
            type: itemType,
            title: itemTitle,
            file: `${itemSlug}.md`
        };

        if (itemType === 'location') {
            const defaultPlace = `${itemTitle}, ${country}`;
            const place = await ask(`  Place for geocoding (press enter for "${defaultPlace}"): `) || defaultPlace;
            const duration = await ask(`  Duration (e.g., "3 days"): `);
            contentItem.place = place;
            contentItem.duration = duration || '1 day';
            contentItem.thumbnail = `images/${itemSlug}-01.jpg`;
        }

        content.push(contentItem);
        itemNum++;
    }

    if (content.length === 0) throw new Error('At least one content item is required');
    return content;
}

function buildTripConfig(metadata, content) {
    return {
        title: metadata.title,
        published: false,
        beginDate: metadata.beginDate,
        endDate: metadata.endDate,
        metadata: {
            year: new Date(metadata.beginDate).getFullYear(),
            continent: metadata.continent,
            country: metadata.country,
            tripType: ['adventure'],
            tags: [metadata.continent.toLowerCase(), metadata.country.toLowerCase()]
        },
        coverImage: `images/${metadata.tripId}.jpg`,
        thumbnail: `images/${metadata.tripId}.jpg`,
        mapCenter: metadata.mapCenter,
        content: content,
        relatedTrips: []
    };
}

function createTripFiles(tripDir, tripConfig, content, metadata) {
    ensureDir(tripDir);
    console.log(`\n✅ Created directory: ${tripDir}`);

    ensureDir(path.join(tripDir, 'images'));
    console.log(`✅ Created directory: ${path.join(tripDir, 'images')}`);

    // Save trip.json
    const tripConfigPath = CONFIG.getTripConfigPath(metadata.tripId);
    fs.writeFileSync(tripConfigPath, JSON.stringify(tripConfig, null, 2), 'utf8');
    console.log(`✅ Created ${tripConfigPath}`);

    // Create main.md
    const locationCount = content.filter(item => item.type === 'location').length;
    const mainTemplate = `# ${metadata.title}

Welcome to our ${metadata.title}!

## Trip Overview

Add your trip introduction here. Describe what made this trip special, the overall experience, and what travelers should know.

## Highlights

- **Duration**: ${metadata.beginDate} to ${metadata.endDate}
- **Locations Visited**: ${locationCount}
- **Best For**: Adventure seekers, culture enthusiasts

## Planning Your Trip

Add general planning information, tips, and recommendations here.

---

*Explore each location below to learn more about our journey.*
`;

    const mainPath = CONFIG.getTripMainPath(metadata.tripId);
    fs.writeFileSync(mainPath, mainTemplate, 'utf8');
    console.log(`✅ Created ${mainPath}`);

    // Create content markdown files
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    for (const item of content) {
        const itemSlug = slugify(item.title);
        let template;

        if (item.type === 'article') {
            template = `Add your ${item.title.toLowerCase()} content here...

## Section 1

Content goes here...

## Section 2

More content...

---

*Last updated: ${dateStr}*
`;
        } else {
            template = `## Overview

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

*Last updated: ${dateStr}*
`;
        }

        const filePath = path.join(tripDir, `${itemSlug}.md`);
        fs.writeFileSync(filePath, template, 'utf8');
        console.log(`✅ Created ${filePath}`);
    }
}

function printSummary(tripId, tripDir, content) {
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
        console.log(`  - ${tripDir}/${slugify(item.title)}.md`);
    });
}

async function addTrip() {
    console.log('🌍 Add New Trip\n');

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ask = (prompt) => new Promise(resolve => rl.question(prompt, resolve));

    try {
        const metadata = await gatherTripMetadata(ask);
        const content = await gatherContentItems(ask, metadata.country);
        const tripConfig = buildTripConfig(metadata, content);
        createTripFiles(metadata.tripDir, tripConfig, content, metadata);
        printSummary(metadata.tripId, metadata.tripDir, content);
    } catch (e) {
        console.log(`❌ ${e.message}`);
    } finally {
        rl.close();
    }
}

addTrip().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
