# Claude Code Session Analysis
**Generated:** 2026-03-24

## Executive Summary

Analysis of 44+ Claude Code sessions, 23 plan files (2,327+ lines), 100+ commits, and project structure reveals **7 major workflow patterns** with significant automation opportunities.

---

## Your Primary Workflows

### 1. **Technical Debt Management** (High Frequency)
**What you do:**
- Run `/techdebt` to find duplication, long functions, magic strings
- Refactor scripts to eliminate duplication (audit-cli-shared.mjs, tool-helpers.js patterns)
- Break up 50+ line functions systematically
- Centralize constants and utilities

**Evidence:**
- 29 commits with "Resolve tech debt" or "Refactor"
- Recent examples: tool-helpers.js, audit-shared consolidation, CSS split
- `/techdebt` skill already in use

**Current automation:** ✅ Good (skill exists)
**Gap:** Post-refactoring verification workflow (ensure all build modes still work)

---

### 2. **Content Editorial & Audit Workflow** (High Frequency)
**What you do:**
- Run Opus/GPT audits on individual articles
- Compare scores across providers
- Track score progression over time (history graphs)
- Run trip-level audits for coherence
- Iterate to 8.5+ readiness threshold
- Manual prose refinement based on AI feedback

**Evidence:**
- 12 audit scripts in `scripts/audit/`
- Commits like "Athens up to 8.52", "Naxos up to 8.65"
- Trip audit implementation (kind-questing-sun plan)
- Audit dashboard with provider comparison

**Current automation:** ⚠️ Partial
**Gaps:**
1. No skill for "audit this article across all providers and show me deltas"
2. No batch audit command ("audit all Greece articles below 8.5")
3. No skill for "check audit readiness" (runs mechanical + editorial checks)

---

### 3. **Documentation Drift Management** (High Frequency)
**What you do:**
- Run `/doc-sync` to find stale references
- Update CLAUDE.md, FILES.md, README when architecture changes
- Manually verify claims in docs match code
- Fix broken file references

**Evidence:**
- 8 commits with "Fix documentation drift" or "Update docs"
- `/doc-sync` skill already exists
- Recent: FILES.md sync, CLAUDE.md updates after refactoring

**Current automation:** ✅ Good (skill exists)
**Gap:** Could be triggered automatically after major refactorings

---

### 4. **Pre-Commit Validation** (Medium Frequency)
**What you do:**
1. Run `npm run normalize -- --dry-run` to check typography
2. If source files changed, run `npm run build-context` to sync Context-Combined.md
3. Run `npm run validate` (linting, tests)
4. Ask Claude "Ready to commit and push?"
5. Wait for explicit approval
6. Commit with structured message

**Evidence:**
- Git Commit Protocol in CLAUDE.md (BLOCKING REQUIREMENT repeated 5+ times)
- Pre-commit hooks and validation scripts
- Recent commit: "Add pre-commit typography check to CLAUDE.md"

**Current automation:** ⚠️ Manual checklist
**Gaps:**
1. No single `/pre-commit` skill that runs all checks and reports results
2. No automatic Context-Combined.md rebuild detection
3. Commit message drafting is manual (Claude does it, but no pattern/skill)

---

### 5. **Build Mode Management** (Medium Frequency)
**What you do:**
- Choose between 3 build modes based on task:
  - `npm run build` — full rebuild (homepage, maps, sitemap)
  - `npm run build:smart` — incremental (changed trips only)
  - `npm run writing` — fast mode (single .md file, ~4-6ms)
- Verify all modes after lib/ or template changes
- Run dev server with auto-rebuild

**Evidence:**
- 3 build scripts with different modes
- CLAUDE.md: "Development Workflows" section explaining modes
- Pre-commit verification: test all 3 modes after changes

**Current automation:** ⚠️ Manual selection
**Gaps:**
1. No `/build` skill that intelligently selects mode based on what you changed
2. No verification helper ("verify all build modes work")
3. Writing mode requires manual file path specification

---

### 6. **Typography & Content Normalization** (Low-Medium Frequency)
**What you do:**
- Run `npm run normalize` to convert ASCII quotes → curly quotes, dashes → em/en dashes
- Check for ellipses, fix spacing
- Ensure source stays ASCII (build converts to typographic)
- Pre-commit dry-run check

**Evidence:**
- normalize-typography.js tool
- Commits: "Smart quotes", "Smart dashes", "Smart ellipses"
- Pre-commit requirement in CLAUDE.md

**Current automation:** ✅ Good (tool exists)
**Gap:** Could be auto-run on save via hook (currently manual)

---

### 7. **Photo Management Workflow** (Low Frequency, High Complexity)
**What you do:**
- Extract photos from Google Takeout zip
- Match photos to locations via GPS metadata
- Assign photos interactively to markdown files
- Handle caption detection from metadata files

**Evidence:**
- sync-takeout-photos.js, assign-photos.js
- Complex caption detection logic (truncated filenames, edited photos)
- Memory notes on caption detection patterns

**Current automation:** ✅ Good (tools exist)
**Gap:** Could be wrapped in skill for easier invocation

---

## Existing Automation (What You Already Have)

### ✅ Project-Specific Skills
1. **`/techdebt`** — Finds duplication, long functions, magic strings
2. **`/doc-sync`** — Audits docs for stale references and semantic drift

### ✅ Git Commit Protocol
- Strict "NEVER commit without explicit approval" rule in CLAUDE.md
- Pre-commit typography check requirement
- Context sync requirement for editorial file changes
- Multi-stage validation (normalize, build-context, validate, test)

### ✅ Build Pipeline
- 3 build modes optimized for different scenarios
- Auto-promote homepage (index.html.new → index.html)
- Smart incremental builds with cache
- Fast writing mode for prose iteration

### ✅ Audit System
- Multi-provider audits (Opus, GPT, Sonnet)
- Dashboard with score tracking and history graphs
- Trip-level coherence audits
- Stability testing for score variance

### ✅ Development Tools
- File watching with auto-rebuild
- Local dev server
- Pre-commit validation suite
- Image optimization
- Typography normalization

---

## Recommended Automation Opportunities

### 🔥 High Priority (Immediate Value)

#### 1. **Pre-Commit Checker Skill** (`/pre-commit`)
**What it does:**
```bash
1. Run npm run normalize -- --dry-run
2. If docs/Content/*.md changed, check if Context-Combined.md is stale
3. Run npm run validate
4. Run npm test (quick mode if exists, or skip if slow)
5. Report all issues in one view
6. Ask: "Ready to commit and push?"
```

**Why:** Currently manual 4-step checklist; automate into single command
**Effort:** Low (orchestrates existing tools)
**Impact:** High (saves 2-3 minutes every commit, reduces forgotten steps)

---

#### 2. **Audit Runner Skill** (`/audit`)
**What it does:**
```bash
# Usage variations:
/audit athens                    # Audit single article, all providers
/audit greece --below 8.5        # Audit all Greece articles below threshold
/audit --trip greece             # Run trip-level audit
/audit --compare opus gpt        # Compare two providers side-by-side
```

**Why:** Currently requires switching to dashboard or running 3 separate npm scripts
**Effort:** Medium (wraps existing audit-*.mjs scripts)
**Impact:** High (your most frequent workflow after writing)

---

#### 3. **Build Mode Selector Skill** (`/build`)
**What it does:**
```bash
# Analyzes what files changed since last build
# Selects appropriate mode:
# - Content/*.md only → npm run writing
# - trip.json or multiple .md → npm run build:smart
# - lib/, templates/, or scripts/ → npm run build (full)
# Also available: /build --full, /build --writing <file>
```

**Why:** Reduces decision fatigue; ensures correct mode
**Effort:** Medium (needs git status analysis)
**Impact:** Medium (saves mental overhead, prevents wrong mode)

---

### 🟡 Medium Priority (Quality of Life)

#### 4. **Refactoring Verification Workflow** (`/verify-refactor`)
**What it does:**
```bash
# After refactoring lib/ or scripts/:
1. npm run validate
2. npm run build
3. node scripts/build/build-smart.js
4. node scripts/build/build-writing.js content/trips/greece/athens.md
5. npm test
6. Report: all modes work ✓ or list failures
```

**Why:** Pre-commit verification requirement; currently manual
**Effort:** Low (runs existing scripts sequentially)
**Impact:** Medium (prevents broken builds after refactors)

---

#### 5. **Template Builder Skill** (`/template`)
**What it does:**
```bash
# Creates reusable content templates
/template create nutshell       # Captures pattern from existing content
/template apply nutshell spain  # Applies template to all Spain locations
/template list                  # Shows available templates
```

**Why:** Nutshell rollout plan showed this pattern; likely to repeat
**Effort:** Medium (needs template extraction logic)
**Impact:** Low-Medium (infrequent, but high value when needed)

---

#### 6. **Photo Workflow Wrapper** (`/photos`)
**What it does:**
```bash
/photos sync <takeout.zip>      # Extract + match via GPS
/photos assign <trip>           # Interactive assignment
/photos optimize <trip>         # Optimize images for web
```

**Why:** Simplifies complex photo workflow into one command
**Effort:** Low (wraps existing scripts)
**Impact:** Low (infrequent, but reduces cognitive load)

---

### 🟢 Low Priority (Nice to Have)

#### 7. **Context Sync Hook** (Auto-trigger, not skill)
**What it does:**
- On save of `docs/Content/*.md` → auto-run `npm run build-context`
- Show notification when Context-Combined.md updated

**Why:** Manual check before commits; could be automatic
**Effort:** Low (hook configuration)
**Impact:** Low (rare, but prevents forgotten syncs)

---

#### 8. **Writing Mode Auto-Selector** (Hook enhancement)
**What it does:**
- When saving `.md` file in content/trips/, auto-run writing mode on that file
- Show build time in notification

**Why:** Currently manual: save → switch to terminal → npm run writing
**Effort:** Medium (needs IDE integration via hooks)
**Impact:** Medium (but only for intensive writing sessions)

---

## Things That Should Go in CLAUDE.md

### Add to Development Workflows Section:
```markdown
### Build Mode Decision Tree
- **Changed only .md content?** → `npm run writing` (~5ms per file)
- **Changed trip.json or 2+ .md files?** → `npm run build:smart` (~2-5s per trip)
- **Changed lib/, templates/, scripts/?** → `npm run build` (full, ~10-30s)
- **Not sure?** → `npm run build` (always safe)

### Refactoring Protocol
After any change to lib/, scripts/, templates/, or imports/exports:
1. Run `npm run validate` (linting + tests)
2. Verify all build modes: build, build:smart, writing
3. Run `npm test` (full suite)
4. Check for unintended behavior changes (spot-check output)

### Common Patterns
- **CLI tool duplication?** → Create shared helper in tool-helpers.js or audit-cli-shared.mjs
- **Long function (50+ lines)?** → Extract sub-functions, add JSDoc
- **Magic strings (3+ uses)?** → Extract constant to config or constants file
- **Documentation updated?** → Run `/doc-sync` to verify claims
```

---

## Things That Should Be Hooks

### On File Save Hook:
```json
{
  "hooks": {
    "FileSave": [
      {
        "pattern": "docs/Content/*.md",
        "command": "npm run build-context",
        "notify": "Context-Combined.md updated"
      },
      {
        "pattern": "content/trips/**/*.md",
        "command": "npm run normalize -- --dry-run $FILE",
        "notify": "Typography check"
      }
    ]
  }
}
```

### On Pre-Commit Hook (if not already exists):
```json
{
  "hooks": {
    "PreCommit": [
      {
        "command": "npm run validate",
        "stopOnFailure": true
      }
    ]
  }
}
```

---

## Skills Worth Creating (Priority Order)

### Tier 1: High ROI
1. **`/pre-commit`** — One-command pre-commit validation
2. **`/audit`** — Multi-provider audit orchestration
3. **`/build`** — Intelligent build mode selection

### Tier 2: Quality of Life
4. **`/verify-refactor`** — Post-refactoring verification
5. **`/template`** — Template creation and application
6. **`/photos`** — Photo workflow wrapper

### Tier 3: Nice to Have
7. Context sync hook (auto-trigger)
8. Writing mode auto-selector hook

---

## Session Statistics

- **Total sessions analyzed:** 44
- **Plan files:** 23 (2,327+ lines)
- **Commits (2 months):** 100+
- **Tech debt commits:** 29
- **Documentation sync commits:** 8
- **Audit-related commits:** 15+
- **npm scripts:** 60+
- **Audit scripts:** 12
- **Project-specific skills:** 2 (techdebt, doc-sync)

---

## Workflow Patterns Observed

### Planning Mode Usage
- Kevin ALWAYS wants to read plan files manually (NEVER call ExitPlanMode automatically)
- Extensive planning before implementation (2,327 lines across 23 plans)
- Plans focus on: refactoring, new features, audit system improvements

### Git Workflow
- Strict "ask before commit" protocol (Kevin has reminded Claude 5+ times)
- Pre-commit checks: typography, context sync, validation, tests
- Structured commit messages with Co-Authored-By footer

### Content Iteration
- Heavy use of AI audits (Opus/GPT) for quality scoring
- Target: 8.5+ overall score for "ready" status
- Iterative refinement: "Athens up to 8.52" → edit → "Athens up to 8.71"
- Trip-level coherence checks after individual articles are polished

### Technical Debt Management
- Regular `/techdebt` audits
- Pattern: find duplication → create shared module → migrate incrementally
- Recent example: tool-helpers.js eliminated ~60-80 lines across 4 scripts

### Documentation Discipline
- Frequent doc updates after architectural changes
- `/doc-sync` to catch stale references
- Maintains: CLAUDE.md, README.md, FILES.md, docs/

---

## Automation ROI Analysis

| Skill/Hook | Frequency | Time Saved/Use | Annual Savings | Effort | ROI |
|------------|-----------|----------------|----------------|--------|-----|
| /pre-commit | ~20/month | 2 min | 8 hrs/year | Low | ⭐⭐⭐⭐⭐ |
| /audit | ~40/month | 3 min | 24 hrs/year | Medium | ⭐⭐⭐⭐⭐ |
| /build | ~30/month | 30 sec | 3 hrs/year | Medium | ⭐⭐⭐ |
| /verify-refactor | ~10/month | 5 min | 10 hrs/year | Low | ⭐⭐⭐⭐ |
| /template | ~2/month | 15 min | 1 hr/year | Medium | ⭐⭐ |
| /photos | ~1/month | 2 min | 30 min/year | Low | ⭐⭐ |
| Context sync hook | ~5/month | 1 min | 1 hr/year | Low | ⭐⭐ |

**Total potential time savings: ~47 hours/year**

---

## Implementation Recommendations

### Phase 1: Quick Wins (Week 1)
1. Create `/pre-commit` skill
2. Create `/verify-refactor` skill
3. Add build mode decision tree to CLAUDE.md

### Phase 2: High-Value Automation (Week 2)
1. Create `/audit` skill with provider comparison
2. Create `/build` skill with intelligent mode selection
3. Add refactoring protocol to CLAUDE.md

### Phase 3: Polish (Week 3+)
1. Create `/template` skill
2. Create `/photos` wrapper skill
3. Add file save hooks for context sync and typography

---

## Notes

- Kevin's workflow is highly disciplined and systematic
- Strong preference for automation via skills over manual checklists
- Git commit protocol is CRITICAL (never auto-commit, always ask first)
- Planning mode is sacred (never auto-exit, Kevin reads plans manually)
- Documentation drift is a constant battle (doc-sync helps but could be more proactive)
- Build system has 3 modes optimized for different scenarios (smart design, but mode selection is manual)
- Audit workflow is sophisticated (multi-provider, history tracking, trip-level) but fragmented
