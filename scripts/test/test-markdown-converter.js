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
 * Gallery stripping  → marker + images    → marker stripped, images extracted
 *                    → marker, no images  → marker still stripped from output
 *                    → no marker          → content unchanged, galleryImages null
 * Nutshell blocks    → :::nutshell block  → parsed and rendered as structured HTML
 *                    → no block           → content unchanged
 *                    → field ordering     → follows NUTSHELL_FIELDS from constants
 *                    → extra fields       → appended after schema-defined fields
 */

const fs   = require('fs');
const path = require('path');

const { convertMarkdown } = require('../../lib/markdown-converter');
const { convertMarkdownWithGallery } = require('../../lib/build-utilities');
const { parseNutshellBlock, renderNutshell, processNutshell } = require('../../lib/nutshell');
const { createTestRunner, createTempDir, removeTempDir } = require('./test-helpers');

// ─── Helpers ────────────────────────────────────────────────────────────────

const { assert, report } = createTestRunner('📋 markdown-converter');

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
    const dir = createTempDir('md-converter-test-');

    try {
        // Write PNG fixtures for orientation tests
        fs.writeFileSync(path.join(dir, 'landscape.png'), minimalPng(200, 100));
        fs.writeFileSync(path.join(dir, 'portrait.png'),  minimalPng(100, 200));

        // ── External links ───────────────────────────────────────────────────
        console.log('\n🔗 External links');

        {
            const f = writeMd(dir, 'links.md', '[Visit site](https://example.com)\n');
            const html = await convertMarkdown(f);
            assert('adds target="_blank"',              html.includes('target="_blank"'));
            assert('adds rel="noopener noreferrer"',    html.includes('rel="noopener noreferrer"'));
        }

        {
            // Raw HTML link that already carries target= should not get a second one
            const f = writeMd(dir, 'link-existing-target.md',
                '<a href="https://example.com" target="_blank">text</a>\n');
            const html = await convertMarkdown(f);
            const count = (html.match(/target=/g) || []).length;
            assert('does not duplicate target= on links that already have it', count === 1);
        }

        {
            // Internal (relative) links should NOT get target="_blank"
            const f = writeMd(dir, 'internal-link.md', '[Tips](tips.html)\n');
            const html = await convertMarkdown(f);
            assert('internal link does not get target="_blank"', !html.includes('target="_blank"'));
            assert('internal link is still an <a> tag',          html.includes('<a'));
            assert('internal link href is preserved',            html.includes('href="tips.html"'));
        }

        // ── Image captions ───────────────────────────────────────────────────
        console.log('\n🖼️  Image captions');

        {
            const f = writeMd(dir, 'caption.md', '![Sunset over the sea](missing.jpg)\n');
            const html = await convertMarkdown(f);
            assert('image with alt text gets <figure>',                                    html.includes('<figure>'));
            assert('alt text becomes figcaption text', html.includes('<figcaption>Sunset over the sea</figcaption>'));
        }

        {
            const f = writeMd(dir, 'no-caption.md', '![](missing.jpg)\n');
            const html = await convertMarkdown(f);
            assert('image without alt text is not wrapped in <figure>', !html.includes('<figure>'));
            assert('image without alt text stays in <p>',        html.includes('<p>'));
        }

        // ── Image sizing ─────────────────────────────────────────────────────
        console.log('\n📐 Image sizing');

        {
            const f = writeMd(dir, 'landscape.md', '![photo](landscape.png)\n');
            const html = await convertMarkdown(f);
            assert('landscape image (w > h) gets max-width: 600px', html.includes('max-width: 600px'));
        }

        {
            const f = writeMd(dir, 'portrait.md', '![photo](portrait.png)\n');
            const html = await convertMarkdown(f);
            assert('portrait image (h > w) gets max-width: 375px', html.includes('max-width: 375px'));
        }

        {
            const f = writeMd(dir, 'missing-img.md', '![photo](does-not-exist.jpg)\n');
            const html = await convertMarkdown(f);
            assert('missing image file defaults to 600px', html.includes('max-width: 600px'));
        }

        {
            // Raw HTML img with existing style= must be left untouched
            const f = writeMd(dir, 'styled-img.md',
                '<img src="landscape.png" style="border: 1px solid red">\n');
            const html = await convertMarkdown(f);
            assert('img with existing style= is not resized', !html.includes('max-width'));
        }

        // ── Video conversion ─────────────────────────────────────────────────
        console.log('\n🎬 Video conversion');

        {
            const f = writeMd(dir, 'video-mp4.md', '![A timelapse](clip.mp4)\n');
            const html = await convertMarkdown(f);
            assert('mp4 with caption becomes <video>',  html.includes('<video'));
            assert('mp4 gets correct MIME type',         html.includes('type="video/mp4"'));
            assert('mp4 caption is preserved',           html.includes('<figcaption>A timelapse</figcaption>'));
        }

        {
            const f = writeMd(dir, 'video-mov.md', '![A timelapse](clip.mov)\n');
            const html = await convertMarkdown(f);
            assert('.mov gets video/quicktime MIME type', html.includes('type="video/quicktime"'));
        }

        {
            const f = writeMd(dir, 'video-webm.md', '![A timelapse](clip.webm)\n');
            const html = await convertMarkdown(f);
            assert('.webm gets correct MIME type', html.includes('type="video/webm"'));
        }

        {
            const f = writeMd(dir, 'video-no-caption.md', '![](clip.mp4)\n');
            const html = await convertMarkdown(f);
            assert('mp4 without alt text still becomes <video>', html.includes('<video'));
            assert('mp4 without alt text has no figcaption',     !html.includes('<figcaption>'));
        }

        // ── Gallery marker stripping ─────────────────────────────────────
        console.log('\n📸 Gallery marker stripping');

        {
            const f = writeMd(dir, 'gallery-with-images.md',
                'Some content.\n\n*Add your photos here*\n\n![caption](photo.jpg)\n');
            const { html, galleryImages } = await convertMarkdownWithGallery(f);
            assert('marker is stripped from HTML output',         !html.includes('Add your photos here'));
            assert('content before marker is preserved',          html.includes('Some content.'));
            assert('gallery images are extracted',                 galleryImages.length === 1);
            assert('gallery image caption is correct',            galleryImages[0].caption === 'caption');
        }

        {
            const f = writeMd(dir, 'gallery-no-images.md',
                'Some content.\n\n*Add your photos here*\n\n---\n');
            const { html, galleryImages } = await convertMarkdownWithGallery(f);
            assert('marker stripped even with no gallery images',  !html.includes('Add your photos here'));
            assert('content before marker is preserved (no imgs)', html.includes('Some content.'));
            assert('galleryImages is empty array when no images',  Array.isArray(galleryImages) && galleryImages.length === 0);
        }

        {
            const f = writeMd(dir, 'no-gallery-marker.md',
                'Just regular content.\n');
            const { html, galleryImages } = await convertMarkdownWithGallery(f);
            assert('content renders normally without marker',      html.includes('Just regular content.'));
            assert('galleryImages is null when no marker',         galleryImages === null);
        }

        // ── Nutshell block parsing ─────────────────────────────────────
        console.log('\n🥜 Nutshell block parsing');

        {
            const md = `Some intro text.

:::nutshell Ronda
verdict: Would Plan Around
Stay Overnight: Yes, two nights.
Don't Miss: The bridge at sunset.
Best Time of Day: Late afternoon.
Worth the Splurge: A gorge-view room.
Return Visit: Yes.
:::

More text after.`;

            const parsed = parseNutshellBlock(md);
            assert('parseNutshellBlock extracts name',           parsed !== null && parsed.name === 'Ronda');
            assert('parseNutshellBlock extracts verdict',        parsed.verdict === 'Would Plan Around');
            assert('parseNutshellBlock extracts Stay Overnight', parsed.fields['Stay Overnight'] === 'Yes, two nights.');
            assert("parseNutshellBlock extracts Don't Miss",     parsed.fields["Don't Miss"] === 'The bridge at sunset.');
            assert('parseNutshellBlock extracts all 5 fields',   Object.keys(parsed.fields).length === 5);
        }

        {
            const md = 'No nutshell block here.\n';
            const parsed = parseNutshellBlock(md);
            assert('parseNutshellBlock returns null when no block', parsed === null);
        }

        // ── Nutshell rendering ────────────────────────────────────────────
        console.log('\n🥜 Nutshell rendering');

        {
            const parsed = {
                name: 'Seville',
                verdict: 'Would Plan Around',
                fields: {
                    'Return Visit': 'Yes.',
                    'Stay Overnight': 'Four nights.',
                    "Don't Miss": 'The Alcázar.',
                    'Best Time of Day': 'Late afternoon.',
                    'Worth the Splurge': 'A private guide.',
                }
            };
            const html = renderNutshell(parsed);
            assert('renderNutshell wraps in nutshell-section',       html.includes('<section class="nutshell-section">'));
            assert('renderNutshell includes location name heading',  html.includes('Seville in a Nutshell'));
            assert('renderNutshell includes verdict text',           html.includes('Would Plan Around'));
            assert('renderNutshell uses <div> for fields',           html.includes('<div class="nutshell-fields">'));

            // Header structure
            assert('renderNutshell includes header wrapper',         html.includes('nutshell-header'));
            assert('renderNutshell includes subtitle',               html.includes('Two Travel Nuts Verdict'));
            assert('renderNutshell verdict has CSS class',           html.includes('nutshell-verdict--would-plan-around'));

            // Icon circles
            assert('renderNutshell includes icon containers',        html.includes('nutshell-icon'));
            assert('renderNutshell includes SVG icons',              html.includes('<svg'));

            // Layout classes
            assert('renderNutshell marks pair fields',               html.includes('nutshell-field--pair'));
            assert("renderNutshell marks Don't Miss as highlight",   html.includes('nutshell-field--highlight'));

            // Return Visit yes indicator
            assert('renderNutshell adds yes indicator for Return Visit', html.includes('nutshell-return-yes'));
            assert('renderNutshell includes check indicator SVG',    html.includes('nutshell-indicator'));

            // Verify field ordering follows NUTSHELL_FIELDS (Stay Overnight before Return Visit)
            const stayIdx   = html.indexOf('Stay Overnight');
            const returnIdx = html.indexOf('Return Visit');
            assert('renderNutshell orders fields per NUTSHELL_FIELDS', stayIdx < returnIdx);
        }

        {
            // Extra fields not in NUTSHELL_FIELDS should be appended
            const parsed = {
                name: 'Granada',
                verdict: 'Would Plan Around',
                fields: {
                    'Stay Overnight': 'Three nights.',
                    'Best for': 'History lovers.',
                }
            };
            const html = renderNutshell(parsed);
            assert('renderNutshell includes extra fields',    html.includes('Best for'));
            assert('renderNutshell includes extra field value', html.includes('History lovers.'));
            const stayIdx = html.indexOf('Stay Overnight');
            const bestForIdx = html.indexOf('Best for');
            assert('extra fields appear after schema fields', stayIdx < bestForIdx);
        }

        {
            // Verdict CSS classes for different levels
            const gladHtml = renderNutshell({ name: 'Test', verdict: 'Glad We Went', fields: {} });
            assert('Glad We Went gets correct CSS class',    gladHtml.includes('nutshell-verdict--glad-we-went'));

            const optionalHtml = renderNutshell({ name: 'Test', verdict: 'Lovely but Optional', fields: {} });
            assert('Lovely but Optional gets correct CSS class', optionalHtml.includes('nutshell-verdict--lovely-but-optional'));
        }

        {
            // Return Visit "No" indicator
            const noHtml = renderNutshell({ name: 'Test', verdict: '', fields: { 'Return Visit': 'No, too crowded.' } });
            assert('Return Visit "No" gets X indicator',     noHtml.includes('nutshell-return-no'));
        }

        // ── Nutshell in full pipeline ─────────────────────────────────────
        console.log('\n🥜 Nutshell in full pipeline');

        {
            const f = writeMd(dir, 'nutshell-pipeline.md', `# A Page

:::nutshell TestPlace
verdict: Glad We Went
Stay Overnight: One night.
Return Visit: Maybe.
:::

Regular paragraph after.
`);
            const html = await convertMarkdown(f);
            assert('nutshell block rendered in convertMarkdown pipeline',     html.includes('nutshell-section'));
            assert('heading rendered correctly',                              html.includes('TestPlace in a Nutshell'));
            assert('regular content after block is preserved',                html.includes('Regular paragraph after.'));
            assert('raw :::nutshell marker is not in output',                 !html.includes(':::nutshell'));
        }

        {
            const md = 'No nutshell here, just text.\n';
            const result = processNutshell(md);
            assert('processNutshell returns markdown unchanged when no block', result === md);
        }

    } finally {
        removeTempDir(dir);
    }

    // ── Summary ──────────────────────────────────────────────────────────────
    process.exit(report());
}

run().catch(err => {
    console.error('\n❌ Unexpected error:', err.message);
    process.exit(1);
});
