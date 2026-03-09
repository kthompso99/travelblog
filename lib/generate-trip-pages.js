/**
 * Trip page HTML generators
 * Builds trip intro and content (location/article) pages.
 * Map page generation lives in generate-trip-map-page.js.
 */

const { generateTripMetadata, escapeHtml } = require('./seo-metadata');
const { getContentItemSlug } = require('./slug-utilities');
const { getTripImagePath } = require('./image-utilities');
const { readTemplate, formatMonthYear, renderPage } = require('./generate-html-helpers');
const { fillTemplate } = require('./template-utilities');
const { buildCommentPageId, buildCommentsSection } = require('./remark42-config');

/**
 * Floating table of contents script (injected on content pages)
 * Discovers h2/h3 headings in .markdown-content, builds a floating TOC widget,
 * and tracks reading progress via IntersectionObserver.
 */
const TOC_SCRIPT = `
<script>
(function() {
    var mc = document.querySelector('.markdown-content');
    if (!mc) return;
    var headings = mc.querySelectorAll('h2[id], h3[id]');
    if (headings.length < 3) return;

    // SVG icons
    var listIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>';
    var closeIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    var checkIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

    // Build DOM
    var backdrop = document.createElement('div');
    backdrop.className = 'toc-backdrop';
    document.body.appendChild(backdrop);

    var btn = document.createElement('button');
    btn.className = 'toc-toggle';
    btn.setAttribute('aria-label', 'Table of contents');
    btn.innerHTML = listIcon;
    document.body.appendChild(btn);

    var panel = document.createElement('div');
    panel.className = 'toc-panel';
    var items = [];
    var listHtml = '';
    for (var i = 0; i < headings.length; i++) {
        var h = headings[i];
        var isH3 = h.tagName === 'H3';
        var cls = 'toc-item' + (isH3 ? ' toc-item--h3' : '');
        listHtml += '<a href="#' + h.id + '" class="' + cls + '" data-idx="' + i + '">'
            + '<span class="toc-indicator toc-indicator--unread"></span>'
            + '<span class="toc-label">' + h.textContent + '</span>'
            + '<span class="toc-active-dot"></span></a>';
    }
    panel.innerHTML = '<div class="toc-header">'
        + '<div><div class="toc-title">On This Page</div>'
        + '<div class="toc-subtitle">Jump to any section</div></div>'
        + '<button class="toc-close" aria-label="Close">' + closeIcon + '</button></div>'
        + '<div class="toc-list">' + listHtml + '</div>'
        + '<div class="toc-progress-bar"><div class="toc-progress-fill" style="width:0%"></div></div>'
        + '<div class="toc-footer"><span class="toc-progress-label">Progress</span>'
        + '<span class="toc-progress-count">0 / ' + headings.length + ' sections</span></div>';
    document.body.appendChild(panel);

    items = panel.querySelectorAll('.toc-item');
    var progressFill = panel.querySelector('.toc-progress-fill');
    var progressCount = panel.querySelector('.toc-progress-count');
    var closeBtn = panel.querySelector('.toc-close');
    var isOpen = false;
    var currentIdx = -1;
    var readSet = {};

    function open() {
        if (isOpen) return;
        isOpen = true;
        btn.classList.add('open');
        panel.classList.add('open');
        backdrop.classList.add('open');
    }

    function close() {
        if (!isOpen) return;
        isOpen = false;
        btn.classList.remove('open');
        panel.classList.remove('open');
        backdrop.classList.remove('open');
    }

    btn.addEventListener('click', function() { isOpen ? close() : open(); });
    backdrop.addEventListener('click', close);
    closeBtn.addEventListener('click', close);

    // Click a section -> scroll + close
    for (var j = 0; j < items.length; j++) {
        items[j].addEventListener('click', function(e) {
            e.preventDefault();
            var target = document.getElementById(this.getAttribute('href').slice(1));
            if (target) {
                var headerH = document.querySelector('header') ? document.querySelector('header').offsetHeight : 0;
                var y = target.getBoundingClientRect().top + window.pageYOffset - headerH - 16;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
            close();
        });
    }

    // Escape key closes
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') close();
    });

    function updateIndicators() {
        var readCount = 0;
        for (var k = 0; k < items.length; k++) {
            var ind = items[k].querySelector('.toc-indicator');
            items[k].classList.remove('active', 'read');
            if (k === currentIdx) {
                items[k].classList.add('active');
                ind.className = 'toc-indicator toc-indicator--current';
                ind.innerHTML = '';
            } else if (readSet[k]) {
                items[k].classList.add('read');
                ind.className = 'toc-indicator toc-indicator--read';
                ind.innerHTML = checkIcon;
                readCount++;
            } else {
                ind.className = 'toc-indicator toc-indicator--unread';
                ind.innerHTML = '';
            }
        }
        if (currentIdx >= 0) readCount++; // include current in progress
        var pct = headings.length > 0 ? Math.round((readCount / headings.length) * 100) : 0;
        progressFill.style.width = pct + '%';
        progressCount.textContent = readCount + ' / ' + headings.length + ' sections';
    }

    // Scroll spy: find which heading is current
    function onScroll() {
        var headerH = document.querySelector('header') ? document.querySelector('header').offsetHeight : 0;
        var scrollY = window.pageYOffset + headerH + 32;
        var newIdx = -1;
        for (var k = 0; k < headings.length; k++) {
            if (headings[k].offsetTop <= scrollY) {
                newIdx = k;
            }
        }
        if (newIdx !== currentIdx) {
            // Mark previous as read
            if (currentIdx >= 0) readSet[currentIdx] = true;
            currentIdx = newIdx;
            updateIndicators();
        }
    }

    // Throttled scroll handler
    var ticking = false;
    window.addEventListener('scroll', function() {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(function() {
                onScroll();
                ticking = false;
            });
        }
    }, { passive: true });

    // Initial state
    onScroll();
})();
</script>`;

/**
 * SVG icon constants for gallery
 */
const SVG_CAMERA_ICON = `<svg class="gallery-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
    <circle cx="12" cy="13" r="4"></circle>
</svg>`;

const SVG_ZOOM_ICON = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    <line x1="11" y1="8" x2="11" y2="14"></line>
    <line x1="8" y1="11" x2="14" y2="11"></line>
</svg>`;

/**
 * Build trip submenu HTML
 * @param {Object} tripMetadata - Trip metadata
 * @param {Array} allContent - Array of all content items (locations and articles)
 * @param {string} currentPage - Current page identifier ('intro', 'map', or content title)
 * @param {string} basePath - Base path for links
 * @returns {string} HTML for trip submenu
 */
function buildTripSubmenu(tripMetadata, allContent, currentPage, basePath = './') {
    // Separate articles from locations
    const articles = allContent.filter(item => item.type === 'article');
    const locations = allContent.filter(item => item.type === 'location');

    let html = `
        <nav class="trip-submenu">
            <ul class="trip-submenu-links">`;

    // Overview link
    html += buildOverviewLink(currentPage, basePath);

    // Map link
    html += buildMapLink(currentPage, basePath);

    // Article links (flat list)
    articles.forEach(item => {
        html += buildNavLink(item, currentPage, basePath);
    });

    // Location dropdown (if any locations exist)
    if (locations.length > 0) {
        html += buildLocationDropdown(locations, currentPage, basePath);
    }

    html += `
            </ul>
        </nav>`;

    return html;
}

/**
 * Build overview link
 * @param {string} currentPage - Current page identifier
 * @param {string} basePath - Base path for links
 * @returns {string} HTML for overview link
 */
function buildOverviewLink(currentPage, basePath) {
    const active = currentPage === 'intro' ? ' class="active"' : '';
    return `
                <li><a href="${basePath}index.html"${active}>Overview</a></li>`;
}

/**
 * Build map link
 * @param {string} currentPage - Current page identifier
 * @param {string} basePath - Base path for links
 * @returns {string} HTML for map link
 */
function buildMapLink(currentPage, basePath) {
    const active = currentPage === 'map' ? ' class="active"' : '';
    return `
                <li><a href="${basePath}route.html"${active}>Route</a></li>`;
}

/**
 * Build a navigation link for a content item
 * @param {Object} item - Content item
 * @param {string} currentPage - Current page title
 * @param {string} basePath - Base path for links
 * @returns {string} HTML for navigation link
 */
function buildNavLink(item, currentPage, basePath) {
    const slug = getContentItemSlug(item);
    const isActive = currentPage === item.title;
    const activeClass = isActive ? ' class="active"' : '';
    return `
                <li><a href="${basePath}${slug}.html"${activeClass}>${escapeHtml(item.title)}</a></li>`;
}

/**
 * Build location dropdown menu
 * @param {Array} locations - Array of location content items
 * @param {string} currentPage - Current page title
 * @param {string} basePath - Base path for links
 * @returns {string} HTML for location dropdown
 */
function buildLocationDropdown(locations, currentPage, basePath) {
    if (locations.length === 0) return '';

    // Determine button label based on current page
    const currentLocation = locations.find(loc => loc.title === currentPage);
    const buttonLabel = currentLocation
        ? escapeHtml(currentLocation.title)
        : 'Jump to Destination';
    const isActive = !!currentLocation;
    const activeClass = isActive ? ' active' : '';

    let html = `
                <li class="trip-submenu-dropdown">
                    <button class="trip-submenu-dropdown-btn${activeClass}"
                            aria-expanded="false"
                            aria-haspopup="true">
                        ${buttonLabel} <span class="dropdown-arrow">▾</span>
                    </button>
                    <div class="trip-submenu-dropdown-menu" role="menu">`;

    // Add all locations to dropdown
    locations.forEach(loc => {
        const slug = getContentItemSlug(loc);
        const isCurrentLocation = loc.title === currentPage;
        const activeItemClass = isCurrentLocation ? ' class="active"' : '';
        html += `
                        <a href="${basePath}${slug}.html" role="menuitem"${activeItemClass}>${escapeHtml(loc.title)}</a>`;
    });

    html += `
                    </div>
                </li>`;

    return html;
}

/**
 * Build prev/next navigation HTML
 * @param {Array} allContent - Array of all content items
 * @param {number} currentIndex - Index of current item
 * @param {string} basePath - Base path for links
 * @returns {string} HTML for prev/next navigation
 */
function buildPrevNextNav(allContent, currentIndex, basePath = './') {
    let html = '<div class="prev-next-links">';

    // Previous link
    if (currentIndex === 0) {
        // First content item -> previous is MAP page
        html += `
            <a href="${basePath}route.html" class="prev-link">← Previous: Route</a>`;
    } else if (currentIndex > 0) {
        // Other items -> previous is the item before this one
        const prevItem = allContent[currentIndex - 1];
        const prevSlug = getContentItemSlug(prevItem);
        html += `
            <a href="${basePath}${prevSlug}.html" class="prev-link">← Previous: ${escapeHtml(prevItem.title)}</a>`;
    }

    // Next link
    if (currentIndex < allContent.length - 1) {
        const nextItem = allContent[currentIndex + 1];
        const nextSlug = getContentItemSlug(nextItem);
        html += `
            <a href="${basePath}${nextSlug}.html" class="next-link">Next: ${escapeHtml(nextItem.title)} →</a>`;
    }

    html += '</div>';
    return html;
}

/**
 * Build prev/next navigation for intro page (only shows Next link)
 * @param {Array} allContent - Array of all content items
 * @param {string} basePath - Base path for links
 * @returns {string} HTML for prev/next navigation
 */
function buildIntroPageNextLink(allContent, basePath = './') {
    return `
        <div class="prev-next-links">
            <a href="${basePath}route.html" class="next-link">Next: Route →</a>
        </div>`;
}

/**
 * Build photo gallery HTML from gallery data
 * @param {Array} gallery - Array of {caption, src} objects
 * @param {string} locationTitle - Title of the location for gallery heading
 * @param {string} basePath - Base path for image links
 * @returns {string} HTML for masonry photo gallery
 */
function buildPhotoGallery(gallery, locationTitle = 'Photo Gallery', basePath = './') {
    if (!gallery || gallery.length === 0) {
        return '';
    }

    const photoCount = gallery.length;
    const photoWord = photoCount === 1 ? 'Photo' : 'Photos';

    let html = `
        <div class="gallery-header">
            ${SVG_CAMERA_ICON}
            <h2 class="gallery-heading">${escapeHtml(locationTitle)} in Pictures</h2>
            <p class="gallery-count">${photoCount} ${photoWord}</p>
            <div class="gallery-divider"></div>
        </div>`;

    html += '<div class="gallery-masonry">';

    gallery.forEach(image => {
        const imageSrc = `${basePath}${image.src}`;
        const caption = escapeHtml(image.caption);

        html += `
            <a href="${imageSrc}" class="gallery-item" data-gallery="location-gallery" data-description="${caption}">
                <img src="${imageSrc}" alt="${caption}" loading="lazy">
                <div class="gallery-item-overlay">
                    <div class="gallery-zoom-icon">${SVG_ZOOM_ICON}</div>
                </div>
                <div class="gallery-caption">${caption}</div>
            </a>`;
    });

    html += '</div>';
    return html;
}

/**
 * Build trip hero section HTML
 * @param {Object} tripMetadata - Trip metadata
 * @returns {string} Hero HTML or empty string if no cover image
 */
function buildTripHero(tripMetadata) {
    const country = tripMetadata.metadata?.country || '';
    const dateLabel = formatMonthYear(tripMetadata.beginDate);
    const coverImage = tripMetadata.coverImage || '';

    if (!coverImage) return '';

    const heroImagePath = getTripImagePath(coverImage, tripMetadata.slug, './', true);
    return `<div class="trip-hero">
    <div class="trip-hero-bg" style="background-image: url('${heroImagePath}');"></div>
    <div class="trip-hero-overlay"></div>
    <div class="trip-hero-content">
        <h1>${escapeHtml(tripMetadata.title)}</h1>
        <div class="trip-hero-meta">
            ${country ? `<span>\u{1f4cd} ${escapeHtml(country)}</span>` : ''}
            ${dateLabel ? `<span>\u{1f4c5} ${dateLabel}</span>` : ''}
        </div>
    </div>
</div>`;
}

/**
 * Generate trip intro page HTML
 * @param {Object} tripMetadata - Trip metadata
 * @param {Array} allContent - Array of all content items (articles and locations)
 * @param {Object} config - Site configuration
 * @param {string} domain - Site domain
 * @returns {string} Complete HTML page
 */
function generateTripIntroPage(tripMetadata, allContent, config, domain) {
    const introTemplate = readTemplate('trip-intro-page.html');

    const seoMetadata = generateTripMetadata(tripMetadata, domain, config.site.title);
    const tripSubmenu = buildTripSubmenu(tripMetadata, allContent, 'intro', './');

    // Build trip metadata section
    let metadataHtml = '';
    if (tripMetadata.duration) {
        metadataHtml += `<p class="trip-meta"><strong>Duration:</strong> ${escapeHtml(tripMetadata.duration)}</p>`;
    }
    if (tripMetadata.beginDate) {
        metadataHtml += `<p class="trip-meta"><strong>Dates:</strong> ${escapeHtml(tripMetadata.beginDate)}`;
        if (tripMetadata.endDate) {
            metadataHtml += ` to ${escapeHtml(tripMetadata.endDate)}`;
        }
        metadataHtml += `</p>`;
    }

    // Build prev/next navigation for intro page
    const prevNextHtml = buildIntroPageNextLink(allContent, './');

    // Build comments section
    const commentPageId = buildCommentPageId(tripMetadata.slug, 'intro');
    const commentsHtml = buildCommentsSection(commentPageId);

    // Strip leading <h1> from intro content — title is now in the hero
    const introHtml = (tripMetadata.introHtml || '<p>Trip introduction not available</p>')
        .replace(/^<h1[^>]*>.*?<\/h1>\s*/i, '');

    const content = fillTemplate(introTemplate, {
        BASE_PATH: '../../',
        TRIP_TITLE: escapeHtml(tripMetadata.title),
        INTRO_CONTENT: introHtml,
        COMMENTS_SECTION: commentsHtml,
        PREV_NEXT_NAV: prevNextHtml
    });

    return renderPage(config, {
        basePath: '../../',
        seoMetadata,
        content,
        cssKey: 'trip-intro',
        tripSubmenu,
        preMain: buildTripHero(tripMetadata)
    });
}

/**
 * Generate trip content page HTML (locations and articles)
 * @param {Object} tripMetadata - Trip metadata
 * @param {Object} contentItem - Content item (location or article)
 * @param {Array} allContent - Array of all content items (locations and articles)
 * @param {number} contentIndex - Index of this item in allContent
 * @param {Object} config - Site configuration
 * @param {string} domain - Site domain
 * @returns {string} Complete HTML page
 */
function generateTripContentPage(tripMetadata, contentItem, allContent, contentIndex, config, domain) {
    const pageTemplate = readTemplate('trip-location-page.html');

    const itemSlug = getContentItemSlug(contentItem);
    const seoMetadata = `
    <title>${escapeHtml(contentItem.title)} - ${escapeHtml(tripMetadata.title)} | ${escapeHtml(config.site.title)}</title>
    <meta name="description" content="${escapeHtml(contentItem.title)} - Part of ${escapeHtml(tripMetadata.title)}">
    <link rel="canonical" href="${domain}/trips/${tripMetadata.slug}/${itemSlug}.html">`;

    const tripSubmenu = buildTripSubmenu(tripMetadata, allContent, contentItem.title, './');

    const prevNextHtml = buildPrevNextNav(allContent, contentIndex, './');
    const galleryHtml = contentItem.gallery ? buildPhotoGallery(contentItem.gallery, contentItem.title, './') : '';
    const fullContent = (contentItem.contentHtml || '<p>Content not available</p>') + galleryHtml;

    // Build comments section
    const pageType = contentItem.type; // 'location' or 'article'
    const commentPageId = buildCommentPageId(tripMetadata.slug, pageType, itemSlug);
    const commentsHtml = buildCommentsSection(commentPageId);

    const content = fillTemplate(pageTemplate, {
        TRIP_TITLE: escapeHtml(tripMetadata.title),
        LOCATION_TITLE: escapeHtml(contentItem.title),
        LOCATION_METADATA: '',
        LOCATION_CONTENT: fullContent,
        COMMENTS_SECTION: commentsHtml,
        PREV_NEXT_NAV: prevNextHtml
    });

    const cssKey = contentItem.type === 'article' ? 'trip-article' : 'trip-location';

    return renderPage(config, {
        basePath: '../../',
        seoMetadata,
        content,
        cssKey,
        tripSubmenu,
        preMain: buildTripHero(tripMetadata),
        scripts: TOC_SCRIPT
    });
}

module.exports = {
    generateTripIntroPage,
    generateTripContentPage,
    buildTripSubmenu,
    buildTripHero
};
