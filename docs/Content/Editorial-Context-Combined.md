# TTN Editorial Context
## How To Use This File

Upload this file at the start of any AI session where you want editorial review or writing assistance.

Then say: "Please review [filename] against my editorial standards" or "Please draft/edit [content] keeping TTN standards in mind."

This file contains three things in order:
1. Brand Identity
2. Editorial Standards
3. Anti-AI Writing Guidelines

---

# PART 1: Two Travel Nuts — Brand Identity

## Core Positioning

**Thoughtful, well-paced travel for adults who value depth over volume.**

We are not chasing highlights.
We are not selling aesthetics.
We are not optimizing for algorithms.

We are documenting journeys carefully, honestly, and without exaggeration.

> Exploring well matters more than exploring often.

That line governs editorial choices.

---

## Who We Are

- Mature travelers
- Curious and historically engaged
- Comfortable without apology
- Honest about tradeoffs
- Reflective about experience
- Willing to say "it was fine"

Restraint is our differentiator.

---

## Who We Are Not

- Backpackers racing highlights
- Luxury influencers selling aspiration
- SEO listicle publishers
- Travel hackers
- Digital nomad lifestyle content

We occupy the middle: **Comfortable + Curious + Reflective**

---

## Audience

We write for adults 40+, or anyone who travels like they are 40+. Readers who value comfort, culture, and nuance. People who prefer judgment over hype.

We assume intelligence. We do not oversimplify.

---

## Tone Pillars

**Considered.** We evaluate. We do not merely report.

**Honest.** "Nice, but not a highlight" builds trust.

**Structured.** We think in journeys, not posts.

**Calmly Confident.** No hype. No urgency. No exclamation marks.

**Specific.** Avoid travel clichés. Replace adjectives with detail.

---

## The Differentiator

Most travel content refuses to say: *It was fine.*

We are willing to say that.

Trust comes from discernment. Discernment requires restraint.

---

## SSG Photo Gallery Note

The static site generator places all photos after the line `*Add your photos here*` into a photo gallery. Photos placed inline in the prose are editorial choices — they anchor specific moments in the narrative. Gallery photos are supporting shots. Inline photos should earn their place.

---

## Two Content Types

TTN pages are either **locations** or **articles**. Treat them differently.

**Location pages** cover a specific place (city, camp, region). They always end with a `:::nutshell` block. Pull quote suggestions apply. Editorial checklist applies in full.

**Article pages** provide background, context, or cultural commentary. Articles do NOT get nutshell blocks. They do not need Decision Clarity scoring. Pull quotes still apply if a strong candidate exists. Evaluate them on Prose Control, Narrative Clarity, Opening Strength, Brand Alignment, and Distinctiveness only.

When reviewing a file, identify which type it is before applying standards.

---

## TTN Nutshell Format

Each location page ends with a Nutshell block. This uses a custom SSG directive — not standard markdown. Always use exactly this format:

```
:::nutshell [Location Name]
verdict: [Would Plan Around / Glad We Went / Lovely but Optional / Skip]
Stay Overnight: [one sentence on accommodation]
Don't Miss: [specific sightings or experiences, not generic]
Best Time of Day: [specific, with reason]
Worth the Splurge: [honest assessment]
Return Visit: [honest answer]
:::
```

The opening line is `:::nutshell [Location Name]` and the closing line is `:::` — no other punctuation. Field names are exact (verdict, Stay Overnight, Don't Miss, Best Time of Day, Worth the Splurge, Return Visit). Values should be concise, specific, and in TTN voice — no hype words, no exclamation marks.

---

# PART 2: Two Travel Nuts — Editorial Standards

This document defines what quality means. The goal is durable, confident, well-crafted travel writing.

## Rating Philosophy

- 9.5+ → Exceptional craft and clarity. Rare.
- 9.0–9.4 → Excellent. Strong voice, strong arc, polished prose.
- 8.5–8.9 → Launch-ready. Minor refinements only.
- 8.0–8.4 → Strong but not fully polished.
- 7.5–7.9 → Competent but lacking authority or cohesion.
- Below 7.5 → Structurally or narratively weak.

Launch readiness requires: Overall ≥ 8.5, no dimension below 8.0.

---

## Core Dimensions

### 1. Prose Control & Structure (25%)

High scores require clean declarative phrasing, minimal filler, strong verbs, reduced hedging, controlled rhythm, clear transitions, and paragraphs that remain readable on screen.

Penalize: repetitive phrasing, overuse of intensifiers, hedging clusters, long sentence streaks without variation, paragraphs that feel visually overwhelming.

Reward: sentence-level authority, tight phrasing, confident evaluative tone, deliberate structural control.

### 2. Narrative Clarity & Arc (25%)

An 8.5+ piece demonstrates a clear thesis, logical movement from orientation to experience to evaluation, sustained evaluative throughline, and clear reason the reader should care. Descriptive sequencing alone cannot score above 8.4.

### 3. Opening Strength (15%)

An effective opening establishes stakes quickly, signals evaluative stance, avoids generic framing, and introduces the central idea or tension.

### 4. Brand Alignment (15%)

High scores require calm confidence, mature restraint, clear ownership of judgment, no hype language, no influencer tone.

### 5. Distinctiveness (10%)

High scores require memorable perspective, clear evaluative differentiation, thoughtful comparative insight, intentional restraint. Logistical thoroughness alone does not equal distinctiveness.

### 6. Decision Clarity (10%)

High scores require clear overall stance, explicit or implicit "who it's for," tradeoffs acknowledged, return intent addressed, and a structured summary section (Nutshell or equivalent).

---

## Structural Expectations

- Subheads should support skim behavior.
- Long explanations are acceptable if readable.
- Historical context must connect to visitor experience.
- Placeholder text must not remain in published drafts.

---

# PART 3: Anti-AI Writing Guidelines

The goal is eliminating statistical writing patterns that LLMs default to.

## Content Patterns to Eliminate

**Inflated importance framing.** Flag and remove: "pivotal moment," "key turning point," "crucial role," "significant shift," "testament to," "lasting legacy," "marks a new era," "evolving landscape." State what happened. Let the reader decide significance.

**Generic broader impact statements.** Remove any sentence that could apply to 50 other topics or adds interpretation without new information. If deleting it changes nothing, it was filler.

**Overstated cultural or emotional meaning.** Unless writing literary analysis, cut sentences like "This stands as a symbol of resilience" or "It embodies innovation and transformation." Humans don't assign metaphor to everything.

**Forced challenges and future outlook sections.** Don't manufacture a balanced conclusion. Real writing stops when the thought ends.

## Language Patterns to Remove

**AI vocabulary clusters.** Flag and replace: additionally, crucial, delve, highlight, underscore, enhance, foster, pivotal, showcase, intricate, landscape, testament, vibrant, valuable, meticulous, align with, bolster, garner, enduring. One word is fine. A cluster is a red flag.

**Avoiding "is" and "has."** Replace "serves as," "features," "offers," "boasts," "represents," "marks" with simpler verbs: is, has, does.

**Negative parallelisms.** Cut habitual use of "Not only X, but also Y," "It's not just..., it's...," "This is not..., but rather..." Use occasionally, not as a default.

**Rule of three overuse.** "Innovation, efficiency, and growth." Once is fine. Repeated rhythmic triples are synthetic.

## Structural Tells

**Slide-deck list formatting.** Avoid: 1. Heading: Explanation / 2. Heading: Explanation. Vary structure. Use paragraphs. Break predictable symmetry.

**Overuse of em dashes.** Humans use them sparingly. If you see 4+ in short writing, reduce them.

**Bold headers for every sub-topic.** Animal-by-animal bold headers in a safari piece, or category-by-category bold headers in any piece, is AI template behavior. Use prose transitions instead.

## Authority and Attribution Red Flags

Remove vague authority references: "Experts argue," "Industry leaders believe," "Widely recognized as." Name it or delete it.

## Final Humanization Filter

Before publishing, delete every sentence that:
- Interprets without evidence
- Assigns importance abstractly
- Connects to vague broader trends
- Uses 2+ AI vocabulary words
- Sounds like a keynote speech

AI expands. Humans compress. Constraint creates voice.

---

# PART 4: Editorial Checklist (Quick Reference)

Use this for rapid review of any draft:

1. **Opening** — does it earn attention before giving information?
2. **Best observation** — is it prominent or buried?
3. **Tradeoffs** — are they explicit? Every major recommendation needs a "but also."
4. **Honesty about gaps** — are limitations acknowledged?
5. **Section headers** — are they doing real work or just labeling categories?
6. **Logistics** — specific and actionable? In the right place?
7. **Voice** — does it sound like Kevin and Tiffany, not a travel brochure?
8. **Hype words** — amazing, stunning, incredible, breathtaking, unforgettable, magical. Replace with the specific detail that earned the adjective.
9. **Inline photos** — do they anchor specific narrative moments, or should they go to the gallery?
10. **Nutshell** — complete and honest?
11. **Pull Quotes** — identified and suggested? (See below.)

## Pull Quote Guidelines

When reviewing or drafting any location page, suggest 1-2 pull quotes at the end of your response.

A good TTN pull quote:

- Is a complete sentence or tight fragment that works without context
- Contains a specific surprising fact, a honest admission, or a dry observation
- Sounds like a person talking, not a brochure
- Would make a reader pause if they saw it in large type while scanning the page

Avoid pull quotes that:

- Require the surrounding paragraph to make sense
- Use hype language ("breathtaking," "unforgettable")
- Are generic enough to apply to any travel destination
- Are the obvious "best" line — pull quotes reward the scanner, so they should surface something a quick reader might otherwise miss

When suggesting pull quotes, present them as a short list at the end of your editorial response, labeled "Suggested pull quotes:" with a brief note on why each one works.
