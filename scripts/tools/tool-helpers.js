/**
 * Shared utilities for tool scripts
 *
 * Provides consistent CLI argument parsing, file discovery, and validation
 * across all scripts in scripts/tools/.
 */

const fs = require('fs');
const path = require('path');
const CONFIG = require('../../lib/config-paths.js');
const { discoverAllTrips } = require('../../lib/build-utilities.js');

/**
 * Parse CLI arguments for tool scripts.
 *
 * Supports:
 * - Boolean flags: --dry-run, --wordcount, --verbose
 * - Named flags: --provider opus (not yet used in tools, but supported)
 * - Trip filter: greece (processes all files in greece/)
 * - Trip/file pattern: greece/paros or greece/paros.md
 *
 * @param {string[]} argv - process.argv
 * @param {Object} options - Parsing configuration
 * @param {string[]} [options.booleanFlags] - Flags like --dry-run, --wordcount
 * @param {string[]} [options.namedFlags] - Flags with values like --provider opus
 * @param {boolean} [options.allowTripFilePattern] - Support trip/file.md syntax
 * @returns {Object} { tripFilter, fileFilter, flags: { dryRun, wordcount, ... } }
 *
 * @example
 * const { tripFilter, fileFilter, flags } = parseToolArgs(process.argv, {
 *   booleanFlags: ['--dry-run'],
 *   allowTripFilePattern: true
 * });
 * // Input: node script.js greece/paros --dry-run
 * // Output: { tripFilter: 'greece', fileFilter: 'paros.md', flags: { dryRun: true } }
 */
function parseToolArgs(argv, options = {}) {
  const args = argv.slice(2);
  const flags = {};

  // Parse boolean flags (--dry-run, --wordcount, etc.)
  for (const flag of options.booleanFlags || []) {
    const flagName = flag.replace('--', '').replace(/-/g, '');
    flags[flagName] = args.includes(flag);
  }

  // Parse named flags (--provider opus, --output file.json, etc.)
  for (const flag of options.namedFlags || []) {
    const idx = args.indexOf(flag);
    if (idx !== -1 && args[idx + 1]) {
      const flagName = flag.replace('--', '').replace(/-/g, '');
      flags[flagName] = args[idx + 1];
    }
  }

  // Parse positional arguments (trip or trip/file pattern)
  const positional = args.filter(a => !a.startsWith('--'));
  let tripFilter = null;
  let fileFilter = null;

  if (positional.length > 0 && options.allowTripFilePattern) {
    const arg = positional[0];
    if (arg.includes('/')) {
      const parts = arg.split('/');
      tripFilter = parts[0];
      // Normalize file extension (.md is optional in CLI)
      fileFilter = parts[1].endsWith('.md') ? parts[1] : parts[1] + '.md';
    } else {
      tripFilter = arg;
    }
  } else if (positional.length > 0) {
    tripFilter = positional[0];
  }

  return { tripFilter, fileFilter, flags };
}

/**
 * Collect content files based on trip/file filters.
 *
 * Discovers all trips, filters by tripFilter if provided, then collects
 * all .md files (excluding main.md) and filters by fileFilter if provided.
 *
 * @param {string|null} tripFilter - Trip slug to filter (e.g., "greece")
 * @param {string|null} fileFilter - Filename to filter (e.g., "paros.md")
 * @returns {Array<{tripId: string, file: string, path: string}>} Array of file metadata
 *
 * @example
 * const files = collectContentFiles('greece', 'paros.md');
 * // Returns: [{ tripId: 'greece', file: 'paros.md', path: '/full/path/to/greece/paros.md' }]
 *
 * const allFiles = collectContentFiles();
 * // Returns all .md files from all trips (excluding main.md)
 */
function collectContentFiles(tripFilter = null, fileFilter = null) {
  const tripIds = discoverAllTrips(CONFIG.TRIPS_DIR, (id) => CONFIG.getTripConfigPath(id));
  const files = [];

  for (const tripId of tripIds) {
    if (tripFilter && tripId !== tripFilter) continue;

    const tripDir = CONFIG.getTripDir(tripId);

    if (!fs.existsSync(tripDir)) continue;

    const mdFiles = fs.readdirSync(tripDir)
      .filter(f => f.endsWith('.md') && f !== 'main.md');

    for (const file of mdFiles) {
      if (fileFilter && file !== fileFilter) continue;
      files.push({
        tripId,
        file,
        path: path.join(tripDir, file)
      });
    }
  }

  return files;
}

/**
 * Validate parsed arguments and exit with usage message if invalid.
 *
 * @param {Object} parsed - Result from parseToolArgs()
 * @param {Object} requirements - Validation rules
 * @param {boolean} [requirements.requireTrip] - Trip filter is required
 * @param {string} [requirements.usageMessage] - Message to show on error
 *
 * @example
 * const { tripFilter } = parseToolArgs(process.argv, { allowTripFilePattern: false });
 * validateToolArgs({ tripFilter }, {
 *   requireTrip: true,
 *   usageMessage: 'Usage: node assign-photos.js <tripId>'
 * });
 */
function validateToolArgs(parsed, requirements = {}) {
  if (requirements.requireTrip && !parsed.tripFilter) {
    console.error(requirements.usageMessage || 'Error: Trip argument required');
    process.exit(1);
  }
}

module.exports = {
  parseToolArgs,
  collectContentFiles,
  validateToolArgs
};
