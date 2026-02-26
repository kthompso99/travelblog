#!/usr/bin/env node

/**
 * Shared test helpers
 * Used by test-nav.js and any future test scripts that need to
 * walk the generated site or inspect inline CSS rules.
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { walkDir } = require('../../lib/build-utilities');

const ROOT_DIR = path.join(__dirname, '../..');

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
 * Discover the first available trip with intro, location, and map pages.
 * Returns relative paths suitable for path.join(ROOT_DIR, ...) or null.
 */
function findTestTrip() {
    const tripsDir = path.join(ROOT_DIR, 'trips');
    if (!fs.existsSync(tripsDir)) return null;

    for (const entry of fs.readdirSync(tripsDir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const tripDir = path.join(tripsDir, entry.name);
        const intro = path.join(tripDir, 'index.html');
        const map = path.join(tripDir, 'map.html');
        if (!fs.existsSync(intro) || !fs.existsSync(map)) continue;

        // Find first location/article page
        const pages = fs.readdirSync(tripDir).filter(f =>
            f.endsWith('.html') && f !== 'index.html' && f !== 'map.html'
        );
        if (pages.length > 0) {
            return {
                slug: entry.name,
                intro: `trips/${entry.name}/index.html`,
                location: `trips/${entry.name}/${pages[0]}`,
                map: `trips/${entry.name}/map.html`
            };
        }
    }
    return null;
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

/** Backup a file before tests. Returns the backup path. */
function backupFile(filePath) {
    const backupPath = filePath + '.test-backup';
    if (fs.existsSync(filePath)) {
        fs.copyFileSync(filePath, backupPath);
    }
    return backupPath;
}

/** Restore a file from its backup and remove the backup. */
function restoreFile(filePath, backupPath) {
    if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, filePath);
        fs.unlinkSync(backupPath);
    }
}

/** Create a temporary directory for test fixtures. */
function createTempDir(prefix) {
    return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

/** Remove a temporary directory and all its contents. */
function removeTempDir(dir) {
    fs.rmSync(dir, { recursive: true, force: true });
}

module.exports = {
    ROOT_DIR,
    findHtmlFiles,
    findTestTrip,
    extractCssRule,
    hasCssProperty,
    getCssValue,
    createTestRunner,
    backupFile,
    restoreFile,
    createTempDir,
    removeTempDir
};
