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
