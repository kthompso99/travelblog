// ==============================
// Two Travel Nuts — GPT Editorial Audit
// ==============================
//
// Core audit logic (exported for API server use) + CLI wrapper.
// CLI: npm run gpt-audit
// API: import { runGPTAudit } from './gpt-audit.js'

import { fileURLToPath } from 'url';
import fs from "fs";
import OpenAI from "openai";
import {
  parseAuditResponse,
  saveAuditResults,
  ENFORCEMENT_MANDATE,
  SYSTEM_PROMPT,
  readJsonFile
} from "./audit-shared.js";
import {
  parseCLIArgs,
  prepareAuditContent,
  runAuditBatch,
  reportResults,
  printUsage,
  resolveAuditFiles
} from "./audit-cli-shared.js";

const MODEL = "gpt-5.2";
const PROVIDER = "gpt";

// ==============================
// Load OpenAI API Key
// ==============================

function getOpenAIApiKey() {
  // Try environment variable first
  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }

  // Fall back to config file
  const configPath = "config/openai.json";
  if (fs.existsSync(configPath)) {
    const config = readJsonFile(configPath);
    return config.apiKey;
  }

  throw new Error("Missing OpenAI API key. Set OPENAI_API_KEY environment variable or create config/openai.json with {\"apiKey\": \"sk-...\"}");
}

// ==============================
// Core Audit Logic (Exported)
// ==============================

/**
 * Run GPT audit on a single file
 * @param {string} filepath - Path to content file (e.g., "spain/granada.md")
 * @param {string} auditDirName - Audit directory name (default: "audits")
 * @returns {Promise<{jsonPath: string, mdPath: string}>}
 */
export async function runGPTAudit(filepath, auditDirName = "audits") {
  const client = new OpenAI({
    apiKey: getOpenAIApiKey()
  });

  const { content, contentType, context } = prepareAuditContent(filepath);
  const { editorialStandards, brandIdentity, antiAIGuidelines } = context;

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
// CLI Wrapper (only runs when executed directly)
// ==============================

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { args, flags } = parseCLIArgs(process.argv, ["auditDir", "force"]);

  if (args.length === 0) {
    printUsage("npm run gpt-audit", [
      "npm run gpt-audit -- spain/granada",
      "npm run gpt-audit -- spain/ronda spain/seville",
      "npm run gpt-audit -- spain  (all files, incremental)",
      "npm run gpt-audit -- spain --force  (re-audit all files, skip change detection)",
      "npm run gpt-audit -- --audit-dir audits-antiAI greece  (save to alternate dir)"
    ]);
  }

  const { files, auditDirName } = resolveAuditFiles(args, flags, PROVIDER, "GPT");
  console.log(`Auditing ${files.length} file(s) with GPT...\n`);

  // Wrapper function that calls core logic with auditDirName from CLI scope
  async function runAuditCLI(filepath) {
    return runGPTAudit(filepath, auditDirName);
  }

  const { mdPaths, failed } = await runAuditBatch(files, runAuditCLI);
  reportResults(mdPaths, failed);
}
