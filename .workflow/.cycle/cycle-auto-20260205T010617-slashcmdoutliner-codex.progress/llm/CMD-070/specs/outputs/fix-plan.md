# Fix Plan: workflow:explore-auto

## Scope: .claude command doc (P0)

1. Update `.claude/commands/workflow/ui-design/explore-auto.md` to add missing core sections:
   - Add `## Usage` (one line syntax + 1-2 examples).
   - Add `## Outputs / Artifacts` (Reads/Writes bullets; keep it short).
   - Add `## Error Handling` (pre-exec checks + phase failure recovery rules).

Verify:

```powershell
Test-Path .claude/commands/workflow/ui-design/explore-auto.md
rg -n "^## Usage" .claude/commands/workflow/ui-design/explore-auto.md
rg -n "^## Outputs / Artifacts" .claude/commands/workflow/ui-design/explore-auto.md
rg -n "^## Error Handling" .claude/commands/workflow/ui-design/explore-auto.md
```

## Scope: structure alignment (P1)

2. Compare explore-auto to imitate-auto for early-phase ordering and tighten wording where it diverges:
   - parameter parsing -> base-path resolution -> (single) interactive confirmation -> TodoWrite init -> phase execution.

Verify:

```powershell
Test-Path .claude/commands/workflow/ui-design/imitate-auto.md
rg -n "^## Execution Process" .claude/commands/workflow/ui-design/imitate-auto.md
```

## Scope: tooling assumptions (P1)

3. Validate nested command discovery for ui-design subfolder commands in CCW UI/API surfaces.

Verify:

```powershell
Test-Path ccw/src/core/routes/commands-routes.ts
rg -n "function scanCommandsRecursive\\(" ccw/src/core/routes/commands-routes.ts
Test-Path ccw/src/tools/command-registry.ts
```

## Scope: preview artifacts grounding (P1)

4. Ensure explore-auto completion output references preview artifacts consistent with repo tooling.

Verify:

```powershell
Test-Path ccw/src/tools/ui-generate-preview.js
rg -n "writeFileSync\\(resolve\\(targetPath, 'compare\\.html'\\)" ccw/src/tools/ui-generate-preview.js
```

