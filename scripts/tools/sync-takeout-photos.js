#!/usr/bin/env node
/**
 * Google Photos Takeout Sync
 *
 * WHAT IT DOES:
 * - Extracts photos from a Google Photos Takeout zip file
 * - Copies them to content/trips/{trip-id}/images/
 * - Renames photos sequentially: {trip-id}-01.jpg, {trip-id}-02.jpg, etc.
 * - Extracts photo captions from Google's metadata files
 * - Creates all-synced-photos.md with photos organized by location
 *
 * PREREQUISITES:
 * 1. Download Google Photos Takeout zip file (contains album with photos)
 * 2. Place zip in takeout/ directory (gitignored, won't be committed)
 * 3. Trip must exist in content/trips/ with trip.json configured
 * 4. Trip locations must have GPS coordinates in trip.json
 *
 * USAGE:
 *   npm run sync-photos <path-to-zip> <trip-id>
 *
 * EXAMPLES:
 *   npm run sync-photos takeout/spain-photos.zip spain
 *   npm run sync-photos ~/Downloads/takeout-20250210.zip greece
 *
 * WHAT HAPPENS:
 * 1. Opens the Takeout zip and finds all photos in the album
 * 2. Matches photos to trip locations using GPS coordinates from EXIF data
 * 3. Extracts each photo to images/ with sequential naming
 * 4. Reads captions from Google's .supplemental-metadata.json files
 * 5. Creates all-synced-photos.md grouped by location
 * 6. Photos without GPS go to "Unmatched Photos" section
 *
 * NOTES:
 * - Safe to re-run: skips photos that already exist (won't overwrite)
 * - After running, use assign-photos.js to insert photos into location markdown
 * - Supports multiple metadata filename patterns (Google truncates long names)
 * - Handles edited photos by checking original file's metadata
 */

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');
const { spawn } = require('child_process');
const CONFIG = require('../../lib/config-paths');
const {
  getPossibleMetadataPaths,
  catalogZipContents,
  detectAlbumFolder,
  filterAlbumPhotos
} = require('../../lib/takeout-utilities');

/**
 * Read photo caption and ID from zip metadata files
 * @param {string} photoPath - Path within the zip
 * @param {Object} metadata - Map of metadata entry names to zip entries
 * @param {AdmZip} zip - The zip file
 * @param {string} fallbackFilename - Filename to use as fallback ID
 * @returns {{ caption: string, photoId: string }}
 */
function readPhotoCaption(photoPath, metadata, zip, fallbackFilename) {
  const possibleJsonPaths = getPossibleMetadataPaths(photoPath);
  let caption = '';
  let photoId = fallbackFilename;

  for (const jsonPath of possibleJsonPaths) {
    if (metadata[jsonPath]) {
      try {
        const jsonContent = JSON.parse(zip.readAsText(metadata[jsonPath]));
        caption = jsonContent.description || '';
        photoId = jsonContent.url || fallbackFilename;
      } catch (e) {
        // Ignore metadata parse errors
      }
      break;
    }
  }

  return { caption, photoId };
}

/**
 * Build a markdown entry for a single photo
 */
function buildMarkdownEntry(caption, filename, photoId) {
  return [
    `<!-- Photo ID: ${photoId} -->`,
    caption ? `![${caption}](images/${filename})` : `![](images/${filename})`
  ].join('\n');
}

/**
 * Validate that the zip file and trip exist
 */
async function validateSyncInputs(zipPath, tripId) {
  try {
    await fs.access(zipPath);
  } catch (err) {
    console.error(`❌ Zip file not found: ${zipPath}`);
    process.exit(1);
  }

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
}

/**
 * Extract photos from zip to disk with sequential naming, collecting markdown entries
 * @returns {{ markdownLines: Array<string>, successCount: number, photosWithoutCaption: number }}
 */
async function extractPhotosWithMarkdown(albumPhotos, photos, metadata, zip, imagesDir, tripId) {
  await fs.mkdir(imagesDir, { recursive: true });

  const markdownLines = [];
  let successCount = 0;
  let photosWithoutCaption = 0;

  for (let i = 0; i < albumPhotos.length; i++) {
    const photoPath = albumPhotos[i];
    const photoEntry = photos[photoPath];

    // Sequential filename: spain-2025-01.jpg, spain-2025-02.jpg, ...
    const ext = path.extname(photoPath).toLowerCase().substring(1);
    const filename = `${tripId}-${String(i + 1).padStart(2, '0')}.${ext}`;
    const outputPath = path.join(imagesDir, filename);

    // Check if already exists (skip to avoid overwrite)
    try {
      await fs.access(outputPath);
      console.log(`⏭️  Skipping ${filename} (already exists)`);

      const { caption, photoId } = readPhotoCaption(photoPath, metadata, zip, filename);
      if (!caption) photosWithoutCaption++;
      markdownLines.push(buildMarkdownEntry(caption, filename, photoId));
      continue;
    } catch {
      // File doesn't exist, proceed with extraction
    }

    const { caption, photoId } = readPhotoCaption(photoPath, metadata, zip, filename);

    // Extract photo
    const buffer = zip.readFile(photoEntry);
    await fs.writeFile(outputPath, buffer);

    if (!caption) photosWithoutCaption++;
    markdownLines.push(buildMarkdownEntry(caption, filename, photoId));
    successCount++;

    process.stdout.write(`\r📥 Extracted ${successCount}/${albumPhotos.length} photos`);
  }

  console.log(`\n✅ Extracted ${successCount} new photos to ${imagesDir}`);
  return { markdownLines, successCount, photosWithoutCaption };
}

/**
 * Main sync function
 * @param {string} zipPath - Path to Takeout zip file
 * @param {string} tripId - Trip identifier
 */
async function syncTakeoutPhotos(zipPath, tripId) {
  await validateSyncInputs(zipPath, tripId);

  const { zip, photos, metadata } = catalogZipContents(zipPath);
  const albumFolder = detectAlbumFolder(photos);
  const albumPhotos = filterAlbumPhotos(photos, albumFolder);

  const imagesDir = CONFIG.getTripImagesDir(tripId);
  const { markdownLines, successCount, photosWithoutCaption } =
    await extractPhotosWithMarkdown(albumPhotos, photos, metadata, zip, imagesDir, tripId);

  // Write all-synced-photos.md
  const markdownPath = CONFIG.getSyncedPhotosPath(tripId);
  const markdownContent = markdownLines.join('\n\n');
  await fs.writeFile(markdownPath, markdownContent);

  console.log(`✅ Created ${markdownPath}`);
  console.log(`\n📝 Summary:`);
  console.log(`   Photos: ${albumPhotos.length} total (${successCount} new)`);
  console.log(`   Photos without caption: ${photosWithoutCaption}`);
  console.log(`   Location: ${imagesDir}`);
  console.log(`   Markdown: ${markdownPath}`);
}

// Helper function to prompt user for yes/no
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().trim());
    });
  });
}

// Helper function to run image optimization
function optimizeImages(tripId) {
  return new Promise((resolve, reject) => {
    console.log(`\n🖼️  Running image optimization for ${tripId}...`);

    const optimize = spawn('npm', ['run', 'optimize:images', '--', tripId], {
      stdio: 'inherit',
      shell: true
    });

    optimize.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Image optimization failed with code ${code}`));
      }
    });
  });
}

// CLI entry point
const zipPath = process.argv[2];
const tripId = process.argv[3];

if (!zipPath || !tripId) {
  console.error('Usage: npm run sync-photos <zip-path> <trip-id>');
  console.error('Example: npm run sync-photos ~/Downloads/takeout.zip spain-2025');
  process.exit(1);
}

syncTakeoutPhotos(zipPath, tripId)
  .then(async () => {
    // Offer to optimize images
    console.log(`\n💡 Tip: Images should be optimized before committing.`);
    const answer = await askQuestion('Optimize images now? (y/n): ');

    if (answer === 'y' || answer === 'yes') {
      await optimizeImages(tripId);
      console.log(`\n✅ Done! Images extracted and optimized.`);
    } else {
      console.log(`\n✅ Done! Remember to run: npm run optimize:images -- ${tripId}`);
    }
  })
  .catch(err => {
    console.error(`\n❌ Error: ${err.message}`);
    process.exit(1);
  });
