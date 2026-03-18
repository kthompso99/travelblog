// ==============================
// Two Travel Nuts — Anthropic Editorial Audit
// ==============================
//
// Shared script for Sonnet and Opus audits.
// Invoked via npm run sonnet-audit or npm run opus-audit.

import { execSync } from "child_process";
import path from "path";
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

// Determine provider from --provider flag (set by npm script)
const providerIdx = process.argv.indexOf("--provider");
const providerArg = providerIdx !== -1 ? process.argv[providerIdx + 1] : "sonnet";

const PROFILES = {
  sonnet: { model: "claude-sonnet-4-5-20250929", provider: "sonnet", label: "Sonnet" },
  opus:   { model: "claude-opus-4-6",            provider: "opus",   label: "Opus" }
};

const profile = PROFILES[providerArg] || PROFILES.sonnet;
const { model: MODEL, provider: PROVIDER, label: LABEL } = profile;

// ==============================
// 📂 Audit via Anthropic
// ==============================

async function runAudit(filepath) {
  const client = new Anthropic();

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
    model: MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      { role: "user", content }
    ]
  });

  const outputText = response.content[0].text;
  const { scores, markdown } = parseAuditResponse(outputText, contentType);
  return saveAuditResults(filepath, scores, markdown, PROVIDER, auditDirName);
}

// ==============================
// CLI
// ==============================

// Strip --provider, --audit-dir and their values from args before resolving files
const rawArgs = process.argv.slice(2);
const args = [];
let auditDirName = "audits";
for (let i = 0; i < rawArgs.length; i++) {
  if (rawArgs[i] === "--provider") {
    i++; // skip the provider value
  } else if (rawArgs[i] === "--audit-dir") {
    auditDirName = rawArgs[++i];
  } else {
    args.push(rawArgs[i]);
  }
}

const cmd = `npm run ${PROVIDER}-audit`;
if (args.length === 0) {
  console.log(`Usage: ${cmd} -- spain/granada`);
  console.log(`       ${cmd} -- spain  (all files, incremental)`);
  console.log(`       ${cmd} -- --audit-dir audits-test greece/paros  (save to alternate dir)`);
  process.exit(1);
}

// Skip incremental check when using alternate audit dir
const files = auditDirName !== "audits"
  ? resolveFiles(args, "__force__")
  : resolveFiles(args, PROVIDER);

if (files.length === 0) {
  console.log(`All ${LABEL} audits are current. Nothing to do.`);
  process.exit(0);
}

if (auditDirName !== "audits") {
  console.log(`Saving to ${auditDirName}/ (not affecting main audit history)\n`);
}
console.log(`Auditing ${files.length} file(s) with ${LABEL} (${MODEL})...\n`);

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
