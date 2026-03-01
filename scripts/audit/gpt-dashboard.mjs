// ============================================
// Two Travel Nuts Editorial Dashboard
// ============================================

import fs from "fs";
import path from "path";
import { WEIGHTS } from "./audit-shared.mjs";

// ==============================
// 🔧 CONFIG
// ==============================

const DIMENSIONS = Object.keys(WEIGHTS);

const ARTICLE_THRESHOLD = 8.5;
const TRIP_THRESHOLD = 8.7;

const DETAIL_MODE = process.argv.includes("--detail") ||
  process.argv.includes("-detail");

// --provider gpt | claude | all (default: all)
function getProviderFilter() {
  const idx = process.argv.indexOf("--provider");
  if (idx !== -1 && process.argv[idx + 1]) {
    return process.argv[idx + 1];
  }
  return "all";
}

const PROVIDER_FILTER = getProviderFilter();

// ==============================
// 📂 Helpers
// ==============================

function getLatestAudit(folderPath, provider) {
  if (!fs.existsSync(folderPath)) return null;

  let files = fs
    .readdirSync(folderPath)
    .filter(f => f.endsWith(".audit.json"));

  // Filter by provider if specified
  if (provider !== "all") {
    files = files.filter(f => f.includes(`.${provider}.`));
  }

  files.sort();

  if (files.length === 0) return null;

  const latestFile = files[files.length - 1];
  const fullPath = path.join(folderPath, latestFile);

  // Extract provider from filename: YYYY-MM-DD.{provider}.audit.json
  const match = latestFile.match(/\.(\w+)\.audit\.json$/);
  const src = match ? match[1] : "?";

  const data = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
  data._provider = src;
  return data;
}

function collectTrips() {
  const tripsRoot = "content/trips";
  const trips = {};

  if (!fs.existsSync(tripsRoot)) return trips;

  for (const tripName of fs.readdirSync(tripsRoot)) {
    const tripPath = path.join(tripsRoot, tripName);
    if (!fs.statSync(tripPath).isDirectory()) continue;

    trips[tripName] = [];

    for (const file of fs.readdirSync(tripPath)) {
      if (!file.endsWith(".md")) continue;

      const articleName = file.replace(".md", "");
      const auditFolder = path.join(
        tripPath,
        "audits",
        articleName
      );

      const audit = getLatestAudit(auditFolder, PROVIDER_FILTER);
      if (audit) {
        const entry = {
          article: articleName,
          score: audit.overall_score,
          provider: audit._provider
        };
        if (DETAIL_MODE) {
          for (const dim of DIMENSIONS) {
            entry[dim] = audit[dim] ?? null;
          }
        }
        trips[tripName].push(entry);
      }
    }
  }

  return trips;
}

// ==============================
// 📊 Dashboard Output
// ==============================

function runDashboard() {
  const trips = collectTrips();

  console.log("\n======================================");
  console.log(" TWO TRAVEL NUTS EDITORIAL DASHBOARD ");
  if (PROVIDER_FILTER !== "all") {
    console.log(`  (provider: ${PROVIDER_FILTER})`);
  }
  console.log("======================================\n");

  let allArticles = [];
  let siteReady = true;

  // ---------- TRIP VIEW ----------
  console.log("📍 TRIP READINESS VIEW\n");

  for (const tripName in trips) {
    const articles = trips[tripName];

    if (articles.length === 0) continue;

    const scores = articles.map(a => a.score);
    const avg =
      scores.reduce((a, b) => a + b, 0) / scores.length;

    const lowest = Math.min(...scores);

    const tripReady =
      avg >= TRIP_THRESHOLD &&
      lowest >= ARTICLE_THRESHOLD;

    if (!tripReady) siteReady = false;

    console.log(`${tripName}`);
    console.log(`  Avg Score: ${avg.toFixed(2)}`);
    console.log(`  Lowest Article: ${lowest.toFixed(2)}`);
    console.log(
      `  Status: ${
        tripReady ? "READY" : "NOT READY"
      }\n`
    );

    allArticles.push(
      ...articles.map(a => ({
        ...a,
        trip: tripName
      }))
    );
  }

  console.log(
    "Overall Site Status:",
    siteReady ? "READY TO LAUNCH" : "NOT READY"
  );

  // ---------- TRIAGE VIEW ----------
  console.log("\n📉 TRIAGE VIEW (Worst First)\n");

  allArticles
    .sort((a, b) => a.score - b.score)
    .forEach(a => {
      const src = a.provider ? ` [${a.provider}]` : "";
      console.log(
        `${a.score.toFixed(2)}  |  ${a.trip} / ${a.article}${src}`
      );
    });

  // ---------- DETAIL GRID ----------
  if (DETAIL_MODE && allArticles.length > 0) {
    console.log("\n📊 DIMENSION DETAIL GRID\n");

    const SHORT = {
      prose_control_structure: "Prose",
      narrative_clarity_arc:   "Narr",
      opening_strength:        "Open",
      brand_alignment:         "Brand",
      distinctiveness:         "Dist",
      decision_clarity:        "Decis"
    };

    // Column widths
    const nameW = Math.max(
      5,
      ...allArticles.map(a => `${a.trip}/${a.article}`.length)
    );
    const colW = 6;
    const srcW = 4;

    // Header
    const header =
      "Article".padEnd(nameW) + "  " +
      "Src".padStart(srcW) + "  " +
      DIMENSIONS.map(d => (SHORT[d] || d).padStart(colW)).join("") +
      "  " + "Over".padStart(colW);
    console.log(header);
    console.log("-".repeat(header.length));

    // Rows — sorted by overall score ascending (worst first)
    allArticles
      .sort((a, b) => a.score - b.score)
      .forEach(a => {
        const name = `${a.trip}/${a.article}`;
        const src = (a.provider || "?").padStart(srcW);
        const dims = DIMENSIONS.map(d => {
          const v = a[d];
          return v != null ? v.toFixed(1).padStart(colW) : "  —   ";
        }).join("");
        const overall = a.score.toFixed(2).padStart(colW);
        console.log(`${name.padEnd(nameW)}  ${src}  ${dims}  ${overall}`);
      });
  }

  console.log("\n");
}

runDashboard();
