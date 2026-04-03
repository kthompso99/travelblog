#!/usr/bin/env node

/**
 * Validate image references in markdown files.
 * Checks that every ![...](path) reference points to a file that exists
 * on disk with exact case match (catches macOS/Linux mismatches).
 *
 * Usage:
 *   node scripts/validate-images.js                              # all .md files in content/trips/
 *   node scripts/validate-images.js content/trips/greece/milos.md # specific files
 */

import fs from 'fs';
import path from 'path';
import { readTextFile } from '../lib/build-utilities.js';

const TRIPS_DIR = 'content/trips';

// Regex: captures the path from ![alt](path)
const IMAGE_REF = /!\[[^\]]*\]\(([^)]+)\)/g;

// ==============================
// Discover markdown files
// ==============================

function discoverMarkdownFiles() {
  const files = [];
  const trips = fs.readdirSync(TRIPS_DIR).filter(d =>
    fs.statSync(path.join(TRIPS_DIR, d)).isDirectory()
  );
  for (const trip of trips) {
    const tripDir = path.join(TRIPS_DIR, trip);
    const mdFiles = fs.readdirSync(tripDir).filter(f => f.endsWith('.md'));
    for (const md of mdFiles) {
      files.push(path.join(tripDir, md));
    }
  }
  return files;
}

// ==============================
// Case-sensitive file existence
// ==============================

// Cache directory listings to avoid repeated readdirSync calls
const dirCache = {};

function dirEntries(dir) {
  if (!dirCache[dir]) {
    try {
      dirCache[dir] = new Set(fs.readdirSync(dir));
    } catch {
      dirCache[dir] = new Set();
    }
  }
  return dirCache[dir];
}

function existsCaseSensitive(filePath) {
  // Walk each component of the path to verify exact case match.
  // This catches macOS case-insensitive filesystem mismatches.
  const resolved = path.resolve(filePath);
  const parts = resolved.split(path.sep).filter(Boolean);

  let current = path.sep;
  for (const part of parts) {
    const entries = dirEntries(current);
    if (!entries.has(part)) return false;
    current = path.join(current, part);
  }
  return true;
}

// ==============================
// Validate one file
// ==============================

function validateFile(filePath) {
  const errors = [];
  const content = readTextFile(filePath);
  const lines = content.split('\n');
  const mdDir = path.dirname(filePath);

  for (let i = 0; i < lines.length; i++) {
    let match;
    IMAGE_REF.lastIndex = 0;
    while ((match = IMAGE_REF.exec(lines[i])) !== null) {
      const ref = match[1];

      // Skip external URLs
      if (ref.startsWith('http://') || ref.startsWith('https://')) continue;

      const resolved = path.join(mdDir, ref);

      if (!existsCaseSensitive(resolved)) {
        // Distinguish "missing entirely" vs "case mismatch"
        const dir = path.dirname(resolved);
        const base = path.basename(resolved);
        const entries = dirEntries(dir);
        const caseMatch = [...entries].find(e => e.toLowerCase() === base.toLowerCase());

        if (caseMatch) {
          errors.push(`  ${filePath}:${i + 1}  case mismatch: "${ref}" (actual: "${caseMatch}")`);
        } else {
          errors.push(`  ${filePath}:${i + 1}  missing: "${ref}"`);
        }
      }
    }
  }

  return errors;
}

// ==============================
// Main
// ==============================

const args = process.argv.slice(2);
const files = args.length > 0 ? args : discoverMarkdownFiles();

let allErrors = [];
for (const file of files) {
  if (!fs.existsSync(file)) {
    allErrors.push(`  ${file}  file not found`);
    continue;
  }
  allErrors = allErrors.concat(validateFile(file));
}

if (allErrors.length > 0) {
  console.error(`\n❌ Broken image references found:\n`);
  allErrors.forEach(e => console.error(e));
  console.error('');
  process.exit(1);
} else {
  console.log(`✅ All image references valid (${files.length} files checked)`);
}
