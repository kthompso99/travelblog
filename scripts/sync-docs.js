#!/usr/bin/env node
/**
 * sync-docs — compare documentation against the actual codebase.
 *
 * Checks:
 *   1. Relative markdown links between doc files resolve on disk.
 *   2. `npm run <name>` references match scripts in package.json.
 *   3. Backtick-wrapped file paths that contain a `/` exist on disk.
 *
 * Usage:
 *   npm run sync-docs
 *
 * Exit code 0 = all clean.  Exit code 1 = issues found.
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const { loadJsonFile, walkDir } = require('../lib/build-utilities');

const ROOT = path.resolve(__dirname, '..');

// ── helpers ──────────────────────────────────────────────────────────

function rel(p) {
    return path.relative(ROOT, p);
}

// ── package.json scripts ─────────────────────────────────────────────

const pkg = loadJsonFile(path.join(ROOT, 'package.json'));
const validScripts = new Set(Object.keys(pkg.scripts || {}));

// ── collect .md files ────────────────────────────────────────────────

const SKIP_DIRS = new Set(['node_modules', '.git']);
const mdFiles = [
    ...walkDir(path.join(ROOT, 'docs'), { skipDirs: SKIP_DIRS, fileFilter: name => name.endsWith('.md') }),
    path.join(ROOT, 'README.md'),
    path.join(ROOT, 'CLAUDE.md')
];

// ── scan ─────────────────────────────────────────────────────────────

const issues = [];   // { file, line, kind, message }

for (const mdFile of mdFiles) {
    if (!fs.existsSync(mdFile)) continue;

    const text  = fs.readFileSync(mdFile, 'utf8');
    const lines = text.split('\n');

    lines.forEach((line, idx) => {
        const lineNum = idx + 1;

        // 1. npm script references  ──  npm run <name>
        for (const m of line.matchAll(/npm run (\S+)/g)) {
            // Strip backticks, bold markers, trailing punctuation
            let name = m[1].replace(/[`*]/g, '').replace(/[,;:)"]$/g, '').trim();
            if (!name || name.startsWith('-')) continue;   // --force etc.
            if (!validScripts.has(name)) {
                issues.push({
                    file: rel(mdFile), line: lineNum, kind: 'script',
                    message: `npm run ${name} — not in package.json`
                });
            }
        }

        // 2. Relative markdown links  ──  [text](href)
        for (const m of line.matchAll(/\[([^\]]*)\]\(([^)]+)\)/g)) {
            const href = m[2];
            if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('#')) continue;
            const filePart = decodeURIComponent(href.split('#')[0]);   // handle %20 etc.
            if (!filePart) continue;
            const resolved = path.resolve(path.dirname(mdFile), filePart);
            if (!fs.existsSync(resolved)) {
                issues.push({
                    file: rel(mdFile), line: lineNum, kind: 'link',
                    message: `Broken link → ${filePart}`
                });
            }
        }

        // 3. Backtick file-path references  ──  `some/path/file.ext`
        //    Only flags paths that look like real repo paths, not examples or URLs.
        //    Skip docs/implementation/* files - they contain example code and architecture docs.
        const isImplementationDoc = mdFile.includes('/docs/implementation/');
        if (!isImplementationDoc) {
            for (const m of line.matchAll(/`([^`]+)`/g)) {
            const ref = m[1];
            const clean = ref.replace(/^['"]|['"]$/g, '');   // strip surrounding quotes
            if (!clean.includes('/'))  continue;     // skip single tokens
            if (clean.includes('://')) continue;     // skip URLs
            if (clean.startsWith('.') || clean.startsWith('/')) continue;  // relative / absolute
            if (clean.includes('*') || clean.includes('{') || clean.includes('<')) continue;  // patterns / HTML
            if (clean.includes(' '))   continue;     // prose phrases
            if (clean.endsWith('/'))   continue;     // directory references — too context-dependent
            if (clean.startsWith('actions/')) continue;  // GitHub Actions
            if (/^[a-z0-9_-]+\/[a-z0-9_-]+$/.test(clean)) continue;  // GitHub user/repo pattern
            // Skip domain-looking strings (e.g. twotravelnuts.com/...)
            if (/\.[a-z]{2,4}\//.test(ref)) {
                const knownPrefixes = ['content/', 'templates/', 'lib/', 'scripts/', 'config/', 'docs/', 'images/', 'trips/'];
                if (!knownPrefixes.some(p => ref.startsWith(p))) continue;
            }
            // Skip CI-only artefacts and hypothetical example dirs
            if (ref.startsWith('deploy/') || ref.startsWith('data/')) continue;
            // Skip tutorial example paths — trip slugs that don't exist on disk
            const tripMatch = clean.match(/(?:content\/)?trips\/([^/]+)\//);
            if (tripMatch) {
                const slugDir = path.join(ROOT, 'content', 'trips', tripMatch[1]);
                if (!fs.existsSync(slugDir)) continue;
            }
            const resolved = path.join(ROOT, ref);
            if (!fs.existsSync(resolved)) {
                issues.push({
                    file: rel(mdFile), line: lineNum, kind: 'path',
                    message: `Path not found: ${ref}`
                });
            }
            }
        }
    });
}

// ── report ───────────────────────────────────────────────────────────

if (issues.length === 0) {
    console.log('\n✅  sync-docs: all references check out.\n');
    process.exit(0);
}

const uniqueFiles = new Set(issues.map(i => i.file));
const kindLabel   = { link: 'Broken internal links', script: 'npm script references', path: 'File-path references' };

console.log('\n📋  sync-docs report\n');
console.log(`    ${issues.length} issue${issues.length !== 1 ? 's' : ''} across ${uniqueFiles.size} file${uniqueFiles.size !== 1 ? 's' : ''}\n`);

for (const kind of ['link', 'script', 'path']) {
    const group = issues.filter(i => i.kind === kind);
    if (!group.length) continue;
    console.log(`  ── ${kindLabel[kind]} (${group.length}) ──`);
    for (const { file, line, message } of group) {
        console.log(`    ${file}:${line}  ${message}`);
    }
    console.log('');
}

process.exit(1);
