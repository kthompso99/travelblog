// ============================================
// Two Travel Nuts Editorial Dashboard
// ============================================
//
// Usage:
//   npm run dashboard                        # all trips, all providers
//   npm run dashboard -- greece              # single trip
//   npm run dashboard -- --provider gpt      # GPT audits only
//   npm run dashboard -- --provider sonnet   # Sonnet audits only
//   npm run dashboard -- --provider opus     # Opus audits only
//   npm run dashboard -- --detail            # include per-dimension scores
//   npm run dashboard -- --detail greece     # combine flags
//   npm run dashboard -- --history           # score progression over time
//   npm run dashboard -- --history greece    # history for one trip
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

const HISTORY_MODE = process.argv.includes("--history") ||
  process.argv.includes("-history");

if (DETAIL_MODE && HISTORY_MODE) {
  console.error("Cannot use --detail and --history together");
  process.exit(1);
}

// --provider gpt | sonnet | opus | all (default: all)
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
  const skip = new Set(["--detail", "-detail", "--history", "-history", "--provider"]);
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
const KNOWN_FLAGS = new Set(["--detail", "-detail", "--history", "-history", "--provider"]);
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

function getAllAuditsByProvider(folderPath, providerFilter) {
  if (!fs.existsSync(folderPath)) return [];

  let files = fs
    .readdirSync(folderPath)
    .filter(f => f.endsWith(".audit.json"));

  if (providerFilter !== "all") {
    files = files.filter(f => f.includes(`.${providerFilter}.`));
  }

  return files.map(filename => {
    const provMatch = filename.match(/\.(\w+)\.audit\.json$/);
    const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})\./);
    const data = JSON.parse(fs.readFileSync(path.join(folderPath, filename), "utf-8"));
    data._provider = provMatch ? provMatch[1] : "?";
    data._date = dateMatch ? dateMatch[1] : "?";
    return data;
  });
}

function collectTrips() {
  const tripsRoot = "content/trips";
  const trips = {};
  const history = {};  // { "trip/article": { provider: { date: score } } }

  if (!fs.existsSync(tripsRoot)) return { trips, history };

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
      const contentType = getContentType(path.join(tripPath, file));

      // Latest audits (for readiness + triage/detail)
      const audits = getLatestAuditsByProvider(auditFolder, PROVIDER_FILTER);
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

      // All audits (for history)
      if (HISTORY_MODE) {
        const key = `${tripName}/${articleName}`;
        const allAudits = getAllAuditsByProvider(auditFolder, PROVIDER_FILTER);
        for (const audit of allAudits) {
          const score = computeWeightedScore(audit, contentType);
          if (!history[key]) history[key] = {};
          if (!history[key][audit._provider]) history[key][audit._provider] = {};
          history[key][audit._provider][audit._date] = score;
        }
      }
    }
  }

  return { trips, history };
}

// ==============================
// 📊 Dashboard Output
// ==============================

function runDashboard() {
  const { trips, history } = collectTrips();

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

  // ---------- HISTORY VIEW (replaces triage) ----------
  if (HISTORY_MODE && Object.keys(history).length > 0) {
    // Collect all dates per provider
    const datesByProv = {};
    for (const key in history) {
      for (const prov in history[key]) {
        if (!datesByProv[prov]) datesByProv[prov] = new Set();
        for (const date of Object.keys(history[key][prov])) {
          datesByProv[prov].add(date);
        }
      }
    }

    const articles = Object.keys(history).sort();
    const nameW = Math.max(7, ...articles.map(a => a.length));
    const colW = 6;

    for (const prov of providers) {
      if (!datesByProv[prov]) continue;
      const dates = [...datesByProv[prov]].sort();
      // MM-DD labels
      const dateLabels = dates.map(d => d.slice(5));

      console.log(`\n📈 HISTORY — ${prov.toUpperCase()}\n`);

      const header =
        "Article".padEnd(nameW) + "  " +
        dateLabels.map(d => d.padStart(colW)).join("") +
        "   Δ";
      console.log(header);
      console.log("-".repeat(header.length));

      for (const key of articles) {
        const provData = history[key]?.[prov];
        if (!provData) continue;
        const cells = dates.map(d => {
          const v = provData[d];
          return v != null ? v.toFixed(2).padStart(colW) : " ".repeat(colW);
        }).join("");

        // Delta: last non-null minus first non-null
        const scores = dates.map(d => provData[d]).filter(v => v != null);
        let delta = "";
        if (scores.length >= 2) {
          const diff = scores[scores.length - 1] - scores[0];
          const sign = diff >= 0 ? "+" : "";
          delta = `${sign}${diff.toFixed(2)}`;
        }

        console.log(`${key.padEnd(nameW)}  ${cells}  ${delta}`);
      }
    }
  }

  // ---------- TRIAGE VIEW (default, skipped in history mode) ----------
  if (!HISTORY_MODE) {
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
