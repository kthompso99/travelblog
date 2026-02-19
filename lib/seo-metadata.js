/**
 * SEO Metadata Generator
 * Generates meta tags, Open Graph, Twitter Card, and Schema.org structured data
 */

/**
 * Generate SEO metadata for a trip page
 * @param {Object} trip - Trip metadata
 * @param {string} domain - Site domain (e.g., 'https://example.com')
 * @param {string} siteTitle - Site title
 * @returns {string} HTML meta tags
 */
function generateTripMetadata(trip, domain, siteTitle) {
    const url = `${domain}/trips/${trip.slug}/`;
    const title = `${trip.title} | ${siteTitle}`;
    const description = generateDescription(trip);
    const imageUrl = trip.coverImage ? `${domain}/${trip.coverImage}` : '';
    const datePublished = trip.beginDate || '';
    const dateModified = trip.endDate || trip.beginDate || '';

    return `
    <!-- Primary Meta Tags -->
    <title>${escapeHtml(title)}</title>
    <meta name="title" content="${escapeHtml(title)}">
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="canonical" href="${url}">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="${url}">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    ${imageUrl ? `<meta property="og:image" content="${imageUrl}">` : ''}
    <meta property="og:site_name" content="${escapeHtml(siteTitle)}">
    ${datePublished ? `<meta property="article:published_time" content="${datePublished}">` : ''}
    ${dateModified ? `<meta property="article:modified_time" content="${dateModified}">` : ''}
    ${trip.metadata?.tags ? trip.metadata.tags.map(tag => `<meta property="article:tag" content="${escapeHtml(tag)}">`).join('\n    ') : ''}

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${url}">
    <meta property="twitter:title" content="${escapeHtml(title)}">
    <meta property="twitter:description" content="${escapeHtml(description)}">
    ${imageUrl ? `<meta property="twitter:image" content="${imageUrl}">` : ''}

    <!-- Schema.org structured data -->
    <script type="application/ld+json">
${generateSchemaOrg(trip, domain, siteTitle)}
    </script>`;
}

/**
 * Generate SEO metadata for the homepage
 * @param {string} domain - Site domain
 * @param {string} siteTitle - Site title
 * @param {string} siteDescription - Site description
 * @returns {string} HTML meta tags
 */
function generateHomeMetadata(domain, siteTitle, siteDescription) {
    return `
    <!-- Primary Meta Tags -->
    <title>${escapeHtml(siteTitle)}</title>
    <meta name="title" content="${escapeHtml(siteTitle)}">
    <meta name="description" content="${escapeHtml(siteDescription)}">
    <link rel="canonical" href="${domain}/">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${domain}/">
    <meta property="og:title" content="${escapeHtml(siteTitle)}">
    <meta property="og:description" content="${escapeHtml(siteDescription)}">
    <meta property="og:site_name" content="${escapeHtml(siteTitle)}">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary">
    <meta property="twitter:url" content="${domain}/">
    <meta property="twitter:title" content="${escapeHtml(siteTitle)}">
    <meta property="twitter:description" content="${escapeHtml(siteDescription)}">

    <!-- Schema.org structured data -->
    <script type="application/ld+json">
${generateHomepageSchemaOrg(domain, siteTitle, siteDescription)}
    </script>`;
}

/**
 * Generate description from trip metadata
 * @param {Object} trip - Trip metadata
 * @returns {string} Description
 */
function generateDescription(trip) {
    const parts = [];

    if (trip.beginDate && trip.endDate) {
        parts.push(`Travel adventure from ${trip.beginDate} to ${trip.endDate}`);
    } else if (trip.beginDate) {
        parts.push(`Travel adventure starting ${trip.beginDate}`);
    }

    if (trip.metadata?.country) {
        parts.push(`in ${trip.metadata.country}`);
    }

    if (trip.content && trip.content.length > 0) {
        const locations = trip.content
            .filter(item => item.type === 'location')
            .map(item => item.title);

        if (locations.length > 0) {
            parts.push(`Exploring ${locations.slice(0, 3).join(', ')}${locations.length > 3 ? ', and more' : ''}.`);
        }
    }

    if (parts.length === 0) {
        return `${trip.title} - A travel adventure`;
    }

    return parts.join(' ');
}

/**
 * Generate Schema.org JSON-LD for a trip
 * @param {Object} trip - Trip metadata
 * @param {string} domain - Site domain
 * @param {string} siteTitle - Site title
 * @returns {string} JSON-LD string
 */
function generateSchemaOrg(trip, domain, siteTitle) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "TravelAction",
        "name": trip.title,
        "description": generateDescription(trip),
        "url": `${domain}/trips/${trip.slug}/`,
    };

    if (trip.coverImage) {
        schema.image = `${domain}/${trip.coverImage}`;
    }

    if (trip.beginDate) {
        schema.startTime = trip.beginDate;
    }

    if (trip.endDate) {
        schema.endTime = trip.endDate;
    }

    // Add location information if available
    if (trip.mapCenter && trip.mapCenter.coordinates) {
        schema.location = {
            "@type": "Place",
            "name": trip.mapCenter.name || trip.title,
            "geo": {
                "@type": "GeoCoordinates",
                "latitude": trip.mapCenter.coordinates.lat,
                "longitude": trip.mapCenter.coordinates.lng
            }
        };
    }

    // Add agent (the traveler/site)
    schema.agent = {
        "@type": "Person",
        "name": siteTitle
    };

    return JSON.stringify(schema, null, 2);
}

/**
 * Generate Schema.org JSON-LD for homepage
 * @param {string} domain - Site domain
 * @param {string} siteTitle - Site title
 * @param {string} siteDescription - Site description
 * @returns {string} JSON-LD string
 */
function generateHomepageSchemaOrg(domain, siteTitle, siteDescription) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": siteTitle,
        "description": siteDescription,
        "url": `${domain}/`
    };

    return JSON.stringify(schema, null, 2);
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

module.exports = {
    generateTripMetadata,
    generateHomeMetadata,
    escapeHtml
};
