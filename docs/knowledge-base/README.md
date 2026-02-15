# CCW Knowledge Base

Claude-Code-Workflow (CCW) 知识库 - 全面覆盖架构、命令、技能、MCP 和服务器组件。

## 目录结构

```
docs/knowledge-base/
├── README.md              # 本文件 - 索引和导航
├── schema.json            # 元数据 JSON Schema
├── architecture/          # 架构文档
│   └── overview.md
├── commands/              # 命令参考
│   └── cli-reference.md
├── skills/                # 技能参考
│   └── overview.md
├── mcp/                   # MCP 集成
│   └── integration.md
└── servers/               # 服务器架构
    └── architecture.md
```

## 模块概览

### 1. 架构 (Architecture)

**文件**: [architecture/overview.md](architecture/overview.md)

核心内容:
- 系统架构概览
- 组件层次结构
- 数据流设计
- 工作流级别定义

**关键概念**:
- CLI Layer - 命令行入口
- Commands Layer - 命令处理器
- Core Services - 核心服务
- Tools Layer - 工具层

### 2. 命令 (Commands)

**文件**: [commands/cli-reference.md](commands/cli-reference.md)

核心内容:
- CLI 命令参考
- Slash 命令列表
- 选项和参数
- 执行模式

**关键命令**:
- `ccw install` - 安装工作流
- `ccw view` - 打开仪表板
- `ccw cli` - 执行 CLI 工具
- `/ccw` - 自动工作流编排
- `/workflow:plan` - 标准规划

### 3. 技能 (Skills)

**文件**: [skills/overview.md](skills/overview.md)

核心内容:
- 可用技能列表
- 技能结构定义
- 阶段和动作
- 状态管理

**关键技能**:
- `brainstorm` - 多角色头脑风暴
- `review-code` - 代码审查
- `project-analyze` - 项目分析
- `team-lifecycle` - 团队协作

### 4. MCP 集成

**文件**: [mcp/integration.md](mcp/integration.md)

核心内容:
- MCP 配置
- 内置工具
- ACE 搜索
- 第三方集成

**关键工具**:
- `read_file` / `write_file` / `edit_file` - 文件操作
- `search_context` - 语义搜索
- `team_msg` - 团队消息
- `webReader` - 网页读取

### 5. 服务器架构

**文件**: [servers/architecture.md](servers/architecture.md)

核心内容:
- HTTP/WebSocket 服务器
- API 端点
- 仪表板功能
- 安全配置

**关键组件**:
- Main Server - 主服务器
- WebSocket - 实时通信
- Data Aggregator - 数据聚合
- Cache Manager - 缓存管理

## 快速导航

| 我想要... | 查看 |
|-----------|------|
| 了解系统整体架构 | [architecture/overview.md](architecture/overview.md) |
| 查找命令用法 | [commands/cli-reference.md](commands/cli-reference.md) |
| 学习技能系统 | [skills/overview.md](skills/overview.md) |
| 配置 MCP 工具 | [mcp/integration.md](mcp/integration.md) |
| 理解服务器实现 | [servers/architecture.md](servers/architecture.md) |

## 覆盖范围

### 已覆盖模块

| 模块 | 状态 | 文档位置 |
|------|------|----------|
| 架构概览 | ✅ | architecture/overview.md |
| CLI 命令 | ✅ | commands/cli-reference.md |
| 技能系统 | ✅ | skills/overview.md |
| MCP 集成 | ✅ | mcp/integration.md |
| 服务器架构 | ✅ | servers/architecture.md |

### 核心组件覆盖率

- **ccw/src/core/** - 已覆盖服务器、内存存储、会话管理
- **ccw/src/commands/** - 已覆盖主要命令
- **ccw/src/tools/** - 已覆盖核心工具
- **.claude/skills/** - 已覆盖主要技能
- **.claude/commands/** - 已覆盖工作流命令

## 元数据

所有知识库文档遵循 `schema.json` 定义的元数据结构。

## 维护

更新知识库时:
1. 更新对应模块文档
2. 更新本索引文件
3. 运行覆盖率验证脚本

## 相关资源

- [README.md](../../README.md) - 项目主 README
- [WORKFLOW_GUIDE.md](../../WORKFLOW_GUIDE.md) - 工作流指南
- [GETTING_STARTED.md](../../GETTING_STARTED.md) - 快速开始
- [FAQ.md](../../FAQ.md) - 常见问题
