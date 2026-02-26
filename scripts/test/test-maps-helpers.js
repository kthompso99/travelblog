/**
 * Shared helpers for Google Maps integration tests
 * Extracted from test-maps.js to reduce file size and improve reusability.
 */

'use strict';

const http = require('http');
const handler = require('serve-handler');

// Test timing constants
const PORT = 8001;
const BASE_URL = `http://localhost:${PORT}`;
const PAGE_LOAD_TIMEOUT = 30000;
const MAPS_API_TIMEOUT = 10000;
const MAP_INIT_DELAY = 3000;
const ZOOM_ANIMATION_DELAY = 2000;
const HOVER_DELAY = 500;
const PREVIEW_LENGTH = 200;

let server;

function startServer() {
    return new Promise((resolve) => {
        server = http.createServer((request, response) => {
            return handler(request, response, {
                public: '.',
                cleanUrls: false
            });
        });

        server.listen(PORT, () => {
            console.log(`🌐 Test server running at ${BASE_URL}`);
            resolve();
        });
    });
}

function stopServer() {
    return new Promise((resolve) => {
        if (server) {
            server.close(() => {
                console.log('🛑 Test server stopped');
                resolve();
            });
        } else {
            resolve();
        }
    });
}

/**
 * Attach console/error/response listeners to a Puppeteer page.
 * Returns arrays that accumulate messages as the page runs.
 */
function setupPageListeners(page) {
    const errors = [];
    const logs = [];
    const failedUrls = [];

    page.on('console', msg => {
        const text = msg.text();
        const type = msg.type();
        logs.push(`[${type}] ${text}`);
        if (type === 'error' || type === 'warning') {
            errors.push(text);
        }
    });

    page.on('pageerror', error => {
        errors.push(`Page error: ${error.message}`);
    });

    page.on('response', response => {
        if (!response.ok()) {
            failedUrls.push(`${response.status()} ${response.url()}`);
        }
    });

    return { errors, logs, failedUrls };
}

/**
 * Navigate to a map page, wait for Google Maps API to load, and wait for initialization.
 * Returns without error on success; throws on timeout.
 */
async function navigateAndWaitForMaps(page, url) {
    await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: PAGE_LOAD_TIMEOUT
    });

    await page.waitForFunction(() => {
        return typeof google !== 'undefined' && google.maps;
    }, { timeout: MAPS_API_TIMEOUT });

    console.log('  ✅ Google Maps API loaded');

    await new Promise(resolve => setTimeout(resolve, MAP_INIT_DELAY));
}

/**
 * Validate that a map div has rendered Google Maps content.
 * @param {Object} page - Puppeteer page
 * @param {string} mapDivId - ID of the map container div
 * @returns {Object} Map content info including markerCount
 */
async function validateMapContent(page, mapDivId) {
    const previewLen = PREVIEW_LENGTH;
    const mapHasContent = await page.evaluate((divId, previewLength) => {
        const mapDiv = document.getElementById(divId);
        if (!mapDiv) return { exists: false };

        const hasGoogleContent = mapDiv.querySelector('.gm-style') !== null;
        const hasChildren = mapDiv.children.length > 0;
        const markers = document.querySelectorAll('[role="button"][aria-label]');

        return {
            exists: true,
            hasChildren,
            hasGoogleContent,
            markerCount: markers.length,
            innerHTML: mapDiv.innerHTML.substring(0, previewLength)
        };
    }, mapDivId, previewLen);

    if (!mapHasContent.exists) {
        throw new Error(`${mapDivId} div not found`);
    }

    if (!mapHasContent.hasGoogleContent) {
        console.error(`  ❌ ${mapDivId} div has no Google Maps content`);
        console.error('  Map innerHTML preview:', mapHasContent.innerHTML);
        throw new Error(`Map did not render - no Google Maps content in ${mapDivId}`);
    }

    console.log(`  ✅ ${mapDivId} div has Google Maps content`);
    return mapHasContent;
}

/**
 * Check if a map div contains an error message.
 */
async function checkMapError(page, mapDivId) {
    const errorInMap = await page.evaluate((divId) => {
        const mapDiv = document.getElementById(divId);
        return mapDiv && mapDiv.textContent.includes('Map Error');
    }, mapDivId);

    if (errorInMap) {
        const errorText = await page.evaluate((divId) => {
            return document.getElementById(divId).textContent;
        }, mapDivId);
        throw new Error(`Map shows error: ${errorText}`);
    }
}

/**
 * Log console messages and JavaScript errors from the page.
 */
function logTestDiagnostics(errors, logs, failedUrls) {
    if (failedUrls && failedUrls.length > 0) {
        console.error('  Failed requests:');
        failedUrls.forEach(url => console.error(`    - ${url}`));
    }
    if (errors.length > 0) {
        console.error('  ⚠️  JavaScript errors detected:');
        errors.forEach(err => console.error(`    - ${err}`));
    }
    if (logs.length > 0) {
        console.log('  📋 All console logs:');
        logs.forEach(log => console.log(`    ${log}`));
    }
}

/**
 * Log detailed diagnostics when Google Maps API fails to load (global map only).
 */
async function logMapsApiDiagnostics(page) {
    const googleStatus = await page.evaluate(() => {
        if (typeof google === 'undefined') return 'google is undefined';
        if (!google.maps) return `google exists but maps is ${typeof google.maps}`;
        return 'google.maps exists';
    });
    console.error(`  ⚠️  Timeout waiting for Google Maps. Status: ${googleStatus}`);

    const scriptInfo = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[src*="maps.googleapis.com"]'));
        if (scripts.length === 0) return 'No Google Maps script tag found';
        return `Found ${scripts.length} script(s): ${scripts.map(s => s.src).join(', ')}`;
    });
    console.error(`  ⚠️  Script tags: ${scriptInfo}`);

    const bodyText = await page.evaluate(() => document.body.innerText);
    if (bodyText.toLowerCase().includes('error') || bodyText.toLowerCase().includes('invalid')) {
        console.error(`  ⚠️  Page contains error text: ${bodyText.substring(0, 500)}`);
    }
}

/**
 * Test marker hover by dispatching mouseover on the first marker
 * and checking the resulting InfoWindow content.
 */
async function testMarkerHover(page, hoverDelay) {
    return page.evaluate((delay) => {
        return new Promise((resolve) => {
            const marker = document.querySelector('[role="button"][aria-label]');
            if (!marker) {
                resolve({ found: false, error: 'No marker button found' });
                return;
            }

            marker.dispatchEvent(new MouseEvent('mouseover', {
                view: window, bubbles: true, cancelable: true
            }));

            setTimeout(() => {
                const infoWindow = document.querySelector('.gm-style-iw');
                if (!infoWindow) {
                    resolve({ found: false, error: 'InfoWindow not found after hover' });
                    return;
                }

                const content = infoWindow.textContent || '';
                const popupTitle = infoWindow.querySelector('.popup-title');
                resolve({
                    found: true,
                    hasUndefined: content.toLowerCase().includes('undefined'),
                    isEmpty: content.trim().length === 0,
                    title: popupTitle ? popupTitle.textContent : '',
                    contentPreview: content.substring(0, 100)
                });
            }, delay);
        });
    }, hoverDelay);
}

/**
 * Validate hover result from testMarkerHover, throwing on critical failures.
 * @param {Object} result - Result from testMarkerHover
 * @param {string} label - Context label for error messages
 */
function validateHoverResult(result, label) {
    if (!result.found) {
        console.error(`  ❌ Hover test failed: ${result.error}`);
        return;
    }
    if (result.hasUndefined) {
        console.error(`  ❌ ${label} InfoWindow contains "undefined": ${result.contentPreview}`);
        throw new Error(`${label} hover card shows "undefined"`);
    }
    if (result.isEmpty) {
        console.error(`  ❌ ${label} InfoWindow is empty`);
        throw new Error(`${label} hover card is blank`);
    }
    if (!result.title) {
        console.error(`  ❌ ${label} InfoWindow has no title`);
        throw new Error(`${label} InfoWindow missing title`);
    }
    console.log(`  ✅ ${label} hover card shows: "${result.title}"`);
}

module.exports = {
    PORT,
    BASE_URL,
    PAGE_LOAD_TIMEOUT,
    MAPS_API_TIMEOUT,
    MAP_INIT_DELAY,
    ZOOM_ANIMATION_DELAY,
    HOVER_DELAY,
    PREVIEW_LENGTH,
    startServer,
    stopServer,
    setupPageListeners,
    navigateAndWaitForMaps,
    validateMapContent,
    checkMapError,
    logTestDiagnostics,
    logMapsApiDiagnostics,
    testMarkerHover,
    validateHoverResult
};
