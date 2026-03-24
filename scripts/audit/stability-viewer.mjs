// ============================================
// Audit Stability Viewer — Analyze Variance
// ============================================
//
// Companion to stability-test.mjs. Reads JSON results and computes
// per-dimension statistics (min, max, range, mean, stdev).
//
// Usage:
//   npm run stability-view                                    # per-file breakdown (all providers)
//   npm run stability-view -- --dimensions                    # cross-file dimension summary
//   npm run stability-view -- --provider sonnet               # filter to one provider
//   npm run stability-view -- --provider opus                 # filter to one provider

import fs from "fs";
import path from "path";
import { DIMENSION_LABELS } from "./audit-shared.mjs";

const OUTPUT_DIR = "audit-stability";

// --provider gpt | sonnet | opus (default: all)
const provIdx = process.argv.indexOf("--provider");
const PROVIDER_FILTER = provIdx !== -1 ? process.argv[provIdx + 1] : null;

const DIMENSIONS = Object.keys(DIMENSION_LABELS);

// ==============================
// 📂 Load Results
// ==============================

if (!fs.existsSync(OUTPUT_DIR)) {
  console.error("No audit-stability/ directory found. Run 'npm run stability-test' first.");
  process.exit(1);
}

const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith(".json")).sort();

if (files.length === 0) {
  console.error("No results found in audit-stability/. Run 'npm run stability-test' first.");
  process.exit(1);
}

const allResults = files.map(f =>
  JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, f), "utf-8"))
);

const results = PROVIDER_FILTER
  ? allResults.filter(r => r.provider === PROVIDER_FILTER)
  : allResults;

if (results.length === 0) {
  const available = [...new Set(allResults.map(r => r.provider))].join(", ");
  console.error(`No results for provider "${PROVIDER_FILTER}". Available: ${available}`);
  process.exit(1);
}

// Group by file + provider
const groups = {};
for (const r of results) {
  const key = `${r.file}|${r.provider}`;
  if (!groups[key]) groups[key] = [];
  groups[key].push(r);
}

// ==============================
// 📊 Stats Helpers
// ==============================

function stats(values) {
  const n = values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n;
  const stdev = Math.sqrt(variance);
  return { min, max, range, mean, stdev, n };
}

// ==============================
// 📊 Output
// ==============================

const date = results[0]?.timestamp?.split("T")[0] || "unknown";
console.log("\n============================================");
console.log(` AUDIT STABILITY RESULTS — ${date}`);
console.log("============================================");

const labelW = Math.max(...Object.values(DIMENSION_LABELS).map(l => l.length));
const colW = 7;

const groupVerdicts = [];

for (const key of Object.keys(groups).sort()) {
  const runs = groups[key];
  const [slug, provider] = key.split("|");
  const model = runs[0].model;
  const contentType = runs[0].contentType;

  console.log(`\n${slug} (${contentType}) — ${provider.toUpperCase()} (${model})`);
  console.log(`  Runs: ${runs.length}`);

  // Header
  const header =
    "  " + "Dimension".padEnd(labelW) +
    "min".padStart(colW) + "max".padStart(colW) +
    "range".padStart(colW) + "mean".padStart(colW) +
    "stdev".padStart(colW);
  console.log("");
  console.log(header);
  console.log("  " + "-".repeat(header.length - 2));

  // Hourly scores row
  const times = runs.map(r => {
    const d = new Date(r.timestamp);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();
  });

  // Per-dimension stats
  for (const dim of DIMENSIONS) {
    const values = runs.map(r => r.scores[dim]).filter(v => v != null);
    if (values.length === 0) continue;
    const s = stats(values);
    const label = DIMENSION_LABELS[dim];
    console.log(
      "  " + label.padEnd(labelW) +
      s.min.toFixed(1).padStart(colW) +
      s.max.toFixed(1).padStart(colW) +
      s.range.toFixed(1).padStart(colW) +
      s.mean.toFixed(2).padStart(colW) +
      s.stdev.toFixed(2).padStart(colW)
    );
  }

  // Overall stats
  const overallValues = runs.map(r => r.scores.overall_score);
  const s = stats(overallValues);
  console.log(
    "  " + "Overall".padEnd(labelW) +
    s.min.toFixed(2).padStart(colW) +
    s.max.toFixed(2).padStart(colW) +
    s.range.toFixed(2).padStart(colW) +
    s.mean.toFixed(2).padStart(colW) +
    s.stdev.toFixed(2).padStart(colW)
  );

  groupVerdicts.push({ slug, provider, range: s.range, stdev: s.stdev });

  // Per-run timeline
  console.log("\n  Timeline:");
  for (let i = 0; i < runs.length; i++) {
    const r = runs[i];
    console.log(`    ${times[i].padStart(8)}  overall ${r.scores.overall_score.toFixed(2)}`);
  }
}

// ==============================
// 🏁 Verdict / Dimension View
// ==============================

if (process.argv.includes("--dimensions")) {
  // Auto-detect providers present in data
  const allProviders = [...new Set(results.map(r => r.provider))];
  // If only one provider, use it; otherwise default to gpt
  const dimProvider = allProviders.length === 1 ? allProviders[0] : "gpt";
  const dimProviderLabel = dimProvider.toUpperCase();
  const dimModel = results.find(r => r.provider === dimProvider)?.model || "";

  console.log("\n============================================");
  console.log(` ${dimProviderLabel} DIMENSION STABILITY — across all files`);
  if (dimModel) console.log(` Model: ${dimModel}`);
  console.log("============================================\n");

  const dimData = {};
  for (const dim of DIMENSIONS) {
    dimData[dim] = { ranges: [], stdevs: [], files: [] };
  }
  dimData.overall = { ranges: [], stdevs: [], files: [] };

  for (const key of Object.keys(groups).sort()) {
    const [slug, provider] = key.split("|");
    if (provider !== dimProvider) continue;
    const runs = groups[key];
    if (runs.length < 2) continue;

    for (const dim of DIMENSIONS) {
      const values = runs.map(r => r.scores[dim]).filter(v => v != null);
      if (values.length < 2) continue;
      const s = stats(values);
      dimData[dim].ranges.push(s.range);
      dimData[dim].stdevs.push(s.stdev);
      dimData[dim].files.push({ slug, range: s.range, stdev: s.stdev, n: s.n });
    }

    const overallValues = runs.map(r => r.scores.overall_score);
    const s = stats(overallValues);
    dimData.overall.ranges.push(s.range);
    dimData.overall.stdevs.push(s.stdev);
    dimData.overall.files.push({ slug, range: s.range, stdev: s.stdev, n: s.n });
  }

  // Summary table
  const allDims = [...DIMENSIONS, "overall"];
  const allLabels = { ...DIMENSION_LABELS, overall: "Overall" };
  const dLabelW = Math.max(...Object.values(allLabels).map(l => l.length));
  const dColW = 9;

  const hdr =
    "  " + "Dimension".padEnd(dLabelW) +
    "avg range".padStart(dColW) +
    "max range".padStart(dColW) +
    "avg stdev".padStart(dColW) +
    "max stdev".padStart(dColW) +
    "  files";
  console.log(hdr);
  console.log("  " + "-".repeat(hdr.length - 2));

  for (const dim of allDims) {
    const d = dimData[dim];
    if (d.ranges.length === 0) continue;
    const label = allLabels[dim];
    const avgRange = d.ranges.reduce((a, b) => a + b, 0) / d.ranges.length;
    const maxRange = Math.max(...d.ranges);
    const avgStdev = d.stdevs.reduce((a, b) => a + b, 0) / d.stdevs.length;
    const maxStdev = Math.max(...d.stdevs);
    console.log(
      "  " + label.padEnd(dLabelW) +
      avgRange.toFixed(2).padStart(dColW) +
      maxRange.toFixed(2).padStart(dColW) +
      avgStdev.toFixed(2).padStart(dColW) +
      maxStdev.toFixed(2).padStart(dColW) +
      `  ${d.ranges.length}`
    );
  }

  // Per-file detail for each dimension
  console.log("\n  Per-file breakdown:");
  for (const dim of allDims) {
    const d = dimData[dim];
    if (d.files.length === 0) continue;
    const label = allLabels[dim];
    const detail = d.files
      .sort((a, b) => b.stdev - a.stdev)
      .map(f => `${f.slug} ${f.stdev.toFixed(2)}`)
      .join(", ");
    console.log(`    ${label.padEnd(dLabelW)}  ${detail}`);
  }

  console.log("");
} else {
  console.log("\n============================================");
  console.log(" VERDICT");
  console.log("============================================");

  for (const g of groupVerdicts) {
    let verdict;
    if (g.range < 0.2 && g.stdev < 0.08) {
      verdict = "Highly stable — 0.3+ differences are meaningful";
    } else if (g.range <= 0.5 && g.stdev <= 0.15) {
      verdict = "Moderately stable — only 0.5+ differences are clearly meaningful";
    } else {
      verdict = "Noisy — scores wander too much for fine-grained comparison";
    }
    console.log(`  ${g.slug}/${g.provider}: range ${g.range.toFixed(2)}, stdev ${g.stdev.toFixed(2)} — ${verdict}`);
  }

  console.log("");
}
