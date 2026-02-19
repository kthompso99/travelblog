#!/usr/bin/env node
/**
 * Interactive Photo Assignment Tool
 * Assigns synced photos to location markdown files with iTerm2 thumbnail display
 * Renames photos from spain-2025-XX.jpg to location-XX.jpg
 */

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');
const CONFIG = require('../../lib/config-paths');

/**
 * Parse trip structure from trip.json
 */
async function parseTripStructure(tripId) {
  const tripJson = await fs.readFile(CONFIG.getTripConfigPath(tripId), 'utf8');
  const trip = JSON.parse(tripJson);

  // Extract location names from trip.json
  const locations = trip.content
    .filter(item => item.type === 'location')
    .map(loc => ({
      id: path.basename(loc.file, '.md'),  // 'cordoba' from 'cordoba.md'
      title: loc.title,                     // 'Cordoba'
      duration: loc.duration,               // '2 days'
      file: loc.file,                       // 'cordoba.md'
      photoCount: 0                         // Track assignments
    }));

  return { trip, locations };
}

/**
 * Read a possibly multiline image markdown entry starting after a Photo ID comment.
 * Accumulates lines until the closing ](images/...) is found.
 *
 * @returns {{ markdown: string, linesConsumed: number }}
 */
function readMultilineImageMarkdown(lines, startIndex) {
  let markdown = '';
  let offset = 1;

  while (startIndex + offset < lines.length) {
    const currentLine = lines[startIndex + offset];
    markdown += (markdown ? '\n' : '') + currentLine;

    if (currentLine.includes('](images/')) {
      break;
    }
    offset++;
  }

  return { markdown, linesConsumed: offset };
}

/**
 * Extract the sequence number from a trip photo filename (e.g., "spain-08.jpg" → 8).
 * Returns null if the filename doesn't match the expected pattern.
 */
function extractPhotoNumber(filename, tripId) {
  const match = filename.match(new RegExp(`${tripId}-(\\d+)\\.`));
  return match ? parseInt(match[1]) : null;
}

/**
 * Find unassigned photos whose sequence numbers fall within [startNum, endNum].
 */
function findPhotosInRange(photos, startNum, endNum, tripId) {
  return photos.filter(p => {
    if (p.assigned) return false;
    const num = extractPhotoNumber(p.currentFilename, tripId);
    return num !== null && num >= startNum && num <= endNum;
  });
}

/**
 * Parse all-synced-photos.md to extract photo list
 */
async function parseSyncedPhotos(tripId) {
  const syncedPath = CONFIG.getSyncedPhotosPath(tripId);
  const content = await fs.readFile(syncedPath, 'utf8');

  const photos = [];
  const lines = content.split('\n');
  const unassignedPattern = new RegExp(`^${tripId}-\\d+\\.(jpg|jpeg|png|heic)$`, 'i');

  for (let i = 0; i < lines.length; i++) {
    const idMatch = lines[i].match(/<!-- Photo ID: (.+?) -->/);
    if (!idMatch) continue;

    const photoId = idMatch[1];
    const { markdown } = readMultilineImageMarkdown(lines, i);
    const imgMatch = markdown.match(/!\[([\s\S]*?)\]\(images\/(.+?)\)/);
    if (!imgMatch) continue;

    const currentFilename = imgMatch[2];

    // Skip photos that have already been assigned (renamed from tripId-XX.jpg pattern)
    if (!unassignedPattern.test(currentFilename)) continue;

    const currentPath = path.join(CONFIG.getTripImagesDir(tripId), currentFilename);

    // Verify file still exists
    try {
      await fs.access(currentPath);
      photos.push({
        photoId,
        caption: imgMatch[1] || '',
        currentFilename,
        currentPath,
        assigned: false,
        newFilename: null,
        newPath: null
      });
    } catch {
      // File doesn't exist (deleted or moved manually), skip
    }
  }

  return photos;
}

/**
 * Display photo thumbnail (iTerm2)
 */
function showThumbnail(photo, index, total, tripId) {
  const num = extractPhotoNumber(photo.currentFilename, tripId);
  const photoNum = num !== null ? `#${num}` : '';

  console.log(`\n[Unassigned ${index}/${total}] ${photo.currentFilename} ${photoNum}`);

  if (photo.caption) {
    console.log(`Caption: "${photo.caption}"`);
  }

  try {
    // iTerm2 inline image display (40-char width)
    execSync(
      `printf "\\033]1337;File=inline=1;width=40;preserveAspectRatio=1:$(base64 < '${photo.currentPath}')\\a"`,
      { stdio: 'inherit' }
    );
  } catch (err) {
    // Graceful fallback for non-iTerm2 terminals
    console.log(`    (Thumbnail: ${photo.currentPath})`);
  }
}

/**
 * Assign photo to location (rename file, update markdown)
 */
async function assignPhotoToLocation(photo, location, tripId) {
  const imagesDir = CONFIG.getTripImagesDir(tripId);

  // Generate new filename with location-specific numbering
  location.photoCount++;
  const ext = path.extname(photo.currentFilename);
  const newFilename = `${location.id}-${String(location.photoCount).padStart(2, '0')}${ext}`;
  const newPath = path.join(imagesDir, newFilename);

  // CRITICAL SAFETY CHECK: Verify file doesn't already exist
  try {
    await fs.access(newPath);
    throw new Error(`CRITICAL: File already exists: ${newFilename}. This would overwrite an existing photo. Aborting assignment.`);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      // File exists - this is an error!
      throw err;
    }
    // File doesn't exist (ENOENT), safe to proceed
  }

  // Rename file on filesystem
  await fs.rename(photo.currentPath, newPath);

  // Update photo tracking
  photo.assigned = true;
  photo.newFilename = newFilename;
  photo.newPath = newPath;

  // Add markdown entry to location file
  await appendPhotoToLocationFile(tripId, location.file, photo, newFilename);

  console.log(`✅ Renamed: ${photo.currentFilename} → ${newFilename}`);
  console.log(`✅ Added to ${location.file}`);
}

/**
 * Append photo markdown to location file
 */
async function appendPhotoToLocationFile(tripId, locationFile, photo, newFilename) {
  const locationPath = path.join(CONFIG.getTripDir(tripId), locationFile);

  // Read file to check for gallery marker
  const fileContent = await fs.readFile(locationPath, 'utf8');
  const galleryMarker = '*Add your photos here*';

  // If marker doesn't exist, add it first
  if (!fileContent.includes(galleryMarker)) {
    await fs.appendFile(locationPath, `\n${galleryMarker}\n\n`);
  }

  // Generate markdown entry
  const markdownEntry = photo.caption
    ? `![${photo.caption}](images/${newFilename})\n\n`
    : `![](images/${newFilename})\n\n`;

  // Append to file
  await fs.appendFile(locationPath, markdownEntry);
}

/**
 * Update all-synced-photos.md with new filenames
 */
async function updateSyncedPhotosMarkdown(tripId, photos) {
  const syncedPath = CONFIG.getSyncedPhotosPath(tripId);
  const content = await fs.readFile(syncedPath, 'utf8');

  let updatedContent = content;

  // Replace old filenames with new ones
  photos.forEach(photo => {
    if (photo.assigned && photo.newFilename) {
      // Replace: images/spain-2025-05.jpg → images/cordoba-03.jpg
      const oldRef = `images/${photo.currentFilename}`;
      const newRef = `images/${photo.newFilename}`;
      updatedContent = updatedContent.replace(new RegExp(oldRef, 'g'), newRef);
    }
  });

  await fs.writeFile(syncedPath, updatedContent);
  console.log(`\n✅ Updated ${syncedPath} with new filenames`);
}

/**
 * Initialize location photo counts by scanning existing files
 */
async function initializeLocationPhotoCounts(locations, tripId) {
  const imagesDir = CONFIG.getTripImagesDir(tripId);

  try {
    const existingFiles = await fs.readdir(imagesDir);

    for (const location of locations) {
      const locationPattern = new RegExp(`^${location.id}-(\\d+)\\.`, 'i');
      let maxNum = 0;

      for (const file of existingFiles) {
        const match = file.match(locationPattern);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxNum) {
            maxNum = num;
          }
        }
      }

      location.photoCount = maxNum;
    }
  } catch (err) {
    // Directory doesn't exist yet, that's fine
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }
}

/**
 * Interactive prompt helper
 */
function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Handle range assignment mode — prompt for range, find matching photos, assign batch.
 * Returns true if assignment proceeded, false if user input was invalid.
 */
async function handleRangeAssignment(photo, photos, locations, menu, tripId) {
  const currentPhotoNum = extractPhotoNumber(photo.currentFilename, tripId);

  if (currentPhotoNum === null) {
    console.log('❌ Cannot determine photo number from filename');
    return false;
  }

  const rangeInput = await prompt(
    `\nCurrent photo: ${photo.currentFilename} (photo #${currentPhotoNum})\n` +
    `Enter range by photo number (e.g., "${currentPhotoNum}-${currentPhotoNum + 4}"): `
  );
  const rangeMatch = rangeInput.match(/^(\d+)-(\d+)$/);

  if (!rangeMatch) {
    console.log('❌ Invalid range format. Use format like "8-12"');
    return false;
  }

  const startNum = parseInt(rangeMatch[1]);
  const endNum = parseInt(rangeMatch[2]);

  if (startNum > endNum) {
    console.log('❌ Invalid range. Start must be less than or equal to end.');
    return false;
  }

  const photosToAssign = findPhotosInRange(photos, startNum, endNum, tripId);

  if (photosToAssign.length === 0) {
    console.log('❌ No unassigned photos found in that range');
    return false;
  }

  const locationIdx = parseInt(await prompt(`Assign ${photosToAssign.length} photos to: ${menu}\n> `)) - 1;

  if (locationIdx < 0 || locationIdx >= locations.length) {
    console.log('❌ Invalid location');
    return false;
  }

  const targetLocation = locations[locationIdx];
  console.log(`\nAssigning ${photosToAssign.length} photos to ${targetLocation.id}...`);
  for (const p of photosToAssign) {
    await assignPhotoToLocation(p, targetLocation, tripId);
  }
  console.log(`✅ Assigned ${photosToAssign.length} photos to ${targetLocation.id}`);
  return true;
}

/**
 * Main interactive assignment loop
 */
async function runInteractiveAssignment(tripId) {
  const { locations } = await parseTripStructure(tripId);
  const photos = await parseSyncedPhotos(tripId);

  await initializeLocationPhotoCounts(locations, tripId);

  console.log(`📁 Trip: ${tripId} (${CONFIG.getTripDir(tripId)})`);
  console.log(`📝 Found ${photos.length} unassigned photos in all-synced-photos.md`);
  console.log(`📂 Found ${locations.length} locations: ${locations.map(l => l.id).join(', ')}\n`);

  if (photos.length === 0) {
    console.log('✅ All photos already assigned!');
    return;
  }

  const menu = locations
    .map((loc, idx) => `\x1b[1m\x1b[31m(${idx + 1})\x1b[0m ${loc.id}`)
    .join('  ');

  let photoIndex = 0;

  while (photoIndex < photos.length) {
    const photo = photos[photoIndex];

    if (photo.assigned) { photoIndex++; continue; }

    showThumbnail(photo, photoIndex + 1, photos.length, tripId);

    const answer = await prompt(
      `\nAssign to:\n  ${menu}\n  (s) skip  (r) range  (q) quit\n> `
    );

    if (answer === 'q') { console.log('\n👋 Exiting. Progress saved.'); break; }
    if (answer === 's') { console.log('⏭️  Skipped'); photoIndex++; continue; }

    if (answer === 'r') {
      await handleRangeAssignment(photo, photos, locations, menu, tripId);
      photoIndex++;
      continue;
    }

    // Single photo assignment
    const locationIdx = parseInt(answer) - 1;
    if (locationIdx < 0 || locationIdx >= locations.length) {
      console.log('❌ Invalid choice');
      continue;
    }

    await assignPhotoToLocation(photo, locations[locationIdx], tripId);
    photoIndex++;
  }

  const assignedPhotos = photos.filter(p => p.assigned);
  if (assignedPhotos.length > 0) {
    await updateSyncedPhotosMarkdown(tripId, photos);
  }

  console.log('\n✨ Assignment complete!\n');
  console.log('📊 Summary:');
  locations.forEach(loc => {
    if (loc.photoCount > 0) {
      console.log(`   ${loc.id}: ${loc.photoCount} photos`);
    }
  });
}

// CLI entry point
const tripId = process.argv[2];

if (!tripId) {
  console.error('Usage: npm run assign-photos <trip-id>');
  console.error('Example: npm run assign-photos spain-2025');
  process.exit(1);
}

runInteractiveAssignment(tripId).catch(err => {
  console.error(`\n❌ Error: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
