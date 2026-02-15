/**
 * Page-specific CSS utilities
 * Provides CSS content for different page types to reduce page size
 */

// Homepage-specific CSS (Hero + Search & Filter + Trip Grid)
// Lines 206-407 from base.html (202 lines)
const CSS_HOMEPAGE = `
        /* ─── Hero ─── */
        .hero {
            text-align: center;
            padding: 3.5rem 0 2rem;
        }

        .hero h1 {
            font-size: 2.75rem;
            font-weight: 700;
            color: #0f172a;
            letter-spacing: -0.03em;
            line-height: 1.2;
            margin-bottom: 0.75rem;
        }

        .hero p {
            font-size: 1.1rem;
            color: #64748b;
            max-width: 500px;
            margin: 0 auto;
        }

        /* ─── Search & Filter Bar ─── */
        .filter-bar {
            margin-top: 1.25rem;
            display: flex;
            flex-direction: column;
            gap: 0.6rem;
        }

        .search-wrapper {
            position: relative;
            max-width: 420px;
        }

        .search-icon {
            position: absolute;
            left: 0.85rem;
            top: 50%;
            transform: translateY(-50%);
            width: 1rem;
            height: 1rem;
            color: #94a3b8;
            pointer-events: none;
        }

        .search-input {
            width: 100%;
            padding: 0.6rem 1rem 0.6rem 2.2rem;
            border: 1.5px solid #e2e8f0;
            border-radius: 9999px;
            font-size: 0.9rem;
            color: #1e293b;
            background: white;
            font-family: inherit;
            outline: none;
            transition: border-color 0.2s, box-shadow 0.2s;
        }

        .search-input::placeholder {
            color: #94a3b8;
        }

        .search-input:focus {
            border-color: #f59e0b;
            box-shadow: 0 0 0 3px rgba(245,158,11,0.2);
        }

        .filter-pills {
            display: flex;
            flex-wrap: wrap;
            gap: 0.4rem;
        }

        .filter-pill {
            padding: 0.35rem 0.85rem;
            border-radius: 9999px;
            border: 1.5px solid #e2e8f0;
            background: white;
            color: #475569;
            font-size: 0.82rem;
            font-weight: 500;
            font-family: inherit;
            cursor: pointer;
            transition: border-color 0.2s, background 0.2s, color 0.2s;
        }

        .filter-pill:hover {
            border-color: #f59e0b;
            color: #f59e0b;
        }

        .filter-pill.active {
            background: #f59e0b;
            border-color: #f59e0b;
            color: white;
        }

        .no-results {
            display: none;
            text-align: center;
            padding: 3rem 1rem;
            color: #64748b;
            font-size: 0.95rem;
        }

        /* ─── Trip Grid & Cards ─── */
        .destination-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 2rem;
            margin-top: 2rem;
        }

        .destination-card {
            background: white;
            border-radius: 1rem;
            overflow: hidden;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
            text-decoration: none;
            color: inherit;
            display: block;
            transition: transform 0.3s, box-shadow 0.3s;
        }

        .destination-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
        }

        .destination-card-image-wrapper {
            position: relative;
            height: 16rem;
            overflow: hidden;
        }

        .destination-card-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.7s;
        }

        .destination-card:hover .destination-card-image {
            transform: scale(1.1);
        }

        .destination-card-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 50%, transparent 100%);
        }

        .destination-card-hover-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(to top, rgba(217,119,6,0.9) 0%, rgba(249,115,22,0.6) 50%, transparent 100%);
            opacity: 0;
            transition: opacity 0.3s;
        }

        .destination-card:hover .destination-card-hover-overlay {
            opacity: 1;
        }

        .destination-card-content {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 1.5rem;
            color: white;
            z-index: 2;
        }

        .destination-card-title {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 0.4rem;
            transition: transform 0.3s;
        }

        .destination-card:hover .destination-card-title {
            transform: translateY(-4px);
        }

        .destination-card-location {
            font-size: 0.85rem;
            opacity: 0.9;
        }

        .destination-card-body {
            padding: 1rem 1.5rem 1.5rem;
        }

        .destination-card-badge {
            font-size: 0.75rem;
            background: #fef3c7;
            color: #92400e;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            display: inline-block;
        }

        /* ─── Responsive (Homepage) ─── */
        @media (max-width: 640px) {
            .hero h1 {
                font-size: 2rem;
            }

            .destination-grid {
                grid-template-columns: 1fr;
            }
        }
`;

// Content pages CSS (trip intro, locations, articles)
// Multiple sections from base.html combined
const CSS_CONTENT_PAGES = `
        /* ─── Content Area (trip/location pages) ─── */
        #content-area {
            background: white;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            padding: 2.5rem;
            margin-top: 1.5rem;
        }

        #content-area > h1 {
            font-size: 2rem;
            font-weight: 700;
            color: #0f172a;
            letter-spacing: -0.02em;
            margin-bottom: 0.5rem;
        }

        /* Page title in content-view (for location/article pages without box wrapper) */
        #content-view > h1 {
            font-size: 2rem;
            font-weight: 700;
            color: #0f172a;
            letter-spacing: -0.02em;
            margin-bottom: 0.5rem;
        }

        /* ─── Trip & Location Metadata ─── */
        .trip-meta, .location-meta {
            color: #64748b;
            font-size: 0.85rem;
            margin-bottom: 0.25rem;
        }

        .trip-meta strong, .location-meta strong {
            color: #475569;
        }

        /* ─── Markdown Content ─── */
        .markdown-content {
            font-size: 0.95rem;
            line-height: 1.8;
            color: #334155;
            margin-top: 1.5rem;
        }

        .markdown-content h1 {
            font-size: 1.6rem;
            font-weight: 700;
            color: #0f172a;
            letter-spacing: -0.02em;
            margin-top: 2rem;
            margin-bottom: 0.75rem;
        }

        .markdown-content h1:first-child {
            margin-top: 0;
        }

        .markdown-content h2 {
            font-size: 1.3rem;
            font-weight: 600;
            color: #1e293b;
            margin-top: 1.75rem;
            margin-bottom: 0.6rem;
        }

        .markdown-content h3 {
            font-size: 1.1rem;
            font-weight: 600;
            color: #334155;
            margin-top: 1.5rem;
            margin-bottom: 0.5rem;
        }

        .markdown-content p {
            margin-bottom: 1rem;
        }

        .markdown-content p:has(img) {
            text-align: center;
        }

        .markdown-content ul, .markdown-content ol {
            margin-bottom: 1rem;
            padding-left: 1.5rem;
        }

        .markdown-content li {
            margin-bottom: 0.4rem;
        }

        .markdown-content a {
            color: #f59e0b;
            text-decoration: none;
            border-bottom: 1px solid #fcd34d;
            transition: border-color 0.2s;
        }

        .markdown-content a:hover {
            border-color: #f59e0b;
        }

        .markdown-content img {
            max-width: 100%;
            border-radius: 8px;
            margin: 1rem auto;
            border: 1px solid #e2e8f0;
            display: block;
        }

        .markdown-content figure {
            margin: 2rem 0;
            text-align: center;
        }

        .markdown-content figure img {
            margin: 0;
            display: block;
            margin-left: auto;
            margin-right: auto;
        }

        .markdown-content figcaption {
            margin-top: 0.75rem;
            font-size: 0.9rem;
            color: #64748b;
            font-style: italic;
            line-height: 1.5;
            padding: 0 1rem;
        }

        .markdown-content table {
            width: 100%;
            border-collapse: collapse;
            margin: 1rem 0;
            font-size: 0.88rem;
        }

        .markdown-content th {
            text-align: left;
            padding: 0.7rem 0.85rem;
            background: #f1f5f9;
            color: #475569;
            font-weight: 600;
            border-bottom: 2px solid #e2e8f0;
        }

        .markdown-content td {
            padding: 0.7rem 0.85rem;
            border-bottom: 1px solid #e2e8f0;
            color: #334155;
        }

        .markdown-content tr:last-child td {
            border-bottom: none;
        }

        .markdown-content tr:hover td {
            background: #f8fafc;
        }

        /* ─── Back Button ─── */
        .back-button {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.45rem 0.85rem;
            background: #f1f5f9;
            color: #475569;
            text-decoration: none;
            border-radius: 6px;
            font-size: 0.82rem;
            font-weight: 500;
            border: 1px solid #e2e8f0;
            transition: background 0.2s, border-color 0.2s;
        }

        .back-button:hover {
            background: #e2e8f0;
            border-color: #cbd5e1;
        }

        /* ─── Map ─── */
        #map-container {
            margin: 1.5rem 0;
        }

        #map {
            height: 500px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }

        #map-view h2 {
            font-size: 1.4rem;
            font-weight: 600;
            color: #0f172a;
            margin-bottom: 0.25rem;
            letter-spacing: -0.02em;
        }

        /* ─── Map Popup Styling ─── */
        .leaflet-popup-content {
            margin: 0;
            padding: 0;
        }

        /* Google Maps InfoWindow overrides */
        .gm-style-iw-c {
            padding: 0 !important;
            border-radius: 8px !important;
        }

        .gm-style-iw-d {
            overflow: auto !important;
        }

        .gm-style .gm-style-iw-tc::after {
            background: none !important;
        }

        .marker-popup {
            min-width: 200px;
        }

        .marker-popup-image {
            width: 100%;
            height: 120px;
            object-fit: cover;
            border-radius: 6px 6px 0 0;
            display: block;
        }

        .marker-popup-content {
            padding: 0.75rem;
        }

        .marker-popup-title {
            font-weight: 600;
            color: #0f172a;
            margin-bottom: 0.5rem;
            font-size: 0.95rem;
        }

        .marker-popup-link {
            display: inline-block;
            padding: 0.4rem 0.85rem;
            background: white;
            color: #f59e0b;
            text-decoration: none;
            border-radius: 5px;
            border: 1.5px solid #f59e0b;
            font-size: 0.8rem;
            font-weight: 600;
            transition: background 0.2s, color 0.2s;
        }

        .marker-popup-link:hover {
            background: #f59e0b;
            color: white;
        }

        /* ─── Trip Submenu (location nav bar) ─── */
        .trip-submenu {
            background: white;
            border-bottom: 1px solid #e2e8f0;
            padding: 0;
        }

        .trip-submenu-links {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 2rem;
            display: flex;
            gap: 0.25rem;
            list-style: none;
            flex-wrap: wrap;
        }

        .trip-submenu-links a {
            color: #64748b;
            text-decoration: none;
            padding: 0.75rem 0.7rem;
            font-size: 0.82rem;
            font-weight: 500;
            border-bottom: 2px solid transparent;
            transition: color 0.2s, border-color 0.2s;
            white-space: nowrap;
        }

        .trip-submenu-links a:hover {
            color: #f59e0b;
            border-bottom-color: #f59e0b;
        }

        .trip-submenu-links a.active {
            color: #f59e0b;
            border-bottom-color: #f59e0b;
            font-weight: 600;
        }

        /* ─── Trip Bottom Section (map + TOC) ─── */
        .trip-bottom-section {
            margin-top: 2.5rem;
            padding-top: 2rem;
            border-top: 1px solid #e2e8f0;
        }

        .trip-bottom-section h2 {
            font-size: 1.1rem;
            font-weight: 600;
            color: #475569;
            margin-bottom: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-size: 0.78rem;
        }

        @media (min-width: 768px) {
            .trip-bottom-section {
                display: grid;
                grid-template-columns: 1.6fr 1fr;
                gap: 2.5rem;
            }
        }

        @media (max-width: 767px) {
            .trip-bottom-section {
                display: block;
            }

            .trip-toc-container {
                margin-top: 2rem;
            }
        }

        .trip-static-map {
            width: 100%;
            height: 400px;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
        }

        .trip-toc {
            list-style: none;
            padding-left: 0;
            counter-reset: toc-counter;
        }

        .trip-toc li {
            counter-increment: toc-counter;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.6rem;
        }

        .trip-toc li::before {
            content: counter(toc-counter);
            background: #f1f5f9;
            color: #f59e0b;
            font-size: 0.7rem;
            font-weight: 700;
            width: 1.6rem;
            height: 1.6rem;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .trip-toc a {
            color: #475569;
            text-decoration: none;
            font-size: 0.88rem;
            font-weight: 500;
            transition: color 0.2s;
        }

        .trip-toc a:hover {
            color: #f59e0b;
        }

        /* ─── Location Navigation (prev/next) ─── */
        .location-navigation {
            margin-top: 3.5rem;
            padding-top: 2rem;
            border-top: 1px solid #e2e8f0;
            position: relative;
            z-index: 10;
            background: white;
        }

        .prev-next-links {
            display: flex;
            justify-content: space-between;
            gap: 1rem;
            flex-wrap: wrap;
        }

        .prev-link, .next-link {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.6rem 1rem;
            background: white;
            color: #475569;
            text-decoration: none;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            font-size: 0.82rem;
            font-weight: 500;
            transition: border-color 0.2s, background 0.2s, color 0.2s;
        }

        .prev-link:hover, .next-link:hover {
            border-color: #f59e0b;
            background: #fffbeb;
            color: #f59e0b;
        }

        .next-link {
            margin-left: auto;
        }

        @media (max-width: 600px) {
            .prev-next-links {
                flex-direction: column;
            }

            .next-link {
                margin-left: 0;
            }
        }

        /* ─── Trip Hero (full-bleed cover on trip intro pages) ─── */
        .trip-hero {
            position: relative;
            height: 400px;
            overflow: hidden;
        }

        .trip-hero-bg {
            position: absolute;
            inset: 0;
            background-size: cover;
            background-position: center;
        }

        .trip-hero-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(to bottom, rgba(15,23,42,0.4) 0%, rgba(15,23,42,0.35) 50%, rgba(15,23,42,0.75) 100%);
        }

        .trip-hero-back {
            position: absolute;
            top: 1.5rem;
            left: 1.5rem;
            z-index: 3;
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.5rem 1rem;
            background: rgba(255,255,255,0.15);
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-size: 0.85rem;
            font-weight: 500;
            backdrop-filter: blur(4px);
            border: 1px solid rgba(255,255,255,0.2);
            transition: background 0.2s;
        }

        .trip-hero-back:hover {
            background: rgba(255,255,255,0.25);
        }

        .trip-hero-content {
            position: relative;
            z-index: 2;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            padding: 2.5rem;
            color: white;
        }

        .trip-hero-content h1 {
            font-size: 2.75rem;
            font-weight: 700;
            letter-spacing: -0.02em;
            margin-bottom: 0.5rem;
            line-height: 1.2;
        }

        .trip-hero-meta {
            font-size: 1rem;
            opacity: 0.85;
            display: flex;
            gap: 1.25rem;
        }

        /* ─── Trip About Card ─── */
        .trip-about-card {
            background: white;
            border-radius: 12px;
            padding: 2rem 2.5rem;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            border: 1px solid #e2e8f0;
        }

        .trip-about-card h2 {
            font-size: 1.25rem;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 0.75rem;
        }

        /* ─── Photo Gallery (Masonry Layout) ─── */
        .gallery-masonry {
            column-count: 1;
            column-gap: 1rem;
            margin-top: 3rem;
        }

        @media (min-width: 640px) {
            .gallery-masonry {
                column-count: 2;
            }
        }

        @media (min-width: 1024px) {
            .gallery-masonry {
                column-count: 3;
            }
        }

        .gallery-item {
            position: relative;
            break-inside: avoid;
            margin-bottom: 1rem;
            overflow: hidden;
            border-radius: 0.75rem;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            transition: box-shadow 300ms;
            cursor: pointer;
        }

        .gallery-item:hover {
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
        }

        .gallery-item img {
            width: 100%;
            height: auto;
            display: block;
            transition: all 700ms;
        }

        .gallery-item:hover img {
            transform: scale(1.1);
            filter: brightness(0.75);
        }

        .gallery-item-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 50%, transparent 100%);
            opacity: 0;
            transition: opacity 300ms;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .gallery-item:hover .gallery-item-overlay {
            opacity: 1;
        }

        .gallery-zoom-icon {
            color: white;
            opacity: 0.9;
        }

        .gallery-caption {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 1rem;
            background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
            color: white;
            font-size: 0.875rem;
            font-weight: 500;
            transform: translateY(100%);
            transition: transform 300ms;
        }

        .gallery-item:hover .gallery-caption {
            transform: translateY(0);
        }

        /* Show captions on touch devices */
        @media (hover: none) {
            .gallery-caption {
                transform: translateY(0);
                opacity: 0.9;
            }
        }

        /* ─── Gallery Section Title ─── */
        .gallery-section-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: #0f172a;
            margin-top: 3rem;
            margin-bottom: 1rem;
        }

        /* ─── Trip Map Page Layout ─── */
        .trip-map-full-layout {
            display: grid;
            grid-template-columns: 1fr 300px;
            gap: 2rem;
            margin-top: 1.5rem;
        }

        .trip-map-fullwidth {
            height: 480px;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
        }

        .trip-map-sidebar {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 1.5rem;
            overflow-y: auto;
            max-height: 600px;
        }

        .trip-map-sidebar h2 {
            font-size: 0.78rem;
            font-weight: 600;
            color: #475569;
            margin-bottom: 1rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .trip-map-locations-list {
            list-style: none;
            padding-left: 0;
        }

        .trip-map-locations-list li {
            margin-bottom: 0.25rem;
        }

        .trip-map-locations-list a {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.5rem 0.75rem;
            border-radius: 8px;
            text-decoration: none;
            color: #475569;
            transition: background 0.2s, color 0.2s;
        }

        .trip-map-locations-list a:hover {
            background: #f8fafc;
            color: #f59e0b;
        }

        .location-number {
            background: #f1f5f9;
            color: #f59e0b;
            font-size: 0.7rem;
            font-weight: 700;
            width: 1.8rem;
            height: 1.8rem;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .trip-map-locations-list a:hover .location-number {
            background: #f59e0b;
            color: white;
        }

        .location-name {
            font-size: 0.88rem;
            font-weight: 500;
            flex: 1;
        }

        /* Highlighted state when corresponding marker is hovered */
        .trip-map-locations-list a.highlighted {
            background: #fef3c7;
            color: #92400e;
            box-shadow: 0 0 0 2px #f59e0b;
        }

        .trip-map-locations-list a.highlighted .location-number {
            background: #d97706;
            color: white;
            transform: scale(1.1);
        }

        .trip-map-locations-list a.highlighted .location-name {
            font-weight: 600;
        }

        /* ─── Responsive (Content Pages) ─── */
        @media (max-width: 640px) {
            #content-area {
                padding: 1.5rem;
            }
        }
`;

/**
 * Get page-specific CSS based on page type
 * @param {string} pageType - 'homepage', 'trip-intro', 'trip-location', 'trip-article', 'trip-map', 'global-map', 'about'
 * @returns {string} CSS content for the page type wrapped in <style> tags
 */
function getPageCSS(pageType) {
    switch (pageType) {
        case 'homepage':
            return `<style>${CSS_HOMEPAGE}\n    </style>`;
        case 'trip-intro':
        case 'trip-location':
        case 'trip-article':
        case 'trip-map':
        case 'global-map':
        case 'about':
            // All content/map pages use the same CSS (includes markdown, maps, navigation, etc.)
            return `<style>${CSS_CONTENT_PAGES}\n    </style>`;
        default:
            return '';
    }
}

module.exports = { getPageCSS };
