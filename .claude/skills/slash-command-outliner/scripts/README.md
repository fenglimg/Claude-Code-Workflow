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

Implementation pointers:
- The generated outlines include `## Implementation Pointers`.
- Hints are derived from:
  - command doc references (e.g. `ccw tool exec <tool>`, `*.sh`, referenced `/group:subcommand` slashes)
  - tooling corpus (paths + content match) as fallback

Accept snapshot updates (when outlines intentionally change):

```bash
node .claude/skills/slash-command-outliner/scripts/regress-all.js --cycle-id=<id> --update-expected
```

Outputs go to:
- `.workflow/.cycle/<cycle-id>.progress/specs/derived/`
- `.workflow/.cycle/<cycle-id>.progress/regression/current/`
- `.workflow/.cycle/<cycle-id>.progress/regression/expected/`
- `.workflow/.cycle/<cycle-id>.progress/regression/diff/`
- `.workflow/.cycle/<cycle-id>.progress/reports/`

## Verify evidence tables (LLM output gate)

This is an optional deterministic gate for **gap-report / outline** outputs in deep mode.

It enforces:
- each evidence row labels `Existing|Planned`
- dual-source evidence: `.claude/commands/**.md` + `ccw/src/**`
- `Existing` pointers are verifiable (path exists) and anchors are findable

```bash
node .claude/skills/slash-command-outliner/scripts/verify-evidence.js --file=specs/outputs/gap-report.md
node .claude/skills/slash-command-outliner/scripts/verify-evidence.js --file=specs/outputs/generated-slash-outline.md
```
