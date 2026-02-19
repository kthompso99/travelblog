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

async function testGlobalMap(browser) {
    console.log('\n📍 Testing Global Map Page...');
    const page = await browser.newPage();
    const { errors, logs, failedUrls } = setupPageListeners(page);

    try {
        // Navigate to map page
        await page.goto(`${BASE_URL}/map/index.html`, {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        // Wait for Google Maps API to load
        try {
            await page.waitForFunction(() => {
                return typeof google !== 'undefined' && google.maps;
            }, { timeout: 10000 });
        } catch (timeoutError) {
            // Check what's actually on the page
            const googleStatus = await page.evaluate(() => {
                if (typeof google === 'undefined') return 'google is undefined';
                if (!google.maps) return `google exists but maps is ${typeof google.maps}`;
                return 'google.maps exists';
            });
            console.error(`  ⚠️  Timeout waiting for Google Maps. Status: ${googleStatus}`);

            // Check if script tag exists
            const scriptInfo = await page.evaluate(() => {
                const scripts = Array.from(document.querySelectorAll('script[src*="maps.googleapis.com"]'));
                if (scripts.length === 0) return 'No Google Maps script tag found';
                return `Found ${scripts.length} script(s): ${scripts.map(s => s.src).join(', ')}`;
            });
            console.error(`  ⚠️  Script tags: ${scriptInfo}`);

            // Check for error messages in page
            const bodyText = await page.evaluate(() => document.body.innerText);
            if (bodyText.toLowerCase().includes('error') || bodyText.toLowerCase().includes('invalid')) {
                console.error(`  ⚠️  Page contains error text: ${bodyText.substring(0, 500)}`);
            }
            throw timeoutError;
        }

        console.log('  ✅ Google Maps API loaded');

        // Wait for map initialization
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Check if map div exists and has content
        const mapHasContent = await page.evaluate(() => {
            const mapDiv = document.getElementById('map');
            if (!mapDiv) return false;

            // Check if map has been initialized (Google adds classes and children)
            const hasGoogleContent = mapDiv.querySelector('.gm-style') !== null;
            const hasChildren = mapDiv.children.length > 0;

            return {
                exists: true,
                hasChildren,
                hasGoogleContent,
                innerHTML: mapDiv.innerHTML.substring(0, 200) // First 200 chars for debugging
            };
        });

        if (!mapHasContent.exists) {
            throw new Error('Map div not found');
        }

        if (!mapHasContent.hasGoogleContent) {
            console.error('  ❌ Map div has no Google Maps content');
            console.error('  Map innerHTML preview:', mapHasContent.innerHTML);
            throw new Error('Map did not render - no Google Maps content found');
        }

        console.log('  ✅ Map div has Google Maps content');

        // Check for error messages in map div
        const errorInMap = await page.evaluate(() => {
            const mapDiv = document.getElementById('map');
            return mapDiv && mapDiv.textContent.includes('Map Error');
        });

        if (errorInMap) {
            const errorText = await page.evaluate(() => {
                return document.getElementById('map').textContent;
            });
            throw new Error(`Map shows error: ${errorText}`);
        }

        // Check for JavaScript errors
        if (errors.length > 0) {
            console.error('  ⚠️  JavaScript errors detected:');
            errors.forEach(err => console.error(`    - ${err}`));
        }

        // Log ALL console messages for debugging
        if (logs.length > 0) {
            console.log('  📋 All console logs:');
            logs.forEach(log => console.log(`    ${log}`));
        }

        // Test zoom-based detail markers and hovercards
        console.log('  🔍 Testing zoom-based location markers...');
        const zoomTest = await page.evaluate(() => {
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
                        const markerPopupTitle = infoWindow.querySelector('.marker-popup-title');
                        const title = markerPopupTitle ? markerPopupTitle.textContent : '';

                        resolve({
                            success: true,
                            markerCount,
                            hasUndefined,
                            isEmpty,
                            title,
                            contentPreview: content.substring(0, 100)
                        });
                    }, 500);
                }, 2000); // Wait 2s for zoom animation and marker lifecycle
            });
        });

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

        console.log('  ✅ Global map test passed');
        return true;

    } catch (error) {
        console.error('  ❌ Global map test failed:', error.message);
        if (failedUrls.length > 0) {
            console.error('  Failed requests:');
            failedUrls.forEach(url => console.error(`    - ${url}`));
        }
        if (errors.length > 0) {
            console.error('  JavaScript errors:');
            errors.forEach(err => console.error(`    - ${err}`));
        }
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
        await page.goto(`${BASE_URL}/trips/greece/map.html`, {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        await page.waitForFunction(() => {
            return typeof google !== 'undefined' && google.maps;
        }, { timeout: 10000 });

        console.log('  ✅ Google Maps API loaded');

        await new Promise(resolve => setTimeout(resolve, 3000));

        const mapHasContent = await page.evaluate(() => {
            const mapDiv = document.getElementById('trip-map-full');
            if (!mapDiv) return false;

            const hasGoogleContent = mapDiv.querySelector('.gm-style') !== null;
            const hasChildren = mapDiv.children.length > 0;

            // Check for numbered markers
            const markers = document.querySelectorAll('[role="button"][aria-label]');

            return {
                exists: true,
                hasChildren,
                hasGoogleContent,
                markerCount: markers.length,
                innerHTML: mapDiv.innerHTML.substring(0, 200)
            };
        });

        if (!mapHasContent.exists) {
            throw new Error('Trip map div not found');
        }

        if (!mapHasContent.hasGoogleContent) {
            console.error('  ❌ Trip map div has no Google Maps content');
            console.error('  Map innerHTML preview:', mapHasContent.innerHTML);
            throw new Error('Trip map did not render');
        }

        console.log('  ✅ Trip map div has Google Maps content');

        if (mapHasContent.markerCount > 0) {
            console.log(`  ✅ Found ${mapHasContent.markerCount} markers on trip map`);
        }

        // Test hover card (InfoWindow) content
        console.log('  🔍 Testing hover card content...');
        const hoverTest = await page.evaluate(() => {
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
                    const markerPopupTitle = infoWindow.querySelector('.marker-popup-title');
                    const title = markerPopupTitle ? markerPopupTitle.textContent : '';

                    resolve({
                        found: true,
                        hasUndefined,
                        title,
                        contentPreview: content.substring(0, 100)
                    });
                }, 500);
            });
        });

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

        const errorInMap = await page.evaluate(() => {
            const mapDiv = document.getElementById('trip-map-full');
            return mapDiv && mapDiv.textContent.includes('Map Error');
        });

        if (errorInMap) {
            const errorText = await page.evaluate(() => {
                return document.getElementById('trip-map-full').textContent;
            });
            throw new Error(`Trip map shows error: ${errorText}`);
        }

        if (errors.length > 0) {
            console.error('  ⚠️  JavaScript errors detected:');
            errors.forEach(err => console.error(`    - ${err}`));
        }

        // Log ALL console messages for debugging
        if (logs.length > 0) {
            console.log('  📋 All console logs:');
            logs.forEach(log => console.log(`    ${log}`));
        }

        console.log('  ✅ Per-trip map test passed');
        return true;

    } catch (error) {
        console.error('  ❌ Per-trip map test failed:', error.message);
        if (errors.length > 0) {
            console.error('  JavaScript errors:');
            errors.forEach(err => console.error(`    - ${err}`));
        }
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
