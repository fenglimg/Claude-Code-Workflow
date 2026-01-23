# Workflow Learn Start Command (/learn:start) v4.0

## 1. 概览 (Overview)

本命令是智能学习工作流的**战略规划引擎**。v4.0 版本实现了从“课程导向”到**“目标逆向导向”**的范式转移。它首先解析用户的最终目标，反向构建最小可行**技能拓扑树 (Skill Topology)**，并通过**二分法**精准诊断图谱中的关键节点，最后结合**多巴胺节奏 (Dopamine Pacing)** 生成一份既科学又能维持心流体验（Flow State）的实战路径。

**核心特性 (v4.0):**
- **目标逆向工程 (Goal Reverse Engineering)：** 不再生成通用的“全栈大纲”，而是根据目标（如“写一个加密CLI”）反向推导**最小可行技能树**，剔除无关噪音（如 WebAssembly），确保路径最短。
- **技能拓扑图谱 (Skill Topology)：** 取代扁平的技能列表，构建具有层级和依赖关系的知识图谱，支持对子领域（如 `Rust::Async` vs `Rust::Syntax`）进行独立的 **T/P (知行)** 诊断。
- **多巴胺节奏规划 (Dopamine Pacing)：** 引入动机工程算法，根据用户的心理韧性，在计划中穿插“速赢任务 (Quick Wins)”与“硬核挑战 (Deep Dives)”，设计合理的情绪起伏曲线。
- **场景化资源注入：** 搜索时携带目标上下文（Context），确保找到的资源是服务于当前项目的（例如搜索“Rust for CLI”而非泛泛的“Rust 教程”）。

## 2. 用法 (Usage)

```bash
/learn:start [FLAGS] <LEARNING_GOAL>

# Flags
-q, --quick                跳过拓扑诊断阶段 (默认节点评分设为 T:0.5/P:0.5)
-l, --language <lang>      强制输出语言 (默认 zh-CN)
```

## 3. 执行流程 (Execution Process)

```
阶段 1: 目标逆向与拓扑构建 (Goal & Topology)
   ├─ Agent 解析 Learning Goal -> 提取目标上下文 (Goal Context)
   ├─ 反向推导 -> 构建 Skill Topology (标记 Critical/Optional 节点)
   ├─ 全息画像捕获 (维度检查) -> 确定认知模式与环境约束
   └─ 输出: Profile (含 Skill Topology 骨架)

阶段 2: 拓扑路径诊断 (Topology Profiling)
   ├─ 遍历 Topology 中标记为 Critical 的节点
   ├─ 针对每个节点生成 T/P 双维探针 (二分法):
   │  ├─ T-Probe: 原理/概念 (Theory)
   │  └─ P-Probe: 实战/Debug (Practice)
   ├─ 用户作答 -> 更新节点分数 { T: val, P: val }
   └─ 记录 diagnosis_log (具体错题快照)

阶段 3: 多巴胺节奏规划 (Dopamine Pacing)
   ├─ cli-curriculum-architect 读取 Topology & Psychology
   ├─ 算法排序:
   │  ├─ 依赖排序: 确保前置知识就绪
   │  └─ 情绪排序: High Frustration -> 插入 Quick Win 任务
   ├─ 生成任务流 (含 Energy Cost & Type)
   └─ ⚠️ Gemini 审查 (逻辑性与目标一致性检查)

阶段 4: 场景化资源注入 (Contextual Injection)
   ├─ 构造 Query: 关键词 + Goal Context.domain (场景限定)
   ├─ 模态过滤: 根据 pedagogy.modality (Visual/Text)
   ├─ 分级搜索 (Gold/Silver/Bronze)
   └─ 输出: plan.json
```

## 4. 数据结构定义 (JSON Schema)

### Profile.json (v4.0 核心)

```json
{
  "meta": { "session_id": "learn-rust-cli-2024" },
  
  // 1. 基础维度 (用于阈值控制)
  "dimensions": {
    "target_clarity": 0.95,
    "current_competency": 0.6,
    "learning_style": 0.9,
    "constraints": 0.9,
    "psychological": 0.9, // 挫折耐受度等
    "prerequisites": 0.9
  },
  
  "data": {
    // [New] 目标上下文：明确"为了什么而学"
    "goal_context": {
      "raw": "使用 Rust 编写一个高性能文件加密 CLI",
      "domain": "Systems Programming / Security",
      "project_type": "CLI Tool",
      "success_criteria": ["Arg Parsing", "File Stream", "AES Encryption"]
    },

    // [New] 技能拓扑树：取代扁平矩阵，支持层级
    "skill_topology": {
      "Rust": {
        "relevance": "Root",
        "score": { "T": 0.5, "P": 0.2 },
        "children": {
          "Ownership": { "score": { "T": 0.8, "P": 0.7 }, "relevance": "Critical" },
          "Async/Tokio": { "score": { "T": 0.1, "P": 0.0 }, "relevance": "Critical" },
          "WebAssembly": { "score": { "T": 0.0, "P": 0.0 }, "relevance": "Out-of-Scope" } // 噪音节点，规划时忽略
        }
      },
      "Cryptography": {
        "relevance": "Critical",
        "score": { "T": 0.2, "P": 0.0 }
      }
    },
    
    // 认知配置：决定任务颗粒度
    "cognitive": {
      "scaffolding_density": "High", // High=新手/焦虑 -> 任务切碎
      "feedback_preference": "Encouraging"
    },
    
    // 教学模态：决定资源类型
    "pedagogy": {
      "modality": "Visual", // Visual, Textual, Pragmatic
      "banned_sources": ["Academic Papers"]
    },

    // 成长日志：留存全生命周期评价
    "feedback_journal": [
      {
        "stage": "Diagnosis",
        "timestamp": "...",
        "content": "Rust Async 概念测试失败，建议增加 Event Loop 可视化演示。",
        "impact": "Marked 'Async/Tokio' as Focus Area."
      }
    ]
  }
}
```

### Plan.json (v4.0 核心)

```json
{
  "strategy": "Goal Reverse Engineering",
  "pacing_model": "Early Wins (High Dopamine Start)",
  "tasks": [
    {
      "id": "t-1",
      "title": "Quick Win: Hello World with Clap",
      "type": "Motivation_Booster", // 任务类型：用于建立信心
      "energy_cost": "Low",
      "rationale": "Immediate output to validate environment.",
      "resources": [...]
    },
    {
      "id": "t-2",
      "title": "Deep Dive: Rust Ownership",
      "type": "Core_Concept", // 任务类型：硬核知识
      "energy_cost": "High",
      "rationale": "Prerequisite for File I/O.",
      "resources": [...]
    }
  ]
}
```

## 5. 实现细节 (Implementation)

### 阶段 1: 目标逆向与拓扑构建

```javascript
// 核心：不直接问 Profile，先分析目标
const analysisTask = Task(
  subagent_type="cli-goal-analyst",
  prompt=`
  用户目标: "${learning_goal}"
  
  任务:
  1. 生成 goal_context (提取领域、项目类型)。
  2. 构建 skill_topology (技能树)。
  3. 标记节点相关性:
     - 必须掌握的标记为 "Critical"。
     - 目标不需要的标记为 "Out-of-Scope" (如做 CLI 不需要学 React)。
  `
)
// 更新 profile.data.goal_context 和 profile.data.skill_topology

// ... 随后执行常规的维度检查 (dimensions check) ...
```

### 阶段 2: 拓扑路径诊断 (Node-based Diagnosis)

```javascript
if (!flags.includes('--quick')) {
  // 仅遍历 Critical 节点
  const criticalNodes = getCriticalNodes(profile.data.skill_topology);
  
  for (const node of criticalNodes) {
    // 对每个节点进行 T/P 二分诊断 (逻辑同 v3.0，但作用于具体节点)
    const current = node.score;
    
    const quiz = GenerateQuiz({
      topic: node.name,
      context: profile.data.goal_context.domain, // 题目结合场景
      theory_level: current.T,
      practice_level: current.P
    });
    
    const results = AskUserQuestion(quiz);
    
    // 更新拓扑树中的节点分数
    node.score = CalculateTPScore(results);
    
    // 记录日志
    profile.data.feedback_journal.push({
      stage: "Diagnosis",
      content: `Node ${node.name} updated to T:${node.score.T}/P:${node.score.P}`
    });
  }
}
```

### 阶段 3: 多巴胺节奏规划 (Dopamine Architect)

**核心逻辑**：不仅考虑依赖关系，还考虑情绪曲线。

```javascript
Task(
  subagent_type="cli-curriculum-architect",
  prompt=`
  输入: Skill Topology (Gap Analysis) + Cognitive Profile.
  
  算法要求 (Dopamine Pacing):
  1. **Start Strong**: 前 2 个任务必须是 "Quick Wins" (低难度、高可见产出)。
  2. **Interleave**: 在每个 "High Energy" (高难度/理论) 任务后，插入一个 "Integration" (实战应用) 任务。
  3. **Scaffolding**: 若 cognitive.scaffolding_density="High"，将大任务拆解为 <20min 的微步骤。
  4. **Goal Aligned**: 所有实战任务必须直接贡献于 "${profile.data.goal_context.raw}"。
  
  输出: 带有 energy_cost 和 type 标签的任务列表。
  `
)
```

### 阶段 4: 场景化资源注入

```javascript
const domain = profile.data.goal_context.domain; // e.g., "Systems Programming"
const modality = profile.data.pedagogy.modality;

plan.tasks = await Promise.all(plan.tasks.map(async (task) => {
  // 1. 构造带场景的 Query
  // 例子: "Rust error handling" -> "Rust error handling for CLI tools best practices"
  let query = `${task.keywords} for ${profile.data.goal_context.project_type}`;
  
  // 2. 模态过滤
  if (modality === "Visual") query += " site:youtube.com OR site:egghead.io";
  
  // 3. 分级搜索 (Gold/Silver/Bronze)
  const resources = await tieredSearch(query, task.keywords);
  
  return { ...task, resources };
}))
```

## 6. 交付物

1.  **`profile.json`**: 包含完整的**技能拓扑树**和**目标上下文**，不仅记录用户会什么，还记录用户要做什么，以及为了做这件事需要补什么。
2.  **`plan.json`**: 一份经过**情绪设计**的实战行动指南，而非枯燥的知识点列表。