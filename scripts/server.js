#!/usr/bin/env node

/**
 * Simple HTTP server with SPA (Single Page Application) routing support
 *
 * This server serves index.html for all routes that don't match actual files,
 * enabling client-side routing with the History API.
 *
 * Usage: node server.js [port]
 * Default port: 8000
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.argv[2] || 8000;
const PUBLIC_DIR = path.join(__dirname, '..');

// MIME types for common file extensions
const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.md': 'text/markdown',
    '.txt': 'text/plain'
};

function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return MIME_TYPES[ext] || 'application/octet-stream';
}

function serveFile(res, filePath) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('500 - Internal Server Error');
            return;
        }

        const headers = { 'Content-Type': getContentType(filePath) };

        // Add cache headers for static assets (mimics GitHub Pages behavior)
        // CRITICAL: Without proper caching, browsers re-validate resources on every navigation,
        // causing visible "flash" when hero background images reload. These headers match
        // GitHub Pages' aggressive caching strategy to ensure smooth page transitions.
        const ext = path.extname(filePath).toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico', '.webp'].includes(ext)) {
            // Images: cache for 1 year, immutable
            headers['Cache-Control'] = 'public, max-age=31536000, immutable';
        } else if (['.css', '.js'].includes(ext)) {
            // CSS/JS: cache for 1 year
            headers['Cache-Control'] = 'public, max-age=31536000';
        } else if (ext === '.html') {
            // HTML: no cache (always check for updates)
            headers['Cache-Control'] = 'no-cache';
        }

        res.writeHead(200, headers);
        res.end(data);
    });
}

const server = http.createServer((req, res) => {
    // Parse the URL
    let urlPath = req.url.split('?')[0]; // Remove query string

    // Remove trailing slash (except for root)
    if (urlPath !== '/' && urlPath.endsWith('/')) {
        urlPath = urlPath.slice(0, -1);
    }

    // Construct file path
    let filePath = path.join(PUBLIC_DIR, urlPath);

    // Log the request
    console.log(`${req.method} ${urlPath}`);

    // Check if the path corresponds to an actual file
    fs.stat(filePath, (err, stats) => {
        if (!err && stats.isFile()) {
            // File exists - serve it
            serveFile(res, filePath);
        } else if (!err && stats.isDirectory()) {
            // Directory exists - try to serve index.html from it
            const indexPath = path.join(filePath, 'index.html');
            fs.stat(indexPath, (indexErr, indexStats) => {
                if (!indexErr && indexStats.isFile()) {
                    serveFile(res, indexPath);
                } else {
                    // No index.html in directory - serve 404
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    fs.readFile(path.join(PUBLIC_DIR, '404.html'), (err, data) => {
                        if (err) {
                            res.end('<h1>404 - Page Not Found</h1>');
                        } else {
                            res.end(data);
                        }
                    });
                }
            });
        } else {
            // Path doesn't exist - serve 404
            res.writeHead(404, { 'Content-Type': 'text/html' });
            fs.readFile(path.join(PUBLIC_DIR, '404.html'), (err, data) => {
                if (err) {
                    res.end('<h1>404 - Page Not Found</h1>');
                } else {
                    res.end(data);
                }
            });
        }
    });
});

server.listen(PORT, () => {
    console.log('');
    console.log('🌍 Travel Blog Server');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Server running at http://127.0.0.1:${PORT}/`);
    console.log('');
    console.log('Static site serving with proper 404 handling');
    console.log('');
    console.log('Test URLs:');
    console.log(`  Home:      http://localhost:${PORT}/`);
    console.log(`  Map:       http://localhost:${PORT}/map/`);
    console.log(`  About:     http://localhost:${PORT}/about/`);
    console.log(`  Greece:    http://localhost:${PORT}/trips/greece/`);
    console.log(`  S. Africa: http://localhost:${PORT}/trips/southernafrica/`);
    console.log('');
    console.log('Press Ctrl+C to stop');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
});
