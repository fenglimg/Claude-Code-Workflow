# Analysis Discussion

**Session ID**: ANL-slash-command-outliner-2026-02-04  
**Topic**: 讨论 slash-command-outliner 具体在做什么，当前还有没有优化的空间呢？  
**Started**: 2026-02-04T22:11:13+08:00  
**Dimensions**: implementation, architecture, performance

---

## User Context

**Focus Areas**: （未指定，默认）实现细节、质量门禁（quality gates）、性能与可维护性  
**Analysis Depth**: standard

---

## Discussion Timeline

### Round 1 - Initial Understanding (2026-02-04T22:11:13+08:00)

#### Topic Analysis

这次讨论的对象是仓库内的 Skill：`slash-command-outliner`（路径：`.claude/skills/slash-command-outliner/`）。

它的目标不是“执行某个 slash command”，而是：
- 输入一份“slash command 的需求 / 规格文档（spec）”；
- 输出一套 CCW 对齐的开发大纲（Slash 命令文档骨架 + Agent 执行大纲）；
- 再通过 gap-report + 全量 corpus 回归快照（snapshots）来做“稳定性（non-regression）”校验。

#### Exploration Results (2026-02-04T22:11:13+08:00)

**Sources Analyzed（关键文件）**：
- `.claude/skills/slash-command-outliner/SKILL.md`
- `.claude/skills/slash-command-outliner/phases/01-collect-spec.md`
- `.claude/skills/slash-command-outliner/phases/02-retrieve-and-rank-references.md`
- `.claude/skills/slash-command-outliner/phases/03-generate-outlines.md`
- `.claude/skills/slash-command-outliner/phases/04-gap-report-and-iterate.md`
- `.claude/skills/slash-command-outliner/phases/05-regression-and-closure.md`
- `.claude/skills/slash-command-outliner/specs/spec-input.md`
- `.claude/skills/slash-command-outliner/specs/quality-gates.md`
- `.claude/skills/slash-command-outliner/specs/corpus-scope.md`
- `.claude/skills/slash-command-outliner/templates/slash-command-outline.md`
- `.claude/skills/slash-command-outliner/templates/agent-outline.md`
- `.claude/skills/slash-command-outliner/templates/gap-report.md`
- `.claude/skills/slash-command-outliner/scripts/scan-corpus.js`
- `.claude/skills/slash-command-outliner/scripts/derive-spec.js`
- `.claude/skills/slash-command-outliner/scripts/generate-outline.js`
- `.claude/skills/slash-command-outliner/scripts/gap-report.js`
- `.claude/skills/slash-command-outliner/scripts/regress-all.js`
- `.claude/skills/slash-command-outliner/scripts/lib/command-md.js`
- `.claude/skills/slash-command-outliner/scripts/lib/pipeline.js`
- `.claude/skills/slash-command-outliner/scripts/lib/implementation-hints.js`
- `.claude/skills/slash-command-outliner/scripts/lib/snapshots.js`

**Key Findings**：
1. Skill 层面定义了 5 阶段 canonical workflow：收集 spec → 检索/排序参考命令 → 生成 2 份 outline → gap-report + 迭代 → corpus 回归与 closure。
2. 除了“给 LLM 的 workflow 文档”，还提供了“完全不依赖 LLM 的确定性 Node 脚本”，用于：扫描 corpus、从现有命令推导 spec、生成 outline、生成 gap-report、对全量命令做回归快照门禁。
3. `implementation-hints.js` 通过读取“命令文档文本 + tooling-manifest.files”做启发式匹配，输出“可能相关的代码路径（code pointers）”。
4. `regress-all.js` 在每个命令上会调用 `findImplementationHints(...)` 两次（一次 enrich spec，一次在 computeGapReport 内再次调用），并且每次都会遍历 tooling-manifest 的所有文件并读入全文做打分，性能上存在明显优化空间。
5. 模板文件（`templates/*.md`）目前没有被脚本直接使用；脚本在 `pipeline.js` 内手工拼接 Markdown。短期可接受，但中长期容易出现“模板与真实生成内容漂移”的维护风险。

**Points for Discussion**：
1. 你关心的“outliner”是更偏向：生成新命令的提纲质量，还是跑全量回归（cycle）时的速度/稳定性？
2. 现在的质量门禁主要覆盖：frontmatter keys、allowed-tools 与参考命令一致、核心 H2 段落存在、H2 与参考差异（P1）。是否需要把 `quality-gates.md` 里提到的“artifact references”也做成确定性校验？
3. `implementation hints` 你更希望“准”（少误报）还是“全”（多给一些候选）？这会影响索引/缓存方案选择。

**Open Questions**：
- 你现在实际怎么触发/使用这个 skill？（直接作为对话 skill，还是主要跑 `scripts/regress-all.js`）
- tooling-manifest.json 目前是如何生成的？（我已确认回归脚本依赖 `.workflow/.cycle/<id>.progress/corpus/tooling-manifest.json`，但还没定位生成流程）

#### Next Steps

- 根据你的使用场景（生成质量 vs 回归性能）选定优化优先级。
- 如果以性能为先：先把 `findImplementationHints` 的“全量读文件 + 双重调用”改成一次调用 + 缓存/预索引。
- 如果以质量为先：补齐 P0/P1 校验项（例如 artifacts 引用、allowed-tools 的合法集合校验）。

---

## Current Understanding

### What We Established

- slash-command-outliner 是一个“生成 slash command 开发大纲 + gap-report + corpus 非回归门禁”的工具链（Skill 文档 + Node 确定性脚本）。
- 性能瓶颈最可疑的位置在：`scripts/lib/implementation-hints.js` 在 corpus 回归中被重复调用并全量扫描 tooling 文件。

### Key Insights

- 这个设计的核心价值是“稳定”：用 snapshots 把输出格式/结构固定住，避免后续修改导致 corpus 里已完成命令的提纲退化。

### Round 2 - Discussion (2026-02-04T22:15:00+08:00)

#### User Input

1) 主要希望在对话里用 Skill 生成新命令大纲。  
2) 优先优化 gap-report / 门禁准确性（质量），希望大纲质量在线，并且参考当前具体 slash 命令实现。  
3) `--depth=deep`，`--max-iterations=5`。

#### New Exploration (deep)

我补充查看了该 Skill 的示例输出（`/learn:profile`）：
- `.claude/skills/slash-command-outliner/output/learn-profile-slash-outline.md`
- `.claude/skills/slash-command-outliner/output/learn-profile-gap-report.md`
- `.claude/skills/slash-command-outliner/output/learn-profile-execution-summary.md`

观察到：这些“高质量、带实现建议”的 gap-report/outline，主要是 LLM 文本产物（不是 deterministic 脚本 `pipeline.js` 生成的骨架）。因此“质量优化”的关键不在 `renderOutlineFromSpec` 这类 skeleton 脚本，而在：
1) Skill 的 prompts / 模板（`templates/*.md`、`phases/*.md`）怎么约束 LLM 输出；以及  
2) gap-report 如何做到“证据化”（避免把未验证的实现/文件当成已存在事实）。

补充一个具体例子（来自 `/learn:profile` 示例输出）：gap-report/outline 中列出的若干路径在当前仓库里并不存在（因为这是“新命令”，合理），但文档措辞把它们写成了“已验证/有效”。例如：
- `.claude/commands/learn/profile.md`（当前不存在）
- `ccw/src/commands/learn/profile.ts`（当前不存在）
- `ccw/schemas/learn/profile-schema.json`（当前不存在）

这类情况会让“门禁准确性”打折：文档看起来通过了检查，但实际上只是“计划创建”的建议清单。

#### Updated Understanding

基于你的目标（新命令生成 + 质量为先），当前最值得优先优化的点是：
- **gap-report 的证据约束**：对“已存在 vs 计划创建”的文件/模块/CLI endpoint 做显式区分，并要求给出可验证证据（例如：路径存在、引用来自哪个 reference command doc 的哪一段结构/约束）。  
- **quality gates 与实际检查的一致性**：`quality-gates.md` 提到的门禁项（例如 artifacts 引用完整性、allowed-tools 正确性）需要落到可执行检查或至少强制输出“验证方式/结果/不确定项”。  
- **reference 对齐**：在 Phase 2/4 强制输出“从选定 reference 提取到的具体模式清单”（比如 AskUserQuestion batching、CLI pipe 模式、备份策略、schema 校验），并在 outline 内逐条映射（mapping），避免泛泛而谈。

#### Corrected Assumptions

- ~~优化重点在 deterministic 脚本输出质量~~ → **对话场景更依赖 LLM 产物质量**；deterministic 脚本更像“回归门禁与 corpus 覆盖证明”的工具。

#### Next Discussion Questions

为了把“参考具体实现”落到可执行的门禁上，需要你确认 2 个约束：
1) 你希望 reference 的“实现”指的是：`.claude/commands/**.md` 的命令文档，还是 `ccw/src/**` 的 TypeScript 实现（或两者都要）？  
2) 新命令生成时，gap-report 里列出的 `Implementation Pointers`（代码路径/CLI endpoint）允许是“建议创建”（planned），还是必须“已存在”（existing）才能算通过？

### Round 3 - Discussion (2026-02-04T22:20:00+08:00)

#### User Input

1) 参考具体实现：两者都要（命令文档 + TypeScript 实现）。  
2) 对 “planned vs existing” 的含义不清楚，希望解释。

#### Clarification: What “Planned vs Existing” Means

这里的 “Implementation Pointers” 指的是大纲里列出来的“你将会去看的/改的/新增的具体位置”（文件路径、模块、CLI 子命令、工具入口等）。  

对 **新命令** 而言，天然存在两类指针：

1) **Existing（已存在、可验证）**：仓库现在就有的实现/模式来源。  
   - 例：reference 命令文档：`.claude/commands/issue/new.md`  
   - 例：被该命令文档调用到的 CLI/实现：`ccw/src/commands/issue.ts`（包含 `ccw issue create` 的实现与 stdin pipe 模式）

2) **Planned（计划创建/修改、当前不存在）**：为了实现新命令，你“计划新增/改造”的文件/模块/CLI endpoint。  
   - 例：`.claude/commands/<group>/<name>.md`（新命令文档本身）  
   - 例：`ccw/src/commands/<group>.ts` 或 `ccw/src/tools/<tool>.ts`（如果新命令需要新增 CLI 子命令/工具）

这个开关会影响“门禁准确性”的定义：
- 如果门禁把所有 pointers 都当成 Existing，那新命令一定失败（因为你必然要新增文件）。
- 如果允许 Planned，那门禁的重点就变成：**不要把 Planned 写成“已验证存在”**，同时要求每个 Planned 都有明确的创建/修改计划与证据来源（reference 映射）。

#### Proposed Gate Policy (Draft)

针对“新命令生成 + 质量优先”的对话场景，我倾向于：
- **P0**：禁止“虚假的 Existing 声明”  
  - 任何写成 “EXISTS/已验证” 的路径必须真的存在；否则直接 P0 fail。
- **P0**：所有 pointers 必须显式标注 `Existing` 或 `Planned`  
  - 不允许模糊措辞（例如 “已验证 artifacts 有效”，但实际上都是计划创建）。
- **P1**：每个 Planned 指针必须有最小实现说明  
  - 至少包含：要做什么（purpose）、为什么需要（来自哪个 reference 模式/哪段能力）、大致落点（path/command）。

#### Updated Understanding

“两者都要”意味着：gap-report 需要同时做两种证据链：
- 从 `.claude/commands/**.md` 抽取行为模式（工具使用、交互轮次、产物路径、错误处理结构）。  
- 从 `ccw/src/**` 定位支撑这些行为的具体实现（例如 CLI 子命令是否存在、stdin/JSON 输入约定、输出格式约定等）。

### Round 4 - Decision (2026-02-04T22:38:07+08:00)

#### User Decision

采用策略：**允许 Planned，但强制证据化（Evidence-based）**。

#### What This Implies (Concrete Rules)

对新命令生成产物（outline + gap-report）增加以下硬规则：

1) **必须标注**：所有 Implementation Pointers（文件/模块/CLI 子命令/工具入口）必须标注为 `Existing` 或 `Planned`。  
2) **P0 禁止虚假存在**：任何标注为 `Existing` 的指针必须可验证存在（至少路径存在；对 CLI 子命令可给出对应实现位置）。  
3) **Planned 也要证据**：任何标注为 `Planned` 的指针必须给出最小证据链：
   - 来源（来自哪个 reference 命令的哪类模式/能力）
   - 目的（为什么需要它）
   - 落点（将创建/修改在哪里）
4) **证据源双轨**：引用/证据必须来自两类来源之一（或两者）：  
   - 命令文档：`.claude/commands/**.md`  
   - TypeScript 实现：`ccw/src/**`

#### Suggested Template/Skill Changes (Where to Implement)

为把规则落地，建议修改以下位置（以“对话生成质量”为主，不依赖 deterministic 脚本）：

- ` .claude/skills/slash-command-outliner/templates/gap-report.md`  
  - 增加 `Implementation Pointers (Evidence Table)`：每条包含 `pointer` / `status` / `evidence` / `verify` / `why`。
- ` .claude/skills/slash-command-outliner/templates/slash-command-outline.md`  
  - `Implementation Pointers` 下强制输出 `Existing/Planned` 标注与证据摘要（避免把计划当事实）。
- ` .claude/skills/slash-command-outliner/phases/04-gap-report-and-iterate.md`  
  - 将上述规则写成生成要求，并把“未能验证的断言必须降级为 Planned + TBD 验证步骤”作为 P0。
- ` .claude/skills/slash-command-outliner/specs/quality-gates.md`  
  - 增加 P0 gate：`No false existence claims` + `Pointers must be labeled Existing/Planned`。

#### Next Step (Round 5 Proposal)

如果你同意，我会在下一轮给出一份“可直接粘贴进模板/phase/spec”的最小改动文本（包含示例表格格式），并列出一组可选的确定性检查脚本（可选）来自动验证 `Existing` 指针的路径存在性。

### Round 5 - Closure (2026-02-04T22:45:00+08:00)

#### User Decision

- Evidence 标准：**1B（细粒度证据）**
- 落地方式：**2 改（直接修改模板/phase/spec）**
- 策略：允许 `Planned`，但强制证据化（禁止把 Planned 写成已验证 Existing）。

#### Changes Applied (Files)

- `.claude/skills/slash-command-outliner/templates/slash-command-outline.md`
  - 在 `## Implementation Pointers` 后新增 `### Evidence (Existing vs Planned)`，要求：每个 pointer 标注 Existing/Planned，Existing 必须双证据（docs + TS），并要求可执行 Verify 命令。
  - 明确要求 `{{implementation.code_pointers}}` **按“一条 pointer 一行表格”展开**。

- `.claude/skills/slash-command-outliner/templates/gap-report.md`
  - 新增 `## Implementation Pointers (Evidence)` 表格段落，P0 规则：必须标注、禁止虚假存在、Existing 必须可验证、证据必须覆盖 docs + TS。

- `.claude/skills/slash-command-outliner/phases/04-gap-report-and-iterate.md`
  - 新增 “Evidence-Based Requirements (Deep Mode, P0)”：指针标注、禁止虚假存在、双源证据、verify 命令。

- `.claude/skills/slash-command-outliner/specs/quality-gates.md`
  - 新增 P0 Gate #5：Implementation pointers evidence-based（Existing vs Planned）+ dual-source evidence + verify 命令示例。

#### Operational Outcome

以后在对话中生成新命令 outline/gap-report 时：
- `Existing` 指针必须能被验证（至少路径存在），并给出 docs/TS 的具体锚点（section heading / function or case / rg-able string）。
- `Planned` 指针允许不存在，但必须写清楚证据来源（reference 模式）、原因与 Verify 计划。

#### Remaining Optional Work

（可选）补一个确定性脚本来自动检查：
- Evidence Table 中所有 `Existing` 的 `Pointer` 路径是否存在；
- 若提供 `rg "<pattern>" <path>`，可自动跑一次做锚点校验。

### Round 6 - Execution Readiness Check (2026-02-04T23:20:58+08:00)

#### User Question

紧接着 ANL-slash-command-outliner-2026-02-04 这个讨论，当前是否已经讨论完毕需要进入执行阶段？

#### Assessment

- 本次分析 session 在 `conclusions.json` 中已标记为 `status: completed`（完成时间：2026-02-04T22:45:00+08:00）。
- Round 5 已完成“对话产物证据化”的最小落地：模板/phase/spec 规则已写入，并已在仓库文件中可检索到关键段落（Evidence / No false existence claims）。
- 当前剩余工作均为**可选增强**：确定性校验脚本（自动验证 `Existing` 指针路径与 rg 锚点）、或后续再做性能优化（`implementation-hints` 的缓存/索引）。

#### Conclusion

是的：讨论已经收敛，可以进入执行阶段；只需要你确认下一步是先做“确定性校验脚本”，还是先跑一次实际生成/回归验证现有修改即可。
