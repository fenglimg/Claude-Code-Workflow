# 文档质量标准 (Document Quality Standard)

> 版本: 1.0.0 | 更新日期: 2026-02-16 | 状态: Active

## 概述

本文档定义 CCW 知识库文档的质量标准，基于 **DQS (Document Quality Score)** 五维度评分体系，确保文档的完整性、可读性和可操作性。

---

## DQS 评分体系

### 评分维度

| 维度 | 权重 | 考察点 | 评分规则 |
|------|------|--------|----------|
| **Q1 结构** | 20 分 | 标题层级、段落组织、清单使用 | 有 Overview + Capabilities + Flow = 20 分 |
| **Q2 逻辑深度** | 30 分 | Mermaid 图、代码示例、阶段拆解 | 每个信号 +5 分，最高 30 分 |
| **Q3 场景** | 20 分 | 示例、用例、边界条件 | 每个场景信号 +5 分，最高 20 分 |
| **Q4 上下文** | 20 分 | 引用、源文件哈希验证 | source-hash verified = 20 分 |
| **Q5 时效** | 10 分 | 文档与源文件同步状态 | ≤3 天 = 10 分，≤7 天 = 5 分 |

### 评分等级

| 等级 | 分数范围 | 状态 | 说明 |
|------|----------|------|------|
| **A** | 80-100 | ✅ Excellent | 文档质量优秀，可直接使用 |
| **B** | 70-79 | ✅ Good | 文档质量良好，轻微改进 |
| **C** | 60-69 | ⚠️ Acceptable | 文档质量一般，需要改进 |
| **D** | 50-59 | ⚠️ Poor | 文档质量较差，需要大幅改进 |
| **F** | 0-49 | ❌ Fail | 文档不合格，需要重写 |

---

## 文档结构规范

### 必需章节

每个知识库文档必须包含以下章节：

#### 1. 概述 (Overview)

```markdown
## 概述

简短描述（1-2 句话）说明该组件/功能是什么，解决什么问题。
```

#### 2. 核心能力 (Core Capabilities)

```markdown
## 核心能力

- **能力 1**: 描述
- **能力 2**: 描述
- **能力 3**: 描述
```

#### 3. 工作流程 (Workflow)

```markdown
## 工作流程

\`\`\`mermaid
graph LR
    A[输入] --> B[处理] --> C[输出]
\`\`\`

### 阶段 1: XXX

描述...

### 阶段 2: YYY

描述...
```

#### 4. 使用示例 (Examples)

```markdown
## 使用示例

### 基础用法

\`\`\`bash
command --option value
\`\`\`

### 高级用法

\`\`\`bash
command --advanced-option
\`\`\`
```

#### 5. 参数说明 (Parameters)

```markdown
## 参数说明

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `--option` | string | 否 | `default` | 选项说明 |
```

---

## 质量检查项

### 结构检查 (Q1)

- [ ] 有概述章节
- [ ] 有核心能力列表
- [ ] 有工作流程说明
- [ ] 标题层级正确（最多 4 级）
- [ ] 段落长度适中（≤10 行）

### 内容检查 (Q2)

- [ ] 有 Mermaid 流程图（如适用）
- [ ] 有代码示例
- [ ] 有阶段拆解（复杂流程）
- [ ] 逻辑清晰，步骤连贯

### 场景检查 (Q3)

- [ ] 有基础用法示例
- [ ] 有高级用法示例（可选）
- [ ] 有边界条件说明
- [ ] 有错误处理示例

### 上下文检查 (Q4)

- [ ] 有相关文档链接
- [ ] 有 source-path/source-hash（自动生成文档）
- [ ] 引用正确有效

### 时效检查 (Q5)

- [ ] source-hash 验证通过
- [ ] 文档与源文件同步

---

## 自动化质量门禁

### CI 集成

```yaml
# .github/workflows/docs-quality.yml
name: Docs Quality Check

on:
  push:
    paths: ['docs/knowledge-base/**/*.md']
  pull_request:
    paths: ['docs/knowledge-base/**/*.md']

jobs:
  quality-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run DQS Audit
        run: npx ts-node scripts/quality-audit.ts --fail-below 70
```

### 质量阈值

| 场景 | 最低分数 | 说明 |
|------|----------|------|
| 新文档合并 | 70 分 (B) | 新文档必须达到 B 级 |
| 增量更新 | 60 分 (C) | 增量更新允许 C 级 |
| 全量审计 | 80 分 (A) | 全量审计目标 A 级 |

---

## 元数据规范

### YAML Frontmatter

```yaml
---
id: SKILL-xxx
version: 1.0.0
status: active | draft | deprecated
created_at: 2026-02-16
updated_at: 2026-02-16
source_path: ../../.claude/skills/xxx.md
source_hash: abc123def456
---
```

### 必需字段

| 字段 | 说明 |
|------|------|
| `id` | 唯一标识符 |
| `version` | 语义化版本 |
| `status` | 文档状态 |
| `updated_at` | 最后更新日期 |

### 可选字段

| 字段 | 说明 |
|------|------|
| `source_path` | 源文件路径（自动生成文档） |
| `source_hash` | 源文件哈希（用于同步验证） |
| `traces_to` | 追溯的需求 ID |

---

## 质量审计工具

### 使用方法

```bash
# 审计所有文档
npx ts-node scripts/quality-audit.ts

# 审计特定目录
npx ts-node scripts/quality-audit.ts "docs/knowledge-base/skills/*.md"

# 指定输出格式
npx ts-node scripts/quality-audit.ts --output markdown

# CI 模式（低于阈值失败）
npx ts-node scripts/quality-audit.ts --fail-below 70

# JSON 输出（用于 CI 解析）
npx ts-node scripts/quality-audit.ts --output json
```

### 输出示例

```
CCW 文档质量审计报告
=====================
审计时间: 2026-02-16T12:00:00Z
文档数量: 48
整体评分: 85.2 (A)

维度分析:
| 维度 | 平均分 | 权重 |
|------|--------|------|
| Q1 结构 | 18.5/20 | 20% |
| Q2 逻辑 | 25.3/30 | 30% |
| Q3 场景 | 16.8/20 | 20% |
| Q4 上下文 | 17.2/20 | 20% |
| Q5 时效 | 7.4/10  | 10% |

问题汇总:
- 3 个文档缺少 Mermaid 图
- 2 个文档 source-hash 过期
- 1 个文档结构不完整

建议: 补充流程图，更新过期文档
```

---

## 附录

### A. 术语表

| 术语 | 定义 |
|------|------|
| DQS | Document Quality Score，文档质量评分 |
| source-hash | 源文件 SHA256 哈希前 12 位 |
| 浅层文档 | 有效行数 < 50 行的文档 |

### B. 参考资源

- [质量审计脚本源码](../../scripts/quality-audit.ts)
- [知识库架构](../architecture.md)
- [文档生成规范](./document-generation-standard.md)

---

*本文档由 CCW 文档质量系统自动生成和维护*
