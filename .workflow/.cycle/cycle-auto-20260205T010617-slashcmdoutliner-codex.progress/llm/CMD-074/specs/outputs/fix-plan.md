# Fix Plan: workflow:ui-design:layout-extract

## P0 (Must Fix)

1) Standardize command identity
- Scope: docs
- Action: ensure usage/examples consistently use `/workflow:ui-design:layout-extract` (not `/workflow:layout-extract`).
- Verify:
  - `rg "/workflow:layout-extract" .claude/commands/workflow/ui-design -n`
  - `rg "ui-design:layout-extract" COMMAND_REFERENCE.md docs/COMMAND_SPEC.md -n`

2) Resolve missing interactive schema reference
- Scope: docs
- Action (choose one):
  - Add `.claude/commands/workflow/ui-design/INTERACTIVE-DATA-SPEC.md` with the minimal `analysis-options.json` schema used by style/layout extractors, or
  - Remove the reference and inline the minimal schema in each extractor doc.
- Verify:
  - `Test-Path .claude/commands/workflow/ui-design/INTERACTIVE-DATA-SPEC.md`

3) Make `mcp__exa__web_search_exa` usage explicit
- Scope: docs
- Action: document the exact trigger conditions (e.g., URL input present; missing layout conventions) and ensure non-interactive mode does not silently browse.
- Verify:
  - `rg "mcp__exa__web_search_exa" .claude/commands/workflow/ui-design/layout-extract.md -n`

## P1 (Should Fix)

4) Define minimal `layout-templates.json` schema contract
- Scope: docs
- Action: document required fields per template entry (target, variant_id, dom_tree/component hierarchy, layout rules, device_type).
- Verify:
  - `rg "Layout Template File Format" .claude/commands/workflow/ui-design/layout-extract.md -n`

5) Cache/skip semantics
- Scope: docs
- Action: document criteria to reuse `analysis-options.json` and when to early-exit if outputs already exist (and how `--yes` changes behavior).
- Verify:
  - `rg "Memory Check" .claude/commands/workflow/ui-design/layout-extract.md -n`

## P2 (Optional)

6) Confirm URL input support vs references
- Scope: docs
- Action: either implement/document URL support or update `COMMAND_REFERENCE.md` to reflect supported inputs.
- Verify:
  - `rg "layout-extract" COMMAND_REFERENCE.md docs/COMMAND_SPEC.md -n`
