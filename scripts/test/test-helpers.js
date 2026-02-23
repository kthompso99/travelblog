#!/usr/bin/env node

/**
 * Shared test helpers
 * Used by test-nav.js and any future test scripts that need to
 * walk the generated site or inspect inline CSS rules.
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { walkDir } = require('../../lib/build-utilities');

const SKIP_DIRS = new Set(['node_modules', '.git', 'content', 'config', 'templates', 'lib', 'scripts', 'docs']);
const SKIP_FILES = new Set(['404.html', 'index.html.backup', 'main.html', 'writingstudio.html']);

/**
 * Recursively find all generated HTML files under dir.
 * Skips source/tooling directories and a few known non-page files.
 */
function findHtmlFiles(dir) {
    return walkDir(dir, {
        skipDirs: SKIP_DIRS,
        fileFilter: name => name.endsWith('.html') && !SKIP_FILES.has(name)
    });
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

/**
 * Create a test runner with assert/report for a named test suite.
 * Replaces duplicated boilerplate across test files.
 *
 * @param {string} suiteName - Display name for the suite (e.g., '🧭 Navigation smoke-test')
 * @returns {{ assert: function, report: function, getStats: function }}
 */
function createTestRunner(suiteName) {
    let passed = 0;
    let failed = 0;
    const failures = [];

    function assert(description, condition) {
        if (condition) {
            passed++;
        } else {
            failed++;
            failures.push(`  ❌ ${description}`);
        }
    }

    function report() {
        console.log(`\n${suiteName}`);
        console.log('━'.repeat(50));
        console.log(`   Assertions : ${passed + failed}  (${passed} passed, ${failed} failed)`);

        if (failures.length > 0) {
            console.log('\n🚨 FAILURES:\n');
            failures.forEach(f => console.log(f));
            console.log('');
        } else {
            console.log(`\n✅ All checks passed.\n`);
        }

        return failed > 0 ? 1 : 0;
    }

    return { assert, report, getStats: () => ({ passed, failed, failures }) };
}

module.exports = { findHtmlFiles, extractCssRule, hasCssProperty, getCssValue, createTestRunner };
