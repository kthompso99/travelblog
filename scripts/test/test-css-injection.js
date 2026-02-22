/**
 * CSS Injection Smoke Tests
 * Verifies that each page type has the CSS it needs
 */

const fs = require('fs');
const path = require('path');
const { extractCssRule, createTestRunner } = require('./test-helpers');

const ROOT_DIR = path.join(__dirname, '../..');
const { assert, report } = createTestRunner('🎨 CSS Injection smoke-test');

/**
 * Assert that a CSS selector exists in the HTML file
 */
function assertCSSExists(filePath, selector, description) {
    const fullPath = path.join(ROOT_DIR, filePath);
    if (!fs.existsSync(fullPath)) {
        assert(`${description} - File not found: ${filePath}`, false);
        return false;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const rule = extractCssRule(content, selector);
    assert(description, rule !== null);
    return rule !== null;
}

/**
 * Assert that a CSS selector does NOT exist in the HTML file
 */
function assertCSSNotExists(filePath, selector, description) {
    const fullPath = path.join(ROOT_DIR, filePath);
    if (!fs.existsSync(fullPath)) {
        assert(`${description} - File not found: ${filePath}`, false);
        return false;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const rule = extractCssRule(content, selector);
    assert(description, rule === null);
    return rule === null;
}

// Test Homepage
assertCSSExists('index.html', '.filter-bar', 'Homepage has filter bar CSS');
assertCSSExists('index.html', '.destination-grid', 'Homepage has trip grid CSS');
assertCSSNotExists('index.html', '.markdown-content', 'Homepage does NOT have markdown CSS');
assertCSSNotExists('index.html', '.trip-submenu', 'Homepage does NOT have trip submenu CSS');

// Test Global Map Page
assertCSSExists('map/index.html', '#map-container', 'Global map has map container CSS');
assertCSSExists('map/index.html', '#map', 'Global map has map element CSS');
assertCSSExists('map/index.html', '.map-popup-card', 'Global map has marker popup CSS');
assertCSSNotExists('map/index.html', '.filter-bar', 'Global map does NOT have filter bar CSS');
assertCSSNotExists('map/index.html', '.destination-grid', 'Global map does NOT have trip grid CSS');

// Test About Page
assertCSSExists('about/index.html', '.markdown-content', 'About page has markdown CSS');
assertCSSNotExists('about/index.html', '.filter-bar', 'About page does NOT have filter bar CSS');
assertCSSNotExists('about/index.html', '.destination-grid', 'About page does NOT have trip grid CSS');

// Test Trip Intro Page (if Spain trip exists)
const spainIntroPath = 'trips/spain/index.html';
if (fs.existsSync(path.join(ROOT_DIR, spainIntroPath))) {
    assertCSSExists(spainIntroPath, '.trip-hero', 'Trip intro has hero CSS');
    assertCSSExists(spainIntroPath, '.trip-bottom-section', 'Trip intro has bottom section CSS');
    assertCSSExists(spainIntroPath, '.markdown-content', 'Trip intro has markdown CSS');
    assertCSSNotExists(spainIntroPath, '.filter-bar', 'Trip intro does NOT have filter bar CSS');
}

// Test Trip Location Page (if Spain/Cordoba exists)
const cordobaPath = 'trips/spain/cordoba.html';
if (fs.existsSync(path.join(ROOT_DIR, cordobaPath))) {
    assertCSSExists(cordobaPath, '.markdown-content', 'Location page has markdown CSS');
    assertCSSExists(cordobaPath, '.trip-submenu', 'Location page has trip submenu CSS');
    assertCSSExists(cordobaPath, '.location-navigation', 'Location page has prev/next navigation CSS');
    assertCSSNotExists(cordobaPath, '.filter-bar', 'Location page does NOT have filter bar CSS');
    assertCSSNotExists(cordobaPath, '.destination-grid', 'Location page does NOT have trip grid CSS');
}

// Test Trip Map Page (if Spain map exists)
const spainMapPath = 'trips/spain/map.html';
if (fs.existsSync(path.join(ROOT_DIR, spainMapPath))) {
    assertCSSExists(spainMapPath, '#map-container', 'Trip map has map container CSS');
    assertCSSExists(spainMapPath, '.trip-map-full-layout', 'Trip map has full layout CSS');
    assertCSSExists(spainMapPath, '.trip-map-sidebar', 'Trip map has sidebar CSS');
    assertCSSNotExists(spainMapPath, '.filter-bar', 'Trip map does NOT have filter bar CSS');
}

// Summary
process.exit(report());
