/**
 * SEO Metadata Generator
 * Generates meta tags, Open Graph, Twitter Card, and Schema.org structured data
 */

/**
 * Build the common meta tag block shared by all page types.
 * @param {Object} opts
 * @param {string} opts.title - Page title
 * @param {string} opts.description - Page description
 * @param {string} opts.url - Canonical URL
 * @param {string} opts.siteName - Site name for og:site_name
 * @param {string} opts.ogType - Open Graph type ('article' | 'website')
 * @param {string} opts.twitterCard - Twitter card type
 * @param {string} [opts.image] - OG/Twitter image URL
 * @param {string} [opts.ogExtras] - Additional OG meta tags (pre-formatted)
 * @param {string} opts.schemaJson - JSON-LD string
 * @returns {string} HTML meta tags
 */
function buildMetaBlock({ title, description, url, siteName, ogType, twitterCard, image, ogExtras, schemaJson }) {
    const t = escapeHtml(title);
    const d = escapeHtml(description);
    const sn = escapeHtml(siteName);

    return `
    <!-- Primary Meta Tags -->
    <title>${t}</title>
    <meta name="title" content="${t}">
    <meta name="description" content="${d}">
    <link rel="canonical" href="${url}">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="${ogType}">
    <meta property="og:url" content="${url}">
    <meta property="og:title" content="${t}">
    <meta property="og:description" content="${d}">${image ? `\n    <meta property="og:image" content="${image}">` : ''}
    <meta property="og:site_name" content="${sn}">${ogExtras || ''}

    <!-- Twitter -->
    <meta property="twitter:card" content="${twitterCard}">
    <meta property="twitter:url" content="${url}">
    <meta property="twitter:title" content="${t}">
    <meta property="twitter:description" content="${d}">${image ? `\n    <meta property="twitter:image" content="${image}">` : ''}

    <!-- Schema.org structured data -->
    <script type="application/ld+json">
${schemaJson}
    </script>`;
}

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

    let ogExtras = '';
    if (datePublished) ogExtras += `\n    <meta property="article:published_time" content="${datePublished}">`;
    if (dateModified) ogExtras += `\n    <meta property="article:modified_time" content="${dateModified}">`;
    if (trip.metadata?.tags) ogExtras += '\n    ' + trip.metadata.tags.map(tag => `<meta property="article:tag" content="${escapeHtml(tag)}">`).join('\n    ');

    return buildMetaBlock({
        title, description, url,
        siteName: siteTitle,
        ogType: 'article',
        twitterCard: 'summary_large_image',
        image: imageUrl,
        ogExtras,
        schemaJson: generateSchemaOrg(trip, domain, siteTitle)
    });
}

/**
 * Generate SEO metadata for the homepage
 * @param {string} domain - Site domain
 * @param {string} siteTitle - Site title
 * @param {string} siteDescription - Site description
 * @returns {string} HTML meta tags
 */
function generateHomeMetadata(domain, siteTitle, siteDescription) {
    return buildMetaBlock({
        title: siteTitle,
        description: siteDescription,
        url: `${domain}/`,
        siteName: siteTitle,
        ogType: 'website',
        twitterCard: 'summary',
        schemaJson: generateHomepageSchemaOrg(domain, siteTitle, siteDescription)
    });
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
