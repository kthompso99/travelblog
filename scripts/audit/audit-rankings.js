// ==============================
// Audit Rankings Report
// ==============================
//
// Generates rankings for a trip by provider score
// Usage: npm run audit:rank -- greece --provider opus --format text
//

import { getTripStatus } from "./audit-status.js";
import { ARTICLE_THRESHOLD, TRIP_THRESHOLD, validateProvider, getProviderLabel } from "./audit-shared.js";

// ==============================
// Generate Rankings
// ==============================

function generateRankings(trip, provider, format = 'text') {
  const status = getTripStatus(trip);

  // Extract and sort by provider score
  const rankings = status.files
    .filter(f => f.providers[provider]?.hasAudit)
    .map(f => ({
      file: f.file,
      score: f.providers[provider].overall
    }))
    .sort((a, b) => b.score - a.score); // Descending

  // Calculate metrics
  const average = rankings.length > 0
    ? rankings.reduce((sum, r) => sum + r.score, 0) / rankings.length
    : 0;

  const lowestScore = rankings.length > 0
    ? Math.min(...rankings.map(r => r.score))
    : 0;

  const tripReady = average >= TRIP_THRESHOLD && lowestScore >= ARTICLE_THRESHOLD;

  return {
    trip,
    provider,
    rankings,
    average,
    lowestScore,
    tripReady,
    articleThreshold: ARTICLE_THRESHOLD,
    tripThreshold: TRIP_THRESHOLD
  };
}

// ==============================
// Output Formatters
// ==============================

function formatText(data) {
  const { trip, provider, rankings, average, tripReady, articleThreshold, tripThreshold } = data;

  const providerLabel = getProviderLabel(provider);
  const tripLabel = trip.charAt(0).toUpperCase() + trip.slice(1);
  const readiness = tripReady ? 'READY' : 'NOT READY';

  console.log(`\n${providerLabel} Rankings — ${tripLabel}  •  Avg: ${average.toFixed(2)}  •  ${readiness}\n`);

  if (rankings.length === 0) {
    console.log('No audits found');
    return;
  }

  console.log('Rank  File                Score');
  console.log('----  ------------------  -----');

  for (let i = 0; i < rankings.length; i++) {
    const rank = `#${i + 1}`.padEnd(6);
    const file = rankings[i].file.padEnd(20);
    const score = rankings[i].score.toFixed(2);
    const publishable = rankings[i].score >= articleThreshold ? '✓' : ' ';
    console.log(`${rank}${file}${score} ${publishable}`);
  }

  console.log();
  console.log(`Article threshold: ${articleThreshold.toFixed(2)}`);
  console.log(`Trip threshold: ${tripThreshold.toFixed(2)}`);
  console.log();
}

function formatJSON(data) {
  console.log(JSON.stringify(data, null, 2));
}

// ==============================
// CLI
// ==============================

const args = process.argv.slice(2);

if (args.length === 0 || args[0].startsWith('--')) {
  console.error('Usage: npm run audit:rank -- <trip> [--provider opus|gpt] [--format text|json]');
  process.exit(1);
}

const trip = args[0];
const providerIdx = args.indexOf("--provider");
const provider = providerIdx !== -1 ? args[providerIdx + 1] : "opus";
const formatIdx = args.indexOf("--format");
const format = formatIdx !== -1 ? args[formatIdx + 1] : "text";

try {
  validateProvider(provider);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

const validFormats = ["text", "json"];
if (!validFormats.includes(format)) {
  console.error(`Invalid format: ${format}. Must be one of: ${validFormats.join(', ')}`);
  process.exit(1);
}

try {
  const data = generateRankings(trip, provider, format);

  if (format === 'text') {
    formatText(data);
  } else if (format === 'json') {
    formatJSON(data);
  }
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}

// Export for use by API server
export { generateRankings };
