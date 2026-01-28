# Analysis Discussion

**Session ID**: ANL-learn-execute-design-承接profile-plan-2026-01-27
**Topic**: learn:execute 命令设计 - 如何承接 learn:profile 和 learn:plan
**Started**: 2026-01-27T23:09:45+08:00
**Dimensions**: architecture, implementation, design, integration

---

## User Context

**Focus Areas**:
- learn:execute 命令的架构设计
- 如何使用 learn:profile 的用户画像数据
- 如何使用 learn:plan 生成的知识点结构
- 与现有 learn workflow 的集成方式

**Analysis Depth**: Deep Dive (comprehensive analysis)

**Reference Documents**:
- `.workflow/.scratchpad/learn-workflow-draft/README.md` (learn workflow 完整架构)
- `.claude/workflows/cli-templates/schemas/learn-profile.schema.json` (profile schema)
- `.claude/workflows/cli-templates/schemas/learn-plan.schema.json` (plan schema)

---

## Discussion Timeline

### Round 1 - Initial Understanding (2026-01-27 23:09)

#### Topic Analysis

基于话题 "learn:execute 命令设计 - 如何承接 learn:profile 和 learn:plan":

- **Primary dimensions**: architecture (命令架构), implementation (实现细节), design (交互设计), integration (系统集成)
- **Initial scope**:
  - learn:execute 是 learn workflow 的核心执行命令
  - 需要读取 learn:profile 的用户画像数据来个性化学习体验
  - 需要读取 learn:plan 的知识点 DAG 来驱动学习流程
  - 需要设计状态管理、进度跟踪、评估机制

- **Key questions to explore**:
  1. learn:execute 的核心职责是什么? (执行单个知识点 vs 管理整个学习会话)
  2. 如何使用 profile 数据? (学习偏好、时间可用性、技能水平)
  3. 如何使用 plan 数据? (知识点依赖、资源推荐、评估标准)
  4. 状态管理策略? (progress.json 结构、状态更新时机)
  5. 与其他命令的交互? (learn:ask 导师问答、learn:review 回顾)

#### Initial Understanding from Documents

从 README.md 中了解到:

**现有实现状态**:
- ✅ learn:profile - 已实现 (Enhanced), 使用模拟 Agent 模式
- ✅ learn:plan - 已实现 (Partial), 生成知识点 DAG
- ⏳ learn:execute - **未开始**
- ⏳ learn:ask - 未开始 (计划使用 learn-mentor-agent)
- ⏳ learn:review - 未开始

**Profile Schema 关键字段**:
- `known_topics[]`: 用户已知技能 (topic_id, proficiency, confidence, evidence)
- `learning_preferences`: 学习风格 (practical/theoretical/visual)
- `time_availability`: 时间可用性 (hours_per_week, schedule)
- `career_context`: 职业背景 (current_role, target_role)

**Plan Schema 关键字段**:
- `knowledge_points[]`: 知识点列表 (id, title, prerequisites, resources, assessment, status)
- `dependency_graph`: DAG 结构 (nodes, edges)
- 每个知识点包含:
  - `resources[]`: 学习资源 (type, url, quality: gold/silver/bronze)
  - `assessment`: 评估方式 (practical_task/code_challenge/multiple_choice)
  - `status`: 状态 (pending/in_progress/completed/skipped/optional)

**设计约束**:
- 遵循 "Isolated Strategy" - 不依赖 session-manager
- 直接文件操作 vs CLI 状态访问 (技术债务)
- 模拟 Agent vs 真实 CLI Agent (设计决策)

#### Next Steps

1. ✅ 启动 CLI 探索收集代码库上下文 - **已完成**
2. ❌ 使用 Gemini 进行架构分析 - **失败** (API key 不可用, 503 Service Unavailable)
3. ✅ 准备讨论点与用户交互 - **基于代码库探索结果**

#### Exploration Results (2026-01-27 23:30)

**Sources Analyzed**:
- **Codebase Exploration** (cli-explore-agent): 12 个关键文件,6 个核心模式,15 个关键发现
- **Gemini CLI Analysis**: ❌ 失败 (API key 不可用)
- **Fallback**: 基于代码库探索结果进行分析

**Key Findings from Codebase Exploration**:

1. **Agent 调用模式**: learn:profile 和 learn:plan 使用**真实 CLI Agent** (非模拟),通过 `ccw cli -p "..." --tool gemini` 调用
2. **状态管理策略**: 
   - 全局状态 (state.json) → CLI State API (`ccw learn:read-state`, `ccw learn:update-state`)
   - 会话状态 (sessions/*/plan.json) → 直接文件操作
   - 原子操作: `withLearnLock()` + `atomicWriteJson()` + schema 验证
3. **评估执行基础设施**: `mcp-runner.js` 提供沙箱执行环境,使用 Node.js permission model
4. **会话结构**: `.workflow/learn/sessions/${sessionId}/{plan.json, interactions/notes/, interactions/jit-assessments.json}`
5. **知识点状态枚举**: `pending, in_progress, completed, skipped, optional`
6. **多层验证管道**: schema (Ajv) → domain logic (DAG cycle check) → warnings (profile-plan mismatch)

**Points for Discussion**:

1. **命令粒度**: learn:execute 应该管理整个会话(所有 KPs)还是单个 KP 执行?
   - 选项 A: 单个 KP 执行,循环在命令层
   - 选项 B: 整个会话管理,内部迭代所有 KPs
   - **推荐**: 选项 A (单个 KP,更灵活)

2. **资源呈现策略**: 如何向用户展示学习资源?
   - 选项 A: 终端显示链接
   - 选项 B: 自动打开浏览器
   - 选项 C: 生成 HTML 摘要
   - **推荐**: 选项 A (简单直接)

3. **评估验证策略**: 评估是否强制执行?
   - 选项 A: 所有 KPs 强制评估
   - 选项 B: 可选 `--skip-assessment` 标志
   - 选项 C: 根据 KP 难度自适应
   - **推荐**: 选项 B (灵活性)

4. **Profile 更新时机**: 何时更新用户画像?
   - 选项 A: 每个 KP 完成后立即更新
   - 选项 B: 会话结束批量更新
   - 选项 C: 用户触发单独命令
   - **推荐**: 选项 A (实时反馈)

5. **会话恢复支持**: 是否支持中断恢复?
   - **推荐**: 是,通过 `--resume` 标志检查 `active_session_id`

6. **进度跟踪**: 是否使用 TodoWrite?
   - **推荐**: 是,遵循 `workflow:execute` 模式保持一致性

7. **Agent vs 直接实现**: 是否创建 `learn-execution-agent`?
   - **推荐**: 直接实现(简单),仅在需要复杂逻辑时使用 agent

8. **错误处理**: 如何处理评估失败、资源不可用、用户放弃?
   - **推荐**: 标记为 'skipped',允许重试,记录到 `interactions/errors.json`

9. **反馈收集**: 是否在每个 KP 后收集用户反馈?
   - **推荐**: 是,存储到 `profile.feedback_journal` 用于计划改进

10. **与 learn:ask 的协作**: 如何集成导师问答?
    - **推荐**: 在学习阶段提供 "Ask Mentor" 选项,调用 `learn:ask` 命令

### Round 2 - User Decisions (2026-01-27 23:20)

#### User Input

用户对 4 个关键设计问题做出了决策:

1. **命令粒度**: ✅ **单个 KP 执行**
   - 每次执行一个知识点,循环在命令层
   - 优点: 灵活、可控、易测试
   - 实现: `learn:execute [session-id] --kp=<kp-id>`

2. **评估验证策略**: ✅ **强制评估**
   - 所有 KPs 必须通过评估才能标记为 completed
   - 保证学习质量,不允许跳过
   - 实现: 评估失败时提供重试,但不提供 --skip-assessment 标志

3. **Profile 更新时机**: ✅ **实时更新**
   - 每个 KP 完成后立即更新 profile.json
   - 优点: 实时反馈、数据新鲜
   - 实现: 每次 KP 完成后调用 profile 更新逻辑

4. **进度跟踪**: ✅ **仅文件记录**
   - 不使用 TodoWrite,仅在 plan.json 中更新状态
   - 优点: 简单、减少依赖
   - 实现: 直接修改 plan.json 中的 KP status 字段

#### Updated Understanding

基于用户决策,learn:execute 的核心设计确定为:

**命令签名**:
```bash
learn:execute [session-id] [--kp=<kp-id>] [--resume]
```

**执行流程** (单个 KP):
1. **Session Discovery**: 从 state.json 加载 active_session_id 或使用参数
2. **KP Selection**: 
   - 如果指定 --kp,加载该 KP
   - 否则从 plan.json 找第一个 pending KP
   - 检查前置依赖是否满足
3. **Resource Presentation**: 显示资源列表(带质量标签)
4. **Learning Phase**: 用户学习,命令等待确认
5. **Assessment Execution**: 
   - 根据 assessment.type 执行评估
   - **强制通过**,失败时允许重试(最多 3 次)
6. **Profile Update**: 
   - **实时更新** profile.json
   - 添加新 evidence,更新 proficiency 和 confidence
7. **Status Update**: 
   - 更新 plan.json 中的 KP status: pending → completed
   - **不使用 TodoWrite**

**Open Questions** (待讨论):
- progress.json 的具体 schema 结构? (或者直接使用 plan.json 的 status 字段?)
- 如何处理知识点的前置依赖检查?
- 评估失败 3 次后如何处理? (标记为 failed? 允许稍后重试?)
- 如何记录学习时间和学习笔记?
- 资源呈现的具体交互方式? (显示后等待用户确认? 提供笔记功能?)

---

## Current Understanding

**learn:execute 的核心职责** (基于探索发现):

1. **会话发现**: 从 state.json 加载 active_session_id 或使用 `--session-id` 参数
2. **知识点选择**: 如果指定 `--kp`,加载该 KP;否则从 plan.json 找下一个 pending/in_progress KP
3. **资源呈现**: 显示资源(带质量指标),根据请求打开链接
4. **学习促进**: 用户学习资源,命令等待或提供交互式笔记
5. **评估验证**: 通过 mcp-runner.js 运行评估 (practical_task, code_challenge, multiple_choice)
6. **Profile 更新**: 更新 known_topics,添加新证据、熟练度和置信度分数
7. **进度跟踪**: 更新 plan.json 中的 KP 状态,推进到下一个 KP 或完成会话

**数据流设计**:

```
learn:profile → profile.json (用户画像)
                ↓
learn:plan → plan.json (知识点 DAG)
                ↓
learn:execute → 读取 plan.json
             → 呈现资源
             → 执行评估
             → 更新 profile.json (新证据)
             → 更新 plan.json (KP 状态)
             → 记录 interactions/
```

**状态管理策略**:

- **全局状态**: `ccw learn:read-state` / `ccw learn:update-state` (state.json)
- **会话状态**: 直接 Read/Write (sessions/${sessionId}/plan.json)
- **Profile 更新**: Read profile.json → 修改 → Write back (暂无 CLI API)
- **原子操作**: 遵循 `atomicWriteJson` 模式: write to .tmp → validate → rename

**评估验证机制**:

- **practical_task**: 呈现任务描述,用户实现,通过 mcp-runner.js 验证
- **code_challenge**: 类似 practical_task 但有更严格的验收标准
- **multiple_choice**: 使用 AskUserQuestion,验证答案

**关键设计模式** (可复用):

1. `lastJsonObjectFromText()` - 从命令输出解析 JSON
2. `withLearnLock()` - 原子状态操作的独占锁
3. `atomicWriteJson()` - 带备份、验证和回滚的 JSON 写入
4. Key-based `AskUserQuestion` - 健壮的用户交互
5. `mcp-runner` 调用 - 沙箱代码执行
6. 验证管道 - 多层数据验证
