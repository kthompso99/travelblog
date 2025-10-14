#!/usr/bin/env node

/**
 * Interactive CLI tool to add new destinations
 * Run with: node add-destination.js
 */

const fs = require('fs');
const readline = require('readline');

const CONFIG_FILE = 'config.json';
const CONTINENTS = [
    'Africa',
    'Antarctica', 
    'Asia',
    'Europe',
    'North America',
    'South America',
    'Oceania'
];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

async function addDestination() {
    console.log('🌍 Add New Destination\n');

    // Load existing config
    let config;
    try {
        const data = fs.readFileSync(CONFIG_FILE, 'utf8');
        config = JSON.parse(data);
    } catch (e) {
        console.error('❌ Error loading config.json:', e.message);
        process.exit(1);
    }

    // Gather information
    const name = await question('Destination name (e.g., "Paris, France"): ');
    if (!name) {
        console.log('❌ Name is required');
        rl.close();
        return;
    }

    const id = await question(`ID (press enter for "${slugify(name)}"): `) || slugify(name);
    
    // Check for duplicate ID
    if (config.destinations.find(d => d.id === id)) {
        console.log(`❌ Destination with ID "${id}" already exists`);
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

    const location = await question('Famous landmark/location (for geocoding, e.g., "Eiffel Tower"): ');

    const contentFile = await question(`Content file (press enter for "content/${id}.md"): `) || `content/${id}.md`;

    const thumbnail = await question('Thumbnail image path (optional, press enter to skip): ');

    // Create destination object
    const destination = {
        id,
        name,
        continent,
        country,
        location,
        contentFile
    };

    if (thumbnail) {
        destination.thumbnail = thumbnail;
    }

    // Add to config
    config.destinations.push(destination);

    // Save config
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
        console.log('\n✅ Destination added to config.json!');
    } catch (e) {
        console.error('❌ Error saving config:', e.message);
        rl.close();
        return;
    }

    // Create content file template
    const createContent = await question('\nCreate content file template? (y/n): ');
    if (createContent.toLowerCase() === 'y') {
        const template = `# ${name}

Welcome to ${name}!

## Overview

Add your introduction here...

## Best Time to Visit

Describe the ideal seasons and weather conditions...

## Must-See Attractions

### Attraction 1
Description...

### Attraction 2
Description...

## Food & Dining

Share your favorite restaurants and local cuisine...

## Practical Tips

- Transportation advice
- Where to stay
- Language tips
- Currency and costs

## Hidden Gems

Share lesser-known spots that tourists might miss...

---

*Last updated: ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}*
`;

        try {
            // Create content directory if it doesn't exist
            const dir = contentFile.substring(0, contentFile.lastIndexOf('/'));
            if (dir && !fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(contentFile, template, 'utf8');
            console.log(`✅ Created ${contentFile}`);
        } catch (e) {
            console.error(`❌ Error creating content file: ${e.message}`);
        }
    }

    console.log('\n📋 Next steps:');
    console.log('  1. Edit the content file with your travel information');
    console.log('  2. Run "npm run build" to process the new destination');
    console.log('  3. Refresh your browser to see the changes\n');

    rl.close();
}

addDestination().catch(err => {
    console.error('❌ Error:', err);
    rl.close();
    process.exit(1);
});