# Workflow Learn Start Command (/learn:start) v5.0

## 1. 概览 (Overview)

本命令是智能学习工作流的**认知对齐引擎 (Cognitive Alignment Engine)**。

它超越了传统的“缺口补齐”模式，实现了真正的**单会话极致定制**。它通过解析用户的**价值观体系**（如“原理派” vs “实用派”）来动态重构技能树的权重；利用用户的**既往技术栈**（Reference Stack）构建**认知桥接**；并根据用户的**认知带宽**（Cognitive Bandwidth）自动调整任务的**步长颗粒度**（ZPD Pacing）。

**核心进化 (v5.0):**
- **价值观动态拓扑 (Value-Driven Topology):** 技能树的节点权重不再固定，而是根据用户的价值观（Value System）动态升降级。对于“实用派”，底层原理会被降级；对于“原理派”，则被升级为阻塞性节点。
- **认知桥接 (Cognitive Bridging):** 利用用户已掌握的知识（如 Java）作为锚点，在生成计划时自动注入**“类比教学”**（如 "Trait 就像 Java Interface"），大幅降低理解成本。
- **ZPD 步长自适应 (Step-Size Adaptation):** 拒绝平均主义，根据用户的心理韧性和认知带宽，计算**“近侧发展区” (ZPD)**，动态决定是一个任务涵盖 3 个概念，还是 3 个任务拆解 1 个概念。
- **防御性事前验尸 (Pre-Mortem):** 在规划阶段植入针对用户“历史失败模式”的防御机制。

## 2. 用法 (Usage)

```bash
/learn:start [FLAGS] <LEARNING_GOAL>
```

## 3. 执行流程 (Execution Process)

```
阶段 1: 认知资产与价值观盘点 (Cognitive Audit)
   ├─ Agent 深度访谈 -> 萃取 Profile:
   │  ├─ 目标上下文 (Goal Context)
   │  ├─ 既往技术栈 (Reference Stack) -> 用于认知桥接
   │  ├─ 价值观体系 (Value System) -> 用于拓扑重权
   │  └─ 历史失败模式 (Failure Mode) -> 用于防御设计
   └─ 输出: Profile (含初步认知画像)

阶段 2: 拓扑重构与智能诊断 (Refactoring & Diagnosis)
   ├─ 构建初始 Skill Topology (基于目标逆向)
   ├─ ⚡️ 动态重权 (Dynamic Re-weighting):
   │  └─ 依据 Value System 将节点标记为 Critical / Secondary / Optional
   ├─ ⚡️ 剪枝诊断 (Pruned Diagnosis):
   │  ├─ 利用 Reference Stack 推断已掌握节点 (跳过测试)
   │  └─ 仅对剩余 Critical 节点进行二分法 T/P 测试
   └─ 输出: 加权且诊断完毕的 Topology

阶段 3: 认知对齐规划 (Alignment Planning)
   ├─ cli-curriculum-architect 生成 Task List
   ├─ 核心算法:
   │  ├─ ZPD Pacing: 依据认知带宽计算任务颗粒度 (Step Size)
   │  ├─ Cognitive Bridging: 注入跨语言/跨领域类比说明
   │  └─ Failure Defense: 针对失败模式插入情绪调节任务
   └─ ⚠️ Gemini 审查逻辑流与价值观一致性

阶段 4: 宏观资源绑定 (Resource Binding)
   ├─ 锁定核心教材 (Macro Resource)
   ├─ 搜索辅助微资源 (Micro Resources)
   └─ 输出: 最终 plan.json
```

## 4. 数据结构定义 (JSON Schema)

### Profile.json (v5.0 核心)

```json
{
  "meta": { "session_id": "learn-rust-ultimate" },
  "dimensions": { /* 保持原有的阈值控制 */ },
  
  "data": {
    "goal_context": {
      "raw": "开发高并发IM系统",
      "domain": "Backend/Systems"
    },

    // [New] 既往技术栈 (认知锚点)
    "reference_stack": {
      "Java": "Expert", // 意味着 OOP、GC、内存模型已知
      "Go": "Novice"
    },

    // [New] 身份与价值观 (决定拓扑权重)
    "identity": {
      "archetype": "The Pragmatist", // 实用主义者：先跑通，再深究
      "value_system": ["Speed of Delivery", "Functionality over Theory"], 
      "cognitive_bandwidth": "Low" // 当前状态：疲惫/碎片时间 -> 需要小步快跑
    },

    // [Optimized] 动态加权拓扑
    "skill_topology": {
      "Memory Management": {
        "id": "Ownership",
        "score": { "T": 0.2, "P": 0.0 }, // 诊断得分
        "status": "Diagnosed_Low",
        
        // [New] 动态相关性: 原本是 Critical，但因为是实用派，被降级
        "dynamic_relevance": "Secondary", 
        "rationale": "As a Pragmatist, use smart pointers/clone first. Optimize later."
      },
      "Network IO": {
        "id": "Tokio",
        "dynamic_relevance": "Critical" // 实用派核心节点
      }
    },

    "constraints": {
      "time_fragmentation": "High" // 高碎片化 -> 影响任务类型
    },
    
    // [New] 心理防御
    "psychological": {
      "failure_mode": "Boredom", // 易无聊
      "defense_strategy": "High Frequency Quick Wins" // 对策
    },
    
    "macro_resources": []
  }
}
```

### Plan.json (v5.0 核心)

```json
{
  "strategy": "Pragmatic Delivery (Java Anchored)",
  "pacing_model": "Micro-Steps (Low Bandwidth Adapted)",
  "tasks": [
    {
      "id": "t-1",
      "title": "Define Interfaces (Traits)",
      "type": "Code_First",
      "estimated_minutes": 15, // 极短步长
      
      // [New] 认知桥接：这是 v5.0 的灵魂
      "cognitive_bridge": "Think of Traits like Java Interfaces. They define behavior. Unlike Java, you implement them separately from the struct (data).",
      
      "description": "Define a simple `Message` trait...",
      "resources": [
        {
          "title": "Rust for Java Developers - Chapter 4",
          "url": "...",
          "type": "Macro_Link"
        }
      ]
    }
  ]
}
```

## 5. 实现细节 (Implementation)

### 阶段 1: 价值观与锚点访谈

**核心逻辑**：通过提问确定用户的“成分”（成分决定立场，立场决定计划）。

```javascript
// Agent Prompt
const profilingPrompt = `
  目标: 构建用户的认知参照系与价值观。
  
  关键提问策略:
  1. **Reference Stack**: "你最擅长的编程语言是什么？达到了什么程度？"
  2. **Value System**: "对于这个目标，你更看重【深层原理的掌握】还是【快速产出可用成果】？"
  3. **Cognitive Bandwidth**: "你通常是在大块整段时间学习，还是在碎片时间（如通勤、午休）学习？"
  
  输出: 更新 profile.data.identity 和 profile.data.reference_stack
`
```

### 阶段 2: 拓扑动态重权 (Topology Re-weighting)

**核心逻辑**：算法根据 `value_system` 修改 `skill_topology` 的结构。

```javascript
function reweightTopology(topology, values) {
  if (values.includes("Functionality over Theory")) {
    // 实用主义策略
    topology.nodes.forEach(node => {
      if (node.tags.includes("Theoretical")) {
        node.dynamic_relevance = "Optional"; // 降级理论
      }
      if (node.tags.includes("Tooling")) {
        node.dynamic_relevance = "Critical"; // 升级工具
      }
    });
  } else if (values.includes("Deep Understanding")) {
    // 原理主义策略
    topology.nodes.forEach(node => {
      if (node.tags.includes("Theoretical")) {
        node.dynamic_relevance = "Blocker"; // 必须先学
      }
    });
  }
}
```

### 阶段 3: 认知对齐规划 (The Alignment Architect)

**核心逻辑**：这是生成 Task 的核心 Agent，它必须同时处理 **ZPD** 和 **Bridge**。

```javascript
Task(
  subagent_type="cli-curriculum-architect",
  prompt=`
  Input: Profile (Values, Reference Stack, Topology, Bandwidth).
  
  Generation Rules:
  
  1. **ZPD Pacing (Step Size)**:
     - If cognitive_bandwidth == "Low": 
       Generate ATOMIC tasks (Max 15 mins). Break complex topics into: Concept -> Syntax -> Demo.
     - If cognitive_bandwidth == "High": 
       Generate DEEP WORK tasks (Max 90 mins). Combine topics.
       
  2. **Cognitive Bridging**:
     - Check 'reference_stack'. 
     - IF user knows "Java":
       - When teaching "Ownership", explain it as "Garbage Collection happening at Compile Time".
       - When teaching "Structs", explain "No Inheritance, use Composition".
       
  3. **Value Alignment**:
     - Only generate tasks for nodes where dynamic_relevance >= "Secondary".
     - Skip "Optional" nodes unless blocked.
  `
)
```

### 阶段 4: 宏观资源绑定

**核心逻辑**：避免碎片化，优先锁定一本符合 `archetype` 的书。

```javascript
// 1. 依据原型搜索书
let query = `best rust book for ${profile.data.goal_context.domain}`;
if (profile.data.identity.archetype === "Pragmatist") query += " build projects";
if (profile.data.identity.archetype === "Theorist") query += " deep dive";

const macroResource = await search(query);

// 2. 将微资源挂载到宏观资源下
// ...
```