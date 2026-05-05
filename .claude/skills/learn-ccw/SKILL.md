---
name: learn-ccw
description: Learn the CCW project through guided Q&A. User asks questions, AI answers with code anchor references, and proactively suggests what to explore next based on knowledge graph coverage. Triggers on "learn ccw", "了解项目", "guide me", "onboard", "项目学习".
allowed-tools: Read, Glob, Grep, Bash, AskUserQuestion, Agent, Write
---

<purpose>
Guide a user through learning the CCW (Claude Code Workflow) project. Unlike grill-me which interrogates the user, learn-ccw is user-driven: the user asks questions and I answer with concrete file references, code anchors, and architectural context. When the user doesn't know what to ask, I proactively suggest 2-3 relevant next directions based on the conversation's current coverage.

The goal is not to cover everything, but to build an accurate mental model of CCW's architecture — starting from the "orchestrator" metaphor and branching into layers, modules, and mechanisms as the user directs.
</purpose>

<required_reading>
- @docs/architecture/01-overview.md (系统全景)
- @docs/architecture/08-design-decisions.md (设计决策与风险)
</required_reading>

<knowledge-base>
Knowledge is stored in a structured knowledge graph file:

**File**: `@.claude/skills/learn-ccw/specs/knowledge-graph.json`

The graph contains nodes (concepts, modules, mechanisms), edges (relationships), mastery tracking, version anchoring, and user annotations.

### Auto-Load on First Call

When this skill is invoked for the first time:

1. If `knowledge-graph.json` does not exist:
   - Run `npx tsx .claude/skills/learn-ccw/scripts/generate-knowledge-graph.ts` to scan architecture docs and source files
   - The script extracts:
     - `docs/architecture/*.md` headings as concept nodes
     - `02-module-map.md` tables as module dependency edges
     - Related source files via keyword grep from `ccw/src/`
     - SKILL.md purpose blocks as fallback if no arch docs exist
2. If `knowledge-graph.json` exists:
   - Run stale detection via `npx tsx .claude/skills/learn-ccw/scripts/version-anchor.ts check`
   - Check git diff between `last_read_commit` and HEAD for each node's tracked files
   - Report stale nodes to the user if any files have changed since last verification

### Node Structure

Each node has:

| Field | Description |
|-------|-------------|
| `id` | Unique identifier (e.g., `doc-01-overview`) |
| `label` | Human-readable name (e.g., "CCW 架构全景") |
| `type` | `concept` / `module` / `mechanism` |
| `description` | What this node represents |
| `files[]` | Relevant file paths |
| `depends_on[]` | Prerequisite node IDs |
| `level` | Knowledge tier (L0-L6) |
| `mastery` | User mastery tracking (L0-L5) |
| `annotations[]` | User-added notes |
| `_version` | Git commit anchor + staleness info |

### Edge Relations

| Relation | Meaning |
|----------|---------|
| `depends_on` | Source depends on target |
| `part_of` | Source is part of target document |
| `references` | Source references target |
| `implements` | Source implements target |
| `extends` | Source extends target |
| `related_to` | Correlated but no directional dependency |
</knowledge-base>

<mastery-system>
Mastery is tracked per node in the knowledge graph. Five levels:

| Level | Description | Evidence Pattern |
|-------|-------------|------------------|
| L1 | Recognized | User repeats concept name + one-sentence description |
| L2 | Referenced | User provides file:line reference |
| L3 | Traced flow | User traces end-to-end call flow |
| L4 | Implemented | User completed code changes + tests pass |
| L5 | Alternatives | User proposes alternatives with tradeoffs |

### Evidence Recording

Each time the user demonstrates understanding, an evidence entry is appended to the node in knowledge-graph.json:

```json
{ "level": "L2", "action": "Provided file:line reference for three-way routing", "session_id": "learn-ccw-2026-05-05", "timestamp": "2026-05-05T16:30:00+08:00" }
```

Mastery level auto-upgrades to the highest level demonstrated. `mastery.next` is auto-generated to hint the next step.

### On Session End

When the user says "学完了", "保存", or "结束":
1. Run `npx tsx .claude/skills/learn-ccw/scripts/mastery-evaluator.ts finalize <session-id>` to consolidate accumulated evidence
2. Update `knowledge-graph.json` with all session evidence
3. Display a summary of covered nodes and mastery levels achieved

### Knowledge Precipitation (Optional)

When the user says "保存这个知识点" or "记录这个":
1. Store the insight as an annotation on the current node in the graph
2. Annotations persist across sessions and are shown in the D3 visualization
</mastery-system>

<staleness-detection>
On every invocation, the skill checks whether tracked source files have changed since the last verification:

1. Run `git rev-parse HEAD` to get current commit
2. For each node with `_version.last_read_commit` set:
   - Run `git diff --quiet last_read_commit..HEAD -- <node.files>`
   - If any tracked file differs, mark the node as stale
3. Nodes without version info are skipped
4. Stale nodes get `_version.stale = true` and `_version.stale_files[]` lists the changed paths

### Stale Status in Responses

When presenting information about a stale node:
- Note: "This node's source files have changed since last review. Run `npx tsx .claude/skills/learn-ccw/scripts/version-anchor.ts anchor <node-id>` to re-anchor."
- Regenerate the knowledge graph to capture new content: `npx tsx .claude/skills/learn-ccw/scripts/generate-knowledge-graph.ts`
</staleness-detection>

<context-tracking>
Conversation context is tracked per-node through mastery levels, not as a percentage. When the user is silent or asks "what else should I learn":

```
Covered nodes with mastery:
  L1: doc-01-overview (Recognized)
  L2: doc-03-core-engine-三路路由详解 (Referenced)
  L0: doc-04-orchestration (Not covered)

Uncovered topics in the same tier:
  - L1: IR Pipeline (doc-03-core-engine-ir-output-pipeline)
  - L2: Chain Loader (doc-04-orchestration-1-chain-loader-渐进式-skill-链)

Suggestions based on mastery gaps:
  1. Deepen L1: "IR Pipeline" - you know the concept, try tracing file:line
  2. Expand L2: "Chain Loader" - new topic not yet covered
  3. Challenge L3: try to trace the end-to-end flow of ccw cli
```

The knowledge graph provides the complete map. Uncovered nodes are those with `mastery.level = "L0"`.
</context-tracking>

<response-pattern>
回答的结构化格式：

1. **直接回答问题** — 简洁准确的答案
2. **代码锚点** — 至少一个 file:line 引用作为证据
3. **更新学习记录** — 更新 knowledge-graph.json 的 mastery 记录，标记当前话题和演示的层级
4. **扩展方向** — 基于 mastery gap 推荐 2-3 个未覆盖或少覆盖的话题（仅当用户不知道问什么时，或触及新话题时自动附带）
5. **适时刹车** — 确认用户是否想继续深入当前话题

示例：

```
三路路由是 builtin / cli-wrapper / api-endpoint 三种分发方式。
核心实现在 cli-executor-core.ts -> executeCliTool()。

- builtin: spawn 子进程，给 gemini/qwen/codex 早期版本用
- cli-wrapper: claude --settings 封装，给新版 claude/codex 用
- api-endpoint: LiteLLM HTTP 代理，给 g25 等远端 API 用

类型由 cli-tools.json 的 type 字段决定，新增后端只需加配置。

[mastery: L1 -> L2] doc-03-core-engine-三路路由详解 (file:line reference recorded)

要看看每种路由的具体实现代码吗？还是想了解路由确定后的 IR Pipeline？
```

当用户说「不知道问什么」时：展示当前覆盖情况 + L0 节点列表 + 2-3 个推荐方向。

### Mastery Assessment Rules

在用户回答中自动评估 mastery 层级：

- **L1 (Recognized)**: 用户提到了概念名称和一句话描述
- **L2 (Referenced)**: 用户提到了 file:line 或具体代码位置
- **L3 (Traced flow)**: 用户描述了一条完整的调用链
- **L4 (Implemented)**: 用户完成了代码修改并测试通过
- **L5 (Alternatives)**: 用户提出了替代方案并分析了 tradeoffs

每个回答后，通过 mastery-evaluator.ts 更新对应节点的 mastery 和 evidence。
</response-pattern>

<visualization>
知识图谱的 D3.js 可视化，自包含 HTML，无需服务端：

**File**: `@.claude/skills/learn-ccw/templates/learn-project.html`

功能：力导向图（节点颜色按 mastery level）、悬停/点击详情面板、文件列表/mastery 历史/annotations/版本锚定、注解面板（localStorage 持久化）、mastery 分布柱状图、缩放拖拽、stale 节点橙色边框。

使用方法：
1. `npx tsx .claude/skills/learn-ccw/scripts/generate-knowledge-graph.ts`
2. `node .claude/skills/learn-ccw/scripts/inject-knowledge-graph.cjs`
3. 在浏览器中打开 `templates/learn-project.html`
</visualization>

<recovery>
When session context is near exhaustion:
- Auto-save current mastery evidence to knowledge-graph.json
- Preserve last N Q&A pairs for continuity
- On next invocation, reload graph and show mastery state
</recovery>
