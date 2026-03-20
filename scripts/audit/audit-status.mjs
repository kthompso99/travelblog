// ============================================
// Audit Status Utility - Dashboard Backend
// ============================================
//
// Provides functions to:
// - Get audit status for all files in a trip
// - Compute score deltas between audits
// - Detect lines changed since last audit
//

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { WEIGHTS } from "./audit-shared.mjs";

const PROVIDERS = ["opus", "gpt"];
const DIMENSION_LABELS = {
  prose_control_structure: "Prose Control",
  narrative_clarity_arc: "Narrative Clarity",
  opening_strength: "Opening Strength",
  brand_alignment: "Brand Alignment",
  distinctiveness: "Distinctiveness",
  decision_clarity: "Decision Clarity"
};

// ============================================
// Get All Files in Trip
// ============================================

function getTripFiles(tripName) {
  const tripPath = path.join("content/trips", tripName);
  if (!fs.existsSync(tripPath)) return [];

  return fs.readdirSync(tripPath)
    .filter(f => f.endsWith(".md") && f !== "overview.md")
    .map(f => f.replace(".md", ""))
    .sort();
}

// ============================================
// Get Latest Audit for Provider
// ============================================

function getLatestAudit(tripName, fileName, provider) {
  const auditDir = path.join("content/trips", tripName, "audits", fileName);
  if (!fs.existsSync(auditDir)) return null;

  const files = fs.readdirSync(auditDir)
    .filter(f => f.endsWith(`.${provider}.audit.json`))
    .sort()
    .reverse();

  if (files.length === 0) return null;

  const jsonPath = path.join(auditDir, files[0]);
  const mdPath = jsonPath.replace(".json", ".md");

  const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  const fileStat = fs.statSync(jsonPath);

  return {
    jsonPath,
    mdPath,
    timestamp: fileStat.mtime,
    scores: data,
    overall: data.overall_score
  };
}

// ============================================
// Get Previous Audit (for Delta)
// ============================================

function getPreviousAudit(tripName, fileName, provider) {
  const auditDir = path.join("content/trips", tripName, "audits", fileName);
  if (!fs.existsSync(auditDir)) return null;

  const files = fs.readdirSync(auditDir)
    .filter(f => f.endsWith(`.${provider}.audit.json`))
    .sort()
    .reverse();

  if (files.length < 2) return null;

  const jsonPath = path.join(auditDir, files[1]);
  return JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
}

// ============================================
// Compute Score Deltas
// ============================================

function computeDeltas(current, previous) {
  if (!previous) return null;

  const deltas = [];
  const dimensions = Object.keys(DIMENSION_LABELS);

  for (const dim of dimensions) {
    const curr = current[dim];
    const prev = previous[dim];

    if (curr == null || prev == null) continue;

    const delta = curr - prev;
    const flag = delta < 0 ? " *** Downgrade" : "";

    deltas.push({
      dimension: DIMENSION_LABELS[dim],
      prev: prev.toFixed(1),
      curr: curr.toFixed(1),
      delta: (delta >= 0 ? "+" : "") + delta.toFixed(1),
      downgrade: delta < 0,
      text: `${DIMENSION_LABELS[dim].padEnd(20)} ${prev.toFixed(1)} => ${curr.toFixed(1)}  ${(delta >= 0 ? "+" : "")}${delta.toFixed(1)}${flag}`
    });
  }

  // Overall score
  if (current.overall_score != null && previous.overall_score != null) {
    const delta = current.overall_score - previous.overall_score;
    deltas.push({
      dimension: "Overall",
      prev: previous.overall_score.toFixed(2),
      curr: current.overall_score.toFixed(2),
      delta: (delta >= 0 ? "+" : "") + delta.toFixed(2),
      downgrade: delta < 0,
      text: `${"Overall".padEnd(20)} ${previous.overall_score.toFixed(2)} => ${current.overall_score.toFixed(2)}  ${(delta >= 0 ? "+" : "")}${delta.toFixed(2)}${delta < 0 ? " *** Downgrade" : ""}`
    });
  }

  return deltas;
}

// ============================================
// Detect Lines Changed Since Last Audit
// ============================================

function getLinesChanged(tripName, fileName, auditTimestamp) {
  try {
    const filePath = path.join("content/trips", tripName, `${fileName}.md`);

    // Count uncommitted lines changed since HEAD (most recent commit)
    const diffCmd = `git diff HEAD -- "${filePath}" | grep -E "^[+-]" | grep -v "^[+-]{3}" | wc -l`;
    const lines = parseInt(execSync(diffCmd, { encoding: "utf-8" }).trim(), 10);

    return lines || null;
  } catch (err) {
    return null;
  }
}

// ============================================
// Get Last Modified Time (Friendly Format)
// ============================================

function getLastModifiedTime(timestamp) {
  const auditDate = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const now = new Date();
  const diffMs = now - auditDate;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return auditDate.toLocaleDateString();
}

// ============================================
// Get Status for Single File
// ============================================

export function getFileStatus(tripName, fileName) {
  const status = {
    file: fileName,
    providers: {}
  };

  for (const provider of PROVIDERS) {
    const latest = getLatestAudit(tripName, fileName, provider);
    if (!latest) {
      status.providers[provider] = {
        hasAudit: false
      };
      continue;
    }

    const previous = getPreviousAudit(tripName, fileName, provider);
    const deltas = computeDeltas(latest.scores, previous);
    const linesChanged = getLinesChanged(tripName, fileName, latest.timestamp);
    const lastModified = getLastModifiedTime(latest.timestamp);

    status.providers[provider] = {
      hasAudit: true,
      timestamp: latest.timestamp,
      lastModified,
      overall: latest.overall,
      scores: latest.scores,
      deltas,
      linesChanged,
      mdPath: latest.mdPath
    };
  }

  return status;
}

// ============================================
// Get Status for Entire Trip
// ============================================

export function getTripStatus(tripName) {
  const files = getTripFiles(tripName);

  return {
    trip: tripName,
    files: files.map(fileName => getFileStatus(tripName, fileName))
  };
}

// ============================================
// Get Most Recently Modified File
// ============================================

export function getMostRecentFile(tripName) {
  const tripPath = path.join("content/trips", tripName);
  if (!fs.existsSync(tripPath)) return null;

  const files = fs.readdirSync(tripPath)
    .filter(f => f.endsWith(".md") && f !== "overview.md")
    .map(f => ({
      name: f.replace(".md", ""),
      mtime: fs.statSync(path.join(tripPath, f)).mtime
    }))
    .sort((a, b) => b.mtime - a.mtime);

  return files.length > 0 ? files[0].name : null;
}
