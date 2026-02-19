/**
 * Markdown to HTML converter
 * Converts markdown files to HTML with post-processing for images,
 * external links, and video tags used across all trip content.
 */

const fs = require('fs');
const path = require('path');
const { imageSize } = require('image-size');

let marked;
try {
    marked = require('marked');
} catch (e) {
    console.error('Error: marked is not installed. Run: npm install marked');
    process.exit(1);
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
                    let html = marked.parse(data);

                    // Post-process: Add orientation-aware max-width to all images
                    // Portrait (vertical) images: 375px max-width
                    // Landscape (horizontal) images: 600px max-width
                    // Only add if img doesn't already have inline style
                    const markdownDir = path.dirname(filePath);
                    html = html.replace(/<img(?![^>]*style=)([^>]*)>/gi, (match, attrs) => {
                        const srcMatch = attrs.match(/src="([^"]*)"/);
                        if (!srcMatch) return match;

                        const imgSrc = srcMatch[1];
                        const imgPath = path.join(markdownDir, imgSrc);

                        let maxWidth = 600; // Default to landscape

                        try {
                            if (fs.existsSync(imgPath)) {
                                const buffer = fs.readFileSync(imgPath);
                                const dimensions = imageSize(buffer);
                                if (dimensions.height > dimensions.width) {
                                    maxWidth = 375;
                                }
                            }
                        } catch (err) {
                            // If we can't read dimensions, default to landscape (600px)
                        }

                        return `<img${attrs} style="max-width: ${maxWidth}px; width: 100%; height: auto;">`;
                    });

                    // Post-process: Convert paragraph-wrapped images to figure with figcaption
                    html = html.replace(/<p>(<img[^>]+>)<\/p>/gi, (match, imgTag) => {
                        const altMatch = imgTag.match(/alt="([^"]*)"/);
                        if (altMatch && altMatch[1]) {
                            return `<figure>${imgTag}<figcaption>${altMatch[1]}</figcaption></figure>`;
                        }
                        return match;
                    });

                    // Post-process: Add target="_blank" to all external links
                    html = html.replace(/<a(?![^>]*target=)([^>]*)>/gi, '<a$1 target="_blank" rel="noopener noreferrer">');

                    // Post-process: Convert <img> tags with video extensions to <video> tags
                    html = html.replace(/<figure>(<img[^>]+src="([^"]+\.(mp4|mov|webm))"[^>]*>)<figcaption>([^<]+)<\/figcaption><\/figure>/gi, (match, imgTag, src, ext, caption) => {
                        return `<figure><video controls style="max-width: 600px; width: 100%; height: auto;"><source src="${src}" type="video/${ext === 'mov' ? 'quicktime' : ext}">Your browser does not support the video tag.</video><figcaption>${caption}</figcaption></figure>`;
                    });
                    html = html.replace(/<p>(<img[^>]+src="([^"]+\.(mp4|mov|webm))"[^>]*>)<\/p>/gi, (match, imgTag, src, ext) => {
                        return `<p><video controls style="max-width: 600px; width: 100%; height: auto;"><source src="${src}" type="video/${ext === 'mov' ? 'quicktime' : ext}">Your browser does not support the video tag.</video></p>`;
                    });
                    html = html.replace(/<img([^>]+)src="([^"]+\.(mp4|mov|webm))"([^>]*)>/gi, (match, before, src, ext, after) => {
                        return `<video controls style="max-width: 600px; width: 100%; height: auto;"><source src="${src}" type="video/${ext === 'mov' ? 'quicktime' : ext}">Your browser does not support the video tag.</video>`;
                    });

                    resolve(html);
                } catch (e) {
                    reject(e);
                }
            }
        });
    });
}

module.exports = { convertMarkdown };
