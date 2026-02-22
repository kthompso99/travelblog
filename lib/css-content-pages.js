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

        /* Google Maps InfoWindow overrides */
        .gm-style-iw-c {
            padding: 0 !important;
            border-radius: 16px !important;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08) !important;
            border: 3px solid #f59e0b !important;
        }

        .gm-style-iw-d {
            overflow: visible !important;
            padding: 0 !important;
            max-height: none !important;
        }

        /* Override Google's inline max-height on inner wrappers */
        .gm-style-iw-d > div {
            max-height: none !important;
        }

        .gm-style .gm-style-iw-tc::after {
            background: white !important;
        }

        /* Hide Google's default close button — we render our own */
        .gm-style-iw-c .gm-ui-hover-effect {
            display: none !important;
        }

        /* Popup card */
        .map-popup-card {
            width: 280px;
            font-family: inherit;
            border-radius: 14px;
            overflow: hidden;
            position: relative;
        }

        /* Custom close button — same parent as stop badge, so top:12px aligns them */
        .popup-close-btn {
            position: absolute;
            top: 12px;
            right: 12px;
            z-index: 10;
            width: 26px;
            height: 26px;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(8px);
            border: none;
            border-radius: 50%;
            color: white;
            font-size: 18px;
            line-height: 24px;
            text-align: center;
            cursor: pointer;
            padding: 0;
            transition: all 0.2s;
        }

        .popup-close-btn:hover {
            background: rgba(0, 0, 0, 0.85);
            transform: scale(1.1);
        }

        .popup-image-wrapper {
            position: relative;
            height: 130px;
            overflow: hidden;
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }

        .popup-image-wrapper img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }

        /* Subtle top vignette so badges read clearly on any photo */
        .popup-image-wrapper::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 60px;
            background: linear-gradient(to bottom, rgba(0, 0, 0, 0.15) 0%, transparent 100%);
            pointer-events: none;
        }

        .popup-stop-badge {
            position: absolute;
            top: 12px;
            left: 12px;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(8px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            color: white;
            padding: 5px 11px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }

        .popup-content {
            padding: 16px;
            background: white;
        }

        .popup-title {
            font-size: 18px;
            font-weight: 700;
            color: #1e293b;
            margin: 0 0 8px 0;
        }

        .popup-meta {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 14px;
            padding-bottom: 14px;
            border-bottom: 1px solid #f3f4f6;
        }

        .popup-duration {
            font-size: 13px;
            color: #6b7280;
            font-weight: 500;
        }

        .popup-link {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            width: 100%;
            padding: 10px 16px;
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.2s;
            box-sizing: border-box;
            box-shadow: 0 2px 8px rgba(217, 119, 6, 0.2);
        }

        .popup-link:hover {
            background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
            box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3);
            transform: translateY(-1px);
        }

        .popup-link svg {
            transition: transform 0.2s;
            margin-top: 1px;
        }

        .popup-link:hover svg {
            transform: translateX(3px);
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
            margin-top: 1rem;
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
            background: linear-gradient(to bottom, #fafafa 0%, #ffffff 100%);
            padding: 5rem 0 1rem 0;
            margin-top: 0;
        }

        .comments-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 0 2rem;
        }

        /* Comments Header */
        .comments-header {
            margin-bottom: 3rem;
        }

        .comments-header h2 {
            font-size: 2.25rem;
            font-weight: 700;
            color: #111827;
            margin-bottom: 0.5rem;
            letter-spacing: -0.02em;
        }

        .comments-subtitle {
            font-size: 1rem;
            color: #6b7280;
            margin: 0;
            line-height: 1.5;
        }

        /* Remark42 Widget Wrapper */
        #remark42 {
            margin-top: 0;
        }

        /* Remark42 Form Container Styling */
        #remark42 .remark-form {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 2rem;
            margin-bottom: 4rem;
        }

        /* Remark42 Textarea Styling */
        #remark42 .remark-form textarea {
            background: white;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
            padding: 0.75rem 1rem;
            font-size: 1rem;
            width: 100%;
            transition: all 0.2s;
        }

        #remark42 .remark-form textarea:focus {
            outline: none;
            border-color: #d97706;
            box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.1);
        }

        #remark42 .remark-form textarea {
            resize: vertical;
            min-height: 120px;
            font-family: inherit;
        }

        /* Remark42 Submit Button */
        #remark42 .remark-form button[type="submit"] {
            background: #d97706;
            color: white;
            font-weight: 600;
            padding: 0.75rem 2rem;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 1rem;
        }

        #remark42 .remark-form button[type="submit"]:hover {
            background: #b45309;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3);
        }

        /* Comments List */
        #remark42 .remark__list {
            margin-top: 4rem;
        }

        /* Individual Comment */
        #remark42 .remark-comment {
            border-left: 4px solid #d97706;
            border-radius: 0;
            padding: 0.5rem 0 0.5rem 1.5rem;
            margin-bottom: 2rem;
            transition: all 0.2s;
            background: transparent;
        }

        #remark42 .remark-comment:hover {
            border-left-color: #f59e0b;
            background: linear-gradient(to right, #fef3c7 0%, transparent 100%);
            margin-left: -0.5rem;
            padding-left: 2rem;
        }

        /* Comment Author */
        #remark42 .remark-comment__author {
            color: #111827;
            font-weight: 600;
            font-size: 0.9375rem;
        }

        /* Comment Date */
        #remark42 .remark-comment__time {
            color: #6b7280;
            font-size: 0.8125rem;
        }

        /* Comment Text */
        #remark42 .remark-comment__text {
            color: #374151;
            line-height: 1.7;
            font-size: 1rem;
            margin-top: 0.75rem;
        }

        /* Comment Header (Avatar + Meta) */
        #remark42 .remark-comment__info {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 0.75rem;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
            .comments-section {
                padding: 3.75rem 0;
            }

            .comments-container {
                padding: 0 1.25rem;
            }

            .comments-header h2 {
                font-size: 1.75rem;
            }

            #remark42 .remark-form {
                padding: 1.5rem;
            }

            #remark42 .remark-comment {
                padding-left: 1rem;
            }

            #remark42 .remark-comment:hover {
                margin-left: 0;
                padding-left: 1rem;
            }
        }

        /* ─── Trip Hero (full-bleed cover on trip intro pages) ─── */
        .trip-hero {
            position: relative;
            height: 400px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .trip-hero::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 30px;
            background: linear-gradient(to bottom, transparent, #f8fafc);
            z-index: 3;
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
            opacity: 0;
            visibility: hidden;
            transition: opacity 300ms, visibility 300ms;
        }

        .gallery-item:hover .gallery-caption {
            opacity: 1;
            visibility: visible;
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
            grid-template-columns: 1fr 340px;
            gap: 2rem;
            margin-top: 1.5rem;
        }

        .trip-map-fullwidth {
            height: 480px;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
        }

        .trip-map-sidebar {
            background: #fdf8ef;
            border: 1px solid #f6d8a0;
            border-radius: 12px;
            padding: 1.25rem;
            overflow-y: auto;
            max-height: 600px;
            box-shadow: 0 4px 12px -2px rgba(0,0,0,0.12), 0 2px 4px -1px rgba(0,0,0,0.06);
        }

        .locations-header {
            position: sticky;
            top: -1.25rem;
            background: #fdf8ef;
            z-index: 2;
            margin: -1.25rem -1.25rem 1rem -1.25rem;
            padding: 1.25rem 1.25rem 0.75rem 1.25rem;
            border-bottom: 2px solid #e5e7eb;
            border-radius: 12px 12px 0 0;
        }

        .locations-header h2 {
            font-size: 1.125rem;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 0.25rem;
        }

        .locations-header-row {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .location-count {
            font-size: 0.81rem;
            color: #6b7280;
            margin: 0;
        }

        .tour-controls {
            display: flex;
            gap: 0.4rem;
            width: 100%;
        }

        .stop-trip-btn {
            display: none;
            align-items: center;
            justify-content: center;
            width: 2.4rem;
            flex-shrink: 0;
            font-size: 0.85rem;
            color: white;
            background: #94a3b8;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: background 0.2s;
        }

        .stop-trip-btn:hover {
            background: #64748b;
        }

        .tour-controls.active .stop-trip-btn {
            display: flex;
        }

        .play-trip-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.4rem;
            width: 100%;
            font-size: 0.85rem;
            font-weight: 700;
            color: white;
            background: linear-gradient(to right, #f59e0b, #d97706);
            border: none;
            border-radius: 8px;
            padding: 0.6rem 1rem;
            cursor: pointer;
            white-space: nowrap;
            letter-spacing: 0.02em;
            box-shadow: 0 2px 6px rgba(245, 158, 11, 0.3);
            transition: transform 0.2s, box-shadow 0.2s;
        }

        .play-trip-btn .btn-icon {
            font-size: 0.75em;
            margin-left: -2px;
        }

        .play-trip-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
        }

        .play-trip-btn.playing {
            background: linear-gradient(to right, #ef4444, #dc2626);
            box-shadow: 0 2px 6px rgba(239, 68, 68, 0.3);
        }

        .play-trip-btn.playing:hover {
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
        }

        .play-trip-btn.paused {
            background: linear-gradient(to right, #d97706, #b45309);
            box-shadow: 0 2px 6px rgba(217, 119, 6, 0.3);
        }

        .play-trip-btn.paused:hover {
            box-shadow: 0 4px 12px rgba(217, 119, 6, 0.4);
        }

        .trip-map-locations-list {
            list-style: none;
            padding-left: 0;
            margin: 0;
        }

        /* Vertical timeline: per-li segments so each can fade independently */
        .trip-map-locations-list li {
            margin-bottom: 0;
            position: relative;
        }

        .trip-map-locations-list li::before {
            content: '';
            position: absolute;
            left: 1.3rem;
            top: 0;
            bottom: 0;
            width: 2px;
            background: #fde68a;
            transition: background 0.3s;
        }

        .trip-map-locations-list li:last-child::before {
            display: none;
        }

        .trip-map-locations-list a {
            display: flex;
            align-items: center;
            gap: 0.6rem;
            padding: 0.5rem;
            min-height: 3.25rem;
            border-radius: 8px;
            text-decoration: none;
            color: #475569;
            transition: background 0.2s, color 0.2s, transform 0.2s, box-shadow 0.2s;
            position: relative;
        }

        .trip-map-locations-list a:hover {
            background: #fffbeb;
            color: #f59e0b;
            transform: translateY(-2px);
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
            outline: 1px solid #fde68a;
        }

        .location-number {
            background: #fef3c7;
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
            position: relative;
            z-index: 1;
            border: 2px solid white;
            transition: background 0.2s, color 0.2s, border-color 0.2s, transform 0.2s;
        }

        .trip-map-locations-list a:hover .location-number {
            background: #f59e0b;
            color: white;
            border-color: #f59e0b;
        }

        .location-thumb {
            width: 40px;
            height: 40px;
            border-radius: 6px;
            object-fit: cover;
            flex-shrink: 0;
        }

        .location-details {
            display: flex;
            flex-direction: column;
            gap: 0.1rem;
            flex: 1;
            min-width: 0;
        }

        .location-name {
            font-size: 0.88rem;
            font-weight: 500;
        }

        .location-duration {
            font-size: 0.75rem;
            color: #94a3b8;
            font-weight: 400;
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
            border-color: #d97706;
            transform: scale(1.1);
        }

        .trip-map-locations-list a.highlighted .location-name {
            font-weight: 600;
        }

        /* Playback progression: traveled stops */
        .trip-map-locations-list a.traveled .location-number {
            background: #f59e0b;
            color: white;
            border-color: #f59e0b;
        }

        /* Playback progression: future stops */
        .trip-map-locations-list a.future {
            opacity: 0.4;
        }

        .trip-map-locations-list li.future-segment {
            opacity: 0.4;
        }

        /* Fade timeline line for future segments */
        .trip-map-locations-list li.step-future::before,
        .trip-map-locations-list li.future-segment::before {
            background: rgba(253, 230, 138, 0.25);
        }

        /* Travel segment connector between locations */
        .travel-segment {
            display: flex;
            justify-content: center;
            padding: 0.2rem 0;
        }

        .travel-info {
            font-size: 0.72rem;
            color: #94a3b8;
            background: #fdf8ef;
            padding: 0.1rem 0.5rem;
            position: relative;
            z-index: 1;
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
