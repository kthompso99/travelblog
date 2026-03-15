// ============================================
// Two Travel Nuts Editorial Dashboard
// ============================================
//
// Usage:
//   npm run dashboard                       # all trips, all providers
//   npm run dashboard -- greece             # single trip
//   npm run dashboard -- --provider claude  # Claude audits only
//   npm run dashboard -- --provider gpt     # GPT audits only
//   npm run dashboard -- --detail           # include per-dimension scores
//   npm run dashboard -- --detail greece    # combine flags
//

import fs from "fs";
import path from "path";
import { WEIGHTS, getContentType, computeWeightedScore } from "./audit-shared.mjs";

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

// Optional trip filter: first positional arg (not a flag or flag value)
function getTripFilter() {
  const skip = new Set(["--detail", "-detail", "--provider"]);
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (skip.has(arg)) {
      if (arg === "--provider") i++; // skip its value too
      continue;
    }
    if (!arg.startsWith("-")) return arg;
  }
  return null;
}

const TRIP_FILTER = getTripFilter();

// Reject unknown flags
const KNOWN_FLAGS = new Set(["--detail", "-detail", "--provider"]);
for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (arg === "--provider") { i++; continue; }
  if (arg.startsWith("-") && !KNOWN_FLAGS.has(arg)) {
    console.error(`Unknown flag: ${arg}`);
    process.exit(1);
  }
}

// ==============================
// 📂 Helpers
// ==============================

function getLatestAuditsByProvider(folderPath, providerFilter) {
  if (!fs.existsSync(folderPath)) return [];

  let files = fs
    .readdirSync(folderPath)
    .filter(f => f.endsWith(".audit.json"));

  if (providerFilter !== "all") {
    files = files.filter(f => f.includes(`.${providerFilter}.`));
  }

  // Group by provider, keep latest per provider
  const byProvider = {};
  for (const f of files) {
    const match = f.match(/\.(\w+)\.audit\.json$/);
    const src = match ? match[1] : "?";
    if (!byProvider[src] || f > byProvider[src]) {
      byProvider[src] = f;
    }
  }

  return Object.entries(byProvider).map(([src, filename]) => {
    const data = JSON.parse(fs.readFileSync(path.join(folderPath, filename), "utf-8"));
    data._provider = src;
    return data;
  });
}

function collectTrips() {
  const tripsRoot = "content/trips";
  const trips = {};

  if (!fs.existsSync(tripsRoot)) return trips;

  for (const tripName of fs.readdirSync(tripsRoot)) {
    const tripPath = path.join(tripsRoot, tripName);
    if (!fs.statSync(tripPath).isDirectory()) continue;
    if (TRIP_FILTER && tripName !== TRIP_FILTER) continue;

    trips[tripName] = [];

    for (const file of fs.readdirSync(tripPath)) {
      if (!file.endsWith(".md")) continue;

      const articleName = file.replace(".md", "");
      const auditFolder = path.join(
        tripPath,
        "audits",
        articleName
      );

      const audits = getLatestAuditsByProvider(auditFolder, PROVIDER_FILTER);
      const contentType = getContentType(path.join(tripPath, file));
      for (const audit of audits) {
        const score = computeWeightedScore(audit, contentType);
        const entry = {
          article: articleName,
          score,
          provider: audit._provider,
          contentType
        };
        if (DETAIL_MODE) {
          for (const dim of DIMENSIONS) {
            if (contentType === "article" && dim === "decision_clarity") {
              entry[dim] = null;
            } else {
              entry[dim] = audit[dim] ?? null;
            }
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
  for (const tripName in trips) {
    allArticles.push(
      ...trips[tripName].map(a => ({ ...a, trip: tripName }))
    );
  }

  const providers = [...new Set(allArticles.map(a => a.provider))].sort();

  // ---------- TRIP VIEW ----------
  for (const prov of providers) {
    console.log(`📍 TRIP READINESS — ${prov.toUpperCase()}\n`);

    let provReady = true;

    for (const tripName in trips) {
      const articles = trips[tripName].filter(a => a.provider === prov);
      if (articles.length === 0) continue;

      const scores = articles.map(a => a.score);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const lowest = Math.min(...scores);
      const tripReady = avg >= TRIP_THRESHOLD && lowest >= ARTICLE_THRESHOLD;

      if (!tripReady) provReady = false;

      console.log(`${tripName}`);
      console.log(`  Avg Score: ${avg.toFixed(2)}`);
      console.log(`  Lowest Article: ${lowest.toFixed(2)}`);
      console.log(`  Status: ${tripReady ? "READY" : "NOT READY"}\n`);
    }

    console.log(
      `Overall Site Status (${prov}):`,
      provReady ? "READY TO LAUNCH" : "NOT READY"
    );
    console.log("");
  }

  // ---------- TRIAGE VIEW ----------
  for (const prov of providers) {
    const group = allArticles
      .filter(a => a.provider === prov)
      .sort((a, b) => a.score - b.score);

    console.log(`\n📉 TRIAGE — ${prov.toUpperCase()} (Worst First)\n`);

    group.forEach(a => {
      const type = a.contentType === "article" ? " [A]" : "";
      console.log(
        `${a.score.toFixed(2)}  |  ${a.trip} / ${a.article}${type}`
      );
    });
  }

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

    // Column widths — derived from actual data
    const nameW = Math.max(
      7,
      ...allArticles.map(a => `${a.trip}/${a.article}`.length)
    );
    const srcW = Math.max(
      3,
      ...allArticles.map(a => (a.provider || "?").length)
    );
    const colW = 6;

    // Header
    const header =
      "Article".padEnd(nameW) + "  " +
      "Src".padEnd(srcW) + "  " +
      DIMENSIONS.map(d => (SHORT[d] || d).padStart(colW)).join("") +
      "  " + "Over".padStart(colW);
    console.log(header);
    console.log("-".repeat(header.length));

    // Rows — sorted alphabetically by article, then provider
    allArticles
      .sort((a, b) => {
        const nameA = `${a.trip}/${a.article}`;
        const nameB = `${b.trip}/${b.article}`;
        if (nameA !== nameB) return nameA.localeCompare(nameB);
        return a.provider.localeCompare(b.provider);
      })
      .forEach(a => {
        const name = `${a.trip}/${a.article}`;
        const src = (a.provider || "?").padEnd(srcW);
        const dims = DIMENSIONS.map(d => {
          const v = a[d];
          return v != null ? v.toFixed(1).padStart(colW) : "   —  ";
        }).join("");
        const overall = a.score.toFixed(2).padStart(colW);
        console.log(`${name.padEnd(nameW)}  ${src}  ${dims}  ${overall}`);
      });
  }

  console.log("\n");
}

runDashboard();
