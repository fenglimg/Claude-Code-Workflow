---
name: plan
description: Batch plan issue resolution using issue-plan-agent (explore + plan closed-loop)
argument-hint: "[-y|--yes] --all-pending <issue-id>[,<issue-id>,...] [--batch-size 3]"
allowed-tools: TodoWrite(*), Task(*), SlashCommand(*), AskUserQuestion(*), Bash(*), Read(*), Write(*)
group: issue
---

# issue:plan

## Overview

- Goal: TBD
- Command: `/issue:plan`

## Usage

```bash
/issue:plan
```

## Inputs

- Required:
  - TBD
- Optional:
  - TBD

## Outputs / Artifacts

- Writes:
  - TBD
- Reads:
  - TBD

## Implementation Pointers

- Command doc: `.claude/commands/issue/plan.md`
- Likely code locations:
  - `ccw/src/commands/issue.ts`
  - `ccw/src/tools/command-registry.ts`
  - `ccw/src/tools/cli-executor.ts`
  - `ccw/src/tools/codex-lens.ts`
  - `ccw/src/commands/learn.ts`
  - `ccw/src/commands/session-path-resolver.ts`
  - `ccw/src/commands/session.ts`
  - `ccw/src/tools/update-module-claude.js`
  - `ccw/src/tools/command-registry.test.ts`
  - `ccw/src/tools/session-manager.ts`

## Execution Process

1. TBD

## Error Handling

- TBD

## Examples

- TBD

