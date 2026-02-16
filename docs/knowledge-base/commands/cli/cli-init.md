# /cli:cli-init

---
id: CMD-cli-init
version: 1.0.0
status: active
source_path: ../../../.claude/commands/cli/cli-init.md
---

> **Category**: CLI
> **Arguments**: `[--tool gemini|qwen|all] [--output path] [--preview]`

---

## 概述

初始化 CLI 工具配置，为工作空间生成 `.gemini/` 和 `.qwen/` 配置目录，包括 settings.json 和 ignore 文件。基于检测到的技术栈自动生成优化的过滤规则。

**支持的工具**: gemini, qwen, all (默认: all)

---

## 核心能力

### 配置生成

1. **工作空间分析**: 运行 `get_modules_by_depth.sh` 分析项目结构
2. **技术栈检测**: 根据文件扩展名、目录和配置文件识别技术栈
3. **配置创建**: 生成工具特定的配置目录和设置文件
4. **Ignore 规则生成**: 创建针对检测技术的过滤模式

### 生成的文件

#### 配置目录

**Gemini** (`.gemini/`):
```json
{
  "contextfilename": ["CLAUDE.md", "GEMINI.md"]
}
```

**Qwen** (`.qwen/`):
```json
{
  "contextfilename": ["CLAUDE.md", "QWEN.md"]
}
```

#### Ignore 文件

- `.geminiignore` - Gemini CLI 忽略规则
- `.qwenignore` - Qwen CLI 忽略规则

### 支持的技术栈

| 类别 | 技术 | 忽略内容 |
|------|------|----------|
| **Frontend** | React/Next.js | .next/, node_modules |
| **Frontend** | Vue/Nuxt | .nuxt/, dist/, .cache/ |
| **Backend** | Node.js | node_modules, package-lock.json |
| **Backend** | Python | __pycache__, .venv, *.pyc |
| **Backend** | Java | target/, .gradle/, *.class |
| **Infra** | Docker | .dockerignore |

---

## 工作流程

```mermaid
graph LR
    A[检测技术栈] --> B[生成配置目录]
    B --> C[创建 settings.json]
    C --> D[生成 ignore 规则]
    D --> E[验证配置]
```

### 执行步骤

1. **解析参数**: 提取 `--tool`, `--output`, `--preview` 参数
2. **工作空间分析**: 执行 `get_modules_by_depth.sh`
3. **技术检测**: 扫描 package.json, requirements.txt 等
4. **配置生成**: 创建目录和文件
5. **验证**: 检查生成的文件有效性

---

## 使用场景

### 基础项目设置

```bash
# 初始化所有 CLI 工具
/cli:cli-init

# 仅初始化 Gemini
/cli:cli-init --tool gemini

# 仅初始化 Qwen
/cli:cli-init --tool qwen
```

### 预览模式

```bash
# 预览将要生成的内容
/cli:cli-init --preview
```

### 自定义输出路径

```bash
# 指定输出目录
/cli:cli-init --output=.config/
```

---

## 最佳实践

### 1. 新项目初始化

```bash
# 克隆项目后立即运行
git clone <repo>
cd <repo>
/cli:cli-init
```

### 2. 技术栈变更后更新

```bash
# 添加新技术栈后重新生成
npm install docker  # 添加 Docker
/cli:cli-init       # 更新配置
```

### 3. 使用预览避免意外覆盖

```bash
# 先预览再执行
/cli:cli-init --preview
/cli:cli-init       # 确认后执行
```

---

## 参数说明

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `--tool` | string | 否 | all | 工具选择: gemini, qwen, all |
| `--output` | path | 否 | . | 输出目录 |
| `--preview` | flag | 否 | false | 预览模式，不创建文件 |

---

## 相关文档

- [CLI 命令索引](../_index.md)
- [CLI Reference](../cli-reference.md)

---

*本文档由 CCW 知识系统维护*
