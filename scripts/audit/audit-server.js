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
import { spawn, execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getTripStatus, getFileStatus, getMostRecentFile } from "./audit-status.js";
import { ARTICLE_THRESHOLD, TRIP_THRESHOLD, getTripAuditPath, AUDITS_DIR_NAME, getAuditPath, getContentFilePath, getTripPath } from "./audit-shared.js";
import { loadJsonFile as readJsonFile } from "../../lib/build-utilities.js";
import CONFIG from "../../lib/config-paths.js";
const CONTENT_TRIPS_PATH = CONFIG.TRIPS_DIR;

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
  const trips = fs.readdirSync(CONTENT_TRIPS_PATH)
    .filter(name => {
      const stat = fs.statSync(getTripPath(name));
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
    const auditDir = getAuditPath(trip, file);

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

    // Spawn history script and capture JSON output
    const result = execSync(
      `npm run audit:history -- ${trip} --provider ${provider} --format json`,
      { encoding: "utf-8", stdio: "pipe" }
    );

    const history = JSON.parse(result);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// collectHistoryData moved to scripts/audit/audit-history.js

// ============================================
// API: Get Trip Audit Scores
// ============================================

app.get("/api/trip-audit-scores/:trip/:provider", (req, res) => {
  try {
    const { trip, provider } = req.params;
    const tripAuditDir = getTripAuditPath(trip);

    if (!fs.existsSync(tripAuditDir)) {
      return res.status(404).json({ error: "No trip audits found" });
    }

    // Find most recent audit JSON for this provider
    const auditFiles = fs.readdirSync(tripAuditDir)
      .filter(f => f.endsWith(`.${provider}.audit.json`))
      .sort()
      .reverse();

    if (auditFiles.length === 0) {
      return res.status(404).json({ error: "No audit found for provider" });
    }

    const jsonPath = path.join(tripAuditDir, auditFiles[0]);
    const scores = readJsonFile(jsonPath);
    const mtime = fs.statSync(jsonPath).mtime;

    // Format timestamp
    const now = new Date();
    const diffMs = now - mtime;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    let lastModified;
    if (diffHours < 1) lastModified = 'Just now';
    else if (diffHours < 24) lastModified = `${diffHours}h ago`;
    else if (diffDays === 1) lastModified = 'Yesterday';
    else if (diffDays < 7) lastModified = `${diffDays} days ago`;
    else lastModified = mtime.toLocaleDateString();

    res.json({
      scores,
      lastModified,
      filename: auditFiles[0]
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// API: Run Trip Audit
// ============================================

app.post("/api/trip-audit", async (req, res) => {
  const { trip, provider } = req.body;

  if (!trip || !provider) {
    return res.status(400).json({ error: "Missing trip or provider" });
  }

  const validProviders = ["opus", "gpt"];
  if (!validProviders.includes(provider)) {
    return res.status(400).json({ error: "Invalid provider" });
  }

  res.json({ status: "running" });

  // Run trip audit in background
  setImmediate(() => {
    console.log(`[TRIP AUDIT] Running ${provider} trip audit on ${trip}...`);

    const childProcess = spawn("npm", ["run", "trip-audit", "--", trip, "--provider", provider], {
      stdio: "pipe",
      cwd: process.cwd(),
      env: process.env,
      shell: true
    });

    let stdout = '';
    let stderr = '';

    childProcess.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;

      // Try to parse as JSON progress messages
      const lines = output.split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line);
          if (msg.type === 'progress') {
            broadcast({ type: 'trip-audit-progress', trip, provider, ...msg });
          }
        } catch {
          // Not JSON, regular console output
        }
      }
    });

    childProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    childProcess.on("exit", (code, signal) => {
      if (signal === "SIGTERM" || signal === "SIGKILL") {
        console.log(`[TRIP AUDIT] Stopped ${provider} trip audit on ${trip}`);
        broadcast({
          type: "trip-audit-stopped",
          trip,
          provider
        });
      } else if (code === 0) {
        console.log(`[TRIP AUDIT] Completed ${provider} trip audit on ${trip}`);
        broadcast({
          type: "trip-audit-complete",
          trip,
          provider
        });
      } else {
        console.error(`[TRIP AUDIT] Failed ${provider} trip audit on ${trip} (exit code ${code})`);
        console.error(`[TRIP AUDIT] stderr: ${stderr}`);
        broadcast({
          type: "trip-audit-error",
          trip,
          provider,
          error: stderr || `Exit code ${code}`
        });
      }
    });
  });
});

// ============================================
// API: Commit File
// ============================================

app.post("/api/commit-file", async (req, res) => {
  const { trip, file, message } = req.body;

  // Validate inputs
  if (!trip || !file || !message) {
    return res.status(400).json({ error: "Missing trip, file, or message" });
  }

  try {
    // Check file exists
    const filePath = getContentFilePath(trip, file);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    console.log(`[COMMIT] Starting commit for ${trip}/${file}...`);

    // Spawn commit script and capture output
    const output = execSync(
      `npm run commit -- ${trip}/${file} --message "${message.replace(/"/g, '\\"')}"`,
      { encoding: "utf-8", stdio: "pipe" }
    );

    // Extract commit hash from output
    const hashMatch = output.match(/([a-f0-9]{7})/);
    const commitHash = hashMatch ? hashMatch[1] : null;

    console.log(`[COMMIT] Success! Commit hash: ${commitHash}`);

    res.json({
      success: true,
      commitHash,
      message: "Committed successfully"
    });

  } catch (err) {
    console.error(`[COMMIT] Failed: ${err.message}`);
    res.status(500).json({
      error: "Commit failed",
      details: err.message
    });
  }
});

// ============================================
// API: Push to Remote
// ============================================

app.post("/api/push", async (req, res) => {
  try {
    console.log(`[PUSH] Pushing to remote...`);

    execSync("git push", {
      encoding: "utf-8",
      stdio: "pipe"
    });

    console.log(`[PUSH] Success!`);

    res.json({
      success: true,
      message: "Pushed to remote"
    });

  } catch (err) {
    console.error(`[PUSH] Failed: ${err.message}`);
    res.status(500).json({
      error: "Push failed",
      details: err.message
    });
  }
});

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
