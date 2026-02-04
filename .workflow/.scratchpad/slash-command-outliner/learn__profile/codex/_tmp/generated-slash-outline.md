---
name: profile
description: 管理用户学习档案，包括偏好采集、背景解析及基于区间的自适应能力评估。
argument-hint: "[create|update] [profile-id] [--goal=\\"<learning goal>\\"] [--full-assessment[=true|false]]"
allowed-tools: TodoWrite(*), Task(*), AskUserQuestion(*), Bash(*), Read(*)
group: learn
---

# learn:profile

## Overview

- Goal: 创建/更新学习档案，并对指定 Topic 做最少题量的区间评估（Cycle-4 Interval Assessment）。
- Command: `/learn:profile`

## Usage

```bash
/learn:profile create|update [profile-id] [--goal="<learning goal>"] [--full-assessment[=true|false]]
```

## Inputs

- Required:
  - TBD
- Optional:
  - TBD

## Outputs / Artifacts

- Writes:
  - `.workflow/learn/state.json (or state.v2.json fallback)`
  - `.workflow/learn/profiles/<profile-id>.json`
  - `.workflow/learn/profiles/events/<profile-id>.ndjson`
  - `.workflow/learn/profiles/snapshots/<profile-id>.json`
  - `.workflow/learn/telemetry/events.ndjson`
  - `.workflow/learn/packs/**`
- Reads:
  - `.workflow/learn/state.json`
  - `.workflow/learn/state.v2.json`
  - `.workflow/learn/profiles/<profile-id>.json`
  - `.workflow/learn/profiles/events/<profile-id>.ndjson`
  - `.workflow/learn/profiles/snapshots/<profile-id>.json`
  - `.workflow/learn/packs/**`
  - `.workflow/learn/taxonomy/**`

## Implementation Pointers

- Command doc: `TBD`
- Likely code locations:
  - `ccw/src/commands/learn.ts`
  - `ccw/src/tools/command-registry.ts`
  - `ccw/src/tools/cli-executor.ts`
  - `ccw/src/commands/learn-background.ts`
  - `ccw/src/commands/learn-questions.ts`
  - `ccw/src/commands/install.ts`
  - `ccw/src/commands/learn-adaptive.ts`
  - `ccw/src/core/routes/codexlens/config-handlers.ts`
  - `ccw/src/core/routes/codexlens/semantic-handlers.ts`
  - `ccw/src/learn/background-parser.ts`

## Execution Process

1. TBD

## Error Handling

- TBD

## Examples

- TBD

