# Slash Command Outliner Scripts

All scripts are deterministic (no LLM). They exist to prove corpus coverage and enforce non-regression.

## Common

Run from repo root.

## Scan corpus (rebuild a command list)

```bash
node .claude/skills/slash-command-outliner/scripts/scan-corpus.js --root=.claude/commands --out=.workflow/.scratchpad/commands.json
```

## Regress all commands (cycle mode)

```bash
node .claude/skills/slash-command-outliner/scripts/regress-all.js --cycle-id=cycle-v1-20260203T001806-slashcmdoutliner-qmhuep
```

Outputs go to:
- `.workflow/.cycle/<cycle-id>.progress/specs/derived/`
- `.workflow/.cycle/<cycle-id>.progress/regression/current/`
- `.workflow/.cycle/<cycle-id>.progress/reports/`

