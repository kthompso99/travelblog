// ==============================
// Trip Audit API Module
// ==============================
//
// Shared trip audit logic for both CLI and dashboard API

import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { readArticleContent, loadContextDocs, loadTripConfig, extractJsonAndMarkdown, getLocalDateString, getTripAuditPath, computeTripAverage, getTripPath, getOverviewPath } from "./audit-shared.mjs";

// Assemble trip content (overview + all articles)
function assembleTripContent(tripSlug) {
  const tripDir = getTripPath(tripSlug);
  const articles = [];

  // 1. Overview (always first, if exists)
  const overviewPath = getOverviewPath(tripSlug);
  if (fs.existsSync(overviewPath)) {
    articles.push({
      title: "Trip Overview",
      file: "overview.md",
      content: readArticleContent(overviewPath)
    });
  }

  // 2. Content array items (in sequence from trip.json)
  const tripConfig = loadTripConfig(tripSlug);
  for (const item of tripConfig.content) {
    const filepath = path.join(tripDir, item.file);
    if (!fs.existsSync(filepath)) {
      console.warn(`Warning: ${item.file} not found, skipping`);
      continue;
    }
    articles.push({
      title: item.title,
      file: item.file,
      content: readArticleContent(filepath)
    });
  }

  // 3. Concatenate with section markers
  const sections = articles.map(a =>
    `===== ARTICLE: ${a.title} (${a.file}) =====\n\n${a.content}`
  );

  return sections.join("\n\n");
}

// Parse trip audit response (JSON + markdown)
function parseTripAuditResponse(output) {
  const { parsed, markdown } = extractJsonAndMarkdown(output);

  // Validate required fields
  const required = [
    "redundant_overlaps",
    "information_gaps",
    "stylistic_consistency",
    "narrative_flow_sequencing"
  ];

  for (const field of required) {
    if (typeof parsed[field] !== "number") {
      throw new Error(`Missing or invalid score for: ${field}`);
    }
  }

  // Compute overall score (average of 4 dimensions)
  const scores = {
    redundant_overlaps: parsed.redundant_overlaps,
    information_gaps: parsed.information_gaps,
    stylistic_consistency: parsed.stylistic_consistency,
    narrative_flow_sequencing: parsed.narrative_flow_sequencing
  };

  scores.overall_score = Number(computeTripAverage(Object.values(scores)).toFixed(2));

  return { scores, markdown };
}

// Run trip audit and return results
export default async function runTripAudit(tripSlug, provider) {
  const concatenatedContent = assembleTripContent(tripSlug);

  // Load prompts and context
  const scriptDir = path.dirname(new URL(import.meta.url).pathname);
  const tripPrompt = fs.readFileSync(
    path.join(scriptDir, "trip-audit-prompt.txt"),
    "utf-8"
  );
  const { editorialStandards, brandIdentity } = loadContextDocs();

  // Build system prompt (same for all providers)
  const systemPrompt = [
    "Editorial Standards Context:\n\n" + editorialStandards,
    "Brand Identity Context:\n\n" + brandIdentity,
    tripPrompt
  ].join("\n\n---\n\n");

  let outputText;

  if (provider === "opus") {
    const client = new Anthropic();

    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 6000,
      system: systemPrompt,
      messages: [
        { role: "user", content: concatenatedContent }
      ]
    });

    outputText = response.content[0].text;

  } else if (provider === "gpt") {
    const openai = new OpenAI();

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_tokens: 6000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: concatenatedContent }
      ]
    });

    outputText = response.choices[0].message.content;

  } else {
    throw new Error(`Unknown provider: ${provider}`);
  }

  // Parse response
  const { scores, markdown } = parseTripAuditResponse(outputText);

  // Save result with date-only filename to _trip/ subdirectory
  const dateStamp = getLocalDateString();
  const auditDir = getTripAuditPath(tripSlug);
  fs.mkdirSync(auditDir, { recursive: true });

  const jsonFilename = `${dateStamp}.${provider}.audit.json`;
  const mdFilename = `${dateStamp}.${provider}.audit.md`;
  const jsonPath = path.join(auditDir, jsonFilename);
  const mdPath = path.join(auditDir, mdFilename);

  // Save JSON and MD files
  fs.writeFileSync(jsonPath, JSON.stringify(scores, null, 2));
  fs.writeFileSync(mdPath, markdown);

  return { scores, markdown, jsonFilename, mdFilename, jsonPath, mdPath };
}
