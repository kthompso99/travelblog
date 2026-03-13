#!/usr/bin/env node

/**
 * Normalize Typography — flattens all curly quotes, Unicode dashes, and
 * Unicode ellipses to straight ASCII in markdown content.
 *
 * Source files should contain only ASCII quotes, hyphens, and periods.
 * The build pipeline converts to typographic curly quotes, smart dashes,
 * and ellipsis characters in the rendered HTML output.
 *
 * Auto-fix:
 *   - Curly double quotes (\u201C \u201D) → straight double quotes (")
 *   - Curly single quotes (\u2018 \u2019) → straight apostrophe (')
 *   - Em dashes (\u2014) → double hyphen (--)
 *   - En dashes (\u2013) → double hyphen (--) or hyphen (-) for ranges
 *   - Ellipsis (\u2026) → three ASCII periods (...)
 *
 * Also detects (but does not auto-fix) single-quote scare quotes for manual review.
 *
 * Usage:
 *   npm run normalize                   # All trips
 *   npm run normalize -- spain          # All files in spain/
 *   npm run normalize -- spain/cordoba  # Just cordoba.md
 *   npm run normalize -- --dry-run      # Show what would change without modifying files
 */

const fs = require('fs');
const path = require('path');
const CONFIG = require('../../lib/config-paths');
const { discoverAllTrips, loadTripConfig } = require('../../lib/build-utilities');

// ---------------------------------------------------------------------------
// Quote flattening
// ---------------------------------------------------------------------------

function flattenQuotes(content) {
    return content
        .replace(/[\u201C\u201D]/g, '"')   // curly doubles → straight double
        .replace(/[\u2018\u2019]/g, "'");   // curly singles → straight apostrophe
}

// ---------------------------------------------------------------------------
// Dash flattening
// ---------------------------------------------------------------------------

function flattenDashes(content) {
    // Em dash (U+2014) → double hyphen
    content = content.replace(/\u2014/g, '--');

    // En dash (U+2013) between digits → regular hyphen (range notation)
    content = content.replace(/(\d)\u2013(\d)/g, '$1-$2');

    // En dash (U+2013) surrounded by spaces → double hyphen (clause separator)
    content = content.replace(/ \u2013 /g, ' -- ');

    // Any remaining en dashes → hyphen (catch-all)
    content = content.replace(/\u2013/g, '-');

    return content;
}

// ---------------------------------------------------------------------------
// Ellipsis flattening
// ---------------------------------------------------------------------------

function flattenEllipses(content) {
    // Unicode ellipsis (U+2026) → three ASCII periods
    return content.replace(/\u2026/g, '...');
}

// ---------------------------------------------------------------------------
// Combined normalization
// ---------------------------------------------------------------------------

function normalizeTypography(content) {
    content = flattenQuotes(content);
    content = flattenDashes(content);
    content = flattenEllipses(content);
    return content;
}

// ---------------------------------------------------------------------------
// Single-quote scare quote detection (for manual review)
// ---------------------------------------------------------------------------

function detectSingleQuoteScarequotes(content, filePath) {
    const lines = content.split('\n');
    const warnings = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim().startsWith('```')) continue;

        const matches = [...line.matchAll(/'([^']{1,40})'/g)];
        for (const match of matches) {
            const inner = match[1];
            // Skip contraction fragments (e.g., part of don't)
            if (/^(t|s|d|ll|re|ve|m)$/i.test(inner)) continue;
            // Skip if preceded by a letter (likely a contraction)
            const idx = match.index;
            if (idx > 0 && /[a-zA-Z]/.test(line[idx - 1])) continue;
            warnings.push({
                file: filePath,
                line: i + 1,
                text: match[0],
                context: line.trim().substring(0, 100)
            });
        }
    }
    return warnings;
}

// ---------------------------------------------------------------------------
// Process a single file
// ---------------------------------------------------------------------------

function processFile(filePath, dryRun) {
    const original = fs.readFileSync(filePath, 'utf8');
    const modified = normalizeTypography(original);
    const changed = modified !== original;

    if (changed && !dryRun) {
        fs.writeFileSync(filePath, modified, 'utf8');
    }

    const scareQuoteWarnings = detectSingleQuoteScarequotes(modified, filePath);
    return { changed, scareQuoteWarnings };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const positional = args.filter(a => !a.startsWith('--'));

    let tripFilter = null;
    let fileFilter = null;

    if (positional.length > 0) {
        const arg = positional[0];
        if (arg.includes('/')) {
            const parts = arg.split('/');
            tripFilter = parts[0];
            fileFilter = parts[1];
        } else {
            tripFilter = arg;
        }
    }

    const tripIds = discoverAllTrips(CONFIG.TRIPS_DIR, (id) => CONFIG.getTripConfigPath(id));

    if (tripIds.length === 0) {
        console.log('No trips found.');
        return;
    }

    console.log(`\n${dryRun ? '(DRY RUN) ' : ''}\u2550\u2550\u2550 Normalize Typography \u2550\u2550\u2550\n`);

    let totalFixed = 0;
    let totalScareQuotes = 0;
    const allScareQuotes = [];

    for (const tripId of tripIds) {
        if (tripFilter && tripId !== tripFilter) continue;

        const tripConfig = loadTripConfig(tripId);
        const tripDir = CONFIG.getTripDir(tripId);
        const contentItems = tripConfig.content || [];

        const filesToProcess = [];

        if (!fileFilter) {
            const mainPath = path.join(tripDir, CONFIG.TRIP_MAIN_FILE);
            if (fs.existsSync(mainPath)) {
                filesToProcess.push({ filePath: mainPath, label: `${tripId}/main.md` });
            }
        }

        for (const item of contentItems) {
            const pageName = path.basename(item.file, '.md');
            if (fileFilter && pageName !== fileFilter) continue;

            const filePath = path.join(tripDir, item.file);
            if (!fs.existsSync(filePath)) continue;

            filesToProcess.push({ filePath, label: `${tripId}/${pageName}.md` });
        }

        for (const entry of filesToProcess) {
            const { changed, scareQuoteWarnings } = processFile(entry.filePath, dryRun);

            if (changed) {
                console.log(`  ${dryRun ? 'Would fix' : 'Fixed'}: ${entry.label}`);
                totalFixed++;
            }

            if (scareQuoteWarnings.length > 0) {
                allScareQuotes.push(...scareQuoteWarnings.map(w => ({ ...w, label: entry.label })));
                totalScareQuotes += scareQuoteWarnings.length;
            }
        }
    }

    console.log(`\n  ${totalFixed} file${totalFixed !== 1 ? 's' : ''} ${dryRun ? 'would be' : ''} normalized`);

    if (allScareQuotes.length > 0) {
        console.log(`\n  \u26A0\uFE0F  ${totalScareQuotes} possible single-quote scare quote${totalScareQuotes !== 1 ? 's' : ''} (manual review needed):\n`);
        for (const w of allScareQuotes) {
            console.log(`    ${w.label}:${w.line}  ${w.text}`);
            console.log(`      "${w.context}"`);
        }
    }

    console.log('');
}

main();
