#!/usr/bin/env node

/**
 * Unit tests for scripts/audit/audit-shared.js
 * Tests parsing, path helpers, file filtering, and utility functions.
 * Does NOT test LLM API calls (parseAuditResponse, parseTripAuditResponse).
 */

'use strict';

import { createTestRunner } from './test-helpers.js';
import {
    extractJsonAndMarkdown,
    getTripPath,
    getAuditPath,
    getTripAuditPath,
    computeTripAverage,
    formatTime,
    formatPrevTimestamp,
    getLocalDateString,
    TRIP_AUDIT_SUBDIR,
    DIMENSION_LABELS
} from '../audit/audit-shared.js';

const { assert, report } = createTestRunner('📊 Audit shared utilities unit tests');

// ── extractJsonAndMarkdown ──────────────────────────────────

const output1 = '```json\n{"scores": {"overall_score": 8.5}}\n```\n\nSome markdown text.';
const result1 = extractJsonAndMarkdown(output1);
assert('extractJsonAndMarkdown: fenced JSON block',
    result1.parsed.scores.overall_score === 8.5);
assert('extractJsonAndMarkdown: markdown extracted',
    result1.markdown.includes('Some markdown text'));

const output2 = '{"scores": {"overall_score": 7.0}}\n\nMarkdown after JSON.';
const result2 = extractJsonAndMarkdown(output2);
assert('extractJsonAndMarkdown: raw JSON at start',
    result2.parsed.scores.overall_score === 7.0);

const output3 = 'Some text\n\n```json\n{"test": true}\n```';
const result3 = extractJsonAndMarkdown(output3);
assert('extractJsonAndMarkdown: fenced block preferred',
    result3.parsed.test === true);

const output4 = 'No JSON here at all.';
let didThrow = false;
try {
    extractJsonAndMarkdown(output4);
} catch (e) {
    didThrow = true;
}
assert('extractJsonAndMarkdown: throws on missing JSON', didThrow);

const output5 = '```json\n{"incomplete": \n```';
didThrow = false;
try {
    extractJsonAndMarkdown(output5);
} catch (e) {
    didThrow = true;
}
assert('extractJsonAndMarkdown: throws on invalid JSON', didThrow);

// ── Path helpers ────────────────────────────────────────────

assert('getTripPath: basic trip',
    getTripPath('greece') === 'content/trips/greece');
assert('getTripPath: with dashes',
    getTripPath('spain-2025') === 'content/trips/spain-2025');

assert('getAuditPath: basic file',
    getAuditPath('greece', 'paros-2024-03-15T01.json') === 'content/trips/greece/audits/paros-2024-03-15T01.json');

assert('getTripAuditPath: uses TRIP_AUDIT_SUBDIR constant',
    getTripAuditPath('spain') === `content/trips/spain/audits/${TRIP_AUDIT_SUBDIR}`);

assert('TRIP_AUDIT_SUBDIR: constant is "_trip"',
    TRIP_AUDIT_SUBDIR === '_trip');

// ── computeTripAverage ──────────────────────────────────────

assert('computeTripAverage: basic average',
    computeTripAverage([8.0, 9.0, 7.0]) === 8.0);
assert('computeTripAverage: single value',
    computeTripAverage([8.5]) === 8.5);
assert('computeTripAverage: decimals',
    Math.abs(computeTripAverage([8.2, 8.7, 9.1]) - 8.666666666666666) < 0.001);
assert('computeTripAverage: empty array',
    computeTripAverage([]) === 0);
assert('computeTripAverage: null',
    computeTripAverage(null) === 0);
assert('computeTripAverage: undefined',
    computeTripAverage(undefined) === 0);

// ── Timestamp formatting ────────────────────────────────────

const now = new Date('2024-03-15T10:30:45.123Z');

const formatted1 = formatTime(now);
assert('formatTime: basic format', typeof formatted1 === 'string');
assert('formatTime: includes time', formatted1.includes(':'));

// formatPrevTimestamp expects a Date object (mtime)
const prevStr1 = formatPrevTimestamp(new Date('2024-03-15T10:30:45.123Z'));
assert('formatPrevTimestamp: Date object input', typeof prevStr1 === 'string');
assert('formatPrevTimestamp: includes "run at"', prevStr1.includes('run at'));

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const prevStr2 = formatPrevTimestamp(yesterday);
assert('formatPrevTimestamp: yesterday includes "yesterday"', prevStr2.includes('yesterday'));

const today = new Date();
const prevStr3 = formatPrevTimestamp(today);
assert('formatPrevTimestamp: today includes "today"', prevStr3.includes('today'));

// ── getLocalDateString ──────────────────────────────────────

const date1 = getLocalDateString();
assert('getLocalDateString: returns YYYY-MM-DD format',
    /^\d{4}-\d{2}-\d{2}$/.test(date1));

const testDate = new Date('2024-03-15T10:30:00Z');
const date2 = getLocalDateString(testDate);
assert('getLocalDateString: custom date',
    /^\d{4}-\d{2}-\d{2}$/.test(date2));
assert('getLocalDateString: includes year 2024',
    date2.startsWith('2024'));

// ── DIMENSION_LABELS constant ───────────────────────────────

assert('DIMENSION_LABELS: is an object',
    typeof DIMENSION_LABELS === 'object' && DIMENSION_LABELS !== null);
assert('DIMENSION_LABELS: has prose_control_structure',
    DIMENSION_LABELS.prose_control_structure === 'Prose Control');
assert('DIMENSION_LABELS: has narrative_clarity_arc',
    DIMENSION_LABELS.narrative_clarity_arc === 'Narrative Clarity');
assert('DIMENSION_LABELS: has opening_strength',
    DIMENSION_LABELS.opening_strength === 'Opening Strength');
assert('DIMENSION_LABELS: has brand_alignment',
    DIMENSION_LABELS.brand_alignment === 'Brand Alignment');
assert('DIMENSION_LABELS: has distinctiveness',
    DIMENSION_LABELS.distinctiveness === 'Distinctiveness');
assert('DIMENSION_LABELS: has decision_clarity',
    DIMENSION_LABELS.decision_clarity === 'Decision Clarity');

process.exit(report());
