#!/usr/bin/env node

/**
 * Content Audit — sentence-level and page-level writing quality checks.
 *
 * Scans markdown content files and outputs a prioritized list of specific,
 * actionable issues with line numbers and quoted text.
 *
 * Usage:
 *   npm run audit                     # All trips
 *   npm run audit -- spain            # All files in spain/
 *   npm run audit -- spain/cordoba    # Just cordoba.md
 *   npm run audit -- spain --all      # Show all issues (no cap)
 */

const fs = require('fs');
const path = require('path');
const CONFIG = require('../../lib/config-paths');
const { GALLERY_MARKER } = require('../../lib/constants');
const { discoverAllTrips, loadTripConfig } = require('../../lib/build-utilities');
const writeGood = require('write-good');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEVERITY_ORDER = { red: 0, warn: 1, note: 2 };
const SEVERITY_EMOJI = { red: '🚩', warn: '⚠️', note: 'ℹ️' };
const SEVERITY_LABEL = { red: 'Red flags', warn: 'Warnings', note: 'Notes' };
const ISSUES_CAP = 20;

const WEAK_OPENINGS = [
    /^There\s+(is|are|was|were)\b/i,
    /^It\s+(is|was)\b/i,
    /^We\s+were\s+able\s+to\b/i,
    /^We\s+really\s+(enjoyed|liked)\b/i,
];

const HEDGE_WORDS = /\b(kind of|sort of|somewhat|fairly|quite|maybe|perhaps|pretty)\b/i;

const VAGUE_WORDS = /\b(interesting|nice|great|enjoyable|beautiful|lovely|amazing|wonderful|fantastic|incredible|stunning)\b/gi;

const VOICE_MARKERS = /\b(recommend|highlight|favorite|worth|skip|avoid|overrated|underrated|better|worse|compared|unlike|however|honestly|frankly|surprised|disappointed|delighted|regret|loved|hated)\b/gi;

const LOGISTICS_HEADINGS = ['practical tips', 'practical', 'logistics', 'getting there', 'getting around'];

// Files to skip during audit (not editorial content)
const SKIP_FILES = ['all-synced-photos.md'];

// ---------------------------------------------------------------------------
// Markdown parsing — line-aware
// ---------------------------------------------------------------------------

function classifyLine(trimmed) {
    if (/^#{1,6}\s/.test(trimmed)) return 'heading';
    if (/^!\[/.test(trimmed)) return 'image';
    if (/^>\s?/.test(trimmed)) return 'blockquote';
    if (/^---+$/.test(trimmed) || /^\*\*\*+$/.test(trimmed)) return 'hr';
    return 'text';
}

function parseBlocks(markdown) {
    const lines = markdown.split('\n');
    const blocks = [];
    let currentBlock = null;

    for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        const lineNum = i + 1;

        if (trimmed === '') {
            if (currentBlock) {
                blocks.push(currentBlock);
                currentBlock = null;
            }
            continue;
        }

        const type = classifyLine(trimmed);

        // Headings, images, hrs are always their own block
        if (type !== 'text' && type !== 'blockquote') {
            if (currentBlock) blocks.push(currentBlock);
            blocks.push({ type, startLine: lineNum, lines: [trimmed] });
            currentBlock = null;
        } else if (!currentBlock || currentBlock.type !== type) {
            if (currentBlock) blocks.push(currentBlock);
            currentBlock = { type, startLine: lineNum, lines: [trimmed] };
        } else {
            currentBlock.lines.push(trimmed);
        }
    }
    if (currentBlock) blocks.push(currentBlock);
    return blocks;
}

function stripInlineMarkdown(text) {
    return text
        .replace(/!\[[^\]]*\]\([^\)]+\)/g, '')
        .replace(/\[([^\]]*)\]\([^\)]+\)/g, '$1')
        .replace(/(\*{1,3}|_{1,3})/g, '')
        .replace(/<[^>]+>/g, '')
        .replace(/^>\s?/gm, '')
        .replace(/\\\~/g, '~')
        .replace(/\\([€$])/g, '$1')
        .trim();
}

function countWords(text) {
    if (!text) return 0;
    return text.split(/\s+/).filter(w => w.length > 0).length;
}

function splitSentences(text) {
    // Protect common abbreviations and decimals from splitting
    const prepared = text
        .replace(/\b(Mr|Mrs|Ms|Dr|St|vs|etc|approx|Jr|Sr|Inc|e\.g|i\.e)\./gi, '$1\u2024')
        .replace(/(\d)\./g, '$1\u2024')
        .replace(/\b([A-Z])\.\s*([A-Z])\./g, '$1\u2024 $2\u2024');

    const raw = prepared.split(/(?<=[.!?])\s+/);
    return raw.map(s => s.replace(/\u2024/g, '.').trim()).filter(s => s.length > 2);
}

function truncate(text, maxLen) {
    const stripped = stripInlineMarkdown(text).replace(/\s+/g, ' ').trim();
    if (stripped.length <= maxLen) return `"${stripped}"`;
    return `"${stripped.substring(0, maxLen - 3)}..."`;
}

// ---------------------------------------------------------------------------
// Sentence-level checks
// ---------------------------------------------------------------------------

function checkSentenceLength(sentence, lineNum) {
    const words = countWords(stripInlineMarkdown(sentence));
    if (words >= 40) {
        return { severity: 'red', tag: 'LONG', line: lineNum, text: truncate(sentence, 90), detail: `${words} words — split this sentence` };
    }
    if (words >= 30) {
        return { severity: 'warn', tag: 'LONG', line: lineNum, text: truncate(sentence, 90), detail: `${words} words` };
    }
    if (words >= 25) {
        const commas = (sentence.match(/,/g) || []).length;
        const hasSubordinating = /\b(which|that|while|although|because|where|when|unless|since|whereas)\b/i.test(sentence);
        if (commas >= 2 || hasSubordinating) {
            return { severity: 'note', tag: 'LONG', line: lineNum, text: truncate(sentence, 90), detail: `${words} words, ${commas} commas` };
        }
    }
    return null;
}

function checkPassive(sentence, lineNum) {
    const stripped = stripInlineMarkdown(sentence);
    if (stripped.length < 10) return null;
    try {
        const results = writeGood(stripped, {
            passive: true, illusion: false, so: false, thereIs: false,
            weasel: false, adverb: false, tooWordy: false, cliches: false
        });
        if (results.length > 0) {
            const match = results[0];
            const passivePhrase = stripped.substring(match.index, match.index + match.offset);
            return { severity: 'warn', tag: 'PASSIVE', line: lineNum, text: truncate(sentence, 90), detail: `"${passivePhrase}"` };
        }
    } catch (e) { /* skip on error */ }
    return null;
}

function checkWeakOpening(sentence, lineNum) {
    const stripped = stripInlineMarkdown(sentence);
    for (const pattern of WEAK_OPENINGS) {
        const match = stripped.match(pattern);
        if (match) {
            return { severity: 'warn', tag: 'OPENING', line: lineNum, text: truncate(sentence, 90), detail: `starts with "${match[0]}"` };
        }
    }
    return null;
}

function checkHedge(sentence, lineNum) {
    const stripped = stripInlineMarkdown(sentence);
    const match = stripped.match(HEDGE_WORDS);
    if (match) {
        return { severity: 'note', tag: 'HEDGE', line: lineNum, text: truncate(sentence, 90), detail: `"${match[0]}" reduces authority` };
    }
    return null;
}

function checkVague(sentence, lineNum) {
    const stripped = stripInlineMarkdown(sentence);
    const matches = [...stripped.matchAll(VAGUE_WORDS)];
    if (matches.length > 0) {
        const words = [...new Set(matches.map(m => m[0].toLowerCase()))];
        return { severity: 'note', tag: 'VAGUE', line: lineNum, text: truncate(sentence, 90), detail: `"${words.join('", "')}" — anchor with specifics` };
    }
    return null;
}

function checkRedundantModifiers(sentence, lineNum) {
    // Match 3+ comma-separated words (adjective cluster pattern)
    const match = sentence.match(/\b(\w+),\s+(\w+),\s+(?:and\s+)?(\w+)\s+\w+/);
    if (match) {
        const cluster = `${match[1]}, ${match[2]}, ${match[3]}`;
        return { severity: 'note', tag: 'REDUNDANT', line: lineNum, text: truncate(sentence, 90), detail: `"${cluster}" — pick one or two` };
    }
    return null;
}

// ---------------------------------------------------------------------------
// Cross-sentence checks
// ---------------------------------------------------------------------------

function checkRepetition(sentenceData) {
    const issues = [];
    const openers = sentenceData.map(s => ({
        opener: stripInlineMarkdown(s.text).split(/\s+/).slice(0, 3).join(' ').toLowerCase(),
        line: s.line,
        text: s.text
    }));

    for (let i = 0; i < openers.length - 1; i++) {
        if (openers[i].opener.split(' ').length < 2) continue;
        for (let j = i + 1; j < Math.min(i + 5, openers.length); j++) {
            if (openers[i].opener === openers[j].opener) {
                issues.push({
                    severity: 'warn', tag: 'REPEAT', line: openers[j].line,
                    text: truncate(openers[j].text, 90),
                    detail: `same opener "${openers[j].opener}" as line ${openers[i].line}`
                });
                break;
            }
        }
    }
    return issues;
}

function checkRhythm(sentenceData) {
    const issues = [];
    const flaggedLines = new Set();

    for (let i = 0; i < sentenceData.length - 2; i++) {
        if (flaggedLines.has(sentenceData[i].line)) continue;
        const lens = [sentenceData[i].words, sentenceData[i + 1].words, sentenceData[i + 2].words];
        const avg = (lens[0] + lens[1] + lens[2]) / 3;
        const allSimilar = lens.every(l => Math.abs(l - avg) <= 5);
        const allLong = lens.every(l => l >= 15);
        if (allSimilar && allLong) {
            issues.push({
                severity: 'note', tag: 'RHYTHM', line: sentenceData[i].line,
                text: `3 consecutive sentences of similar length (${lens.join(', ')} words)`,
                detail: 'vary sentence length for better rhythm'
            });
            flaggedLines.add(sentenceData[i].line);
        }
    }
    return issues;
}

// ---------------------------------------------------------------------------
// Block-level / page-level checks
// ---------------------------------------------------------------------------

function checkParagraphDensity(block) {
    const text = stripInlineMarkdown(block.lines.join(' '));
    const sentences = splitSentences(text);
    const opener = text.split(/\s+/).slice(0, 6).join(' ');
    if (sentences.length >= 6) {
        return { severity: 'red', tag: 'DENSE', line: block.startLine, text: `${sentences.length} sentences (starts with "${opener}...")`, detail: 'target 2-4 sentences per paragraph' };
    }
    if (sentences.length === 5) {
        return { severity: 'warn', tag: 'DENSE', line: block.startLine, text: `5 sentences (starts with "${opener}...")`, detail: 'consider splitting' };
    }
    return null;
}

function checkVisualRhythm(blocks) {
    const issues = [];
    let consecutiveText = 0;
    let firstTextLine = 0;
    let firstTextOpener = '';

    function flush() {
        if (consecutiveText >= 5) {
            issues.push({ severity: 'red', tag: 'VISUAL', line: firstTextLine, text: `${consecutiveText} text paragraphs without visual break (starts with "${firstTextOpener}...")`, detail: 'add image, blockquote, or subheading' });
        } else if (consecutiveText === 4) {
            issues.push({ severity: 'warn', tag: 'VISUAL', line: firstTextLine, text: `${consecutiveText} text paragraphs without visual break (starts with "${firstTextOpener}...")`, detail: 'consider adding a visual element' });
        }
        consecutiveText = 0;
    }

    for (const block of blocks) {
        if (block.type === 'text') {
            if (consecutiveText === 0) {
                firstTextLine = block.startLine;
                firstTextOpener = stripInlineMarkdown(block.lines.join(' ')).split(/\s+/).slice(0, 6).join(' ');
            }
            consecutiveText++;
        } else {
            flush();
        }
    }
    flush();
    return issues;
}

function checkEnding(blocks) {
    const lastHeadingIdx = findLastIndex(blocks, b => b.type === 'heading');
    if (lastHeadingIdx === -1) return [];

    const headingText = blocks[lastHeadingIdx].lines.join(' ').replace(/^#+\s*/, '').toLowerCase().trim();
    if (!LOGISTICS_HEADINGS.includes(headingText)) return [];

    // Check if there's reflective content after
    const afterBlocks = blocks.slice(lastHeadingIdx + 1).filter(b => b.type === 'text');
    const hasReflection = afterBlocks.some(b => {
        const text = b.lines.join(' ').toLowerCase();
        return /\b(loved|memorable|highlight|favorite|recommend|worth|regret|wish|surprised|unexpected)\b/.test(text);
    });

    if (!hasReflection) {
        return [{ severity: 'note', tag: 'ENDING', line: blocks[lastHeadingIdx].startLine, text: `Post ends with "${headingText}" section`, detail: 'consider a reflective closing after logistics' }];
    }
    return [];
}

function checkFirstSentence(blocks) {
    const firstText = blocks.find(b => b.type === 'text');
    if (!firstText) return [];

    const text = stripInlineMarkdown(firstText.lines.join(' '));
    const sentences = splitSentences(text);
    if (sentences.length === 0) return [];

    const issue = checkWeakOpening(sentences[0], firstText.startLine);
    if (issue) {
        issue.tag = 'OPENER';
        issue.detail = `first sentence — ${issue.detail}`;
        return [issue];
    }
    return [];
}

function checkVoiceProxy(blocks, totalWords) {
    const allText = blocks.filter(b => b.type === 'text').map(b => b.lines.join(' ')).join(' ');
    const matches = [...allText.matchAll(VOICE_MARKERS)];
    const ratio = totalWords > 0 ? matches.length / (totalWords / 100) : 0;

    if (totalWords >= 200 && ratio < 0.5) {
        return [{ severity: 'note', tag: 'VOICE', line: 1, text: `Only ${matches.length} opinion/judgment markers in ${totalWords} words`, detail: 'might read as too descriptive — add personal perspective' }];
    }
    return [];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findLastIndex(arr, fn) {
    for (let i = arr.length - 1; i >= 0; i--) {
        if (fn(arr[i])) return i;
    }
    return -1;
}

function sortIssues(issues) {
    return issues.sort((a, b) => {
        const sevDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
        if (sevDiff !== 0) return sevDiff;
        return a.line - b.line;
    });
}

function formatLine(lineNum, contentLines) {
    if (!contentLines) return `L${String(lineNum).padEnd(4)}`;
    const rawLine = (contentLines[lineNum - 1] || '').trim();
    if (!rawLine) return `L${lineNum}`;
    const stripped = stripInlineMarkdown(rawLine).replace(/\s+/g, ' ').trim();
    if (!stripped) return `L${lineNum}`;
    const preview = stripped.length > 40 ? stripped.substring(0, 37) + '...' : stripped;
    return `L${lineNum} (starts with "${preview}")`;
}

// ---------------------------------------------------------------------------
// Main audit for a single file
// ---------------------------------------------------------------------------

function auditFile(filePath) {
    const raw = fs.readFileSync(filePath, 'utf8');

    // Split at gallery marker — only audit pre-gallery content
    const markerIndex = raw.indexOf(GALLERY_MARKER);
    const content = markerIndex !== -1 ? raw.substring(0, markerIndex).trim() : raw;
    const contentLines = content.split('\n');

    const blocks = parseBlocks(content);
    const textBlocks = blocks.filter(b => b.type === 'text');

    // Count total words
    const totalWords = textBlocks.reduce((sum, b) => {
        return sum + countWords(stripInlineMarkdown(b.lines.join(' ')));
    }, 0);

    if (totalWords < 100) {
        return { totalWords, contentLines, issues: [{ severity: 'note', tag: 'SHORT', line: 1, text: `File has only ${totalWords} words`, detail: 'too short for meaningful audit' }] };
    }

    const issues = [];

    // Collect all sentences with metadata for cross-sentence checks
    const allSentenceData = [];

    for (const block of textBlocks) {
        // Paragraph density check
        const densityIssue = checkParagraphDensity(block);
        if (densityIssue) issues.push(densityIssue);

        // Sentence-level checks
        const text = stripInlineMarkdown(block.lines.join(' '));
        const sentences = splitSentences(text);

        for (const sentence of sentences) {
            const words = countWords(sentence);
            allSentenceData.push({ text: sentence, line: block.startLine, words });

            const lengthIssue = checkSentenceLength(sentence, block.startLine);
            if (lengthIssue) issues.push(lengthIssue);

            const passiveIssue = checkPassive(sentence, block.startLine);
            if (passiveIssue) issues.push(passiveIssue);

            // Skip weak opening check for non-first sentences in a paragraph
            // (the OPENER page-level check handles first sentence of page)
            const openingIssue = checkWeakOpening(sentence, block.startLine);
            if (openingIssue) issues.push(openingIssue);

            const hedgeIssue = checkHedge(sentence, block.startLine);
            if (hedgeIssue) issues.push(hedgeIssue);

            const vagueIssue = checkVague(sentence, block.startLine);
            if (vagueIssue) issues.push(vagueIssue);

            const redundantIssue = checkRedundantModifiers(sentence, block.startLine);
            if (redundantIssue) issues.push(redundantIssue);
        }
    }

    // Cross-sentence checks
    issues.push(...checkRepetition(allSentenceData));
    issues.push(...checkRhythm(allSentenceData));

    // Page-level structural checks
    issues.push(...checkVisualRhythm(blocks));
    issues.push(...checkEnding(blocks));
    issues.push(...checkFirstSentence(blocks));
    issues.push(...checkVoiceProxy(blocks, totalWords));

    return { totalWords, contentLines, issues: sortIssues(issues) };
}

// ---------------------------------------------------------------------------
// Output formatting
// ---------------------------------------------------------------------------

function printFileReport(label, title, totalWords, issues, showAll, contentLines) {
    const cap = showAll ? Infinity : ISSUES_CAP;

    console.log(`\n${label}${title ? ' — ' + title : ''} (${totalWords.toLocaleString()} words)`);

    const grouped = { red: [], warn: [], note: [] };
    for (const issue of issues) {
        grouped[issue.severity].push(issue);
    }

    let shown = 0;
    for (const sev of ['red', 'warn', 'note']) {
        if (grouped[sev].length === 0) continue;
        console.log(`\n  ${SEVERITY_EMOJI[sev]} ${SEVERITY_LABEL[sev]}:`);
        for (const issue of grouped[sev]) {
            if (shown >= cap) break;
            const tag = issue.tag.padEnd(8);
            const line = formatLine(issue.line, contentLines);
            console.log(`    ${tag} ${line} ${issue.text}  (${issue.detail})`);
            shown++;
        }
    }

    const counts = `${grouped.red.length} 🚩  ${grouped.warn.length} ⚠️   ${grouped.note.length} ℹ️`;
    console.log(`\n  ${issues.length} issues (${counts})`);

    const omitted = issues.length - Math.min(issues.length, cap);
    if (omitted > 0) {
        console.log(`  +${omitted} more omitted (run with --all to see)`);
    }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
    const args = process.argv.slice(2);
    const showAll = args.includes('--all');
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

    console.log('\n═══ Content Audit ═══');

    const summaries = [];

    for (const tripId of tripIds) {
        if (tripFilter && tripId !== tripFilter) continue;

        const tripConfig = loadTripConfig(tripId);
        const tripDir = CONFIG.getTripDir(tripId);
        const contentItems = tripConfig.content || [];

        // Determine which files to audit
        const filesToAudit = [];

        // Include main.md unless filtering to a specific file
        if (!fileFilter) {
            const mainPath = path.join(tripDir, CONFIG.TRIP_MAIN_FILE);
            if (fs.existsSync(mainPath)) {
                filesToAudit.push({ filePath: mainPath, name: 'main', title: 'Trip Intro', file: CONFIG.TRIP_MAIN_FILE });
            }
        }

        for (const item of contentItems) {
            if (SKIP_FILES.includes(item.file)) continue;

            const pageName = path.basename(item.file, '.md');
            if (fileFilter && pageName !== fileFilter) continue;

            const filePath = path.join(tripDir, item.file);
            if (!fs.existsSync(filePath)) continue;

            filesToAudit.push({ filePath, name: pageName, title: item.title, file: item.file });
        }

        if (filesToAudit.length === 0) continue;

        for (const entry of filesToAudit) {
            const label = `${tripId}/${entry.name}.md`;
            const { totalWords, issues, contentLines } = auditFile(entry.filePath);
            printFileReport(label, entry.title, totalWords, issues, showAll, contentLines);
            summaries.push({ label, issues });
        }
    }

    // Summary table for multi-file runs
    if (summaries.length > 1) {
        console.log('\n── Summary ──');
        for (const s of summaries) {
            const red = s.issues.filter(i => i.severity === 'red').length;
            const warn = s.issues.filter(i => i.severity === 'warn').length;
            const note = s.issues.filter(i => i.severity === 'note').length;
            const label = s.label.padEnd(30);
            console.log(`  ${label} ${String(s.issues.length).padStart(3)} issues (${red} 🚩  ${warn} ⚠️   ${note} ℹ️)`);
        }
        const total = summaries.reduce((sum, s) => sum + s.issues.length, 0);
        console.log(`\n  Total: ${total} issues across ${summaries.length} files`);
    }

    console.log('');
}

main();
