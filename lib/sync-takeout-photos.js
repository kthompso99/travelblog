#!/usr/bin/env node
/**
 * Google Photos Takeout Sync
 * Extracts photos from Google Takeout zip files to trip directories
 * with sequential naming and caption metadata
 */

const fs = require('fs').promises;
const path = require('path');
const AdmZip = require('adm-zip');
const CONFIG = require('./config-paths');

/**
 * Generate all possible metadata file paths for a photo
 * For edited photos, also checks the original file's metadata
 * @param {string} photoPath - Path to photo file
 * @returns {Array<string>} Array of possible metadata paths
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

/**
 * Main sync function
 * @param {string} zipPath - Path to Takeout zip file
 * @param {string} tripId - Trip identifier
 */
async function syncTakeoutPhotos(zipPath, tripId) {
  // 1. Validate zip file exists
  try {
    await fs.access(zipPath);
  } catch (err) {
    console.error(`❌ Zip file not found: ${zipPath}`);
    process.exit(1);
  }

  // 2. Validate trip exists
  const tripConfigPath = CONFIG.getTripConfigPath(tripId);
  try {
    await fs.access(tripConfigPath);
    console.log(`✅ Trip "${tripId}" found`);
  } catch (err) {
    console.error(`❌ Trip "${tripId}" not found!`);
    console.error(`   Expected: ${tripConfigPath}`);
    console.error(`   Run: npm run add`);
    process.exit(1);
  }

  // 3. Open and parse zip
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

  console.log(`🔍 Found ${Object.keys(photos).length} photos and ${Object.keys(metadata).length} JSON files.`);

  if (Object.keys(photos).length === 0) {
    console.error('❌ No photos found in zip');
    process.exit(1);
  }

  // 4. Auto-detect album folder
  // Takeout structure: Takeout/Google Photos/{Album Name}/{photos + json}
  const albumFolders = new Set();
  Object.keys(photos).forEach(photoPath => {
    const dir = path.dirname(photoPath);
    if (dir !== '.' && dir !== 'Takeout') {
      albumFolders.add(dir);
    }
  });

  if (albumFolders.size === 0) {
    console.error('❌ No album folders found in zip');
    process.exit(1);
  }

  if (albumFolders.size > 1) {
    console.warn(`⚠️  Multiple album folders found: ${Array.from(albumFolders).join(', ')}`);
    console.warn('   Using first folder. To sync multiple albums, run script separately for each zip.');
  }

  const albumFolder = Array.from(albumFolders)[0];
  console.log(`📂 Album folder: ${albumFolder}`);

  // Filter photos to only this album folder
  let albumPhotos = Object.keys(photos)
    .filter(p => p.startsWith(albumFolder))
    .sort(); // Maintain Takeout order

  // Prefer -edited versions: if both photo.jpg and photo-edited.jpg exist, keep only -edited
  const editedPhotos = new Set(
    albumPhotos
      .filter(p => p.includes('-edited.'))
      .map(p => p.replace('-edited.', '.'))
  );

  albumPhotos = albumPhotos.filter(p => {
    // If this is an original and an edited version exists, skip it
    if (editedPhotos.has(p) && !p.includes('-edited.')) {
      console.log(`⏭️  Skipping ${path.basename(p)} (edited version exists)`);
      return false;
    }
    return true;
  });

  console.log(`📸 Processing ${albumPhotos.length} photos from album...`);

  // 5. Extract photos with sequential naming
  const imagesDir = CONFIG.getTripImagesDir(tripId);
  await fs.mkdir(imagesDir, { recursive: true });

  const markdownLines = [];
  let successCount = 0;

  for (let i = 0; i < albumPhotos.length; i++) {
    const photoPath = albumPhotos[i];
    const photoEntry = photos[photoPath];

    // Sequential filename: spain-2025-01.jpg, spain-2025-02.jpg, ...
    const ext = path.extname(photoPath).toLowerCase().substring(1); // Remove leading dot
    const filename = `${tripId}-${String(i + 1).padStart(2, '0')}.${ext}`;
    const outputPath = path.join(imagesDir, filename);

    // Check if already exists (skip to avoid overwrite)
    try {
      await fs.access(outputPath);
      console.log(`⏭️  Skipping ${filename} (already exists)`);

      // Still need to add to markdown if it doesn't exist yet
      // This handles re-runs where images exist but markdown doesn't
      // For edited photos, this will also check the original's metadata
      const possibleJsonPaths = getPossibleMetadataPaths(photoPath);

      let caption = '';
      let photoId = filename;

      for (const jsonPath of possibleJsonPaths) {
        if (metadata[jsonPath]) {
          try {
            const jsonContent = JSON.parse(zip.readAsText(metadata[jsonPath]));
            caption = jsonContent.description || '';
            photoId = jsonContent.url || filename;
          } catch (e) {
            // Ignore metadata errors for skipped files
          }
          break;
        }
      }

      const entry = [
        `<!-- Photo ID: ${photoId} -->`,
        caption ? `![${caption}](images/${filename})` : `![](images/${filename})`
      ].join('\n');

      markdownLines.push(entry);
      continue;
    } catch {
      // File doesn't exist, proceed with extraction
    }

    // Find caption from metadata
    // For edited photos, this will also check the original's metadata
    const possibleJsonPaths = getPossibleMetadataPaths(photoPath);

    let caption = '';
    let photoId = filename; // Fallback ID

    for (const jsonPath of possibleJsonPaths) {
      if (metadata[jsonPath]) {
        try {
          const jsonContent = JSON.parse(zip.readAsText(metadata[jsonPath]));
          caption = jsonContent.description || '';
          photoId = jsonContent.url || filename; // Use Google Photos URL as ID if available
        } catch (e) {
          console.warn(`⚠️  Error reading metadata for ${filename}: ${e.message}`);
        }
        break;
      }
    }

    // Extract photo
    const buffer = zip.readFile(photoEntry);
    await fs.writeFile(outputPath, buffer);

    // Build markdown entry (compatible with future assign-photos.js format)
    const entry = [
      `<!-- Photo ID: ${photoId} -->`,
      caption ? `![${caption}](images/${filename})` : `![](images/${filename})`
    ].join('\n');

    markdownLines.push(entry);
    successCount++;

    process.stdout.write(`\r📥 Extracted ${successCount}/${albumPhotos.length} photos`);
  }

  console.log(`\n✅ Extracted ${successCount} new photos to ${imagesDir}`);

  // 6. Generate all-synced-photos.md
  const markdownPath = CONFIG.getSyncedPhotosPath(tripId);
  const markdownContent = markdownLines.join('\n\n');
  await fs.writeFile(markdownPath, markdownContent);

  console.log(`✅ Created ${markdownPath}`);
  console.log(`\n📝 Summary:`);
  console.log(`   Photos: ${albumPhotos.length} total (${successCount} new)`);
  console.log(`   Location: ${imagesDir}`);
  console.log(`   Markdown: ${markdownPath}`);
}

// CLI entry point
const zipPath = process.argv[2];
const tripId = process.argv[3];

if (!zipPath || !tripId) {
  console.error('Usage: node lib/sync-takeout-photos.js <zip-path> <trip-id>');
  console.error('Example: node lib/sync-takeout-photos.js ~/Downloads/takeout.zip spain-2025');
  process.exit(1);
}

syncTakeoutPhotos(zipPath, tripId).catch(err => {
  console.error(`\n❌ Error: ${err.message}`);
  process.exit(1);
});
