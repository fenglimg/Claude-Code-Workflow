# Cycle-5 Task: Topic V0 Simplification + Gemini Packs (Seed Blocking + Full Async)

**Generated**: 2026-02-01T21:17:46+08:00  
**Source Session**: `BS-learn-profile优化-2026-01-29`  
**Decision Lock**: Round 43 (confirmed)  

---

## Objective

把 learn:profile 的 topic 处理从“taxonomy-first + resolve/ensure + 歧义处理”降复杂度到 V0：
- topic 作为最小能力粒度（并列 set）
- topic 不重复（按 canonical id 去重）
- topic 不建包含关系（无 parent/child）
- topic 合并仅通过显式 alias_map（先不做近义/重叠治理）
- 彻底消灭中文 raw label 导致的 `INVALID_ARGS: Cannot derive topic_id from raw_topic_label`

同时把 “Gemini CLI Seed Pack + Full Pack async” 真正跑通为默认路径。

---

## Decision Lock (Scope)

1) **Topic V0**：`topic_id = "t_" + sha1(normalized_label).slice(0,12)`（normalized_label 用 Unicode NFKC + trim + whitespace collapse + lowercase；保留中文）  
2) **合并治理**：仅同义/别名合并（显式 `alias_map`），不做 TS/JS 等近义去冗余  
3) **update 场景**：既有 topics 只读展示；新增候选选择集会减去 existing topics  

---

## Deliverables

### A) /learn:profile（Topic V0 + AskUserQuestion 合规）
- `/learn:profile create`：
  - topicCoverageValidationLoop 输出 `topic_ids_confirmed[]`（Topic V0 id），并返回 `topics_by_id`（可用于 UI label/审计）
  - 新增候选去重 + subtract existing topics
  - 在 profile.custom_fields 写入 `topic_v0`：
    - `alias_to_canonical`（可空）
    - `topics_by_id`（topic_id -> display_label/topic_key）
- `/learn:profile update`：
  - “题目评估入口”允许输入：
    - topic_id（ASCII）
    - 或 raw label（中文/任意），自动映射为 Topic V0 id
- **AskUserQuestion 合规**：
  - 每个 question 都有 `options`，且 2..4 个
  - 同一次 AskUserQuestion：question 文案唯一
  - 同一 question 内：option.label 唯一
  - 全面移除 `skip`（用 `none/取消` 语义替代，并保持 option<=4）

### B) internal assess（支持 Topic V0 + Gemini pack）
- `.claude/commands/learn/_internal/assess.js`：
  - 不再强依赖 `ccw learn:resolve-topic`
  - 直接把 user 输入的 `topic_id` 当作 canonical（必要时做 basic normalize）
  - 继续使用 `ccw learn:ensure-pack --mode seed`（阻塞）+ `--mode full`（非阻塞触发 job）

---

## Acceptance Criteria (Smoke)

- [ ] create/update 不再出现 AskUserQuestion InputValidationError（options 数量/唯一性问题）  
- [ ] create/update 不再出现 `Cannot derive topic_id from raw_topic_label`（中文 raw label ok）  
- [ ] topic 去重稳定：同一 label 反复出现只产生一个 topic_id  
- [ ] update 输入中文 label 也能进入评估（自动转成 t_<hash>）  
- [ ] `ccw learn:ensure-pack --topic-id t_<hash> --mode seed` 可生成 seed pack（Gemini-first，失败 deterministic fallback）  
- [ ] ensure-pack full 会创建/更新 job 文件（不阻塞主流程）  

---

## Implementation Notes

- Topic V0 是“先把系统跑稳”的策略：把 topic_id 当成稳定机器键；展示层用 display_label。
- alias_map 是唯一合并机制：把 alias_key（normalized_label）映射到 canonical_topic_id；不做自动近义推断。

