---
name: test-gen
description: Create independent test-fix workflow session from completed implementation session, analyzes code to generate test tasks
argument-hint: "source-session-id"
allowed-tools: SlashCommand(*), TodoWrite(*), Read(*), Bash(*)
group: workflow
---

# workflow:test-gen

## Overview

- Goal: TBD
- Command: `/workflow:test-gen`

## Usage

```bash
/workflow:test-gen
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

- Command doc: `.claude/commands/workflow/test-gen.md`
- Likely code locations:
  - `ccw/src/commands/workflow.ts`
  - `ccw/src/tools/command-registry.ts`
  - `ccw/src/tools/cli-executor.ts`
  - `.claude/commands/workflow/plan.md`
  - `.claude/commands/workflow/execute.md`
  - `.claude/commands/workflow/test-cycle-execute.md`
  - `ccw/src/commands/session.ts`
  - `ccw/src/tools/session-manager.ts`
  - `ccw/src/tools/command-registry.test.ts`
  - `ccw/src/commands/session-path-resolver.ts`

## Execution Process

1. TBD

## Error Handling

- TBD

## Examples

- TBD

