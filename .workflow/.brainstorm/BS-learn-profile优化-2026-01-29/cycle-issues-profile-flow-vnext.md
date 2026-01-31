# Cycle Issues (Cycle 2): learn:profile Flow vNext

**Generated**: 2026-01-31T21:43:00+08:00  
**Source Session**: BS-learn-profile优化-2026-01-29

---

## PF-1: `/learn:profile` 全中文化（文案/选项）+ 去除突兀英文

**Goal**: 彻底移除交互中的英文碎片（例如 “Confirm your familiarity with typescript”）。

**Acceptance**
- AskUserQuestion 的问题/标题/选项描述均为中文
- 允许 option.value 保持稳定英文枚举（仅内部使用，不显示或少显示）

**Tests**
- 快照测试（推荐）：对关键问答模板做 snapshot，防止回归到英文/混杂

---

## PF-2: Flags 收敛：移除 `--no-assessment`，仅保留 `--full-assessment` 且默认 true

**Goal**: CLI 参数语义与默认行为按最新决策统一。

**Acceptance**
- `--no-assessment` 不再出现在文档/提示/解析逻辑
- 未传参时等价于 `--full-assessment=true`
- 显式 `--full-assessment=false` 时不进入评估（但 create 仍需完成背景/个人画像采集）

**Tests**
- 单测：参数解析与默认值
- 回归：旧调用方式（如果存在）错误提示清晰（包含替代参数）

---

## PF-3: create 强制背景输入（可复用历史背景）+ pre_context_vNext 在背景前完成

**Goal**: create 阶段背景必填；pre_context 作为“个人画像（不涉及目标/环境）”先采集，避免后续流程偏离。

**Acceptance**
- 若无背景：强制输入（自由文本）
- 若已有背景：回显摘要并询问 “复用/更新”
- pre_context_vNext：
  - 强制中文
  - 每次 AskUserQuestion <= 4 题（可分批）
  - 内容仅为通用学习画像（不问目标/环境、不加督促偏好）

**Tests**
- 回归：create 无背景时不能继续（错误/提示清晰）
- 单测：pre_context 分批机制仍保持“每批<=4”

---

## PF-4: topic 覆盖校验 loop（推荐 topics + “type something” 补漏）替代 Add Topic

**Goal**: 完全移除手工 Add Topic；由“背景解析 + 联想拓展”产出候选 topics，再用 loop 确保覆盖用户预期技能点。

**Acceptance**
- 展示推荐 topics（带简短解释：为什么推荐）
- 用户可 “type something” 输入缺失技能点/细分 topic
- loop 有收敛机制（例如最多 N 轮或用户选择“已覆盖/先这样”）
- 最终输出一个“可评估的 topic 列表”，并默认只评估其中 1 个 topic

**Tests**
- 单测：loop 的退出条件与最大轮次

---

## PF-5: update 分支：不做背景联想；目标 topic 已评估则直接退出

**Goal**: update 入口更像“对目标做补齐评估”，避免重复评估与重复采集。

**Acceptance**
- update 不调用背景联想拓展
- 若目标 topic 已在同 pack_key 下评估完成：提示“无需评估”并退出
- 否则进入单 topic 评估入口（调用 internal assess 模块）

**Tests**
- 单测：已评估 -> noop（不写新 assessment events）

---

## PF-6: 隔离/隐藏 `p-e2e-*` profiles（永不进入真实交互）

**Goal**: 测试 profile 永久隔离，避免污染真实用户路径。

**Acceptance**
- list/select/create/update 的交互中不展示 `p-e2e-*`
- 不允许 `p-e2e-*` 成为 active_profile_id（即使用户/脚本传入也应被拒绝或隔离到 test-only 存储）

**Tests**
- 回归：试图选中/激活 `p-e2e-*` 时行为可预测且不污染真实数据

---

## PF-7: `profile.md` 内容重排（流程图 + Phase 编写）

**Goal**: 让 `profile.md` 成为可执行 spec：包含“流程图（非 mermaid）+ Phase 分段 + 约束/边界”。

**Acceptance**
- 文档包含：create/update/show 的流程图（非 mermaid）
- 每个 Phase 说明：
  - 输入/输出
  - 关键 AskUserQuestion（中文）
  - 与 ccw CLI 的交互点（读/写 pack、写 events 等）

**Tests**
- 无（文档型验收）

