// ==============================
// Two Travel Nuts — Anthropic Editorial Audit
// ==============================
//
// Core audit logic (exported for API server use) + CLI wrapper.
// CLI: npm run sonnet-audit or npm run opus-audit
// API: import { runAnthropicAudit } from './anthropic-audit.js'

import { fileURLToPath } from 'url';
import Anthropic from "@anthropic-ai/sdk";
import {
  parseAuditResponse,
  saveAuditResults,
  ENFORCEMENT_MANDATE,
  SYSTEM_PROMPT
} from "./audit-shared.js";
import {
  parseCLIArgs,
  prepareAuditContent,
  runAuditBatch,
  reportResults,
  printUsage,
  resolveAuditFiles
} from "./audit-cli-shared.js";

const PROFILES = {
  sonnet: { model: "claude-sonnet-4-5-20250929", provider: "sonnet", label: "Sonnet" },
  opus:   { model: "claude-opus-4-6",            provider: "opus",   label: "Opus" }
};

// ==============================
// Core Audit Logic (Exported)
// ==============================

/**
 * Run Anthropic audit on a single file
 * @param {string} filepath - Path to content file (e.g., "spain/granada.md")
 * @param {string} provider - "sonnet" or "opus"
 * @param {string} auditDirName - Audit directory name (default: "audits")
 * @returns {Promise<{jsonPath: string, mdPath: string}>}
 */
export async function runAnthropicAudit(filepath, provider = "sonnet", auditDirName = "audits") {
  const profile = PROFILES[provider] || PROFILES.sonnet;
  const { model } = profile;

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
    model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      { role: "user", content }
    ]
  });

  const outputText = response.content[0].text;
  const { scores, markdown } = parseAuditResponse(outputText, contentType);
  return saveAuditResults(filepath, scores, markdown, provider, auditDirName);
}

// ==============================
// CLI Wrapper (only runs when executed directly)
// ==============================

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // Parse CLI flags
  const { args: fileArgs, flags } = parseCLIArgs(process.argv, ["provider", "auditDir", "force"]);
  const providerArg = flags.provider || "sonnet";

  const profile = PROFILES[providerArg] || PROFILES.sonnet;
  const { model: MODEL, provider: PROVIDER, label: LABEL } = profile;

  const cmd = `npm run ${PROVIDER}-audit`;
  if (fileArgs.length === 0) {
    printUsage(cmd, [
      `${cmd} -- spain/granada`,
      `${cmd} -- spain  (all files, incremental)`,
      `${cmd} -- spain --force  (re-audit all files, skip change detection)`,
      `${cmd} -- --audit-dir audits-test greece/paros  (save to alternate dir)`
    ]);
  }

  const { files, auditDirName } = resolveAuditFiles(fileArgs, flags, PROVIDER, LABEL);
  console.log(`Auditing ${files.length} file(s) with ${LABEL} (${MODEL})...\n`);

  // Wrapper function that calls core logic with auditDirName from CLI scope
  async function runAuditCLI(filepath) {
    return runAnthropicAudit(filepath, PROVIDER, auditDirName);
  }

  const { mdPaths, failed } = await runAuditBatch(files, runAuditCLI);
  reportResults(mdPaths, failed);
}
