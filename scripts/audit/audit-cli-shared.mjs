// ==============================
// CLI Shared Utilities for Audit Scripts
// ==============================
//
// Shared utilities for anthropic-audit.mjs, gpt-audit.mjs, stability-test.mjs
// Reduces duplication in CLI argument parsing, content prep, and batch execution

import path from "path";
import { getContentType, readArticleContent, loadContextDocs } from "./audit-shared.mjs";

// ==============================
// CLI Argument Parsing
// ==============================

export function parseCLIArgs(argv, supportedFlags = []) {
  const rawArgs = argv.slice(2);
  const args = [];
  const flags = {};

  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i];

    if (arg === "--provider" && supportedFlags.includes("provider")) {
      flags.provider = rawArgs[++i];
    } else if (arg === "--audit-dir" && supportedFlags.includes("auditDir")) {
      flags.auditDir = rawArgs[++i];
    } else if (arg.startsWith("--")) {
      // Skip unknown flags and their values
      if (i + 1 < rawArgs.length && !rawArgs[i + 1].startsWith("--")) {
        i++; // Skip flag value
      }
    } else {
      args.push(arg);
    }
  }

  return { args, flags };
}

// ==============================
// Content Preparation
// ==============================

export function prepareAuditContent(filepath) {
  const contentType = getContentType(filepath);
  const rawContent = readArticleContent(filepath);

  // Add article prefix if applicable
  const content = contentType === "article"
    ? "[Content type: article — evaluate on 5 dimensions only, exclude Decision Clarity per editorial standards]\n\n" + rawContent
    : rawContent;

  const context = loadContextDocs();

  return { content, contentType, context };
}

// ==============================
// Batch Execution
// ==============================

export async function runAuditBatch(files, auditFn) {
  let failed = false;
  const mdPaths = [];

  for (const file of files) {
    try {
      const mdPath = await auditFn(file);
      if (mdPath) mdPaths.push(mdPath);
    } catch (err) {
      console.error(`\nFailed to audit ${file}: ${err.message}\n`);
      failed = true;
    }
  }

  return { mdPaths, failed };
}

// ==============================
// Result Reporting
// ==============================

export function reportResults(mdPaths, failed) {
  if (mdPaths.length > 0) {
    console.log("Audit results:");
    for (const p of mdPaths) console.log(`  ${path.resolve(p)}`);
  }

  if (failed) process.exit(1);
}

// ==============================
// Usage Messages
// ==============================

export function printUsage(commandName, examples) {
  console.log(`Usage: ${commandName} -- <files or directories>`);
  console.log("");
  console.log("Examples:");
  for (const example of examples) {
    console.log(`  ${example}`);
  }
  process.exit(1);
}
