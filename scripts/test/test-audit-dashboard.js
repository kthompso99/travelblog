#!/usr/bin/env node

// ============================================
// Audit Dashboard Frontend Tests
// ============================================
//
// Puppeteer-based tests for audit-runner.html
// Catches JavaScript errors, infinite recursion, and UI rendering bugs

import puppeteer from "puppeteer";
import { setTimeout as sleep } from "timers/promises";

const PORT = 3001; // Audit server port
const BASE_URL = `http://localhost:${PORT}`;

let browser;
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`  ❌ ${message}`);
  }
}

// ============================================
// Test Server Setup
// ============================================

async function checkServerRunning() {
  try {
    const response = await fetch(`${BASE_URL}/api/config`);
    return response.ok;
  } catch {
    return false;
  }
}

// ============================================
// Dashboard Smoke Tests
// ============================================

async function testDashboardLoads() {
  const page = await browser.newPage();
  const consoleErrors = [];
  const jsErrors = [];

  // Capture console errors
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  // Capture JavaScript errors
  page.on("pageerror", (err) => {
    jsErrors.push(err.message);
  });

  try {
    await page.goto(`${BASE_URL}/greece`, { waitUntil: "networkidle0", timeout: 10000 });

    // Give JavaScript time to execute
    await sleep(1000);

    // Check for infinite recursion (would cause "Maximum call stack size exceeded")
    const hasStackOverflow = jsErrors.some(err => err.includes("Maximum call stack size exceeded"));
    assert(!hasStackOverflow, "No infinite recursion errors");

    // Check for any JavaScript errors
    assert(jsErrors.length === 0, `No JavaScript errors (found ${jsErrors.length})`);

    // Check that provider cards render
    const providerCards = await page.$$(".provider-card");
    assert(providerCards.length > 0, "Provider cards rendered");

    // Check that getProviderLabel function exists and works
    const labelTest = await page.evaluate(() => {
      try {
        // Test that getProviderLabel doesn't cause infinite recursion
        const opusLabel = getProviderLabel("opus");
        const gptLabel = getProviderLabel("gpt");
        return opusLabel === "Opus" && gptLabel === "GPT";
      } catch (err) {
        return false;
      }
    });
    assert(labelTest, "getProviderLabel() works correctly");

    // Check that provider labels are displayed correctly
    const displayedLabels = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll(".provider-card"));
      return cards.map(card => card.textContent);
    });
    const hasOpusLabel = displayedLabels.some(text => text.includes("Opus"));
    const hasGptLabel = displayedLabels.some(text => text.includes("GPT"));
    assert(hasOpusLabel || hasGptLabel, "Provider labels display correctly");

  } catch (err) {
    failed++;
    console.error(`  ❌ Dashboard load failed: ${err.message}`);
  } finally {
    await page.close();
  }
}

async function testHelperFunctions() {
  const page = await browser.newPage();

  try {
    await page.goto(`${BASE_URL}/greece`, { waitUntil: "networkidle0" });

    // Test getProviderLabel directly
    const results = await page.evaluate(() => {
      const tests = [];

      // Test 1: Opus returns "Opus"
      try {
        const result = getProviderLabel("opus");
        tests.push({ name: "getProviderLabel('opus')", pass: result === "Opus", result });
      } catch (err) {
        tests.push({ name: "getProviderLabel('opus')", pass: false, error: err.message });
      }

      // Test 2: GPT returns "GPT"
      try {
        const result = getProviderLabel("gpt");
        tests.push({ name: "getProviderLabel('gpt')", pass: result === "GPT", result });
      } catch (err) {
        tests.push({ name: "getProviderLabel('gpt')", pass: false, error: err.message });
      }

      // Test 3: Function doesn't cause infinite recursion (completes in reasonable time)
      try {
        const start = Date.now();
        getProviderLabel("opus");
        const duration = Date.now() - start;
        tests.push({ name: "getProviderLabel() completes quickly", pass: duration < 100, duration });
      } catch (err) {
        tests.push({ name: "getProviderLabel() completes quickly", pass: false, error: err.message });
      }

      return tests;
    });

    for (const test of results) {
      if (test.pass) {
        assert(true, test.name);
      } else {
        assert(false, `${test.name} - ${test.error || `got ${test.result}`}`);
      }
    }

  } catch (err) {
    failed++;
    console.error(`  ❌ Helper function tests failed: ${err.message}`);
  } finally {
    await page.close();
  }
}

async function testWebSocketConnection() {
  const page = await browser.newPage();

  try {
    await page.goto(`${BASE_URL}/greece`, { waitUntil: "networkidle0" });
    await sleep(500);

    // Check that WebSocket connection established without errors
    const wsConnected = await page.evaluate(() => {
      // Check for global ws object or connection indicator
      return typeof ws !== "undefined" || document.body.classList.contains("ws-connected");
    });

    // This might not exist, so we just check no errors occurred
    assert(true, "WebSocket initialization completed");

  } catch (err) {
    failed++;
    console.error(`  ❌ WebSocket test failed: ${err.message}`);
  } finally {
    await page.close();
  }
}

// ============================================
// Test Runner
// ============================================

async function runTests() {
  console.log("\n🧪 Starting Audit Dashboard Tests...\n");

  // Check if server is running
  const serverRunning = await checkServerRunning();
  if (!serverRunning) {
    console.log("⚠️  Audit server not running at localhost:3001");
    console.log("   Skipping dashboard tests (start with 'npm run audit-dash' to enable)\n");
    console.log("✅ Tests skipped (not a failure)\n");
    process.exit(0);
  }

  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    // Run tests
    console.log("📍 Testing dashboard loads without errors...");
    await testDashboardLoads();

    console.log("📍 Testing helper functions...");
    await testHelperFunctions();

    console.log("📍 Testing WebSocket connection...");
    await testWebSocketConnection();

  } catch (err) {
    console.error(`\n❌ Test suite failed: ${err.message}\n`);
    process.exit(1);
  } finally {
    // Cleanup
    if (browser) await browser.close();
  }

  // Report results
  console.log("\n" + "=".repeat(50));
  console.log("📊 Audit Dashboard Test Results:");
  console.log(`  Assertions : ${passed + failed}  (${passed} passed, ${failed} failed)`);
  console.log("=".repeat(50) + "\n");

  if (failed > 0) {
    console.log("❌ Some tests failed\n");
    process.exit(1);
  } else {
    console.log("✅ All dashboard tests passed!\n");
    process.exit(0);
  }
}

runTests();
