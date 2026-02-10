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
const CONFIG = require('./config-paths');

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
 * Parse all-synced-photos.md to extract photo list
 */
async function parseSyncedPhotos(tripId) {
  const syncedPath = CONFIG.getSyncedPhotosPath(tripId);
  const content = await fs.readFile(syncedPath, 'utf8');

  const photos = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match: <!-- Photo ID: ... -->
    const idMatch = line.match(/<!-- Photo ID: (.+?) -->/);
    if (idMatch) {
      const photoId = idMatch[1];

      // Next line(s) contain image markdown - may span multiple lines for long captions
      let imgMarkdown = '';
      let lineOffset = 1;

      // Keep reading lines until we find the complete image markdown with closing )
      while (i + lineOffset < lines.length) {
        const currentLine = lines[i + lineOffset];
        imgMarkdown += (imgMarkdown ? '\n' : '') + currentLine;

        // Check if we've found the complete markdown with closing parenthesis
        if (currentLine.includes('](images/')) {
          break;
        }

        lineOffset++;
      }

      // Parse the complete (possibly multiline) markdown using [\s\S] to match newlines
      const imgMatch = imgMarkdown.match(/!\[([\s\S]*?)\]\(images\/(.+?)\)/);

      if (imgMatch) {
        const currentFilename = imgMatch[2];

        // Skip photos that have already been assigned (renamed from tripId-XX.jpg pattern)
        const unassignedPattern = new RegExp(`^${tripId}-\\d+\\.(jpg|jpeg|png|heic)$`, 'i');
        if (!unassignedPattern.test(currentFilename)) {
          // Already assigned (e.g., cordoba-01.jpg, seville-02.jpg)
          continue;
        }

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
          continue;
        }
      }
    }
  }

  return photos;
}

/**
 * Display photo thumbnail (iTerm2)
 */
function showThumbnail(photo, index, total, tripId) {
  // Extract photo number from filename (e.g., "spain-2025-08.jpg" -> 8)
  const photoNumMatch = photo.currentFilename.match(new RegExp(`${tripId}-(\\d+)\\.`));
  const photoNum = photoNumMatch ? `#${photoNumMatch[1]}` : '';

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
 * Main interactive assignment loop
 */
async function runInteractiveAssignment(tripId) {
  const { trip, locations } = await parseTripStructure(tripId);
  const photos = await parseSyncedPhotos(tripId);

  // Initialize photo counts from existing files to prevent overwriting
  await initializeLocationPhotoCounts(locations, tripId);

  console.log(`📁 Trip: ${tripId} (${CONFIG.getTripDir(tripId)})`);
  console.log(`📝 Found ${photos.length} unassigned photos in all-synced-photos.md`);
  console.log(`📂 Found ${locations.length} locations: ${locations.map(l => l.id).join(', ')}\n`);

  if (photos.length === 0) {
    console.log('✅ All photos already assigned!');
    return;
  }

  let photoIndex = 0;

  while (photoIndex < photos.length) {
    const photo = photos[photoIndex];

    // Skip if already assigned (shouldn't happen, but safety check)
    if (photo.assigned) {
      photoIndex++;
      continue;
    }

    // Show thumbnail
    showThumbnail(photo, photoIndex + 1, photos.length, tripId);

    // Build location menu with color-coded numbers
    const menu = locations
      .map((loc, idx) => `\x1b[1m\x1b[31m(${idx + 1})\x1b[0m ${loc.id}`)
      .join('  ');

    const answer = await prompt(
      `\nAssign to:\n  ${menu}\n  (s) skip  (r) range  (q) quit\n> `
    );

    // Handle quit
    if (answer === 'q') {
      console.log('\n👋 Exiting. Progress saved.');
      break;
    }

    // Handle skip
    if (answer === 's') {
      console.log('⏭️  Skipped');
      photoIndex++;
      continue;
    }

    // Handle range mode
    if (answer === 'r') {
      // Extract current photo number from filename (e.g., "spain-2025-08.jpg" -> 8)
      const currentFilename = photo.currentFilename;
      const currentPhotoNumMatch = currentFilename.match(new RegExp(`${tripId}-(\\d+)\\.`));
      const currentPhotoNum = currentPhotoNumMatch ? parseInt(currentPhotoNumMatch[1]) : null;

      if (!currentPhotoNum) {
        console.log('❌ Cannot determine photo number from filename');
        continue;
      }

      const rangeInput = await prompt(`\nCurrent photo: ${currentFilename} (photo #${currentPhotoNum})\nEnter range by photo number (e.g., "${currentPhotoNum}-${currentPhotoNum + 4}"): `);
      const rangeMatch = rangeInput.match(/^(\d+)-(\d+)$/);

      if (!rangeMatch) {
        console.log('❌ Invalid range format. Use format like "8-12"');
        continue;
      }

      const startPhotoNum = parseInt(rangeMatch[1]);
      const endPhotoNum = parseInt(rangeMatch[2]);

      if (startPhotoNum > endPhotoNum) {
        console.log('❌ Invalid range. Start must be less than or equal to end.');
        continue;
      }

      // Find photos by their sequence numbers
      const photosToAssign = [];
      for (const p of photos) {
        if (p.assigned) continue;

        const photoNumMatch = p.currentFilename.match(new RegExp(`${tripId}-(\\d+)\\.`));
        if (photoNumMatch) {
          const photoNum = parseInt(photoNumMatch[1]);
          if (photoNum >= startPhotoNum && photoNum <= endPhotoNum) {
            photosToAssign.push(p);
          }
        }
      }

      if (photosToAssign.length === 0) {
        console.log('❌ No unassigned photos found in that range');
        continue;
      }

      const count = photosToAssign.length;
      const locationIdx = parseInt(await prompt(`Assign ${count} photos to: ${menu}\n> `)) - 1;

      if (locationIdx < 0 || locationIdx >= locations.length) {
        console.log('❌ Invalid location');
        continue;
      }

      const targetLocation = locations[locationIdx];

      // Assign batch
      console.log(`\nAssigning ${count} photos to ${targetLocation.id}...`);
      for (const p of photosToAssign) {
        await assignPhotoToLocation(p, targetLocation, tripId);
      }

      console.log(`✅ Assigned ${count} photos to ${targetLocation.id}`);

      // Continue from current position
      photoIndex++;
      continue;
    }

    // Handle single photo assignment
    const locationIdx = parseInt(answer) - 1;

    if (locationIdx < 0 || locationIdx >= locations.length) {
      console.log('❌ Invalid choice');
      continue;
    }

    const targetLocation = locations[locationIdx];
    await assignPhotoToLocation(photo, targetLocation, tripId);

    photoIndex++;
  }

  // Update all-synced-photos.md with new filenames
  const assignedPhotos = photos.filter(p => p.assigned);
  if (assignedPhotos.length > 0) {
    await updateSyncedPhotosMarkdown(tripId, photos);
  }

  console.log('\n✨ Assignment complete!\n');

  // Summary
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
  console.error('Usage: node lib/assign-photos.js <trip-id>');
  console.error('Example: node lib/assign-photos.js spain-2025');
  process.exit(1);
}

runInteractiveAssignment(tripId).catch(err => {
  console.error(`\n❌ Error: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
