#!/usr/bin/env node

/**
 * Filter smoke-test (headless DOM)
 *
 * Loads the generated index.html into jsdom with script execution enabled,
 * then simulates every pill click and representative search queries.
 * Assertions are data-driven: expected visible counts are derived from the
 * data-* attributes already on the cards, so the test stays correct as trips
 * are added or removed without editing this file.
 *
 * Run with: npm test  (chained after test-nav.js)
 *       or: node scripts/test-filter.js
 *
 * What it checks and WHY
 * ─────────────────────────────────────────────────────────────────
 * 1. Each continent pill hides cards from other continents.
 *    Regression guard for the case-sensitivity bug (pill data-value is
 *    title-case; card dataset is lowercased in the filter loop).
 *
 * 2. Each year pill hides cards from other years.
 *    Same pattern; future-proofs against a similar casing slip on years.
 *
 * 3. Search filters by title, country, and continent text.
 *    Verifies the three match axes actually work end-to-end.
 *
 * 4. Continent pill + search compose correctly.
 *    A pill filter and a text query must AND together.
 *
 * 5. No-results message appears when zero cards match, disappears otherwise.
 */

'use strict';

const { JSDOM } = require('jsdom');
const fs   = require('fs');
const path = require('path');
const { createTestRunner } = require('./test-helpers');

const ROOT      = path.join(__dirname, '../..');
const indexPath = path.join(ROOT, 'index.html');

if (!fs.existsSync(indexPath)) {
    console.error('❌ index.html not found. Run npm run build first.');
    process.exit(1);
}

const html = fs.readFileSync(indexPath, 'utf8');

// jsdom with inline-script execution.  fetch() is not available so the first
// script's loadConfig() will silently catch and fall back — that's fine; the
// filter IIFE is fully independent of config.
const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    url:        'http://localhost/'
});

const { document, Event } = dom.window;

// ── helpers ───────────────────────────────────────────────────────

const { assert, report } = createTestRunner('🔍 Filter smoke-test (headless DOM)');

/** All card elements */
const allCards = [...document.querySelectorAll('.destination-card')];

/** Cards currently visible (display not set to 'none') */
function visibleCards() {
    return allCards.filter(c => c.style.display !== 'none');
}

/** Click a continent filter pill by its data-value */
function clickPill(filterType, value) {
    const pill = document.querySelector(
        `.filter-pill[data-filter="${filterType}"][data-value="${value}"]`
    );
    if (!pill) throw new Error(`No pill found: filter=${filterType} value=${value}`);
    pill.dispatchEvent(new Event('click', { bubbles: true }));
}

/** Select a year from the year dropdown */
function selectYear(value) {
    const dropdown = document.getElementById('year-filter');
    if (!dropdown) throw new Error('No year dropdown found');
    dropdown.value = value;
    dropdown.dispatchEvent(new Event('change', { bubbles: true }));
}

/** Set the search input and fire the input event */
function setSearch(query) {
    const input = document.getElementById('trip-search');
    input.value = query;
    input.dispatchEvent(new Event('input', { bubbles: true }));
}

/** Reset all filters to their default (all + empty search) */
function reset() {
    // Only click "all" pill if it exists (rendered when 2+ continents exist)
    const continentAll = document.querySelector('.filter-pill[data-filter="continent"][data-value="all"]');
    if (continentAll) clickPill('continent', 'all');

    // Reset year dropdown if it exists
    const yearDropdown = document.getElementById('year-filter');
    if (yearDropdown) selectYear('all');

    setSearch('');
}

/** No-results element visibility */
function noResultsVisible() {
    return document.getElementById('no-results').style.display === 'block';
}

// ── sanity: page loaded and scripts ran ──────────────────────────

assert('index.html has trip cards',  allCards.length > 0);
assert('search input exists',        !!document.getElementById('trip-search'));
assert('no-results element exists',  !!document.getElementById('no-results'));

const continentPills = [...document.querySelectorAll('.filter-pill[data-filter="continent"]')]
    .filter(p => p.dataset.value !== 'all');
const yearDropdown = document.getElementById('year-filter');
const yearOptions = yearDropdown
    ? [...yearDropdown.querySelectorAll('option')].filter(o => o.value !== 'all')
    : [];

// Extract unique continents and years from cards
const uniqueContinents = new Set(allCards.map(c => c.dataset.continent));
const uniqueYears = new Set(allCards.map(c => c.dataset.year));

// Continent pills should only be rendered when 2+ options exist
if (uniqueContinents.size > 1) {
    assert('continent pills rendered when multiple continents exist', continentPills.length > 0);
} else {
    assert('no continent pills when only 1 continent exists', continentPills.length === 0);
}

// Year dropdown should only be rendered when 2+ options exist
if (uniqueYears.size > 1) {
    assert('year dropdown rendered when multiple years exist', !!yearDropdown);
} else {
    assert('no year dropdown when only 1 year exists', !yearDropdown);
}

// ── 1. initial state: all cards visible ──────────────────────────

assert('all cards visible on load', visibleCards().length === allCards.length);
assert('no-results hidden on load', !noResultsVisible());

// ── 2. each continent pill shows only matching cards ─────────────

continentPills.forEach(pill => {
    const value    = pill.dataset.value;                          // e.g. "Africa"
    const expected = allCards.filter(c => c.dataset.continent === value).length;

    clickPill('continent', value);

    assert(
        `continent pill "${value}" shows ${expected} card(s) (got ${visibleCards().length})`,
        visibleCards().length === expected
    );
    // Every visible card must actually match
    assert(
        `continent pill "${value}" — all visible cards match`,
        visibleCards().every(c => c.dataset.continent === value)
    );

    reset();
});

// ── 3. each year option shows only matching cards ────────────────

yearOptions.forEach(option => {
    const value    = option.value;                                // e.g. "2024"
    const expected = allCards.filter(c => c.dataset.year === value).length;

    selectYear(value);

    assert(
        `year "${value}" shows ${expected} card(s) (got ${visibleCards().length})`,
        visibleCards().length === expected
    );
    assert(
        `year "${value}" — all visible cards match`,
        visibleCards().every(c => c.dataset.year === value)
    );

    reset();
});

// ── 4. "All" pill restores full set ──────────────────────────────

// Only test if "all" pill exists (it's only rendered when 2+ continents exist)
const continentAllPill = document.querySelector('.filter-pill[data-filter="continent"][data-value="all"]');
if (continentPills.length > 0 && continentAllPill) {
    clickPill('continent', continentPills[0].dataset.value);   // narrow first
    clickPill('continent', 'all');                             // then reset
    assert('"All Continents" restores full set', visibleCards().length === allCards.length);
}

// ── 5. search by title substring ──────────────────────────────────

allCards.forEach(card => {
    const title = card.dataset.title;
    // Use first 4 chars lowercased as query — short enough to be substring-safe,
    // long enough to be selective in practice.
    const query = title.slice(0, 4).toLowerCase();
    const expected = allCards.filter(c =>
        c.dataset.title.toLowerCase().includes(query) ||
        c.dataset.country.toLowerCase().includes(query) ||
        c.dataset.continent.toLowerCase().includes(query)
    ).length;

    setSearch(query);
    assert(
        `search "${query}" shows ${expected} card(s) (got ${visibleCards().length})`,
        visibleCards().length === expected
    );
    reset();
});

// ── 6. search by country ──────────────────────────────────────────

// Pick the first card's country and search for it
if (allCards.length > 0) {
    const country = allCards[0].dataset.country;
    const query   = country.toLowerCase();
    const expected = allCards.filter(c => c.dataset.country.toLowerCase().includes(query)).length;

    setSearch(query);
    assert(
        `search by country "${query}" shows ${expected} card(s) (got ${visibleCards().length})`,
        visibleCards().length === expected
    );
    reset();
}

// ── 7. continent pill + search compose (AND) ─────────────────────

if (continentPills.length > 0 && allCards.length > 0) {
    const pill      = continentPills[0];
    const continent = pill.dataset.value;
    // Find a card that IS in this continent and use a snippet of its title
    const matchCard = allCards.find(c => c.dataset.continent === continent);
    if (matchCard) {
        const query   = matchCard.dataset.title.slice(0, 4).toLowerCase();
        clickPill('continent', continent);
        setSearch(query);

        // Expected: cards matching BOTH the continent AND the query
        const expected = allCards.filter(c =>
            c.dataset.continent === continent &&
            (c.dataset.title.toLowerCase().includes(query) ||
             c.dataset.country.toLowerCase().includes(query) ||
             c.dataset.continent.toLowerCase().includes(query))
        ).length;

        assert(
            `continent "${continent}" + search "${query}" shows ${expected} card(s) (got ${visibleCards().length})`,
            visibleCards().length === expected
        );
        reset();
    }
}

// ── 8. no-results message ─────────────────────────────────────────

setSearch('xyznosuchtripxyz');
assert('gibberish search → 0 visible cards',  visibleCards().length === 0);
assert('gibberish search → no-results shown', noResultsVisible());
reset();
assert('after reset → no-results hidden',     !noResultsVisible());

// ── report ────────────────────────────────────────────────────────

process.exit(report());
