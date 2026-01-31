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

        res.writeHead(200, { 'Content-Type': getContentType(filePath) });
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
                    // No index.html in directory - serve root index.html for SPA routing
                    serveFile(res, path.join(PUBLIC_DIR, 'index.html'));
                }
            });
        } else {
            // Path doesn't exist - this is a client-side route
            // Serve index.html and let the client-side router handle it
            serveFile(res, path.join(PUBLIC_DIR, 'index.html'));
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
    console.log('SPA Routing enabled - all routes serve index.html');
    console.log('');
    console.log('Test URLs:');
    console.log(`  Home:      http://localhost:${PORT}/`);
    console.log(`  Map:       http://localhost:${PORT}/map`);
    console.log(`  About:     http://localhost:${PORT}/about`);
    console.log(`  Greece:    http://localhost:${PORT}/trip/greece`);
    console.log(`  S. Africa: http://localhost:${PORT}/trip/southernafrica`);
    console.log('');
    console.log('Press Ctrl+C to stop');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
});
