# Part X.5: CCW 隐藏特性深度分析

> **定位**: 深入分析文档中未明确提及但对系统行为有重要影响的核心机制
> **目标读者**: 高级开发者、系统架构师、CCW 贡献者

## 概述

本部分深入分析 CCW 系统中四个关键的隐藏特性。这些特性在常规文档中提及较少，但对系统的通信、任务管理、记忆聚合和会话组织有着深远影响。

## 章节导航

| 章节 | 标题 | 核心文件 | 用途 |
|------|------|----------|------|
| [19.5](./ch19-5-a2ui-protocol.md) | A2UI 协议 | `ccw/src/core/a2ui/` | Dashboard 与 CLI 的双向通信 |
| [19.6](./ch19-6-loop-v2-routes.md) | Loop V2 路由 | `ccw/src/core/routes/loop-v2-routes.ts` | 循环执行的 RESTful API |
| [19.7](./ch19-7-memory-consolidation.md) | Memory Consolidation Pipeline | `ccw/src/core/memory-consolidation-pipeline.ts` | 全局记忆聚合 |
| [19.8](./ch19-8-session-clustering.md) | Session Clustering Service | `ccw/src/core/session-clustering-service.ts` | 会话智能聚类 |

## 特性总览

### Chapter 19.5: A2UI 协议

**设计目标**: 为 Dashboard 前端提供动态 UI 渲染能力

**核心机制**:
- 3 种消息类型: `a2ui-surface`, `a2ui-action`, `a2ui-answer`
- 4 种问题类型: `confirm`, `select`, `input`, `multi-select`
- WebSocket 优先，HTTP 回退

**典型场景**: MCP 工具 `ask_question` 通过 A2UI 向用户展示交互界面

### Chapter 19.6: Loop V2 路由

**设计目标**: 提供独立于任务文件的 Loop CRUD 操作接口

**核心机制**:
- 17 个 RESTful 端点
- 5 状态状态机: `created → running ↔ paused → completed/failed`
- WebSocket 状态广播

**典型场景**: Dashboard 管理 Loop 生命周期和任务队列

### Chapter 19.7: Memory Consolidation Pipeline

**设计目标**: 将 per-session 记忆聚合为全局 MEMORY.md

**核心机制**:
- 7 步流程: Lock → Materialize → Agent → Monitor → Done
- 租约锁 + 心跳续期
- Phase 1/Phase 2 协作

**典型场景**: 定期聚合所有会话记忆，生成项目级知识库

### Chapter 19.8: Session Clustering Service

**设计目标**: 智能组织会话，支持渐进式上下文检索

**核心机制**:
- 5 维相似度: fileOverlap(0.2) + temporalProximity(0.15) + keywordSimilarity(0.15) + vectorSimilarity(0.3) + intentAlignment(0.2)
- 凝聚聚类 + 平均链接
- 渐进式披露索引

**典型场景**: 新会话开始时返回相关历史会话上下文

## 架构关系图

```
┌───────────────────────────────────────────────────────────────┐
│                      Dashboard Frontend                        │
└──────────────────────────┬────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ A2UI        │    │ Loop V2     │    │ Memory      │
│ Protocol    │    │ Routes      │    │ Routes      │
│ (WebSocket) │    │ (REST)      │    │ (REST)      │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       └─────────────────┬┴──────────────────┘
                         │
                         ▼
┌───────────────────────────────────────────────────────────────┐
│                      Core Services                             │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │           Memory Consolidation Pipeline                  │  │
│  │  (Phase 2 Global Aggregation)                            │  │
│  └───────────────────────────┬─────────────────────────────┘  │
│                              │                                 │
│  ┌───────────────────────────▼─────────────────────────────┐  │
│  │           Session Clustering Service                     │  │
│  │  (Multi-dimensional Similarity + Clustering)             │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

## 隐藏特性发现指南

### 1. 代码探索策略

```bash
# 查找未在文档中提及的核心模块
find ccw/src/core -name "*.ts" -type f | xargs grep -l "class.*Service\|class.*Pipeline\|class.*Handler"

# 查找路由定义
find ccw/src/core/routes -name "*.ts" -type f

# 查找类型定义
find ccw/src/core -name "*Types.ts" -o -name "*types.ts"
```

### 2. 关键目录

| 目录 | 内容 |
|------|------|
| `ccw/src/core/a2ui/` | A2UI 协议实现 |
| `ccw/src/core/routes/` | HTTP/WebSocket 路由 |
| `ccw/src/core/memory-*` | 记忆系统组件 |
| `ccw/frontend/src/packages/a2ui-runtime/` | 前端 A2UI 组件 |

### 3. 配置文件

| 文件 | 用途 |
|------|------|
| `ccw/src/core/memory-v2-config.ts` | 记忆系统配置 |
| `~/.claude/cli-tools.json` | CLI 工具配置 |

### 4. 测试文件

测试文件是理解隐藏特性的重要来源：

```bash
# A2UI 测试
ccw/tests/e2e/ask-question-answer-broker.e2e.test.ts
ccw/frontend/tests/e2e/a2ui-notifications.spec.ts

# 聚类测试
ccw/tests/integration/session-clustering.test.ts
```

## 扩展阅读

- [Part 5: 执行层](../part5-execution-layer/) - CLI 执行器架构
- [Part 6: 集成层](../part6-integration-layer/) - Dashboard 集成
- [Part 10: 扩展系统](../part10-extensions/) - 技能和命令扩展

---

*CCW 深度研究系列 | Part X.5*
