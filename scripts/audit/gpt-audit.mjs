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

  const { scores, markdown } = parseAuditResponse(response.output_text, contentType);
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
