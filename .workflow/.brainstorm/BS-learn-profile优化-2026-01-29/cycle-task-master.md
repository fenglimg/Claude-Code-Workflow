# Master Cycle Task: learn:profile 优化（按依赖顺序串联）

**Generated**: 2026-01-31  
**Session**: BS-learn-profile优化-2026-01-29

---

## 总目标（最终态）

把 `/learn:profile` 做成“全中文、无突兀分支、默认进入单 topic 评估、评估一次尽量可长期复用”的闭环：
- create：强制背景输入（可复用历史背景）+ pre_context（个人学习画像）+ topic 覆盖校验 loop + 默认单 topic full assessment
- update：不做背景联想；目标 topic 若已评估（同 pack_key）则直接退出；否则进入单 topic full assessment
- topics：禁止手工 Add Topic；由“解析+联想”产出候选，再用 AskUserQuestion loop 覆盖校验
- profile/assessment：写入 profile 最新摘要 + append-only events 审计历史（两者都要）
- 评估：text-only；保守 stop conditions；尽量确保后续不再需要初始化评估
- 数据卫生：`p-e2e-*` 永久隔离/隐藏，绝不污染真实交互与 active_profile_id

---

## 依赖顺序（推荐执行）

0) **Cycle-1：Assessment Plumbing（先打通管道）**
- Task: `cycle-task-assess-plumbing.md`
- Issues: `cycle-issues-assess-plumbing.md`
- 验收：`/learn:profile` 能 `Read()` 加载 `.claude/commands/learn/_internal/assess.js` + 能写 pack + 能写 `ASSESSMENT_*` events

1) **Milestone B：Profile Snapshot + Events + Rollback（读模型/审计底座）**
- Task: `cycle-task-milestone-b.md`
- Issues: `cycle-issues-milestone-b.md`
- 验收：append-only events + snapshot fold/rebuild + rollback_to_version 可用；inferred 状态机可审计

2) **Milestone A：pre_context 固定模板与持久化（个人画像采集底座）**
- Task: `cycle-task.md`
- Issues: `cycle-issues-p0.md`
- 备注：此处文件目前以 `pre_context_v1.3（固定4问）` 为中心；但最新讨论已演进为 `pre_context_vNext（可分批<=4问，多批完成）`。
  - 开工前需要先对齐：要么把 Milestone A 升级为 vNext，要么在 Cycle-2 内合并完成并删除 v1.3 约束。

3) **Cycle-2：/learn:profile Flow vNext（中文化 + 去除无效分支 + create/update 行为定稿）**
- Task: `cycle-task-profile-flow-vnext.md`
- Issues: `cycle-issues-profile-flow-vnext.md`
- 验收：全中文；create 强制背景；topic 覆盖校验 loop；默认单 topic 评估；update 已评估直接退出；移除 Add Topic/selectFlow/--no-assessment；隐藏 p-e2e-*

4) **Cycle-3：Taxonomy + Pack Completeness + Full Assessment Loop vNext（可长期稳定）**
- Task: `cycle-task-taxonomy-pack-assessment-vnext.md`
- Issues: `cycle-issues-taxonomy-pack-assessment-vnext.md`
- 验收：taxonomy-first resolve + index 治理；seed=4 快速定位 + full completeness gate；max=20 严格 stop conditions；pack_key/version 强绑定；active promote 回归门槛>=30

---

## 每阶段产物清单（落点对齐）

- **/learn:profile 规格与流程**：`.claude/commands/learn/profile.md`
- **评估内部模块（仅供 profile 读取复用）**：`.claude/commands/learn/_internal/assess.js`
- **packs 存储根目录**：`.workflow/learn/packs/`
- **taxonomy index（唯一 canonical 来源）**：`.workflow/learn/taxonomy/index.json`
- **append-only events + snapshot（读模型）**：由 `ccw learn:*` 的实现决定（Milestone B）

---

## 风险/冲突提示（开工前需对齐）

- `pre_context_v1.3（固定4问）` vs `pre_context_vNext（分批<=4问、多批完成）`：两者必须合并成单一版本策略，否则会造成文档与实现不一致。
- “评估一次尽量可长期复用”的目标，强依赖 Cycle-3 的 **pack/version 强绑定 + full completeness gate + 回归门槛**；Cycle-1/2 只能保证链路通，不保证长期稳定。

