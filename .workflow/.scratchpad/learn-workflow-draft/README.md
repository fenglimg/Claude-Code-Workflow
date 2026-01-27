# Learn Workflow - 完整架构与实现文档

> **文档状态**: ✅ **Live Document** | **最后更新**: 2026-01-26
>
> **设计原则**: 完全隔离（Isolated Strategy）、Fork友好、零核心代码修改
> **核心理念**: 本文档是`learn-workflow`的唯一真实来源（Single Source of Truth），整合了原始设计、实现细节和未来规划。

## 一、核心设计理念

### 1.1 架构原则

**Isolated Strategy（隔离策略）**
- **独立存储**: `.workflow/learn/` 完全独立于 `.workflow/active/`。
- **零依赖**: 不使用 `session-manager` 或其他核心内部模块。
- **松耦合**: 通过 CLI 接口与现有系统集成（issue/workflow）。
- **Fork 友好**: 所有新增功能均为纯添加，可安全合并上游更新。

**自包含应用模式**
```
learn workflow = 独立应用 + CLI调用入口
  ├─ 独立状态管理（文件系统作为数据库）
  ├─ 独立命令实现（.claude/commands/learn/）
  └─ 外部集成（通过 ccw CLI 命令）
```

### 1.2 与现有系统的关系

| 系统 | 集成方式 | 说明 |
|------|----------|------|
| **workflow 系统** | CLI 调用 | `learn:review` → `ccw workflow:lite-plan` |
| **issue 系统** | CLI 调用 | `learn:next` → `ccw issue create` |
| **session-manager** | 无依赖 | 完全独立的状态管理 |
| **核心代码** | 无修改 | 纯新增功能 |

## 二、目录结构与数据模型

### 2.1 目录结构

```
.
├── .workflow/
│   └── learn/                              # ROOT: learn 工作流所有数据
│       ├── state.json                      # 全局状态：当前激活的 profile 和 session
│       ├── profiles/                       # 用户学习档案
│       │   └── {profile-id}.json
│       ├── sessions/                       # 学习会话
│       │   └── {session-id}/
│       └── tech-stack/                     # [新增] 技术栈检测支持
│           └── KeywordDictionary.json
│
└── .claude/
    └── commands/
        └── learn/                          # 新增：learn 命令集
            ├── profile.md
            ├── plan.md
            ├── execute.md
            ├── ask.md
            └── review.md
```

### 2.2 数据 Schema

**Canonical schema location (单一真实来源)**:
- `.claude/workflows/cli-templates/schemas/learn-profile.schema.json`
- `.claude/workflows/cli-templates/schemas/learn-plan.schema.json`

这些 schema 定义了 `.workflow/learn/` 下的文件结构（例如：`state.json`, `profiles/{id}.json`, `sessions/{id}/plan.json`, `sessions/{id}/progress.json`）。

---

## 三、命令架构与实现细节

### 3.1 命令概览与状态

| 命令 | 职责 | 实现状态 | Agent 使用 |
|:---|:---|:---|:---|
| **learn:profile** | 个人档案管理 | ✅ **已实现 (Enhanced)** | **Simulated Agent** |
| **learn:plan** | 学习计划生成 | ✅ **已实现 (Partial)** | **Simulated Agent** |
| **learn:execute** | 知识点执行 | ⏳ **未开始** | N/A |
| **learn:ask** | 导师问答 | ⏳ **未开始** | `learn-mentor-agent` (planned) |
| **learn:review** | 学习回顾 | ⏳ **未开始** | N/A |

### 3.2 命令详细设计

---

#### **命令 1: `/learn:profile` - 个人档案管理**

**功能**: 创建、更新、选择和显示个人学习档案。

##### **实现状态与细节**
- **Status**: ✅ **已实现 (Enhanced)**
- **Implementation File**: `.claude/commands/learn/profile.md`
- **Key Implementation Details**:
    1.  **Simulated Agent**: `learn-profiling-agent` 并非通过 `ccw cli` 调用的独立 agent，而是通过在命令文件内部编排一系列 `AskUserQuestion` 交互来实现的 **“模拟 Agent”**。
        *   **参考**: `.claude/commands/learn/profile.md:118-280`
    2.  **Direct State Management**: 该命令直接使用 `Read()` 和 `Write()` 工具读写 `.workflow/learn/profiles/` 和 `.workflow/learn/state.json` 文件。
        *   **参考**: `.claude/commands/learn/profile.md:663-681`
    3.  **Multi-Factor Assessment Algorithm**: 通过多因子验证算法来计算技能熟练度，公式为：`finalProficiency = (conceptScore * weights.concept) + (challengeScore * weights.challenge)`。`weights` 根据用户的学习目标（`goalType`）动态调整。
        *   **参考**: `.claude/commands/learn/profile.md:295-500`
    4.  **Dynamic Tech Stack Detection**: 实现了一个基于 `KeywordDictionary.json` 的动态技术栈检测流程。该流程通过 `AskUserQuestion` 与用户确认推断出的技术，体现了 "User-in-the-loop" 的设计。
        *   **参考**: `.claude/commands/learn/profile.md:129-224`

##### **采用的设计模式**
-   **用户确认关口 (User Confirmation Gates)**: 整个评估流程是 `AskUserQuestion` 的一系列调用，确保用户对档案创建的每一步都有控制。此模式借鉴自 `/workflow:develop-with-file`。

---

#### **命令 2: `/learn:plan` - 学习计划生成**

**功能**: 根据学习目标和个人档案生成结构化的学习计划。

##### **实现状态与细节**
- **Status**: ✅ **已实现 (Partial)**
- **Implementation File**: `.claude/commands/learn/plan.md`
- **Key Implementation Details**:
    - 已实现档案与计划的集成，`learn:plan` 命令在生成计划前会检查当前 `profile` 是否过时或缺少相关技术栈，并提示用户更新。
        *   **参考**: `.claude/commands/learn/plan.md:157-221`
    - 计划生成的核心逻辑（Agent调用）仍为模拟状态。

---

#### **命令 3-5: `/learn:execute`, `/learn:ask`, `/learn:review`**

##### **实现状态与细节**
- **Status**: ⏳ **未开始 (Not Started)**
- **Implementation File**: N/A
- **Key Implementation Details**: 这些命令的设计保留在本文档中作为未来实现的蓝图。

---

## 四、设计模式与技术决策

本节记录 `learn-workflow` 在实现中采用的关键模式，以及与项目其它部分存在的差异。

### 1. Agent 调用模式 (Agent Invocation Pattern)
- **当前实现**: "模拟 Agent" 模式。在 `/learn:profile` 中，复杂的评估流程并未调用真正的 `ccw cli` agent，而是通过 `AskUserQuestion` 的一系列交互来模拟 agent 的评估和决策过程。
- **目标模式**: "CLI Agent" 模式。未来的 `learn:plan` 和 `learn:ask` 应遵循 `/issue:convert-to-plan` 和 `/workflow:develop-with-file` 的模式，通过 `ccw cli -p "..."` 调用真正的 LLM agent 来执行复杂的分析和生成任务。

### 2. 状态管理模式 (State Management Pattern)
- **当前实现**: "直接文件操作" 模式。`/learn:profile` 直接使用 `Read()` 和 `Write()` 工具来读写 `state.json` 和 `profile.json`。
- **目标模式**: "CLI 状态访问原则"。如 `/issue:convert-to-plan` 所示，所有状态变更都应通过专用的 CLI 命令（例如 `ccw learn update-profile`）来完成，而不是直接操作文件。这为状态管理提供了一个稳定和抽象的 API。

## 五、架构决策与技术债务

| 决策点/债务 | 描述 | 理由/影响 | 改进建议 |
|:---|:---|:---|:---|
| **(Debt) 直接状态管理** | `/learn:profile` 直接读写状态文件，违反了 "CLI 状态访问原则"。 | **理由**: 作为 MVP 的快速实现。 **影响**: 增加了未来状态逻辑变更的风险，降低了可维护性。 | **Refactor**: 创建 `ccw learn <subcommand>` 接口用于所有状态变更，并更新 `/learn:*` 命令以使用这些 CLI 接口。 |
| **(Decision) 模拟 Agent** | 使用 `AskUserQuestion` 编排复杂的交互流程，而不是调用 `ccw cli`。 | **理由**: 对于高度交互、需要用户逐步确认的场景（如技能评估），此模式比单次 agent 调用更具控制力。 **影响**: 降低了对 LLM 的依赖，但增加了命令脚本的复杂性。 | **Maintain**: 对于 `profile` 创建等高度交互场景，保留此模式是合理的。对于 `plan` 生成等分析密集型任务，应转向真正的 agent 调用。 |
| **(Debt) 模拟 MCP** | 技能评估中的“微挑战”依赖用户自报告完成情况，而非真实的代码执行和验证。 | **理由**: 缺乏安全的沙箱执行环境。 **影响**: 评估结果的客观性受限，"Evidence-Based" 原则未完全实现。 | **Integrate**: 集成沙箱执行环境（如 Docker/VM），以实现真实的代码挑战验证。 |
| **(Decision) 隔离策略** | `learn-workflow` 完全独立，不依赖 `session-manager` 等核心模块。 | **理由**: Fork 友好，零核心代码修改，易于维护和迭代。 **影响**: 需要自建状态管理，但保证了系统的稳定性。 | **Retain**: 这是本工作流的核心优势，应继续保持。 |

## 六、未来展望 (原 v2.0 规划)

以下是为 `learn-workflow` 规划的未来增强功能，当前尚未实现。

- **三层用户画像**: 引入全局 Persona、可继承的 Profile 和一次性的 Session Context，构建更丰富的用户模型。
- **跨会话知识图谱**: 在 `.workflow/learn/knowledge/` 中建立全局知识图谱，实现知识的关联与复用。
- **真实 MCP 集成**: 对接沙箱环境，实现代码挑战的自动验证。
- **完整的 QA 层**: 引入 Schema 验证、图有效性检查、档案-计划匹配度检查等多层质量保证。

**版本**: v1.1.0 (Live Document)
**状态**: MVP Implemented - Documentation Updated
