#!/usr/bin/env node

/**
 * Interactive CLI tool to add new trips
 * Run with: npm run add or node add-destination.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { slugify } = require('../lib/slug-utilities');

// Import centralized configuration paths
const CONFIG = require('../lib/config-paths');

const { INDEX_CONFIG, TRIPS_DIR, TRIP_CONFIG_FILE, TRIP_MAIN_FILE, VALID_CONTINENTS } = CONFIG;
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

    // Load existing index
    let indexConfig;
    try {
        const data = fs.readFileSync(INDEX_CONFIG, 'utf8');
        indexConfig = JSON.parse(data);
    } catch (e) {
        console.error(`❌ Error loading ${INDEX_CONFIG}:`, e.message);
        process.exit(1);
    }

    // Gather trip information
    const title = await question('Trip title (e.g., "Japan Adventure 2025"): ');
    if (!title) {
        console.log('❌ Title is required');
        rl.close();
        return;
    }

    const id = await question(`Trip ID (press enter for "${slugify(title)}"): `) || slugify(title);
    const slug = id; // Use same value for slug

    // Check for duplicate ID
    if (indexConfig.trips.includes(id)) {
        console.log(`❌ Trip with ID "${id}" already exists`);
        rl.close();
        return;
    }

    // Check if trip directory already exists
    const tripDir = CONFIG.getTripDir(id);
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

    // Get locations
    console.log('\n📍 Add locations to this trip (press enter with blank location to finish):');
    const locations = [];
    let locationNum = 1;

    while (true) {
        const locationTitle = await question(`\nLocation ${locationNum} name (or press enter to finish): `);
        if (!locationTitle) break;

        const place = await question(`  Place for geocoding (e.g., "Tokyo, Japan"): `);
        const duration = await question(`  Duration (e.g., "3 days"): `);

        const locationSlug = slugify(locationTitle);
        locations.push({
            type: 'location',
            title: locationTitle,
            place: place || locationTitle,
            duration: duration || '1 day',
            file: `${CONFIG.getTripDir(id)}/${locationSlug}.md`
        });

        locationNum++;
    }

    if (locations.length === 0) {
        console.log('❌ At least one location is required');
        rl.close();
        return;
    }

    const mapCenter = await question(`\nMap center location (press enter for "${locations[0].title}"): `) || locations[0].title;

    // Create trip config object
    const tripConfig = {
        id,
        title,
        slug,
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
        coverImage: `images/${id}.jpg`,
        thumbnail: `images/${id}.jpg`,
        mapCenter,
        content: locations,
        relatedTrips: []
    };

    // Create trip directory
    try {
        fs.mkdirSync(tripDir, { recursive: true });
        console.log(`\n✅ Created directory: ${tripDir}`);
    } catch (e) {
        console.error(`❌ Error creating directory: ${e.message}`);
        rl.close();
        return;
    }

    // Save trip.json
    try {
        const tripConfigPath = CONFIG.getTripConfigPath(id);
        fs.writeFileSync(tripConfigPath, JSON.stringify(tripConfig, null, 2), 'utf8');
        console.log(`✅ Created ${tripConfigPath}`);
    } catch (e) {
        console.error('❌ Error saving trip config:', e.message);
        rl.close();
        return;
    }

    // Create main.md (intro file)
    const mainTemplate = `# ${title}

Welcome to our ${title}!

## Trip Overview

Add your trip introduction here. Describe what made this trip special, the overall experience, and what travelers should know.

## Highlights

- **Duration**: ${beginDate} to ${endDate}
- **Locations Visited**: ${locations.length}
- **Best For**: Adventure seekers, culture enthusiasts

## Planning Your Trip

Add general planning information, tips, and recommendations here.

---

*Explore each location below to learn more about our journey.*
`;

    try {
        const mainPath = CONFIG.getTripMainPath(id);
        fs.writeFileSync(mainPath, mainTemplate, 'utf8');
        console.log(`✅ Created ${mainPath}`);
    } catch (e) {
        console.error(`❌ Error creating main.md: ${e.message}`);
    }

    // Create location markdown files
    for (const location of locations) {
        const locationSlug = slugify(location.title);
        const locationTemplate = `# ${location.title}

## Overview

Add your introduction to ${location.title} here...

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

## Photo Gallery

*Add your photos here*

---

*Last updated: ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}*
`;

        try {
            const locationPath = path.join(tripDir, `${locationSlug}.md`);
            fs.writeFileSync(locationPath, locationTemplate, 'utf8');
            console.log(`✅ Created ${locationPath}`);
        } catch (e) {
            console.error(`❌ Error creating ${locationSlug}.md: ${e.message}`);
        }
    }

    // Add to index.json
    try {
        indexConfig.trips.push(id);
        fs.writeFileSync(INDEX_CONFIG, JSON.stringify(indexConfig, null, 2), 'utf8');
        console.log(`✅ Added trip to ${INDEX_CONFIG}`);
    } catch (e) {
        console.error('❌ Error updating index:', e.message);
        rl.close();
        return;
    }

    console.log('\n📋 Next steps:');
    console.log(`  1. Add trip image to images/${id}.jpg`);
    console.log(`  2. Edit ${tripDir}/main.md with your trip introduction`);
    console.log('  3. Edit location markdown files with your travel stories');
    console.log('  4. Run "npm run build" to generate the trip pages');
    console.log('  5. Run "npm run serve" to preview your site\n');

    console.log('📁 Created files:');
    console.log(`  - ${tripDir}/trip.json`);
    console.log(`  - ${tripDir}/main.md`);
    locations.forEach(loc => {
        const locationSlug = slugify(loc.title);
        console.log(`  - ${tripDir}/${locationSlug}.md`);
    });

    rl.close();
}

addTrip().catch(err => {
    console.error('❌ Error:', err);
    rl.close();
    process.exit(1);
});
