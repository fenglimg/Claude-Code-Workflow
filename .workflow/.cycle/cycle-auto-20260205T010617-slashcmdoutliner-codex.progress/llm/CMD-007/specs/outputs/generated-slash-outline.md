---
name: codex-review
description: Interactive code review using Codex CLI via ccw endpoint with configurable review target, model, and custom instructions
argument-hint: "[--uncommitted|--base <branch>|--commit <sha>] [--model <model>] [--title <title>] [prompt]"
allowed-tools: Bash(*), AskUserQuestion(*), Read(*)
group: cli
---

# Codex Review Command (/cli:codex-review)

## Overview

- Goal: Run a structured, interactive code review over uncommitted changes, a base-branch diff, or a specific commit via `ccw cli --tool codex --mode review`.
- Command: `/cli:codex-review`
- Key constraint: target flags (`--uncommitted|--base|--commit`) are mutually exclusive with a positional `[prompt]`.

## Usage

```bash
/cli:codex-review [--uncommitted|--base <branch>|--commit <sha>] [--model <model>] [--title <title>] [prompt]
```

## Inputs

- Required inputs:
  - None (interactive mode prompts for selections)
- Optional inputs:
  - Review target:
    - `--uncommitted`
    - `--base <branch>`
    - `--commit <sha>`
  - `--model <model>` (optional override)
  - `--title <title>` (optional summary label)
  - `[prompt]` (custom review focus; only allowed when NO target flag is provided)

## Outputs / Artifacts

- Writes:
  - None intentionally (delegates to `ccw cli`, which persists execution history under CCW storage).
- Reads:
  - Git working tree / branch list / recent commits (for target validation and selection).
  - Local repository files indirectly, as evaluated by the external review tool invoked via `ccw cli`.

## Implementation Pointers

- Command doc: `.claude/commands/cli/codex-review.md`
- Likely code locations:
  - `ccw/src/cli.ts` (CLI surface: `ccw cli ... --uncommitted|--base|--commit|--title`)
  - `ccw/src/commands/cli.ts` (review-mode flag handling + prompt/flag constraints)
  - `ccw/src/tools/template-discovery.ts` (template/protocol loading when prompt mode is used)
  - `ccw/src/config/storage-paths.ts` (where `ccw cli` history may be stored, including legacy `.workflow/.cli-history`)

### Evidence (Existing vs Planned)

You MUST label each pointer as `Existing` (verifiable in repo now) or `Planned` (will be created/modified).

Rules:
- `Existing` MUST include evidence from BOTH:
  - a command doc source: `.claude/commands/**.md` (section heading is sufficient)
  - a TypeScript source: `ccw/src/**` (function name / subcommand case / a ripgrep-able string)
- If you cannot verify, downgrade to `Planned` and add a concrete `Verify` step (e.g. `Test-Path <path>`, `rg "<pattern>" <path>`).

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/cli/codex-review.md` | Existing | docs: `.claude/commands/cli/codex-review.md` / `Codex Review Command (/cli:codex-review)` ; ts: `ccw/src/core/routes/commands-routes.ts` / `return join(projectPath, '.claude', 'commands');` | `Test-Path .claude/commands/cli/codex-review.md; rg "Codex Review Command" .claude/commands/cli/codex-review.md` | canonical slash command doc + how commands are discovered/served |
| `ccw/src/cli.ts` | Existing | docs: `.claude/commands/cli/codex-review.md` / `Integration Notes` ; ts: `ccw/src/cli.ts` / `.option('--uncommitted', 'Review uncommitted changes (codex review)')` | `Test-Path ccw/src/cli.ts; rg "Review uncommitted changes (codex review)" ccw/src/cli.ts` | defines ccw CLI flags used by this command |
| `ccw/src/commands/cli.ts` | Existing | docs: `.claude/commands/cli/codex-review.md` / `Validation Constraints` ; ts: `ccw/src/commands/cli.ts` / `// codex review: --uncommitted, --base, --commit are all mutually exclusive with [PROMPT]` | `Test-Path ccw/src/commands/cli.ts; rg "mutually exclusive with \[PROMPT\]" ccw/src/commands/cli.ts` | enforces prompt vs target-flag constraints and skips templates when needed |
| `ccw/src/tools/template-discovery.ts` | Existing | docs: `.claude/commands/cli/codex-review.md` / `Prompt Template Format` ; ts: `ccw/src/tools/template-discovery.ts` / `export function loadProtocol(mode: string): string {` | `Test-Path ccw/src/tools/template-discovery.ts; rg "export function loadProtocol\(" ccw/src/tools/template-discovery.ts` | loads protocol/templates appended to prompts in prompt-mode |
| `ccw/src/config/storage-paths.ts` | Existing | docs: `.claude/commands/cli/codex-review.md` / `Integration Notes` ; ts: `ccw/src/config/storage-paths.ts` / `cliHistory: (projectPath: string) => join(projectPath, '.workflow', '.cli-history'),` | `Test-Path ccw/src/config/storage-paths.ts; rg "join\(projectPath, '\.workflow', '\.cli-history'\)" ccw/src/config/storage-paths.ts` | clarifies where legacy CLI history may be stored for this execution |

Notes:
- One row per pointer.
- TS evidence anchors are literal substrings present in the referenced file.

## Execution Process

1. Parse arguments.
   - Accept: `--uncommitted`, `--base <branch>`, `--commit <sha>`, `--model <model>`, `--title <title>`, and optional `[prompt]`.
   - Validate: if any target flag is present AND `[prompt]` is also present, stop and tell the user it is invalid (target flags cannot be combined with `[PROMPT]`).
2. If no target specified, run interactive selection via `AskUserQuestion`:
   - Review target: uncommitted vs base-branch vs commit.
   - If base-branch selected: offer common branches and/or show `git branch -a --list | head -20`.
   - If commit selected: show `git log --oneline -10` and request a SHA.
   - Optional model selection.
   - Focus area selection (general/security/performance/code quality).
3. Build the `ccw cli` command.
   - Prompt-mode (NO target flags): construct a ccw prompt-template string; include `MODE: review`, `CONTEXT: <target description>`, `EXPECTED: <structured review>`, and optional focus constraints.
   - Target-flag mode: do not pass a prompt (`-p` omitted). Pass exactly one of `--uncommitted|--base|--commit` and optional `--model`/`--title`.
4. Execute via CCW CLI (Bash tool).
   - Run in background where appropriate: `ccw cli ... --tool codex --mode review ...`.
5. Display results.
   - Present a structured review summary and point the user to any follow-up actions (fixes, tests, reruns).

## Error Handling

- No changes to review: explain what was checked and suggest choosing a different target or making changes first.
- Invalid branch: show available branches (`git branch -a --list | head -20`) and re-prompt.
- Invalid commit: show recent commits (`git log --oneline -10`) and re-prompt.
- Execution failure (ccw cli / codex error): surface stderr succinctly and suggest retry flags (e.g., different target, remove prompt when using target flags).

## Examples

- Interactive:
  - `/cli:codex-review`
- Direct (no interaction):
  - `/cli:codex-review --uncommitted`
  - `/cli:codex-review --base main`
  - `/cli:codex-review --commit abc123`
- Prompt-mode focus (no target flag):
  - `/cli:codex-review security`
- Invalid (must fail fast):
  - `/cli:codex-review --uncommitted "focus"`
