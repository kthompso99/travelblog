#!/usr/bin/env node
/**
 * Analyze Google Takeout Geolocation Data
 *
 * PURPOSE:
 * Analyzes GPS coordinates in Google Takeout photos to determine if semi-automatic
 * photo assignment based on location data is viable. Helps decide whether to build
 * GPS-based auto-assignment features into the photo workflow.
 *
 * WHAT IT DOES:
 * - Extracts GPS coordinates from Takeout JSON metadata
 * - Calculates distance to known trip cities using Haversine formula
 * - Identifies which photos can be auto-assigned (within 30km of known cities)
 * - Breaks down photos by: auto-assignable, no GPS data, GPS but too far
 * - Shows device/phone correlation with missing GPS data
 * - Provides recommendation on whether GPS-based auto-assignment is worth building
 *
 * USAGE:
 *   node scripts/analyze-takeout-geo.js <path-to-takeout.zip>
 *
 * EXAMPLE:
 *   node scripts/analyze-takeout-geo.js ~/Downloads/takeout-spain.zip
 *
 * BEFORE RUNNING:
 * 1. Update CITY_COORDS (lines 12-22) with the cities from your trip
 * 2. Get city coordinates from Google Maps or Wikipedia
 * 3. Adjust the 30km radius threshold (line 169) if needed for your trip
 *
 * OUTPUT:
 * - Summary: % of photos that can be auto-assigned
 * - Breakdown: no GPS vs. GPS but too far
 * - Device stats: which phones have GPS issues
 * - Detailed city-by-city photo list
 * - Recommendation: whether to build GPS-based assignment
 *
 * DECISION CRITERIA:
 * - ≥70% auto-assignable: GPS-based assignment worth building
 * - 40-70%: Hybrid approach (GPS when available, manual otherwise)
 * - <40%: Manual assignment better (current workflow with assign-photos.js)
 *
 * NOTE: This is a diagnostic tool, not part of the regular photo workflow.
 * Run it once per trip to decide if GPS-based assignment is viable.
 */

const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

// Known city coordinates (approximate centers)
const CITY_COORDS = {
  cordoba: { lat: 37.8882, lon: -4.7794, name: 'Cordoba' },
  granada: { lat: 37.1773, lon: -3.5986, name: 'Granada' },
  antequera: { lat: 37.0191, lon: -4.5617, name: 'Antequera' },
  malaga: { lat: 36.7213, lon: -4.4214, name: 'Malaga' },
  ronda: { lat: 36.7423, lon: -5.1673, name: 'Ronda' },
  setenil: { lat: 36.8608, lon: -5.1796, name: 'Setenil de las Bodegas' },
  zahara: { lat: 36.8395, lon: -5.3914, name: 'Zahara de la Sierra' },
  seville: { lat: 37.3891, lon: -5.9845, name: 'Seville' },
  madrid: { lat: 40.4168, lon: -3.7038, name: 'Madrid' }
};

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Find nearest city for given coordinates
function findNearestCity(lat, lon) {
  let nearest = null;
  let minDistance = Infinity;

  for (const [cityId, coords] of Object.entries(CITY_COORDS)) {
    const distance = calculateDistance(lat, lon, coords.lat, coords.lon);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = { cityId, ...coords, distance };
    }
  }

  return nearest;
}

async function analyzeTakeoutGeo(zipPath) {
  if (!fs.existsSync(zipPath)) {
    console.error(`❌ Zip file not found: ${zipPath}`);
    process.exit(1);
  }

  console.log('📦 Opening Takeout ZIP...');
  const zip = new AdmZip(zipPath);
  const zipEntries = zip.getEntries();

  const photos = {};
  const metadata = {};

  // Catalog files
  zipEntries.forEach(entry => {
    if (entry.isDirectory) return;

    const ext = path.extname(entry.entryName).toLowerCase();
    if (ext === '.json') {
      metadata[entry.entryName] = entry;
    } else if (['.jpg', '.jpeg', '.png', '.heic'].includes(ext)) {
      photos[entry.entryName] = entry;
    }
  });

  console.log(`🔍 Found ${Object.keys(photos).length} photos and ${Object.keys(metadata).length} JSON files.\n`);

  // Analyze geolocation data
  const photoKeys = Object.keys(photos).sort();
  const results = {
    total: 0,
    withGeo: 0,
    withValidGeo: 0,
    withZeroGeo: 0,
    noGeoAtAll: 0,
    geoButTooFar: 0,
    photosByCity: {},
    deviceStats: {}  // Track stats by device model
  };

  // Initialize city counters
  Object.keys(CITY_COORDS).forEach(cityId => {
    results.photosByCity[cityId] = { count: 0, photos: [] };
  });

  console.log('📊 Analyzing geolocation data...\n');
  console.log('=' .repeat(80));

  photoKeys.forEach((photoPath, index) => {
    const filename = path.basename(photoPath);
    results.total++;

    // Find matching JSON metadata
    const possibleJsonPaths = [
      `${photoPath}.supplemental-metada.json`,
      `${photoPath}.supplemental-meta.json`,
      `${photoPath}.json`
    ];

    let jsonContent = null;
    for (const jsonPath of possibleJsonPaths) {
      if (metadata[jsonPath]) {
        try {
          jsonContent = JSON.parse(zip.readAsText(metadata[jsonPath]));
        } catch (e) {
          // Ignore parse errors
        }
        break;
      }
    }

    if (!jsonContent) {
      console.log(`[${index + 1}] ${filename}`);
      console.log(`   ❌ No metadata found`);
      console.log();
      results.noGeoAtAll++;
      return;
    }

    const geoData = jsonContent.geoData || jsonContent.geoDataExif;
    const caption = jsonContent.description || '';

    // Extract device information
    const deviceModel = jsonContent.deviceType?.device ||
                       (jsonContent.cameraMake && jsonContent.cameraModel
                         ? `${jsonContent.cameraMake} ${jsonContent.cameraModel}`
                         : 'Unknown Device');

    // Initialize device stats if needed
    if (!results.deviceStats[deviceModel]) {
      results.deviceStats[deviceModel] = {
        total: 0,
        withValidGeo: 0,
        noGeo: 0,
        zeroGeo: 0
      };
    }
    results.deviceStats[deviceModel].total++;

    console.log(`[${index + 1}] ${filename}`);
    console.log(`   📱 Device: ${deviceModel}`);
    if (caption) {
      console.log(`   Caption: "${caption.substring(0, 60)}${caption.length > 60 ? '...' : ''}"`);
    }

    if (geoData && typeof geoData.latitude === 'number' && typeof geoData.longitude === 'number') {
      results.withGeo++;

      const lat = geoData.latitude;
      const lon = geoData.longitude;

      // Check if coordinates are meaningful (not 0,0)
      if (lat !== 0 && lon !== 0) {
        results.withValidGeo++;

        // Find nearest city
        const nearest = findNearestCity(lat, lon);

        console.log(`   ✅ GPS: ${lat.toFixed(6)}, ${lon.toFixed(6)}`);
        console.log(`   📍 Nearest: ${nearest.name} (${nearest.distance.toFixed(1)} km away)`);

        // Only auto-assign if within 30km (reasonable city radius)
        if (nearest.distance < 30) {
          console.log(`   🎯 AUTO-ASSIGN: ${nearest.name}`);
          results.photosByCity[nearest.cityId].count++;
          results.photosByCity[nearest.cityId].photos.push({
            filename,
            caption,
            lat,
            lon,
            distance: nearest.distance
          });
          results.deviceStats[deviceModel].withValidGeo++;
        } else {
          console.log(`   ⚠️  Too far from known cities (>30km)`);
          results.geoButTooFar++;
          results.deviceStats[deviceModel].withValidGeo++;
        }
      } else {
        results.withZeroGeo++;
        results.noGeoAtAll++;
        results.deviceStats[deviceModel].zeroGeo++;
        console.log(`   ⚠️  GPS: 0.0, 0.0 (invalid/placeholder)`);
      }
    } else {
      console.log(`   ❌ No geolocation data`);
      results.noGeoAtAll++;
      results.deviceStats[deviceModel].noGeo++;
    }

    console.log();
  });

  // Summary report
  console.log('=' .repeat(80));
  console.log('\n📊 SUMMARY REPORT\n');

  console.log(`Total photos: ${results.total}`);
  console.log(`Photos with geo metadata: ${results.withGeo} (${Math.round(results.withGeo / results.total * 100)}%)`);
  console.log(`Photos with valid coordinates: ${results.withValidGeo} (${Math.round(results.withValidGeo / results.total * 100)}%)`);
  console.log(`Photos with zero/placeholder coords: ${results.withZeroGeo}`);
  console.log(`Photos without geo: ${results.total - results.withGeo} (${Math.round((results.total - results.withGeo) / results.total * 100)}%)\n`);

  console.log('🎯 AUTO-ASSIGNABLE PHOTOS BY CITY:\n');

  let totalAutoAssignable = 0;
  Object.entries(results.photosByCity).forEach(([cityId, data]) => {
    if (data.count > 0) {
      console.log(`${CITY_COORDS[cityId].name}: ${data.count} photos`);
      totalAutoAssignable += data.count;
    }
  });

  console.log(`\nTotal auto-assignable: ${totalAutoAssignable} / ${results.total} (${Math.round(totalAutoAssignable / results.total * 100)}%)`);

  const manualCount = results.total - totalAutoAssignable;
  console.log(`\n📋 MANUAL ASSIGNMENT NEEDED: ${manualCount} photos (${Math.round(manualCount / results.total * 100)}%)`);
  console.log(`   • No geo location at all: ${results.noGeoAtAll} photos (${Math.round(results.noGeoAtAll / results.total * 100)}%)`);
  console.log(`   • Has geo but too far from cities: ${results.geoButTooFar} photos (${Math.round(results.geoButTooFar / results.total * 100)}%)\n`);

  // Device breakdown
  console.log('📱 BREAKDOWN BY DEVICE:\n');
  Object.entries(results.deviceStats)
    .sort((a, b) => b[1].total - a[1].total)  // Sort by total count
    .forEach(([device, stats]) => {
      const geoPercent = Math.round((stats.withValidGeo / stats.total) * 100);
      const noGeoPercent = Math.round((stats.noGeo / stats.total) * 100);
      const zeroGeoPercent = Math.round((stats.zeroGeo / stats.total) * 100);

      console.log(`${device}:`);
      console.log(`   Total: ${stats.total} photos`);
      console.log(`   ✅ Valid GPS: ${stats.withValidGeo} (${geoPercent}%)`);
      console.log(`   ❌ No GPS data: ${stats.noGeo} (${noGeoPercent}%)`);
      console.log(`   ⚠️  Zero/placeholder GPS: ${stats.zeroGeo} (${zeroGeoPercent}%)`);
      console.log();
    });

  // Detailed breakdown by city
  console.log('=' .repeat(80));
  console.log('\n📍 DETAILED BREAKDOWN BY CITY\n');

  Object.entries(results.photosByCity).forEach(([cityId, data]) => {
    if (data.count > 0) {
      console.log(`\n${CITY_COORDS[cityId].name.toUpperCase()} (${data.count} photos):`);
      data.photos.forEach((photo, idx) => {
        console.log(`  ${idx + 1}. ${photo.filename} (${photo.distance.toFixed(1)}km)`);
        if (photo.caption) {
          console.log(`     "${photo.caption.substring(0, 60)}${photo.caption.length > 60 ? '...' : ''}"`);
        }
      });
    }
  });

  // Recommendation
  console.log('\n' + '='.repeat(80));
  console.log('\n💡 RECOMMENDATION\n');

  const autoAssignPercent = Math.round(totalAutoAssignable / results.total * 100);

  if (autoAssignPercent >= 70) {
    console.log(`✅ GOOD NEWS! ${autoAssignPercent}% of photos can be auto-assigned based on GPS.`);
    console.log('   → Modify assign-photos.js to use GPS-based auto-suggestion');
    console.log('   → User confirms each suggestion (quick "y/n" prompt)');
  } else if (autoAssignPercent >= 40) {
    console.log(`⚠️  ${autoAssignPercent}% of photos can be auto-assigned based on GPS.`);
    console.log('   → Consider hybrid approach: auto-assign when GPS available, manual otherwise');
  } else {
    console.log(`❌ Only ${autoAssignPercent}% of photos have usable GPS data.`);
    console.log('   → Manual assignment (current plan) is probably best');
    console.log('   → GPS data insufficient for reliable auto-assignment');
  }

  console.log();
}

// CLI entry point
const zipPath = process.argv[2];

if (!zipPath) {
  console.error('Usage: node analyze-takeout-geo.js <path-to-takeout.zip>');
  console.error('Example: node analyze-takeout-geo.js content/trips/spain-2025/takeout.zip');
  process.exit(1);
}

analyzeTakeoutGeo(zipPath).catch(err => {
  console.error(`\n❌ Error: ${err.message}`);
  process.exit(1);
});
