#!/usr/bin/env node

/**
 * Content Report — on-demand analysis of all trip markdown pages.
 *
 * Usage:
 *   npm run report              # All trips
 *   npm run report -- greece    # Single trip
 */

const fs = require('fs');
const path = require('path');
const CONFIG = require('../../lib/config-paths');
const { discoverAllTrips, loadTripConfig, processMarkdownWithGallery } = require('../../lib/build-utilities');

// Analysis libraries
const rs = require('text-readability').default;
const writeGood = require('write-good');
const Sentiment = require('sentiment');
const sentiment = new Sentiment();

// ---------------------------------------------------------------------------
// Markdown → plain text
// ---------------------------------------------------------------------------

function stripMarkdownToPlainText(md) {
    let text = md;
    // Remove images (including alt text — those are counted separately)
    text = text.replace(/!\[[^\]]*\]\([^\)]+\)/g, '');
    // Convert links to just their text
    text = text.replace(/\[([^\]]*)\]\([^\)]+\)/g, '$1');
    // Remove header markers
    text = text.replace(/^#{1,6}\s+/gm, '');
    // Remove emphasis markers
    text = text.replace(/(\*{1,3}|_{1,3})/g, '');
    // Remove horizontal rules
    text = text.replace(/^---+$/gm, '');
    // Remove blockquotes
    text = text.replace(/^>\s?/gm, '');
    // Remove HTML tags (rare but possible)
    text = text.replace(/<[^>]+>/g, '');
    // Collapse whitespace
    text = text.replace(/\s+/g, ' ').trim();
    return text;
}

function countWords(text) {
    if (!text) return 0;
    return text.split(/\s+/).filter(w => w.length > 0).length;
}

// ---------------------------------------------------------------------------
// Metrics extraction
// ---------------------------------------------------------------------------

function analyzeMarkdownFile(filePath, itemFile) {
    const raw = fs.readFileSync(filePath, 'utf8');

    // Split at gallery marker
    const { markdownContent, galleryImages } = processMarkdownWithGallery(filePath, itemFile);

    // Count inline images (in pre-marker content)
    const inlineImageRegex = /!\[([^\]]*)\]\([^\)]+\)/g;
    const inlineMatches = [...markdownContent.matchAll(inlineImageRegex)];
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
    const sentences = plainText.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

    // Readability (need enough text for meaningful scores)
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

    // Write-good analysis
    let passivePct = 0, weaselCount = 0, totalIssues = 0;
    if (words >= 10) {
        try {
            const allSuggestions = writeGood(plainText);
            totalIssues = allSuggestions.length;

            const passiveSuggestions = writeGood(plainText, {
                passive: true, illusion: false, so: false, thereIs: false,
                weasel: false, adverb: false, tooWordy: false, cliches: false
            });
            const passiveCount = passiveSuggestions.length;
            passivePct = sentences > 0 ? Math.round((passiveCount / sentences) * 100) : 0;

            const weaselSuggestions = writeGood(plainText, {
                weasel: true, passive: false, illusion: false, so: false,
                thereIs: false, adverb: false, tooWordy: false, cliches: false
            });
            weaselCount = weaselSuggestions.length;
        } catch (e) {
            // Skip on error
        }
    }

    // Sentiment
    let tone = 0;
    if (words >= 5) {
        const result = sentiment.analyze(plainText);
        tone = result.comparative; // normalized per word
    }

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

function printContentTable(rows, tripTitle, locationCount, articleCount) {
    const cols = [
        { key: 'name',         label: 'Page',     w: 18, align: 'left' },
        { key: 'words',        label: 'Words',    w: 7 },
        { key: 'sentences',    label: 'Sent',     w: 6 },
        { key: 'inlineImages', label: 'Inline',   w: 7 },
        { key: 'galleryCount', label: 'Gallery',  w: 8 },
        { key: 'captionWords', label: 'Captions', w: 9 },
    ];

    const parts = [];
    if (locationCount > 0) parts.push(`${locationCount} location${locationCount !== 1 ? 's' : ''}`);
    if (articleCount > 0) parts.push(`${articleCount} article${articleCount !== 1 ? 's' : ''}`);
    console.log(`\n${tripTitle} — ${parts.join(', ')}`);
    console.log('  Content:');

    // Header
    const header = cols.map(c => pad(c.label, c.w, c.align)).join(' │ ');
    const sep = cols.map(c => '─'.repeat(c.w)).join('─┼─');
    console.log('  ┌─' + cols.map(c => '─'.repeat(c.w)).join('─┬─') + '─┐');
    console.log('  │ ' + header + ' │');
    console.log('  ├─' + sep + '─┤');

    // Data rows
    for (const row of rows) {
        const line = cols.map(c => {
            const v = row[c.key];
            return pad(typeof v === 'number' ? fmtNum(v) : v, c.w, c.align);
        }).join(' │ ');
        console.log('  │ ' + line + ' │');
    }

    // Totals
    const totals = { name: 'TOTAL' };
    for (const c of cols) {
        if (c.key === 'name') continue;
        totals[c.key] = rows.reduce((sum, r) => sum + (r[c.key] || 0), 0);
    }
    console.log('  ├─' + sep + '─┤');
    const totalLine = cols.map(c => {
        const v = totals[c.key];
        return pad(typeof v === 'number' ? fmtNum(v) : v, c.w, c.align);
    }).join(' │ ');
    console.log('  │ ' + totalLine + ' │');
    console.log('  └─' + cols.map(c => '─'.repeat(c.w)).join('─┴─') + '─┘');
}

function printQualityTable(rows) {
    const cols = [
        { key: 'name',       label: 'Page',    w: 18, align: 'left' },
        { key: 'fk',         label: 'FK',      w: 5 },
        { key: 'fog',        label: 'Fog',     w: 5 },
        { key: 'cl',         label: 'CL',      w: 5 },
        { key: 'passivePct', label: 'Passive',  w: 8 },
        { key: 'weaselCount',label: 'Weasel',  w: 7 },
        { key: 'totalIssues',label: 'Issues',  w: 7 },
        { key: 'tone',       label: 'Tone',    w: 6 },
    ];

    console.log('  Quality:');

    const header = cols.map(c => pad(c.label, c.w, c.align)).join(' │ ');
    const sep = cols.map(c => '─'.repeat(c.w)).join('─┼─');
    console.log('  ┌─' + cols.map(c => '─'.repeat(c.w)).join('─┬─') + '─┐');
    console.log('  │ ' + header + ' │');
    console.log('  ├─' + sep + '─┤');

    for (const row of rows) {
        const line = cols.map(c => {
            const v = row[c.key];
            if (c.key === 'name') return pad(v, c.w, 'left');
            if (c.key === 'passivePct') return pad(fmtNum(v) + '%', c.w);
            if (c.key === 'tone') return pad(fmtTone(v), c.w);
            if (c.key === 'fk' || c.key === 'fog' || c.key === 'cl') return pad(fmtNum(v, 1), c.w);
            return pad(fmtNum(v), c.w);
        }).join(' │ ');
        console.log('  │ ' + line + ' │');
    }

    // Averages
    const dataRows = rows.filter(r => r.words >= 20); // only average pages with enough text
    const avg = { name: 'AVG' };
    for (const c of cols) {
        if (c.key === 'name') continue;
        const sum = dataRows.reduce((s, r) => s + (r[c.key] || 0), 0);
        avg[c.key] = dataRows.length > 0 ? sum / dataRows.length : 0;
    }
    console.log('  ├─' + sep + '─┤');
    const avgLine = cols.map(c => {
        const v = avg[c.key];
        if (c.key === 'name') return pad(v, c.w, 'left');
        if (c.key === 'passivePct') return pad(fmtNum(v) + '%', c.w);
        if (c.key === 'tone') return pad(fmtTone(v), c.w);
        if (c.key === 'fk' || c.key === 'fog' || c.key === 'cl') return pad(fmtNum(v, 1), c.w);
        return pad(fmtNum(v, 1), c.w);
    }).join(' │ ');
    console.log('  │ ' + avgLine + ' │');
    console.log('  └─' + cols.map(c => '─'.repeat(c.w)).join('─┴─') + '─┘');
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

function main() {
    const filterTrip = process.argv[2] || null;

    const tripIds = discoverAllTrips(CONFIG.TRIPS_DIR, (id) => CONFIG.getTripConfigPath(id));

    if (tripIds.length === 0) {
        origLog('No trips found.');
        return;
    }

    origLog('\n═══ Content Report ═══');

    for (const tripId of tripIds) {
        if (filterTrip && tripId !== filterTrip) continue;

        const tripConfig = loadTripConfig(tripId);
        const tripDir = CONFIG.getTripDir(tripId);

        const contentItems = tripConfig.content || [];
        const rows = [];

        // Analyze main.md first
        const mainPath = path.join(tripDir, CONFIG.TRIP_MAIN_FILE);
        if (fs.existsSync(mainPath)) {
            suppressLog = true;
            const metrics = analyzeMarkdownFile(mainPath, 'main.md');
            suppressLog = false;
            rows.push({ name: 'main', ...metrics });
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

        if (rows.length === 0) continue;

        printContentTable(rows, tripConfig.title || tripId, locationCount, articleCount);
        origLog('');
        printQualityTable(rows);
    }

    origLog('');
}

main();
