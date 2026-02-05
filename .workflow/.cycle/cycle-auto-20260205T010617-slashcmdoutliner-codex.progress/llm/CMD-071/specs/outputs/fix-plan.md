# Fix Plan: /workflow:ui-design:generate

P0 (must):
- Keep evidence tables valid: do not mark pointers Existing unless path exists; keep docs headings and ccw/src anchors literal.

P1 (should):
- Expand the generated slash outline into an implementation-ready doc by re-adding:
  - concrete bash validation snippets per step (layout templates exist, design tokens exist, counts)
  - explicit batching limits (max layouts per agent, max concurrent agents) if they are enforced
  - recovery strategies and a small quality checklist

P2 (optional):
- Add one worked example matrix with expected file count math and a short sample of filenames.
