# Cycle Issues (Cycle 3): Taxonomy + Pack + Full Assessment vNext

**Generated**: 2026-01-31T21:43:00+08:00  
**Source Session**: BS-learn-profile优化-2026-01-29

---

## TPA-1: Taxonomy index 落盘（`.workflow/learn/taxonomy/index.json`）+ 最小结构

**Goal**: 把 canonical topic_id 的唯一来源落盘，并支持 alias/redirect/provisional/active。

**Acceptance**
- 新增 `.workflow/learn/taxonomy/index.json`
- 每个 topic 至少包含：
  - `topic_id`（canonical）
  - `status`: `provisional|active|redirect`
  - `aliases[]`（同义词/别名）
  - `redirect_to`（当 status=redirect）
  - `taxonomy_version`
- topic_id 冲突策略：`_2/_3...` 后缀 + 二次确认（交互或 CLI 提示）

**Tests**
- schema 校验测试：缺字段/非法 status 失败

---

## TPA-2: Topic resolve (taxonomy-first) 实现（canonical/alias/redirect）

**Goal**: 解释并实现 “Topic resolve (taxonomy-first)”：
把用户/Agent 的候选 topic（文本）映射为 canonical `topic_id`，并输出版本号与来源（canonical/alias/redirect/provisional）。

**Acceptance**
- 输入：`raw_topic_label`（string）
- 输出：`{topic_id, resolution_source, taxonomy_version}`
- 支持：
  - 直接命中 canonical
  - alias 命中 canonical
  - redirect 命中目标 canonical
  - 未命中 -> provisional（但需符合命名规范与治理策略）

**Tests**
- 单测：canonical/alias/redirect/provisional 四类用例覆盖

---

## TPA-3: Taxonomy 治理：provisional -> active / alias / redirect 的维护策略

**Goal**: 把治理规则做成“能执行”的约束，而不仅是文档。

**Acceptance**
- promotion gate：provisional->active 需要 regression cases >= 30
- alias/redirect 的写入必须可审计（事件或变更日志）
- 允许 alias 版本演进，但 pack_key 必须绑定 taxonomy_version（保证可复现）

**Tests**
- promotion gate 测试：不足 30 case 不允许 promote

---

## TPA-4: Pack seed=4 快速定位 + full completeness gate（must/core 覆盖）

**Goal**: 把“先快后全”的策略固化：
seed=4 仅用于快速定位；但在允许结束 topic 评估前必须达到 full completeness。

**Acceptance**
- provisional topic 生成 seed questions=4
- full completeness minimum：
  - taxonomy 完整（包含 must/core/nice 元数据）
  - question bank 覆盖 must/core（可用于覆盖率与 must-cover 校验）
  - regression skeleton 写入（用于后续扩展到 >=30）
- 若未达 full completeness：不得结束该 topic 评估（必须继续生成/补全 pack）

**Tests**
- 单测：pack completeness gate（缺任何一项都不能结束）

---

## TPA-5: Full Assessment Loop（max=20 + 严格 stop conditions）

**Goal**: 把“评估一次尽量准确”落实为可运行的 stop conditions 与预算上限。

**Acceptance**
- 单 topic 最大 20 题
- stop conditions（ALL）：
  - `level_converged`
  - `must_cover_100_passed`
  - `overall_coverage_ratio>=0.85`
  - `overall_confidence>=0.90`
  - `last4_stable`
- 每次 topic 评估完成后：
  - 直接保存（不做轻量确认）
  - AskUserQuestion：继续评估下一个 topic / 结束并保存

**Tests**
- 属性/场景测试：在不同回答质量下的“不会过早停/不会无限问”（max=20 生效）

---

## TPA-6: Pack/version 强绑定：pack_key + question_bank_version 与 taxonomy_version

**Goal**: 保证评估结果可复现且不会“悄悄漂移”。

**Acceptance**
- pack_key 固定字段：`{topic_id, taxonomy_version, rubric_version, question_bank_version, language}`
- `question_bank_version` 与 `taxonomy_version` 强绑定（写 pack 时强校验）

**Tests**
- 单测：强绑定校验（不匹配直接失败）

---

## TPA-7: Regression skeleton -> >=30 cases 的扩展与 CI gate（active topics）

**Goal**: 让 active topic 的评估“可回归验证”，并作为 promote/变更的门槛。

**Acceptance**
- regression skeleton 格式稳定（JSONL）
- 当 topic.status=active：
  - regression cases >= 30（不满足则拒绝 promote 或拒绝发布变更）
- 提供最小 CI/脚本入口跑回归（哪怕先在本地）

**Tests**
- 回归 runner 的 smoke test（1 topic 跑通）

