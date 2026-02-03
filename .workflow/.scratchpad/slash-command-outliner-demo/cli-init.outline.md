---
name: cli-init
description: Generate .gemini/ and .qwen/ config directories with settings.json and ignore files based on workspace technology detection
argument-hint: "[--tool gemini|qwen|all] [--output path] [--preview]"
allowed-tools: Bash(*), Read(*), Write(*), Glob(*)
group: cli
---

# cli:cli-init

## Overview

- Goal: TBD
- Command: `/cli:cli-init`

## Usage

```bash
/cli:cli-init
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

- Command doc: `.claude/commands/cli/cli-init.md`
- Likely code locations:
  - `ccw/src/commands/cli.ts`
  - `ccw/src/tools/command-registry.ts`
  - `ccw/src/tools/cli-executor.ts`
  - `ccw/src/tools/get-modules-by-depth.ts`
  - `ccw/src/tools/cli-executor-core.ts`
  - `ccw/src/tools/generate-module-docs.ts`
  - `ccw/src/tools/claude-cli-tools.ts`
  - `ccw/src/commands/install.ts`
  - `ccw/src/tools/cli-executor-utils.ts`
  - `ccw/src/tools/update-module-claude.js`

## Execution Process

1. TBD

## Error Handling

- TBD

## Examples

- TBD

