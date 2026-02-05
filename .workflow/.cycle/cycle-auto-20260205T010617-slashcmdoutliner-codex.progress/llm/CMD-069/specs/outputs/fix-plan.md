# Fix Plan: workflow:design-sync

## Step 1: Bring the slash doc up to corpus P0 core-sections

- Target: `.claude/commands/workflow/ui-design/design-sync.md`
- Add `## Usage` with a canonical invocation:
  - `/workflow:design-sync --session <session_id> [--selected-prototypes "proto-a,proto-b"]`
- Add a short `## Outputs / Artifacts` section (or add a quick list under existing `## Output Structure`):
  - Writes: `role analysis documents`, `ui-designer/analysis*.md`, `ui-designer/design-system-reference.md`, optional role analysis updates, `.process/context-package.json`
  - Reads: target artifacts + existence checks for design tokens/style guide/prototypes + optional notes

Verify:
```bash
Test-Path .claude/commands/workflow/ui-design/design-sync.md
```

## Step 2: Confirm command discovery for nested ui-design docs

- Confirm CCW UI/API recursive scan sees nested docs

Verify:
```bash
Test-Path ccw/src/core/routes/commands-routes.ts
rg "function scanCommandsRecursive" ccw/src/core/routes/commands-routes.ts
```

## Step 3: Confirm orchestration registry expectations

- If any tooling relies on `CommandRegistry` for workflow command discovery, confirm whether it needs to include nested subfolders under `.claude/commands/workflow/`.

Verify:
```bash
Test-Path ccw/src/tools/command-registry.ts
rg "export class CommandRegistry" ccw/src/tools/command-registry.ts
```

## Step 4: Keep the evidence gate green for this cycle

Run evidence verification for this cycle output:
```bash
node .codex/skills/slash-command-outliner/scripts/verify-evidence.js \
  --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-069/specs/outputs/generated-slash-outline.md \
  --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-069/specs/outputs/gap-report.md
```

