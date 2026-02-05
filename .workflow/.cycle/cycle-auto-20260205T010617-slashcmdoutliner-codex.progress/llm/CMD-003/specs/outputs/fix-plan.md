# Fix Plan: other:ccw-plan

## P0 (Must)

- docs: Keep ccw-plan as a general (no-group) command; ensure outline/docs never rewrite it as `/workflow:ccw-plan`.
- evidence: Maintain dual-source evidence for each implementation pointer row; downgrade any non-verifiable pointers to `Planned`.

## P1 (Should)

- docs: Add a compact "Mode Selection Decision Tree" subsection to make mode conflicts explicit (issue vs rapid-to-issue vs with-file).
- state: Specify minimal `status.json` fields needed for `replan`/resume (e.g., mode, chain, current_index, last_error, timestamps).

## P2 (Optional)

- conventions: Align TODO prefix + status naming with other coordinators for easier aggregation.

