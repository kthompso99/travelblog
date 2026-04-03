// ============================================
// Audit Stability Test — Score Variance Measurement
// ============================================
//
// Experimental diagnostic tool. Runs the same content through GPT, Sonnet,
// and/or Opus repeatedly to measure how much scores vary between identical runs.
// Not part of the regular audit workflow.
//
// Usage:
//   caffeinate -i npm run stability-test                              # 7 runs, 2 min apart, all 3 providers
//   caffeinate -i npm run stability-test -- --quick                   # 2 runs, 10s apart (smoke test)
//   caffeinate -i npm run stability-test -- --provider sonnet         # Sonnet only
//   caffeinate -i npm run stability-test -- --provider opus           # Opus only
//   caffeinate -i npm run stability-test -- --provider gpt            # GPT only
//
// Results saved to audit-stability/.
// View results: npm run stability-view
//
// Key findings (March 2026, 7 runs each):
//   GPT 5.2:           stdev ~0.06 overall — stable, trustworthy for comparisons
//   Claude Sonnet 4.5: stdev ~0.30 overall — noisy, only 0.5+ diffs meaningful
//   Claude Opus 4.6:   stdev ~0.02 overall — most stable, but grades ~1pt harsher

import fs from "fs";
import path from "path";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import {
  loadContextDocs,
  parseAuditResponse,
  SYSTEM_PROMPT,
  ENFORCEMENT_MANDATE
} from "./audit-shared.js";
import { prepareAuditContent } from "./audit-cli-shared.js";

// ==============================
// 🔧 CONFIG
// ==============================

const QUICK_MODE = process.argv.includes("--quick");
const TOTAL_RUNS = QUICK_MODE ? 2 : 7;
const INTERVAL_MS = QUICK_MODE ? 10_000 : 2 * 60 * 1000;

// --provider gpt | sonnet | opus (default: all three)
const providerIdx = process.argv.indexOf("--provider");
const PROVIDER_FILTER = providerIdx !== -1 ? process.argv[providerIdx + 1] : null;

const GPT_MODEL = "gpt-5.2";
const SONNET_MODEL = "claude-sonnet-4-5-20250929";
const OPUS_MODEL = "claude-opus-4-6";

const FILES = [
  // 2 locations
  { path: "content/trips/greece/paros.md", slug: "paros" },
  { path: "content/trips/spain/granada.md", slug: "granada" },
  // 2 articles
  { path: "content/trips/greece/tips.md", slug: "tips-greece" },
  { path: "content/trips/botswana/basics.md", slug: "basics-botswana" }
];

const OUTPUT_DIR = "audit-stability";

// ==============================
// 📂 Snapshot & Setup
// ==============================

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

console.log("=== Audit Stability Test ===");
console.log(`Mode: ${QUICK_MODE ? "quick (2 runs, 10s apart)" : `full (${TOTAL_RUNS} runs, 2 min apart)`}`);
if (PROVIDER_FILTER) console.log(`Provider: ${PROVIDER_FILTER} only`);
console.log(`Started: ${new Date().toLocaleString()}\n`);

// Snapshot content and context at startup
const { editorialStandards, brandIdentity, antiAIGuidelines } = loadContextDocs();
console.log("Snapshotted context docs (Editorial-Standards.md, Brand.md, AntiAIWritingGuidelines.md)");

const targets = FILES.map(f => {
  const { content, contentType } = prepareAuditContent(f.path);
  console.log(`Snapshotted ${f.slug}.md (${contentType}, ${content.length} chars)`);
  return { slug: f.slug, contentType, content };
});

console.log("\nAll inputs frozen. Edits during the test will not affect results.\n");

// ==============================
// 🤖 Audit Functions
// ==============================

let gptClient, anthropicClient;

async function auditGpt(content, contentType) {
  if (!gptClient) gptClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await gptClient.responses.create({
    model: GPT_MODEL,
    input: [
      { role: "system", content: ENFORCEMENT_MANDATE },
      { role: "system", content: "Binding Editorial Standards:\n\n" + editorialStandards },
      { role: "system", content: "Brand Identity Context:\n\n" + brandIdentity },
      { role: "system", content: "Anti-AI Writing Guidelines:\n\n" + antiAIGuidelines },
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content }
    ]
  });
  const { scores } = parseAuditResponse(response.output_text, contentType);
  return scores;
}

async function auditAnthropic(model) {
  return async function(content, contentType) {
    if (!anthropicClient) anthropicClient = new Anthropic();
    const systemPrompt = [
      ENFORCEMENT_MANDATE,
      "Binding Editorial Standards:\n\n" + editorialStandards,
      "Brand Identity Context:\n\n" + brandIdentity,
      "Anti-AI Writing Guidelines:\n\n" + antiAIGuidelines,
      SYSTEM_PROMPT
    ].join("\n\n---\n\n");

    const response = await anthropicClient.messages.create({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content }]
    });
    const { scores } = parseAuditResponse(response.content[0].text, contentType);
    return scores;
  };
}

// ==============================
// 🔁 Main Loop
// ==============================

const allProviders = [
  { name: "gpt",    model: GPT_MODEL,    fn: auditGpt },
  { name: "sonnet", model: SONNET_MODEL,  fn: auditAnthropic(SONNET_MODEL) },
  { name: "opus",   model: OPUS_MODEL,    fn: auditAnthropic(OPUS_MODEL) }
];
const providers = PROVIDER_FILTER
  ? allProviders.filter(p => p.name === PROVIDER_FILTER)
  : allProviders;

if (providers.length === 0) {
  console.error(`Unknown provider: ${PROVIDER_FILTER}. Use gpt, sonnet, or opus.`);
  process.exit(1);
}

for (let run = 0; run < TOTAL_RUNS; run++) {
  const runLabel = String(run).padStart(2, "0");
  const now = new Date();
  console.log(`\n=== Run ${run + 1}/${TOTAL_RUNS} at ${now.toLocaleTimeString()} ===`);

  for (const target of targets) {
    for (const prov of providers) {
      try {
        const scores = await prov.fn(target.content, target.contentType);
        const result = {
          file: `${target.slug}.md`,
          provider: prov.name,
          model: prov.model,
          contentType: target.contentType,
          timestamp: new Date().toISOString(),
          runIndex: run,
          scores
        };
        const dateStr = new Date().toISOString().split("T")[0];
        const filename = `${target.slug}-${prov.name}-${dateStr}T${runLabel}.json`;
        fs.writeFileSync(
          path.join(OUTPUT_DIR, filename),
          JSON.stringify(result, null, 2)
        );
        console.log(`  ${target.slug}/${prov.name}: ${scores.overall_score}`);
      } catch (err) {
        console.error(`  FAILED: ${target.slug}/${prov.name}: ${err.message}`);
      }
    }
  }

  if (run < TOTAL_RUNS - 1) {
    const nextRun = new Date(Date.now() + INTERVAL_MS);
    console.log(`\nSleeping until ${nextRun.toLocaleTimeString()}...`);
    await new Promise(r => setTimeout(r, INTERVAL_MS));
  }
}

console.log(`\n=== Stability test complete at ${new Date().toLocaleTimeString()} ===`);
console.log(`Results in ${OUTPUT_DIR}/`);
console.log("Run 'npm run stability-view' to analyze.\n");
