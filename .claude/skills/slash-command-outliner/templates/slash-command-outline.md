---
name: {{command.name}}
description: {{command.description}}
argument-hint: "{{command.argument_hint}}"
allowed-tools: {{command.allowed_tools_csv}}
group: {{command.group}}
---

# {{command.title}}

## Overview

- Goal: {{intent.primary_user_value}}
- Command: `/{{command.group}}:{{command.name}}`

## Usage

```bash
/{{command.group}}:{{command.name}} {{command.usage_args}}
```

## Inputs

- Required inputs:
  - {{inputs.required}}
- Optional inputs:
  - {{inputs.optional}}

## Outputs / Artifacts

- Writes:
  - {{artifacts.writes}}
- Reads:
  - {{artifacts.reads}}

## Implementation Pointers

- Command doc: {{implementation.command_doc}}
- Likely code locations:
  - {{implementation.code_pointers}}

## Execution Process

{{execution.process_outline}}

## Error Handling

{{error_handling.checklist}}

## Examples

{{examples}}
