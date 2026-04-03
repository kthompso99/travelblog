// ==============================
// Two Travel Nuts — Anthropic Editorial Audit
// ==============================
//
// Shared script for Sonnet and Opus audits.
// Invoked via npm run sonnet-audit or npm run opus-audit.

import Anthropic from "@anthropic-ai/sdk";
import {
  parseAuditResponse,
  saveAuditResults,
  resolveFiles,
  ENFORCEMENT_MANDATE,
  SYSTEM_PROMPT
} from "./audit-shared.mjs";
import {
  parseCLIArgs,
  prepareAuditContent,
  runAuditBatch,
  reportResults,
  printUsage
} from "./audit-cli-shared.mjs";

// Parse CLI flags
const { args: fileArgs, flags } = parseCLIArgs(process.argv, ["provider", "auditDir", "force"]);
const providerArg = flags.provider || "sonnet";
const auditDirName = flags.auditDir || "audits";
const forceReaudit = flags.force || false;

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

  const { content, contentType, context } = prepareAuditContent(filepath);
  const { editorialStandards, brandIdentity, antiAIGuidelines } = context;

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

const cmd = `npm run ${PROVIDER}-audit`;
if (fileArgs.length === 0) {
  printUsage(cmd, [
    `${cmd} -- spain/granada`,
    `${cmd} -- spain  (all files, incremental)`,
    `${cmd} -- spain --force  (re-audit all files, skip change detection)`,
    `${cmd} -- --audit-dir audits-test greece/paros  (save to alternate dir)`
  ]);
}

// Skip incremental check when using alternate audit dir or --force flag
const files = (auditDirName !== "audits" || forceReaudit)
  ? resolveFiles(fileArgs, "__force__")
  : resolveFiles(fileArgs, PROVIDER);

if (files.length === 0) {
  console.log(`All ${LABEL} audits are current. Nothing to do.`);
  process.exit(0);
}

if (auditDirName !== "audits") {
  console.log(`Saving to ${auditDirName}/ (not affecting main audit history)\n`);
}
console.log(`Auditing ${files.length} file(s) with ${LABEL} (${MODEL})...\n`);

const { mdPaths, failed } = await runAuditBatch(files, runAudit);
reportResults(mdPaths, failed);
