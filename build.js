#!/usr/bin/env node

/**
 * Build script for travel blog
 * Geocodes locations and converts markdown to HTML offline
 * Run with: node build.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// You'll need to install marked: npm install marked
let marked;
try {
    marked = require('marked');
} catch (e) {
    console.error('Error: marked is not installed. Run: npm install marked');
    process.exit(1);
}

const CONFIG_FILE = 'config.json';
const OUTPUT_FILE = 'config.built.json';

// Geocode a location using Nominatim
function geocodeLocation(locationName) {
    return new Promise((resolve, reject) => {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`;
        
        https.get(url, {
            headers: {
                'User-Agent': 'TravelBlogBuilder/1.0'
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

// Main build function
async function build() {
    console.log('🚀 Starting build process...\n');

    // Read config file
    let config;
    try {
        const configData = fs.readFileSync(CONFIG_FILE, 'utf8');
        config = JSON.parse(configData);
    } catch (e) {
        console.error('❌ Error reading config.json:', e.message);
        process.exit(1);
    }

    console.log(`📍 Processing ${config.destinations.length} destinations...\n`);

    // Process each destination
    for (let i = 0; i < config.destinations.length; i++) {
        const dest = config.destinations[i];
        console.log(`[${i + 1}/${config.destinations.length}] Processing ${dest.name}...`);

        // Geocode if needed
        if (!dest.coordinates) {
            const locationName = dest.location || dest.name;
            try {
                console.log(`  🗺️  Geocoding: ${locationName}`);
                dest.coordinates = await geocodeLocation(locationName);
                console.log(`  ✅ Coordinates: ${dest.coordinates.lat}, ${dest.coordinates.lng}`);
                
                // Respect rate limits (1 request per second)
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (e) {
                console.log(`  ⚠️  Geocoding failed: ${e.message}`);
                dest.coordinates = { lat: 0, lng: 0 };
            }
        } else {
            console.log(`  ✅ Using provided coordinates`);
        }

        // Convert markdown to HTML
        if (dest.contentFile) {
            try {
                console.log(`  📝 Converting markdown: ${dest.contentFile}`);
                dest.contentHtml = await convertMarkdown(dest.contentFile);
                console.log(`  ✅ HTML generated (${dest.contentHtml.length} chars)`);
            } catch (e) {
                console.log(`  ⚠️  Markdown conversion failed: ${e.message}`);
                dest.contentHtml = `<p>Content not found</p>`;
            }
        }

        console.log('');
    }

    // Write built config
    try {
        fs.writeFileSync(
            OUTPUT_FILE,
            JSON.stringify(config, null, 2),
            'utf8'
        );
        console.log(`✅ Build complete! Output written to ${OUTPUT_FILE}`);
        console.log(`\n📊 Summary:`);
        console.log(`   - Geocoded: ${config.destinations.filter(d => d.coordinates).length} locations`);
        console.log(`   - Converted: ${config.destinations.filter(d => d.contentHtml).length} markdown files`);
        console.log(`\n🎯 Next steps:`);
        console.log(`   1. Update index.html to use '${OUTPUT_FILE}' instead of 'config.json'`);
        console.log(`   2. Deploy your site!`);
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