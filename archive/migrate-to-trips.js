#!/usr/bin/env node

/**
 * Migration Script: Destinations → Trips
 *
 * Converts the old flat destinations structure to the new nested trips architecture
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Starting migration: Destinations → Trips\n');

// Read old config
const oldConfig = JSON.parse(fs.readFileSync('config.json', 'utf8'));

// Create config/site.json
const siteConfig = {
    title: oldConfig.site.title,
    description: oldConfig.site.description
};

fs.writeFileSync('config/site.json', JSON.stringify(siteConfig, null, 2));
console.log('✅ Created config/site.json');

// Create trip configs from destinations
const tripIds = [];

oldConfig.destinations.forEach((dest, index) => {
    const tripId = dest.id;
    tripIds.push(tripId);

    // Generate placeholder dates (2024 + index months apart)
    const monthOffset = index * 3;
    const beginDate = new Date(2024, monthOffset, 1);
    const endDate = new Date(2024, monthOffset, 14);

    const tripConfig = {
        id: tripId,
        title: dest.name,
        slug: tripId,
        published: true,

        beginDate: beginDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],

        metadata: {
            year: 2024,
            continent: dest.continent,
            country: dest.country,
            tripType: ["adventure"],
            tags: [dest.continent.toLowerCase(), dest.country.toLowerCase().replace(/\s+/g, '-')]
        },

        coverImage: dest.thumbnail,
        thumbnail: dest.thumbnail,

        // Use the location as map center
        mapCenter: dest.location,

        // Convert single destination to single location content item
        content: [
            {
                type: "location",
                title: dest.name,
                place: dest.location,
                duration: "14 days",
                file: dest.contentFile
            }
        ],

        relatedTrips: []
    };

    const tripPath = `config/trips/${tripId}.json`;
    fs.writeFileSync(tripPath, JSON.stringify(tripConfig, null, 2));
    console.log(`✅ Created ${tripPath}`);

    // Move content to new structure (if it exists in flat location)
    const oldContentPath = dest.contentFile;
    const newContentDir = `content/trips/${tripId}`;
    const newContentPath = `${newContentDir}/${path.basename(oldContentPath)}`;

    if (fs.existsSync(oldContentPath)) {
        if (!fs.existsSync(newContentDir)) {
            fs.mkdirSync(newContentDir, { recursive: true });
        }
        fs.copyFileSync(oldContentPath, newContentPath);
        console.log(`   📄 Copied ${oldContentPath} → ${newContentPath}`);

        // Update the file reference in trip config
        tripConfig.content[0].file = newContentPath;
        fs.writeFileSync(tripPath, JSON.stringify(tripConfig, null, 2));
    }
});

// Create config/index.json
const indexConfig = {
    trips: tripIds
};

fs.writeFileSync('config/index.json', JSON.stringify(indexConfig, null, 2));
console.log('✅ Created config/index.json');

console.log('\n✨ Migration complete!');
console.log('\nNew structure:');
console.log('  config/site.json');
console.log('  config/index.json');
tripIds.forEach(id => {
    console.log(`  config/trips/${id}.json`);
    console.log(`  content/trips/${id}/`);
});

console.log('\n📝 Next steps:');
console.log('  1. Review the generated config files');
console.log('  2. Run: npm run build (with updated build.js)');
console.log('  3. Test the new structure');
console.log('  4. Old files (config.json, content/*.md) can be archived');
