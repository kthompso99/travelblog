/**
 * Markdown to HTML converter
 * Converts markdown files to HTML with post-processing for images,
 * external links, and video tags used across all trip content.
 */

const fs = require('fs');
const path = require('path');
const { imageSize } = require('image-size');
const { IMAGE_MAX_WIDTH } = require('./constants');

function videoMimeType(ext) {
    return ext === 'mov' ? 'quicktime' : ext;
}

function buildVideoTag(src, ext) {
    return `<video controls style="max-width: ${IMAGE_MAX_WIDTH.LANDSCAPE}px; width: 100%; height: auto;"><source src="${src}" type="video/${videoMimeType(ext)}">Your browser does not support the video tag.</video>`;
}

let marked;
try {
    marked = require('marked');
} catch (e) {
    console.error('Error: marked is not installed. Run: npm install marked');
    process.exit(1);
}

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

// Add target="_blank" rel="noopener noreferrer" to links without existing target
function addExternalLinkAttrs(html) {
    return html.replace(/<a(?![^>]*target=)([^>]*)>/gi, '<a$1 target="_blank" rel="noopener noreferrer">');
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

/**
 * Read and convert a markdown file to HTML with post-processing.
 * Post-processing steps:
 *   - Orientation-aware image sizing (portrait: 375px, landscape: 600px)
 *   - Paragraph-wrapped images with alt text → <figure>/<figcaption>
 *   - External links get target="_blank" rel="noopener noreferrer"
 *   - <img> tags for video files (.mp4, .mov, .webm) → <video> tags
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
                    const markdownDir = path.dirname(filePath);
                    let html = marked.parse(data);
                    html = addImageSizing(html, markdownDir);
                    html = wrapImageCaptions(html);
                    html = addExternalLinkAttrs(html);
                    html = convertVideoTags(html);
                    resolve(html);
                } catch (e) {
                    reject(e);
                }
            }
        });
    });
}

module.exports = { convertMarkdown };
