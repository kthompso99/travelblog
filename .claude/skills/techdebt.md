---
name: techdebt
description: Analyzes codebase for technical debt, including unused imports, long functions, and outdated code patterns. Use this when asked to audit code quality or find technical debt.
---

# Tech Debt Helper Skill

When triggered with `/techdebt` or asked to audit, follow these steps:

1.  **Scan for Duplication:** Search for duplicated helper utilities, especially within:
    - `scripts/` directory (all subdirectories: `scripts/build/`, `scripts/audit/`, `scripts/tools/`, `scripts/test/`)
    - `lib/` directory

2.  **Check Function Complexity:** Identify functions longer than 50 lines.

3.  **Identify Unused Code:** Look for unused imports and commented-out code.

4.  **Detect Common Duplication Patterns:**
    - **Duplicate function implementations:** Same logic across multiple files (e.g., CLI parsing, content preparation, JSON extraction)
    - **Hardcoded string literals:** Look for string literals appearing 3+ times (e.g., path segments, identifiers, constants)
    - **Path construction patterns:** Identical `path.join()` calls repeated across files
    - **System prompt construction:** Similar prompt-building logic in multiple files
    - **Score calculation logic:** Manual averaging/aggregation that could use shared helpers
    - **File operation patterns:** Repeated `fs.readFileSync()`, `fs.existsSync()` sequences

5.  **Report Structure:** Provide a list of issues categorized by severity:
    - **High:** Duplicate logic (3+ copies), security issues, broken patterns
    - **Medium:** Function complexity (>50 lines), magic strings (3+ occurrences)
    - **Low:** Minor style issues, commented code

6.  **Refactoring Advice:** For each issue:
    - Suggest where to centralize duplicate code
    - Propose helper function names
    - Show before/after examples for clarity

## Rules
- Do not make changes automatically; report findings first.
- Prioritize fixing duplication (especially in `scripts/audit/` based on past issues).
- Use `git diff` to show what a potential fix would look like.
- When reporting duplicated string literals, show all occurrences with file:line references.
- For duplicated logic, provide a consolidation plan with suggested shared module location.

## Example Patterns to Detect

### CLI Argument Parsing Duplication
```javascript
// Pattern: Multiple files doing manual argv parsing
const args = process.argv.slice(2);
const flags = {};
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--flag") flags.flag = args[++i];
}
```

### Hardcoded String Literals
```javascript
// Pattern: Same string appearing multiple times
const dir = path.join("content/trips", tripSlug, "audits", "_trip");
const dir2 = path.join(tripDir, "audits", "_trip");
const dir3 = path.join(baseDir, "audits", "_trip");
// Suggest: export const TRIP_AUDIT_SUBDIR = "_trip";
```

### Duplicate Score Calculation
```javascript
// Pattern: Manual averaging logic repeated
const avg = (a + b + c + d) / 4;
const avg2 = (x + y + z) / 3;
// Suggest: function computeAverage(values) { return values.reduce((a,b) => a+b) / values.length; }
```
