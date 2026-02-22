#!/usr/bin/env node

/**
 * Image Optimization Script
 * Optimizes images for web using ImageMagick
 * - Resizes to max 1800px width (maintains aspect ratio)
 * - Compresses to 85% JPEG quality
 * - Backs up originals to .originals/ subdirectory
 * - Strips EXIF metadata for privacy and smaller files
 *
 * Usage:
 *   npm run optimize:images              # Optimize all images
 *   npm run optimize:images -- --dry-run # Preview what would happen
 *   npm run optimize:images -- --force   # Re-optimize already-optimized images
 *   npm run optimize:images -- spain     # Optimize only Spain trip
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONFIG = require('../../lib/config-paths');
const { discoverAllTrips, ensureDir, getFileSize } = require('../../lib/build-utilities');

// Configuration
const MAX_WIDTH = 1800;          // Max width in pixels (for 600px CSS @ 3x retina)
const JPEG_QUALITY = 85;         // 85% quality (good balance of quality/size)
const BACKUP_DIR = '.originals'; // Backup directory name

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isForce = args.includes('--force');
const specificTrip = args.find(arg => !arg.startsWith('--'));

// Statistics
let stats = {
  totalFiles: 0,
  optimizedFiles: 0,
  skippedFiles: 0,
  alreadyOptimized: 0,
  totalSizeBefore: 0,
  totalSizeAfter: 0,
  errors: []
};

/**
 * Check if ImageMagick is installed
 */
function checkImageMagick() {
  try {
    execSync('which magick || which convert', { stdio: 'pipe' });
    return true;
  } catch (e) {
    console.error('❌ ImageMagick not found. Install with: brew install imagemagick');
    process.exit(1);
  }
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Get all trip directories
 */
function getTripDirs() {
  if (specificTrip) {
    const tripDir = path.join(CONFIG.TRIPS_DIR, specificTrip);
    if (!fs.existsSync(tripDir)) {
      console.error(`❌ Trip directory not found: ${tripDir}`);
      process.exit(1);
    }
    return [tripDir];
  }

  const tripIds = discoverAllTrips(CONFIG.TRIPS_DIR, id => CONFIG.getTripConfigPath(id));
  return tripIds.map(id => path.join(CONFIG.TRIPS_DIR, id));
}

/**
 * Get all image files in a directory
 */
function getImageFiles(imagesDir) {
  if (!fs.existsSync(imagesDir)) {
    return [];
  }

  return fs.readdirSync(imagesDir)
    .filter(file => /\.(jpe?g|png)$/i.test(file))
    .map(file => path.join(imagesDir, file));
}

/**
 * Check if image has already been optimized
 */
function isAlreadyOptimized(imagePath, backupDir) {
  const filename = path.basename(imagePath);
  const backupPath = path.join(backupDir, filename);
  return fs.existsSync(backupPath);
}

/**
 * Optimize a single image
 */
function optimizeImage(imagePath, backupDir) {
  const filename = path.basename(imagePath);
  const backupPath = path.join(backupDir, filename);

  // Check if already optimized (backup exists)
  if (!isForce && isAlreadyOptimized(imagePath, backupDir)) {
    stats.alreadyOptimized++;
    return { skipped: true, reason: 'already optimized' };
  }

  // Get original size
  const sizeBefore = getFileSize(imagePath);
  stats.totalSizeBefore += sizeBefore;

  if (isDryRun) {
    console.log(`  [DRY RUN] Would optimize: ${filename} (${formatBytes(sizeBefore)})`);
    stats.optimizedFiles++;
    return { skipped: false };
  }

  try {
    // Create backup directory if it doesn't exist
    ensureDir(backupDir);

    // Backup original (only if not already backed up)
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(imagePath, backupPath);
    }

    // Optimize with ImageMagick
    // -resize: Only shrink images larger than MAX_WIDTH (maintains aspect ratio)
    // -quality: JPEG compression quality
    // -strip: Remove EXIF metadata for privacy and smaller files
    execSync(
      `magick "${imagePath}" -resize "${MAX_WIDTH}x${MAX_WIDTH}>" -quality ${JPEG_QUALITY} -strip "${imagePath}"`,
      { stdio: 'pipe' }
    );

    // Get optimized size
    const sizeAfter = getFileSize(imagePath);
    stats.totalSizeAfter += sizeAfter;

    const savings = ((sizeBefore - sizeAfter) / sizeBefore * 100).toFixed(1);
    const savedBytes = sizeBefore - sizeAfter;

    console.log(`  ✅ ${filename}: ${formatBytes(sizeBefore)} → ${formatBytes(sizeAfter)} (saved ${savings}% / ${formatBytes(savedBytes)})`);

    stats.optimizedFiles++;
    return { skipped: false };

  } catch (error) {
    console.error(`  ❌ Error optimizing ${filename}: ${error.message}`);
    stats.errors.push({ file: filename, error: error.message });
    stats.skippedFiles++;
    return { skipped: true, reason: 'error' };
  }
}

/**
 * Optimize all images in a trip
 */
function optimizeTrip(tripDir) {
  const tripName = path.basename(tripDir);
  const imagesDir = path.join(tripDir, 'images');
  const backupDir = path.join(imagesDir, BACKUP_DIR);

  const imageFiles = getImageFiles(imagesDir);

  if (imageFiles.length === 0) {
    return;
  }

  console.log(`\n📸 Processing: ${tripName} (${imageFiles.length} images)`);

  imageFiles.forEach(imagePath => {
    stats.totalFiles++;
    optimizeImage(imagePath, backupDir);
  });
}

/**
 * Main execution
 */
function main() {
  console.log('🖼️  Image Optimization Tool\n');

  // Check ImageMagick
  checkImageMagick();

  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No files will be modified\n');
  }

  if (isForce) {
    console.log('⚡ FORCE MODE - Re-optimizing all images\n');
  }

  // Get trip directories
  const tripDirs = getTripDirs();
  console.log(`📁 Found ${tripDirs.length} trip(s)\n`);

  // Optimize each trip
  tripDirs.forEach(optimizeTrip);

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total images:        ${stats.totalFiles}`);
  console.log(`Optimized:           ${stats.optimizedFiles}`);
  console.log(`Already optimized:   ${stats.alreadyOptimized}`);
  console.log(`Skipped (errors):    ${stats.skippedFiles}`);

  if (!isDryRun && stats.optimizedFiles > 0) {
    const totalSavings = stats.totalSizeBefore - stats.totalSizeAfter;
    const savingsPercent = ((totalSavings / stats.totalSizeBefore) * 100).toFixed(1);

    console.log(`\nSize before:         ${formatBytes(stats.totalSizeBefore)}`);
    console.log(`Size after:          ${formatBytes(stats.totalSizeAfter)}`);
    console.log(`Total saved:         ${formatBytes(totalSavings)} (${savingsPercent}%)`);
  }

  if (stats.errors.length > 0) {
    console.log('\n⚠️  Errors encountered:');
    stats.errors.forEach(({ file, error }) => {
      console.log(`   - ${file}: ${error}`);
    });
  }

  console.log('\n✨ Done!\n');

  if (isDryRun) {
    console.log('💡 Run without --dry-run to optimize images');
  } else if (stats.optimizedFiles > 0) {
    console.log('💡 Original images backed up to: content/trips/*/images/.originals/');
  }
}

// Run the script
main();
