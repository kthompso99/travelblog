# Two Travel Nuts -- Editorial Standards

This document defines what quality means.

It is the only philosophical source of truth for scoring.

The goal is not formatting perfection.
The goal is durable, confident, well-crafted travel writing.

---

## Two Content Types

TTN pages are either **locations** or **articles**. Treat them differently.

**Location pages** cover a specific place (city, camp, region). They always end with a `:::nutshell` block. Pull quote suggestions apply. Editorial checklist applies in full.

**Article pages** provide background, context, or cultural commentary. Articles do NOT get nutshell blocks. They do not need Decision Clarity scoring. Pull quotes still apply if a strong candidate exists. Evaluate them on Prose Control, Narrative Clarity, Opening Strength, Brand Alignment, and Distinctiveness only.

When reviewing a file, identify which type it is before applying standards.

---

## TTN Nutshell Format

Each location page ends with a Nutshell block. This uses a custom SSG directive -- not standard markdown. Always use exactly this format:
```
:::nutshell [Location Name]
verdict: [Would Plan Around / Glad We Went / Lovely but Optional / Skip]
duration: [specific duration, e.g. "2 days", "5 hours"]
Stay Overnight: [one sentence on accommodation]
Don't Miss: [specific sightings or experiences, not generic]
Best Time of Day: [specific, with reason]
Worth the Splurge: [honest assessment]
Return Visit: [honest answer]
:::
```

The opening line is `:::nutshell [Location Name]` and the closing line is `:::` -- no other punctuation. `verdict` and `duration` are header-level metadata (not rendered as field rows). Field names are exact (Stay Overnight, Don't Miss, Best Time of Day, Worth the Splurge, Return Visit). Values should be concise, specific, and in TTN voice -- no hype words, no exclamation marks.

For short-stay pages, "Stay Overnight: We didn't" is a valid and complete response -- not a gap to be filled.

---

## Location Page Variants: Full vs. Short-Stay

Location pages are classified by the `duration` field in the nutshell block.

- **Full-stay pages**: duration measured in days (e.g., `duration: 3 days`)
- **Short-stay pages**: duration measured in hours (e.g., `duration: 5 hours`)

Short-stay pages are still location pages -- they get a nutshell block, pull quotes apply, and voice standards are identical. But three dimensions are scored differently:

**Narrative Arc** -- A full-stay page is expected to move from orientation through experience to evaluation. A short-stay page only needs a clear thesis ("here's what we got out of it and whether the detour was worth it") and honest acknowledgment of what the limited time did and didn't allow. Descriptive sequencing without evaluation still cannot score above 8.4, but the arc is permitted to be shorter.

**Decision Clarity** -- The key question shifts. A full-stay page must answer: where to stay, where to eat, how to get around. A short-stay page must answer: is this worth a detour, how much time does it need, and what's the one thing not to miss. Thin or N/A responses to Stay Overnight and Worth the Splurge are expected and should not penalize the score.

**Distinctiveness** -- A short visit limits the depth of perspective available. Credit comes from honesty about those constraints, not from breadth of coverage. A short-stay page that clearly articulates what a few hours can and can't tell you is more distinctive than one that overstates its conclusions.

Launch threshold is the same: Overall >= 8.5, no dimension below 8.0.

---

## Rating Philosophy

- 9.5+ -> Exceptional craft and clarity. Rare.
- 9.0-9.4 -> Excellent. Strong voice, strong arc, polished prose.
- 8.5-8.9 -> Launch-ready. Minor refinements only.
- 8.0-8.4 -> Strong but not fully polished.
- 7.5-7.9 -> Competent but lacking authority or cohesion.
- Below 7.5 -> Structurally or narratively weak.

Launch readiness requires:
- Overall >= 8.5
- No dimension below 8.0

---

## Core Dimensions

There are six dimensions.

---

### 1. Prose Control & Structure (25%)

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

### 2. Narrative Clarity & Arc (25%)

Measures coherence and strength of progression.

An 8.5+ piece demonstrates:

- A clear thesis
- Logical movement from orientation -> experience -> evaluation
- Sustained evaluative throughline
- Emotional or intellectual progression
- Clear reason the reader should care

Descriptive sequencing alone cannot score above 8.4.

Presence of an arc is not enough.
Strength and consistency of the arc determine score.

---

### 3. Opening Strength (15%)

An effective opening:

- Establishes stakes quickly
- Signals evaluative stance
- Avoids generic framing
- Introduces the central idea or tension

The opening should anchor the thesis.

---

### 4. Brand Alignment (15%)

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

### 5. Distinctiveness (10%)

Measures originality of framing and insight.

High scores require:

- Memorable perspective
- Clear evaluative differentiation
- Thoughtful comparative insight
- Intentional restraint

Logistical thoroughness alone does not equal distinctiveness.

---

### 6. Decision Clarity (10%)

Measures how clearly the article helps a reader decide.

High scores require:

- Clear overall stance
- Explicit or implicit "who it's for"
- Tradeoffs acknowledged
- Return intent addressed
- A structured summary section (e.g., "In a Nutshell," "Verdict," or equivalent)

Presence of a strong summary device materially improves this score.

Formatting purity is secondary.
Decision usefulness is primary.

---

## Structural Expectations

- Subheads should support skim behavior.
- Long explanations are acceptable if readable.
- Historical context must connect to visitor experience.
- Placeholder text must not remain in published drafts.

Structural flaws reduce Prose Control.
Weak summaries reduce Decision Clarity.

---

## SSG Photo Gallery Note

The static site generator places all photos after the line `*Add your photos here*` into a photo gallery. Photos placed inline in the prose are editorial choices -- they anchor specific moments in the narrative. Gallery photos are supporting shots. Inline photos should earn their place.

---

## Typography

Source files use ASCII-only characters -- straight quotes, double hyphens (`--`) for em dashes, three periods for ellipses. The build pipeline converts to typographic characters in rendered HTML. A pre-commit hook enforces this automatically.

### Source Formatting Notes

Source files may contain double spaces after periods. This is intentional and should not be flagged during editorial review.
Spacing normalization is handled by the rendering pipeline. 

---

## Editorial Checklist (Quick Reference)

Use this for rapid review of any draft:

1. **Opening** -- does it earn attention before giving information?
2. **Best observation** -- is it prominent or buried?
3. **Tradeoffs** -- are they explicit? Every major recommendation needs a "but also."
4. **Honesty about gaps** -- are limitations acknowledged?
5. **Section headers** -- are they doing real work or just labeling categories?
6. **Logistics** -- specific and actionable? In the right place?
7. **Voice** -- does it sound like Kevin and Tiffany, not a travel brochure?
8. **Hype words** -- amazing, stunning, incredible, breathtaking, unforgettable, magical. Replace with the specific detail that earned the adjective.
9. **Inline photos** -- do they anchor specific narrative moments, or should they go to the gallery?
10. **Nutshell** -- complete and honest?
11. **Pull Quotes** -- identified and suggested? (See below.)

## Pull Quote Guidelines

When suggesting pull quotes, first check whether the document already contains blockquotes (lines beginning with >). If 2 or more blockquotes are already present, skip the pull quote suggestion entirely -- the author has already made those choices. If fewer than 2 blockquotes exist, suggest enough to bring the total to 2, with a brief note on why each works.

For short-stay pages (duration in hours), one blockquote is sufficient. If one strong candidate exists, that meets the standard.

A good TTN pull quote:

- Is a complete sentence or tight fragment that works without context
- Contains a specific surprising fact, a honest admission, or a dry observation
- Sounds like a person talking, not a brochure
- Would make a reader pause if they saw it in large type while scanning the page

Do NOT suggest pull quotes that are held in the Nutshell code block.

Avoid pull quotes that:

- Require the surrounding paragraph to make sense
- Use hype language ("breathtaking," "unforgettable")
- Are generic enough to apply to any travel destination
- Are the obvious "best" line -- pull quotes reward the scanner, so they should surface something a quick reader might otherwise miss

When suggesting pull quotes, present them as a short list at the end of your editorial response, labeled "Suggested pull quotes:" with a brief note on why each one works.