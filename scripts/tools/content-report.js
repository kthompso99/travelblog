#!/usr/bin/env node

/**
 * Content Report — on-demand analysis of all trip markdown pages.
 *
 * Usage:
 *   npm run report              # All trips
 *   npm run report -- greece    # Single trip
 *   npm run report -- --wordcount          # Word counts only + cross-trip summary
 *   npm run report -- greece --wordcount   # Single trip, word counts only
 */

import fs from 'fs';
import path from 'path';
import CONFIG from '../../lib/config-paths.js';
import { MARKDOWN_IMAGE_REGEX } from '../../lib/constants.js';
import { discoverTrips, loadTripConfig, processMarkdownWithGallery, readTextFile, stripMarkdownToPlainText, countWords, countSentences } from '../../lib/build-utilities.js';
import { parseToolArgs } from './tool-helpers.js';

// Analysis libraries
import rs from 'text-readability';
import writeGood from 'write-good';
import Sentiment from 'sentiment';
const sentiment = new Sentiment();

// ---------------------------------------------------------------------------
// Metrics extraction
// ---------------------------------------------------------------------------

function computeReadability(plainText, words) {
    let fk = 0, fog = 0, cl = 0;
    if (words >= 20) {
        try {
            fk = rs.fleschKincaidGrade(plainText);
            fog = rs.gunningFog(plainText);
            cl = rs.colemanLiauIndex(plainText);
        } catch (e) {
            // Some texts too short for readability
        }
    }
    return { fk, fog, cl };
}

function runWriteGoodAnalysis(plainText, words, sentences) {
    let passivePct = 0, weaselCount = 0, totalIssues = 0;
    if (words >= 10) {
        try {
            const allSuggestions = writeGood(plainText);
            totalIssues = allSuggestions.length;

            const passiveSuggestions = writeGood(plainText, {
                passive: true, illusion: false, so: false, thereIs: false,
                weasel: false, adverb: false, tooWordy: false, cliches: false
            });
            passivePct = sentences > 0 ? Math.round((passiveSuggestions.length / sentences) * 100) : 0;

            const weaselSuggestions = writeGood(plainText, {
                weasel: true, passive: false, illusion: false, so: false,
                thereIs: false, adverb: false, tooWordy: false, cliches: false
            });
            weaselCount = weaselSuggestions.length;
        } catch (e) {
            // Skip on error
        }
    }
    return { passivePct, weaselCount, totalIssues };
}

function analyzeSentiment(plainText, words) {
    if (words >= 5) {
        const result = sentiment.analyze(plainText);
        return result.comparative; // normalized per word
    }
    return 0;
}

function analyzeMarkdownFile(filePath, itemFile) {
    // Split at gallery marker
    const { markdownContent, galleryImages } = processMarkdownWithGallery(filePath);

    // Count inline images (in pre-marker content)
    const inlineMatches = [...markdownContent.matchAll(MARKDOWN_IMAGE_REGEX)];
    const inlineImages = inlineMatches.length;

    // Caption words — inline captions + gallery captions
    let captionWords = 0;
    for (const m of inlineMatches) {
        captionWords += countWords(m[1]);
    }
    if (galleryImages) {
        for (const img of galleryImages) {
            captionWords += countWords(img.caption);
        }
    }

    const galleryCount = galleryImages ? galleryImages.length : 0;

    // Plain text for analysis
    const plainText = stripMarkdownToPlainText(markdownContent);
    const words = countWords(plainText);
    const sentences = countSentences(plainText);

    const { fk, fog, cl } = computeReadability(plainText, words);
    const { passivePct, weaselCount, totalIssues } = runWriteGoodAnalysis(plainText, words, sentences);
    const tone = analyzeSentiment(plainText, words);

    return {
        words, sentences, inlineImages, galleryCount, captionWords,
        fk, fog, cl, passivePct, weaselCount, totalIssues, tone
    };
}

// ---------------------------------------------------------------------------
// Table formatting
// ---------------------------------------------------------------------------

function pad(val, width, align = 'right') {
    const s = String(val);
    if (align === 'left') return s.padEnd(width);
    return s.padStart(width);
}

function fmtNum(n, decimals = 0) {
    if (decimals === 0) return String(Math.round(n));
    return n.toFixed(decimals);
}

function fmtTone(n) {
    const sign = n >= 0 ? '+' : '';
    return sign + n.toFixed(2);
}

/**
 * Print a box-drawing table with optional summary row.
 *
 * @param {Array} cols - Column definitions: { key, label, w, align?, fmt? }
 *   fmt(v) formats a cell value to string (default: integers / pass-through)
 * @param {Array} rows - Data objects keyed by col.key
 * @param {Object} opts
 *   summary: 'total' | 'avg' — what to compute for the footer row
 *   summaryLabel: string shown in the left-aligned column (e.g. 'TOTAL', 'AVG')
 *   summaryFilter: (row) => bool — filter rows before computing averages
 * @returns {Object|undefined} The summary row values when summary is set
 */
function printTable(cols, rows, opts = {}) {
    const { summary, summaryLabel, summaryFilter } = opts;
    const defaultFmt = (v) => typeof v === 'number' ? fmtNum(v) : v;

    // Header
    const header = cols.map(c => pad(c.label, c.w, c.align)).join(' │ ');
    const sep = cols.map(c => '─'.repeat(c.w)).join('─┼─');
    console.log('  ┌─' + cols.map(c => '─'.repeat(c.w)).join('─┬─') + '─┐');
    console.log('  │ ' + header + ' │');
    console.log('  ├─' + sep + '─┤');

    // Data rows
    for (const row of rows) {
        const line = cols.map(c => {
            const fmt = c.fmt || defaultFmt;
            return pad(fmt(row[c.key]), c.w, c.align);
        }).join(' │ ');
        console.log('  │ ' + line + ' │');
    }

    if (!summary) {
        console.log('  └─' + cols.map(c => '─'.repeat(c.w)).join('─┴─') + '─┘');
        return;
    }

    // Summary row
    const sourceRows = summaryFilter ? rows.filter(summaryFilter) : rows;
    const result = {};
    for (const c of cols) {
        if (c.align === 'left') {
            result[c.key] = summaryLabel;
        } else if (summary === 'avg') {
            const sum = sourceRows.reduce((s, r) => s + (r[c.key] || 0), 0);
            result[c.key] = sourceRows.length > 0 ? sum / sourceRows.length : 0;
        } else {
            result[c.key] = sourceRows.reduce((sum, r) => sum + (r[c.key] || 0), 0);
        }
    }

    // For averages, default to 1 decimal; columns with explicit fmt keep theirs
    const summaryDefaultFmt = summary === 'avg'
        ? (v) => typeof v === 'number' ? fmtNum(v, 1) : v
        : defaultFmt;

    console.log('  ├─' + sep + '─┤');
    const line = cols.map(c => {
        const fmt = c.fmt || summaryDefaultFmt;
        return pad(fmt(result[c.key]), c.w, c.align);
    }).join(' │ ');
    console.log('  │ ' + line + ' │');
    console.log('  └─' + cols.map(c => '─'.repeat(c.w)).join('─┴─') + '─┘');

    return result;
}

function printContentTable(rows, tripTitle, locationCount, articleCount) {
    const parts = [];
    if (locationCount > 0) parts.push(`${locationCount} location${locationCount !== 1 ? 's' : ''}`);
    if (articleCount > 0) parts.push(`${articleCount} article${articleCount !== 1 ? 's' : ''}`);
    console.log(`\n${tripTitle} — ${parts.join(', ')}`);
    console.log('  Content:');

    printTable([
        { key: 'name',         label: 'Page',     w: 18, align: 'left' },
        { key: 'words',        label: 'Words',    w: 7 },
        { key: 'sentences',    label: 'Sent',     w: 6 },
        { key: 'inlineImages', label: 'Inline',   w: 7 },
        { key: 'galleryCount', label: 'Gallery',  w: 8 },
        { key: 'captionWords', label: 'Captions', w: 9 },
    ], rows, { summary: 'total', summaryLabel: 'TOTAL' });
}

function printQualityTable(rows) {
    console.log('  Quality:');

    printTable([
        { key: 'name',        label: 'Page',    w: 18, align: 'left' },
        { key: 'fk',          label: 'FK',      w: 5,  fmt: v => fmtNum(v, 1) },
        { key: 'fog',         label: 'Fog',     w: 5,  fmt: v => fmtNum(v, 1) },
        { key: 'cl',          label: 'CL',      w: 5,  fmt: v => fmtNum(v, 1) },
        { key: 'passivePct',  label: 'Passive', w: 8,  fmt: v => fmtNum(v) + '%' },
        { key: 'weaselCount', label: 'Weasel',  w: 7 },
        { key: 'totalIssues', label: 'Issues',  w: 7 },
        { key: 'tone',        label: 'Tone',    w: 6,  fmt: v => fmtTone(v) },
    ], rows, { summary: 'avg', summaryLabel: 'AVG', summaryFilter: r => r.words >= 20 });
}

function printWordCountTable(rows, tripTitle) {
    console.log(`\n${tripTitle}`);

    const totals = printTable([
        { key: 'name',         label: 'Page',     w: 18, align: 'left' },
        { key: 'words',        label: 'Words',    w: 7 },
        { key: 'captionWords', label: 'Captions', w: 9 },
    ], rows, { summary: 'total', summaryLabel: 'TOTAL' });

    return { words: totals.words, captionWords: totals.captionWords };
}

function printWordCountSummary(tripTotals) {
    console.log('\n── Word Count Summary ──');

    printTable([
        { key: 'name',         label: 'Trip',     w: 18, align: 'left' },
        { key: 'words',        label: 'Words',    w: 7 },
        { key: 'captionWords', label: 'Captions', w: 9 },
    ], tripTotals, { summary: 'total', summaryLabel: 'TOTAL' });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

// Suppress processMarkdownWithGallery console.log output
const origLog = console.log;
let suppressLog = false;
console.log = function (...args) {
    if (suppressLog) return;
    origLog.apply(console, args);
};

// Parse CLI arguments
function parseArgs(argv) {
    const { tripFilter, flags } = parseToolArgs(argv, {
        booleanFlags: ['--wordcount'],
        allowTripFilePattern: false
    });
    return { wordcountMode: flags.wordcount, filterTrip: tripFilter };
}

// Analyze a single trip's files
function analyzeTripFiles(tripId) {
    const tripConfig = loadTripConfig(tripId);
    const tripDir = CONFIG.getTripDir(tripId);
    const contentItems = tripConfig.content || [];
    const rows = [];

    // Analyze main.md first
    const mainPath = CONFIG.getTripOverviewPath(tripId);
    if (fs.existsSync(mainPath)) {
        suppressLog = true;
        const metrics = analyzeMarkdownFile(mainPath, 'main.md');
        suppressLog = false;
        rows.push({ name: 'overview', ...metrics });
    }

    // Analyze each content item
    let locationCount = 0;
    let articleCount = 0;
    for (const item of contentItems) {
        if (item.type === 'location') locationCount++;
        else if (item.type === 'article') articleCount++;

        const filePath = path.join(tripDir, item.file);
        if (!fs.existsSync(filePath)) continue;

        const pageName = path.basename(item.file, '.md');
        suppressLog = true;
        const metrics = analyzeMarkdownFile(filePath, item.file);
        suppressLog = false;
        rows.push({ name: pageName, ...metrics });
    }

    return {
        tripId,
        title: tripConfig.title || tripId,
        rows,
        locationCount,
        articleCount
    };
}

// Main function
function main() {
    const { wordcountMode, filterTrip } = parseArgs(process.argv);

    const tripIds = discoverTrips(filterTrip);

    if (tripIds.length === 0) {
        origLog('No trips found.');
        return;
    }

    origLog(wordcountMode ? '\n═══ Word Count Report ═══' : '\n═══ Content Report ═══');

    const tripTotals = [];

    for (const tripId of tripIds) {

        const tripData = analyzeTripFiles(tripId);
        if (tripData.rows.length === 0) continue;

        if (wordcountMode) {
            const totals = printWordCountTable(tripData.rows, tripData.title);
            tripTotals.push({ name: tripData.tripId, ...totals });
        } else {
            printContentTable(tripData.rows, tripData.title, tripData.locationCount, tripData.articleCount);
            origLog('');
            printQualityTable(tripData.rows);
        }
    }

    if (wordcountMode && tripTotals.length > 1) {
        printWordCountSummary(tripTotals);
    }

    origLog('');
}

main();
