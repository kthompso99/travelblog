# .claude/

Project-specific Claude Code configuration and skills.

## skills/

Custom skills for this project. These are version-controlled so they're available across machines and preserved in the repo.

To use these skills in Claude Code, either:
1. **Symlink** (recommended): `ln -s $(pwd)/.claude/skills/techdebt.md ~/.claude/skills/techdebt/SKILL.md`
2. **Copy**: Copy the skill file to `~/.claude/skills/techdebt/SKILL.md`
3. **Load directly**: Claude Code may automatically discover skills in `.claude/skills/` (if supported)

### Available Skills

- **techdebt.md** — Analyzes codebase for technical debt, code duplication, long functions, and outdated patterns. Focus on scripts/build/, scripts/audit/, scripts/tools/, lib/ directories.
