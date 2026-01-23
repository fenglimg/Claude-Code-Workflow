<thinking>
Thinking Process:

1.  **Analyze the User's Feedback:**
    *   **Feedback 1 (Reject Tone):** The user explicitly rejects "Tone/Voice Customization" (Pain Point A). They feel it's unnecessary for now.
    *   **Feedback 2 (Accept Meta-Skills):** The user agrees that "Meta-Skill Blindness" (Pain Point B) is a valid issue and should be addressed.
    *   **Feedback 3 (Resolve Negotiation):** The user points out that "Negotiation" (Pain Point C) is already solved by the existing interaction model (Phase 3 AskUserQuestion allows free text input). We just need to define the *Agent Logic* to handle that feedback properly.
    *   **Goal:** Provide the complete **v5.2** documentation based on v5.1 but incorporating the "Meta-Skill" optimization and refining the "Interactive Negotiation" logic description.

2.  **Refining v5.2 Scope:**
    *   *Keep:* v5.1 core (Clean Architecture, Cognitive Transfer, ZPD Pacing, Value-Driven Topology).
    *   *Add:* **Meta-Skill Assessment & Survival Tasks**.
    *   *Refine:* **Phase 3/4 Interaction Logic** (Explicitly define how the Agent handles user modification requests).
    *   *Remove:* Tone/Gamification logic.

3.  **Designing "Meta-Skills":**
    *   *What are they?* Debugging, Search, English Reading, Environment Config capabilities.
    *   *Where do they go?* `persistent_traits.meta_skills`.
    *   *How are they populated?* During Phase 1, ask one specific question like: "How comfortable are you with reading compiler error logs?" or infer from the Reference Stack (Expert Java -> Likely High Debugging).
    *   *How are they used?* Phase 3 Architect injects "Survival Tasks" (e.g., "How to read docs", "How to use debugger") *before* difficult content.

4.  **Designing "Negotiation Logic":**
    *   Instead of just "Approve/Reject", the Phase 3 loop needs to explicitly mention:
        *   User Input: "I don't want to learn Clap, I want structopt."
        *   Agent Action: Re-run Architect with new constraint.

5.  **Drafting the Document:**

    *   *Overview:* Update to mention "Meta-Capability Awareness".
    *   *Data Schema:* Add `meta_skills` object.
    *   *Execution Process:*
        *   Phase 1: Add Meta-Skill Audit.
        *   Phase 3: Add "Survival Task Injection".
        *   Phase 3 (Review): Clarify the "Feedback Loop" logic.

6.  **Final Polish:**
    *   Ensure the structure is clean and professional.
    *   Preserve the v5.1 advantages (Linkage, Persistence).

**(Self-Correction during drafting):**
User said "complete v5.2". I will output the full markdown.
I will integrate the "Meta-Skill" logic into the "Knowledge Snapshot" or "Persistent Traits"? It belongs in `persistent_traits` because debugging skill transfers across languages.

Let's write it.
</thinking>

非常精准的取舍。去除“语调定制”这种锦上添花的功能，聚焦于“元能力”这种决定生死的补短板功能，确实更符合高效学习的本质。同时，利用现有的交互机制明确“谈判逻辑”，也是最经济的实现方式。

以下是集大成后的 **Workflow Learn Start Command (/learn:start) v5.2 (Ultimate Stable)**。

它在 v5.1 的基础上，**补全了对“学习能力本身”的诊断（元能力），并标准化了“人机协商”的交互逻辑**。

---

# Workflow Learn Start Command (/learn:start) v5.2 (Ultimate Stable)

## 1. 概览 (Overview)

本命令是智能学习工作流的**战略架构引擎**。它在单会话内实现了极致的**认知对齐**与**能力互补**。

v5.2 版本在 v5.1 的基础上，增加了对用户**元能力 (Meta-Skills)** 的诊断（如排错能力、文档阅读能力），并在规划中自动注入**“生存技能任务”**。它不再假设用户只要有了知识点就能学会，而是确保用户具备“学会该知识点所需的工具能力”。

**核心特性:**
- **全息画像继承:** 支持从全局库加载持久化特征，避免重复提问。
- **价值观动态拓扑:** 依据用户价值观（如实用主义）动态重构技能树权重。
- **认知迁移规划:** 利用既往技术栈生成“认知桥接”，拒绝冗余教学。
- **元能力补强 (New):** 识别用户的**排错/搜索/阅读**短板，前置插入“生存指南”类任务，防止因工具能力不足导致的“从入门到放弃”。
- **标准化协商 (Refined):** 定义明确的 Plan 反馈修改回路，支持用户对大纲进行微调。

## 2. 用法 (Usage)

```bash
/learn:start [FLAGS] <LEARNING_GOAL>

# Flags
-q, --quick                跳过详细诊断，基于参照系推断
-l, --language <lang>      强制输出语言 (默认 zh-CN)
```

## 3. 数据结构定义 (JSON Schema)

### Profile.json (v5.2 核心)

```json
{
  "meta": {
    "session_id": "learn-rust-cli-001",
    "version": "v5.2",
    "created_at": "2024-05-20T10:00:00Z"
  },
  
  // 1. 持久化特征 (长期资产)
  "persistent_traits": {
    "reference_stack": { "Java": "Expert", "Linux": "Intermediate" },
    "identity": {
      "archetype": "The Pragmatist",
      "value_system": ["Speed of Delivery", "Functionality First"], 
      "cognitive_bandwidth": "Medium" 
    },
    // [New] 元能力：决定是否需要插入“生存教学”
    "meta_skills": {
      "debugging_confidence": "Low",  // 查错能力弱 -> 需插入 Debug 教学
      "search_efficiency": "High",    // 搜索能力强
      "docs_reading": "Medium"        // 文档阅读能力
    },
    "failure_patterns": ["Tutorial Hell"]
  },

  // 2. 会话上下文 (临时状态)
  "session_context": {
    "goal": {
      "raw": "写一个高性能文件加密工具",
      "domain": "Systems Programming"
    },
    "constraints": {
      "time_fragmentation": "High"
    },
    "psychological": {
      "current_motivation": 0.9
    }
  },

  // 3. 知识快照 (图谱状态)
  "knowledge_snapshot": {
    "skill_topology": {
      "Ownership": {
        "status": "Diagnosed_Low",
        "dynamic_relevance": "Secondary", 
        "rationale": "Pragmatist approach: Clone first."
      },
      "Clap Crate": {
        "status": "Inferred_Ready",
        "dynamic_relevance": "Critical",
        "rationale": "Mapped from Java experience."
      }
    }
  },

  "feedback_journal": []
}
```

## 4. 执行流程 (Execution Process)

```
阶段 1: 全息认知盘点 (Cognitive Audit)
   ├─ 初始化结构
   ├─ Agent 交互提问 (填充 persistent_traits / session_context):
   │  ├─ 挖掘技术栈与价值观
   │  └─ [New] 探测元能力: "遇到看不懂的报错通常怎么处理？"
   └─ 输出: Profile

阶段 2: 价值观驱动的拓扑重构 (Topology Refactoring)
   ├─ 构建基础 Skill Topology
   ├─ 应用 Value System 调整权重 (Critical/Secondary)
   ├─ 剪枝与推断 (Reference Stack)
   └─ 输出: knowledge_snapshot

阶段 3: 增强型规划生成 (Enhanced Planning)
   ├─ 计算 Cognitive Bandwidth (步长规划)
   ├─ 生成 Task List:
   │  ├─ 注入 Cognitive Bridges (认知桥梁)
   │  └─ [New] 注入 Survival Tasks: 若 debugging==Low, 插入 "Setup Debugger"
   └─ Gemini 审查逻辑流

阶段 4: 交互式协商 (Interactive Negotiation)
   ├─ 展示生成的 Plan 大纲
   ├─ AskUserQuestion: "批准" / "修改"
   │  └─ 若选择 "修改": 用户输入 "不想学 A, 想学 B"
   │  └─ Agent: 读取反馈 -> 调整 Topology 约束 -> 回滚至阶段 3 重生成
   └─ 批准 -> 进入阶段 5

阶段 5: 资源注入与交付
   ├─ 依据 Archetype 筛选资源
   └─ 输出: Final Plan & Updated Profile
```

## 5. 产出物示例 (Plan.json v5.2)

```json
{
  "strategy": "Cognitive Transfer & Survival First",
  "pacing": "Micro-Steps",
  "meta": {
    "knowledge_base_namespace": "rust/cli-dev"
  },
  "tasks": [
    {
      "id": "t-0",
      "title": "Survival Kit: Reading Rustc Errors",
      "type": "Meta_Skill", // [New] 元能力任务
      "estimated_minutes": 20,
      "rationale": "Detected low debugging confidence. This prevents frustration later.",
      "resources": [{ "title": "Understanding Rust Errors", "url": "..." }]
    },
    {
      "id": "t-1",
      "title": "Define Arguments (Clap)",
      "type": "Code_First",
      "estimated_minutes": 15,
      "cognitive_bridge": "Think of Clap as a declarative version of Java's 'commons-cli'.",
      "rationale": "Critical for 'Functionality First' value system.",
      "checkpoint": {
        "verify_question": "Does it print help text?",
        "action_on_fail": "Check macro attributes."
      }
    }
  ]
}
```

## 6. 实现细节：协商逻辑 (Negotiation Logic)

这是解决用户“自定义需求”的最后一道防线。

```javascript
// 阶段 4 伪代码
while (!planApproved) {
  // 1. 展示当前计划
  displayPlan(currentPlan);
  
  // 2. 获取反馈
  const feedback = await AskUserQuestion({
    type: "text",
    question: "计划是否符合预期？输入 'ok' 批准，或输入具体修改意见（如 '跳过测试章节'）。"
  });

  if (feedback === 'ok') {
    planApproved = true;
  } else {
    // 3. 动态调整 (The Negotiation)
    console.log("正在根据反馈调整规划...");
    
    // 调用 Architect Agent 进行局部重构
    // Prompt: "User Feedback: ${feedback}. Adjust the Topology/Constraint and regenerate the task list."
    currentPlan = await ArchitectAgent.regenerate(profile, feedback);
  }
}
```

## 7. 总结

v5.2 版本在单会话的维度上达到了真正的**“极致”**。

1.  **它补齐了短板**：通过 `meta_skills`，它照顾到了那些“有心无力”的学习者，提供了生存工具。
2.  **它尊重了意愿**：通过标准化的**协商回路**，它承认了 AI 的局限性，把最终决定权交还给用户。
3.  **它保持了纯粹**：没有引入冗余的执行层功能，依然是一个纯粹、高效的战略规划引擎。

这就是 Workflow Learn Start Command 的最终形态。