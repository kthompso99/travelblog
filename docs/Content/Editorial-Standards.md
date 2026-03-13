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
# Two Travel Nuts — Editorial Standards

This document defines what quality means.

It is the only philosophical source of truth for scoring.

The goal is not formatting perfection.
The goal is durable, confident, well-crafted travel writing.

---

# Rating Philosophy

- 9.5+ → Exceptional craft and clarity. Rare.
- 9.0–9.4 → Excellent. Strong voice, strong arc, polished prose.
- 8.5–8.9 → Launch-ready. Minor refinements only.
- 8.0–8.4 → Strong but not fully polished.
- 7.5–7.9 → Competent but lacking authority or cohesion.
- Below 7.5 → Structurally or narratively weak.

Launch readiness requires:
- Overall ≥ 8.5
- No dimension below 8.0

---

# Core Dimensions

There are six dimensions.

---

## 1. Prose Control & Structure (25%)

This measures sentence-level craft AND structural hygiene.

High scores require:

- Clean declarative phrasing
- Minimal filler or slack wording
- Strong verbs
- Reduced hedging
- Controlled rhythm and pacing
- Clear transitions
- Paragraphs that remain readable on screen

Density alone is not a flaw.

Penalize:
- Repetitive phrasing
- Overuse of intensifiers
- Hedging clusters
- Long sentence streaks without variation
- Paragraphs that feel visually overwhelming

Reward:
- Sentence-level authority
- Tight phrasing
- Confident evaluative tone
- Deliberate structural control

This dimension captures writing quality, not just formatting.

---

## 2. Narrative Clarity & Arc (25%)

Measures coherence and strength of progression.

An 8.5+ piece demonstrates:

- A clear thesis
- Logical movement from orientation → experience → evaluation
- Sustained evaluative throughline
- Emotional or intellectual progression
- Clear reason the reader should care

Descriptive sequencing alone cannot score above 8.4.

Presence of an arc is not enough.
Strength and consistency of the arc determine score.

---

## 3. Opening Strength (15%)

An effective opening:

- Establishes stakes quickly
- Signals evaluative stance
- Avoids generic framing
- Introduces the central idea or tension

The opening should anchor the thesis.

---

## 4. Brand Alignment (15%)

Measures tone and voice alignment with Two Travel Nuts.

High scores require:

- Calm confidence
- Mature restraint
- Clear ownership of judgment
- No hype language
- No influencer tone

Confidence is rewarded.
Caution without stance is not.

---

## 5. Distinctiveness (10%)

Measures originality of framing and insight.

High scores require:

- Memorable perspective
- Clear evaluative differentiation
- Thoughtful comparative insight
- Intentional restraint

Logistical thoroughness alone does not equal distinctiveness.

---

## 6. Decision Clarity (10%)

Measures how clearly the article helps a reader decide.

High scores require:

- Clear overall stance
- Explicit or implicit “who it’s for”
- Tradeoffs acknowledged
- Return intent addressed
- A structured summary section (e.g., “In a Nutshell,” “Verdict,” or equivalent)

Presence of a strong summary device materially improves this score.

Formatting purity is secondary.
Decision usefulness is primary.

---

# Structural Expectations

- Subheads should support skim behavior.
- Long explanations are acceptable if readable.
- Historical context must connect to visitor experience.
- Placeholder text must not remain in published drafts.

Structural flaws reduce Prose Control.
Weak summaries reduce Decision Clarity.

---

# Typography: Quotation Marks & Apostrophes

TTN source files (.md) use **all-straight ASCII quotes**. The build pipeline automatically converts to typographic curly quotes in the rendered HTML.

- **In source files**: Write `wasn't`, `"marble town"`, `Kevin's` — straight quotes only.
- **Never use** curly quotes in source files. The build handles typography.
- **Single-quote scare quotes**: Do not use. Use double quotes for emphasis/scare quotes. Example: `'lanes'` should be `"lanes"`.
- **Cleanup tool**: `npm run normalize` flattens any curly quotes back to ASCII.
- **Audit**: `npm run audit` flags curly quotes in source and single-quote scare quotes.

---

# Typography: Dashes

TTN source files (.md) use **ASCII hyphens only**. The build pipeline automatically converts to typographic dashes in the rendered HTML.

- **Em dash**: Write `--` (double hyphen) in source. Build converts to — (U+2014). Example: `Six hours was a tease -- Naxos deserves two nights.`
- **Numeric ranges**: Write a regular hyphen between digits. Build converts to en dash (U+2013). Example: `5-8 minute walk` renders as `5–8 minute walk`.
- **Never use** Unicode em dashes or en dashes in source files. The build handles typography.
- **Cleanup tool**: `npm run normalize` flattens any Unicode dashes back to ASCII.
- **Audit**: `npm run audit` flags Unicode dashes in source.
- **AI tools note**: Claude, GPT, and Gemini all output Unicode dashes in their responses. Run `npm run normalize` after pasting from AI editing sessions.