// ==============================
// Two Travel Nuts Editorial Audit Engine
// ==============================

import fs from "fs";
import path from "path";
import OpenAI from "openai";

// ==============================
// 🔧 CONFIGURATION (EASY TO EDIT)
// ==============================

const WEIGHTS = {
  sentence_structure: 0.20,
  narrative_clarity: 0.25,
  opening_strength: 0.15,
  brand_alignment: 0.15,
  distinctiveness: 0.15,
  rating_integrity: 0.10
};

const MODEL = "gpt-5.2";

// ==============================
// System Prompt (loaded from file)
// ==============================

const scriptDir = path.dirname(new URL(import.meta.url).pathname);
const ENFORCEMENT_MANDATE = fs.readFileSync(path.join(scriptDir, 'gpt-audit-mandate.txt'), 'utf-8');
const SYSTEM_PROMPT = fs.readFileSync(path.join(scriptDir, 'gpt-audit-prompt.txt'), 'utf-8');

// ==============================
// 🧮 Weighted Score Calculator
// ==============================

function computeWeightedScore(scores) {
  let total = 0;
  for (const key in WEIGHTS) {
    total += scores[key] * WEIGHTS[key];
  }
  return Number(total.toFixed(2));
}

// ==============================
// 📂 Audit Function
// ==============================

async function runAudit(filepath) {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const content = fs.readFileSync(filepath, "utf-8");

  const EDITORIAL_STANDARDS = fs.readFileSync(
    "docs/brand/Editorial-Standards.md",
    "utf-8"
  );

  const BRAND_IDENTITY = fs.readFileSync(
    "docs/brand/Brand.md",
    "utf-8"
  );

  const response = await client.responses.create({
    model: MODEL,
    input: [
      { role: "system", content: ENFORCEMENT_MANDATE },
      { role: "system", content: "Binding Editorial Standards:\n\n" + EDITORIAL_STANDARDS },
      { role: "system", content: "Brand Identity Context:\n\n" + BRAND_IDENTITY },
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: content }
    ]
  });

  const output = response.output_text;


  
// Extract JSON block safely
const jsonMatch = output.match(/\{[\s\S]*?\}/);

if (!jsonMatch) {
  throw new Error("Could not find JSON in model output.");
}



const scores = JSON.parse(jsonMatch[0]);
    // Everything after JSON is markdown
const markdownStart = output.indexOf(jsonMatch[0]) + jsonMatch[0].length;
let markdownPart = output.slice(markdownStart).trim();

// Strip code fences and "PART 2" header that GPT may wrap the response in
markdownPart = markdownPart
  .replace(/^```[\w]*\s*\n?/, '')
  .replace(/\n?```\s*$/, '')
  .replace(/^PART 2\s*[—–-]\s*MARKDOWN AUDIT:?\s*\n*/i, '')
  .trim();


    
  scores.overall_score = computeWeightedScore(scores);

  const today = new Date().toISOString().split("T")[0];

  const tripFolder = path.dirname(filepath);
  const articleName = path.basename(filepath, ".md");

  const auditFolder = path.join(tripFolder, "audits", articleName);
  fs.mkdirSync(auditFolder, { recursive: true });

  const jsonPath = path.join(auditFolder, `${today}.audit.json`);
  const mdPath = path.join(auditFolder, `${today}.audit.md`);

  // Build a human-friendly title: "Cordoba Audit — 2026-02-27 11:34am"
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
  const prettyName = articleName.charAt(0).toUpperCase() + articleName.slice(1);
  const auditTitle = `# ${prettyName} Audit — ${today} ${timeStr}`;

  fs.writeFileSync(jsonPath, JSON.stringify(scores, null, 2));
  fs.writeFileSync(mdPath, `${auditTitle}\n\n${markdownPart}`);

  console.log(`\nAudit complete: ${articleName}`);
  console.log(`Overall Score: ${scores.overall_score}\n`);
}

// ==============================
// Incremental check — skip if latest audit is newer than the .md file
// ==============================

function needsAudit(filepath) {
  const articleName = path.basename(filepath, '.md');
  const auditFolder = path.join(path.dirname(filepath), 'audits', articleName);

  if (!fs.existsSync(auditFolder)) return true;

  const audits = fs.readdirSync(auditFolder).filter(f => f.endsWith('.audit.md'));
  if (audits.length === 0) return true;

  const latestAuditMtime = Math.max(
    ...audits.map(f => fs.statSync(path.join(auditFolder, f)).mtimeMs)
  );
  return fs.statSync(filepath).mtimeMs > latestAuditMtime;
}

// ==============================
// CLI
// ==============================

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log("Usage: npm run gpt-audit -- spain/granada");
  console.log("       npm run gpt-audit -- spain/ronda spain/seville");
  console.log("       npm run gpt-audit -- spain  (all files, incremental)");
  process.exit(1);
}

// Expand arguments into a file list
const files = [];

for (const arg of args) {
  let resolved = arg;
  if (!resolved.startsWith('content/')) resolved = `content/trips/${resolved}`;

  if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
    // Trip-level: audit all .md files, skip ones with current audits
    const mds = fs.readdirSync(resolved)
      .filter(f => f.endsWith('.md'))
      .map(f => path.join(resolved, f));

    for (const md of mds) {
      if (needsAudit(md)) {
        files.push(md);
      } else {
        console.log(`Skipping ${path.basename(md, '.md')} (audit is current)`);
      }
    }
  } else {
    // Specific file
    if (!resolved.endsWith('.md')) resolved += '.md';
    files.push(resolved);
  }
}

if (files.length === 0) {
  console.log("All audits are current. Nothing to do.");
  process.exit(0);
}

console.log(`Auditing ${files.length} file(s)...\n`);

for (const file of files) {
  await runAudit(file);
}
