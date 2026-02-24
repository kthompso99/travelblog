/**
 * Homepage-specific CSS
 * Hero, search & filter bar, trip grid & cards, responsive
 */

const CSS_HOMEPAGE = `
        /* ─── Hero (text-only fallback when no heroImages) ─── */
        .hero {
            text-align: center;
            padding: 3.5rem 0 2rem;
        }

        .hero:has(h1:empty) {
            display: none;
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

        /* ─── Intro Section (photo + text side-by-side) ─── */
        .intro-section {
            display: flex;
            align-items: center;
            gap: 2.5rem;
            max-width: 750px;
            margin: 1.25rem auto 1.5rem;
            padding: 0 1rem;
        }

        .intro-photo-wrapper {
            flex-shrink: 0;
            width: 240px;
            aspect-ratio: 4 / 5;
            border-radius: 0.75rem;
            overflow: hidden;
            box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        }

        .intro-photo {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center 35%;
        }

        .intro-text {
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        .intro-section .hero-intro {
            margin: 0;
            text-align: left;
            max-width: 540px;
        }

        .intro-section .hero-intro strong {
            font-weight: 700;
        }

        .intro-cta {
            margin-top: 0.65rem;
            color: #f59e0b;
            font-weight: 600;
            font-size: 0.95rem;
            letter-spacing: -0.01em;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            transition: gap 0.2s ease;
        }

        .intro-cta:hover {
            gap: 0.5rem;
            text-decoration: underline;
        }

        .hero-intro {
            font-size: 1.2rem;
            color: #1f2937;
            max-width: 600px;
            margin: 1.5rem auto 1.25rem;
            line-height: 1.85;
            text-align: center;
        }

        .section-title {
            font-family: "Inter", sans-serif;
            font-size: 1.75rem;
            font-weight: 600;
            margin-top: 0.75rem;
            margin-bottom: 0.75rem;
        }

        /* ─── Homepage Hero (full-bleed rotating image) ─── */
        .home-hero {
            position: relative;
            height: 500px;
            overflow: hidden;
        }

        .home-hero-slide {
            position: absolute;
            inset: 0;
            background-size: cover;
            background-position: center;
            opacity: 0;
            transition: opacity 0.5s ease-in-out;
        }

        .home-hero-slide.active {
            opacity: 1;
        }

        .home-hero-overlay {
            position: absolute;
            inset: 0;
            background:
                linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.6) 100%);
            z-index: 1;
        }

        .home-hero-content {
            position: relative;
            z-index: 2;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding: 2.5rem;
            color: #f3f4f6;
            line-height: 1.08;
        }

        .home-hero-content h1 {
            font-family: "Cormorant Garamond", serif;
            font-size: clamp(1.5rem, 3.5vw, 2.25rem);
            font-weight: 500;
            opacity: 0.9;
            margin-bottom: 0.25rem;
            text-shadow: 0 2px 14px rgba(0,0,0,0.35);
        }

        .home-hero-content p {
            font-family: "Cormorant Garamond", serif;
            font-size: clamp(2rem, 5vw, 3rem);
            font-weight: 500;
            letter-spacing: 0.02em;
            max-width: 560px;
            text-shadow: 0 2px 14px rgba(0,0,0,0.35);
        }

        /* ─── Search & Filter Bar ─── */
        .filter-bar {
            margin-top: 1.25rem;
        }

        .search-wrapper {
            position: relative;
            width: 220px;
            min-width: 150px;
            flex-shrink: 1;
        }

        .search-icon {
            position: absolute;
            left: 0.75rem;
            top: 50%;
            transform: translateY(-50%);
            width: 1rem;
            height: 1rem;
            color: #9ca3af;
            pointer-events: none;
            transition: color 0.2s;
        }

        .search-wrapper:focus-within .search-icon {
            color: #f59e0b;
        }

        .search-input {
            width: 100%;
            padding: 0.6rem 1rem 0.6rem 2.5rem;
            border: 1.5px solid #e8eaed;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            color: #1e293b;
            background: white;
            font-family: inherit;
            outline: none;
            box-shadow: none;
            transition: border-color 0.2s, box-shadow 0.2s;
        }

        .search-input::placeholder {
            color: #94a3b8;
        }

        .search-input:focus {
            border-color: #f59e0b;
            box-shadow: 0 0 0 3px rgba(245,158,11,0.2);
        }

        .filters-container {
            display: flex;
            align-items: center;
            gap: 1.5rem;
            flex-wrap: wrap;
        }

        .filter-section {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            flex-wrap: wrap;
        }

        .year-filter label {
            font-size: 0.82rem;
            font-weight: 600;
            color: #64748b;
            white-space: nowrap;
        }

        .year-filter {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-left: auto;
        }

        .year-dropdown {
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            border: 1px solid #e8eaed;
            background: white;
            color: #64748b;
            font-size: 0.78rem;
            font-weight: 500;
            font-family: inherit;
            cursor: pointer;
            outline: none;
            transition: border-color 0.2s, box-shadow 0.2s;
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
            padding-right: 2rem;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23475569' d='M2 4l4 4 4-4'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 0.7rem center;
        }

        .year-dropdown:hover {
            border-color: #f59e0b;
        }

        .year-dropdown:focus {
            border-color: #f59e0b;
            box-shadow: 0 0 0 3px rgba(245,158,11,0.2);
        }

        .filter-pills {
            display: flex;
            flex-wrap: wrap;
            gap: 0.4rem;
        }

        .filter-pill {
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            border: 1px solid #e8eaed;
            background: white;
            color: #64748b;
            font-size: 0.78rem;
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
            margin-top: 2.5rem;
        }

        .destination-card {
            background: white;
            border-radius: 1rem;
            overflow: hidden;
            box-shadow: 0 4px 12px -2px rgba(0,0,0,0.08);
            text-decoration: none;
            color: inherit;
            display: block;
            transition: transform 0.3s, box-shadow 0.3s;
        }

        .destination-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 20px 40px -8px rgba(0,0,0,0.2);
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
            font-family: "Inter", sans-serif;
            font-size: 1.375rem;
            font-weight: 600;
            margin-bottom: 0.4rem;
            text-shadow: 0 2px 8px rgba(0,0,0,0.5);
            transition: transform 0.3s;
        }

        .destination-card:hover .destination-card-title {
            transform: translateY(-4px);
        }

        .destination-card-location {
            position: absolute;
            top: 0.75rem;
            left: 0.75rem;
            background: rgba(0, 0, 0, 0.55);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            color: white;
            padding: 0.3rem 0.65rem;
            border-radius: 1rem;
            font-size: 0.7rem;
            font-weight: 600;
            z-index: 3;
        }

        .destination-card-body {
            padding: 1rem 1.5rem 1.5rem;
        }

        .destination-card-subtitle {
            font-size: 0.85rem;
            color: #4b5563;
            line-height: 1.5;
            margin-bottom: 0.75rem;
        }

        .destination-card-badge {
            font-size: 0.8125rem;
            font-weight: 600;
            background: #fef3c7;
            color: #92400e;
            padding: 0.5rem 0.75rem;
            border-radius: 0.375rem;
            display: inline-flex;
            align-items: center;
            gap: 0.375rem;
        }

        /* ─── Responsive (Homepage) ─── */
        @media (max-width: 640px) {
            .intro-section {
                flex-direction: column;
                gap: 1.25rem;
                text-align: center;
            }

            .intro-photo-wrapper {
                width: 180px;
            }

            .intro-section .hero-intro {
                text-align: center;
            }

            .intro-cta {
                justify-content: center;
            }

            .hero h1 {
                font-size: 2rem;
            }

            .home-hero {
                height: 400px;
            }

            .filters-container {
                flex-direction: column;
                align-items: flex-start;
                gap: 0.6rem;
            }

            .search-wrapper {
                width: 100%;
            }

            .year-filter {
                margin-left: 0;
            }

            .destination-grid {
                grid-template-columns: 1fr;
            }
        }
`;

module.exports = { CSS_HOMEPAGE };
