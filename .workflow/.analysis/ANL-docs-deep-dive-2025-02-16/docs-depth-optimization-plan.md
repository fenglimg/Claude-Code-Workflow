# 文档深度优化计划

## 问题背景

### 当前状态
- 知识库文档是"索引/摘要"定位
- 原始 SKILL.md 382 行 vs 知识库文档 34 行
- **91% 信息丢失**：设计决策、交互流程、心智模型缺失

### 目标状态
- 建立"开发者深度学习"视角的文档体系
- 包含设计决策 rationale、模块交互流程、扩展点说明
- 支持渐进式学习路径

---

## 任务分解

### EPIC 1: 文档架构重组

#### TASK-1.1: 创建双层文档结构
**优先级**: P0
**估时**: 2h
**描述**:
- 创建 `docs/knowledge-base/deep-dive/` 目录结构
- 创建 `docs/knowledge-base/learning-paths/` 目录结构
- 更新 README.md 索引，区分参考层和学习层

**验收标准**:
- [ ] deep-dive/ 目录包含 architecture/, implementation/, extension/ 子目录
- [ ] learning-paths/ 目录包含入门、开发者、贡献者三个路径文档
- [ ] README.md 包含清晰的导航

---

#### TASK-1.2: 创建心智模型文档
**优先级**: P0
**估时**: 3h
**描述**:
创建 `deep-dive/architecture/mental-model.md`，包含：
- 核心抽象定义：命令、技能、代理、工具
- 组件职责边界
- 协作关系图
- 统一的架构心智图

**验收标准**:
- [ ] 定义 4 个核心抽象的职责和边界
- [ ] 包含组件协作的 Mermaid 图
- [ ] 解释"为什么是这 4 个抽象"

---

#### TASK-1.3: 创建设计决策文档
**优先级**: P0
**估时**: 4h
**描述**:
创建 `deep-dive/architecture/design-decisions.md`，包含：
- JSON-first 状态管理
- 多 CLI 工具策略
- Phase-based 技能结构
- SQLite 存储选择
- TypeScript vs Python

每个决策包含：
- 背景
- 考虑的替代方案
- 选择理由
- 权衡分析

**验收标准**:
- [ ] 至少记录 5 个关键设计决策
- [ ] 每个决策有 alternatives considered 章节
- [ ] 包含权衡分析

---

### EPIC 2: 模块深度文档

#### TASK-2.1: 创建 CLI 执行深度文档
**优先级**: P1
**估时**: 3h
**描述**:
创建 `deep-dive/implementation/cli-execution.md`，包含：
- 完整执行链路：cli.ts → commands/cli.ts → cli-executor-core.ts
- 数据流图
- 关键函数解析
- 错误处理机制

**验收标准**:
- [ ] 包含执行链路的 Mermaid 序列图
- [ ] 关键函数有参数、返回值、内部逻辑说明
- [ ] 包含错误处理流程

---

#### TASK-2.2: 创建技能系统深度文档
**优先级**: P1
**估时**: 4h
**描述**:
创建 `deep-dive/implementation/skill-phases.md`，包含：
- Phase-based 设计原理
- 阶段执行流程
- TodoWrite 模式
- Session 管理
- 以 brainstorm skill 为完整示例

**验收标准**:
- [ ] 解释 Phase-based 设计的由来
- [ ] 包含完整的阶段执行流程图
- [ ] brainstorm skill 作为端到端示例

---

#### TASK-2.3: 创建代理系统深度文档
**优先级**: P1
**估时**: 4h
**描述**:
创建 `deep-dive/implementation/agent-lifecycle.md`，包含：
- 21 个代理分类和职责
- Agent 配置结构
- 动态发现机制
- Agent/CLI 双模式执行
- Agent 与 Skill 的关系

**验收标准**:
- [ ] 列出所有 21 个代理及其分类
- [ ] 解释动态发现机制
- [ ] 包含 Agent 生命周期图

---

#### TASK-2.4: 创建模块交互流程文档
**优先级**: P1
**估时**: 3h
**描述**:
创建 `deep-dive/architecture/module-interactions.md`，包含：
- 核心执行链路数据流
- MCP Server 工具调用链路
- Memory 系统提取流水线
- Workflow/Session 状态流转

**验收标准**:
- [ ] 至少 4 个核心模块的交互流程图
- [ ] 包含触发条件和状态变化
- [ ] 标注关键数据结构

---

### EPIC 3: 扩展点文档

#### TASK-3.1: 创建"添加新技能"指南
**优先级**: P2
**估时**: 2h
**描述**:
创建 `deep-dive/extension/add-new-skill.md`，包含：
- 目录结构创建
- SKILL.md 必要字段
- phases/ 编写规范
- specs/ 和 templates/ 用途
- 完整示例

**验收标准**:
- [ ] 包含完整的目录结构模板
- [ ] 包含最小可行 SKILL.md 模板
- [ ] 包含端到端示例

---

#### TASK-3.2: 创建"添加新命令"指南
**优先级**: P2
**估时**: 2h
**描述**:
创建 `deep-dive/extension/add-new-command.md`，包含：
- 命令文件位置
- 注册流程
- 参数解析模式
- 与 Skill 的集成

**验收标准**:
- [ ] 包含命令模板代码
- [ ] 解释注册和路由机制
- [ ] 包含示例

---

#### TASK-3.3: 创建"添加新代理"指南
**优先级**: P2
**估时**: 2h
**描述**:
创建 `deep-dive/extension/add-new-agent.md`，包含：
- Agent 配置结构
- Front Matter 字段
- 工具权限配置
- 执行流程编写

**验收标准**:
- [ ] 包含 Agent 模板
- [ ] 解释动态发现机制
- [ ] 包含示例

---

### EPIC 4: 学习路径

#### TASK-4.1: 创建入门指南
**优先级**: P2
**估时**: 2h
**描述**:
创建 `learning-paths/getting-started.md`，包含：
- 30 分钟快速理解核心概念
- 关键术语表
- 第一个工作流示例

**验收标准**:
- [ ] 新用户能在 30 分钟内理解核心概念
- [ ] 包含术语表
- [ ] 包含可执行的示例

---

#### TASK-4.2: 创建开发者指南
**优先级**: P2
**估时**: 3h
**描述**:
创建 `learning-paths/developer-guide.md`，包含：
- 深入理解架构
- 调试技巧
- 性能优化
- 最佳实践

**验收标准**:
- [ ] 包含架构深入解读
- [ ] 包含调试和优化建议
- [ ] 包含最佳实践清单

---

## 优先级排序

| 优先级 | 任务 | 依赖 |
|--------|------|------|
| P0 | TASK-1.1 创建双层文档结构 | 无 |
| P0 | TASK-1.2 创建心智模型文档 | TASK-1.1 |
| P0 | TASK-1.3 创建设计决策文档 | TASK-1.1 |
| P1 | TASK-2.1 CLI 执行深度文档 | TASK-1.1 |
| P1 | TASK-2.2 技能系统深度文档 | TASK-1.1 |
| P1 | TASK-2.3 代理系统深度文档 | TASK-1.1 |
| P1 | TASK-2.4 模块交互流程文档 | TASK-1.2, TASK-1.3 |
| P2 | TASK-3.1 添加新技能指南 | TASK-2.2 |
| P2 | TASK-3.2 添加新命令指南 | TASK-2.1 |
| P2 | TASK-3.3 添加新代理指南 | TASK-2.3 |
| P2 | TASK-4.1 入门指南 | TASK-1.2 |
| P2 | TASK-4.2 开发者指南 | All P0, P1 |

---

## 预期产出

完成后的知识库结构：

```
docs/knowledge-base/
├── README.md                    # 更新导航
├── reference/                   # 快速参考层
│   ├── commands/
│   ├── skills/
│   └── agents/
├── deep-dive/                   # 深度学习层（新增）
│   ├── architecture/
│   │   ├── mental-model.md
│   │   ├── design-decisions.md
│   │   └── module-interactions.md
│   ├── implementation/
│   │   ├── cli-execution.md
│   │   ├── skill-phases.md
│   │   └── agent-lifecycle.md
│   └── extension/
│       ├── add-new-skill.md
│       ├── add-new-command.md
│       └── add-new-agent.md
└── learning-paths/              # 学习路径（新增）
    ├── getting-started.md
    ├── developer-guide.md
    └── contributor-guide.md
```

---

## 成功指标

1. **完整性**: 所有 27 Skills + 48 Commands + 21 Agents 都有深度文档
2. **可学习性**: 新用户能在 30 分钟内理解核心概念
3. **可扩展性**: 开发者能根据扩展点文档独立添加新功能
4. **可维护性**: 文档结构清晰，易于更新和扩展

---

*计划生成于 2025-02-16*
*基于分析会话: ANL-docs-deep-dive-2025-02-16*
