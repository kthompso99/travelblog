#!/usr/bin/env node
/**
 * Headless browser analysis of hero flash issue
 * Compares GitHub deployed version vs localhost build
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function analyzeHeroFlash() {
    console.log('🔍 Analyzing hero flash with headless browser...\n');

    const browser = await puppeteer.launch({
        headless: true,
        devtools: false
    });

    try {
        // Test GitHub version (no flash)
        console.log('📍 Testing GitHub version (deployed)...');
        const githubPage = await browser.newPage();
        const githubMetrics = await capturePageLoad(
            githubPage,
            'https://kthompso99.github.io/travelblog/trips/greece/naxos.html',
            'github'
        );

        // Test localhost version (has flash)
        console.log('\n📍 Testing localhost version (local build)...');
        const localPage = await browser.newPage();
        const localMetrics = await capturePageLoad(
            localPage,
            'http://localhost:8000/trips/greece/naxos.html',
            'localhost'
        );

        // Compare results
        console.log('\n📊 Analysis Results:\n');
        console.log('GitHub Version:');
        console.log(`  - Hero element structure: ${githubMetrics.heroStructure}`);
        console.log(`  - Content wrapper: ${githubMetrics.contentWrapper}`);
        console.log(`  - Hero background type: ${githubMetrics.heroBackgroundType}`);
        console.log(`  - Time to hero visible: ${githubMetrics.heroVisibleTime}ms`);

        console.log('\nLocalhost Version:');
        console.log(`  - Hero element structure: ${localMetrics.heroStructure}`);
        console.log(`  - Content wrapper: ${localMetrics.contentWrapper}`);
        console.log(`  - Hero background type: ${localMetrics.heroBackgroundType}`);
        console.log(`  - Time to hero visible: ${localMetrics.heroVisibleTime}ms`);

        console.log('\n🔍 Key Differences:');
        if (githubMetrics.contentWrapper !== localMetrics.contentWrapper) {
            console.log(`  ⚠️  Content wrapper: "${githubMetrics.contentWrapper}" vs "${localMetrics.contentWrapper}"`);
        }
        if (githubMetrics.heroBackgroundType !== localMetrics.heroBackgroundType) {
            console.log(`  ⚠️  Hero background: "${githubMetrics.heroBackgroundType}" vs "${localMetrics.heroBackgroundType}"`);
        }

        await githubPage.close();
        await localPage.close();

    } catch (error) {
        console.error('❌ Error during analysis:', error.message);
    } finally {
        await browser.close();
    }
}

async function capturePageLoad(page, url, label) {
    const metrics = {
        heroStructure: 'unknown',
        contentWrapper: 'unknown',
        heroBackgroundType: 'unknown',
        heroVisibleTime: 0
    };

    const startTime = Date.now();

    // Navigate to page
    await page.goto(url, { waitUntil: 'networkidle0' });

    metrics.heroVisibleTime = Date.now() - startTime;

    // Analyze hero structure
    metrics.heroStructure = await page.evaluate(() => {
        const hero = document.querySelector('.trip-hero');
        if (!hero) return 'no-hero';

        const children = Array.from(hero.children).map(el => {
            if (el.classList.contains('trip-hero-bg')) return 'div.trip-hero-bg';
            if (el.classList.contains('trip-hero-bg-img')) return 'img.trip-hero-bg-img';
            if (el.classList.contains('trip-hero-overlay')) return 'div.trip-hero-overlay';
            if (el.classList.contains('trip-hero-content')) return 'div.trip-hero-content';
            return el.tagName.toLowerCase();
        });

        return children.join(' > ');
    });

    // Check content wrapper
    metrics.contentWrapper = await page.evaluate(() => {
        const contentView = document.querySelector('#content-view');
        if (!contentView) return 'no-content-view';

        const hasContentArea = contentView.querySelector('#content-area');
        if (hasContentArea) return 'has-content-area';

        const firstChild = contentView.firstElementChild;
        if (firstChild && firstChild.tagName === 'H1') return 'h1-direct';
        if (firstChild && firstChild.classList.contains('markdown-content')) return 'markdown-direct';

        return 'other: ' + (firstChild ? firstChild.tagName : 'empty');
    });

    // Check hero background type
    metrics.heroBackgroundType = await page.evaluate(() => {
        const heroBg = document.querySelector('.trip-hero-bg');
        const heroBgImg = document.querySelector('.trip-hero-bg-img');

        if (heroBgImg) return 'IMG tag';
        if (heroBg) {
            const style = window.getComputedStyle(heroBg);
            const bgImage = style.backgroundImage;
            if (bgImage && bgImage !== 'none') return 'CSS background-image';
        }

        return 'none';
    });

    return metrics;
}

// Run analysis
analyzeHeroFlash().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
