#!/usr/bin/env node

/**
 * Build Context — generates Context-Combined.md from source editorial files.
 *
 * Source files (edit these):
 *   - docs/Content/Brand.md
 *   - docs/Content/Editorial-Standards.md
 *   - docs/Content/AntiAIWritingGuidelines.md
 *
 * Output (never edit directly):
 *   - docs/Content/Context-Combined.md
 *
 * Usage:
 *   npm run build-context
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_DIR = path.join(__dirname, '../../docs/Content');

const PREAMBLE = `# TTN Editorial Context
## How To Use This File

Upload this file at the start of any AI session where you want editorial review or writing assistance.

Then say: "Please review [filename] against my editorial standards" or "Please draft/edit [content] keeping TTN standards in mind."

This file contains three things in order:
1. Brand Identity
2. Editorial Standards
3. Anti-AI Writing Guidelines

---

`;

function readSource(filename) {
    return fs.readFileSync(path.join(DOCS_DIR, filename), 'utf8').trimEnd();
}

function truncateBrandAtVisualAlignment(content) {
    const lines = content.split('\n');
    const cutIdx = lines.findIndex(line => line.startsWith('## Visual Alignment'));
    if (cutIdx === -1) return content;
    // Walk back to remove any trailing blank lines and --- before the cut
    let end = cutIdx - 1;
    while (end >= 0 && lines[end].trim() === '') end--;
    if (end >= 0 && lines[end].trim() === '---') end--;
    while (end >= 0 && lines[end].trim() === '') end--;
    return lines.slice(0, end + 1).join('\n');
}

function stripTopHeading(content) {
    // Remove the first # heading line so the PART header replaces it
    return content.replace(/^#\s+.*\n+/, '');
}

function main() {
    const brand = truncateBrandAtVisualAlignment(readSource('Brand.md'));
    const editorial = readSource('Editorial-Standards.md');
    const antiAI = readSource('AntiAIWritingGuidelines.md');

    const combined = [
        PREAMBLE,
        `# PART 1: Two Travel Nuts — Brand Identity\n\n${stripTopHeading(brand)}`,
        '',
        '---',
        '',
        `# PART 2: Two Travel Nuts — Editorial Standards\n\n${editorial}`,
        '',
        '---',
        '',
        `# PART 3: Anti-AI Writing Guidelines\n\n${stripTopHeading(antiAI)}`,
    ].join('\n') + '\n';

    const outputPath = path.join(DOCS_DIR, 'Context-Combined.md');
    const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '';

    if (combined === existing) {
        console.log('Context-Combined.md is up to date.');
    } else {
        fs.writeFileSync(outputPath, combined, 'utf8');
        console.log('Context-Combined.md regenerated.');
    }
}

main();
