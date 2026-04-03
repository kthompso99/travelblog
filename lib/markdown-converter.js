/**
 * Markdown to HTML converter
 * Converts markdown files to HTML with post-processing for images,
 * external links, and video tags used across all trip content.
 */

import fs from 'fs';
import path from 'path';
import { imageSize } from 'image-size';
import { marked } from 'marked';
import { IMAGE_MAX_WIDTH } from './constants.js';
import { processNutshell } from './nutshell.js';
import { slugify } from './slug-utilities.js';

function videoMimeType(ext) {
    return ext === 'mov' ? 'quicktime' : ext;
}

function buildVideoTag(src, ext) {
    return `<video controls style="max-width: ${IMAGE_MAX_WIDTH.LANDSCAPE}px; width: 100%; height: auto;"><source src="${src}" type="video/${videoMimeType(ext)}">Your browser does not support the video tag.</video>`;
}

// Track heading slugs per parse call to handle duplicates within a page
let headingSlugCounts = {};

function resetHeadingSlugs() {
    headingSlugCounts = {};
}

// Add id attributes to h2 and h3 headings for TOC anchor linking
marked.use({
    renderer: {
        heading(text, level, raw) {
            if (level === 2 || level === 3) {
                const plainText = raw || text.replace(/<[^>]*>/g, '');
                let slug = slugify(plainText);
                if (headingSlugCounts[slug]) {
                    headingSlugCounts[slug]++;
                    slug = `${slug}-${headingSlugCounts[slug]}`;
                } else {
                    headingSlugCounts[slug] = 1;
                }
                return `<h${level} id="${slug}">${text}</h${level}>\n`;
            }
            return `<h${level}>${text}</h${level}>\n`;
        }
    }
});

// Add orientation-aware max-width to images without existing inline styles
function addImageSizing(html, markdownDir) {
    return html.replace(/<img(?![^>]*style=)([^>]*)>/gi, (match, attrs) => {
        const srcMatch = attrs.match(/src="([^"]*)"/);
        if (!srcMatch) return match;

        const imgSrc = srcMatch[1];
        const imgPath = path.join(markdownDir, imgSrc);

        let maxWidth = IMAGE_MAX_WIDTH.LANDSCAPE;

        try {
            if (fs.existsSync(imgPath)) {
                const buffer = fs.readFileSync(imgPath);
                const dimensions = imageSize(buffer);
                if (dimensions.height > dimensions.width) {
                    maxWidth = IMAGE_MAX_WIDTH.PORTRAIT;
                }
            }
        } catch (err) {
            // If we can't read dimensions, default to landscape
        }

        return `<img${attrs} style="max-width: ${maxWidth}px; width: 100%; height: auto;">`;
    });
}

// Convert paragraph-wrapped images with alt text to figure/figcaption
function wrapImageCaptions(html) {
    return html.replace(/<p>(<img[^>]+>)<\/p>/gi, (match, imgTag) => {
        const altMatch = imgTag.match(/alt="([^"]*)"/);
        if (altMatch && altMatch[1]) {
            return `<figure>${imgTag}<figcaption>${altMatch[1]}</figcaption></figure>`;
        }
        return match;
    });
}

// Add target="_blank" rel="noopener noreferrer" to external links only
// Internal links (relative URLs like tips.html) stay in the same tab
function addExternalLinkAttrs(html) {
    return html.replace(/<a(?![^>]*target=)([^>]*href="(https?:\/\/|\/\/)[^"]*"[^>]*)>/gi, '<a$1 target="_blank" rel="noopener noreferrer">');
}

// Convert straight quotes to typographic curly quotes in text content only.
// Handles both HTML entity-encoded quotes (&#39; &quot; from marked) and
// literal quotes (from nutshell blocks injected before marked).
function convertQuotesInText(text) {
    if (!text) return text;

    // --- Entity-encoded double quotes (from marked) ---
    // Opening: after whitespace/start, before word char or entity
    text = text.replace(/(^|[\s(\[{]|&nbsp;)&quot;(?=\w|&#|&[a-z])/g, '$1\u201C');
    // Closing: remaining &quot; → right curly
    text = text.replace(/&quot;/g, '\u201D');

    // --- Entity-encoded single quotes / apostrophes (from marked) ---
    // Contraction: letter&#39;letter
    text = text.replace(/(\w)&#39;(\w)/g, '$1\u2019$2');
    // Possessive at word end: letter&#39; before space/punctuation/end
    text = text.replace(/(\w)&#39;(?=[\s.,;:!?\)\]}<]|$)/gm, '$1\u2019');
    // Opening single quote: after whitespace/start before word
    text = text.replace(/(^|[\s(\[{]|&nbsp;)&#39;(?=\w)/g, '$1\u2018');
    // Remaining &#39; → right curly (safe default)
    text = text.replace(/&#39;/g, '\u2019');

    // --- Literal double quotes (rare — from HTML injected before marked) ---
    text = text.replace(/(^|[\s(\[{])"(?=\w)/g, '$1\u201C');
    text = text.replace(/"(?=[\s.,;:!?\)\]}<]|$)/gm, '\u201D');

    // --- Literal single quotes / apostrophes ---
    // Contraction: letter'letter
    text = text.replace(/(\w)'(\w)/g, '$1\u2019$2');
    // Possessive at word end
    text = text.replace(/(\w)'(?=[\s.,;:!?\)\]}<]|$)/gm, '$1\u2019');

    return text;
}

function convertSmartQuotes(html) {
    // Split HTML into alternating text/tag segments.
    // Odd indices are tags (<...>), even indices are text content.
    const parts = html.split(/(<[^>]*>)/);
    for (let i = 0; i < parts.length; i += 2) {
        parts[i] = convertQuotesInText(parts[i]);
    }
    return parts.join('');
}

// Convert ASCII double-hyphens to em dashes and digit-hyphen-digit to en dashes
// in text content only. Same tag-aware architecture as convertSmartQuotes.
function convertDashesInText(text) {
    if (!text) return text;

    // Em dash: exactly two hyphens (not three) → — (U+2014)
    text = text.replace(/(?<!-)--(?!-)/g, '\u2014');

    // En dash: digit-hyphen-digit → digit–digit (U+2013) for numeric ranges
    text = text.replace(/(\d)-(\d)/g, '$1\u2013$2');

    return text;
}

function convertSmartDashes(html) {
    const parts = html.split(/(<[^>]*>)/);
    for (let i = 0; i < parts.length; i += 2) {
        parts[i] = convertDashesInText(parts[i]);
    }
    return parts.join('');
}

// Convert three ASCII periods to typographic ellipsis character in text content only.
// Same tag-aware architecture as convertSmartQuotes/convertSmartDashes.
function convertEllipsesInText(text) {
    if (!text) return text;
    return text.replace(/\.\.\./g, '\u2026');
}

function convertSmartEllipses(html) {
    const parts = html.split(/(<[^>]*>)/);
    for (let i = 0; i < parts.length; i += 2) {
        parts[i] = convertEllipsesInText(parts[i]);
    }
    return parts.join('');
}

// Convert <img> tags with video extensions (.mp4, .mov, .webm) to <video> tags
function convertVideoTags(html) {
    html = html.replace(/<figure>(<img[^>]+src="([^"]+\.(mp4|mov|webm))"[^>]*>)<figcaption>([^<]+)<\/figcaption><\/figure>/gi, (match, imgTag, src, ext, caption) => {
        return `<figure>${buildVideoTag(src, ext)}<figcaption>${caption}</figcaption></figure>`;
    });
    html = html.replace(/<p>(<img[^>]+src="([^"]+\.(mp4|mov|webm))"[^>]*>)<\/p>/gi, (match, imgTag, src, ext) => {
        return `<p>${buildVideoTag(src, ext)}</p>`;
    });
    html = html.replace(/<img([^>]+)src="([^"]+\.(mp4|mov|webm))"([^>]*)>/gi, (match, before, src, ext, after) => {
        return buildVideoTag(src, ext);
    });
    return html;
}

// Shared post-processing pipeline for parsed HTML
function postProcessHtml(html, markdownDir) {
    html = addImageSizing(html, markdownDir);
    html = wrapImageCaptions(html);
    html = addExternalLinkAttrs(html);
    html = convertVideoTags(html);
    html = convertSmartEllipses(html);
    html = convertSmartDashes(html);
    html = convertSmartQuotes(html);
    return html;
}

/**
 * Read and convert a markdown file to HTML with post-processing.
 * Post-processing steps:
 *   - Orientation-aware image sizing (portrait: 375px, landscape: 600px)
 *   - Paragraph-wrapped images with alt text → <figure>/<figcaption>
 *   - External links get target="_blank" rel="noopener noreferrer"
 *   - <img> tags for video files (.mp4, .mov, .webm) → <video> tags
 *   - Three ASCII periods → typographic ellipsis character (text content only)
 *   - ASCII dashes → typographic em/en dashes (text content only)
 *   - Straight quotes → typographic curly quotes (text content only)
 *
 * @param {string} filePath - Absolute or relative path to the .md file
 * @returns {Promise<string>} Converted HTML string
 */
function convertMarkdown(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                try {
                    resetHeadingSlugs();
                    resolve(postProcessHtml(marked.parse(processNutshell(data)), path.dirname(filePath)));
                } catch (e) {
                    reject(e);
                }
            }
        });
    });
}

/**
 * Convert a markdown string to HTML with post-processing.
 * Same pipeline as convertMarkdown but operates on in-memory content
 * instead of reading from a file.
 *
 * @param {string} content - Markdown string
 * @param {string} markdownDir - Directory for resolving relative image paths
 * @returns {string} Converted HTML string
 */
function convertMarkdownString(content, markdownDir) {
    resetHeadingSlugs();
    return postProcessHtml(marked.parse(processNutshell(content)), markdownDir);
}

export { convertMarkdown, convertMarkdownString };
