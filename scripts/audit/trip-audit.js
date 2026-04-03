// ==============================
// Two Travel Nuts — Trip-Level Coherence Audit
// ==============================
//
// Evaluates entire trip for coherence (overlaps, gaps, style, flow)
// Invoked via: npm run trip-audit -- greece

import fs from "fs";
import path from "path";
import runTripAuditAPI from "./trip-audit-api.js";
import { getPreviousTripAudit, computeTripDeltas, formatTime, formatPrevTimestamp, loadTripConfig, getTripAuditPath, getTripPath, validateProvider } from "./audit-shared.js";
import CONFIG from "../../lib/config-paths.js";

// ==============================
// Change Detection
// ==============================

function tripNeedsAudit(tripSlug, provider, force = false) {
  if (force) return true;

  const tripAuditDir = getTripAuditPath(tripSlug);
  const tripDir = getTripPath(tripSlug);

  if (!fs.existsSync(tripAuditDir)) return true;

  // Find most recent trip audit for this provider
  const auditFiles = fs.readdirSync(tripAuditDir)
    .filter(f => f.endsWith(`.${provider}.audit.json`))
    .sort()
    .reverse();

  if (auditFiles.length === 0) return true;

  const latestAudit = path.join(tripAuditDir, auditFiles[0]);
  const auditTime = fs.statSync(latestAudit).mtime;

  // Check if overview.md changed
  const overviewPath = CONFIG.getTripOverviewPath(tripSlug);
  if (fs.existsSync(overviewPath) && fs.statSync(overviewPath).mtime > auditTime) {
    return true;
  }

  // Check if any content article changed
  const tripConfig = loadTripConfig(tripSlug);
  for (const item of tripConfig.content) {
    const filepath = path.join(tripDir, item.file);
    if (fs.existsSync(filepath) && fs.statSync(filepath).mtime > auditTime) {
      return true;
    }
  }

  return false;
}

// ==============================
// CLI
// ==============================

const args = process.argv.slice(2);
const providerIdx = args.indexOf("--provider");
const provider = providerIdx !== -1 ? args[providerIdx + 1] : "opus";
const forceIdx = args.indexOf("--force");
const force = forceIdx !== -1;

// Remove flags from args
const tripArgs = args.filter((arg, i) =>
  arg !== "--provider" &&
  arg !== "--force" &&
  !(providerIdx !== -1 && i === providerIdx + 1) // Skip provider value only if --provider flag exists
);

if (tripArgs.length === 0) {
  console.log("Usage: npm run trip-audit -- greece");
  console.log("       npm run trip-audit -- greece --provider gpt");
  console.log("       npm run trip-audit -- greece --force");
  process.exit(1);
}

try {
  validateProvider(provider);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

const tripSlug = tripArgs[0];

// Check if audit is needed
if (!tripNeedsAudit(tripSlug, provider, force)) {
  console.log(`Trip audit for ${tripSlug} (${provider}) is current. Use --force to re-audit.`);
  process.exit(0);
}

try {
  console.log(`\nRunning ${provider} trip audit on ${tripSlug}...`);

  // Load previous audit for comparison
  const prev = getPreviousTripAudit(tripSlug, provider);

  // Run audit
  const { scores, jsonPath, mdPath } = await runTripAuditAPI(tripSlug, provider);

  // Print results
  const baseline = prev ? `, comparing to ${formatPrevTimestamp(prev._mtime)}` : "";
  console.log(`\nAudit complete: ${tripSlug} (${provider})${baseline}`);
  console.log(`Overall Score: ${scores.overall_score}`);

  // Print deltas
  if (prev) {
    const deltas = computeTripDeltas(scores, prev);
    if (deltas) {
      console.log("");
      for (const d of deltas) {
        console.log(`  ${d.text}`);
      }
    }
  } else {
    console.log("  (no previous audit to compare)");
  }

  console.log(`\nSaved to: ${path.resolve(jsonPath)}`);
  console.log(`          ${path.resolve(mdPath)}\n`);

} catch (err) {
  console.error(`\nTrip audit failed: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
}
