/**
 * Homepage-specific CSS
 * Hero, search & filter bar, trip grid & cards, responsive
 */

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

module.exports = { CSS_HOMEPAGE };
