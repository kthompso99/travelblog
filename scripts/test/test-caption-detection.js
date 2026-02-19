#!/usr/bin/env node
/**
 * Caption Detection Diagnostic Tool
 * Analyzes Google Takeout zip to identify photos without captions
 * Does NOT modify any files - only outputs diagnostic information
 */

const path = require('path');
const {
  getPossibleMetadataPaths,
  catalogZipContents,
  detectAlbumFolder,
  filterAlbumPhotos
} = require('../../lib/takeout-utilities');

/**
 * Check each photo for caption metadata and categorize results
 * @returns {{ noCaptionPhotos: Array, withCaptionPhotos: Array, metadataStats: Object }}
 */
function checkPhotoCaptions(albumPhotos, metadata, zip) {
  const noCaptionPhotos = [];
  const withCaptionPhotos = [];
  const metadataStats = {};

  for (let i = 0; i < albumPhotos.length; i++) {
    const photoPath = albumPhotos[i];
    const photoName = path.basename(photoPath);
    const possibleJsonPaths = getPossibleMetadataPaths(photoPath);

    let caption = '';
    let metadataFound = false;
    let metadataType = 'none';

    for (const jsonPath of possibleJsonPaths) {
      if (metadata[jsonPath]) {
        metadataFound = true;
        metadataType = path.basename(jsonPath).replace(photoName + '.', '');

        try {
          const jsonContent = JSON.parse(zip.readAsText(metadata[jsonPath]));
          caption = jsonContent.description || '';
        } catch (e) {
          console.warn(`⚠️  Error reading metadata for ${photoName}: ${e.message}`);
        }
        break;
      }
    }

    metadataStats[metadataType] = (metadataStats[metadataType] || 0) + 1;

    if (!caption) {
      noCaptionPhotos.push({ index: i + 1, original: photoName, metadataFound, metadataType });
    } else {
      withCaptionPhotos.push({ index: i + 1, original: photoName, caption, metadataType });
    }
  }

  return { noCaptionPhotos, withCaptionPhotos, metadataStats };
}

/**
 * Print a formatted caption analysis report
 */
function printCaptionReport(albumPhotos, metadata, results) {
  const { noCaptionPhotos, withCaptionPhotos, metadataStats } = results;

  console.log('\n📊 METADATA TYPE STATISTICS:');
  console.log('=' .repeat(80));
  Object.entries(metadataStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`  ${type.padEnd(40)} ${count} files`);
    });

  console.log('\n❌ PHOTOS WITHOUT CAPTIONS (' + noCaptionPhotos.length + ' total):');
  console.log('=' .repeat(80));
  noCaptionPhotos.forEach(photo => {
    const metaInfo = photo.metadataFound
      ? `[${photo.metadataType}] - has metadata but empty description`
      : '[NO METADATA FILE FOUND]';
    console.log(`  ${String(photo.index).padStart(2, '0')}. ${photo.original}`);
    console.log(`      ${metaInfo}`);
  });

  console.log('\n✅ PHOTOS WITH CAPTIONS (' + withCaptionPhotos.length + ' total):');
  console.log('=' .repeat(80));
  withCaptionPhotos.forEach(photo => {
    console.log(`  ${String(photo.index).padStart(2, '0')}. ${photo.original}`);
    console.log(`      [${photo.metadataType}] "${photo.caption}"`);
  });

  console.log('\n📋 SUMMARY:');
  console.log('=' .repeat(80));
  console.log(`  Total photos:       ${albumPhotos.length}`);
  console.log(`  With captions:      ${withCaptionPhotos.length}`);
  console.log(`  Without captions:   ${noCaptionPhotos.length}`);
  console.log(`  Metadata files:     ${Object.keys(metadata).length}`);
}

async function analyzeCaptions(zipPath) {
  const { zip, photos, metadata } = catalogZipContents(zipPath);
  const albumFolder = detectAlbumFolder(photos);
  const albumPhotos = filterAlbumPhotos(photos, albumFolder);

  console.log('\n' + '=' .repeat(80));

  const results = checkPhotoCaptions(albumPhotos, metadata, zip);
  printCaptionReport(albumPhotos, metadata, results);
}

// CLI entry point
const zipPath = process.argv[2];

if (!zipPath) {
  console.error('Usage: node scripts/test-caption-detection.js <zip-path>');
  console.error('Example: node scripts/test-caption-detection.js takeout/takeout-spain.zip');
  process.exit(1);
}

analyzeCaptions(zipPath).catch(err => {
  console.error(`\n❌ Error: ${err.message}`);
  process.exit(1);
});
