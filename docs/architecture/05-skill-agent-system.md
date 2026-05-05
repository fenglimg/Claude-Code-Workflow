# Skill + Agent 工作流体系

> **层级**: L3 — 核心模块 | **更新**: 2026-05-03

## Skill 系统

### 4 源加载

```
skill-context-loader.ts → getAvailableSkills():

  项目级:
    1. {cwd}/.claude/skills/        ← 52 skills (Claude)
    2. {cwd}/.claude/workflow-skills/ ← 7 workflow skills

  用户级:
    3. ~/.claude/skills/            ← 用户自定义 skills
    4. ~/.claude/workflow-skills/   ← 用户工作流 skills

  加载规则:
    - 扫描每个目录下的子目录
    - 检查子目录中是否存在 SKILL.md
    - 解析 SKILL.md frontmatter (name, description, allowed-tools)
    - 按 folderName 去重（项目级优先）
```

### SKILL.md 结构

```markdown
---
name: workflow-lite-plan
description: Lightweight planning skill - task analysis, ...
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent, ...
---

# Skill Title

## Trigger Conditions
- 关键词: "lite-plan", "快速任务", ...

## Operation Modes
### Mode 1: ...
### Mode 2: ...

## Execution Flow
...
```

### 关键词触发机制

```
User Prompt
    │
    ▼
┌────────────────────────────────────┐
│ skill-context-loader.ts            │
│                                    │
│ matchKeywords(prompt, skill):      │
│   遍历 skill.keywords[]            │
│   正则匹配 prompt 文本              │
│   命中 → formatSkillInvocation()   │
│                                    │
│ formatSkillInvocation():           │
│   Skill({                           │
│     skill: "skill-name",            │
│     args: "user prompt context"     │
│   })                                │
└────────────────────────────────────┘
```

### Skill 分类

| 类别 | Claude | Codex | 总计 | 示例 |
|------|--------|-------|------|------|
| **Workflow Skills** (单管道) | 8 | 10 | 18 | workflow-plan, workflow-lite-plan, workflow-execute, workflow-tdd-plan, analyze-with-file, brainstorm-with-file, debug-with-file |
| **Team Skills** (团队协作) | 22 | 22 | 44 | team-planex, team-lifecycle-v4, team-coordinate, team-brainstorm, team-review, team-issue, team-frontend, team-arch-opt |
| **Standalone Skills** (独立) | 13 | 13 | 26 | brainstorm, review-code, spec-generator, issue-manage, memory-capture, memory-manage, ccw-cli-tools, clean |
| **Meta Skills** (元技能) | 6 | 1 | 7 | skill-generator, skill-tuning, skill-simplify, skill-iter-tune, team-designer, workflow-skill-designer |
| **Workflow Skills** (链式) | 3 | 0 | 3 | ccw-chain, wf-composer, wf-player |

### Skill 目录结构

```
.claude/skills/{skill-name}/
├── SKILL.md              ← 入口 + frontmatter
├── phases/               ← 阶段文件（渐进式加载）
│   ├── 01-xxx.md
│   ├── 02-xxx.md
│   └── ...
├── specs/                ← 规格配置
├── templates/            ← 模板
└── roles/                ← Team skill 角色定义
    ├── coordinator/
    └── worker/
```

---

## Agent 系统

### 双格式定义

```
Claude 生态 (.claude/agents/*.md):
  ---
  name: cli-explore-agent
  description: Read-only code exploration agent...
  tools: Read, Bash, Glob, Grep
  color: blue
  ---
  # Agent Role Definition
  ## Phase 1: Task Understanding
  ## Phase 2: Analysis Execution
  ...

Codex 生态 (.codex/agents/*.toml):
  [agent]
  name = "codex-explore-agent"
  description = "..."
  tools = ["read", "search", "grep"]
```

### Agent 类型

| 类型 | 数量 | 代表 |
|------|------|------|
| **Exploration** | 4 | cli-explore-agent, context-search-agent, explore-agent |
| **Execution** | 6 | cli-execution-agent, code-developer, universal-executor, tdd-developer |
| **Planning** | 5 | cli-planning-agent, action-planning-agent, conceptual-planning-agent |
| **Team Workers** | 8 | team-worker, team-supervisor, issue-plan-agent, issue-queue-agent |
| **Specialized** | 6 | ui-design-agent, debug-explore-agent, doc-generator, test-fix-agent |
| **Research** | 2 | workflow-research-agent, memory-bridge |

### Beat Event 模型 (Team Worker)

```
Coordinator                Worker
    │                         │
    │── spawn worker ────────▶│
    │                         │── Phase 1: Task Discovery
    │                         │── Phase 2-4: Role-specific logic
    │                         │── Phase 5: Report + Notify
    │◀── callback/result ────│
    │                         │
    │── next beat ──────────▶│ (idle → wake → execute → idle)
    │                         │
```

### Team Worker 生命周期

```
Phase 1: Task Discovery  — 扫描并认领任务
Phase 2: Context Loading — 加载 role-spec 领域逻辑
Phase 3: Execution       — 执行 role-specific 工作
Phase 4: Quality Check   — 自检 + 验证
Phase 5: Report          — 写报告 + Pipeline 通知
```

### 消息总线协议

```
team-msg tool:
  { session_id, from, to, type, summary, data }

消息类型:
  - task_claim      — Worker 认领任务
  - progress_update — 进度更新
  - checkpoint_req  — Coordinator 检查点请求
  - checkpoint_rpt  — Worker 检查点报告
  - handoff         — Worker 间交接
  - completion      — 任务完成通知
```

---

## Command 系统

### 自动发现

```
command-registry.ts → findCommandDir():
  1. {cwd}/.claude/commands/  ← 项目级优先
  2. ~/.claude/commands/      ← 用户级 fallback

parseYamlHeader() (L72-L117):
  简易 YAML frontmatter 解析器
  提取: name, description, allowed-tools
```

### 38 个 Slash Commands

```
核心:    /ccw, /ccw-coordinator, /workflow-tune
工作流:  /workflow:analyze-with-file, /workflow:brainstorm-with-file, /workflow:clean
         /workflow:debug-with-file, /workflow:integration-test-cycle, /workflow:refactor-cycle
         /workflow:roadmap-with-file
会话:    /workflow:session:start, /workflow:session:resume
         /workflow:session:complete, /workflow:session:sync, /workflow:session:list
规格:    /workflow:spec:add, /workflow:spec:load, /workflow:spec:setup
UI设计:  /workflow:ui-design:animation-extract, /workflow:ui-design:codify-style
         /workflow:ui-design:design-sync, /workflow:ui-design:explore-auto
         /workflow:ui-design:generate, /workflow:ui-design:imitate-auto
         /workflow:ui-design:import-from-code, /workflow:ui-design:layout-extract
         /workflow:ui-design:reference-page-generator, /workflow:ui-design:style-extract
Issue:   /issue:discover, /issue:discover-by-prompt, /issue:new, /issue:plan
         /issue:execute, /issue:from-brainstorm, /issue:convert-to-plan, /issue:queue
Memory:  /memory:prepare, /memory:style-skill-memory
```

### ccw.md 主编排器

```
/ccw "task description"
  → 意图分析 (task type, complexity, clarity)
  → 自动选择工作流级别 (L1-L4 或 Issue 或 Team)
  → 构建命令链
  → 确认 + 执行

15-skill 映射表 (ccw.md):
  "Add API endpoint"      → L2: lite-plan → test-fix
  "Fix login timeout"     → L2: lite-plan → test-fix
  "重构 auth 模块"        → L3: refactor-cycle
  "头脑风暴: 通知系统"    → L4: brainstorm-with-file → workflow-plan → execute
  "roadmap: OAuth + 2FA"  → L4: roadmap-with-file → team-planex
  "team planex: 用户系统" → Team: team-planex wave pipeline
```
