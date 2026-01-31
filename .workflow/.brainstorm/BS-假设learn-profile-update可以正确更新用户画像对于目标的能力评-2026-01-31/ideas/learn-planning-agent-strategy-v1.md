# Idea Deep Dive: learn-planning-agent Strategy v1 (Capability-First, Assessment-Deferred)

## Inputs (Contract)
- `goal_spec` (clarified)
- `profile_evidence`:
  - `domain`
  - `evidence_summary`
- `constraints` (optional)

Notes:
- In v1, `current_phase_name` / `target_phase_name` are inferred by the agent, not required inputs.
- `confidence` can be inferred or passed through if profile_evidence provides it; otherwise the agent should estimate and explain.

## Outputs (Draft Contract)
- `domain`
- `current_phase_name` (inferred, enum)
- `target_phase_name` (inferred, enum)
- `phase_inference`:
  - `confidence` (0..1)
  - `rationale` (short)
- `phases[]` (contiguous subrange current->target)
  - `phase_name` (enum)
  - `phase_goal` (1-2 lines)
  - `modules[]` (15-25 total across whole plan, cut by capability points)
    - `capability_point` (short label)
    - `description` (what this capability is)
    - `tasks[]` (learning/practice/produce)
    - `exit_criteria[]` (measurable, hybrid: artifact + capability-in-constraints)

Notes:
- `assessments[]` deliberately deferred for now.

---

## Algorithm (High Level)
1) Map goal_spec -> capability graph
- Extract 15-25 capability points required to reach the goal.
- Deduplicate/merge synonyms.

2) Assign capability points to phases
- For each capability point, decide the minimum phase where it should be achieved.
- Ensure phases are contiguous subrange from current->target.

3) Build modules
- Each module = 1 capability point.
- Tasks default to 3 items (learn/practice/produce) and are not encoded as assessment enums:
  - learn task (read/watch)
  - practice task (do)
  - produce task (ship an artifact)

4) Write exit_criteria
- Each capability point produces 3 exit criteria by default (2 artifact-based + 1 capability-in-constraints).
- Simple capability points can use 2; complex/high-risk can use 4-5 (avoid >5).
- Each exit criterion should be checkable by a human without new infra.

---

## GeminiReview Checklist (v1)
- Does the plan cover all capability points implied by goal_spec?
- Are modules aligned with profile weaknesses? (given evidence_summary)
- Are exit_criteria measurable (no vague verbs like "understand")?
- Is phase progression reasonable (no big jumps)?

---

## Future Iterations
- Add assessments.type per capability point
- Add exa resources per module/task
- Add scheduling (weeks) as post-processing
