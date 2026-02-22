#!/usr/bin/env node

/**
 * Headless browser test for Google Maps integration
 * Verifies that maps load correctly and don't show blank screens
 */

const puppeteer = require('puppeteer');
const http = require('http');
const handler = require('serve-handler');

const PORT = 8001; // Use different port than dev server
const BASE_URL = `http://localhost:${PORT}`;

// Test timing constants
const PAGE_LOAD_TIMEOUT = 30000;
const MAPS_API_TIMEOUT = 10000;
const MAP_INIT_DELAY = 3000;
const ZOOM_ANIMATION_DELAY = 2000;
const HOVER_DELAY = 500;
const PREVIEW_LENGTH = 200;

// Create a simple HTTP server for testing
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

// Attach console/error/response listeners to a Puppeteer page.
// Returns arrays that accumulate messages as the page runs.
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

async function testGlobalMap(browser) {
    console.log('\n📍 Testing Global Map Page...');
    const page = await browser.newPage();
    const { errors, logs, failedUrls } = setupPageListeners(page);

    try {
        // Navigate and wait for Maps API (with detailed diagnostics on failure)
        try {
            await navigateAndWaitForMaps(page, `${BASE_URL}/map/index.html`);
        } catch (timeoutError) {
            await logMapsApiDiagnostics(page);
            throw timeoutError;
        }

        // Validate map rendered
        await validateMapContent(page, 'map');
        await checkMapError(page, 'map');

        // Test zoom-based detail markers and hovercards
        console.log('  🔍 Testing zoom-based location markers...');
        const zoomTest = await page.evaluate((hoverDelay, zoomDelay) => {
            return new Promise((resolve) => {
                // Zoom in to trigger location markers (threshold is 5)
                map.setZoom(6);

                // Wait for zoom animation and marker creation
                setTimeout(() => {
                    // Find location markers (numbered circles)
                    const markers = document.querySelectorAll('[role="button"][aria-label]');
                    const markerCount = markers.length;

                    if (markerCount === 0) {
                        resolve({ success: false, error: 'No markers found at zoom 6', markerCount: 0 });
                        return;
                    }

                    // Try to trigger hover on first marker
                    const firstMarker = markers[0];
                    const mouseoverEvent = new MouseEvent('mouseover', {
                        view: window,
                        bubbles: true,
                        cancelable: true
                    });
                    firstMarker.dispatchEvent(mouseoverEvent);

                    // Wait for InfoWindow to appear
                    setTimeout(() => {
                        const infoWindow = document.querySelector('.gm-style-iw');
                        if (!infoWindow) {
                            resolve({
                                success: false,
                                error: 'InfoWindow not found after hover',
                                markerCount
                            });
                            return;
                        }

                        const content = infoWindow.textContent || '';
                        const hasUndefined = content.toLowerCase().includes('undefined');
                        const isEmpty = content.trim().length === 0;
                        const popupTitle = infoWindow.querySelector('.popup-title');
                        const title = popupTitle ? popupTitle.textContent : '';

                        resolve({
                            success: true,
                            markerCount,
                            hasUndefined,
                            isEmpty,
                            title,
                            contentPreview: content.substring(0, 100)
                        });
                    }, hoverDelay);
                }, zoomDelay);
            });
        }, HOVER_DELAY, ZOOM_ANIMATION_DELAY);

        if (!zoomTest.success) {
            console.error(`  ❌ Zoom test failed: ${zoomTest.error}`);
            if (zoomTest.markerCount > 0) {
                console.log(`  ℹ️  Found ${zoomTest.markerCount} markers but hover test failed`);
            }
        } else if (zoomTest.hasUndefined) {
            console.error(`  ❌ Location InfoWindow contains "undefined": ${zoomTest.contentPreview}`);
            throw new Error('Global map location hover card shows "undefined"');
        } else if (zoomTest.isEmpty) {
            console.error('  ❌ Location InfoWindow is empty');
            throw new Error('Global map location hover card is blank');
        } else if (!zoomTest.title) {
            console.error('  ❌ Location InfoWindow has no title');
            throw new Error('Global map location InfoWindow missing title');
        } else {
            console.log(`  ✅ Found ${zoomTest.markerCount} location markers at zoom 6`);
            console.log(`  ✅ Location hover card shows: "${zoomTest.title}"`);
        }

        logTestDiagnostics(errors, logs);

        console.log('  ✅ Global map test passed');
        return true;

    } catch (error) {
        console.error('  ❌ Global map test failed:', error.message);
        logTestDiagnostics(errors, [], failedUrls);
        return false;
    } finally {
        await page.close();
    }
}

async function testTripMap(browser) {
    console.log('\n📍 Testing Per-Trip Map Page (Greece)...');
    const page = await browser.newPage();
    const { errors, logs } = setupPageListeners(page);

    try {
        await navigateAndWaitForMaps(page, `${BASE_URL}/trips/greece/map.html`);

        // Validate map rendered
        const mapInfo = await validateMapContent(page, 'trip-map-full');

        if (mapInfo.markerCount > 0) {
            console.log(`  ✅ Found ${mapInfo.markerCount} markers on trip map`);
        }

        // Test hover card (InfoWindow) content
        console.log('  🔍 Testing hover card content...');
        const hoverTest = await page.evaluate((hoverDelay) => {
            return new Promise((resolve) => {
                // Find first marker button
                const markerButton = document.querySelector('[role="button"][aria-label]');
                if (!markerButton) {
                    resolve({ found: false, error: 'No marker button found' });
                    return;
                }

                // Trigger mouseover event
                const mouseoverEvent = new MouseEvent('mouseover', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                });
                markerButton.dispatchEvent(mouseoverEvent);

                // Wait a bit for InfoWindow to appear
                setTimeout(() => {
                    // Check for InfoWindow content
                    const infoWindow = document.querySelector('.gm-style-iw');
                    if (!infoWindow) {
                        resolve({ found: false, error: 'InfoWindow not found after hover' });
                        return;
                    }

                    const content = infoWindow.textContent || '';
                    const hasUndefined = content.toLowerCase().includes('undefined');
                    const popupTitle = infoWindow.querySelector('.popup-title');
                    const title = popupTitle ? popupTitle.textContent : '';

                    resolve({
                        found: true,
                        hasUndefined,
                        title,
                        contentPreview: content.substring(0, 100)
                    });
                }, hoverDelay);
            });
        }, HOVER_DELAY);

        if (!hoverTest.found) {
            console.error(`  ❌ Hover test failed: ${hoverTest.error}`);
        } else if (hoverTest.hasUndefined) {
            console.error(`  ❌ InfoWindow contains "undefined": ${hoverTest.contentPreview}`);
            throw new Error('InfoWindow hover card shows "undefined"');
        } else if (!hoverTest.title) {
            console.error('  ❌ InfoWindow has no title');
            throw new Error('InfoWindow missing location title');
        } else {
            console.log(`  ✅ Hover card shows location: "${hoverTest.title}"`);
        }

        await checkMapError(page, 'trip-map-full');
        logTestDiagnostics(errors, logs);

        console.log('  ✅ Per-trip map test passed');
        return true;

    } catch (error) {
        console.error('  ❌ Per-trip map test failed:', error.message);
        logTestDiagnostics(errors, []);
        return false;
    } finally {
        await page.close();
    }
}

async function runTests() {
    console.log('🧪 Starting Google Maps integration tests...\n');

    let browser;
    try {
        // Start test server
        await startServer();

        // Launch browser
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        console.log('🚀 Browser launched');

        // Run tests
        const globalMapPassed = await testGlobalMap(browser);
        const tripMapPassed = await testTripMap(browser);

        // Summary
        console.log('\n' + '='.repeat(50));
        console.log('📊 Test Results:');
        console.log(`  Global Map: ${globalMapPassed ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`  Trip Map:   ${tripMapPassed ? '✅ PASS' : '❌ FAIL'}`);
        console.log('='.repeat(50) + '\n');

        // Exit with appropriate code
        const allPassed = globalMapPassed && tripMapPassed;
        if (!allPassed) {
            console.error('❌ Some tests failed');
            process.exit(1);
        } else {
            console.log('✅ All map tests passed!');
            process.exit(0);
        }

    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    } finally {
        if (browser) {
            await browser.close();
        }
        await stopServer();
    }
}

// Run tests
runTests();
