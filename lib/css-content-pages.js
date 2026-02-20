/**
 * Content pages CSS
 * Markdown styling, maps, navigation, gallery, trip hero, trip map layout, responsive
 * Used by trip intro, location, article, map, global map, and about pages
 */

const CSS_CONTENT_PAGES = `
        /* ─── Content Area (trip/location pages) ─── */
        #content-area {
            background: linear-gradient(to bottom, #fafafa 0%, #ffffff 100%);
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            padding: 3rem 2rem;
            margin-top: -0.75rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        #content-area > h1 {
            font-size: 2.25rem;
            font-weight: 700;
            color: #1e293b;
            letter-spacing: -0.03em;
            margin-bottom: 1rem;
            line-height: 1.1;
        }

        /* Page title in content-view (for location/article pages without box wrapper) */
        #content-view > h1 {
            font-size: 2.25rem;
            font-weight: 700;
            color: #1e293b;
            letter-spacing: -0.03em;
            margin-bottom: 1rem;
            line-height: 1.1;
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
            font-size: 1.125rem;
            line-height: 1.65;
            color: #334155;
            margin-top: 1.5rem;
            max-width: 800px;
            margin-left: auto;
            margin-right: auto;
        }

        .markdown-content h1 {
            font-size: 2.25rem;
            font-weight: 700;
            color: #0f172a;
            letter-spacing: -0.02em;
            margin-top: 2.5rem;
            margin-bottom: 1rem;
        }

        .markdown-content h1:first-child {
            margin-top: 0;
        }

        .markdown-content h2 {
            font-size: 1.75rem;
            font-weight: 700;
            color: #1a1a1a;
            margin-top: 2rem;
            margin-bottom: 1.5rem;
        }

        .markdown-content h3 {
            font-size: 1.5rem;
            font-weight: 600;
            color: #334155;
            margin-top: 1.5rem;
            margin-bottom: 0.75rem;
        }

        .markdown-content p {
            margin-bottom: 1.5rem;
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
            border-bottom: 1.5px solid #fcd34d;
            transition: all 0.2s ease;
            font-weight: 500;
        }

        .markdown-content a:hover {
            border-color: #f59e0b;
            color: #d97706;
            background: linear-gradient(to bottom, transparent 50%, rgba(252,211,77,0.15) 50%);
        }

        .markdown-content img {
            max-width: 100%;
            border-radius: 8px;
            margin: 2.5rem auto;
            border: 1px solid #e2e8f0;
            display: block;
            box-shadow: 0 2px 4px rgba(0,0,0,0.06);
        }

        .markdown-content figure {
            margin: 2.5rem 0;
            text-align: center;
        }

        .markdown-content figure img {
            margin: 0;
            display: block;
            margin-left: auto;
            margin-right: auto;
        }

        .markdown-content figcaption {
            margin-top: 1rem;
            font-size: 0.9375rem;
            color: #64748b;
            font-style: italic;
            line-height: 1.6;
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
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        .trip-submenu-links {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 2rem;
            display: flex;
            align-items: baseline;
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
            transition: all 0.2s ease;
            white-space: nowrap;
        }

        .trip-submenu-links a:hover {
            color: #f59e0b;
            border-bottom-color: #f59e0b;
            transform: translateY(-1px);
        }

        .trip-submenu-links a.active {
            color: #f59e0b;
            border-bottom-color: #f59e0b;
            font-weight: 600;
        }

        /* ─── Trip Submenu Dropdown ─── */
        .trip-submenu-dropdown {
            position: relative;
        }

        .trip-submenu-dropdown-btn {
            color: #64748b;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 0.73rem 0.85rem;
            font-size: 0.82rem;
            font-weight: 500;
            transition: all 0.2s;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            white-space: nowrap;
            font-family: inherit;
        }

        .trip-submenu-dropdown-btn:hover {
            background: #fef3c7;
            border-color: #f59e0b;
            color: #f59e0b;
        }

        .trip-submenu-dropdown-btn.active {
            background: #fef3c7;
            border-color: #f59e0b;
            color: #f59e0b;
            font-weight: 600;
        }

        .dropdown-arrow {
            font-size: 0.7rem;
            transition: transform 0.2s;
        }

        .trip-submenu-dropdown-btn[aria-expanded="true"] .dropdown-arrow {
            transform: rotate(180deg);
        }

        /* ─── Dropdown Menu ─── */
        .trip-submenu-dropdown-menu {
            display: none;
            position: absolute;
            top: calc(100% + 0.5rem);
            right: 0;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            min-width: 200px;
            max-width: 280px;
            max-height: 400px;
            overflow-y: auto;
            padding: 0.5rem;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            z-index: 1500;
        }

        .trip-submenu-dropdown-btn[aria-expanded="true"] + .trip-submenu-dropdown-menu {
            display: block;
        }

        .trip-submenu-dropdown-menu a {
            display: block;
            padding: 0.6rem 0.75rem;
            color: #475569;
            text-decoration: none;
            font-size: 0.82rem;
            font-weight: 500;
            border-radius: 6px;
            transition: background 0.2s, color 0.2s;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            border-bottom: none !important;
        }

        .trip-submenu-dropdown-menu a:hover {
            background: #fef3c7;
            color: #f59e0b;
        }

        .trip-submenu-dropdown-menu a.active {
            background: #f59e0b;
            color: white;
            font-weight: 600;
        }

        /* Mobile: Full width dropdown */
        @media (max-width: 640px) {
            .trip-submenu-dropdown-menu {
                left: 0;
                right: 0;
                min-width: auto;
                margin: 0 0.5rem;
            }
        }

        /* ─── Trip Bottom Section (map + TOC) ─── */
        .trip-bottom-section {
            margin-top: 4rem;
            padding-top: 3rem;
            border-top: 2px solid #e2e8f0;
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
            margin-top: 2.5rem;
            padding-top: 2.5rem;
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
            padding: 0.75rem 1.25rem;
            background: white;
            color: #475569;
            text-decoration: none;
            border-radius: 8px;
            border: 1.5px solid #e2e8f0;
            font-size: 0.875rem;
            font-weight: 500;
            transition: all 0.2s ease;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .prev-link:hover, .next-link:hover {
            border-color: #f59e0b;
            background: #fffbeb;
            color: #f59e0b;
            transform: translateY(-1px);
            box-shadow: 0 4px 6px -1px rgba(245,158,11,0.15);
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

        /* ─── Comments Section ─── */
        .comments-section {
            margin-top: 5rem;
            margin-bottom: 1rem;
            padding-top: 3.5rem;
            border-top: 2px solid #e2e8f0;
            max-width: 800px;
            margin-left: auto;
            margin-right: auto;
        }

        .comments-header {
            margin-bottom: 2rem;
        }

        .comments-header h2 {
            font-size: 1.75rem;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 0.5rem;
            letter-spacing: -0.02em;
        }

        .comments-subtitle {
            font-size: 0.95rem;
            color: #64748b;
            margin: 0;
        }

        /* Remark42 Widget Customization */
        #remark42 {
            margin-top: 1.5rem;
        }

        /* Override Remark42 form styles */
        #remark42 .remark-form textarea {
            border-color: #e2e8f0;
            border-radius: 8px;
            font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
            padding: 0.75rem;
            font-size: 0.95rem;
        }

        #remark42 .remark-form textarea:focus {
            border-color: #f59e0b;
            outline: none;
            box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
        }

        #remark42 .remark-form button[type="submit"] {
            background: #f59e0b;
            border-radius: 8px;
            font-weight: 500;
            padding: 0.65rem 1.5rem;
            transition: background 0.2s;
            border: none;
            color: white;
        }

        #remark42 .remark-form button[type="submit"]:hover {
            background: #d97706;
        }

        #remark42 .remark-comment {
            border-left: 3px solid #e2e8f0;
            border-radius: 0;
            padding-left: 1rem;
            margin-bottom: 1.5rem;
        }

        #remark42 .remark-comment:hover {
            border-left-color: #f59e0b;
        }

        #remark42 .remark-comment__author {
            color: #0f172a;
            font-weight: 600;
        }

        #remark42 .remark-comment__time {
            color: #64748b;
            font-size: 0.85rem;
        }

        #remark42 .remark-comment__text {
            color: #334155;
            line-height: 1.7;
        }

        @media (max-width: 640px) {
            .comments-section {
                margin-top: 3rem;
                padding-top: 2rem;
            }

            .comments-header h2 {
                font-size: 1.5rem;
            }
        }

        /* ─── Trip Hero (full-bleed cover on trip intro pages) ─── */
        .trip-hero {
            position: relative;
            height: 400px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
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
            background: linear-gradient(135deg, rgba(245,158,11,0.15) 0%, transparent 30%),
                        linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 100%);
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
            text-shadow: 0 2px 12px rgba(0,0,0,0.4);
        }

        .trip-hero-meta {
            font-size: 1rem;
            opacity: 0.95;
            display: flex;
            gap: 1.25rem;
            text-shadow: 0 1px 8px rgba(0,0,0,0.3);
        }

        /* ─── Trip About Card ─── */
        .trip-about-card {
            background: white;
            border-radius: 12px;
            padding: 2.5rem 3rem;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
            border: 1px solid #e2e8f0;
        }

        .trip-about-card h2 {
            font-size: 1.5rem;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 1rem;
            letter-spacing: -0.02em;
        }

        /* ─── Photo Gallery (Masonry Layout) ─── */
        .gallery-masonry {
            column-count: 1;
            column-gap: 1.5rem;
            margin-top: 0;
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
            margin-bottom: 1.5rem;
            overflow: hidden;
            border-radius: 0.75rem;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            transition: box-shadow 300ms, transform 300ms;
            cursor: pointer;
        }

        .gallery-item:hover {
            box-shadow: 0 20px 25px -5px rgba(0,0,0,0.15), 0 10px 10px -5px rgba(0,0,0,0.1);
            transform: translateY(-2px);
        }

        .gallery-item img {
            width: 100%;
            height: auto;
            display: block;
            transition: all 700ms;
        }

        .gallery-item:hover img {
            transform: scale(1.05);
            filter: brightness(0.8);
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

        /* ─── Gallery Header ─── */
        .gallery-header {
            text-align: center;
            margin: 5rem 0 3.5rem 0;
            padding-top: 3rem;
            border-top: 1px solid #e5e7eb;
        }

        .gallery-icon {
            width: 40px;
            height: 40px;
            color: #d97706;
            margin: 0 auto 1rem;
            display: block;
        }

        .gallery-heading {
            font-size: 2.5rem;
            font-weight: 700;
            color: #111827;
            margin-bottom: 0.5rem;
            line-height: 1.1;
            letter-spacing: -0.02em;
        }

        .gallery-count {
            font-size: 1rem;
            font-weight: 500;
            color: #6b7280;
            margin-bottom: 1.5rem;
        }

        .gallery-divider {
            width: 96px;
            height: 4px;
            background: linear-gradient(to right, #d97706, #f59e0b, #d97706);
            margin: 0 auto;
            border-radius: 9999px;
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
            background: #fefaf3;
            border: 1px solid #fed7aa;
            border-radius: 12px;
            padding: 2rem;
            overflow-y: auto;
            max-height: 600px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
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
                padding: 2rem 1.5rem;
                margin-top: 0;
            }

            #content-area > h1,
            #content-view > h1 {
                font-size: 1.75rem;
                margin-bottom: 0.75rem;
            }

            .markdown-content {
                font-size: 1rem;
                max-width: 100%;
            }

            .markdown-content h1 {
                font-size: 1.5rem;
                margin-top: 1.5rem;
            }

            .markdown-content h2 {
                font-size: 1.375rem;
                font-weight: 700;
                margin-top: 1.5rem;
                margin-bottom: 1rem;
            }

            .markdown-content h3 {
                font-size: 1.25rem;
                margin-top: 1.25rem;
            }

            .markdown-content img {
                margin: 2rem auto;
            }

            .markdown-content figure {
                margin: 2rem 0;
            }

            .gallery-header {
                margin: 3rem 0 2.5rem 0;
                padding-top: 2rem;
            }

            .gallery-heading {
                font-size: 1.75rem;
            }

            .gallery-icon {
                width: 32px;
                height: 32px;
            }

            .gallery-divider {
                width: 72px;
                height: 3px;
            }

            .location-navigation {
                margin-top: 3rem;
            }

            .comments-section {
                margin-top: 3rem;
            }
        }
`;

module.exports = { CSS_CONTENT_PAGES };
