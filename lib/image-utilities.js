/**
 * Image path utilities
 * Handles construction of correct image paths based on rendering context
 */

/**
 * Get correct path for trip images based on rendering context
 *
 * Trip images are stored relative to the trip directory (e.g., "images/seville-14.jpg")
 * but need different absolute paths depending on where the page is rendered:
 *
 * - From homepage (/index.html): ./trips/spain/images/seville-14.jpg
 * - From global map (/map/index.html): ../trips/spain/images/seville-14.jpg
 * - From trip intro (/trips/spain/index.html): ./images/seville-14.jpg
 * - From location page (/trips/spain/cordoba.html): ./images/seville-14.jpg
 *
 * @param {string} imagePath - Image path from trip.json (e.g., "images/seville-14.jpg")
 * @param {string} tripSlug - Trip slug (e.g., "spain")
 * @param {string} basePath - Base path for assets (e.g., './', '../')
 * @param {boolean} insideTripDir - Whether rendering from within trip directory
 * @returns {string} Full image path ready for use in src or url()
 */
function getTripImagePath(imagePath, tripSlug, basePath, insideTripDir = false) {
    if (!imagePath) return '';

    // If rendering from inside trip directory, path is already correct
    if (insideTripDir) {
        return imagePath;
    }

    // If rendering from outside trip directory, prepend trips/{slug}/
    return `${basePath}trips/${tripSlug}/${imagePath}`;
}

module.exports = { getTripImagePath };
