# Workflow Learn Start Command (/learn:start) v5.1 (Clean Architecture)

## 1. 概览 (Overview)

本命令是单会话智能规划的终极形态。它在逻辑上实现了**“价值观共鸣”**与**“认知迁移”**的深度定制，在数据结构上实现了**“持久资产”**与**“临时上下文”**的清晰分离。

**核心设计原则：**
- **逻辑闭环**：不依赖外部系统，单机即可完成全流程闭环。
- **结构分离**：将用户的“长期特征”（如技术栈、学习风格）与“本次目标”解耦，生成的 `profile.json` 天然具备被未来系统读取和复用的能力。
- **极致定制**：基于用户既往技术栈生成**认知桥接 (Cognitive Bridges)**，基于价值观重构**技能拓扑权重**。

## 2. 用法 (Usage)

```bash
/learn:start [FLAGS] <LEARNING_GOAL>

# Flags
-q, --quick                跳过详细诊断 (默认基于参照系推断)
-l, --language <lang>      强制输出语言 (默认 zh-CN)
```

## 3. 数据结构定义 (JSON Schema)

这是本版本的核心成果。结构清晰，既满足当前极致定制，又天然适配未来的跨会话场景。

### Profile.json (v5.1 最终版)

```json
{
  "meta": {
    "session_id": "learn-rust-cli-001",
    "version": "v5.1",
    "created_at": "2024-05-20T10:00:00Z"
  },
  
  // 1. 持久化特征 (长期资产 - Cross-Session Assets)
  // [设计意图] 这些数据代表"我是谁"，不仅用于本次，未来其他会话也可复用
  "persistent_traits": {
    // 认知锚点：既往技术栈
    "reference_stack": { 
      "Java": "Expert", 
      "Linux": "Intermediate" 
    },
    // 身份原型：决定策略风格
    "identity": {
      "archetype": "The Pragmatist", // 实用主义者
      "value_system": ["Speed of Delivery", "Functionality First"], 
      "cognitive_bandwidth": "Medium" 
    },
    // 历史防御机制
    "failure_patterns": ["Boredom", "Tutorial Hell"]
  },

  // 2. 会话上下文 (临时状态 - Session Context)
  // [设计意图] 这些数据代表"我要做什么"，仅对本次有效
  "session_context": {
    "goal": {
      "raw": "写一个高性能文件加密工具",
      "domain": "Systems Programming"
    },
    "constraints": {
      "time_fragmentation": "High" // 本次时间碎片度高
    },
    "psychological": {
      "current_motivation": 0.9 // 本次动机
    }
  },

  // 3. 知识快照 (图谱状态 - Knowledge Snapshot)
  // [设计意图] 记录当前时刻的技能掌握情况，可作为未来全局图谱的输入
  "knowledge_snapshot": {
    "skill_topology": {
      "Ownership": {
        "status": "Diagnosed_Low",
        // 动态相关性：基于 value_system 计算
        "dynamic_relevance": "Secondary", 
        "rationale": "Pragmatist approach: Clone first, optimize later."
      },
      "Clap Crate": {
        "status": "Inferred_Ready",
        "dynamic_relevance": "Critical",
        "rationale": "Directly mapped from Java 'commons-cli' experience."
      }
    }
  },

  // 4. 反馈日志
  "feedback_journal": []
}
```

## 4. 执行流程 (Execution Process)

保持流程独立性，通过 Agent 交互填充上述结构。

```
阶段 1: 全息认知盘点 (Cognitive Audit)
   ├─ 初始化结构 (persistent_traits / session_context)
   ├─ Agent 交互提问 (填充数据):
   │  ├─ Q1: 确认 Session Goal & Constraints (填充 session_context)
   │  ├─ Q2: 挖掘 Reference Stack & Archetype (填充 persistent_traits)
   │  └─ Q3: 确认 Failure Patterns (填充 persistent_traits)
   └─ 输出: 包含完整特征的 Profile

阶段 2: 价值观驱动的拓扑重构 (Value-Driven Topology)
   ├─ 构建基础 Skill Topology (基于 Goal)
   ├─ 应用 Value System (来自 persistent_traits) 调整权重:
   │  ├─ "Pragmatist" -> 提升 "Ecosystem", 降低 "Internals"
   │  └─ "Purist" -> 提升 "Internals" 为 Blocker
   ├─ 剪枝与推断 (基于 Reference Stack):
   │  └─ 标记 "可迁移节点" (Transferred)
   └─ 输出: 动态重构后的 knowledge_snapshot

阶段 3: 认知步长规划 (Cognitive Pacing)
   ├─ 计算 Cognitive Bandwidth (基于 constraints)
   ├─ 生成 Task List:
   │  ├─ Low Bandwidth -> 生成微步骤 (Micro-steps)
   │  └─ High Bandwidth -> 生成大跨度挑战 (Deep Work)
   ├─ 注入 Cognitive Bridges (认知桥梁):
   │  └─ 生成指令: "Explain Rust Trait using Java Interface analogy"
   └─ ⚠️ Gemini 审查逻辑流

阶段 4: 风格化资源注入 (Archetype Injection)
   ├─ 依据 Archetype 筛选资源风格
   └─ 输出: Final Plan & Updated Profile
```

## 5. 产出物示例 (Plan.json)

```json
{
  "strategy": "Cognitive Transfer (Java -> Rust)",
  "pacing": "Micro-Steps (High Fragmentation)",
  "tasks": [
    {
      "id": "t-1",
      "title": "Define Arguments (Clap)",
      "type": "Code_First",
      "estimated_minutes": 15,
      
      // [核心特性] 认知桥梁：基于 reference_stack 生成
      "cognitive_bridge": "Think of Clap as a declarative version of Java's 'commons-cli'. You define a Struct, it parses ARGV.",
      
      // [核心特性] 动态权重理由：基于 value_system
      "rationale": "Selected as Critical because you value 'Speed of Delivery'.",
      
      // [核心特性] 动态纠偏插槽
      "checkpoint": {
        "verify_question": "Does the program print help text with --help?",
        "action_on_fail": "Check derive macros."
      }
    }
  ]
}
```