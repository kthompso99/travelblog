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

  const content = readArticleContent(filepath);
  const { editorialStandards, brandIdentity } = loadContextDocs();

  const systemPrompt = [
    ENFORCEMENT_MANDATE,
    "Binding Editorial Standards:\n\n" + editorialStandards,
    "Brand Identity Context:\n\n" + brandIdentity,
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
  const { scores, markdown } = parseAuditResponse(outputText);
  saveAuditResults(filepath, scores, markdown, PROVIDER);
}

// ==============================
// CLI
// ==============================

// Strip --model and its value from args before resolving files
const rawArgs = process.argv.slice(2);
const args = [];
for (let i = 0; i < rawArgs.length; i++) {
  if (rawArgs[i] === "--model") {
    i++; // skip the model value too
  } else {
    args.push(rawArgs[i]);
  }
}

if (args.length === 0) {
  console.log("Usage: npm run claude-audit -- spain/granada");
  console.log("       npm run claude-audit -- spain  (all files, incremental)");
  console.log("       npm run claude-audit -- --model claude-opus-4-6 spain/granada");
  process.exit(1);
}

const files = resolveFiles(args, PROVIDER);

if (files.length === 0) {
  console.log("All Claude audits are current. Nothing to do.");
  process.exit(0);
}

const model = getModel();
console.log(`Auditing ${files.length} file(s) with Claude (${model})...\n`);

for (const file of files) {
  await runAudit(file);
}
