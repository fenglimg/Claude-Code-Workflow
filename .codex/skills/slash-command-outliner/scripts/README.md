# Slash Command Outliner Scripts

All scripts are deterministic (no LLM). They exist to prove corpus coverage and enforce non-regression.

## Common

Run from repo root.

## Scan corpus (rebuild a command list)

```bash
node .codex/skills/slash-command-outliner/scripts/scan-corpus.js --root=.claude/commands --out=.workflow/.scratchpad/commands.json
```

## Init a cycle folder (manifests + requirements + TODO_LIST)

```bash
node .codex/skills/slash-command-outliner/scripts/init-cycle.js --cycle-id=cycle-v1-YYYYMMDDTHHMMSS-slashcmdoutliner
```

## Regress all commands (cycle mode)

```bash
node .codex/skills/slash-command-outliner/scripts/regress-all.js --cycle-id=cycle-v1-20260203T001806-slashcmdoutliner-qmhuep
```

Implementation pointers:

- The generated outlines include `## Implementation Pointers`.
- Hints are derived from:
  - command doc references (e.g. `ccw tool exec <tool>`, `*.sh`, referenced `/group:subcommand` slashes)
  - tooling corpus (paths + content match) as fallback

Accept snapshot updates (when outlines intentionally change):

```bash
node .codex/skills/slash-command-outliner/scripts/regress-all.js --cycle-id=<id> --update-expected
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
node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=specs/outputs/gap-report.md
node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=specs/outputs/generated-slash-outline.md
```

## LLM regress all (Codex/Claude runner + deterministic evidence gate)

This runs an LLM to generate the skill outputs per command and then validates them with `verify-evidence.js`.

```bash
# Default: claude runner, use this skill root as reference
node .codex/skills/slash-command-outliner/scripts/llm-regress-all.js --cycle-id=<id> --limit=3 --timeout-ms=1200000

# Use codex runner
node .codex/skills/slash-command-outliner/scripts/llm-regress-all.js --cycle-id=<id> --llm-tool=codex --limit=3 --timeout-ms=1200000

# Iterate on failures
node .codex/skills/slash-command-outliner/scripts/llm-regress-all.js --cycle-id=<id> --only=failed --timeout-ms=2400000
```

## LLM run until done (auto loop)

Runs batches until `TODO_LIST.md` is fully checked; retries failures with a higher timeout.

```bash
node .codex/skills/slash-command-outliner/scripts/llm-run-until-done.js --cycle-id=<id> --llm-tool=codex --batch-size=10
```
