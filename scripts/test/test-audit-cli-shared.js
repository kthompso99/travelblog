#!/usr/bin/env node

/**
 * Unit tests for scripts/audit/audit-cli-shared.js
 * Tests CLI argument parsing and content preparation functions.
 * Does NOT test batch execution or API calls.
 */

'use strict';

import fs from 'fs';
import path from 'path';
import { createTestRunner } from './test-helpers.js';
import { parseCLIArgs, prepareAuditContent } from '../audit/audit-cli-shared.js';

const { assert, report } = createTestRunner('🔧 Audit CLI shared utilities unit tests');

// ── parseCLIArgs ────────────────────────────────────────────

// Named flags (supported flags array)
const result1 = parseCLIArgs(['node', 'script.mjs', '--provider', 'opus'], ['provider']);
assert('parseCLIArgs: provider flag value', result1.flags.provider === 'opus');
assert('parseCLIArgs: no positional args when only flags', result1.args.length === 0);

const result2 = parseCLIArgs(['node', 'script.mjs', '--provider', 'sonnet'], ['provider']);
assert('parseCLIArgs: provider flag different value', result2.flags.provider === 'sonnet');

const result3 = parseCLIArgs(['node', 'script.mjs', '--audit-dir', 'custom'], ['auditDir']);
assert('parseCLIArgs: audit-dir flag', result3.flags.auditDir === 'custom');

const result4 = parseCLIArgs(['node', 'script.mjs', '--provider', 'opus', '--audit-dir', 'custom'], ['provider', 'auditDir']);
assert('parseCLIArgs: multiple supported flags',
    result4.flags.provider === 'opus' && result4.flags.auditDir === 'custom');

// Positional arguments
const result5 = parseCLIArgs(['node', 'script.mjs', 'greece/paros']);
assert('parseCLIArgs: single positional arg', result5.args[0] === 'greece/paros');

const result6 = parseCLIArgs(['node', 'script.mjs', 'spain/cordoba', 'greece/paros']);
assert('parseCLIArgs: multiple positional args',
    result6.args[0] === 'spain/cordoba' && result6.args[1] === 'greece/paros');

// Combined flags and positional args
const result7 = parseCLIArgs(['node', 'script.mjs', '--provider', 'opus', 'greece/paros'], ['provider']);
assert('parseCLIArgs: mixed flags and args',
    result7.flags.provider === 'opus' && result7.args[0] === 'greece/paros');

// Edge cases
const result8 = parseCLIArgs(['node', 'script.mjs'], []);
assert('parseCLIArgs: no flags or args', Object.keys(result8.flags).length === 0 && result8.args.length === 0);

const result9 = parseCLIArgs(['node', 'script.mjs', '--unknown-flag', 'value'], ['provider']);
assert('parseCLIArgs: unknown flag ignored', !result9.flags.unknown);

const result10 = parseCLIArgs(['node', 'script.mjs', '--provider', 'opus'], []);
assert('parseCLIArgs: unsupported flag ignored', !result10.flags.provider);

// ── prepareAuditContent ─────────────────────────────────────

// prepareAuditContent requires a real trip file structure to work properly.
// We'll test with an actual existing trip file if available, otherwise skip these tests.

const testTripDir = 'content/trips/greece';
const testLocationFile = path.join(testTripDir, 'paros.md');
const testArticleFile = path.join(testTripDir, 'tips.md');

if (fs.existsSync(testLocationFile)) {
    const locResult = prepareAuditContent(testLocationFile);
    assert('prepareAuditContent: returns object with required properties',
        locResult.content && locResult.contentType && locResult.context);
    assert('prepareAuditContent: content is string',
        typeof locResult.content === 'string' && locResult.content.length > 0);
    assert('prepareAuditContent: contentType is location',
        locResult.contentType === 'location');
    assert('prepareAuditContent: context has editorialStandards',
        typeof locResult.context.editorialStandards === 'string');
    assert('prepareAuditContent: context has brandIdentity',
        typeof locResult.context.brandIdentity === 'string');
    assert('prepareAuditContent: context has antiAIGuidelines',
        typeof locResult.context.antiAIGuidelines === 'string');
}

if (fs.existsSync(testArticleFile)) {
    const artResult = prepareAuditContent(testArticleFile);
    assert('prepareAuditContent: article type detected',
        artResult.contentType === 'article');
    assert('prepareAuditContent: article has prefix',
        artResult.content.startsWith('[Content type: article'));
}

// Test with non-existent file (should throw)
let didThrow = false;
try {
    prepareAuditContent('content/trips/nonexistent/fake.md');
} catch (e) {
    didThrow = true;
}
assert('prepareAuditContent: throws on missing file', didThrow);

process.exit(report());
