// ==============================
// Two Travel Nuts — Shared Audit Helpers
// ==============================

import fs from "fs";
import path from "path";

// ==============================
// 🔧 Configuration
// ==============================

export const WEIGHTS = {
  prose_control_structure: 0.25,
  narrative_clarity_arc: 0.25,
  opening_strength: 0.15,
  brand_alignment: 0.15,
  distinctiveness: 0.10,
  decision_clarity: 0.10
};

// Readiness thresholds (shared with dashboard.mjs)
export const ARTICLE_THRESHOLD = 8.5;
export const TRIP_THRESHOLD = 8.7;

// Get local date in YYYY-MM-DD format (not UTC)
function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get local datetime with timestamp for unique audit filenames
function getLocalDateTimeString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}-${hour}${minute}`;
}

const GALLERY_MARKER = "*Add your photos here*";

// ==============================
// 🗂️ Content Type Detection
// ==============================

export function getContentType(filepath) {
  const dir = path.dirname(filepath);
  const filename = path.basename(filepath);
  const tripJsonPath = path.join(dir, "trip.json");

  if (!fs.existsSync(tripJsonPath)) return "location";

  const trip = JSON.parse(fs.readFileSync(tripJsonPath, "utf-8"));
  const entry = trip.content?.find(c => c.file === filename);

  return entry?.type === "article" ? "article" : "location";
}

// ==============================
// 🔑 Key Normalization
// ==============================

const KEY_ALIASES = {
  prose_control_structure: ["prosecontrolstructure", "prosecontrol", "prose"],
  narrative_clarity_arc: ["narrativeclarityarc", "narrativeclarity", "narrative"],
  opening_strength: ["openingstrength", "opening"],
  brand_alignment: ["brandalignment", "brand"],
  distinctiveness: ["distinctiveness", "distinct", "branddistinctiveness"],
  decision_clarity: ["decisionclarity", "decision"]
};

function normalizeScoreKeys(rawScores) {
  const normalized = {};
  for (const [rawKey, value] of Object.entries(rawScores)) {
    const stripped = rawKey.toLowerCase().replace(/[^a-z]/g, "");
    let matched = false;
    for (const [canonical, aliases] of Object.entries(KEY_ALIASES)) {
      if (stripped === canonical.replace(/_/g, "") || aliases.includes(stripped)) {
        normalized[canonical] = value;
        matched = true;
        break;
      }
    }
    if (!matched) {
      normalized[rawKey] = value;
    }
  }
  return normalized;
}

// ==============================
// 🧮 Weighted Score Calculator
// ==============================

export function computeWeightedScore(scores, contentType) {
  let total = 0;
  let activeWeight = 0;

  for (const key in WEIGHTS) {
    if (contentType === "article" && key === "decision_clarity") continue;
    if (typeof scores[key] !== "number") {
      const received = Object.keys(scores).join(", ");
      throw new Error(
        `Missing score for dimension: ${key}\nReceived keys: ${received}`
      );
    }
    total += scores[key] * WEIGHTS[key];
    activeWeight += WEIGHTS[key];
  }

  return Number((total / activeWeight).toFixed(2));
}

// ==============================
// 📂 Read & Prep Content
// ==============================

export function readArticleContent(filepath) {
  let content = fs.readFileSync(filepath, "utf-8");
  const galleryIdx = content.indexOf(GALLERY_MARKER);
  if (galleryIdx !== -1) {
    content = content.slice(0, galleryIdx).trim();
  }
  return content;
}

// ==============================
// 📂 Load Prompt Files
// ==============================

const scriptDir = path.dirname(new URL(import.meta.url).pathname);

export const ENFORCEMENT_MANDATE = fs.readFileSync(
  path.join(scriptDir, "ai-audit-mandate.txt"),
  "utf-8"
);

export const SYSTEM_PROMPT = fs.readFileSync(
  path.join(scriptDir, "ai-audit-prompt.txt"),
  "utf-8"
);

export function loadContextDocs() {
  const editorialStandards = fs.readFileSync(
    "docs/Content/Editorial-Standards.md", "utf-8"
  );
  const brandIdentity = fs.readFileSync(
    "docs/Content/Brand.md", "utf-8"
  );
  const antiAIGuidelines = fs.readFileSync(
    "docs/Content/AntiAIWritingGuidelines.md", "utf-8"
  );
  return { editorialStandards, brandIdentity, antiAIGuidelines };
}

// ==============================
// 🧠 Parse Audit Response
// ==============================

export function parseAuditResponse(output, contentType) {
  let jsonString;
  const fencedMatch = output.match(/```json\s*([\s\S]*?)\s*```/);

  if (fencedMatch) {
    jsonString = fencedMatch[1];
  } else {
    const firstBrace = output.indexOf("{");
    const lastBrace = output.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new Error("Could not locate valid JSON object in model output.");
    }

    jsonString = output.slice(firstBrace, lastBrace + 1);
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    console.error("Failed to parse JSON:\n", jsonString);
    throw err;
  }

  if (!parsed.scores) {
    throw new Error("Parsed JSON does not contain 'scores' object.");
  }

  const scores = normalizeScoreKeys(parsed.scores);
  scores.overall_score = computeWeightedScore(scores, contentType);

  const markdownStart = output.indexOf(jsonString) + jsonString.length;
  let markdown = output.slice(markdownStart).trim();

  markdown = markdown
    .replace(/^```[\w]*\s*\n?/, "")
    .replace(/\n?```\s*$/, "")
    .replace(/^#{0,3}\s*PART 2\s*[—–-]\s*MARKDOWN ANALYSIS:?\s*\n*/i, "")
    .trim();

  return { scores, markdown };
}

// ==============================
// 💾 Save Audit Results
// ==============================

export function getPreviousAudit(auditFolder, provider) {
  if (!fs.existsSync(auditFolder)) return null;

  const files = fs
    .readdirSync(auditFolder)
    .filter(f => f.endsWith(`.${provider}.audit.json`))
    .sort();

  if (files.length === 0) return null;

  const latestFile = files[files.length - 1];
  const fullPath = path.join(auditFolder, latestFile);
  const data = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
  const mtime = fs.statSync(fullPath).mtime;
  data._mtime = mtime;
  return data;
}

function formatTime(date) {
  return date
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .toLowerCase();
}

function formatPrevTimestamp(mtime) {
  const now = new Date();
  const isToday = mtime.toDateString() === now.toDateString();

  const timeStr = formatTime(mtime);

  if (isToday) return `run at ${timeStr} today`;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (mtime.toDateString() === yesterday.toDateString()) {
    return `run at ${timeStr} yesterday`;
  }

  const dateStr = mtime.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `run at ${timeStr} on ${dateStr}`;
}

export const DIMENSION_LABELS = {
  prose_control_structure: "Prose Control",
  narrative_clarity_arc:   "Narrative Clarity",
  opening_strength:        "Opening Strength",
  brand_alignment:         "Brand Alignment",
  distinctiveness:         "Distinctiveness",
  decision_clarity:        "Decision Clarity"
};

// Compute deltas between two audit scores (returns structured data)
export function computeDeltas(current, previous) {
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

function printComparison(prev, curr) {
  const deltas = computeDeltas(curr, prev);
  if (!deltas) return;

  console.log("");
  for (const d of deltas) {
    console.log(`  ${d.text}`);
  }
}

export function saveAuditResults(filepath, scores, markdown, provider, auditDirName = "audits") {
  const timestamp = getLocalDateTimeString();
  const today = getLocalDateString();
  const articleName = path.basename(filepath, ".md");
  const auditFolder = path.join(path.dirname(filepath), auditDirName, articleName);
  fs.mkdirSync(auditFolder, { recursive: true });

  const jsonFilename = `${timestamp}.${provider}.audit.json`;
  const jsonPath = path.join(auditFolder, jsonFilename);
  const mdPath = path.join(auditFolder, `${timestamp}.${provider}.audit.md`);

  // Load previous audit before overwriting
  const prev = getPreviousAudit(auditFolder, provider);

  const timeStr = formatTime(new Date());

  const prettyName =
    articleName.charAt(0).toUpperCase() + articleName.slice(1);
  const auditTitle = `# ${prettyName} Audit (${provider}) — ${today} ${timeStr}`;

  fs.writeFileSync(jsonPath, JSON.stringify(scores, null, 2));
  fs.writeFileSync(mdPath, `${auditTitle}\n\n${markdown}`);

  const baseline = prev ? `, comparing to ${formatPrevTimestamp(prev._mtime)}` : "";
  console.log(`\nAudit complete: ${articleName} (${provider})${baseline}`);
  console.log(`Overall Score: ${scores.overall_score}`);

  if (prev) {
    printComparison(prev, scores);
  } else {
    console.log("  (no previous audit to compare)");
  }
  console.log("");
  return mdPath;
}

// ==============================
// Incremental Check
// ==============================

export function needsAudit(filepath, provider) {
  const articleName = path.basename(filepath, ".md");
  const auditFolder = path.join(path.dirname(filepath), "audits", articleName);

  if (!fs.existsSync(auditFolder)) return true;

  const suffix = `.${provider}.audit.md`;
  const audits = fs
    .readdirSync(auditFolder)
    .filter(f => f.endsWith(suffix));

  if (audits.length === 0) return true;

  const latestAuditMtime = Math.max(
    ...audits.map(f =>
      fs.statSync(path.join(auditFolder, f)).mtimeMs
    )
  );

  return fs.statSync(filepath).mtimeMs > latestAuditMtime;
}

// ==============================
// CLI File Resolution
// ==============================

export function resolveFiles(args, provider) {
  const files = [];

  for (const arg of args) {
    let resolved = arg;
    if (!resolved.startsWith("content/"))
      resolved = `content/trips/${resolved}`;

    if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
      const mds = fs
        .readdirSync(resolved)
        .filter(f => f.endsWith(".md"))
        .map(f => path.join(resolved, f));

      for (const md of mds) {
        if (needsAudit(md, provider)) {
          files.push(md);
        } else {
          console.log(
            `Skipping ${path.basename(md, ".md")} (${provider} audit is current)`
          );
        }
      }
    } else {
      if (!resolved.endsWith(".md")) resolved += ".md";
      files.push(resolved);
    }
  }

  return files;
}
