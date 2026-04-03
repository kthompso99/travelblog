#!/usr/bin/env node

/**
 * Headless browser test for Google Maps integration
 * Verifies that maps load correctly and don't show blank screens
 */

import puppeteer from 'puppeteer';
import {
    BASE_URL,
    ZOOM_ANIMATION_DELAY,
    HOVER_DELAY,
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
} from './test-maps-helpers.js';

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
        await page.evaluate((zoomDelay) => {
            return new Promise((resolve) => {
                map.setZoom(6);
                setTimeout(resolve, zoomDelay);
            });
        }, ZOOM_ANIMATION_DELAY);

        const markerCount = await page.evaluate(() => {
            return document.querySelectorAll('[role="button"][aria-label]').length;
        });

        if (markerCount === 0) {
            console.error('  ❌ No markers found at zoom 6');
        } else {
            console.log(`  ✅ Found ${markerCount} location markers at zoom 6`);
            const hoverResult = await testMarkerHover(page, HOVER_DELAY);
            validateHoverResult(hoverResult, 'Global map location');
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
        await navigateAndWaitForMaps(page, `${BASE_URL}/trips/greece/route.html`);

        // Validate map rendered
        const mapInfo = await validateMapContent(page, 'trip-map-full');

        if (mapInfo.markerCount > 0) {
            console.log(`  ✅ Found ${mapInfo.markerCount} markers on trip map`);
        }

        // Test hover card (InfoWindow) content
        console.log('  🔍 Testing hover card content...');
        const hoverResult = await testMarkerHover(page, HOVER_DELAY);
        validateHoverResult(hoverResult, 'Trip map');

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
