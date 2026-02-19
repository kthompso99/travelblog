#!/usr/bin/env node

/**
 * Unit tests for lib/markdown-converter.js
 *
 * Tests every post-processing transformation in isolation, without requiring
 * a full site build or a browser. Uses a temporary directory so tests are
 * self-contained and leave no artefacts behind.
 *
 * Run with: node scripts/test/test-markdown-converter.js
 *           (also included in: npm test)
 *
 * Behaviours covered
 * ──────────────────
 * External links     → target="_blank" rel="noopener noreferrer" added
 *                    → existing target= attribute not duplicated
 * Image captions     → ![alt](img) → <figure><img><figcaption>
 *                    → no-alt images stay as <p><img>
 * Image sizing       → landscape (w > h) → max-width: 600px
 *                    → portrait  (h > w) → max-width: 375px
 *                    → missing file defaults to 600px
 *                    → img with existing style= is untouched
 * Video conversion   → .mp4 with caption  → <figure><video type="video/mp4">
 *                    → .mov               → type="video/quicktime"
 *                    → .webm              → type="video/webm"
 *                    → no-alt video       → <p><video> (no figcaption)
 */

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const { convertMarkdown } = require('../../lib/markdown-converter');

// ─── Helpers ────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition, label) {
    if (condition) {
        console.log(`  ✅ ${label}`);
        passed++;
    } else {
        console.log(`  ❌ FAIL: ${label}`);
        failed++;
    }
}

/** Write a markdown file into dir and return its full path. */
function writeMd(dir, name, content) {
    const p = path.join(dir, name);
    fs.writeFileSync(p, content, 'utf8');
    return p;
}

/**
 * Build a minimal PNG buffer that image-size can parse.
 *
 * image-size reads the PNG signature + IHDR chunk header to extract
 * width/height — it does NOT validate the CRC, so a truncated but
 * correctly-structured header is enough.
 *
 * Layout (33 bytes total):
 *   0–7   PNG signature
 *   8–11  IHDR chunk length (always 13 = 0x0000000D)
 *  12–15  "IHDR"
 *  16–19  width  (big-endian uint32)
 *  20–23  height (big-endian uint32)
 *  24–28  bit depth + color type + compression + filter + interlace
 *  29–32  fake CRC (image-size doesn't validate)
 */
function minimalPng(width, height) {
    const w = Buffer.alloc(4);
    const h = Buffer.alloc(4);
    w.writeUInt32BE(width,  0);
    h.writeUInt32BE(height, 0);
    return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), // PNG sig
        Buffer.from([0x00, 0x00, 0x00, 0x0D]),                            // IHDR length
        Buffer.from([0x49, 0x48, 0x44, 0x52]),                            // "IHDR"
        w, h,
        Buffer.from([0x08, 0x02, 0x00, 0x00, 0x00]),                      // depth/color/etc
        Buffer.alloc(4),                                                   // fake CRC
    ]);
}

// ─── Tests ──────────────────────────────────────────────────────────────────

async function run() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'md-converter-test-'));

    try {
        // Write PNG fixtures for orientation tests
        fs.writeFileSync(path.join(dir, 'landscape.png'), minimalPng(200, 100));
        fs.writeFileSync(path.join(dir, 'portrait.png'),  minimalPng(100, 200));

        // ── External links ───────────────────────────────────────────────────
        console.log('\n🔗 External links');

        {
            const f = writeMd(dir, 'links.md', '[Visit site](https://example.com)\n');
            const html = await convertMarkdown(f);
            assert(html.includes('target="_blank"'),              'adds target="_blank"');
            assert(html.includes('rel="noopener noreferrer"'),    'adds rel="noopener noreferrer"');
        }

        {
            // Raw HTML link that already carries target= should not get a second one
            const f = writeMd(dir, 'link-existing-target.md',
                '<a href="https://example.com" target="_blank">text</a>\n');
            const html = await convertMarkdown(f);
            const count = (html.match(/target=/g) || []).length;
            assert(count === 1, 'does not duplicate target= on links that already have it');
        }

        // ── Image captions ───────────────────────────────────────────────────
        console.log('\n🖼️  Image captions');

        {
            const f = writeMd(dir, 'caption.md', '![Sunset over the sea](missing.jpg)\n');
            const html = await convertMarkdown(f);
            assert(html.includes('<figure>'),                                    'image with alt text gets <figure>');
            assert(html.includes('<figcaption>Sunset over the sea</figcaption>'), 'alt text becomes figcaption text');
        }

        {
            const f = writeMd(dir, 'no-caption.md', '![](missing.jpg)\n');
            const html = await convertMarkdown(f);
            assert(!html.includes('<figure>'), 'image without alt text is not wrapped in <figure>');
            assert(html.includes('<p>'),        'image without alt text stays in <p>');
        }

        // ── Image sizing ─────────────────────────────────────────────────────
        console.log('\n📐 Image sizing');

        {
            const f = writeMd(dir, 'landscape.md', '![photo](landscape.png)\n');
            const html = await convertMarkdown(f);
            assert(html.includes('max-width: 600px'), 'landscape image (w > h) gets max-width: 600px');
        }

        {
            const f = writeMd(dir, 'portrait.md', '![photo](portrait.png)\n');
            const html = await convertMarkdown(f);
            assert(html.includes('max-width: 375px'), 'portrait image (h > w) gets max-width: 375px');
        }

        {
            const f = writeMd(dir, 'missing-img.md', '![photo](does-not-exist.jpg)\n');
            const html = await convertMarkdown(f);
            assert(html.includes('max-width: 600px'), 'missing image file defaults to 600px');
        }

        {
            // Raw HTML img with existing style= must be left untouched
            const f = writeMd(dir, 'styled-img.md',
                '<img src="landscape.png" style="border: 1px solid red">\n');
            const html = await convertMarkdown(f);
            assert(!html.includes('max-width'), 'img with existing style= is not resized');
        }

        // ── Video conversion ─────────────────────────────────────────────────
        console.log('\n🎬 Video conversion');

        {
            const f = writeMd(dir, 'video-mp4.md', '![A timelapse](clip.mp4)\n');
            const html = await convertMarkdown(f);
            assert(html.includes('<video'),                              'mp4 with caption becomes <video>');
            assert(html.includes('type="video/mp4"'),                   'mp4 gets correct MIME type');
            assert(html.includes('<figcaption>A timelapse</figcaption>'), 'mp4 caption is preserved');
        }

        {
            const f = writeMd(dir, 'video-mov.md', '![A timelapse](clip.mov)\n');
            const html = await convertMarkdown(f);
            assert(html.includes('type="video/quicktime"'), '.mov gets video/quicktime MIME type');
        }

        {
            const f = writeMd(dir, 'video-webm.md', '![A timelapse](clip.webm)\n');
            const html = await convertMarkdown(f);
            assert(html.includes('type="video/webm"'), '.webm gets correct MIME type');
        }

        {
            const f = writeMd(dir, 'video-no-caption.md', '![](clip.mp4)\n');
            const html = await convertMarkdown(f);
            assert(html.includes('<video'),       'mp4 without alt text still becomes <video>');
            assert(!html.includes('<figcaption>'), 'mp4 without alt text has no figcaption');
        }

    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }

    // ── Summary ──────────────────────────────────────────────────────────────
    const total = passed + failed;
    console.log(`\n📋 markdown-converter: ${total} tests — ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
}

run().catch(err => {
    console.error('\n❌ Unexpected error:', err.message);
    process.exit(1);
});
