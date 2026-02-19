#!/usr/bin/env node

/**
 * Quick geocoding test script
 * Usage: npm run testGeo "North Island"
 * or: node scripts/test-geocode.js "North Island"
 */

const https = require('https');
const fs = require('fs');
const { loadJsonFile } = require('../lib/build-utilities');

// Load Google Maps API key
let googleMapsApiKey = null;
const googleMapsConfigPath = 'config/google-maps.json';
if (fs.existsSync(googleMapsConfigPath)) {
    try {
        googleMapsApiKey = loadJsonFile(googleMapsConfigPath).apiKey;
    } catch (e) {
        console.error('❌ Error: Could not load Google Maps API key from config/google-maps.json');
        process.exit(1);
    }
} else {
    console.error('❌ Error: config/google-maps.json not found');
    process.exit(1);
}

// Get location from command line args
const locationQuery = process.argv.slice(2).join(' ');

if (!locationQuery) {
    console.error('❌ Error: Please provide a location to geocode');
    console.error('Usage: npm run testGeo "location name"');
    console.error('Example: npm run testGeo "North Island, Seychelles"');
    process.exit(1);
}

console.log(`🔍 Testing geocoding for: "${locationQuery}"\n`);

// Use the same Google Maps Geocoding API as the build script
const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationQuery)}&key=${googleMapsApiKey}`;

console.log(`📡 Using Google Maps Geocoding API\n`);

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);

            if (json.status === 'OK' && json.results && json.results.length > 0) {
                console.log(`✅ Found ${json.results.length} result(s):\n`);

                json.results.forEach((result, index) => {
                    console.log(`${index + 1}. ${result.formatted_address}`);
                    console.log(`   Coordinates: ${result.geometry.location.lat}, ${result.geometry.location.lng}`);
                    console.log(`   Place ID: ${result.place_id}`);
                    console.log(`   Types: ${result.types.join(', ')}`);
                    if (index === 0) {
                        console.log(`   👆 This is what the build script would use`);
                    }
                    console.log('');
                });

                console.log(`💡 Tips:`);
                console.log(`   - Try adding country: "North Island, Seychelles"`);
                console.log(`   - Try more specific names: "North Island Resort, Seychelles"`);
                console.log(`   - Check Google Maps: https://www.google.com/maps/search/${encodeURIComponent(locationQuery)}`);
            } else if (json.status === 'ZERO_RESULTS') {
                console.log('❌ No results found\n');
                console.log(`💡 Suggestions:`);
                console.log(`   - Add more context (country, region)`);
                console.log(`   - Try alternative names`);
                console.log(`   - Check spelling`);
                console.log(`   - Search on Google Maps: https://www.google.com/maps/search/${encodeURIComponent(locationQuery)}`);
            } else {
                console.log(`❌ Geocoding failed: ${json.status}`);
                if (json.error_message) {
                    console.log(`   Error: ${json.error_message}`);
                }
            }
        } catch (e) {
            console.error('❌ Error parsing response:', e.message);
            console.error('Raw data:', data);
        }
    });
}).on('error', (err) => {
    console.error('❌ Network error:', err.message);
    process.exit(1);
});
