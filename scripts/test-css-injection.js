/**
 * CSS Injection Smoke Tests
 * Verifies that each page type has the CSS it needs
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

/**
 * Assert that a CSS selector exists in the HTML file
 */
function assertCSSExists(filePath, selector, description) {
    totalTests++;

    if (!fs.existsSync(filePath)) {
        console.log(`${colors.red}✗${colors.reset} ${description} - File not found: ${filePath}`);
        failedTests++;
        return false;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const selectorRegex = new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    if (selectorRegex.test(content)) {
        passedTests++;
        return true;
    } else {
        console.log(`${colors.red}✗${colors.reset} ${description}`);
        console.log(`  Expected "${selector}" in ${filePath}`);
        failedTests++;
        return false;
    }
}

/**
 * Assert that a CSS selector does NOT exist in the HTML file
 */
function assertCSSNotExists(filePath, selector, description) {
    totalTests++;

    if (!fs.existsSync(filePath)) {
        console.log(`${colors.red}✗${colors.reset} ${description} - File not found: ${filePath}`);
        failedTests++;
        return false;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const selectorRegex = new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    if (!selectorRegex.test(content)) {
        passedTests++;
        return true;
    } else {
        console.log(`${colors.red}✗${colors.reset} ${description}`);
        console.log(`  Expected "${selector}" NOT to be in ${filePath}`);
        failedTests++;
        return false;
    }
}

console.log(`\n${colors.cyan}${colors.bold}🎨 CSS Injection smoke-test${colors.reset}`);
console.log('━'.repeat(60));

// Test Homepage
console.log(`\n${colors.bold}Testing Homepage (index.html)${colors.reset}`);
assertCSSExists('index.html', '.filter-bar', 'Homepage has filter bar CSS');
assertCSSExists('index.html', '.destination-grid', 'Homepage has trip grid CSS');
assertCSSNotExists('index.html', '.markdown-content', 'Homepage does NOT have markdown CSS');
assertCSSNotExists('index.html', '.trip-submenu', 'Homepage does NOT have trip submenu CSS');

// Test Global Map Page
console.log(`\n${colors.bold}Testing Global Map (map/index.html)${colors.reset}`);
assertCSSExists('map/index.html', '#map-container', 'Global map has map container CSS');
assertCSSExists('map/index.html', '#map {', 'Global map has map element CSS');
assertCSSExists('map/index.html', '.marker-popup', 'Global map has marker popup CSS');
assertCSSNotExists('map/index.html', '.filter-bar', 'Global map does NOT have filter bar CSS');
assertCSSNotExists('map/index.html', '.destination-grid', 'Global map does NOT have trip grid CSS');

// Test About Page
console.log(`\n${colors.bold}Testing About Page (about/index.html)${colors.reset}`);
assertCSSExists('about/index.html', '.markdown-content', 'About page has markdown CSS');
assertCSSNotExists('about/index.html', '.filter-bar', 'About page does NOT have filter bar CSS');
assertCSSNotExists('about/index.html', '.destination-grid', 'About page does NOT have trip grid CSS');

// Test Trip Intro Page (if Spain trip exists)
const spainIntroPath = 'trips/spain/index.html';
if (fs.existsSync(spainIntroPath)) {
    console.log(`\n${colors.bold}Testing Trip Intro (trips/spain/index.html)${colors.reset}`);
    assertCSSExists(spainIntroPath, '.trip-hero', 'Trip intro has hero CSS');
    assertCSSExists(spainIntroPath, '.trip-bottom-section', 'Trip intro has bottom section CSS');
    assertCSSExists(spainIntroPath, '.markdown-content', 'Trip intro has markdown CSS');
    assertCSSNotExists(spainIntroPath, '.filter-bar', 'Trip intro does NOT have filter bar CSS');
}

// Test Trip Location Page (if Spain/Cordoba exists)
const cordobaPath = 'trips/spain/cordoba.html';
if (fs.existsSync(cordobaPath)) {
    console.log(`\n${colors.bold}Testing Location Page (trips/spain/cordoba.html)${colors.reset}`);
    assertCSSExists(cordobaPath, '.markdown-content', 'Location page has markdown CSS');
    assertCSSExists(cordobaPath, '.trip-submenu', 'Location page has trip submenu CSS');
    assertCSSExists(cordobaPath, '.location-navigation', 'Location page has prev/next navigation CSS');
    assertCSSNotExists(cordobaPath, '.filter-bar', 'Location page does NOT have filter bar CSS');
    assertCSSNotExists(cordobaPath, '.destination-grid', 'Location page does NOT have trip grid CSS');
}

// Test Trip Map Page (if Spain map exists)
const spainMapPath = 'trips/spain/map.html';
if (fs.existsSync(spainMapPath)) {
    console.log(`\n${colors.bold}Testing Trip Map (trips/spain/map.html)${colors.reset}`);
    assertCSSExists(spainMapPath, '#map-container', 'Trip map has map container CSS');
    assertCSSExists(spainMapPath, '.trip-map-full-layout', 'Trip map has full layout CSS');
    assertCSSExists(spainMapPath, '.trip-map-sidebar', 'Trip map has sidebar CSS');
    assertCSSNotExists(spainMapPath, '.filter-bar', 'Trip map does NOT have filter bar CSS');
}

// Summary
console.log('\n' + '━'.repeat(60));
if (failedTests === 0) {
    console.log(`${colors.green}✅ All CSS injection checks passed.${colors.reset}\n`);
    console.log(`   Assertions : ${totalTests}  (${passedTests} passed, ${failedTests} failed)\n`);
    process.exit(0);
} else {
    console.log(`${colors.red}❌ Some CSS injection checks failed.${colors.reset}\n`);
    console.log(`   Assertions : ${totalTests}  (${passedTests} passed, ${failedTests} failed)\n`);
    process.exit(1);
}
