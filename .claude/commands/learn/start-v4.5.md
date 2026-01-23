# Workflow Learn Start Command (/learn:start) v4.5 (Purified)

## 1. 概览 (Overview)

本命令是智能学习工作流的**纯粹战略规划核心**。它聚焦于“目标”与“能力”的精准匹配，通过**智能层级诊断算法（Hierarchical Inference）**，在极短的交互轮次内完成对庞大技能树的精准定级，并生成一份**不设时间预设、但逻辑严密**的实战大纲。

**核心进化:**
- **智能层级诊断 (Smart Tree Pruning):** 解决“诊断疲劳”问题。利用技能拓扑的父子依赖关系，通过父节点表现自动推断子节点状态（Pass/Fail），将诊断题量减少 60% 以上。
- **数据结构闭环 (Topology-Centric Data):** 将诊断日志、资源、知行评分全部内聚于 `skill_topology` 节点内部，不再分散存储，保证画像的原子性和可移植性。
- **纯粹目标导向 (Pure Goal-Driven):** 移除所有时间/环境约束干扰，规划器只负责拆解“达成目标所需的最小路径”，确保大纲的专业性和完整性。

## 2. 用法 (Usage)

```bash
/learn:start [FLAGS] <LEARNING_GOAL>

# Flags
-q, --quick                跳过诊断阶段 (默认全部节点标记为 Unverified)
-l, --language <lang>      强制输出语言 (默认 zh-CN)
```

## 3. 执行流程 (Execution Process)

```
阶段 1: 目标逆向与拓扑构建 (Goal & Topology)
   ├─ Agent 解析 Learning Goal -> 提取 Goal Context
   ├─ 反向推导 -> 构建 Skill Topology (标记 Root / Critical 节点)
   └─ 输出: Profile (含未诊断的 Topology)

阶段 2: 智能层级诊断 (Hierarchical Inference Diagnosis)
   ├─ 算法: 优先遍历 Root 或 High-Level 节点
   ├─ 循环直到 Critical 路径清晰:
   │  ├─ 诊断父节点 -> 得分 T/P
   │  ├─ ⚡️ 推断逻辑 (Pruning):
   │  │  ├─ 父节点 < 0.3 -> 子节点自动标记 Inferred_Low (跳过)
   │  │  ├─ 父节点 > 0.8 -> 抽查 1 个子节点 -> 若通过 -> 全部标记 Inferred_High
   │  │  └─ 否则 -> 递归诊断子节点
   │  └─ 更新 Topology 节点状态
   └─ 输出: Profile (含精准评分的 Topology)

阶段 3: 逻辑化规划 (Logical Curriculum Architecture)
   ├─ 读取 Skill Topology (关注 Gaps)
   ├─ cli-curriculum-architect 生成 Task List:
   │  ├─ 策略: 仅基于前置依赖关系排序 (Dependency Sort)
   │  ├─ 内容: T低P低 -> 补基础; T高P低 -> 补实战;
   │  └─ 节奏: 依然保留多巴胺节奏 (Quick Wins)，但不考虑时间切片
   └─ Gemini 审查 (确保路径闭环)

阶段 4: 场景化资源注入 (Contextual Injection)
   ├─ 遍历 Tasks
   ├─ 构造 Query: 关键词 + Goal Context (确保资源服务于目标)
   ├─ 分级搜索 (Gold/Silver) -> 保持资源多样性
   └─ 输出: plan.json
```

## 4. 数据结构优化 (JSON Schema v4.5)

**优化点**：移除 `constraints` (时间/环境) 和 `psychological.failure_mode`。将 `diagnosis_log` 内聚到节点中。

### Profile.json

```json
{
  "meta": { "session_id": "learn-rust-cli-2024" },
  
  // 基础维度 (仅保留用于阈值控制的必要项)
  "dimensions": {
    "target_clarity": 0.95,
    "current_competency": 0.6, 
    "learning_style": 0.9,
    // constraints 已移除，不再作为规划因子
    "psychological": 0.9,
    "prerequisites": 0.9
  },
  
  "data": {
    "goal_context": {
      "raw": "使用 Rust 编写高并发文件加密 CLI",
      "domain": "Systems Programming",
      "tech_stack": ["Rust", "Tokio", "AES"]
    },

    // [核心] 技能拓扑树：内聚了所有状态
    "skill_topology": {
      "Rust Basics": {
        "relevance": "Root",
        "score": { "T": 0.2, "P": 0.0 }, // 当前实测分
        "status": "Diagnosed", // 状态: Diagnosed / Inferred_Low / Inferred_High / Unverified
        "diagnosis_trace": "Failed memory safety quiz.", // 内聚的诊断理由
        
        "children": {
          "Ownership": { 
            "score": { "T": 0.1, "P": 0.0 }, 
            "status": "Inferred_Low", // ⚡️ 智能推断：因父节点挂了，自动判负，未消耗 Token
            "relevance": "Critical"
          },
          "Syntax": {
            "score": { "T": 0.3, "P": 0.1 },
            "status": "Inferred_Low",
            "relevance": "Critical"
          }
        }
      }
    },
    
    // 教学模态 (保留，影响资源搜索风格)
    "pedagogy": {
      "modality": "Visual" 
    }
  }
}
```

### Plan.json

```json
{
  "strategy": "Goal Reverse Engineering",
  "tasks": [
    {
      "id": "t-1",
      "title": "Establish Rust Environment & Hello World",
      "type": "Milestone",
      "rationale": "Root dependency for all subsequent tasks.",
      "dependencies": [], // 明确的前置任务 ID
      "resources": [
        { "title": "Rust Official Book - Ch1", "url": "...", "score": 0.95 }
      ]
    }
  ]
}
```

## 5. 关键算法实现 (Implementation)

### 智能层级诊断算法 (The "Pruner")

这是 v4.5 的核心，解决“诊断太长”的问题。

```javascript
/**
 * 递归诊断函数
 * @param node 当前技能节点
 * @param context 目标上下文
 */
async function diagnoseTree(node, context) {
  // 1. 如果节点已被标记（推断过），直接返回
  if (node.status !== 'Unverified') return;

  // 2. 诊断当前节点 (Max 2-3 questions)
  const result = await runDiagnosticQuiz(node.name, context);
  node.score = result.score; // { T: float, P: float }
  node.diagnosis_trace = result.reason;
  node.status = 'Diagnosed';

  // 3. ⚡️ 推断逻辑 (Pruning Logic)
  
  // Case A: 基础极差 (T < 0.3)
  // 逻辑: 连基础都不懂，进阶肯定不懂。跳过子树。
  if (node.score.T < 0.3) {
    markSubtreeStatus(node.children, 'Inferred_Low', { T: 0.1, P: 0.0 });
    return; 
  }

  // Case B: 基础极好 (T > 0.9 & P > 0.8)
  // 逻辑: 基础扎实，抽查一个关键子节点验证。
  if (node.score.T > 0.9 && node.score.P > 0.8) {
    const sentinelKey = Object.keys(node.children).find(k => node.children[k].relevance === 'Critical');
    
    if (sentinelKey) {
      const sentinelNode = node.children[sentinelKey];
      await diagnoseTree(sentinelNode, context); // 递归诊断这个哨兵
      
      if (sentinelNode.score.T > 0.8) {
        // 哨兵也过了 -> 信任剩余子节点
        const remaining = getSiblings(node.children, sentinelKey);
        markSubtreeStatus(remaining, 'Inferred_High', { T: 0.8, P: 0.8 });
        return;
      }
    }
  }

  // Case C: 中间态 -> 必须老老实实诊断关键子节点
  for (const childKey of Object.keys(node.children)) {
    if (node.children[childKey].relevance === 'Critical') {
      await diagnoseTree(node.children[childKey], context);
    }
  }
}
```

### 纯粹规划逻辑 (The Pure Architect)

不再考虑用户有没有时间，只考虑“学会这玩意儿最科学的顺序”。

```javascript
Task(
  subagent_type="cli-curriculum-architect",
  prompt=`
  Input: 
    - Goal: ${profile.data.goal_context.raw}
    - Topology: ${JSON.stringify(profile.data.skill_topology)} (Focus on Gaps)
  
  Rules:
  1. **Dependency First**: Task B cannot appear before Task A if A is a prerequisite in the topology.
  2. **Gap Filling**: Only generate tasks for nodes with Score < 0.6.
  3. **Pacing**: Start with a "Quick Win" task (e.g., getting code to run) to establish momentum.
  4. **Output**: A strictly ordered list of atomic learning tasks. Do NOT group by days/weeks (leave that to scheduler).
  `
)
```

## 6. 优势总结

v4.5 在保留了 v4.0 的**目标导向性**和**多巴胺节奏**的同时，通过以下方式实现了极致优化：

1.  **极速画像**：利用**智能推断**，将诊断时间缩短了 60% 以上，解决了用户在 Start 阶段的耐心消耗问题。
2.  **职责纯净**：彻底剥离了排期（Schedule）和环境（Env）逻辑，产出的是一份**纯粹的、专业的、基于逻辑依赖的**教学大纲。
3.  **数据内聚**：所有的能力评估都挂载在 `skill_topology` 树上，这棵树成为了用户在该领域的**全息快照**，为后续的 Mentor 会话提供了最完美的数据输入。