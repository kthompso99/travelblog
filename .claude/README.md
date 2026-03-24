# .claude/

Project-specific Claude Code configuration and skills.

## skills/

Custom skills for this project. These are version-controlled so they're available across machines and preserved in the repo.

### Available Skills

#### techdebt (`/techdebt`)
Analyzes codebase for technical debt, code duplication, long functions (>50 lines), and outdated patterns.

**Coverage:** scripts/build/, scripts/audit/, scripts/tools/, scripts/test/, lib/

**Detection patterns:**
- Duplicate function implementations (3+ copies)
- Hardcoded string literals (3+ occurrences)
- Path construction patterns
- System prompt construction
- Score calculation logic
- File operation patterns
- Long functions (>50 lines)
- Unused imports and commented code

**Output:** Categorized report (High/Medium/Low severity) with refactoring recommendations.

#### doc-sync (`/doc-sync`)
Audits documentation against the actual codebase for semantic drift, stale references, and coverage gaps. Goes beyond `npm run sync-docs` (syntactic checks) to verify documentation *claims* are still accurate.

**What it checks:**
- File tree diagrams match actual filesystem
- Code examples still work
- API signatures match implementation
- Architecture descriptions reflect reality
- Configuration examples are current
- npm script references are valid

**Output:** Semantic audit report with specific drift issues and recommendations.
