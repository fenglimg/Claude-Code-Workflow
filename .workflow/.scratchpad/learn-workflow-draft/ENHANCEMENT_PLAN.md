# Learn Workflow Enhancement Plan

> 基于2轮多CLI协作分析（Gemini + Codex）的增强方案
> 分析ID: learn-deep-001, learn-deep-002

## 📊 分析结果总结

### ✅ 当前设计优势
- Isolated Strategy 合理（Fork友好，零核心修改）
- CLI集成模式正确（松耦合）
- 基础架构清晰（文件系统数据库、命令集、agent模式）

### ⚠️ 6个关键问题与解决方案

#### 1. 用户画像全面性 ❌ 需要增强

**问题**：
- 只有 experience_level + known_topics + learning_preferences
- 缺少 role/persona/价值观/目标类型/学习节奏
- 无跨会话演进机制、无继承/特化模型

**解决方案**：画像三层架构
```
1. Global Persona（跨会话长期）- 人格/价值观/元能力
2. Profiles（可继承/特化）- 面向领域的学习配置
3. Session Context（一次性）- 本次目标/时间/动机
```

**新增字段**：
- `persona_id` / `inherits_from`
- `goals{primary, goal_type, success_definition}`
- `overrides{constraints, pedagogy}`
- `_metadata.evolution_log[]`

#### 2. 跨会话知识图谱 ❌ 完全缺失

**问题**：
- 只有session内DAG，无全局图谱
- topic_id无稳定性/同义词管理
- 无taxonomy层级

**解决方案**：新增 `.workflow/learn/knowledge/`
```
1. topics.json - topic registry（canonical + aliases）
2. graph.json - edges（prerequisite/related/same_as）
3. observations.jsonl - 学习证据（追加式）
```

**plan.json增强**：
- KP增加 `topic_refs[]` 字段（指向全局topic_id）

#### 3. 工作流交互一致性 ⚠️ 需强化

**问题**：
- 缺少 TodoWrite 自动续跑强约束
- 缺少 clarification 阻塞机制
- 编排器/代理边界不够清晰

**解决方案**：对齐 workflow:plan 的5-phase模式
```
Phase 1: state/profile discovery
Phase 2: gap analysis + topic normalization
Phase 3: plan generation (agent)
Phase 4: validation gate (schema + DAG + quality)
Phase 5: write artifacts + summary
```

**引入 clarification 阻塞**：
- 目标不清 → AskUserQuestion
- 画像缺失 → 创建default或clarify
- 知识链冲突 → 禁止best-guess

#### 4. MCP工具集成 ❌ 完全缺失

**问题**：
- 设计文档未提及 ace-tool/exa/smart_search
- 资源推荐依赖agent预训练知识

**解决方案**：按学习目标类型分流
```
A) 项目/代码相关：
   ACE → smart_search → Exa code context

B) 通用知识学习：
   Exa → 本地缓存/历史会话

Tool Composition（在 learn-planning-agent 内）：
1. ACE: mcp__ace-tool__search_context(query="...")
2. Exa: mcp__exa__get_code_context_exa(query="...", tokensNum=5000)
3. Normalize: 统一topic_id + 去重URLs
4. Score: gold/silver/bronze + 强制每KP gold>=1
5. Emit: plan.json (schema-first)
```

**Fallback链**：Gemini → Qwen → Codex → degraded

#### 5. 计划质量保证 ⚠️ 缺验证机制

**问题**：
- 有硬约束但无验证代码
- profile→plan匹配无验证
- 资源质量评分无rubric

**解决方案**：QA分层
```
Layer 0: Schema Validation（阻断型）
- 补齐 learn-plan-schema.json

Layer 1: Graph Validity（阻断型）
- 检查 prerequisites 无环、引用存在

Layer 2: Profile→Plan Matching（阻断/告警）
- 高熟练topic → 降级为可选
- 缺少prerequisites → 必须补基础KP
- 加 plan._metadata.profile_fingerprint

Layer 3: Resource Quality Scoring（阻断/降级）
- Gold: 官方文档/标准/权威
- Silver: 优质博客/可靠来源
- Bronze: StackOverflow/零散帖子
- 字段：quality_score(0-1) + reasons[] + retrieved_at

Layer 4: 反馈闭环（非阻断）
- session完成情况写回 persona/profile/knowledge graph
```

#### 6. 统一实现框架 ⚠️ 缺schema落地

**问题**：
- Agent模式清晰但schema文件缺失
- 无统一状态管理约定
- 无测试策略

**解决方案**：
```
A) 必须补齐的schemas：
- learn-plan-schema.json（含maxItems:15, gold约束）
- learn-profile.schema.json（含persona_id, inherits_from）
- learn-state.schema.json
- learn-persona.schema.json
- learn-topics.schema.json
- learn-graph.schema.json

B) State Management Conventions：
- 原子写：temp → rename
- version字段：所有JSON带version
- 追加式日志：observations用JSONL

C) Testing Strategy：
1. Schema validation测试
2. DAG validator测试
3. Profile merge测试
```

## 🎯 优先级落地路线

### P0（阻断性）- 立即实施
1. ✅ 补齐 learn schemas（6个JSON schema）
2. ✅ 对齐 workflow/issue 交互一致性（TodoWrite + clarification）

### P1（质量保证）- 第二阶段
3. ✅ 画像三层拆分 + 继承合并规则
4. ✅ QA分层验证（schema → DAG → matching → scoring）

### P2（增强功能）- 第三阶段
5. ✅ 最小跨会话KG落地（topics + graph + observations）
6. ✅ MCP工具集成（ace/exa/smart_search）

## 📝 文档更新清单

### 需要更新的文件
1. `README.md` - 增加：
   - 画像三层架构说明
   - 跨会话知识图谱设计
   - MCP工具集成策略
   - QA分层机制

2. `learn-plan.md` - 增加：
   - Phase 4: Validation Gate
   - MCP工具调用示例
   - Schema validation步骤
   - Clarification阻塞机制

3. `learn-execute.md` - 增加：
   - topic_refs字段使用
   - 跨会话知识点关联

4. `learn-ask.md` - 增加：
   - 历史会话上下文加载

5. `learn-review.md` - 增加：
   - 知识图谱更新逻辑
   - Persona演进日志

### 需要新增的文件
1. `schemas/` 目录（6个schema文件）
2. `AGENTS.md` - Agent规格文档
3. `MCP_INTEGRATION.md` - MCP工具使用指南

## 🔗 参考资料

**CLI分析记录**：
- learn-deep-001: 架构审查（Gemini，44.4s）
- learn-deep-002: 6维度深度分析（Codex，1196.0s）

**关键发现**：
- Codex明确指出：learn-plan-schema.json缺失导致schema-first机制断裂
- 必须引入clarification阻塞（参考issue-queue-agent）
- MCP工具集成是资源质量保证的关键

---

**版本**: v2.0.0-enhanced
**最后更新**: 2025-01-24
**状态**: Enhancement Plan - Ready for Implementation
