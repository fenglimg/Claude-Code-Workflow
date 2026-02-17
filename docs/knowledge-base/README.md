# CCW Knowledge Base

Claude-Code-Workflow (CCW) 知识库 - 全面覆盖架构、命令、技能、MCP 和服务器组件。

## 文档分层

CCW 知识库采用**双层文档架构**，满足不同学习和使用需求：

| 层级 | 路径 | 定位 | 适用场景 |
|------|------|------|----------|
| **参考层** | `reference/` | 快速查找、API 参考 | 日常使用、命令查找 |
| **深度层** | `deep-dive/` | 深度学习、设计决策 | 理解架构、扩展开发 |
| **学习路径** | `learning-paths/` | 渐进式学习 | 入门指南、开发者指南 |

---

## 目录结构

```
docs/knowledge-base/
├── README.md                    # 本文件 - 索引和导航
├── schema.json                  # 元数据 JSON Schema
│
├── reference/                   # 📖 参考层 - 快速查找
│   ├── commands/                # 命令参考
│   ├── skills/                  # 技能参考
│   └── agents/                  # 代理参考
│
├── deep-dive/                   # 🔬 深度层 - 深入学习
│   ├── architecture/            # 架构设计
│   │   ├── mental-model.md      # 心智模型
│   │   ├── design-decisions.md  # 设计决策
│   │   └── module-interactions.md # 模块交互
│   ├── implementation/          # 实现细节
│   │   ├── cli-execution.md     # CLI 执行链
│   │   ├── skill-phases.md      # 技能阶段系统
│   │   └── agent-lifecycle.md   # 代理生命周期
│   └── extension/               # 扩展指南
│       ├── add-new-skill.md     # 添加新技能
│       ├── add-new-command.md   # 添加新命令
│       └── add-new-agent.md     # 添加新代理
│
└── learning-paths/              # 🎓 学习路径 - 渐进学习
    ├── getting-started.md       # 入门指南 (30min)
    ├── developer-guide.md       # 开发者指南
    └── contributor-guide.md     # 贡献者指南
```

---

## 快速导航

### 按需求导航

| 我想要... | 查看 |
|-----------|------|
| **30 分钟理解核心概念** | [learning-paths/getting-started.md](learning-paths/getting-started.md) |
| **查找命令用法** | [reference/commands/](reference/commands/) |
| **理解架构设计** | [deep-dive/architecture/mental-model.md](deep-dive/architecture/mental-model.md) |
| **了解设计决策** | [deep-dive/architecture/design-decisions.md](deep-dive/architecture/design-decisions.md) |
| **添加新功能** | [deep-dive/extension/](deep-dive/extension/) |
| **深度调试** | [learning-paths/developer-guide.md](learning-paths/developer-guide.md) |

### 按角色导航

| 角色 | 推荐路径 |
|------|----------|
| 新用户 | `learning-paths/getting-started.md` → `reference/commands/` |
| 开发者 | `deep-dive/architecture/mental-model.md` → `deep-dive/implementation/` |
| 贡献者 | `deep-dive/extension/` → `learning-paths/contributor-guide.md` |

---

## 参考层 (Reference)

### 命令参考

**位置**: [reference/commands/](reference/commands/)

核心命令:
- `ccw install` - 安装工作流
- `ccw view` - 打开仪表板
- `ccw cli` - 执行 CLI 工具
- `/ccw` - 自动工作流编排
- `/workflow:plan` - 标准规划

### 技能参考

**位置**: [reference/skills/](reference/skills/)

核心技能:
- `brainstorm` - 多角色头脑风暴
- `review-code` - 代码审查
- `project-analyze` - 项目分析
- `team-lifecycle` - 团队协作

### 代理参考

**位置**: [reference/agents/](reference/agents/)

核心代理:
- `code-developer` - 代码实现
- `cli-explore-agent` - 代码探索
- `test-fix-agent` - 测试修复
- `universal-executor` - 通用执行

---

## 深度层 (Deep-Dive)

### 架构深度

| 文档 | 内容 |
|------|------|
| [mental-model.md](deep-dive/architecture/mental-model.md) | 核心抽象、组件职责、协作关系 |
| [design-decisions.md](deep-dive/architecture/design-decisions.md) | 关键技术决策的背景和权衡 |
| [module-interactions.md](deep-dive/architecture/module-interactions.md) | 模块间数据流和交互流程 |

### 实现深度

| 文档 | 内容 |
|------|------|
| [cli-execution.md](deep-dive/implementation/cli-execution.md) | CLI 执行链路、数据流图 |
| [skill-phases.md](deep-dive/implementation/skill-phases.md) | Phase-based 设计原理 |
| [agent-lifecycle.md](deep-dive/implementation/agent-lifecycle.md) | 代理生命周期、发现机制 |

### 扩展指南

| 文档 | 内容 |
|------|------|
| [add-new-skill.md](deep-dive/extension/add-new-skill.md) | 技能目录结构、SKILL.md 编写 |
| [add-new-command.md](deep-dive/extension/add-new-command.md) | 命令注册、参数解析 |
| [add-new-agent.md](deep-dive/extension/add-new-agent.md) | 代理配置、工具权限 |

---

## 学习路径 (Learning Paths)

### 入门指南 (30 分钟)

**位置**: [learning-paths/getting-started.md](learning-paths/getting-started.md)

内容:
- 核心概念速览
- 关键术语表
- 第一个工作流示例

### 开发者指南

**位置**: [learning-paths/developer-guide.md](learning-paths/developer-guide.md)

内容:
- 架构深入解读
- 调试技巧
- 性能优化
- 最佳实践

### 贡献者指南

**位置**: [learning-paths/contributor-guide.md](learning-paths/contributor-guide.md)

内容:
- 贡献流程
- 代码规范
- 测试要求

---

## 遗留文档

以下文档保留向后兼容，建议迁移到新结构：

| 原位置 | 建议迁移到 |
|--------|-----------|
| `architecture/overview.md` | `deep-dive/architecture/mental-model.md` |
| `commands/cli-reference.md` | `reference/commands/` |
| `skills/overview.md` | `reference/skills/` |
| `mcp/integration.md` | `reference/mcp/` |
| `servers/architecture.md` | `deep-dive/implementation/` |

---

## 覆盖范围

### 核心组件覆盖率

- **ccw/src/core/** - 服务器、内存存储、会话管理
- **ccw/src/commands/** - 主要命令
- **ccw/src/tools/** - 核心工具
- **.claude/skills/** - 27 个技能
- **.claude/commands/** - 48 个命令
- **.claude/agents/** - 21 个代理

---

## 元数据

所有知识库文档遵循 `schema.json` 定义的元数据结构。

## 维护

更新知识库时:
1. 参考层 → 更新 `reference/` 对应模块
2. 深度层 → 更新 `deep-dive/` 详细文档
3. 更新本索引文件
4. 运行覆盖率验证脚本

## 相关资源

- [README.md](../../README.md) - 项目主 README
- [WORKFLOW_GUIDE.md](../../WORKFLOW_GUIDE.md) - 工作流指南
- [GETTING_STARTED.md](../../GETTING_STARTED.md) - 快速开始
- [FAQ.md](../../FAQ.md) - 常见问题
