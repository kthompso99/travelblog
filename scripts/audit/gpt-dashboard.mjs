// ============================================
// Two Travel Nuts Editorial Dashboard
// ============================================

import fs from "fs";
import path from "path";

// ==============================
// 🔧 CONFIG (MATCH audit.js)
// ==============================

const WEIGHTS = {
  sentence_structure: 0.20,
  narrative_clarity: 0.25,
  opening_strength: 0.15,
  brand_alignment: 0.15,
  distinctiveness: 0.15,
  rating_integrity: 0.10
};

const ARTICLE_THRESHOLD = 8.5;
const TRIP_THRESHOLD = 8.7;

// ==============================
// 📂 Helpers
// ==============================

function getLatestAudit(folderPath) {
  if (!fs.existsSync(folderPath)) return null;

  const files = fs
    .readdirSync(folderPath)
    .filter(f => f.endsWith(".json"))
    .sort();

  if (files.length === 0) return null;

  const latestFile = files[files.length - 1];
  const fullPath = path.join(folderPath, latestFile);

  return JSON.parse(fs.readFileSync(fullPath, "utf-8"));
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

      const audit = getLatestAudit(auditFolder);
      if (audit) {
        trips[tripName].push({
          article: articleName,
          score: audit.overall_score
        });
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
      console.log(
        `${a.score.toFixed(2)}  |  ${a.trip} / ${a.article}`
      );
    });

  console.log("\n");
}

runDashboard();
