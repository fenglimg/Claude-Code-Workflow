# Implementation Plan: learn:profile 优化（pre_context -> profile schema/events -> assessment）

**Session**: BS-learn-profile优化-2026-01-29  
**Last Updated**: 2026-01-29T22:44:53+08:00  

目标：把 brainstorm 的收敛结果变成可执行 backlog，并按“先降摩擦、再提精度”的顺序迭代上线。

---

## Milestone A（P0）：pre_context_v1.3 上线（个人因素、固定 4 问）

### Scope
- 固定 4 问（AskUserQuestion），允许“选项 + type something”，但不进入 assessment（评估仍纯文本、无选项）。
- 只采集个人因素；不包含“2-4 周可验证结果”；accountability 后置渐进字段。
- 落库 raw + parsed + provenance；抽取失败不阻塞。
- 复用策略：30 天过期、drift 触发重问、跳过冷却（建议 7 天）。

### Tasks
- A1 设计/冻结模板：pre_context_v1.3 文案 + 选项粒度（尽量少档位）\n
- A2 数据结构：pre_context.raw(q1-q4) + pre_context.parsed + provenance(template_version,captured_at)\n
- A3 “偏好摘要回显 + 用户纠错”交互：纠错不覆盖原文证据（建议写事件 FIELD_SET / PRECONTEXT_CAPTURED 再追加修正事件）\n
- A4 复用/重问策略实现：过期、drift、skip 冷却、无历史值时的同上/无变化处理\n
- A5 埋点：pre_context 完成率、跳过率、纠错率、后续会话满意度/时长

### Definition of Done (DoD)
- pre_context_v1.3 能稳定产生结构化偏好（至少 raw 完整），且不增加明显退出率。
- drift/过期/冷却策略可解释且可回归测试。

### Gate（时间盒 30-45min）
- Devil’s advocate（A）：选项粒度是否问卷化、是否引导过强、是否造成偏好锁死（以及补救：允许随时更新/小步纠错）。

---

## Milestone B（P0）：Profile Snapshot + Events（asserted/inferred/provenance + 回滚）

### Scope
- `profile_snapshot`（业务读取）+ `profile_events`（append-only）\n
- inferred 状态机：proposed/confirmed/rejected/superseded\n
- confirmed 仅用户明确确认（已拍板）\n
- rollback_to_version（MVP）：写 ROLLBACK 事件 + 后台重建 snapshot（不删历史）

### Tasks
- B1 schema：profile_snapshot（含 pre_context/skills/learning_profile）\n
- B2 events：事件类型与 payload 约定（PROFILE_CREATED / PRECONTEXT_CAPTURED / ASSERTED_SKILL_* / INFERRED_SKILL_* / FIELD_SET / ROLLBACK_TO_VERSION）\n
- B3 fold/rebuild：从 events 重建 snapshot 的策略（后台任务/定期快照）\n
- B4 inferred 纠错入口：用户一句话确认/否认/修正 -> 写事件并改变 status\n
- B5 冷却策略：rejected 的再提规则（默认 30 天 + 新证据才可再 proposed）\n
- B6 审计/解释：每个 inferred 必须带 evidence（来源、文本片段、taxonomy_version）

### DoD
- 任意字段变更可追溯（能指出“为什么这么认为”），且可回滚到历史版本视图。

### Gate（时间盒 30-45min）
- Devil’s advocate（B）：事件爆炸/存储成本、回滚语义歧义、confirmed 过慢导致画像不更新（补救：proposed 可参与弱推荐但不写死）。

---

## Milestone C（P1）：Assessment Runtime（text-only + adaptive + confidence）+ Pack Generator

### Scope
1) 评估运行时（runtime）
- 题目纯文本输入；L1-L4 自适应调度；rubric + coverage + confidence\n
- 写入 assessment_* events；仅产生 inferred proposed/updated（不自动 confirmed）\n
- 可解释输出：对/错点、缺失点、升/降级原因（引用 rubric 维度）

2) 评估包生成（pack generator）
- 输入任意 topic -> 生成 taxonomy(subpoints) + question bank + regression skeleton\n
- 版本化：taxonomy_version 写入事件；topic packs 可缓存/复用

### Tasks
- C1 rubric 落地：评分维度与阈值（Promote/Hold/Demote），一次最多升/降 1 级，stop rule（2 连 promote / 2 连 demote / 题数上限 6）\n
- C2 coverage 抽取：回答 -> matched_subpoints（保留证据片段），coverage=|matched|/|expected|\n
- C3 events：ASSESSMENT_* 事件 + INFERRED_SKILL_PROPOSED/UPDATED（evidence.type=assessment_signal）\n
- C4 pack generator：按模板生成 taxonomy/question-bank/regression skeleton（JSON/JSONL）\n
- C5 回归集机制：每 topic 最小回归集（JSONL）+ 真实用户回答持续补齐\n
- C6 pilots：game_dev_core 与 cocos_dev_core 已产出 pack，作为端到端验证样例

### DoD
- 同一 topic 在阈值/抽取策略小改动后，不出现大幅等级漂移（回归集通过）。
- 评估结果可解释，且 inferred 默认为 proposed 并可被用户确认/否认。

### Gate（时间盒 45-60min）
- Devil’s advocate（C）：误判挫败、跳级导致体验不稳、coverage 抽取过拟合表达方式（补救：保守阈值、允许保级巩固、强调解释输出与纠错入口）。

---

## Milestone D（P1/P2）：移除 KeywordDictionary.json

### Scope
- 全局扫描依赖 -> 删除文件 -> 用 taxonomy/subpoints 替代\n
- 加回归测试防“复活”

### Tasks
- D1 依赖扫描（读取/引用）\n
- D2 替代实现：覆盖率与推断只依赖版本化 taxonomy\n
- D3 删除文件与回归测试

---

## Recommended Execution Order

1) Milestone A（先降摩擦）\n
2) Milestone B（画像可信与可回滚）\n
3) Milestone C（评估引擎 + pack generator）\n
4) Milestone D（清理旧字典依赖）

