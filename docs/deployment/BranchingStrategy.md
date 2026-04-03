# Git Branching & Release Strategy for Travel Blog

## Overview

This repository contains several distinct types of work:

1. **Content** — Trip-based markdown files (e.g., `content/trips/spain/madrid.md`)
2. **Infrastructure (SSG)** — Static site generator, and supporting code
3. **Auditing** -- files that are around auditing content with an LLM for style/consistency/correctness issues.

These evolve at different cadences and require different release strategies. This document defines a lightweight, single-developer Git workflow that:

* Keeps production history clean
* Allows high-frequency local iteration
* Separates “work in progress” from “public content”
* Supports reproducible releases

## Background
Kevin uses a workflow of:
* Creating a single article (madrid.md)
* Auditing that file using an LLM (95% Claude right now) to get socres and feedback
* Hand-editing (in VSCode) the article 
* Repeat (re-audit)
* Until the score is 'high enough', roughly defined as >8.5, but trying to get close to 9.0.

This process started all with "npm run" commands.  Kevin found the cognitive load of remembering all of the commands onerous/repetitive, and also found switching between VSCode->Terminal (to run a npm command)->review audit onerous.  We co-designed audit-runner.html, which started as a way to 'just' execute and review audits. 

Recently we added 'commit' and 'push' buttons to audit-runner, and Kevin realized that it's now becoming a full content management UI.  In this document we want to clarify that 
**The Content Management UI and the NPM Commands Must Stay in Sync*

Kevin is evolving content management UI, currently called audit-runner but possibly being renamed.  That UI has buttons that are various "verbs" like "commit" and "push" -- none of these buttons should invoke more than one command, they should be wrappers for well-defined shell-visible commands so that the terminal and UI have exactly the same business logic.


---

## Core Principles

1. **`main` is always production**

   * Only contains content and code that are safe to publish
   * Every commit corresponds to a meaningful public state

2. **Work happens in branches**

   * Content and infrastructure changes are isolated until ready

3. **Releases are explicit**

   * Publishing is a deliberate action, not a side effect of pushing

4. **Tags define what was published**

   * Tags are the canonical record of public versions



---

## Branch Structure

### 1. `main` (Production)

* Source of truth for the live site
* Clean, minimal history
* Updated only via intentional merges

---

### 2. Content Branches: `draft/<trip>`

Each trip has its own working branch:

```bash
draft/spain
draft/greece
draft/botswana
draft/new-zealand
```

**Purpose:**

* Iterative writing and LLM-audited refinement
* Frequent commits (checkpointing encouraged)
* Safe space for experimentation

---

### 3. Infrastructure Branch: `dev`

```bash
dev
```

**Purpose:**

* All SSG and audit script development
* Lower frequency, higher impact changes
* Staging area before production

---

## Workflow

---

### A. Daily Content Workflow

```bash
git checkout draft/spain
```

* Edit content
* Run audit scripts
* Commit frequently (local checkpoints)
* Push occasionally for backup

Example commit messages:

```bash
content(madrid): 8.35=>8.70 refine opening section
content(seville): 7.55=>8.50 restructure dining section
```

---

### B. Publishing Content (Per Trip)

Publishing is a **promotion from draft → production**.  There should be a single command that summarizes all these steps into one step, so that it can be called from either a command line or Kevin's content management UI.

```bash
git checkout main
git merge --squash draft/spain
git commit -m "content(spain): publish v1.0 (all locations ≥8.5)"
git tag content/spain/v1.0
git push origin main --tags
```

**Key properties:**

* Squash merge keeps history clean
* One commit = one publish event
* Tag marks the exact public version

---

### C. Continuing Work After Publish

```bash
git checkout draft/spain
```

* Continue improving content (8.6 → 9.0, etc.)
* No impact on production until next publish

---

### D. Republishing Updated Content

```bash
git checkout main
git merge --squash draft/spain
git commit -m "content(spain): refine v1.1"
git tag content/spain/v1.1
git push origin main --tags
```


---

### E. Infrastructure (SSG) Workflow

Work happens in `dev`:

```bash
git checkout dev
```

* Modify SSG or audit scripts
* Commit normally

Example:

```bash
ssg: improve markdown parsing for location blocks
audit: adjust scoring weights
```

---

### F. Releasing Infrastructure

```bash
git checkout main
git merge dev
git commit -m "infra: release v1.2 (rendering improvements)"
git tag infra/v1.2
git push origin main --tags
```

**Notes:**

* Do NOT squash (preserve meaningful code history)
* Impacts entire site

---

### G. Combined Changes (Content + Infra)

If content depends on new SSG behavior:

```bash
git checkout main
git merge dev
git merge --squash draft/spain
git commit -m "content(spain): publish v1.2 (requires infra v1.2)"
git tag content/spain/v1.2
git push origin main --tags
```

---

## Versioning Strategy

### Content Tags (Per Trip)

```bash
content/spain/v1.0
content/spain/v1.1
content/greece/v1.0
```

### Infrastructure Tags

```bash
infra/v1.0
infra/v1.1
```

---

## When to Publish

### Required Condition

* All locations in a trip ≥ 8.5 (your rule)

### Additional Heuristic

Publish when changes are **user-visible**, not just score improvements.

Good reasons to publish:

* Multiple locations improved meaningfully
* Structural or narrative improvements
* Major rewrite of a key location

Avoid publishing for:

* Minor score changes (e.g., 8.82 → 8.87)
* Cosmetic edits

---

## Commit Guidelines

### Content (draft branches)

* Frequent, informal, iterative

### Content (main)

* One commit per publish
* Clean, descriptive

Example:

```bash
content(spain): publish v1.0
```

---

### Infrastructure

* Clear, technical descriptions

Example:

```bash
ssg: add support for structured content blocks
```

---

## What Not to Do

* Do NOT commit directly to `main`
* Do NOT use a single shared `drafts` branch
* Do NOT use GitHub labels for versioning
* Do NOT push every micro-change to production
* Do NOT tightly couple content to unreleased SSG changes

---

## Optional Enhancements

## `publish` Command Specification

### Overview

The `publish` command promotes a completed draft branch (e.g., `draft/spain`) into `main` as a single, clean, production-ready commit.

It enforces quality, eliminates intermediate history, and ensures that all content is evaluated against the current audit logic at the moment of publication.

---

### Usage

```bash
./publish <target>
---

### 2. Backup Strategy

* Push draft branches periodically
* Local commits are safe, but remote adds redundancy

---

## Mental Model

| Concept   | Meaning             |
| --------- | ------------------- |
| `draft/*` | your notebook       |
| `dev`     | your workshop       |
| `main`    | your published book |
| tags      | edition numbers     |

---

## Summary

* Use **per-trip draft branches** for content
* Use **one `dev` branch** for infrastructure
* Keep **`main` clean and production-only**
* Use **tags for all releases**
* Publish deliberately, not continuously

This approach scales cleanly to:

* 50+ trips
* ongoing refinement
* independent content releases
* controlled infrastructure evolution

---
