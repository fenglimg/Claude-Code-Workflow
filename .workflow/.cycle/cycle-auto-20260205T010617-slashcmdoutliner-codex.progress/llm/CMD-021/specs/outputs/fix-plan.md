# Fix Plan: memory:load (CMD-021)

## P0 (Must)

- None (evidence tables + core sections are already aligned with quality gates).

## P1 (Should)

- Docs scope: In `generated-slash-outline.md`, add a concise "Tool fallback" note (default gemini; qwen supported; invalid values fall back to gemini).
- Output clarity: Add a compact JSON shape sketch (top-level keys + redaction rule) under "Outputs / Artifacts" or "Execution Process".

## P2 (Optional)

- Add optional scoping guidance (e.g., "focus on <dir/module>") to reduce runtime on large repos.

