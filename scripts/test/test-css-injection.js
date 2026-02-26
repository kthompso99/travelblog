/**
 * CSS Injection Smoke Tests
 * Verifies that each page type has the CSS it needs
 */

const fs = require('fs');
const path = require('path');
const { ROOT_DIR, extractCssRule, createTestRunner, findTestTrip } = require('./test-helpers');

const { assert, report } = createTestRunner('🎨 CSS Injection smoke-test');

/**
 * Assert that a CSS selector exists (or does not exist) in the HTML file.
 */
function assertCSSRule(filePath, selector, shouldExist, description) {
    const fullPath = path.join(ROOT_DIR, filePath);
    if (!fs.existsSync(fullPath)) {
        assert(`${description} - File not found: ${filePath}`, false);
        return false;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const rule = extractCssRule(content, selector);
    assert(description, shouldExist ? rule !== null : rule === null);
    return shouldExist ? rule !== null : rule === null;
}

// Test Homepage
assertCSSRule('index.html', '.filter-bar', true, 'Homepage has filter bar CSS');
assertCSSRule('index.html', '.destination-grid', true, 'Homepage has trip grid CSS');
assertCSSRule('index.html', '.markdown-content', false, 'Homepage does NOT have markdown CSS');
assertCSSRule('index.html', '.trip-submenu', false, 'Homepage does NOT have trip submenu CSS');

// Test Global Map Page
assertCSSRule('map/index.html', '#map-container', true, 'Global map has map container CSS');
assertCSSRule('map/index.html', '#map', true, 'Global map has map element CSS');
assertCSSRule('map/index.html', '.map-popup-card', true, 'Global map has marker popup CSS');
assertCSSRule('map/index.html', '.filter-bar', false, 'Global map does NOT have filter bar CSS');
assertCSSRule('map/index.html', '.destination-grid', false, 'Global map does NOT have trip grid CSS');

// Test About Page
assertCSSRule('about/index.html', '.markdown-content', true, 'About page has markdown CSS');
assertCSSRule('about/index.html', '.filter-bar', false, 'About page does NOT have filter bar CSS');
assertCSSRule('about/index.html', '.destination-grid', false, 'About page does NOT have trip grid CSS');

// Test Trip Pages (dynamically discover first available trip)
const testTrip = findTestTrip();
if (testTrip) {
    // Trip Intro Page
    assertCSSRule(testTrip.intro, '.trip-hero', true, 'Trip intro has hero CSS');
    assertCSSRule(testTrip.intro, '.trip-bottom-section', true, 'Trip intro has bottom section CSS');
    assertCSSRule(testTrip.intro, '.markdown-content', true, 'Trip intro has markdown CSS');
    assertCSSRule(testTrip.intro, '.filter-bar', false, 'Trip intro does NOT have filter bar CSS');

    // Trip Location/Article Page
    assertCSSRule(testTrip.location, '.markdown-content', true, 'Location page has markdown CSS');
    assertCSSRule(testTrip.location, '.trip-submenu', true, 'Location page has trip submenu CSS');
    assertCSSRule(testTrip.location, '.location-navigation', true, 'Location page has prev/next navigation CSS');
    assertCSSRule(testTrip.location, '.filter-bar', false, 'Location page does NOT have filter bar CSS');
    assertCSSRule(testTrip.location, '.destination-grid', false, 'Location page does NOT have trip grid CSS');

    // Trip Map Page
    assertCSSRule(testTrip.map, '#map-container', true, 'Trip map has map container CSS');
    assertCSSRule(testTrip.map, '.trip-map-full-layout', true, 'Trip map has full layout CSS');
    assertCSSRule(testTrip.map, '.trip-map-sidebar', true, 'Trip map has sidebar CSS');
    assertCSSRule(testTrip.map, '.filter-bar', false, 'Trip map does NOT have filter bar CSS');
}

// Summary
process.exit(report());
