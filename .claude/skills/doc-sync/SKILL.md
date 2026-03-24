---
name: doc-sync
description: Audits documentation against the actual codebase for semantic drift, stale references, and coverage gaps. Use when asked to check if docs are accurate, up to date, or complete.
---

# Documentation Sync Audit

When triggered with `/doc-sync`, perform a semantic audit of documentation against the actual codebase. This goes beyond `npm run sync-docs` (which only checks syntactic links) — this skill checks whether documentation *claims* are still true.

## Audit Steps

### 1. Run the mechanical checker first
Run `npm run sync-docs` and report any issues found. These are the easy wins (broken links, missing files, invalid npm script references).

### 2. Verify file tree diagrams
Read `docs/FILES.md` and compare the directory tree diagram against the actual filesystem:
- Scan the project root and key directories (`lib/`, `scripts/`, `templates/`, `config/`, `content/`)
- Flag files/directories listed in the diagram that no longer exist
- Flag files/directories that exist on disk but are missing from the diagram
- Skip `node_modules/`, `.git/`, `_cache/`, and gitignored build output

### 3. Verify npm script catalog
Read the npm scripts table in `docs/FILES.md` and cross-reference against `package.json`:
- Flag scripts documented but not in package.json
- Flag scripts in package.json but not documented
- Check that script descriptions are still accurate (read the actual script to verify)

### 4. Check architecture claims
Read architecture descriptions in `CLAUDE.md`, `README.md`, and `docs/` files. For each factual claim, spot-check against the actual code:
- **Path references**: Do referenced files/paths exist? (e.g., "single source of truth for paths is `lib/config-paths.js`")
- **Function references**: Do referenced functions exist in the stated files?
- **Behavior claims**: Spot-check 3-5 key claims (e.g., "filtering happens in scripts/build.js using NODE_ENV")
- **Template/placeholder references**: Do referenced template placeholders still exist?

### 5. Check for stale references
Search all `.md` files for references to things that may have been deleted or renamed:
- Grep for backtick-wrapped paths and verify they exist
- Look for references to deleted directories (e.g., `archive/`)
- Check that import paths mentioned in docs match actual imports

### 6. Identify coverage gaps
Compare what exists in the codebase against what's documented:
- List any `lib/*.js` module that has no mention in any documentation
- List any `scripts/**/*.js` tool that has no mention in any documentation
- Flag any template file not described in the architecture docs

## Report Format

Present findings in a numbered list, categorized by severity:

### Critical (docs are actively wrong)
Things that would mislead a developer reading the docs.

### Stale (references to things that no longer exist)
Harmless but confusing — references to deleted files, renamed functions, etc.

### Missing (undocumented features)
Code that exists but has no documentation coverage. Lower priority.

### False Positives from sync-docs
List any `npm run sync-docs` issues that are actually fine (e.g., example code in implementation docs).

## Rules
- Do NOT make changes automatically. Report findings first and let Kevin decide what to fix.
- Run parallel exploration agents for steps 2-6 to maximize speed.
- When checking claims, read the actual source code — do not guess or assume.
- Distinguish between docs that are *wrong* vs docs that are *incomplete*. Wrong is higher priority.
- Skip `node_modules/`, `.git/`, `_cache/`, and generated build output when scanning.
- The mechanical checker (`npm run sync-docs`) is a complement, not a replacement for this audit. Always run both.

## Tool Usage (IMPORTANT — minimizes permission prompts)
- **Use Glob** (not `find` or `ls`) for all file discovery (e.g., `Glob pattern="lib/*.js"`)
- **Use Grep** (not `grep`, `rg`, or `awk`) for all content searching (e.g., `Grep pattern="functionName" path="lib/"`)
- **Use Read** (not `cat`, `head`, `tail`, or `sed`) for reading file contents
- **Only use Bash** for `npm run sync-docs` (step 1). Every other step must use Glob, Grep, and Read exclusively.
- When launching subagents via Task, include this instruction: "Use Glob, Grep, and Read tools for all filesystem operations. Do NOT use Bash for file reading, searching, or listing."
