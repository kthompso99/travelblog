/**
 * Sitemap Generator
 * Generates sitemap.xml for SEO
 */

const { escapeHtml } = require('./seo-metadata');

/**
 * Generate sitemap.xml content
 * @param {Array} trips - Array of trip metadata objects
 * @param {string} domain - Site domain (e.g., 'https://example.com')
 * @returns {string} XML sitemap content
 */
function generateSitemap(trips, domain) {
    const urls = [];

    // Homepage
    urls.push({
        loc: `${domain}/`,
        changefreq: 'monthly',
        priority: '1.0'
    });

    // Map page
    urls.push({
        loc: `${domain}/map/`,
        changefreq: 'monthly',
        priority: '0.6'
    });

    // About page
    urls.push({
        loc: `${domain}/about/`,
        changefreq: 'monthly',
        priority: '0.5'
    });

    // Trip pages
    trips.forEach(trip => {
        urls.push({
            loc: `${domain}/trips/${trip.slug}/`,
            lastmod: trip.endDate || trip.beginDate || getCurrentDate(),
            changefreq: 'yearly',
            priority: '0.8'
        });
    });

    // Build XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    urls.forEach(url => {
        xml += '  <url>\n';
        xml += `    <loc>${escapeHtml(url.loc)}</loc>\n`;
        if (url.lastmod) {
            xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
        }
        xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
        xml += `    <priority>${url.priority}</priority>\n`;
        xml += '  </url>\n';
    });

    xml += '</urlset>';

    return xml;
}

/**
 * Generate robots.txt content
 * @param {string} domain - Site domain
 * @returns {string} robots.txt content
 */
function generateRobotsTxt(domain) {
    return `# Robots.txt for ${domain}
User-agent: *
Disallow: /

# Sitemap
Sitemap: ${domain}/sitemap.xml
`;
}

/**
 * Get current date in YYYY-MM-DD format
 * @returns {string} Date string
 */
function getCurrentDate() {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

module.exports = {
    generateSitemap,
    generateRobotsTxt
};
