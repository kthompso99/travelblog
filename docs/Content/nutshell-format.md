# Nutshell Block Format

When suggesting "In a Nutshell" content for a location, use this fenced block format:

```
:::nutshell Location Name
verdict: Would Plan Around
Stay Overnight: Your answer here — can include [markdown links](https://example.com) and **bold**.
Don't Miss: What's unmissable about this place.
Best Time of Day: When to visit for best experience.
Worth the Splurge: Premium experience recommendation.
Return Visit: Whether it's worth coming back.
:::
```

## Rules

- The block starts with `:::nutshell` followed by the location name
- `verdict` is one of: "Would Plan Around", "Glad We Went", or "Lovely but Optional"
- The 5 fields (Stay Overnight, Don't Miss, Best Time of Day, Worth the Splurge, Return Visit) are always present
- Field values support inline markdown (links, bold, italic)
- The block ends with `:::` on its own line
- Place the block near the end of the location's .md file, before `*Add your photos here*`

## Example (Ronda)

```
:::nutshell Ronda
verdict: Would Plan Around
Stay Overnight: Absolutely — the bridge lit up alone is worth the overnight.
Don't Miss: The Puente Nuevo from below; Cueva Pileta if you plan ahead.
Best Time of Day: Late afternoon light from the gorge viewpoints.
Worth the Splurge: A room with a gorge view at Montelirio.
Return Visit: Yes. This is a place worth lingering in, not just checking off.
:::
```

## Usage with LLMs

Paste this file (or its contents) as context when asking Claude.ai, ChatGPT, or other LLMs to read location .md files and suggest nutshell content. This ensures they produce output in the correct format.
