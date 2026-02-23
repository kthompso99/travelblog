# Plan: Remote Writing Studio for Tiffany

## Context
Kevin wants Tiffany to edit blog content from her laptop without installing git or any tools. Two separate files, each doing one thing well:

- **`writingstudio.html`** — Kevin's local editor. Already built. Uses File System Access API. No changes.
- **`writingstudio-remote.html`** — Tiffany's remote editor. Deployed to GitHub Pages. Uses GitHub API. New file.

Both share the same linting engine (copy, not shared import — keeps each file self-contained as a single HTML file with no dependencies beyond the CodeMirror CDN).

---

## Tiffany's Experience

### First visit
```
┌─────────────────────────────────────────────────┐
│  TTN Writing Studio                              │
│                                                   │
│  Enter your access token to get started:          │
│  ┌──────────────────────────────────┐             │
│  │ ghp_xxxxxxxxxxxxxxxxxxxx         │             │
│  └──────────────────────────────────┘             │
│  [Connect]                                        │
│                                                   │
│  (Kevin will give you this token)                 │
└─────────────────────────────────────────────────┘
```
Tiffany pastes the token Kevin gave her. Stored in localStorage — never asked again.

### After connecting (and on every subsequent visit)
```
┌──────────────────────────────┬───────────────────┐
│                              │ TTN Writing Studio │
│                              │                   │
│                              │ ▼ spain            │
│                              │   cordoba.md      │
│   (editor area)              │   malaga.md       │
│   (empty until file picked)  │   seville.md      │
│                              │ ▶ greece           │
│                              │ ▶ utah             │
│                              │                   │
│                              │ ─────────────────  │
│                              │ Words: 0          │
│                              │ Sentences: 0      │
│                              │ Avg length: 0     │
│                              │ ─────────────────  │
│                              │ Rules legend...    │
└──────────────────────────────┴───────────────────┘
```
The sidebar shows a collapsible file tree of `content/trips/`. Tiffany clicks a trip folder to expand it, then clicks a `.md` file to open it.

### Editing
```
┌──────────────────────────────┬───────────────────┐
│                              │ TTN Writing Studio │
│  Cordoba was 100% the best  │                   │
│  surprise of the trip...     │ cordoba.md        │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░  │ Draft saved       │
│  (highlighted sentences)     │                   │
│                              │ [Publish]         │
│                              │                   │
│                              │ ▼ spain            │
│                              │   cordoba.md  ●   │
│                              │   malaga.md       │
│                              │ ...               │
└──────────────────────────────┴───────────────────┘
```

- **Cmd-S** saves a draft to localStorage. Shows "Draft saved" in green. Instant, no GitHub call.
- The file tree shows a ● dot next to files with unsaved drafts.
- **Publish button** commits to GitHub. Shows "Published" then fades. The ● clears.
- If Tiffany reopens a file that has a local draft newer than GitHub, the editor asks: "You have an unsaved draft from [time]. Restore it?"

### States in the sidebar
| State | Indicator |
|---|---|
| File just loaded from GitHub | (nothing) |
| Edited but not draft-saved | amber "Edited" |
| Draft saved (Cmd-S) | green "Draft saved" (fades) |
| Published to GitHub | green "Published" (fades) |
| Publish failed (SHA conflict) | red "Conflict — reload file" |

---

## Technical Design

### File tree (sidebar)
1. On page load, fetch trip directories: `GET /repos/kthompso99/travelblog/contents/content/trips/`
2. Click a trip → fetch .md files: `GET /repos/.../contents/content/trips/{trip}/`
3. Click a .md file → fetch content: `GET /repos/.../contents/content/trips/{trip}/{file}` (base64-decoded)
4. Store the file's `sha` (GitHub requires it for the PUT to prevent conflicts)
5. Cache the directory listing so navigating between trips doesn't re-fetch

### Save (Cmd-S) — local draft
- Key: `draft:{trip}/{file}` in localStorage
- Value: `{ content: "...", timestamp: Date.now() }`
- Also store `github:{trip}/{file}` with the last-fetched content + SHA for comparison

### Publish button
- `PUT /repos/kthompso99/travelblog/contents/content/trips/{trip}/{file}`
- Body: `{ message: "Update {file}", content: base64(editorContent), sha: storedSha }`
- On success: update stored SHA from response, clear draft, show "Published"
- On 409 (conflict): show "Conflict — someone else edited this file. Reload to get the latest version."

### Auth
- Fine-grained PAT created by Kevin at github.com/settings/tokens
- Scoped to `kthompso99/travelblog`, permission: "Contents: Read and write"
- Stored in localStorage under key `github_token`
- "Sign out" link clears it and shows the token input again
- All API calls: `Authorization: Bearer {token}`, `Accept: application/vnd.github.v3+json`

### What stays the same (copied from writingstudio.html)
- CodeMirror 5 editor setup
- All CSS (sentence highlighting, word underlines, tooltip)
- Constants: HEDGE_WORDS, VAGUE_WORDS, WEAK_STARTERS, IRREGULAR_PARTICIPLES, PASSIVE_REGEX
- Functions: isNonProse, neutralizeMarkdown, stripForAnalysis, protectAbbreviations, splitSentencesWithPositions, checkSentence, highlightWordsInRange, lintText, clearMarks, updateStats
- Custom tooltip system (markTooltips WeakMap, mousemove handler)

---

## Deployment
- Add `writingstudio-remote.html` to the copy list in `.github/workflows/deploy.yml`
- Tiffany visits `https://twotravelnuts.com/writingstudio-remote.html`
- `writingstudio.html` stays local-only (not deployed)

## Files Modified
- **New:** `writingstudio-remote.html` — self-contained remote editor
- **Edit:** `.github/workflows/deploy.yml` — add to deploy copy list

## What This Does NOT Handle
- Creating new files or trips (Kevin only)
- Image upload (Kevin only)
- Simultaneous editing of the same file (coordinate verbally)

## Verification
1. Open `writingstudio.html` locally → still works as before (no changes)
2. Deploy → visit `https://twotravelnuts.com/writingstudio-remote.html`
3. Enter PAT → file tree loads
4. Click spain → cordoba.md → content loads with linting
5. Edit → Cmd-S → "Draft saved" (check localStorage)
6. Close tab, reopen, click cordoba.md → "Restore draft?" prompt
7. Click Publish → check GitHub repo for new commit
8. Edit on GitHub directly → reopen in editor → SHA conflict on publish → error shown
