// ==============================
// Audit History Report
// ==============================
//
// Generates historical score trends for a trip
// Usage: npm run audit:history -- greece --provider opus --format text
//

import fs from "fs";
import path from "path";

// ==============================
// Collect History Data
// ==============================

function collectHistoryData(trip, provider) {
  const tripsPath = path.join("content/trips", trip);
  if (!fs.existsSync(tripsPath)) {
    throw new Error("Trip not found");
  }

  const allDates = new Set();
  const articles = {};

  // Scan all article audit folders
  for (const file of fs.readdirSync(tripsPath)) {
    if (!file.endsWith(".md")) continue;

    const articleName = file.replace(".md", "");
    const auditFolder = path.join(tripsPath, "audits", articleName);

    if (!fs.existsSync(auditFolder)) continue;

    // Read all audit files for this provider
    const auditFiles = fs.readdirSync(auditFolder)
      .filter(f => f.endsWith(`.${provider}.audit.json`));

    // Group by date, keep latest if multiple audits same day
    const byDate = {};
    for (const file of auditFiles) {
      const match = file.match(/^(\d{4}-\d{2}-\d{2})(?:-\d{4})?/);
      if (!match) continue;
      const date = match[1];

      if (!byDate[date] || file > byDate[date]) {
        byDate[date] = file;
      }
    }

    // Load scores
    articles[articleName] = {};
    for (const [date, file] of Object.entries(byDate)) {
      const data = JSON.parse(
        fs.readFileSync(path.join(auditFolder, file), "utf-8")
      );
      const score = data.overall_score;
      articles[articleName][date] = score;
      allDates.add(date);
    }
  }

  // Sort dates chronologically
  const dates = [...allDates].sort();

  // Compute trip average per date (using most recent audit for each article)
  const tripAverage = {};
  for (const date of dates) {
    const scores = [];

    // For each article, use its most recent audit on or before this date
    for (const article in articles) {
      let mostRecentScore = null;

      // Find most recent audit for this article on or before current date
      for (const auditDate of dates) {
        if (auditDate > date) break; // Don't look ahead
        if (articles[article][auditDate] != null) {
          mostRecentScore = articles[article][auditDate];
        }
      }

      if (mostRecentScore != null) {
        scores.push(mostRecentScore);
      }
    }

    if (scores.length > 0) {
      tripAverage[date] = scores.reduce((a, b) => a + b, 0) / scores.length;
    }
  }

  return { trip, provider, dates, articles, tripAverage };
}

// ==============================
// Output Formatters
// ==============================

function formatText(data) {
  const { trip, provider, dates, articles, tripAverage } = data;
  const providerLabel = provider === 'opus' ? 'Opus' : 'GPT';
  const tripLabel = trip.charAt(0).toUpperCase() + trip.slice(1);

  console.log(`\n${providerLabel} History — ${tripLabel}\n`);

  if (dates.length === 0) {
    console.log('No audit history found');
    return;
  }

  // Build header
  const articleNames = Object.keys(articles).sort();
  const colWidth = 12;
  const header = ['Date'.padEnd(colWidth), ...articleNames.map(n => n.substring(0, colWidth - 1).padEnd(colWidth)), 'Trip Avg'.padEnd(colWidth)];
  console.log(header.join(''));
  console.log('-'.repeat(header.join('').length));

  // Build rows
  for (const date of dates) {
    const row = [date.padEnd(colWidth)];

    for (const article of articleNames) {
      const score = articles[article][date];
      const scoreStr = score != null ? score.toFixed(2) : '-';
      row.push(scoreStr.padEnd(colWidth));
    }

    const avg = tripAverage[date];
    const avgStr = avg != null ? avg.toFixed(2) : '-';
    row.push(avgStr.padEnd(colWidth));

    console.log(row.join(''));
  }

  console.log();
}

function formatJSON(data) {
  console.log(JSON.stringify(data, null, 2));
}

function formatChart(data) {
  // Chart.js-compatible JSON format for dashboard embedding
  const { dates, articles, tripAverage } = data;

  const datasets = [];

  // Article datasets
  for (const [article, scores] of Object.entries(articles)) {
    const data = dates.map(date => scores[date] != null ? scores[date] : null);
    datasets.push({
      label: article,
      data,
      borderWidth: 1,
      fill: false
    });
  }

  // Trip average dataset
  const avgData = dates.map(date => tripAverage[date] != null ? tripAverage[date] : null);
  datasets.push({
    label: 'Trip Average',
    data: avgData,
    borderWidth: 3,
    borderDash: [5, 5],
    fill: false
  });

  console.log(JSON.stringify({
    labels: dates,
    datasets
  }, null, 2));
}

// ==============================
// CLI
// ==============================

const args = process.argv.slice(2);

if (args.length === 0 || args[0].startsWith('--')) {
  console.error('Usage: npm run audit:history -- <trip> [--provider opus|gpt] [--format text|json|chart]');
  process.exit(1);
}

const trip = args[0];
const providerIdx = args.indexOf("--provider");
const provider = providerIdx !== -1 ? args[providerIdx + 1] : "opus";
const formatIdx = args.indexOf("--format");
const format = formatIdx !== -1 ? args[formatIdx + 1] : "text";

const validProviders = ["opus", "gpt"];
if (!validProviders.includes(provider)) {
  console.error(`Invalid provider: ${provider}. Must be one of: ${validProviders.join(', ')}`);
  process.exit(1);
}

const validFormats = ["text", "json", "chart"];
if (!validFormats.includes(format)) {
  console.error(`Invalid format: ${format}. Must be one of: ${validFormats.join(', ')}`);
  process.exit(1);
}

try {
  const data = collectHistoryData(trip, provider);

  if (format === 'text') {
    formatText(data);
  } else if (format === 'json') {
    formatJSON(data);
  } else if (format === 'chart') {
    formatChart(data);
  }
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}

// Export for use by API server
export { collectHistoryData };
