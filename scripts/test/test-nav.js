#!/usr/bin/env node

/**
 * Navigation smoke-test
 * Parses every generated HTML file and asserts the structural + CSS
 * conditions that keep the two-level cascading Trips dropdown working.
 *
 * Run with: npm test  (or  node scripts/test-nav.js)
 *
 * What it checks and WHY
 * ─────────────────────────────────────────────────────────────────
 * 1. header z-index must be > 1000
 *    Leaflet map controls use z-indexes up to 1000.  The header has
 *    position:sticky which creates a stacking context; that context's
 *    z-index must beat Leaflet's for the dropdown to paint on top.
 *
 * 2. .dropdown-content must NOT have overflow other than visible
 *    Per CSS spec, overflow-y:auto implicitly forces overflow-x:auto.
 *    The continent submenus are position:absolute children whose
 *    containing block (.continent-group) is inside .dropdown-content.
 *    Any overflow != visible clips those absolutely-positioned
 *    descendants, making the submenus invisible.
 *
 * 3. .dropdown must have position:relative
 *    Needed so .dropdown-content's position:absolute is relative to it.
 *
 * 4. .dropdown-content must have position:absolute
 *    So it floats over page content instead of pushing it down.
 *
 * 5. .dropdown.open .dropdown-content must set display:block
 *    The JS toggle adds class "open"; this rule makes the menu visible.
 *
 * 6. Every HTML file must contain the #trips-dropdown element with
 *    a .dropdown-toggle that has an onclick toggling "open", plus
 *    at least one .continent-group with a .continent-submenu inside.
 *
 * 7. The document-level close handler must be present so clicking
 *    outside the dropdown closes it.
 */

const fs   = require('fs');
const path = require('path');
const { findHtmlFiles, extractCssRule, hasCssProperty, getCssValue, createTestRunner } = require('./test-helpers');

// ── test runner ──────────────────────────────────────────────────
const ROOT = path.join(__dirname, '../..');
const htmlFiles = findHtmlFiles(ROOT);
const { assert: _assert, report } = createTestRunner('🧭 Navigation smoke-test');

function assert(file, description, condition) {
    _assert(`${path.relative(ROOT, file)}: ${description}`, condition);
}

if (htmlFiles.length === 0) {
    console.error('❌ No generated HTML files found.  Run npm run build first.');
    process.exit(1);
}

htmlFiles.forEach(file => {
    const html = fs.readFileSync(file, 'utf8');

    // ── 1. header z-index > 1000 ─────────────────────────────────
    const headerRule = extractCssRule(html, 'header');
    const headerZi   = parseInt(getCssValue(headerRule, 'z-index'), 10);
    assert(file,
        'header z-index must be > 1000 (currently ' + headerZi + ')',
        headerZi > 1000);

    // ── 2. .dropdown-content must NOT have overflow != visible ────
    const dcRule = extractCssRule(html, '.dropdown-content');
    const hasOverflowX   = hasCssProperty(dcRule, 'overflow-x');
    const hasOverflowY   = hasCssProperty(dcRule, 'overflow-y');
    const hasOverflow    = hasCssProperty(dcRule, 'overflow');          // shorthand
    // "overflow" shorthand is OK only if value is "visible"
    const overflowVal    = getCssValue(dcRule, 'overflow');
    const overflowOk     = !hasOverflowX && !hasOverflowY &&
                           (!hasOverflow || overflowVal === 'visible');
    assert(file,
        '.dropdown-content must not have overflow other than visible ' +
        '(clips absolutely-positioned continent submenus)',
        overflowOk);

    // ── 3. .dropdown must have position:relative ─────────────────
    const dropRule  = extractCssRule(html, '.dropdown');
    const dropPos   = getCssValue(dropRule, 'position');
    assert(file, '.dropdown must have position:relative', dropPos === 'relative');

    // ── 4. .dropdown-content must have position:absolute ─────────
    const dcPos = getCssValue(dcRule, 'position');
    assert(file, '.dropdown-content must have position:absolute', dcPos === 'absolute');

    // ── 5. .dropdown.open .dropdown-content must set display:block ─
    const openRule  = extractCssRule(html, '.dropdown.open .dropdown-content');
    const openDisp  = getCssValue(openRule, 'display');
    assert(file, '.dropdown.open .dropdown-content must have display:block', openDisp === 'block');

    // ── 6. HTML structure ─────────────────────────────────────────
    assert(file,
        'must contain element with id="trips-dropdown"',
        html.includes('id="trips-dropdown"'));

    assert(file,
        'must contain a .dropdown-toggle with onclick toggling "open"',
        html.includes('class="dropdown-toggle"') &&
        html.includes("classList.toggle('open')"));

    assert(file,
        'must contain at least one .continent-group with a .continent-submenu',
        html.includes('class="continent-group"') &&
        html.includes('class="continent-submenu"'));

    assert(file,
        'must contain at least one .continent-submenu-item link',
        html.includes('class="continent-submenu-item"'));

    // ── 7. close-on-outside-click handler ─────────────────────────
    assert(file,
        'must have document click handler that removes "open" class',
        html.includes("classList.remove('open')") &&
        html.includes('document.addEventListener'));
});

// ── report ───────────────────────────────────────────────────────
process.exit(report());
