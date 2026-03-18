// ==============================
// Two Travel Nuts — GPT Editorial Audit
// ==============================

import { execSync } from "child_process";
import path from "path";
import OpenAI from "openai";
import {
  readArticleContent,
  loadContextDocs,
  parseAuditResponse,
  saveAuditResults,
  resolveFiles,
  getContentType,
  ENFORCEMENT_MANDATE,
  SYSTEM_PROMPT
} from "./audit-shared.mjs";

const MODEL = "gpt-5.2";
const PROVIDER = "gpt";

// ==============================
// 📂 Audit via OpenAI
// ==============================

async function runAudit(filepath) {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const contentType = getContentType(filepath);
  const rawContent = readArticleContent(filepath);
  const content = contentType === "article"
    ? "[Content type: article — evaluate on 5 dimensions only, exclude Decision Clarity per editorial standards]\n\n" + rawContent
    : rawContent;
  const { editorialStandards, brandIdentity, antiAIGuidelines } = loadContextDocs();

  const response = await client.responses.create({
    model: MODEL,
    input: [
      { role: "system", content: ENFORCEMENT_MANDATE },
      { role: "system", content: "Binding Editorial Standards:\n\n" + editorialStandards },
      { role: "system", content: "Brand Identity Context:\n\n" + brandIdentity },
      { role: "system", content: "Anti-AI Writing Guidelines:\n\n" + antiAIGuidelines },
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content }
    ]
  });

  const { scores, markdown } = parseAuditResponse(response.output_text, contentType);
  return saveAuditResults(filepath, scores, markdown, PROVIDER, auditDirName);
}

// ==============================
// CLI
// ==============================

// Strip --audit-dir and its value from args
const rawArgs = process.argv.slice(2);
const args = [];
let auditDirName = "audits";
for (let i = 0; i < rawArgs.length; i++) {
  if (rawArgs[i] === "--audit-dir") {
    auditDirName = rawArgs[++i];
  } else {
    args.push(rawArgs[i]);
  }
}

if (args.length === 0) {
  console.log("Usage: npm run gpt-audit -- spain/granada");
  console.log("       npm run gpt-audit -- spain/ronda spain/seville");
  console.log("       npm run gpt-audit -- spain  (all files, incremental)");
  console.log("       npm run gpt-audit -- --audit-dir audits-antiAI greece  (save to alternate dir)");
  process.exit(1);
}

// Skip incremental check when using alternate audit dir
const files = auditDirName !== "audits"
  ? resolveFiles(args, "__force__")
  : resolveFiles(args, PROVIDER);

if (files.length === 0) {
  console.log("All GPT audits are current. Nothing to do.");
  process.exit(0);
}

if (auditDirName !== "audits") {
  console.log(`Saving to ${auditDirName}/ (not affecting main audit history)\n`);
}
console.log(`Auditing ${files.length} file(s) with GPT...\n`);

let failed = false;
const mdPaths = [];
for (const file of files) {
  try {
    const mdPath = await runAudit(file);
    if (mdPath) mdPaths.push(mdPath);
  } catch (err) {
    console.error(`\nFailed to audit ${file}: ${err.message}\n`);
    failed = true;
  }
}

// Auto-open result for single-file audits; print paths for multi-file
if (mdPaths.length === 1) {
  const abs = path.resolve(mdPaths[0]);
  execSync(`open "${abs}"`);
} else if (mdPaths.length > 1) {
  console.log("Audit results:");
  for (const p of mdPaths) console.log(`  ${path.resolve(p)}`);
}

if (failed) process.exit(1);
