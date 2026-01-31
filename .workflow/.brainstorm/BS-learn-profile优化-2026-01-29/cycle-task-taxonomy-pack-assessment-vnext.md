# Generated Task (Cycle 3): Taxonomy Index + Pack Completeness + Full Assessment Loop vNext

**Generated**: 2026-01-31T21:43:00+08:00  
**Source Session**: BS-learn-profile优化-2026-01-29  
**Depends On**: Cycle-1（assess plumbing）+ Cycle-2（profile flow vNext）

---

# Main Objective

把“topic_id 体系 + assessment pack + 保守评估算法”做成可长期稳定运行的闭环，目标是：**一次 topic 评估尽量准确到可以长期复用，后续不再需要初始化评估**（除非 pack_key 变化或用户明确要求重评）。

范围包含：
- taxonomy index 落盘与治理（canonical topic_id、alias、redirect、provisional->active）
- Topic resolve (taxonomy-first)：把用户/Agent 的 topic 文本解析为 canonical topic_id
- pack 生成策略：provisional seed=4 快速定位 + 同 pack 补全到 full completeness（必须覆盖 must/core）
- full-assessment loop：单 topic 最大 20 题，严格 stop conditions，评估结束直接落库并询问是否评估下一个 topic

# Success Criteria / Acceptance

- taxonomy
  - taxonomy index 存在且可读：`.workflow/learn/taxonomy/index.json`
  - Topic resolve (taxonomy-first) 支持：canonical / alias / redirect / 版本号输出
  - provisional topic 支持 seed=4 快速定位；治理规则：provisional->active promotion 需要 regression>=30
- pack
  - pack_key 字段固定：`{topic_id, taxonomy_version, rubric_version, question_bank_version, language}`
  - `question_bank_version` 与 `taxonomy_version` 强绑定
  - 允许 seed=4 先生成，但 **结束本 topic 评估前必须补全到 full pack completeness**
- assessment
  - 单 topic 最大 20 题
  - stop conditions（必须同时满足）：
    - `level_converged`
    - `must_cover_100_passed`
    - `overall_coverage_ratio>=0.85`
    - `overall_confidence>=0.90`
    - `last4_stable`
  - 评估结束不做“轻量确认”；直接保存结果，然后 AskUserQuestion：继续评估下一个 topic / 结束并保存

# Deliverables

- `.workflow/learn/taxonomy/index.json` 初版结构 + loader + 最小治理工具（必要时通过 ccw CLI 写入）
- `Topic resolve (taxonomy-first)` 实现（profile/assess 共用）
- pack 完整性与生成策略落地（seed=4 + full completeness gate）
- full assessment loop 落地（内部 assess 模块实现/升级）
- 回归骨架与 promotion 约束：保证 active topic 的 pack 可回归（>=30 case 的门槛）
- Tests：taxonomy resolve、pack completeness gate、stop conditions 的关键路径回归

