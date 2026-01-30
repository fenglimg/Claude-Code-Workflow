# Cycle Issues (P0): Init Flow Simplification + pre_context_v1.3

**Generated**: 2026-01-30T00:43:38+08:00  
**Source**: `.workflow/.brainstorm/BS-learn-profile优化-2026-01-29/backlog.json` Milestone A + `synthesis.json` top_ideas[0..1]

---

## P0-1: Init Flow 强制项盘点 + MVP 最小必填字段

**Goal**: 找出 learn:profile create/init 里所有“强制字段/强制步骤/强依赖”，并定义新的最小必填字段集合（MVP）。

**Acceptance**
- 输出清单：强制字段、依赖点、对应代码路径/配置点
- 给出 MVP 字段定义（含默认值/可空策略/向后兼容策略）
- 明确“删除/降级为可选”的字段列表：至少包含 Goal Type、经验自评（不再强制）

**Tests**
- 回归：旧数据/旧入口仍可创建 profile（不因缺字段失败）
- 兼容：依赖方读取缺省字段不崩溃（返回默认/unknown）

---

## P0-2: Init Flow 改造：删除强制项 + 流程/文案同步

**Goal**: 按 P0-1 的 MVP 方案改造 create/init，使初始化阶段不强制 Goal Type、不要求经验自评。

**Acceptance**
- 初始化可在缺少 Goal Type/经验自评时完成并进入下一步
- 任何“缺字段报错/阻塞”被移除或变为非致命提示
- 上线前后埋点可对比初始化完成率

**Tests**
- 新增测试用例：缺 Goal Type/缺经验自评仍能成功
- 负例测试：真实必填字段缺失仍应失败且错误信息清晰

---

## P0-3: 冻结 `pre_context_v1.3` 固定 4 问模板（版本化）

**Goal**: 固定 4 问文案 + 选项粒度（允许 options + free text），并确保每次调用 AskUserQuestion 都严格 4 问。

**Acceptance**
- 模板版本标识严格为 `pre_context_v1.3`
- 每次提问严格 4 个问题，且每题支持 “选项 + type something”
- 4 问不包含：2-4 周结果、accountability

**Tests**
- 单测：模板渲染输出问题数=4；包含 version；禁区词/禁区问题不出现
- 快照测试（推荐）：模板文案变更需显式更新快照，避免无意漂移

---

## P0-4: pre_context 持久化：raw+parsed+provenance（解析失败不阻塞）+ `PRECONTEXT_CAPTURED`

**Goal**: 采集结果落库 raw(q1-q4) + parsed(optional) + provenance(template_version,captured_at)；解析失败不阻塞；追加事件 `PRECONTEXT_CAPTURED`。

**Acceptance**
- 任意解析异常下：raw(q1-q4) 仍成功保存，流程继续
- template_version 与 captured_at 永远保存
- snapshot 可读到最新 pre_context；events 可追溯每次 capture

**Tests**
- 模拟解析失败：仍写入 raw + PRECONTEXT_CAPTURED；parsed 为空/partial
- 幂等/重试：重复写入不会破坏 raw 证据链（以事件追加为主）

---

## P0-5: 偏好摘要回显 + 用户纠错入口（`FIELD_SET` 事件化）

**Goal**: 提供 1-3 句偏好摘要回显；支持用户用自由文本纠错；纠错更新 parsed 不覆盖 raw；写 `FIELD_SET` 事件。

**Acceptance**
- 摘要来自 snapshot.parsed（或可降级使用 raw 生成）
- 用户纠错写入 FIELD_SET（含路径、值、actor=user）
- raw 证据不被覆盖/删除；能审计“为什么当前值是这样”

**Tests**
- 纠错后：parsed 变更、生效；raw 保持原样；events 可回放
- 多次纠错：后写优先但历史可追溯

---

## P0-6: 复用/重问策略：stale / drift / skip cooldown

**Goal**: 实现 pre_context.gating：在“复用 vs 重问”之间做可解释决策。

**Acceptance**
- stale（>30 天）：必须重新问 4 问（允许用户回答“无变化”）
- drift：用户明确表达偏好不匹配时，立即重问 4 问
- skip cooldown：同一问题被 skip 后 7 天内不重复问（除非显式 drift）

**Tests**
- 时间相关：可注入 clock 测试 stale/冷却窗口
- drift 触发：用户一句话触发重问逻辑

---

## P0-7: 埋点与漏斗：init + pre_context（completion/skip/correction/reuse）

**Goal**: 补齐可观测性，支持上线前后对比与快速回滚决策。

**Acceptance**
- 埋点包含 template_version、asked vs reused、skip/correction 计算所需字段
- 至少能计算：init completion、pre_context completion、skip rate per question、correction rate、reuse rate、parse failure rate

**Tests**
- 测试环境可验证埋点发出（结构完整、字段不缺）
- 关键埋点字段变更有契约测试（防破坏仪表盘）

