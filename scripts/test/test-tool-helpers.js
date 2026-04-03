#!/usr/bin/env node

/**
 * Unit tests for scripts/tools/tool-helpers.js
 * Tests CLI argument parsing, file collection, and validation functions.
 */

'use strict';

import { createTestRunner } from './test-helpers.js';
import { parseToolArgs, collectContentFiles, validateToolArgs } from '../tools/tool-helpers.js';

const { assert, report } = createTestRunner('🧰 Tool helpers unit tests');

// ── parseToolArgs ───────────────────────────────────────────

// Boolean flags
const result1 = parseToolArgs(['node', 'script.js', '--dry-run'], {
    booleanFlags: ['--dry-run']
});
assert('parseToolArgs: boolean flag present', result1.flags.dryrun === true);
assert('parseToolArgs: no trip filter', result1.tripFilter === null);

const result2 = parseToolArgs(['node', 'script.js'], {
    booleanFlags: ['--dry-run']
});
assert('parseToolArgs: boolean flag absent', result2.flags.dryrun === false);

const result3 = parseToolArgs(['node', 'script.js', '--wordcount', '--verbose'], {
    booleanFlags: ['--wordcount', '--verbose']
});
assert('parseToolArgs: multiple boolean flags',
    result3.flags.wordcount === true && result3.flags.verbose === true);

// Trip filter (single positional arg)
const result4 = parseToolArgs(['node', 'script.js', 'greece'], {
    allowTripFilePattern: false
});
assert('parseToolArgs: trip filter only', result4.tripFilter === 'greece');
assert('parseToolArgs: no file filter when pattern disabled', result4.fileFilter === null);

// Trip/file pattern
const result5 = parseToolArgs(['node', 'script.js', 'greece/paros'], {
    allowTripFilePattern: true
});
assert('parseToolArgs: trip/file pattern - trip', result5.tripFilter === 'greece');
assert('parseToolArgs: trip/file pattern - file with auto .md', result5.fileFilter === 'paros.md');

const result6 = parseToolArgs(['node', 'script.js', 'greece/paros.md'], {
    allowTripFilePattern: true
});
assert('parseToolArgs: trip/file pattern - file with .md', result6.fileFilter === 'paros.md');

const result7 = parseToolArgs(['node', 'script.js', 'spain'], {
    allowTripFilePattern: true
});
assert('parseToolArgs: trip only with pattern enabled', result7.tripFilter === 'spain');
assert('parseToolArgs: no file filter when no slash', result7.fileFilter === null);

// Combined: flags + trip filter
const result8 = parseToolArgs(['node', 'script.js', '--dry-run', 'greece'], {
    booleanFlags: ['--dry-run'],
    allowTripFilePattern: false
});
assert('parseToolArgs: flag + trip filter',
    result8.flags.dryrun === true && result8.tripFilter === 'greece');

const result9 = parseToolArgs(['node', 'script.js', 'greece/paros', '--dry-run'], {
    booleanFlags: ['--dry-run'],
    allowTripFilePattern: true
});
assert('parseToolArgs: trip/file + flag (order 1)',
    result9.tripFilter === 'greece' && result9.fileFilter === 'paros.md' && result9.flags.dryrun === true);

const result10 = parseToolArgs(['node', 'script.js', '--dry-run', 'greece/paros'], {
    booleanFlags: ['--dry-run'],
    allowTripFilePattern: true
});
assert('parseToolArgs: flag + trip/file (order 2)',
    result10.tripFilter === 'greece' && result10.fileFilter === 'paros.md' && result10.flags.dryrun === true);

// Named flags (for future extensibility)
const result11 = parseToolArgs(['node', 'script.js', '--provider', 'opus'], {
    namedFlags: ['--provider']
});
assert('parseToolArgs: named flag value', result11.flags.provider === 'opus');

const result12 = parseToolArgs(['node', 'script.js', '--provider', 'sonnet', '--output', 'file.json'], {
    namedFlags: ['--provider', '--output']
});
assert('parseToolArgs: multiple named flags',
    result12.flags.provider === 'sonnet' && result12.flags.output === 'file.json');

// Edge cases
const result13 = parseToolArgs(['node', 'script.js'], {
    booleanFlags: ['--dry-run']
});
assert('parseToolArgs: no args provided',
    result13.tripFilter === null && result13.fileFilter === null && result13.flags.dryrun === false);

const result14 = parseToolArgs(['node', 'script.js', '--unknown-flag'], {
    booleanFlags: ['--dry-run']
});
assert('parseToolArgs: unknown flag ignored', result14.flags.dryrun === false);

// ── collectContentFiles ─────────────────────────────────────

// Note: collectContentFiles depends on actual filesystem and discoverAllTrips,
// so we test basic functionality assuming at least one trip exists.

const files1 = collectContentFiles();
assert('collectContentFiles: returns array', Array.isArray(files1));
assert('collectContentFiles: items have required properties',
    files1.length === 0 || (files1[0].tripId && files1[0].file && files1[0].path));

const files2 = collectContentFiles('nonexistent-trip');
assert('collectContentFiles: nonexistent trip returns empty', files2.length === 0);

const files3 = collectContentFiles(null, 'nonexistent.md');
assert('collectContentFiles: nonexistent file filter returns empty', files3.length === 0);

// If greece trip exists with paros.md, this should work (but we can't guarantee in test env)
// So we just test that it doesn't crash
const files4 = collectContentFiles('greece', 'paros.md');
assert('collectContentFiles: trip + file filter does not crash', Array.isArray(files4));

// ── validateToolArgs ────────────────────────────────────────

// validateToolArgs calls process.exit on failure, which would kill the test runner.
// We can't easily test the failure path without mocking process.exit.
// Instead, we test that valid args don't throw.

let didThrow = false;
try {
    validateToolArgs({ tripFilter: 'greece' }, { requireTrip: true });
} catch (e) {
    didThrow = true;
}
assert('validateToolArgs: valid trip does not throw', !didThrow);

// Test that it doesn't throw when trip not required
try {
    validateToolArgs({ tripFilter: null }, { requireTrip: false });
} catch (e) {
    didThrow = true;
}
assert('validateToolArgs: null trip allowed when not required', !didThrow);

// We can't test the process.exit case without more sophisticated mocking,
// but the above tests confirm the happy path works.

process.exit(report());
