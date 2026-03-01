// ==============================
// Two Travel Nuts — GPT Editorial Audit
// ==============================

import OpenAI from "openai";
import {
  readArticleContent,
  loadContextDocs,
  parseAuditResponse,
  saveAuditResults,
  resolveFiles,
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

  const content = readArticleContent(filepath);
  const { editorialStandards, brandIdentity } = loadContextDocs();

  const response = await client.responses.create({
    model: MODEL,
    input: [
      { role: "system", content: ENFORCEMENT_MANDATE },
      { role: "system", content: "Binding Editorial Standards:\n\n" + editorialStandards },
      { role: "system", content: "Brand Identity Context:\n\n" + brandIdentity },
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content }
    ]
  });

  const { scores, markdown } = parseAuditResponse(response.output_text);
  saveAuditResults(filepath, scores, markdown, PROVIDER);
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

const files = resolveFiles(args, PROVIDER);

if (files.length === 0) {
  console.log("All GPT audits are current. Nothing to do.");
  process.exit(0);
}

console.log(`Auditing ${files.length} file(s) with GPT...\n`);

for (const file of files) {
  await runAudit(file);
}
