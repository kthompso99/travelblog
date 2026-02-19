/**
 * Shared utilities for Google Photos Takeout zip processing
 * Used by sync-takeout-photos.js and test-caption-detection.js
 */

const path = require('path');
const AdmZip = require('adm-zip');

const PHOTO_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.heic'];

/**
 * Generate all possible metadata file paths for a photo.
 * Google Takeout truncates long filenames in metadata, so Claude tries several suffixes.
 * For edited photos, also checks the original file's metadata.
 *
 * @param {string} photoPath - Path to photo file within the zip
 * @returns {Array<string>} Array of possible metadata paths to try
 */
function getPossibleMetadataPaths(photoPath) {
  const metadataSuffixes = [
    'supplemental-metadata.json',
    'supplemental-metada.json',
    'supplemental-meta.json',
    'supplemental-met.json',
    'supplemental-m.json',
    'supplemen.json',
    'json'
  ];

  const paths = [];

  for (const suffix of metadataSuffixes) {
    paths.push(`${photoPath}.${suffix}`);
  }

  if (photoPath.includes('-edited.')) {
    const originalPath = photoPath.replace('-edited.', '.');
    for (const suffix of metadataSuffixes) {
      paths.push(`${originalPath}.${suffix}`);
    }
  }

  if (photoPath.includes('original_') && photoPath.match(/_P(\(\d+\))?\.(jpg|jpeg|png)$/i)) {
    const basePath = photoPath.replace(/_P(\(\d+\))?\.(jpg|jpeg|png)$/i, '_');
    paths.push(`${basePath}.json`);
  }

  return paths;
}

/**
 * Open a Takeout zip file and catalog photos and metadata entries.
 *
 * @param {string} zipPath - Path to zip file on disk
 * @returns {{ zip: AdmZip, photos: Object, metadata: Object }}
 */
function catalogZipContents(zipPath) {
  console.log('📦 Opening Takeout ZIP...');
  const zip = new AdmZip(zipPath);
  const zipEntries = zip.getEntries();

  const photos = {};
  const metadata = {};

  zipEntries.forEach(entry => {
    if (entry.isDirectory) return;

    const ext = path.extname(entry.entryName).toLowerCase();
    if (ext === '.json') {
      metadata[entry.entryName] = entry;
    } else if (PHOTO_EXTENSIONS.includes(ext)) {
      photos[entry.entryName] = entry;
    }
  });

  console.log(`🔍 Found ${Object.keys(photos).length} photos and ${Object.keys(metadata).length} JSON files.`);

  if (Object.keys(photos).length === 0) {
    throw new Error('No photos found in zip');
  }

  return { zip, photos, metadata };
}

/**
 * Detect the album folder inside a Takeout zip.
 * Takeout structure: Takeout/Google Photos/{Album Name}/{photos + json}
 *
 * @param {Object} photos - Map of photo entry names from catalogZipContents
 * @returns {string} Album folder path
 */
function detectAlbumFolder(photos) {
  const albumFolders = new Set();
  Object.keys(photos).forEach(photoPath => {
    const dir = path.dirname(photoPath);
    if (dir !== '.' && dir !== 'Takeout') {
      albumFolders.add(dir);
    }
  });

  if (albumFolders.size === 0) {
    throw new Error('No album folders found in zip');
  }

  if (albumFolders.size > 1) {
    console.warn(`⚠️  Multiple album folders found: ${Array.from(albumFolders).join(', ')}`);
    console.warn('   Using first folder. To sync multiple albums, run script separately for each zip.');
  }

  const albumFolder = Array.from(albumFolders)[0];
  console.log(`📂 Album folder: ${albumFolder}`);
  return albumFolder;
}

/**
 * Filter photos to an album folder and prefer edited versions over originals.
 * If both photo.jpg and photo-edited.jpg exist, keeps only the edited version.
 *
 * @param {Object} photos - Map of photo entry names from catalogZipContents
 * @param {string} albumFolder - Album folder path from detectAlbumFolder
 * @returns {Array<string>} Filtered and sorted photo paths
 */
function filterAlbumPhotos(photos, albumFolder) {
  let albumPhotos = Object.keys(photos)
    .filter(p => p.startsWith(albumFolder))
    .sort();

  const editedPhotos = new Set(
    albumPhotos
      .filter(p => p.includes('-edited.'))
      .map(p => p.replace('-edited.', '.'))
  );

  albumPhotos = albumPhotos.filter(p => {
    if (editedPhotos.has(p) && !p.includes('-edited.')) {
      console.log(`⏭️  Skipping ${path.basename(p)} (edited version exists)`);
      return false;
    }
    return true;
  });

  console.log(`📸 Processing ${albumPhotos.length} photos from album...`);
  return albumPhotos;
}

module.exports = {
  getPossibleMetadataPaths,
  catalogZipContents,
  detectAlbumFolder,
  filterAlbumPhotos
};
