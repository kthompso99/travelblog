#!/usr/bin/env node

/**
 * Shared test helpers
 * Used by test-nav.js and any future test scripts that need to
 * walk the generated site or inspect inline CSS rules.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

/**
 * Recursively find all generated HTML files under dir.
 * Skips source/tooling directories and a few known non-page files.
 */
function findHtmlFiles(dir) {
    const results = [];
    const SKIP_DIRS = new Set(['node_modules', '.git', 'content', 'config', 'templates', 'lib', 'scripts', 'archive', 'docs']);
    (function walk(d) {
        for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
            const full = path.join(d, entry.name);
            if (entry.isDirectory()) {
                if (SKIP_DIRS.has(entry.name)) continue;
                walk(full);
            } else if (entry.name.endsWith('.html')) {
                if (entry.name === '404.html')           continue;
                if (entry.name === 'index.html.backup')  continue;
                if (entry.name === 'main.html')          continue;
                results.push(full);
            }
        }
    })(dir);
    return results;
}

/**
 * Extract the body of the first CSS rule matching selector from an HTML string.
 * Returns the text between { } or null if not found.
 */
function extractCssRule(html, selector) {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(escaped + '\\s*\\{([^}]+)\\}', 's');
    const m = html.match(re);
    return m ? m[1] : null;
}

/** Returns true if ruleBody declares the given CSS property. */
function hasCssProperty(ruleBody, prop) {
    if (!ruleBody) return false;
    return new RegExp(prop + '\\s*:').test(ruleBody);
}

/** Returns the trimmed value of prop in ruleBody, or null. */
function getCssValue(ruleBody, prop) {
    if (!ruleBody) return null;
    const m = ruleBody.match(new RegExp(prop + '\\s*:\\s*([^;\\n]+)'));
    return m ? m[1].trim() : null;
}

module.exports = { findHtmlFiles, extractCssRule, hasCssProperty, getCssValue };
