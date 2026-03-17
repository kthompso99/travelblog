// ==============================
// Two Travel Nuts — Claude Editorial Audit
// ==============================

import Anthropic from "@anthropic-ai/sdk";
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

// Default model; override with --model claude-opus-4-6
const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";
const PROVIDER = "claude";

function getModel() {
  const idx = process.argv.indexOf("--model");
  if (idx !== -1 && process.argv[idx + 1]) {
    return process.argv[idx + 1];
  }
  return DEFAULT_MODEL;
}

// ==============================
// 📂 Audit via Anthropic
// ==============================

async function runAudit(filepath) {
  const client = new Anthropic();
  const model = getModel();

  const contentType = getContentType(filepath);
  const rawContent = readArticleContent(filepath);
  const content = contentType === "article"
    ? "[Content type: article — evaluate on 5 dimensions only, exclude Decision Clarity per editorial standards]\n\n" + rawContent
    : rawContent;
  const { editorialStandards, brandIdentity, antiAIGuidelines } = loadContextDocs();

  const systemPrompt = [
    ENFORCEMENT_MANDATE,
    "Binding Editorial Standards:\n\n" + editorialStandards,
    "Brand Identity Context:\n\n" + brandIdentity,
    "Anti-AI Writing Guidelines:\n\n" + antiAIGuidelines,
    SYSTEM_PROMPT
  ].join("\n\n---\n\n");

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      { role: "user", content }
    ]
  });

  const outputText = response.content[0].text;
  const { scores, markdown } = parseAuditResponse(outputText, contentType);
  saveAuditResults(filepath, scores, markdown, PROVIDER, auditDirName);
}

// ==============================
// CLI
// ==============================

// Strip --model, --audit-dir and their values from args before resolving files
const rawArgs = process.argv.slice(2);
const args = [];
let auditDirName = "audits";
for (let i = 0; i < rawArgs.length; i++) {
  if (rawArgs[i] === "--model") {
    i++; // skip the model value too
  } else if (rawArgs[i] === "--audit-dir") {
    auditDirName = rawArgs[++i];
  } else {
    args.push(rawArgs[i]);
  }
}

if (args.length === 0) {
  console.log("Usage: npm run claude-audit -- spain/granada");
  console.log("       npm run claude-audit -- spain  (all files, incremental)");
  console.log("       npm run claude-audit -- --model claude-opus-4-6 spain/granada");
  console.log("       npm run claude-audit -- --audit-dir audits-opus greece/paros  (save to alternate dir)");
  process.exit(1);
}

// Skip incremental check when using alternate audit dir
const files = auditDirName !== "audits"
  ? resolveFiles(args, "__force__")
  : resolveFiles(args, PROVIDER);

if (files.length === 0) {
  console.log("All Claude audits are current. Nothing to do.");
  process.exit(0);
}

const model = getModel();
if (auditDirName !== "audits") {
  console.log(`Saving to ${auditDirName}/ (not affecting main audit history)\n`);
}
console.log(`Auditing ${files.length} file(s) with Claude (${model})...\n`);

let failed = false;
for (const file of files) {
  try {
    await runAudit(file);
  } catch (err) {
    console.error(`\nFailed to audit ${file}: ${err.message}\n`);
    failed = true;
  }
}
if (failed) process.exit(1);
