// ==============================
// Two Travel Nuts — GPT Editorial Audit
// ==============================

import fs from "fs";
import OpenAI from "openai";
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
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    return config.apiKey;
  }

  throw new Error("Missing OpenAI API key. Set OPENAI_API_KEY environment variable or create config/openai.json with {\"apiKey\": \"sk-...\"}");
}

// ==============================
// 📂 Audit via OpenAI
// ==============================

async function runAudit(filepath) {
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
// CLI
// ==============================

const { args, flags } = parseCLIArgs(process.argv, ["auditDir", "force"]);
const auditDirName = flags.auditDir || "audits";
const forceReaudit = flags.force || false;

if (args.length === 0) {
  printUsage("npm run gpt-audit", [
    "npm run gpt-audit -- spain/granada",
    "npm run gpt-audit -- spain/ronda spain/seville",
    "npm run gpt-audit -- spain  (all files, incremental)",
    "npm run gpt-audit -- spain --force  (re-audit all files, skip change detection)",
    "npm run gpt-audit -- --audit-dir audits-antiAI greece  (save to alternate dir)"
  ]);
}

// Skip incremental check when using alternate audit dir or --force flag
const files = (auditDirName !== "audits" || forceReaudit)
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

const { mdPaths, failed } = await runAuditBatch(files, runAudit);
reportResults(mdPaths, failed);
