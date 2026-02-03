# Phase 03: Generate Outlines (Slash MD + Agent MD)

## Goal

Generate:
- a **Slash command MD outline** that matches CCW conventions (frontmatter + required sections)
- an **Agent outline** that explains execution model, state, and validation strategy

Use templates; keep output concise and implementation-oriented.

## Inputs

- `specs/outputs/spec.json`
- `specs/outputs/references.json` (selected reference)
- Rules: `../specs/quality-gates.md`

## Output Files

- `specs/outputs/generated-slash-outline.md` (based on `../templates/slash-command-outline.md`)
- `specs/outputs/generated-agent-outline.md` (based on `../templates/agent-outline.md`)

## Notes

- Do not invent new CCW architecture; reuse established patterns.
- If uncertain, explicitly mark items as `TBD` instead of hallucinating.

