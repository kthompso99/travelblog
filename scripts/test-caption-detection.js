#!/usr/bin/env node
/**
 * Caption Detection Diagnostic Tool
 * Analyzes Google Takeout zip to identify photos without captions
 * Does NOT modify any files - only outputs diagnostic information
 */

const fs = require('fs').promises;
const path = require('path');
const AdmZip = require('adm-zip');

/**
 * Generate all possible metadata file paths for a photo
 * For edited photos, also checks the original file's metadata
 */
function getPossibleMetadataPaths(photoPath) {
  const metadataSuffixes = [
    'supplemental-metadata.json',
    'supplemental-metada.json',
    'supplemental-meta.json',
    'supplemental-met.json',
    'supplemental-m.json',
    'supplemen.json',  // Even more truncated
    'json'
  ];

  const paths = [];

  // First, try metadata for the photo itself
  for (const suffix of metadataSuffixes) {
    paths.push(`${photoPath}.${suffix}`);
  }

  // If this is an edited photo, also try the original's metadata
  if (photoPath.includes('-edited.')) {
    const originalPath = photoPath.replace('-edited.', '.');
    for (const suffix of metadataSuffixes) {
      paths.push(`${originalPath}.${suffix}`);
    }
  }

  // For original_*_P.jpg or original_*_P(1).jpg files, try stripping the P suffix
  // Example: original_5d0ee73e-..._P.jpg -> original_5d0ee73e-..._.json
  if (photoPath.includes('original_') && photoPath.match(/_P(\(\d+\))?\.(jpg|jpeg|png)$/i)) {
    const basePath = photoPath.replace(/_P(\(\d+\))?\.(jpg|jpeg|png)$/i, '_');
    paths.push(`${basePath}.json`);
  }

  return paths;
}

async function analyzeCaptions(zipPath) {
  // 1. Open and parse zip
  console.log('📦 Opening Takeout ZIP...');
  const zip = new AdmZip(zipPath);
  const zipEntries = zip.getEntries();

  const photos = {};    // { entryName: zipEntry }
  const metadata = {};  // { entryName: zipEntry }

  // Catalog everything in the zip
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

  // 2. Auto-detect album folder
  const albumFolders = new Set();
  Object.keys(photos).forEach(photoPath => {
    const dir = path.dirname(photoPath);
    if (dir !== '.' && dir !== 'Takeout') {
      albumFolders.add(dir);
    }
  });

  const albumFolder = Array.from(albumFolders)[0];
  console.log(`📂 Album folder: ${albumFolder}\n`);

  // Filter photos to only this album folder
  let albumPhotos = Object.keys(photos)
    .filter(p => p.startsWith(albumFolder))
    .sort();

  // Prefer -edited versions
  const editedPhotos = new Set(
    albumPhotos
      .filter(p => p.includes('-edited.'))
      .map(p => p.replace('-edited.', '.'))
  );

  albumPhotos = albumPhotos.filter(p => {
    if (editedPhotos.has(p) && !p.includes('-edited.')) {
      return false;
    }
    return true;
  });

  console.log(`📸 Processing ${albumPhotos.length} photos from album...\n`);
  console.log('=' .repeat(80));

  // 3. Check each photo for caption
  const noCaptionPhotos = [];
  const withCaptionPhotos = [];
  const metadataStats = {};

  for (let i = 0; i < albumPhotos.length; i++) {
    const photoPath = albumPhotos[i];
    const photoName = path.basename(photoPath);

    // Try to find metadata (also checks original for edited photos)
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

    // Track metadata type stats
    metadataStats[metadataType] = (metadataStats[metadataType] || 0) + 1;

    if (!caption) {
      noCaptionPhotos.push({
        index: i + 1,
        original: photoName,
        metadataFound,
        metadataType
      });
    } else {
      withCaptionPhotos.push({
        index: i + 1,
        original: photoName,
        caption,
        metadataType
      });
    }
  }

  // 4. Output results
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
