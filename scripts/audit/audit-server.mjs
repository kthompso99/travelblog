#!/usr/bin/env node

// ============================================
// Audit Dashboard Server
// ============================================
//
// Express server with WebSocket for live audit updates
// Serves dashboard UI and provides audit status API
//

import express from "express";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getTripStatus, getFileStatus, getMostRecentFile } from "./audit-status.mjs";
import { ARTICLE_THRESHOLD, TRIP_THRESHOLD } from "./audit-shared.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = 3001;

// ============================================
// Track Running Audits
// ============================================

const runningAudits = new Map(); // key: "provider-trip-file", value: childProcess

// ============================================
// Middleware
// ============================================

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ============================================
// WebSocket Connection Handling
// ============================================

const clients = new Set();

wss.on("connection", (ws) => {
  clients.add(ws);
  console.log(`[WS] Client connected (${clients.size} total)`);

  ws.on("close", () => {
    clients.delete(ws);
    console.log(`[WS] Client disconnected (${clients.size} remaining)`);
  });
});

function broadcast(message) {
  const payload = JSON.stringify(message);
  clients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      client.send(payload);
    }
  });
}

// ============================================
// API: Get Configuration
// ============================================

app.get("/api/config", (req, res) => {
  res.json({
    articleThreshold: ARTICLE_THRESHOLD,
    tripThreshold: TRIP_THRESHOLD
  });
});

// ============================================
// API: Get Available Trips
// ============================================

app.get("/api/trips", (req, res) => {
  const tripsPath = "content/trips";
  const trips = fs.readdirSync(tripsPath)
    .filter(name => {
      const stat = fs.statSync(path.join(tripsPath, name));
      return stat.isDirectory();
    })
    .map(name => ({ name, label: name.charAt(0).toUpperCase() + name.slice(1) }));

  res.json({ trips });
});

// ============================================
// API: Get Trip Status
// ============================================

app.get("/api/status/:trip", (req, res) => {
  try {
    const { trip } = req.params;
    const status = getTripStatus(trip);
    const recentFile = getMostRecentFile(trip);

    res.json({
      ...status,
      recentFile
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// API: Get File Status
// ============================================

app.get("/api/status/:trip/:file", (req, res) => {
  try {
    const { trip, file } = req.params;
    const status = getFileStatus(trip, file);
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// API: Get Audit Markdown
// ============================================

app.get("/api/audit/:trip/:file/:provider.md", (req, res) => {
  try {
    const { trip, file, provider } = req.params;
    const auditDir = path.join("content/trips", trip, "audits", file);

    if (!fs.existsSync(auditDir)) {
      return res.status(404).json({ error: "No audits found" });
    }

    const files = fs.readdirSync(auditDir)
      .filter(f => f.endsWith(`.${provider}.audit.md`))
      .sort()
      .reverse();

    if (files.length === 0) {
      return res.status(404).json({ error: "No audit found for provider" });
    }

    const mdPath = path.join(auditDir, files[0]);
    const content = fs.readFileSync(mdPath, "utf-8");

    res.setHeader("Content-Type", "text/markdown");
    res.send(content);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// API: Run Audit
// ============================================

app.post("/api/run-audit", async (req, res) => {
  const { trip, file, provider } = req.body;

  if (!trip || !file || !provider) {
    return res.status(400).json({ error: "Missing trip, file, or provider" });
  }

  const validProviders = ["opus", "gpt"];
  if (!validProviders.includes(provider)) {
    return res.status(400).json({ error: "Invalid provider" });
  }

  const auditKey = `${provider}-${trip}-${file}`;

  // Check if already running
  if (runningAudits.has(auditKey)) {
    return res.status(409).json({ error: "Audit already running" });
  }

  res.json({ status: "running" });

  // Run audit in background
  setImmediate(() => {
    console.log(`[AUDIT] Running ${provider} audit on ${trip}/${file}...`);

    const scriptMap = {
      opus: "opus-audit",
      gpt: "gpt-audit"
    };

    const childProcess = spawn("npm", ["run", scriptMap[provider], "--", `${trip}/${file}`], {
      stdio: "inherit",
      cwd: process.cwd(),
      env: process.env,
      shell: true
    });

    runningAudits.set(auditKey, childProcess);

    childProcess.on("exit", (code, signal) => {
      runningAudits.delete(auditKey);

      if (signal === "SIGTERM" || signal === "SIGKILL") {
        console.log(`[AUDIT] Stopped ${provider} audit on ${trip}/${file}`);
        broadcast({
          type: "audit-stopped",
          trip,
          file,
          provider
        });
      } else if (code === 0) {
        console.log(`[AUDIT] Completed ${provider} audit on ${trip}/${file}`);
        broadcast({
          type: "audit-complete",
          trip,
          file,
          provider
        });
      } else {
        console.error(`[AUDIT] Failed ${provider} audit on ${trip}/${file} (exit code ${code})`);
        broadcast({
          type: "audit-error",
          trip,
          file,
          provider,
          error: `Process exited with code ${code}`
        });
      }
    });

    childProcess.on("error", (err) => {
      runningAudits.delete(auditKey);
      console.error(`[AUDIT] Error: ${err.message}`);
      broadcast({
        type: "audit-error",
        trip,
        file,
        provider,
        error: err.message
      });
    });
  });
});

// ============================================
// API: Stop Running Audit
// ============================================

app.post("/api/stop-audit", (req, res) => {
  const { trip, file, provider } = req.body;

  if (!trip || !file || !provider) {
    return res.status(400).json({ error: "Missing trip, file, or provider" });
  }

  const auditKey = `${provider}-${trip}-${file}`;
  const childProcess = runningAudits.get(auditKey);

  if (!childProcess) {
    return res.status(404).json({ error: "No running audit found" });
  }

  console.log(`[AUDIT] Stopping ${provider} audit on ${trip}/${file}...`);
  childProcess.kill("SIGTERM");

  res.json({ status: "stopping" });
});

// ============================================
// API: Get History Data
// ============================================

app.get("/api/history/:trip/:provider", (req, res) => {
  try {
    const { trip, provider } = req.params;

    const validProviders = ["opus", "gpt"];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({ error: "Invalid provider" });
    }

    const history = collectHistoryData(trip, provider);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

// ============================================
// Serve Audit Runner HTML
// ============================================

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "audit-runner.html"));
});

app.get("/:trip", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "audit-runner.html"));
});

// ============================================
// Start Server
// ============================================

server.listen(PORT, () => {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  🚀 Audit Dashboard Server`);
  console.log(`${"=".repeat(60)}`);
  console.log(`\n  📍 Server running at: http://localhost:${PORT}`);
  console.log(`  🌐 Visit: http://localhost:${PORT}/greece`);
  console.log(`\n  Press Ctrl+C to stop\n`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\n  Shutting down server...");
  server.close(() => {
    console.log("  Server stopped.\n");
    process.exit(0);
  });
});
