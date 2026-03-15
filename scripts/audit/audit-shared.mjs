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
  distinctiveness: ["distinctiveness", "distinct"],
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
  path.join(scriptDir, "gpt-audit-mandate.txt"),
  "utf-8"
);

export const SYSTEM_PROMPT = fs.readFileSync(
  path.join(scriptDir, "gpt-audit-prompt.txt"),
  "utf-8"
);

export function loadContextDocs() {
  const editorialStandards = fs.readFileSync(
    "docs/Content/Editorial-Standards.md", "utf-8"
  );
  const brandIdentity = fs.readFileSync(
    "docs/Content/Brand.md", "utf-8"
  );
  return { editorialStandards, brandIdentity };
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

function getPreviousAudit(auditFolder, provider) {
  if (!fs.existsSync(auditFolder)) return null;

  const files = fs
    .readdirSync(auditFolder)
    .filter(f => f.endsWith(`.${provider}.audit.json`))
    .sort();

  if (files.length === 0) return null;

  const latestFile = files[files.length - 1];
  return JSON.parse(fs.readFileSync(path.join(auditFolder, latestFile), "utf-8"));
}

const DIMENSION_LABELS = {
  prose_control_structure: "Prose Control",
  narrative_clarity_arc:   "Narrative Clarity",
  opening_strength:        "Opening Strength",
  brand_alignment:         "Brand Alignment",
  distinctiveness:         "Distinctiveness",
  decision_clarity:        "Decision Clarity"
};

function printComparison(prev, curr) {
  const dims = Object.keys(WEIGHTS);
  const labelW = Math.max(...Object.values(DIMENSION_LABELS).map(l => l.length));

  console.log("");
  for (const dim of dims) {
    if (prev[dim] == null && curr[dim] == null) continue;
    const label = DIMENSION_LABELS[dim] || dim;
    const oldVal = prev[dim];
    const newVal = curr[dim];
    if (oldVal == null || newVal == null) continue;

    const delta = newVal - oldVal;
    const sign = delta >= 0 ? "+" : "";
    const flag = delta < 0 ? "  *** Downgrade" : "";
    console.log(
      `  ${label.padEnd(labelW)}  ${oldVal.toFixed(1)} => ${newVal.toFixed(1)}  ${sign}${delta.toFixed(1)}${flag}`
    );
  }

  const oldOverall = prev.overall_score;
  const newOverall = curr.overall_score;
  if (oldOverall != null && newOverall != null) {
    const delta = newOverall - oldOverall;
    const sign = delta >= 0 ? "+" : "";
    const flag = delta < 0 ? "  *** Downgrade" : "";
    console.log(
      `  ${"Overall".padEnd(labelW)}  ${oldOverall.toFixed(2)} => ${newOverall.toFixed(2)}  ${sign}${delta.toFixed(2)}${flag}`
    );
  }
}

export function saveAuditResults(filepath, scores, markdown, provider) {
  const today = new Date().toISOString().split("T")[0];
  const articleName = path.basename(filepath, ".md");
  const auditFolder = path.join(path.dirname(filepath), "audits", articleName);
  fs.mkdirSync(auditFolder, { recursive: true });

  const jsonFilename = `${today}.${provider}.audit.json`;
  const jsonPath = path.join(auditFolder, jsonFilename);
  const mdPath = path.join(auditFolder, `${today}.${provider}.audit.md`);

  // Load previous audit before overwriting
  const prev = getPreviousAudit(auditFolder, provider);

  const timeStr = new Date()
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    })
    .toLowerCase();

  const prettyName =
    articleName.charAt(0).toUpperCase() + articleName.slice(1);
  const auditTitle = `# ${prettyName} Audit (${provider}) — ${today} ${timeStr}`;

  fs.writeFileSync(jsonPath, JSON.stringify(scores, null, 2));
  fs.writeFileSync(mdPath, `${auditTitle}\n\n${markdown}`);

  console.log(`\nAudit complete: ${articleName} (${provider})`);
  console.log(`Overall Score: ${scores.overall_score}`);

  if (prev) {
    printComparison(prev, scores);
  } else {
    console.log("  (no previous audit to compare)");
  }
  console.log("");
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
