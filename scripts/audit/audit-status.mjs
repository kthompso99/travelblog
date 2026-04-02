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
import { WEIGHTS, DIMENSION_LABELS, computeDeltas, getAuditByIndex, getTripMdFiles, getAuditPath } from "./audit-shared.mjs";

const PROVIDERS = ["opus", "gpt"];

// ============================================
// Get Latest Audit for Provider
// ============================================

function getLatestAudit(tripName, fileName, provider) {
  const auditDir = getAuditPath(tripName, fileName);
  const result = getAuditByIndex(auditDir, provider, 0);
  if (!result) return null;

  return {
    jsonPath: result.fullPath,
    mdPath: result.fullPath.replace(".json", ".md"),
    timestamp: result.mtime,
    scores: result.data,
    overall: result.data.overall_score
  };
}

// ============================================
// Get Previous Audit (for Delta)
// ============================================

function getPreviousAudit(tripName, fileName, provider) {
  const auditDir = getAuditPath(tripName, fileName);
  const result = getAuditByIndex(auditDir, provider, 1);
  return result ? result.data : null;
}

// ============================================
// Get Previous Score from Git Commit History
// ============================================

function getPreviousScoreFromGit(tripName, fileName) {
  try {
    const filePath = path.join('content/trips', tripName, `${fileName}.md`);
    const lastMessage = execSync(
      `git log -1 --format=%s -- "${filePath}"`,
      { encoding: 'utf-8' }
    ).trim();

    // Parse for Content(fileName) patterns
    const patterns = [
      /Content\([^)]+\)\s+from\s+([\d.]+)\s+to\s+([\d.]+)/,  // "Content(X) from Y to Z" → use Z
      /Content\([^)]+\)\s+up to\s+([\d.]+)/,                  // "Content(X) up to Y" → use Y
      /Content\([^)]+\)\s+at\s+([\d.]+)/                      // "Content(X) at Y" → use Y
    ];

    for (const pattern of patterns) {
      const match = lastMessage.match(pattern);
      if (match) {
        return parseFloat(match[match.length - 1]);
      }
    }

    return null; // No Content() commit found
  } catch (err) {
    return null; // Git command failed (file never committed, etc.)
  }
}

// ============================================
// Detect Lines Changed Since Last Commit
// ============================================

function getLinesChanged(tripName, fileName, auditTimestamp) {
  try {
    const filePath = path.join("content/trips", tripName, `${fileName}.md`);

    // Get insertions and deletions using --numstat
    const diffOutput = execSync(
      `git diff HEAD --numstat -- "${filePath}"`,
      { encoding: "utf-8" }
    ).trim();

    if (!diffOutput) return null;

    // Parse numstat output: "additions\tdeletions\tfilename"
    const [additions, deletions] = diffOutput.split('\t').map(n => parseInt(n, 10));

    // Return formatted string like "+2 -1" or just the number if only one type
    if (additions > 0 && deletions > 0) {
      return `+${additions} -${deletions}`;
    } else if (additions > 0) {
      return `+${additions}`;
    } else if (deletions > 0) {
      return `-${deletions}`;
    }

    return null;
  } catch (err) {
    return null;
  }
}

// ============================================
// Get Last Commit Time for File
// ============================================

function getLastCommitTime(tripName, fileName) {
  try {
    const filePath = path.join("content/trips", tripName, `${fileName}.md`);
    const cmd = `git log -1 --format=%ct -- "${filePath}"`;
    const timestamp = parseInt(execSync(cmd, { encoding: "utf-8" }).trim(), 10);
    return timestamp ? new Date(timestamp * 1000) : null;
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
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
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

  // Get previous score once (same for all providers)
  const prevScore = getPreviousScoreFromGit(tripName, fileName);

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
    const lastCommitTime = getLastCommitTime(tripName, fileName);
    const lastCommitFormatted = lastCommitTime ? getLastModifiedTime(lastCommitTime) : null;

    status.providers[provider] = {
      hasAudit: true,
      timestamp: latest.timestamp,
      lastModified,
      overall: latest.overall,
      scores: latest.scores,
      deltas,
      prevScore,
      linesChanged,
      lastCommitTime: lastCommitTime ? lastCommitTime.toISOString() : null,
      lastCommitFormatted,
      mdPath: latest.mdPath
    };
  }

  return status;
}

// ============================================
// Get Status for Entire Trip
// ============================================

export function getTripStatus(tripName) {
  const files = getTripMdFiles(tripName);

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
