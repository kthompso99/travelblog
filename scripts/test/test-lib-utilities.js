#!/usr/bin/env node

/**
 * Unit tests for pure utility modules in lib/
 * Tests functions that need no filesystem fixtures or mocking.
 */

'use strict';

const { createTestRunner } = require('./test-helpers');
const { slugify, getContentItemSlug } = require('../../lib/slug-utilities');
const { getTripImagePath } = require('../../lib/image-utilities');
const { assembleTemplate } = require('../../lib/template-utilities');
const { escapeHtml } = require('../../lib/seo-metadata');
const { getPageCSS } = require('../../lib/css-utilities');
const CONFIG = require('../../lib/config-paths');

const { assert, report } = createTestRunner('🧪 Library utility unit tests');

// ── slug-utilities ──────────────────────────────────────────

assert('slugify: basic text', slugify('Hello World') === 'hello-world');
assert('slugify: special characters stripped', slugify('São Paulo & More!') === 's-o-paulo-more');
assert('slugify: empty string', slugify('') === '');
assert('slugify: null/undefined', slugify(null) === '' && slugify(undefined) === '');
assert('slugify: numbers preserved', slugify('Day 3 in Rome') === 'day-3-in-rome');

assert('getContentItemSlug: from file', getContentItemSlug({ file: 'cordoba.md' }) === 'cordoba');
assert('getContentItemSlug: from title', getContentItemSlug({ title: 'My Tips' }) === 'my-tips');
assert('getContentItemSlug: file takes priority over title',
    getContentItemSlug({ file: 'tips.md', title: 'Travel Tips' }) === 'tips');

// ── image-utilities ─────────────────────────────────────────

assert('getTripImagePath: outside trip dir',
    getTripImagePath('images/photo.jpg', 'spain', './') === './trips/spain/images/photo.jpg');
assert('getTripImagePath: inside trip dir',
    getTripImagePath('images/photo.jpg', 'spain', './', true) === 'images/photo.jpg');
assert('getTripImagePath: null returns empty',
    getTripImagePath(null, 'spain', './') === '');
assert('getTripImagePath: different base path',
    getTripImagePath('images/photo.jpg', 'greece', '../') === '../trips/greece/images/photo.jpg');

// ── template-utilities ──────────────────────────────────────

const testTemplate = '{{SEO_METADATA}}|{{PAGE_CSS}}|{{SITE_TITLE}}|{{BASE_PATH}}|{{TRIPS_MENU}}|{{TRIP_SUBMENU}}|{{PRE_MAIN}}|{{CONTENT}}|{{SCRIPTS}}';

assert('assembleTemplate: all placeholders replaced',
    assembleTemplate(testTemplate, {
        seoMetadata: 'SEO',
        pageCSS: 'CSS',
        siteTitle: 'Title',
        basePath: './',
        tripsMenu: 'Menu',
        tripSubmenu: 'Sub',
        preMain: 'Pre',
        content: 'Content',
        scripts: 'JS'
    }) === 'SEO|CSS|Title|./|Menu|Sub|Pre|Content|JS');

assert('assembleTemplate: optional placeholders default to empty',
    assembleTemplate(testTemplate, {
        seoMetadata: 'SEO',
        siteTitle: 'Title',
        basePath: './',
        tripsMenu: 'Menu',
        content: 'Content'
    }) === 'SEO||Title|./|Menu|||Content|');

// ── seo-metadata (escapeHtml) ───────────────────────────────

assert('escapeHtml: ampersand', escapeHtml('A & B') === 'A &amp; B');
assert('escapeHtml: angle brackets', escapeHtml('<script>') === '&lt;script&gt;');
assert('escapeHtml: quotes', escapeHtml('"test"') === '&quot;test&quot;');
assert('escapeHtml: single quotes', escapeHtml("it's") === "it&#039;s");
assert('escapeHtml: all 5 special chars',
    escapeHtml('<"&\'>') === '&lt;&quot;&amp;&#039;&gt;');
assert('escapeHtml: null returns empty', escapeHtml(null) === '');
assert('escapeHtml: undefined returns empty', escapeHtml(undefined) === '');

// ── config-paths ────────────────────────────────────────────

assert('getTripDir', CONFIG.getTripDir('spain') === 'content/trips/spain');
assert('getTripConfigPath', CONFIG.getTripConfigPath('spain') === 'content/trips/spain/trip.json');
assert('getTripImagesDir', CONFIG.getTripImagesDir('spain') === 'content/trips/spain/images');
assert('getTripMainPath', CONFIG.getTripMainPath('spain') === 'content/trips/spain/main.md');
assert('getSyncedPhotosPath', CONFIG.getSyncedPhotosPath('spain') === 'content/trips/spain/all-synced-photos.md');

// ── css-utilities ───────────────────────────────────────────

const homepageCSS = getPageCSS('homepage');
const contentCSS = getPageCSS('trip-location');

assert('getPageCSS: homepage returns style tag', homepageCSS.includes('<style>'));
assert('getPageCSS: homepage contains hero CSS', homepageCSS.includes('.home-hero'));
assert('getPageCSS: trip-location returns style tag', contentCSS.includes('<style>'));
assert('getPageCSS: trip-location contains markdown CSS', contentCSS.includes('.markdown-content'));
assert('getPageCSS: homepage and content CSS are different', homepageCSS !== contentCSS);
assert('getPageCSS: unknown type returns empty', getPageCSS('nonexistent') === '');
assert('getPageCSS: trip-intro uses content CSS', getPageCSS('trip-intro') === contentCSS);
assert('getPageCSS: about uses content CSS', getPageCSS('about') === contentCSS);

// ── Report ──────────────────────────────────────────────────

const exitCode = report();
process.exit(exitCode);
